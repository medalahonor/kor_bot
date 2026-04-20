import { useMemo, useState } from 'react';
import LocationSearchBar from '@/components/LocationSearchBar';
import StateMessage from '@/components/StateMessage';
import ChapterSection from '@/components/ChapterSection';
import AddLocationDialog from '@/components/AddLocationDialog';
import { Button } from '@/components/ui/button';
import {
  useChapters,
  useLocations,
  useLocationProgressMap,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  useUpdateChapterLocations,
} from '@/api/queries';
import { matchesLocationSearch } from '@/lib/formatLocationNumber';
import { ApiError } from '@/api/client';
import { KS_LOCATION_DNS, EK_LOCATION_DNS, HIDDEN_LOCATION_DNS } from '@tg/shared';

interface ChaptersTabProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  initialChapterCode?: string;
}

export default function ChaptersTab({
  searchQuery,
  onSearchChange,
  initialChapterCode,
}: ChaptersTabProps) {
  const { data: chapters, isLoading, error, refetch } = useChapters();
  const { data: allLocations } = useLocations();
  const progressMap = useLocationProgressMap();

  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const updateLocations = useUpdateChapterLocations();

  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    initialChapterCode ? new Set([initialChapterCode]) : new Set(),
  );
  const [addDialogChapterId, setAddDialogChapterId] = useState<number | null>(null);

  const chapterEligibleLocations = useMemo(() => {
    if (!allLocations) return [];
    return allLocations.filter(
      (l) =>
        !KS_LOCATION_DNS.has(l.displayNumber) &&
        !EK_LOCATION_DNS.has(l.displayNumber) &&
        !HIDDEN_LOCATION_DNS.has(l.displayNumber),
    );
  }, [allLocations]);

  const searchMatchedCodes = useMemo(() => {
    if (!chapters) return new Set<string>();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return new Set<string>();
    const matched = new Set<string>();
    for (const ch of chapters) {
      for (const loc of ch.locations) {
        if (
          loc.name.toLowerCase().includes(q) ||
          matchesLocationSearch(loc.dn, q)
        ) {
          matched.add(ch.code);
          break;
        }
      }
    }
    return matched;
  }, [chapters, searchQuery]);

  const visibleChapters = useMemo(() => {
    if (!chapters) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chapters;
    return chapters
      .map((ch) => ({
        ...ch,
        locations: ch.locations.filter(
          (loc) =>
            loc.name.toLowerCase().includes(q) ||
            matchesLocationSearch(loc.dn, q),
        ),
      }))
      .filter((ch) => ch.locations.length > 0);
  }, [chapters, searchQuery]);

  const isChapterOpen = (code: string) =>
    expanded.has(code) || searchMatchedCodes.has(code);

  const toggleChapter = (code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  // Вся CRUD-линия для MVP обрабатывается через window.prompt/confirm/alert —
  // реальные модалки (через design-review) придут позже.
  const runMutation = async <T,>(op: () => Promise<T>, errorMessage: string) => {
    try {
      await op();
    } catch (err) {
      alert(formatError(err, errorMessage));
    }
  };

  const handleCreateChapter = async () => {
    const title = window.prompt('Название главы:');
    if (!title) return;
    const code = window.prompt('Код главы (короткий идентификатор, уникален):', title);
    if (!code) return;
    const orderInput = window.prompt('Порядок в списке (число, 0+):', '99');
    const menuOrder = Number(orderInput);
    if (!Number.isFinite(menuOrder) || menuOrder < 0) return;
    await runMutation(
      () => createChapter.mutateAsync({ code, title, menuOrder }),
      'Не удалось создать главу',
    );
  };

  const handleRenameChapter = async (chapterId: number, currentTitle: string) => {
    const title = window.prompt('Новое название:', currentTitle);
    if (!title || title === currentTitle) return;
    await runMutation(
      () => updateChapter.mutateAsync({ chapterId, title }),
      'Не удалось переименовать главу',
    );
  };

  const handleDeleteChapter = async (chapterId: number, title: string) => {
    if (!window.confirm(`Удалить главу «${title}»? Глава должна быть пустой.`)) return;
    await runMutation(
      () => deleteChapter.mutateAsync({ chapterId }),
      'Не удалось удалить главу',
    );
  };

  const handleRemoveLocation = (chapterId: number, dn: number) =>
    runMutation(
      () => updateLocations.mutateAsync({ chapterId, removeLocations: [dn] }),
      'Не удалось удалить локацию из главы',
    );

  const handleAddLocation = (chapterId: number, dn: number) =>
    runMutation(
      () => updateLocations.mutateAsync({ chapterId, addLocations: [dn] }),
      'Не удалось добавить локацию в главу',
    );

  const addDialogChapter = chapters?.find((c) => c.id === addDialogChapterId) ?? null;
  const addDialogAlreadyIn = useMemo(
    () => new Set((addDialogChapter?.locations ?? []).map((l) => l.dn)),
    [addDialogChapter],
  );

  return (
    <>
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <div className="flex-1">
          <LocationSearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Поиск по главам"
          />
        </div>
        <Button
          variant={editing ? 'default' : 'outline'}
          size="sm"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? 'Готово' : 'Править'}
        </Button>
      </div>

      {editing && (
        <div className="px-4 pb-3">
          <Button variant="outline" size="sm" onClick={handleCreateChapter}>
            + Новая глава
          </Button>
        </div>
      )}

      {isLoading && <StateMessage text="Авалон пробуждается..." />}

      {error && (
        <StateMessage
          error
          text="Связь с менгирами потеряна."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && chapters && chapters.length === 0 && !editing && (
        <div className="px-6 py-16 flex flex-col items-center gap-4 text-center">
          <div className="text-text-secondary text-[13px]">
            Ещё нет ни одной главы для этой кампании.
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Править
          </Button>
        </div>
      )}

      {!isLoading && !error && chapters && chapters.length > 0 && (
        <div className="flex-1 overflow-y-auto pb-8">
          {visibleChapters.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              Ничего не найдено
            </div>
          ) : (
            visibleChapters.map((ch) => (
              <ChapterSection
                key={ch.id}
                chapter={ch}
                open={isChapterOpen(ch.code)}
                onToggle={() => toggleChapter(ch.code)}
                editing={editing}
                progressMap={progressMap}
                onRemoveLocation={(dn) => handleRemoveLocation(ch.id, dn)}
                onAddLocationClick={() => setAddDialogChapterId(ch.id)}
                onRenameClick={() => handleRenameChapter(ch.id, ch.title)}
                onDeleteClick={() => handleDeleteChapter(ch.id, ch.title)}
              />
            ))
          )}
        </div>
      )}

      <AddLocationDialog
        open={addDialogChapter !== null}
        onClose={() => setAddDialogChapterId(null)}
        onPick={(dn) => {
          if (addDialogChapter) handleAddLocation(addDialogChapter.id, dn);
        }}
        candidates={chapterEligibleLocations}
        alreadyInChapter={addDialogAlreadyIn}
      />
    </>
  );
}

function formatError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
