import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import KsVerseCard from '../../components/KsVerseCard';
import StateMessage from '../../components/StateMessage';
import ShowOnlyNewToggle from '../../components/ShowOnlyNewToggle';
import { useLocationVerses, useEkData } from '../../api/queries';
import { useAppStore } from '../../stores/app';
import { formatLocationNumber } from '../../lib/formatLocationNumber';

interface EkVerseListViewProps {
  locationDn: number;
}

export default function EkVerseListView({ locationDn }: EkVerseListViewProps) {
  const navigate = useNavigate();
  const showOnlyNew = useAppStore((s) => s.showOnlyNew);

  const { data: locationData } = useLocationVerses(locationDn);
  const { data: ekData, isLoading: ekLoading } = useEkData();

  const ekLocation = useMemo(
    () => ekData?.locations.find((l) => l.locationDn === locationDn),
    [ekData, locationDn],
  );

  const ekTotalPaths = ekLocation?.totalPaths ?? 0;
  const ekCompletedPaths = ekLocation?.completedPaths ?? 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-2.5 bg-bg-card border-b border-separator flex items-center gap-3">
        <button
          onClick={() => navigate('/', { state: { tab: 'ek' } })}
          className="text-rune text-[13px]"
        >
          &#8249; Назад
        </button>
        <div>
          <div className="text-[15px] font-semibold">
            {formatLocationNumber(locationDn)}
          </div>
          <div className="text-xs text-text-secondary">
            {locationData?.name ?? ekLocation?.name ?? ''}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 flex items-center justify-between">
        <ShowOnlyNewToggle />
        <span className="text-xs text-text-secondary tabular-nums">
          {ekCompletedPaths}/{ekTotalPaths}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {ekLoading && <StateMessage text="Эхо краха зовёт..." />}

        {ekLocation && ekLocation.verses.length > 0 && (
          <div className="mx-4 bg-bg-card rounded-xl overflow-hidden border border-separator">
            {ekLocation.verses
              .filter((v) => !showOnlyNew || v.completedPaths < v.totalPaths || v.totalPaths === 0)
              .map((verse) => (
                <KsVerseCard
                  key={verse.verseDn}
                  verse={{ ...verse, locationDn }}
                />
              ))}
          </div>
        )}

        {!ekLoading && ekLocation && ekLocation.verses.length === 0 && (
          <div className="p-8 text-center text-text-secondary text-sm">
            Нет данных
          </div>
        )}
      </div>
    </div>
  );
}
