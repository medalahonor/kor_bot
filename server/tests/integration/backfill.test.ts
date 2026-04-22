import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runBackfill } from '../../src/services/backfillNotePaths.js';
import {
  LOCATIONS,
  VERSES_105,
  OPTIONS_105,
} from '../helpers/mock-prisma.js';

interface MockNoteRow {
  id: number;
  campaign_id: number;
  path: any;
}

function buildMockPrisma(noteRows: MockNoteRow[]) {
  const notes = noteRows.map((n) => ({ ...n }));
  const updates: Array<{ id: number; path: any }> = [];
  const deletes: number[] = [];

  return {
    prisma: {
      notes: {
        findMany: vi.fn().mockResolvedValue(notes),
        update: vi.fn().mockImplementation(({ where, data }: any) => {
          updates.push({ id: where.id, path: data.path });
          const idx = notes.findIndex((n) => n.id === where.id);
          if (idx >= 0) notes[idx].path = data.path;
          return Promise.resolve({});
        }),
        delete: vi.fn().mockImplementation(({ where }: any) => {
          deletes.push(where.id);
          return Promise.resolve({});
        }),
      },
      locations: {
        findMany: vi.fn().mockImplementation(({ where }: any) => {
          const dns: number[] = where?.display_number?.in ?? [];
          const locs = LOCATIONS.filter(
            (l) => l.campaign_id === where.campaign_id && dns.includes(l.display_number),
          );
          return Promise.resolve(
            locs.map((loc) => {
              if (loc.display_number === 105) {
                return {
                  ...loc,
                  verses: VERSES_105.map((v) => ({
                    ...v,
                    options: OPTIONS_105
                      .filter((o) => o.verse_id === v.id)
                      .map((o) => ({ ...o, progress: null })),
                  })),
                };
              }
              return { ...loc, verses: [] };
            }),
          );
        }),
      },
    } as any,
    state: { updates, deletes, notes },
  };
}

describe('runBackfill', () => {
  let logged: string[];

  beforeEach(() => {
    logged = [];
  });

  it('skips notes already containing optionId on non-target steps', async () => {
    const { prisma, state } = buildMockPrisma([
      {
        id: 1,
        campaign_id: 1,
        path: [
          { locationDn: 105, verseDn: 0, optionId: 108 },
          { locationDn: 105, verseDn: 1 },
        ],
      },
    ]);

    const result = await runBackfill(prisma, { logger: (m) => logged.push(m) });

    expect(result).toMatchObject({
      scanned: 1,
      alreadyBackfilled: 1,
      updated: 0,
      deleted: 0,
    });
    expect(state.updates).toHaveLength(0);
    expect(state.deletes).toHaveLength(0);
  });

  it('skips notes with single-step path (target only)', async () => {
    const { prisma, state } = buildMockPrisma([
      { id: 1, campaign_id: 1, path: [{ locationDn: 105, verseDn: 1 }] },
    ]);

    const result = await runBackfill(prisma, { logger: (m) => logged.push(m) });

    expect(result.alreadyBackfilled).toBe(1);
    expect(state.updates).toHaveLength(0);
  });

  it('backfills optionId on multi-step path lacking it', async () => {
    const { prisma, state } = buildMockPrisma([
      {
        id: 5,
        campaign_id: 1,
        path: [
          { locationDn: 105, verseDn: 0 },
          { locationDn: 105, verseDn: 1 },
        ],
      },
    ]);

    const result = await runBackfill(prisma, { logger: (m) => logged.push(m) });

    expect(result.updated).toBe(1);
    expect(result.deleted).toBe(0);
    expect(state.updates).toEqual([
      {
        id: 5,
        path: [
          { locationDn: 105, verseDn: 0, optionId: 108 },
          { locationDn: 105, verseDn: 1 },
        ],
      },
    ]);
    expect(result.backup).toEqual([
      {
        note_id: 5,
        campaign_id: 1,
        old_path: [
          { locationDn: 105, verseDn: 0 },
          { locationDn: 105, verseDn: 1 },
        ],
      },
    ]);
  });

  it('deletes note when path step is unresolvable', async () => {
    const { prisma, state } = buildMockPrisma([
      {
        id: 7,
        campaign_id: 1,
        path: [
          { locationDn: 105, verseDn: 0 },
          { locationDn: 105, verseDn: 99 },
        ],
      },
    ]);

    const result = await runBackfill(prisma, { logger: (m) => logged.push(m) });

    expect(result.deleted).toBe(1);
    expect(result.deletedNoteIds).toEqual([7]);
    expect(state.deletes).toEqual([7]);
    expect(state.updates).toHaveLength(0);
  });

  it('dry-run does not call update or delete on prisma', async () => {
    const { prisma, state } = buildMockPrisma([
      {
        id: 5,
        campaign_id: 1,
        path: [
          { locationDn: 105, verseDn: 0 },
          { locationDn: 105, verseDn: 1 },
        ],
      },
      {
        id: 7,
        campaign_id: 1,
        path: [
          { locationDn: 105, verseDn: 0 },
          { locationDn: 105, verseDn: 99 },
        ],
      },
    ]);

    const result = await runBackfill(prisma, {
      dryRun: true,
      logger: (m) => logged.push(m),
    });

    expect(result.updated).toBe(1);
    expect(result.deleted).toBe(1);
    expect(state.updates).toHaveLength(0);
    expect(state.deletes).toHaveLength(0);
  });

  it('skips notes without path (path === null)', async () => {
    const { prisma, state } = buildMockPrisma([
      { id: 9, campaign_id: 1, path: null },
    ]);

    const result = await runBackfill(prisma, { logger: (m) => logged.push(m) });

    expect(result.scanned).toBe(0);
    expect(state.updates).toHaveLength(0);
  });
});
