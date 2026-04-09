import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setOptionStatus, batchSetStatus } from '../../src/services/progress.js';
import { sseBroker } from '../../src/sse/broker.js';
import { OPTIONS_105, VERSES_105 } from '../helpers/mock-prisma.js';

vi.mock('../../src/sse/broker.js', () => ({
  sseBroker: { broadcast: vi.fn() },
}));

function buildLocation105() {
  return {
    id: 5,
    campaign_id: 1,
    display_number: 105,
    name: 'Вагенбург',
    verses: VERSES_105.map((v) => ({
      ...v,
      options: OPTIONS_105.filter((o) => o.verse_id === v.id).map((o) => ({
        ...o,
        progress: null,
      })),
    })),
  };
}

function buildMockPrisma() {
  const upserted: Array<{ optionId: number; status: string }> = [];
  const deleted: number[] = [];

  return {
    prisma: {
      progress: {
        upsert: vi.fn().mockImplementation(({ create }: any) => {
          upserted.push({ optionId: create.option_id, status: create.status });
          return Promise.resolve({
            id: upserted.length,
            option_id: create.option_id,
            status: create.status,
            visited_at: new Date(),
            visited_by: create.visited_by,
          });
        }),
        deleteMany: vi.fn().mockImplementation(({ where }: any) => {
          deleted.push(where.option_id);
          return Promise.resolve({ count: 1 });
        }),
      },
      locations: {
        findUnique: vi.fn().mockImplementation(({ where }: any) => {
          const dn = where?.campaign_id_display_number?.display_number;
          if (dn === 105) return Promise.resolve(buildLocation105());
          return Promise.resolve(null);
        }),
      },
      options: {
        findMany: vi.fn().mockImplementation(({ where }: any) => {
          const ids: number[] = where.id.in;
          return Promise.resolve(
            ids.map((id) => {
              const opt = OPTIONS_105.find((o) => o.id === id);
              const verse = VERSES_105.find((v) => v.id === opt?.verse_id);
              return {
                id,
                verse: {
                  display_number: verse?.display_number ?? 0,
                  location: { display_number: 105 },
                },
              };
            }),
          );
        }),
        findUniqueOrThrow: vi.fn().mockImplementation(({ where }: any) => {
          const opt = OPTIONS_105.find((o) => o.id === where.id);
          if (!opt) throw Object.assign(new Error('Not found'), { code: 'P2025' });
          const verse = VERSES_105.find((v) => v.id === opt.verse_id);
          return Promise.resolve({
            ...opt,
            verse: {
              ...verse,
              location: { display_number: 105, campaign_id: 1 },
            },
          });
        }),
      },
      $transaction: vi.fn().mockImplementation((fn: any) => fn({
        progress: {
          upsert: vi.fn().mockImplementation(({ create }: any) => {
            upserted.push({ optionId: create.option_id, status: create.status });
            return Promise.resolve({
              id: upserted.length,
              option_id: create.option_id,
              status: create.status,
              visited_at: new Date(),
              visited_by: create.visited_by,
            });
          }),
          deleteMany: vi.fn().mockImplementation(({ where }: any) => {
            deleted.push(where.option_id);
            return Promise.resolve({ count: 1 });
          }),
        },
      })),
    } as any,
    upserted,
    deleted,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('setOptionStatus', () => {
  // Layout локации 105: opt 108 (#0 → #1), opt 110 (#0 → #2),
  // opt 120 (#1 → end), opt 130 (#2 → end).
  // Поэтому потомки opt 108 = {120}, opt 110 = {130}, opt 120/130 = ∅.

  it('cascades visited to all downstream options', async () => {
    const { prisma, upserted } = buildMockPrisma();
    await setOptionStatus(prisma, 108, 'visited', BigInt(123));

    expect(upserted).toEqual([
      { optionId: 108, status: 'visited' },
      { optionId: 120, status: 'visited' },
    ]);
  });

  it('cascades closed to all downstream options', async () => {
    const { prisma, upserted } = buildMockPrisma();
    await setOptionStatus(prisma, 108, 'closed', BigInt(123));

    expect(upserted).toEqual([
      { optionId: 108, status: 'closed' },
      { optionId: 120, status: 'closed' },
    ]);
  });

  it('does NOT cascade requirements_not_met (per-option only)', async () => {
    const { prisma, upserted } = buildMockPrisma();
    await setOptionStatus(prisma, 108, 'requirements_not_met', BigInt(123));

    expect(upserted).toEqual([{ optionId: 108, status: 'requirements_not_met' }]);
  });

  it('cascades available (delete progress) to all downstream options', async () => {
    const { prisma, upserted, deleted } = buildMockPrisma();
    await setOptionStatus(prisma, 108, 'available', BigInt(123));

    expect(upserted).toHaveLength(0);
    expect(deleted).toEqual([108, 120]);
  });

  it('cascade with no downstream options updates only the source option', async () => {
    const { prisma, upserted } = buildMockPrisma();
    // opt 120 находится в #1 и ведёт сразу в end → потомков нет
    await setOptionStatus(prisma, 120, 'visited', BigInt(123));

    expect(upserted).toEqual([{ optionId: 120, status: 'visited' }]);
  });

  it('cascades from another verse-0 sibling (opt 110 → #2)', async () => {
    const { prisma, upserted } = buildMockPrisma();
    await setOptionStatus(prisma, 110, 'visited', BigInt(123));

    expect(upserted).toEqual([
      { optionId: 110, status: 'visited' },
      { optionId: 130, status: 'visited' },
    ]);
  });

  it('broadcasts a single SSE event per location for visited cascade', async () => {
    const { prisma } = buildMockPrisma();
    await setOptionStatus(prisma, 108, 'closed', BigInt(123));

    // batchSetStatus dedupes broadcasts by location → одна локация = один broadcast
    expect(sseBroker.broadcast).toHaveBeenCalledTimes(1);
    expect(sseBroker.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'status_changed',
        status: 'closed',
        locationDn: 105,
        by: '123',
      }),
    );
  });

  it('broadcasts a single SSE event for available cascade', async () => {
    const { prisma } = buildMockPrisma();
    await setOptionStatus(prisma, 108, 'available', BigInt(123));

    expect(sseBroker.broadcast).toHaveBeenCalledTimes(1);
    expect(sseBroker.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'status_changed',
        status: 'available',
        locationDn: 105,
      }),
    );
  });

  it('broadcasts SSE for requirements_not_met without cascade', async () => {
    const { prisma } = buildMockPrisma();
    await setOptionStatus(prisma, 108, 'requirements_not_met', BigInt(123));

    expect(sseBroker.broadcast).toHaveBeenCalledTimes(1);
    expect(sseBroker.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'status_changed',
        optionId: 108,
        status: 'requirements_not_met',
        locationDn: 105,
      }),
    );
  });
});

describe('batchSetStatus', () => {
  it('creates progress entries for all optionIds', async () => {
    const { prisma, upserted } = buildMockPrisma();
    await batchSetStatus(prisma, [108, 110, 120], 'visited', BigInt(123));

    expect(upserted.map((u) => u.optionId)).toEqual([108, 110, 120]);
    expect(upserted.every((u) => u.status === 'visited')).toBe(true);
  });

  it('deletes all progress entries when status=available', async () => {
    const { prisma, deleted } = buildMockPrisma();
    await batchSetStatus(prisma, [108, 110], 'available', BigInt(123));

    expect(deleted).toEqual([108, 110]);
  });

  it('broadcasts one SSE event per unique location', async () => {
    const { prisma } = buildMockPrisma();
    await batchSetStatus(prisma, [108, 120], 'visited', BigInt(123));

    // Both options belong to location 105 — only one broadcast expected
    expect(sseBroker.broadcast).toHaveBeenCalledTimes(1);
    expect(sseBroker.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'status_changed',
        status: 'visited',
        locationDn: 105,
      }),
    );
  });
});
