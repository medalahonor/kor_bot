import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationPage from './LocationPage';
import { useAppStore } from '../stores/app';
import type { Option } from '@tg/shared';

// --- Mocks ---

const mockNavigate = vi.fn();
let mockParams: { dn: string; vdn: string | undefined } = { dn: '104', vdn: '0' };
let mockRouterState: unknown = null;
vi.mock('react-router', () => ({
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockRouterState }),
}));

vi.mock('../lib/telegram', () => ({
  hapticSuccess: vi.fn(),
  hapticLight: vi.fn(),
}));

const mockBatchMutate = vi.fn();

vi.mock('../api/queries', () => ({
  useLocationVerses: vi.fn(),
  useLocationProgress: () => ({
    data: { locationDn: 104, optionStatuses: {} },
  }),
  useBatchSetStatus: () => ({ mutate: mockBatchMutate }),
  useRemaining: () => ({
    data: { remaining: [], completedPaths: 0, totalPaths: 0, totalCyclic: 0, completedCyclic: 0 },
  }),
  useSetOptionStatus: () => ({ mutate: vi.fn() }),
  useEkData: vi.fn(() => ({ data: null, isLoading: false })),
}));

import { useLocationVerses, useEkData } from '../api/queries';

// --- Helpers ---

function makeOption(overrides: Partial<Option> & { id: number; text: string }): Option {
  return {
    position: 0,
    type: 'choice',
    targetType: null,
    targetVerseDn: null,
    targetLocationDn: null,
    requirement: null,
    result: null,
    hidden: null,
    once: false,
    conditionGroup: null,
    conditionalTargets: null,
    children: null,
    ...overrides,
  };
}

function setupVerseWith(...options: Option[]) {
  vi.mocked(useLocationVerses).mockReturnValue({
    data: {
      id: 1,
      displayNumber: 104,
      name: 'Тест',
      verses: [{ id: 1, displayNumber: 0, options }],
    },
    isLoading: false,
  } as any);
}

// --- Tests ---

describe('LocationPage: cross-location path tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { dn: '104', vdn: '0' };
    useAppStore.setState({
      gameMode: false,
      explorationPath: [],
    });
  });

  it('UC1: cross_location в gameMode — путь НЕ очищается', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      gameMode: true,
      explorationPath: [{ optionId: 50, verseDn: 0, locationDn: 104 }],
    });

    const crossLocOption = makeOption({
      id: 51,
      text: 'Перейти в локацию 999.',
      targetType: 'cross_location',
      targetLocationDn: 999,
      targetVerseDn: 219,
    });
    setupVerseWith(crossLocOption);

    render(<LocationPage />);
    await user.click(screen.getByText('Перейти в локацию 999.'));

    const path = useAppStore.getState().explorationPath;
    expect(path).toContainEqual({ optionId: 50, verseDn: 0, locationDn: 104 });
    expect(path).toContainEqual({ optionId: 51, verseDn: 0, locationDn: 104 });
    expect(mockNavigate).toHaveBeenCalledWith('/location/999/verse/219');
  });

  it('UC2: conditionalTargets cross-location в gameMode — путь НЕ очищается', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      gameMode: true,
      explorationPath: [{ optionId: 50, verseDn: 0, locationDn: 104 }],
    });

    const condOption = makeOption({
      id: 52,
      text: 'Условный переход.',
      conditionalTargets: [
        { condition: 'Если есть ключ', verse: 5, location: 200 },
      ],
    });
    setupVerseWith(condOption);

    render(<LocationPage />);
    await user.click(screen.getByText('Условный переход.'));

    const path = useAppStore.getState().explorationPath;
    expect(path).toContainEqual({ optionId: 50, verseDn: 0, locationDn: 104 });
    expect(path).toContainEqual({ optionId: 52, verseDn: 0, locationDn: 104 });
    expect(mockNavigate).toHaveBeenCalledWith('/location/200/verse/5');
  });

  it('UC3: end после cross-location — batchSetStatus получает ВСЕ optionIds', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      gameMode: true,
      explorationPath: [
        { optionId: 50, verseDn: 0, locationDn: 104 },
        { optionId: 51, verseDn: 2, locationDn: 104 },
      ],
    });

    const endOption = makeOption({
      id: 60,
      text: 'Конец пути.',
      targetType: 'end',
    });
    setupVerseWith(endOption);

    render(<LocationPage />);
    await user.click(screen.getByText('Конец пути.'));

    expect(mockBatchMutate).toHaveBeenCalledWith(
      { optionIds: [50, 51, 60], status: 'visited' },
      expect.any(Object),
    );
  });

  it('UC4: cross_location при gameMode=OFF — путь всё равно добавляется', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ gameMode: false, explorationPath: [] });

    const crossLocOption = makeOption({
      id: 51,
      text: 'Перейти в локацию 999.',
      targetType: 'cross_location',
      targetLocationDn: 999,
      targetVerseDn: 0,
    });
    setupVerseWith(crossLocOption);

    render(<LocationPage />);
    await user.click(screen.getByText('Перейти в локацию 999.'));

    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 51, verseDn: 0, locationDn: 104 },
    ]);
    expect(mockBatchMutate).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/location/999/verse/0');
  });

  it('UC5: end внутри одной локации (регрессия) — поведение не изменилось', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      gameMode: true,
      explorationPath: [{ optionId: 70, verseDn: 0, locationDn: 104 }],
    });

    const endOption = makeOption({
      id: 71,
      text: 'Тупик.',
      targetType: 'end',
    });
    setupVerseWith(endOption);

    render(<LocationPage />);
    await user.click(screen.getByText('Тупик.'));

    expect(mockBatchMutate).toHaveBeenCalledWith(
      { optionIds: [70, 71], status: 'visited' },
      expect.any(Object),
    );
  });
});

