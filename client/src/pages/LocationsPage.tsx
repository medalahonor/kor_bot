import { useState, useMemo } from 'react';
import { useLocation } from 'react-router';
import Header from '../components/Header';
import TabBar from '../components/TabBar';
import LocationList from '../components/LocationList';
import KsVerseList from '../components/KsVerseList';
import LocationSearchBar from '../components/LocationSearchBar';
import StateMessage from '../components/StateMessage';
import { useLocations, useBatchProgress, useKsVerses, useEkData } from '../api/queries';
import { useAppStore } from '../stores/app';
import { getContextType, KS_LOCATION_DNS, type ContextType, type Location } from '@tg/shared';
import { matchesLocationSearch } from '../lib/formatLocationNumber';

const HIDDEN_LOCATIONS = new Set([1101, 1102, 1103]);

export default function LocationsPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ContextType>(
    (location.state as { tab?: ContextType } | null)?.tab ?? 'locations',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [ksPage, setKsPage] = useState(1);
  const showOnlyNew = useAppStore((s) => s.showOnlyNew);
  const toggleShowOnlyNew = useAppStore((s) => s.toggleShowOnlyNew);
  const { data: locations, isLoading, error, refetch } = useLocations();
  const { data: batchProgress } = useBatchProgress();
  const { data: ksData, isLoading: ksLoading } = useKsVerses(ksPage, activeTab === 'ks' ? searchQuery : '', activeTab === 'ks' && showOnlyNew);
  const { data: ekData, isLoading: ekLoading } = useEkData();

  const grouped = useMemo(() => {
    if (!locations) return { locations: [], ks: [], ek: [] };
    const result: Record<ContextType, Location[]> = {
      locations: [],
      ks: [],
      ek: [],
    };
    for (const loc of locations) {
      if (HIDDEN_LOCATIONS.has(loc.displayNumber)) continue;
      if (KS_LOCATION_DNS.has(loc.displayNumber)) continue;
      result[getContextType(loc.displayNumber)].push(loc);
    }
    return result;
  }, [locations]);

  const counts: Record<ContextType, number> = {
    locations: grouped.locations.length,
    ks: ksData?.total ?? 0,
    ek: grouped.ek.length,
  };

  const progressMap = useMemo(() => {
    const map = new Map<number, { visited: number; total: number; visitedCyclic: number; totalCyclic: number }>();
    if (batchProgress) {
      for (const item of batchProgress) {
        map.set(item.displayNumber, {
          visited: item.completedPaths,
          total: item.totalPaths,
          visitedCyclic: item.completedCyclic,
          totalCyclic: item.totalCyclic,
        });
      }
    }
    if (ekData) {
      for (const loc of ekData.locations) {
        map.set(loc.locationDn, {
          visited: loc.completedPaths,
          total: loc.totalPaths,
          visitedCyclic: loc.completedCyclic,
          totalCyclic: loc.totalCyclic,
        });
      }
    }
    return map;
  }, [batchProgress, ekData]);

  const currentLocations = grouped[activeTab];

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return currentLocations;
    const q = searchQuery.trim().toLowerCase();
    return currentLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        matchesLocationSearch(loc.displayNumber, q),
    );
  }, [currentLocations, searchQuery]);

  const handleTabChange = (tab: ContextType) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (activeTab === 'ks') setKsPage(1);
  };

  const ksTotalPages = ksData ? Math.ceil(ksData.total / (ksData.limit || 50)) : 0;

  const tabLoading =
    (activeTab === 'locations' && isLoading) ||
    (activeTab === 'ks' && ksLoading) ||
    (activeTab === 'ek' && (isLoading || ekLoading));

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <TabBar active={activeTab} onChange={handleTabChange} />

      {activeTab === 'locations' && (
        <div className="px-4 pt-4 pb-4">
          <LocationSearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Поиск по номеру или названию"
          />
        </div>
      )}

      {activeTab === 'ks' && (
        <div className="px-4 pt-4 pb-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex bg-bg-card rounded-lg p-0.5 border border-separator">
              <button
                onClick={() => showOnlyNew && toggleShowOnlyNew()}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  !showOnlyNew
                    ? 'bg-bg-elevated text-text-primary font-semibold'
                    : 'text-text-secondary'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => !showOnlyNew && toggleShowOnlyNew()}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  showOnlyNew
                    ? 'bg-bg-elevated text-text-primary font-semibold'
                    : 'text-text-secondary'
                }`}
              >
                Только новые
              </button>
            </div>
          </div>
          <LocationSearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Поиск по номеру строфы"
          />
        </div>
      )}

      {tabLoading && <StateMessage text="Авалон пробуждается..." />}

      {error && (
        <StateMessage
          error
          text="Связь с менгирами потеряна."
          onRetry={() => refetch()}
        />
      )}

      {activeTab === 'ks' && !ksLoading && ksData && (
        <div className="flex-1 overflow-y-auto pb-8">
          <KsVerseList
            verses={ksData.verses}
            page={ksPage}
            totalPages={ksTotalPages}
            onPageChange={setKsPage}
          />
          <div className="px-4 pt-1.5 pb-4 text-xs text-text-secondary">
            {ksData.total} строф &middot; Кампания Kings of Ruin
          </div>
        </div>
      )}

      {activeTab !== 'ks' && !isLoading && !error && (
        <div className="flex-1 overflow-y-auto pb-8">
          <LocationList
            locations={filteredLocations}
            progressMap={progressMap}
          />
          <div className="px-4 pt-1.5 pb-4 text-xs text-text-secondary">
            {counts[activeTab]} {activeTab === 'locations' ? 'локаций' : 'строф'} &middot; Кампания Kings of Ruin
          </div>
        </div>
      )}
    </div>
  );
}
