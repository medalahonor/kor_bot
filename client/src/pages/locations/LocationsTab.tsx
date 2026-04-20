import { useMemo } from 'react';
import LocationList from '../../components/LocationList';
import LocationSearchBar from '../../components/LocationSearchBar';
import StateMessage from '../../components/StateMessage';
import { useLocations, useEkData, useLocationProgressMap } from '../../api/queries';
import {
  getContextType,
  KS_LOCATION_DNS,
  HIDDEN_LOCATION_DNS,
  type Location,
} from '@tg/shared';
import { matchesLocationSearch } from '../../lib/formatLocationNumber';

interface LocationsTabProps {
  activeTab: 'locations' | 'ek';
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function LocationsTab({ activeTab, searchQuery, onSearchChange }: LocationsTabProps) {
  const { data: locations, isLoading, error, refetch } = useLocations();
  const { isLoading: ekLoading } = useEkData();
  const progressMap = useLocationProgressMap();

  const grouped = useMemo(() => {
    const result: Record<'locations' | 'ek', Location[]> = {
      locations: [],
      ek: [],
    };
    if (!locations) return result;
    for (const loc of locations) {
      if (HIDDEN_LOCATION_DNS.has(loc.displayNumber)) continue;
      if (KS_LOCATION_DNS.has(loc.displayNumber)) continue;
      const ctx = getContextType(loc.displayNumber);
      if (ctx === 'locations' || ctx === 'ek') result[ctx].push(loc);
    }
    return result;
  }, [locations]);

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