describe('LocationPage: breadcrumb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { dn: '104', vdn: '0' };
    useAppStore.setState({
      gameMode: false,
      explorationPath: [],
    });
  });

  it('пустой path — breadcrumb показывает только локацию и текущую строфу', () => {
    useAppStore.setState({ explorationPath: [] });
    setupVerseWith(makeOption({ id: 1, text: 'Опция' }));

    render(<LocationPage />);
    const bc = within(screen.getByTestId('breadcrumb'));

    expect(bc.getByText('104')).toBeDefined();
    expect(bc.getByText('#0')).toBeDefined();
  });

  it('cross-location path — breadcrumb показывает полный путь', () => {
    mockParams = { dn: '999', vdn: '231' };
    useAppStore.setState({
      explorationPath: [
        { optionId: 50, verseDn: 0, locationDn: 104 },
        { optionId: 51, verseDn: 2, locationDn: 104 },
      ],
    });

    vi.mocked(useLocationVerses).mockReturnValue({
      data: {
        id: 2,
        displayNumber: 999,
        name: 'КС',
        verses: [{ id: 10, displayNumber: 231, options: [] }],
      },
      isLoading: false,
    } as any);

    render(<LocationPage />);

    // Should show full path: 104 > #0 > #2 > КС > #231
    expect(screen.getByText('104')).toBeDefined();
    expect(screen.getByText('#0')).toBeDefined();
    expect(screen.getByText('#2')).toBeDefined();
    expect(screen.getByText('КС')).toBeDefined();
    expect(screen.getByText('#231')).toBeDefined();
  });

  it('клик по breadcrumb item — truncatePath + navigate', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      explorationPath: [
        { optionId: 50, verseDn: 0, locationDn: 104 },
        { optionId: 51, verseDn: 2, locationDn: 104 },
      ],
    });
    setupVerseWith(makeOption({ id: 1, text: 'Опция' }));

    render(<LocationPage />);
    const bc = within(screen.getByTestId('breadcrumb'));

    // Click on "#2" breadcrumb item (second entry in path)
    await user.click(bc.getByText('#2'));

    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 50, verseDn: 0, locationDn: 104 },
    ]);
    expect(mockNavigate).toHaveBeenCalledWith('/location/104/verse/2', { replace: true });
  });
});

