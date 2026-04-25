import { useMemo, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import type { ContextType } from '@tg/shared';
import ModeStrip from '../../components/ModeStrip';
import Breadcrumb, { type BreadcrumbItem } from '../../components/Breadcrumb';
import VerseCard from '../../components/VerseCard';
import StateMessage from '../../components/StateMessage';
import ShowOnlyNewToggle from '../../components/ShowOnlyNewToggle';
import ResearchEndModal, {
  type ResearchEndModalState,
} from '../../components/ResearchEndModal';
import NotesPanel from '../../components/notes/NotesPanel';
import NoteForm from '../../components/notes/NoteForm';
import DeleteNoteDialog from '../../components/notes/DeleteNoteDialog';
import { useTelegramBackButton } from '../../hooks/useTelegramBackButton';
import { useNoteFormState } from '../../hooks/useNoteFormState';
import {
  useLocationVerses,
  useLocationProgress,
  useBatchSetStatus,
  useRemaining,
  useSetOptionStatus,
} from '../../api/queries';
import { useAppStore } from '../../stores/app';
import { hapticSuccess, hapticLight } from '../../lib/telegram';
import { classifyApiError } from '../../lib/classifyApiError';
import { getContextType, type Option, type OptionStatus } from '@tg/shared';
import { formatLocationNumber } from '../../lib/formatLocationNumber';

interface LocationVerseViewProps {
  locationDn: number;
  currentVerseDn: number;
  isKs: boolean;
  isEk: boolean;
}

export default function LocationVerseView({
  locationDn,
  currentVerseDn,
  isKs,
  isEk,
}: LocationVerseViewProps) {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const incomingState = (routerLocation.state as { tab?: ContextType; chapterCode?: string; returnTo?: string } | null) ?? null;

  useTelegramBackButton(incomingState?.returnTo);

  const optionNoteForm = useNoteFormState();

  const showOnlyNew = useAppStore((s) => s.showOnlyNew);

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
    locationDn,
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

  const historyPath = useMemo(
    () =>
      explorationPath.map((e) => ({
        locationDn: e.locationDn,
        verseDn: e.verseDn,
        optionId: e.optionId,
      })),
    [explorationPath],
  );

  const currentPath = useMemo(
    () => [...historyPath, { locationDn, verseDn: currentVerseDn }],
    [historyPath, locationDn, currentVerseDn],
  );

  const handleAddNoteForOption = useCallback(
    (optionId: number, target: { locationDn: number; verseDn: number }) => {
      optionNoteForm.openCreateFor({
        path: [
          ...historyPath,
          { locationDn, verseDn: currentVerseDn, optionId },
          { locationDn: target.locationDn, verseDn: target.verseDn },
        ],
        locationName: locationData?.name ?? null,
      });
    },
    [optionNoteForm, historyPath, locationDn, currentVerseDn, locationData?.name],
  );

  const currentVerse = useMemo(
    () => locationData?.verses.find((v) => v.displayNumber === currentVerseDn),
    [locationData, currentVerseDn],
  );

  const completedPaths = remainingData?.completedPaths ?? 0;
  const totalPaths = remainingData?.totalPaths ?? 0;

  const [endModal, setEndModal] = useState<
    | { state: ResearchEndModalState; payload: { allOptionIds: number[]; startLocationDn: number } }
    | null
  >(null);

  const submitEnd = useCallback(
    async (payload: { allOptionIds: number[]; startLocationDn: number }) => {
      setEndModal({ state: 'pending', payload });
      try {
        await batchSetStatus.mutateAsync({
          optionIds: payload.allOptionIds,
          status: 'visited',
        });
      } catch (err) {
        setEndModal({ state: { kind: 'error', message: classifyApiError(err) }, payload });
        return;
      }
      hapticSuccess();
      setEndModal(null);
      clearPath();
      navigate(`/location/${payload.startLocationDn}/verse/0`, { state: incomingState });
    },
    [batchSetStatus, clearPath, navigate, incomingState],
  );

  const retryEnd = useCallback(() => {
    if (endModal) void submitEnd(endModal.payload);
  }, [submitEnd, endModal]);

  const closeEndModal = useCallback(() => {
    setEndModal(null);
    batchSetStatus.reset();
  }, [batchSetStatus]);

  const handleOptionClick = useCallback(
    async (option: Option) => {
      if (option.targetType !== 'end') {
        addToPath(option.id, currentVerseDn, locationDn);
        hapticLight();
      }

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
        const startLocationDn = explorationPath[0]?.locationDn ?? locationDn;
        if (!gameMode) {
          clearPath();
          navigate(`/location/${startLocationDn}/verse/0`, { state: incomingState });
          return;
        }
        const allOptionIds = [...explorationPath.map((e) => e.optionId), option.id];
        await submitEnd({ allOptionIds, startLocationDn });
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
    [gameMode, explorationPath, addToPath, clearPath, currentVerseDn, locationDn, navigate, incomingState, submitEnd],
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

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-2.5 bg-bg-card border-b border-separator flex items-center gap-3">
        <button
          onClick={() => {
            if (isEk) {
              clearPath();
              navigate(`/location/${locationDn}`);
            } else if (incomingState?.tab === 'chapters') {
              clearPath();
              navigate('/', {
                state: { tab: 'chapters', chapterCode: incomingState.chapterCode },
              });
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

      <ModeStrip />

      <Breadcrumb items={breadcrumbItems} />

      {currentVerse && (
        <NotesPanel
          verseId={currentVerse.id}
          defaultPath={currentPath}
          locationName={locationData?.name ?? null}
        />
      )}

      <div className="mt-3 px-4 flex items-center justify-between">
        <ShowOnlyNewToggle />
        <span className="text-xs text-text-secondary tabular-nums">
          {completedPaths}/{totalPaths}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {versesLoading && <StateMessage text="Менгиры пробуждаются..." />}

        {currentVerse && (
          <VerseCard
            verse={currentVerse}
            currentLocationDn={locationDn}
            statusMap={statusMap}
            pendingIds={pendingIds}
            gatewayIds={gatewayIds}
            showOnlyNew={showOnlyNew}
            onOptionClick={handleOptionClick}
            onStatusChange={gameMode ? handleStatusChange : undefined}
            onAddNoteForOption={handleAddNoteForOption}
          />
        )}

        {!versesLoading && !currentVerse && (
          <div className="p-8 text-center text-text-secondary text-sm">
            Строфа #{currentVerseDn} не найдена
          </div>
        )}
      </div>

      {endModal !== null && (
        <ResearchEndModal
          state={endModal.state}
          onRetry={retryEnd}
          onClose={closeEndModal}
        />
      )}

      {optionNoteForm.form && (
        <NoteForm
          open
          mode={optionNoteForm.form.mode}
          initial={
            optionNoteForm.form.mode === 'edit'
              ? { type: optionNoteForm.form.note.type, body: optionNoteForm.form.note.body }
              : undefined
          }
          attachmentPath={
            optionNoteForm.form.mode === 'create'
              ? optionNoteForm.form.target.path
              : null
          }
          onSubmit={optionNoteForm.submit}
          onClose={optionNoteForm.closeForm}
          busy={optionNoteForm.busyForm}
          error={optionNoteForm.formError}
        />
      )}

      {optionNoteForm.deletingNote && (
        <DeleteNoteDialog
          open
          busy={optionNoteForm.busyDelete}
          error={optionNoteForm.deleteError}
          onConfirm={optionNoteForm.confirmDelete}
          onClose={optionNoteForm.closeDelete}
        />
      )}
    </div>
  );
}
