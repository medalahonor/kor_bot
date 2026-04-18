import { useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import ModeStrip from '../components/ModeStrip';
import Breadcrumb, { type BreadcrumbItem } from '../components/Breadcrumb';
import VerseCard from '../components/VerseCard';
import KsVerseCard from '../components/KsVerseCard';
import StateMessage from '../components/StateMessage';
import { useLocationVerses, useLocationProgress, useBatchSetStatus, useRemaining, useSetOptionStatus, useEkData } from '../api/queries';
import { useAppStore } from '../stores/app';
import { hapticSuccess, hapticLight } from '../lib/telegram';
import { getContextType, type Option, type OptionStatus } from '@tg/shared';
import { formatLocationNumber } from '../lib/formatLocationNumber';


export default function LocationPage() {
  const { dn, vdn } = useParams();
  const navigate = useNavigate();
  const locationDn = parseInt(dn!, 10);
  const contextType = getContextType(locationDn);
  const isKs = contextType === 'ks';
  const isEk = contextType === 'ek';
  const ekVerseList = isEk && vdn === undefined;
  const currentVerseDn = vdn !== undefined ? parseInt(vdn, 10) : 0;

  const showOnlyNew = useAppStore((s) => s.showOnlyNew);
  const toggleShowOnlyNew = useAppStore((s) => s.toggleShowOnlyNew);

  const gameMode = useAppStore((s) => s.gameMode);
  const explorationPath = useAppStore((s) => s.explorationPath);
  const addToPath = useAppStore((s) => s.addToPath);
  const truncatePath = useAppStore((s) => s.truncatePath);
  const clearPath = useAppStore((s) => s.clearPath);
  const batchSetStatus = useBatchSetStatus();
  const setOptionStatus = useSetOptionStatus();

  const { data: locationData, isLoading: versesLoading } =
    useLocationVerses(locationDn);
  const { data: progressData } = useLocationProgress(locationDn);
  const { data: ekData, isLoading: ekLoading } = useEkData();

  const ekLocation = useMemo(
    () => ekVerseList && ekData ? ekData.locations.find((l) => l.locationDn === locationDn) : undefined,
    [ekVerseList, ekData, locationDn],
  );

  const statusMap = useMemo(() => {
    const map = new Map<number, OptionStatus>();
    if (progressData?.optionStatuses) {
      for (const [id, status] of Object.entries(progressData.optionStatuses)) {
        map.set(Number(id), status as OptionStatus);
      }
    }
    return map;
  }, [progressData]);

  const { data: remainingData } = useRemaining(
    ekVerseList ? 0 : locationDn,
    isKs || isEk ? currentVerseDn : undefined,
  );

  const gatewayIds = useMemo(() => {
    if (!remainingData?.remaining) return new Set<number>();
    const ids = new Set<number>();
    for (const rem of remainingData.remaining) {
      for (const step of rem.pathFromEntry) {
        const status = statusMap.get(step.optionId) ?? 'available';
        if (status === 'visited' || status === 'closed') {
          ids.add(step.optionId);
        }
      }
    }
    return ids;
  }, [remainingData, statusMap]);

  const pendingIds = useMemo(
    () => gameMode ? new Set(explorationPath.map((e) => e.optionId)) : new Set<number>(),
    [explorationPath, gameMode],
  );

  const currentVerse = useMemo(
    () => locationData?.verses.find((v) => v.displayNumber === currentVerseDn),
    [locationData, currentVerseDn],
  );

  const completedPaths = remainingData?.completedPaths ?? 0;
  const totalPaths = remainingData?.totalPaths ?? 0;

  const handleOptionClick = useCallback(
    (option: Option) => {
      // Always track navigation (except end)
      if (option.targetType !== 'end') {
        addToPath(option.id, currentVerseDn, locationDn);
        hapticLight();
      }

      // Game mode end: batch mark entire path + this option
      if (gameMode && option.targetType === 'end') {
        const allOptionIds = [
          ...explorationPath.map((e) => e.optionId),
          option.id,
        ];
        batchSetStatus.mutate({ optionIds: allOptionIds, status: 'visited' }, {
          onSuccess: () => {
            hapticSuccess();
          },
        });
      }

      // Navigation
      if (option.targetType === 'verse' && option.targetVerseDn !== null) {
        navigate(`/location/${locationDn}/verse/${option.targetVerseDn}`, {
          replace: true,
        });
      } else if (
        option.targetType === 'cross_location' &&
        option.targetLocationDn
      ) {
        const targetVerse = option.targetVerseDn ?? 0;
        navigate(`/location/${option.targetLocationDn}/verse/${targetVerse}`);
      } else if (option.targetType === 'end') {
        clearPath();
        navigate('/');
      } else if (option.conditionalTargets?.length) {
        const verseTarget = option.conditionalTargets.find(
          (ct) => ct.verse !== undefined && ct.target !== 'end',
        );
        if (verseTarget?.verse !== undefined) {
          if (verseTarget.location !== undefined) {
            navigate(`/location/${verseTarget.location}/verse/${verseTarget.verse}`);
          } else {
            navigate(`/location/${locationDn}/verse/${verseTarget.verse}`, {
              replace: true,
            });
          }
        }
      }
    },
    [gameMode, explorationPath, addToPath, clearPath, batchSetStatus, currentVerseDn, locationDn, navigate],
  );

  const handleStatusChange = useCallback(
    (optionId: number, status: OptionStatus) => {
      setOptionStatus.mutate({ optionId, status });
      hapticLight();
    },
    [setOptionStatus],
  );

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];
    let prevLocationDn: number | null = null;

    for (let i = 0; i < explorationPath.length; i++) {
      const entry = explorationPath[i];
      if (entry.locationDn !== prevLocationDn) {
        const entryIsKs = getContextType(entry.locationDn) === 'ks';
        items.push({
          label: entryIsKs ? 'КС' : formatLocationNumber(entry.locationDn),
          type: 'location',
          onClick: () => {
            truncatePath(i);
            navigate(`/location/${entry.locationDn}/verse/${entry.verseDn}`, { replace: true });
          },
        });
        prevLocationDn = entry.locationDn;
      }
      items.push({
        label: `#${entry.verseDn}`,
        type: 'verse',
        onClick: () => {
          truncatePath(i);
          navigate(`/location/${entry.locationDn}/verse/${entry.verseDn}`, { replace: true });
        },
      });
    }

    if (locationDn !== prevLocationDn) {
      items.push({
        label: isKs ? 'КС' : formatLocationNumber(locationDn),
        type: 'location',
      });
    }
    items.push({
      label: `#${currentVerseDn}`,
      type: 'verse',
      current: true,
    });
    return items;
  }, [locationDn, explorationPath, currentVerseDn, navigate, truncatePath, isKs]);

  if (ekVerseList) {
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Navigation bar */}
      <div className="px-4 py-2.5 bg-bg-card border-b border-separator flex items-center gap-3">
        <button
          onClick={() => {
            if (isEk) {
              clearPath();
              navigate(`/location/${locationDn}`);
            } else {
              const startLocationDn = explorationPath[0]?.locationDn ?? locationDn;
              const tab = getContextType(startLocationDn);
              clearPath();
              navigate('/', { state: { tab } });
            }
          }}
          className="text-rune text-[13px]"
        >
          &#8249; Назад
        </button>
        <div>
          <div className="text-[15px] font-semibold">
            Строфа #{currentVerseDn}
          </div>
          <div className="text-xs text-text-secondary">
            {isKs ? 'Книга секретов' : `Лок. ${formatLocationNumber(locationDn)}`}
            {!isKs && locationData?.name && ` · ${locationData.name}`}
          </div>
        </div>
      </div>

      {/* Mode strip */}
      <ModeStrip />

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Toggle + stats */}
      <div className="px-4 flex items-center justify-between">
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
        <span className="text-xs text-text-secondary tabular-nums">
          {completedPaths}/{totalPaths}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        {versesLoading && <StateMessage text="Менгиры пробуждаются..." />}

        {currentVerse && (
          <VerseCard
            verse={currentVerse}
            statusMap={statusMap}
            pendingIds={pendingIds}
            gatewayIds={gatewayIds}
            showOnlyNew={showOnlyNew}
            onOptionClick={handleOptionClick}
            onStatusChange={gameMode ? handleStatusChange : undefined}
          />
        )}

        {!versesLoading && !currentVerse && (
          <div className="p-8 text-center text-text-secondary text-sm">
            Строфа #{currentVerseDn} не найдена
          </div>
        )}
      </div>
    </div>
  );
}
