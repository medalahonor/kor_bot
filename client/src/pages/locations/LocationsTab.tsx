import { useMemo } from 'react';
import LocationList from '../../components/LocationList';
import LocationSearchBar from '../../components/LocationSearchBar';
import StateMessage from '../../components/StateMessage';
import { useLocations, useBatchProgress, useEkData } from '../../api/queries';
import { getContextType, KS_LOCATION_DNS, type ContextType, type Location } from '@tg/shared';
import { matchesLocationSearch } from '../../lib/formatLocationNumber';

const HIDDEN_LOCATIONS = new Set([1101, 1102, 1103]);

interface LocationsTabProps {
  activeTab: 'locations' | 'ek';
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function LocationsTab({ activeTab, searchQuery, onSearchChange }: LocationsTabProps) {
  const { data: locations, isLoading, error, refetch } = useLocations();
  const { data: batchProgress } = useBatchProgress();
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

  const tabLoading = isLoading || (activeTab === 'ek' && ekLoading);

  return (
    <>
      {activeTab === 'locations' && (
        <div className="px-4 pt-4 pb-4">
          <LocationSearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Поиск по номеру или названию"
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

      {!isLoading && !error && (
        <div className="flex-1 overflow-y-auto pb-8">
          <LocationList
            locations={filteredLocations}
            progressMap={progressMap}
          />
          <div className="px-4 pt-1.5 pb-4 text-xs text-text-secondary">
            {currentLocations.length} {activeTab === 'locations' ? 'локаций' : 'строф'} &middot; Кампания Kings of Ruin
          </div>
        </div>
      )}
    </>
  );
}
