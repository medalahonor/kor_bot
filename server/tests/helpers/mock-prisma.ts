import { vi } from 'vitest';

/**
 * Mock data matching the DB schema after importing display_ru.json (campaign 26 subset).
 * Mimics location 105 (Вагенбург) with 3 verses for testing.
 */

export const CAMPAIGN = { id: 1, source_id: 26, name: 'Короли краха' };

export const LOCATIONS = [
  { id: 5, campaign_id: 1, display_number: 105, name: 'Вагенбург' },
  { id: 1, campaign_id: 1, display_number: 101, name: 'Запустелые земли' },
  { id: 10, campaign_id: 1, display_number: 999, name: 'Книга секретов' },
  { id: 11, campaign_id: 1, display_number: 1001, name: 'Книга секретов' },
  { id: 20, campaign_id: 1, display_number: 1201, name: 'Часть 1. Элган' },
];

export const VERSES_105 = [
  { id: 49, location_id: 5, display_number: 0 },
  { id: 50, location_id: 5, display_number: 1 },
  { id: 51, location_id: 5, display_number: 2 },
];

export const OPTIONS_105 = [
  // verse 0: two options
  {
    id: 108, verse_id: 49, position: 0, type: 'condition',
    text: 'Если у вас нет части 1 достижения.',
    target_type: 'verse', target_verse_dn: 1, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  {
    id: 110, verse_id: 49, position: 1, type: 'choice',
    text: 'Попытаться найти путь.',
    target_type: 'verse', target_verse_dn: 2, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  // verse 1: one option → end
  {
    id: 120, verse_id: 50, position: 0, type: 'choice',
    text: 'Уйти.',
    target_type: 'end', target_verse_dn: null, target_location_dn: null,
    requirement: null, result: 'Исследование окончено.', hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  // verse 2: one option → end
  {
    id: 130, verse_id: 51, position: 0, type: 'choice',
    text: 'Обыскать.',
    target_type: 'end', target_verse_dn: null, target_location_dn: null,
    requirement: 'Сила >= 3', result: 'Найден предмет.', hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
];

// KS location 999: verse 0 (empty), verse 42 (chain), verse 43, verse 44
export const VERSES_999 = [
  { id: 100, location_id: 10, display_number: 0 },
  { id: 101, location_id: 10, display_number: 42 },
  { id: 102, location_id: 10, display_number: 43 },
  { id: 103, location_id: 10, display_number: 44 },
  { id: 104, location_id: 10, display_number: 50 },
  { id: 105, location_id: 10, display_number: 51 },
];

export const OPTIONS_999 = [
  // verse 0: empty (no options)
  // verse 42: one option → verse 43
  {
    id: 201, verse_id: 101, position: 0, type: 'choice',
    text: 'Войти в проход.',
    target_type: 'verse', target_verse_dn: 43, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  // verse 43: two options → end, → verse 44
  {
    id: 202, verse_id: 102, position: 0, type: 'choice',
    text: 'Быстрый выход.',
    target_type: 'end', target_verse_dn: null, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  {
    id: 203, verse_id: 102, position: 1, type: 'choice',
    text: 'Идти глубже.',
    target_type: 'verse', target_verse_dn: 44, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  // verse 44: one option → end
  {
    id: 204, verse_id: 103, position: 0, type: 'choice',
    text: 'Финальный конец.',
    target_type: 'end', target_verse_dn: null, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  // verse 50: one option → verse 51
  {
    id: 205, verse_id: 104, position: 0, type: 'choice',
    text: 'Войти в цикл.',
    target_type: 'verse', target_verse_dn: 51, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  // verse 51: option → end, option → verse 50 (creates cycle)
  {
    id: 206, verse_id: 105, position: 0, type: 'choice',
    text: 'Выйти из цикла.',
    target_type: 'end', target_verse_dn: null, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  {
    id: 207, verse_id: 105, position: 1, type: 'choice',
    text: 'Вернуться.',
    target_type: 'verse', target_verse_dn: 50, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
];

// KS location 1001: verse 601 (standalone with end)
export const VERSES_1001 = [
  { id: 110, location_id: 11, display_number: 601 },
];

export const OPTIONS_1001 = [
  {
    id: 301, verse_id: 110, position: 0, type: 'choice',
    text: 'Прочитать запись.',
    target_type: 'end', target_verse_dn: null, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
];

// EK location 1201: verse 0 (empty), verse 5 (standalone), verse 12 (chain)
export const VERSES_1201 = [
  { id: 200, location_id: 20, display_number: 0 },
  { id: 201, location_id: 20, display_number: 5 },
  { id: 202, location_id: 20, display_number: 12 },
];

export const OPTIONS_1201 = [
  // verse 0: empty (no options)
  // verse 5: one option → end
  {
    id: 401, verse_id: 201, position: 0, type: 'choice',
    text: 'Прочитать запись Элгана.',
    target_type: 'end', target_verse_dn: null, target_location_dn: null,
    requirement: null, result: 'Задание обновлено.', hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  // verse 12: two options → verse 5, → end
  {
    id: 402, verse_id: 202, position: 0, type: 'choice',
    text: 'Следовать за Элганом.',
    target_type: 'verse', target_verse_dn: 5, target_location_dn: null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
  {
    id: 403, verse_id: 202, position: 1, type: 'choice',
    text: 'Отказаться.',
    target_type: 'end', target_verse_dn: null, target_location_dn: null,
    requirement: null, result: 'Задание провалено.', hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
  },
];

/**
 * @param optionStatuses - Record<optionId, status> e.g. {108: 'visited', 110: 'closed'}
 */
function buildLocationWithVerses(optionStatuses: Record<number, string> = {}) {
  return {
    id: 5,
    campaign_id: 1,
    display_number: 105,
    name: 'Вагенбург',
    verses: VERSES_105.map((v) => ({
      ...v,
      location: { display_number: 105 },
      options: OPTIONS_105
        .filter((o) => o.verse_id === v.id)
        .map((o) => ({
          ...o,
          progress: optionStatuses[o.id]
            ? { id: 1, option_id: o.id, status: optionStatuses[o.id], visited_at: new Date(), visited_by: BigInt(123) }
            : null,
        })),
    })),
  };
}

function buildKsLocation(
  locDn: number,
  verses: typeof VERSES_999,
  options: typeof OPTIONS_999,
  optionStatuses: Record<number, string>,
) {
  const loc = LOCATIONS.find((l) => l.display_number === locDn)!;
  return {
    ...loc,
    verses: verses.map((v) => ({
      ...v,
      location: { display_number: locDn },
      options: options
        .filter((o) => o.verse_id === v.id)
        .map((o) => ({
          ...o,
          progress: optionStatuses[o.id]
            ? { id: 1, option_id: o.id, status: optionStatuses[o.id], visited_at: new Date(), visited_by: BigInt(123) }
            : null,
        })),
    })),
  };
}

function buildEkLocation(
  locDn: number,
  verses: typeof VERSES_1201,
  options: typeof OPTIONS_1201,
  optionStatuses: Record<number, string>,
) {
  const loc = LOCATIONS.find((l) => l.display_number === locDn)!;
  return {
    ...loc,
    verses: verses.map((v) => ({
      ...v,
      location: { display_number: locDn },
      options: options
        .filter((o) => o.verse_id === v.id)
        .map((o) => ({
          ...o,
          progress: optionStatuses[o.id]
            ? { id: 1, option_id: o.id, status: optionStatuses[o.id], visited_at: new Date(), visited_by: BigInt(123) }
            : null,
        })),
    })),
  };
}

export function createMockPrisma(optionStatuses: Record<number, string> = {}) {
  const locationData = buildLocationWithVerses(optionStatuses);

  return {
    campaigns: {
      findMany: vi.fn().mockResolvedValue([CAMPAIGN]),
    },
    locations: {
      findMany: vi.fn().mockImplementation((args?: any) => {
        let locs = LOCATIONS;

        // Filter by display_number if specified
        if (args?.where?.display_number?.in) {
          const dns: number[] = args.where.display_number.in;
          locs = locs.filter((l) => dns.includes(l.display_number));
        }

        // Filter by campaign_id if specified
        if (args?.where?.campaign_id) {
          locs = locs.filter((l) => l.campaign_id === args.where.campaign_id);
        }

        // If include.verses is requested, return full location data with verses/options
        if (args?.include?.verses) {
          const locationsWithVerses = locs.map((loc) => {
            if (loc.display_number === 105) {
              return buildLocationWithVerses(optionStatuses);
            }
            if (loc.display_number === 999) {
              return buildKsLocation(999, VERSES_999, OPTIONS_999, optionStatuses);
            }
            if (loc.display_number === 1001) {
              return buildKsLocation(1001, VERSES_1001, OPTIONS_1001, optionStatuses);
            }
            if (loc.display_number === 1201) {
              return buildEkLocation(1201, VERSES_1201, OPTIONS_1201, optionStatuses);
            }
            // Other locations return empty verses
            return { ...loc, verses: [] };
          }).sort((a, b) => a.display_number - b.display_number);
          return Promise.resolve(locationsWithVerses);
        }
        // Default: return locations with _count
        return Promise.resolve(
          locs.map((l) => ({ ...l, _count: { verses: 3 } })),
        );
      }),
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        const dn = where?.campaign_id_display_number?.display_number;
        if (dn === 105) {
          return Promise.resolve(locationData);
        }
        if (dn === 1201) {
          return Promise.resolve(buildEkLocation(1201, VERSES_1201, OPTIONS_1201, optionStatuses));
        }
        return Promise.resolve(null);
      }),
    },
    progress: {
      upsert: vi.fn().mockImplementation(({ create }: any) => {
        const opt = OPTIONS_105.find((o) => o.id === create.option_id);
        const verse = VERSES_105.find((v) => v.id === opt?.verse_id);
        return Promise.resolve({
          id: 1,
          option_id: create.option_id,
          status: create.status || 'visited',
          visited_at: new Date(),
          visited_by: create.visited_by,
          option: {
            ...opt,
            verse: {
              ...verse,
              location: { display_number: 105 },
            },
          },
        });
      }),
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        const optId = where?.option_id;
        if (optionStatuses[optId]) {
          const opt = OPTIONS_105.find((o) => o.id === optId);
          const verse = VERSES_105.find((v) => v.id === opt?.verse_id);
          return Promise.resolve({
            id: 1,
            option_id: optId,
            status: optionStatuses[optId],
            visited_at: new Date(),
            visited_by: BigInt(123),
            option: {
              ...opt,
              verse: {
                ...verse,
                location: { display_number: 105 },
              },
            },
          });
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    users: {
      upsert: vi.fn().mockResolvedValue({
        telegram_id: BigInt(123456789),
        username: 'testplayer',
        role: 'player',
        created_at: new Date(),
      }),
    },
    options: {
      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const opt = OPTIONS_105.find((o) => o.id === where.id);
        return Promise.resolve({ ...opt, ...data });
      }),
      create: vi.fn().mockImplementation(({ data }: any) => {
        return Promise.resolve({ id: 999, ...data });
      }),
      delete: vi.fn().mockResolvedValue({}),
      aggregate: vi.fn().mockResolvedValue({ _max: { position: 1 } }),
      findMany: vi.fn().mockImplementation(({ where }: any) => {
        const ids: number[] = where?.id?.in ?? [];
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
    verses: {
      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const v = VERSES_105.find((v) => v.id === where.id);
        return Promise.resolve({ ...v, ...data });
      }),
      create: vi.fn().mockImplementation(({ data }: any) => {
        return Promise.resolve({ id: 999, ...data });
      }),
      delete: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn().mockImplementation((fn: any) => {
      // Pass the mock prisma itself as the transaction client
      const txClient = {
        progress: {
          upsert: vi.fn().mockImplementation(({ create }: any) => {
            const opt = OPTIONS_105.find((o) => o.id === create.option_id);
            const verse = VERSES_105.find((v) => v.id === opt?.verse_id);
            return Promise.resolve({
              id: 1,
              option_id: create.option_id,
              status: create.status || 'visited',
              visited_at: new Date(),
              visited_by: create.visited_by,
              option: {
                ...opt,
                verse: {
                  ...verse,
                  location: { display_number: 105 },
                },
              },
            });
          }),
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return fn(txClient);
    }),
    $queryRaw: vi.fn().mockImplementation(() => {
      // Compute batch progress from mock data
      const optionsByLocation = new Map<number, { total: number; visited: number }>();
      for (const loc of LOCATIONS) {
        optionsByLocation.set(loc.display_number, { total: 0, visited: 0 });
      }
      for (const opt of OPTIONS_105) {
        const entry = optionsByLocation.get(105)!;
        entry.total++;
        const status = optionStatuses[opt.id];
        if (status === 'visited' || status === 'closed') entry.visited++;
      }
      return Promise.resolve(
        LOCATIONS
          .sort((a, b) => a.display_number - b.display_number)
          .map((loc) => ({
            displayNumber: loc.display_number,
            totalOptions: optionsByLocation.get(loc.display_number)?.total ?? 0,
            visitedCount: optionsByLocation.get(loc.display_number)?.visited ?? 0,
          }))
          .filter((r) => r.totalOptions > 0),
      );
    }),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}
