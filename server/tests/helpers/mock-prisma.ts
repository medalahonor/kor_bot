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

type ChapterRow = { id: number; campaign_id: number; code: string; title: string; menu_order: number };
type ChapterLocationRow = { chapter_id: number; location_dn: number; sort_order: number };
type NotePathStep = { locationDn: number; verseDn: number };
type NoteRow = {
  id: number;
  campaign_id: number;
  type: 'quest' | 'hint' | 'general';
  body: string;
  verse_id: number | null;
  path: NotePathStep[] | null;
  created_at: Date;
};

const ALL_VERSES = [...VERSES_105, ...VERSES_999, ...VERSES_1001, ...VERSES_1201];

function verseJoin(verseId: number | null) {
  if (verseId === null) return null;
  const v = ALL_VERSES.find((x) => x.id === verseId);
  if (!v) return null;
  const loc = LOCATIONS.find((l) => l.id === v.location_id);
  if (!loc) return null;
  return {
    id: v.id,
    display_number: v.display_number,
    location: { id: loc.id, display_number: loc.display_number, name: loc.name },
  };
}

function expandNote(row: NoteRow, include?: any) {
  const base: any = { ...row };
  if (include?.verse) {
    base.verse = verseJoin(row.verse_id);
  }
  return base;
}

export function createMockPrisma(optionStatuses: Record<number, string> = {}) {
  const locationData = buildLocationWithVerses(optionStatuses);

  const chapters: ChapterRow[] = [
    { id: 1, campaign_id: 1, code: '1', title: 'Глава 1', menu_order: 1 },
    { id: 2, campaign_id: 1, code: '2', title: 'Глава 2', menu_order: 2 },
    { id: 3, campaign_id: 1, code: 'empty', title: 'Пустая', menu_order: 99 },
  ];
  const chapterLocations: ChapterLocationRow[] = [
    { chapter_id: 1, location_dn: 105, sort_order: 0 },
    { chapter_id: 1, location_dn: 101, sort_order: 1 },
    { chapter_id: 2, location_dn: 105, sort_order: 0 },
  ];

  const nextChapterId = { value: 100 };

  const notes: NoteRow[] = [
    {
      id: 1,
      campaign_id: 1,
      type: 'quest',
      body: 'Найти шлем в Вагенбурге',
      verse_id: 50,
      path: [{ locationDn: 105, verseDn: 0 }, { locationDn: 105, verseDn: 1 }],
      created_at: new Date('2026-04-20T10:00:00Z'),
    },
    {
      id: 2,
      campaign_id: 1,
      type: 'hint',
      body: 'У вендов есть зелье',
      verse_id: null,
      path: null,
      created_at: new Date('2026-04-20T11:00:00Z'),
    },
    {
      id: 3,
      campaign_id: 1,
      type: 'general',
      body: 'Карта башен в старом приюте',
      verse_id: 51,
      path: [{ locationDn: 105, verseDn: 0 }, { locationDn: 105, verseDn: 2 }],
      created_at: new Date('2026-04-20T12:00:00Z'),
    },
  ];
  const nextNoteId = { value: 100 };

  return {
    campaigns: {
      findMany: vi.fn().mockResolvedValue([CAMPAIGN]),
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where?.id === CAMPAIGN.id) return Promise.resolve(CAMPAIGN);
        return Promise.resolve(null);
      }),
    },
    chapters: {
      findMany: vi.fn().mockImplementation(({ where, include }: any = {}) => {
        let rows = chapters;
        if (where?.campaign_id !== undefined) {
          rows = rows.filter((c) => c.campaign_id === where.campaign_id);
        }
        rows = [...rows].sort((a, b) => a.menu_order - b.menu_order || a.id - b.id);
        if (include?.chapter_locations) {
          return Promise.resolve(
            rows.map((c) => ({
              ...c,
              chapter_locations: chapterLocations
                .filter((cl) => cl.chapter_id === c.id)
                .sort((a, b) => a.sort_order - b.sort_order || a.location_dn - b.location_dn),
            })),
          );
        }
        return Promise.resolve(rows);
      }),
      findUnique: vi.fn().mockImplementation(({ where, select }: any = {}) => {
        const ch = chapters.find((c) => c.id === where?.id) ?? null;
        if (!ch) return Promise.resolve(null);
        if (select?._count?.select?.chapter_locations) {
          return Promise.resolve({
            ...ch,
            _count: {
              chapter_locations: chapterLocations.filter((cl) => cl.chapter_id === ch.id).length,
            },
          });
        }
        return Promise.resolve(ch);
      }),
      create: vi.fn().mockImplementation(({ data }: any) => {
        const row: ChapterRow = {
          id: nextChapterId.value++,
          campaign_id: data.campaign_id,
          code: data.code,
          title: data.title,
          menu_order: data.menu_order,
        };
        const dup = chapters.find((c) => c.campaign_id === row.campaign_id && c.code === row.code);
        if (dup) return Promise.reject(Object.assign(new Error('duplicate'), { code: 'P2002' }));
        chapters.push(row);
        return Promise.resolve(row);
      }),
      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const idx = chapters.findIndex((c) => c.id === where.id);
        if (idx < 0) return Promise.reject(Object.assign(new Error('not found'), { code: 'P2025' }));
        const row = chapters[idx];
        if (data.code !== undefined) row.code = data.code;
        if (data.title !== undefined) row.title = data.title;
        if (data.menu_order !== undefined) row.menu_order = data.menu_order;
        return Promise.resolve(row);
      }),
      delete: vi.fn().mockImplementation(({ where }: any) => {
        const idx = chapters.findIndex((c) => c.id === where.id);
        if (idx < 0) return Promise.reject(Object.assign(new Error('not found'), { code: 'P2025' }));
        const [removed] = chapters.splice(idx, 1);
        return Promise.resolve(removed);
      }),
    },
    chapter_locations: {
      findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
        let rows = chapterLocations;
        if (where?.chapter_id !== undefined) rows = rows.filter((cl) => cl.chapter_id === where.chapter_id);
        if (where?.location_dn?.in) {
          const dns: number[] = where.location_dn.in;
          rows = rows.filter((cl) => dns.includes(cl.location_dn));
        }
        return Promise.resolve(rows.map((r) => ({ ...r })));
      }),
      aggregate: vi.fn().mockImplementation(({ where }: any) => {
        const rows = chapterLocations.filter((cl) => cl.chapter_id === where.chapter_id);
        const max = rows.length === 0 ? null : Math.max(...rows.map((r) => r.sort_order));
        return Promise.resolve({ _max: { sort_order: max } });
      }),
      createMany: vi.fn().mockImplementation(({ data }: any) => {
        for (const row of data) chapterLocations.push({ ...row });
        return Promise.resolve({ count: data.length });
      }),
      deleteMany: vi.fn().mockImplementation(({ where }: any) => {
        const dns: number[] | undefined = where.location_dn?.in;
        const before = chapterLocations.length;
        for (let i = chapterLocations.length - 1; i >= 0; i--) {
          const cl = chapterLocations[i];
          if (cl.chapter_id !== where.chapter_id) continue;
          if (dns && !dns.includes(cl.location_dn)) continue;
          chapterLocations.splice(i, 1);
        }
        return Promise.resolve({ count: before - chapterLocations.length });
      }),
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
      findUnique: vi.fn().mockImplementation(({ where, select }: any) => {
        const dn = where?.campaign_id_display_number?.display_number;
        if (select) {
          const loc = LOCATIONS.find((l) => l.display_number === dn);
          if (!loc) return Promise.resolve(null);
          const projected: Record<string, unknown> = {};
          for (const k of Object.keys(select)) {
            if ((select as Record<string, unknown>)[k]) {
              projected[k] = (loc as unknown as Record<string, unknown>)[k];
            }
          }
          return Promise.resolve(projected);
        }
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
      findUnique: vi.fn().mockImplementation(({ where, select }: any) => {
        let v: typeof ALL_VERSES[number] | undefined;
        if (where?.id != null) {
          v = ALL_VERSES.find((x) => x.id === where.id);
        } else if (where?.location_id_display_number) {
          const { location_id, display_number } = where.location_id_display_number;
          v = ALL_VERSES.find((x) => x.location_id === location_id && x.display_number === display_number);
        }
        if (!v) return Promise.resolve(null);
        if (select) {
          const projected: Record<string, unknown> = {};
          for (const k of Object.keys(select)) {
            if ((select as Record<string, unknown>)[k]) {
              projected[k] = (v as unknown as Record<string, unknown>)[k];
            }
          }
          return Promise.resolve(projected);
        }
        return Promise.resolve(v);
      }),
    },
    notes: {
      findMany: vi.fn().mockImplementation((args: any = {}) => {
        const { where = {}, orderBy, include } = args;
        let rows = [...notes];
        if (where.campaign_id !== undefined) {
          const cid = Number(where.campaign_id);
          rows = rows.filter((n) => n.campaign_id === cid);
        }
        if (where.type !== undefined) {
          rows = rows.filter((n) => n.type === where.type);
        }
        if (where.verse_id !== undefined) {
          const vid = Number(where.verse_id);
          rows = rows.filter((n) => n.verse_id === vid);
        }
        if (orderBy?.created_at === 'desc') {
          rows.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        } else if (orderBy?.created_at === 'asc') {
          rows.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        }
        return Promise.resolve(rows.map((r) => expandNote(r, include)));
      }),
      findUnique: vi.fn().mockImplementation(({ where, include }: any) => {
        const id = Number(where?.id);
        const row = notes.find((n) => n.id === id);
        if (!row) return Promise.resolve(null);
        return Promise.resolve(expandNote(row, include));
      }),
      create: vi.fn().mockImplementation(({ data, include }: any) => {
        if (data.verse_id != null) {
          const vid = Number(data.verse_id);
          const exists = ALL_VERSES.some((v) => v.id === vid);
          if (!exists) {
            return Promise.reject(
              Object.assign(new Error('FK violation'), { code: 'P2003' }),
            );
          }
        }
        const row: NoteRow = {
          id: nextNoteId.value++,
          campaign_id: Number(data.campaign_id),
          type: data.type,
          body: data.body,
          verse_id: data.verse_id != null ? Number(data.verse_id) : null,
          path: (data.path as NotePathStep[] | null | undefined) ?? null,
          created_at: new Date(),
        };
        notes.push(row);
        return Promise.resolve(expandNote(row, include));
      }),
      update: vi.fn().mockImplementation(({ where, data, include }: any) => {
        const id = Number(where?.id);
        const idx = notes.findIndex((n) => n.id === id);
        if (idx < 0) {
          return Promise.reject(
            Object.assign(new Error('Not found'), { code: 'P2025' }),
          );
        }
        const row = notes[idx];
        if (data.type !== undefined) row.type = data.type;
        if (data.body !== undefined) row.body = data.body;
        return Promise.resolve(expandNote(row, include));
      }),
      delete: vi.fn().mockImplementation(({ where }: any) => {
        const id = Number(where?.id);
        const idx = notes.findIndex((n) => n.id === id);
        if (idx < 0) {
          return Promise.reject(
            Object.assign(new Error('Not found'), { code: 'P2025' }),
          );
        }
        const [removed] = notes.splice(idx, 1);
        return Promise.resolve(removed);
      }),
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
        chapter_locations: {
          findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
            let rows = chapterLocations;
            if (where?.chapter_id !== undefined) rows = rows.filter((cl) => cl.chapter_id === where.chapter_id);
            if (where?.location_dn?.in) {
              const dns: number[] = where.location_dn.in;
              rows = rows.filter((cl) => dns.includes(cl.location_dn));
            }
            return Promise.resolve(rows.map((r) => ({ ...r })));
          }),
          aggregate: vi.fn().mockImplementation(({ where }: any) => {
            const rows = chapterLocations.filter((cl) => cl.chapter_id === where.chapter_id);
            const max = rows.length === 0 ? null : Math.max(...rows.map((r) => r.sort_order));
            return Promise.resolve({ _max: { sort_order: max } });
          }),
          createMany: vi.fn().mockImplementation(({ data }: any) => {
            for (const row of data) chapterLocations.push({ ...row });
            return Promise.resolve({ count: data.length });
          }),
          deleteMany: vi.fn().mockImplementation(({ where }: any) => {
            const dns: number[] | undefined = where.location_dn?.in;
            const before = chapterLocations.length;
            for (let i = chapterLocations.length - 1; i >= 0; i--) {
              const cl = chapterLocations[i];
              if (cl.chapter_id !== where.chapter_id) continue;
              if (dns && !dns.includes(cl.location_dn)) continue;
              chapterLocations.splice(i, 1);
            }
            return Promise.resolve({ count: before - chapterLocations.length });
          }),
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
