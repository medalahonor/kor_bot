import LocationCard from './LocationCard';
import type { Location } from '../lib/types';

interface LocationListProps {
  locations: Location[];
  progressMap: Map<number, { visited: number; total: number; visitedCyclic: number; totalCyclic: number }>;
}

export default function LocationList({
  locations,
  progressMap,
}: LocationListProps) {
  if (locations.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary text-sm">
        Нет данных
      </div>
    );
  }

  return (
    <div className="mx-4 flex flex-col gap-2.5">
      {locations.map((loc) => {
        const progress = progressMap.get(loc.displayNumber);
        return (
          <LocationCard
            key={loc.id}
            location={loc}
            visited={progress?.visited ?? 0}
            total={progress?.total ?? 0}
            visitedCyclic={progress?.visitedCyclic ?? 0}
            totalCyclic={progress?.totalCyclic ?? 0}
          />
        );
      })}
    </div>
  );
}
