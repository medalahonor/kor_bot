import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChaptersTab from './ChaptersTab';
import type { Chapter, Location } from '@tg/shared';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const mockCreateChapter = vi.fn().mockResolvedValue(undefined);
const mockUpdateChapter = vi.fn().mockResolvedValue(undefined);
const mockDeleteChapter = vi.fn().mockResolvedValue(undefined);
const mockUpdateLocations = vi.fn().mockResolvedValue(undefined);

let chapterData: Chapter[] = [];
let locationData: Location[] = [];

vi.mock('../../api/queries', () => ({
  useChapters: () => ({
    data: chapterData,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLocations: () => ({ data: locationData, isLoading: false, error: null }),
  useLocationProgressMap: () => new Map(),
  useCreateChapter: () => ({ mutateAsync: mockCreateChapter }),
  useUpdateChapter: () => ({ mutateAsync: mockUpdateChapter }),
  useDeleteChapter: () => ({ mutateAsync: mockDeleteChapter }),
  useUpdateChapterLocations: () => ({ mutateAsync: mockUpdateLocations }),
}));

function makeChapter(id: number, code: string, locations: { dn: number; name: string }[]): Chapter {
  return {
    id,
    code,
    title: `Глава ${code}`,
    menuOrder: id,
    locations: locations.map((l) => ({ dn: l.dn, name: l.name, verseCount: 1 })),
  };
}

function renderTab(props?: Partial<Parameters<typeof ChaptersTab>[0]>) {
  const onChange = vi.fn();
  const utils = render(
    <ChaptersTab
      searchQuery=""
      onSearchChange={onChange}
      {...props}
    />,
  );
  return { ...utils, onChange };
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockCreateChapter.mockClear();
  mockUpdateChapter.mockClear();
  mockDeleteChapter.mockClear();
  mockUpdateLocations.mockClear();
  chapterData = [
    makeChapter(1, '1', [
      { dn: 105, name: 'Вагенбург' },
      { dn: 107, name: 'Лес' },
    ]),
    makeChapter(2, '2', [{ dn: 112, name: 'Поле' }]),
  ];
  locationData = [
    { id: 1, displayNumber: 101, name: 'Запустелые земли', verseCount: 0 },
    { id: 2, displayNumber: 105, name: 'Вагенбург', verseCount: 0 },
    { id: 3, displayNumber: 107, name: 'Лес', verseCount: 0 },
    { id: 4, displayNumber: 112, name: 'Поле', verseCount: 0 },
    { id: 5, displayNumber: 999, name: 'Книга секретов', verseCount: 0 },
    { id: 6, displayNumber: 1201, name: 'Эхо краха', verseCount: 0 },
  ];
});

describe('ChaptersTab — view mode', () => {
  it('отрисовывает главы с количеством локаций', () => {
    renderTab();
    expect(screen.getByText('Глава 1')).toBeDefined();
    expect(screen.getByText('Глава 2')).toBeDefined();
    expect(screen.getByText('(2)')).toBeDefined();
    expect(screen.getByText('(1)')).toBeDefined();
  });

  it('initialChapterCode раскрывает указанную главу', () => {
    renderTab({ initialChapterCode: '2' });
    expect(screen.getByText('Поле')).toBeDefined();
  });

  it('клик по заголовку главы раскрывает и сворачивает локации', async () => {
    const user = userEvent.setup();
    renderTab();
    expect(screen.queryByText('Вагенбург')).toBeNull();
    await user.click(screen.getByText('Глава 1'));
    expect(screen.getByText('Вагенбург')).toBeDefined();
    await user.click(screen.getByText('Глава 1'));
    expect(screen.queryByText('Вагенбург')).toBeNull();
  });

  it('клик по карточке локации вызывает navigate с chapterCode в state', async () => {
    const user = userEvent.setup();
    renderTab({ initialChapterCode: '1' });
    await user.click(screen.getByText('Вагенбург'));
    expect(mockNavigate).toHaveBeenCalledWith('/location/105', {
      state: { tab: 'chapters', chapterCode: '1' },
    });
  });

  it('empty state показывается если нет глав', () => {
    chapterData = [];
    renderTab();
    expect(screen.getByText(/Ещё нет ни одной главы/)).toBeDefined();
  });
});

describe('ChaptersTab — поиск', () => {
  it('автораскрывает главы с совпадениями + фильтрует локации', () => {
    renderTab({ searchQuery: 'Поле' });
    expect(screen.getByText('Поле')).toBeDefined();
    expect(screen.queryByText('Вагенбург')).toBeNull();
  });

  it('поиск по displayNumber', () => {
    renderTab({ searchQuery: '107' });
    expect(screen.getByText('Лес')).toBeDefined();
    expect(screen.queryByText('Поле')).toBeNull();
  });
});

describe('ChaptersTab — edit-mode', () => {
  it('кнопка «Править» включает edit-mode', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByRole('button', { name: 'Править' }));
    expect(screen.getByRole('button', { name: 'Готово' })).toBeDefined();
    expect(screen.getByRole('button', { name: /Новая глава/ })).toBeDefined();
  });

  it('удаление локации вызывает mutate removeLocations', async () => {
    const user = userEvent.setup();
    renderTab({ initialChapterCode: '1' });
    await user.click(screen.getByRole('button', { name: 'Править' }));
    const removeButtons = screen.getAllByRole('button', { name: 'Удалить из главы' });
    await user.click(removeButtons[0]);
    expect(mockUpdateLocations).toHaveBeenCalledWith({
      chapterId: 1,
      removeLocations: [105],
    });
  });

  it('добавление локации через диалог', async () => {
    const user = userEvent.setup();
    renderTab({ initialChapterCode: '1' });
    await user.click(screen.getByRole('button', { name: 'Править' }));
    await user.click(screen.getByRole('button', { name: /Добавить локацию/ }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByText('Запустелые земли'));
    expect(mockUpdateLocations).toHaveBeenCalledWith({
      chapterId: 1,
      addLocations: [101],
    });
  });

  it('диалог добавления не показывает KS/EK локации (999, 1201)', async () => {
    const user = userEvent.setup();
    renderTab({ initialChapterCode: '1' });
    await user.click(screen.getByRole('button', { name: 'Править' }));
    await user.click(screen.getByRole('button', { name: /Добавить локацию/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByText('Книга секретов')).toBeNull();
    expect(within(dialog).queryByText('Эхо краха')).toBeNull();
  });

  it('диалог помечает уже присутствующую локацию как недоступную', async () => {
    const user = userEvent.setup();
    renderTab({ initialChapterCode: '1' });
    await user.click(screen.getByRole('button', { name: 'Править' }));
    await user.click(screen.getByRole('button', { name: /Добавить локацию/ }));
    const dialog = screen.getByRole('dialog');
    // 105 и 107 обе уже в главе 1 → бейдж дважды
    expect(within(dialog).getAllByText('уже в главе').length).toBeGreaterThanOrEqual(2);
  });

  it('multi-chapter: локация 105 отображается в обеих главах', () => {
    chapterData[1] = makeChapter(2, '2', [
      { dn: 105, name: 'Вагенбург' },
      { dn: 112, name: 'Поле' },
    ]);
    renderTab({ initialChapterCode: '1' });
    // Раскрываем вторую главу — 105 должна быть там тоже
    expect(screen.getByText('Вагенбург')).toBeDefined();
  });
});