describe('LocationPage: кнопка Назад', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { dn: '104', vdn: '0' };
    useAppStore.setState({
      gameMode: false,
      explorationPath: [],
    });
  });

  it('Назад — clearPath + navigate на home с tab из стартовой локации', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      explorationPath: [
        { optionId: 50, verseDn: 0, locationDn: 104 },
      ],
    });
    setupVerseWith(makeOption({ id: 1, text: 'Опция' }));

    render(<LocationPage />);
    await user.click(screen.getByText('‹ Назад'));

    expect(useAppStore.getState().explorationPath).toEqual([]);
    expect(mockNavigate).toHaveBeenCalledWith('/', { state: { tab: 'locations' } });
  });

  it('Назад из КС-локации — tab = ks', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      explorationPath: [
        { optionId: 50, verseDn: 0, locationDn: 999 },
      ],
    });
    setupVerseWith(makeOption({ id: 1, text: 'Опция' }));

    render(<LocationPage />);
    await user.click(screen.getByText('‹ Назад'));

    expect(mockNavigate).toHaveBeenCalledWith('/', { state: { tab: 'ks' } });
  });

  it('Назад при пустом path — tab из текущей локации', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ explorationPath: [] });
    setupVerseWith(makeOption({ id: 1, text: 'Опция' }));

    render(<LocationPage />);
    await user.click(screen.getByText('‹ Назад'));

    expect(mockNavigate).toHaveBeenCalledWith('/', { state: { tab: 'locations' } });
  });
});

describe('LocationPage: EK verse list branch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // EK локация (1201-1204) без vdn → ek verse list
    mockParams = { dn: '1201', vdn: undefined };
    useAppStore.setState({
      gameMode: false,
      explorationPath: [],
      showOnlyNew: false,
    });
    vi.mocked(useEkData).mockReturnValue({
      data: {
        locations: [
          {
            locationDn: 1201,
            name: 'EK локация',
            totalPaths: 5,
            completedPaths: 2,
            verses: [
              { verseDn: 100, totalPaths: 3, completedPaths: 1, totalCyclic: 0, completedCyclic: 0 },
              { verseDn: 101, totalPaths: 2, completedPaths: 2, totalCyclic: 0, completedCyclic: 0 },
            ],
          },
        ],
      },
      isLoading: false,
    } as never);
    vi.mocked(useLocationVerses).mockReturnValue({
      data: { id: 1, displayNumber: 1201, name: 'EK локация', verses: [] },
      isLoading: false,
    } as never);
  });

  it('рендерит список ek строф с прогрессом', () => {
    render(<LocationPage />);
    expect(screen.getByText('EK локация')).toBeDefined();
    // номера строф
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('101')).toBeDefined();
    // счётчик локации
    expect(screen.getByText('2/5')).toBeDefined();
  });

  it('Назад — navigate на home с tab=ek', async () => {
    const user = userEvent.setup();
    render(<LocationPage />);
    await user.click(screen.getByText('‹ Назад'));
    expect(mockNavigate).toHaveBeenCalledWith('/', { state: { tab: 'ek' } });
  });

  it('toggle "Только новые" — переключает store', async () => {
    const user = userEvent.setup();
    render(<LocationPage />);
    expect(useAppStore.getState().showOnlyNew).toBe(false);
    await user.click(screen.getByText('Только новые'));
    expect(useAppStore.getState().showOnlyNew).toBe(true);
  });

  it('showOnlyNew=true — строфы со всеми пройденными путями скрыты', () => {
    useAppStore.setState({ showOnlyNew: true });
    render(<LocationPage />);
    // verseDn=100 имеет 1/3 — остаётся
    expect(screen.getByText('100')).toBeDefined();
    // verseDn=101 имеет 2/2 — скрыта
    expect(screen.queryByText('101')).toBeNull();
  });
});
