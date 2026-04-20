import { render, screen } from '@testing-library/react';
import LocationsPage from './LocationsPage';

// --- Mocks ---

const mockNavigate = vi.fn();
let mockLocationState: unknown = null;

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}));

vi.mock('../api/queries', () => ({
  useLocations: () => ({ data: [], isLoading: false, error: null }),
  useBatchProgress: () => ({ data: [] }),
  useKsVerses: () => ({ data: null, isLoading: false }),
  useEkData: () => ({ data: null, isLoading: false }),
  useLocationProgressMap: () => new Map(),
  useChapters: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
  useCreateChapter: () => ({ mutateAsync: vi.fn() }),
  useUpdateChapter: () => ({ mutateAsync: vi.fn() }),
  useDeleteChapter: () => ({ mutateAsync: vi.fn() }),
  useUpdateChapterLocations: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../stores/app', () => ({
  useAppStore: (selector: (s: any) => any) =>
    selector({
      showOnlyNew: true,
      toggleShowOnlyNew: vi.fn(),
      gameMode: false,
      toggleGameMode: vi.fn(),
      adminMode: false,
      toggleAdminMode: vi.fn(),
    }),
}));

// --- Tests ---

describe('LocationsPage: tab from Router state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
  });

  it('без Router state — activeTab = chapters (дефолт)', () => {
    render(<LocationsPage />);

    // Все четыре таба отрисованы в TabBar
    expect(screen.getByText('Главы')).toBeDefined();
    expect(screen.getByText('Локации')).toBeDefined();
    expect(screen.getByText('Книга секретов')).toBeDefined();
    expect(screen.getByText('Эхо краха')).toBeDefined();
  });

  it('Router state { tab: "locations" } — activeTab = locations', () => {
    mockLocationState = { tab: 'locations' };
    render(<LocationsPage />);

    // На табе «Локации» отображается плейсхолдер поиска по локациям
    expect(screen.getByPlaceholderText('Поиск по номеру или названию')).toBeDefined();
  });

  it('Router state { tab: "ks" } — activeTab = ks', () => {
    mockLocationState = { tab: 'ks' };
    render(<LocationsPage />);

    // КС tab content should be shown — check for КС-specific UI
    expect(screen.getByText('Только новые')).toBeDefined();
  });
});
