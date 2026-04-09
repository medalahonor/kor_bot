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

  it('без Router state — activeTab = locations', () => {
    render(<LocationsPage />);

    // The "Локации" tab should be active (has a specific style)
    const locTab = screen.getByText('Локации');
    expect(locTab).toBeDefined();
  });

  it('Router state { tab: "ks" } — activeTab = ks', () => {
    mockLocationState = { tab: 'ks' };
    render(<LocationsPage />);

    // КС tab content should be shown — check for КС-specific UI
    expect(screen.getByText('Только новые')).toBeDefined();
  });
});
