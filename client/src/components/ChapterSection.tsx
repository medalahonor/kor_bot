import { useNavigate } from 'react-router';
import ProgressBar from './ProgressBar';
import CardShell from './CardShell';
import { formatLocationNumber } from '@/lib/formatLocationNumber';
import { renderRemainingBadge } from '@/lib/cardBadges';
import type { Chapter, ChapterLocation } from '@tg/shared';

type ProgressInfo = {
  visited: number;
  total: number;
  visitedCyclic: number;
  totalCyclic: number;
};

interface ChapterSectionProps {
  chapter: Chapter;
  open: boolean;
  onToggle: () => void;
  editing: boolean;
  progressMap: Map<number, ProgressInfo>;
  onRemoveLocation: (dn: number) => void;
  onAddLocationClick: () => void;
  onRenameClick: () => void;
  onDeleteClick: () => void;
}

export default function ChapterSection({
  chapter,
  open,
  onToggle,
  editing,
  progressMap,
  onRemoveLocation,
  onAddLocationClick,
  onRenameClick,
  onDeleteClick,
}: ChapterSectionProps) {
  return (
    <section className="border-b border-separator">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3
          font-heading text-[15px] font-medium uppercase tracking-[0.04em]
          text-text-primary hover:bg-bg-elevated transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span
            className={`inline-block transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
          >
            ▸
          </span>
          <span>{chapter.title}</span>
          <span className="text-[11px] text-text-secondary/70">({chapter.locations.length})</span>
        </span>
        {editing && (
          <span className="flex gap-1.5">
            <EditIconButton label="Переименовать главу" onClick={onRenameClick}>
              ✎
            </EditIconButton>
            <EditIconButton
              label="Удалить главу"
              onClick={onDeleteClick}
              disabled={chapter.locations.length > 0}
            >
              ✕
            </EditIconButton>
          </span>
        )}
      </button>

      {open && (
        <div className="mx-4 mb-3 flex flex-col gap-2.5">
          {chapter.locations.length === 0 && !editing && (
            <div className="px-2 py-4 text-center text-text-secondary/80 text-[13px]">
              Нет локаций
            </div>
          )}
          {chapter.locations.map((loc) => (
            <ChapterLocationCard
              key={loc.dn}
              chapterCode={chapter.code}
              loc={loc}
              editing={editing}
              progress={progressMap.get(loc.dn)}
              onRemove={() => onRemoveLocation(loc.dn)}
            />
          ))}
          {editing && (
            <button
              type="button"
              onClick={onAddLocationClick}
              className="w-full py-2 border border-dashed border-rune/40 rounded
                text-[12px] text-rune/80 hover:bg-rune/5 transition-colors uppercase tracking-[0.06em]"
            >
              + Добавить локацию
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function EditIconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-7 h-7 flex items-center justify-center rounded
        text-text-secondary hover:text-text-primary hover:bg-bg-card
        disabled:opacity-30 disabled:cursor-not-allowed text-[14px]"
    >
      {children}
    </button>
  );
}

function ChapterLocationCard({
  chapterCode,
  loc,
  editing,
  progress,
  onRemove,
}: {
  chapterCode: string;
  loc: ChapterLocation;
  editing: boolean;
  progress: ProgressInfo | undefined;
  onRemove: () => void;
}) {
  const navigate = useNavigate();
  const visited = progress?.visited ?? 0;
  const total = progress?.total ?? 0;
  const visitedCyclic = progress?.visitedCyclic ?? 0;
  const totalCyclic = progress?.totalCyclic ?? 0;
  const done = total > 0 && visited >= total;
  const remaining = total - visited;
  const hasCyclic = totalCyclic > 0;

  const handleClick = () => {
    if (editing) return;
    navigate(`/location/${loc.dn}`, { state: { tab: 'chapters', chapterCode } });
  };

  return (
    <div className="relative">
      <CardShell
        onClick={handleClick}
        accent={done ? 'done' : 'default'}
        numberColumnMinWidth={80}
        contentClassName="flex flex-col gap-2"
        numberSlot={
          <span
            className={`font-heading text-[22px] font-medium tracking-[0.04em] whitespace-nowrap ${
              done ? 'text-green' : 'text-rune [text-shadow:0_0_4px_var(--color-rune-glow)]'
            }`}
          >
            {formatLocationNumber(loc.dn)}
          </span>
        }
      >
        <div className="flex items-center justify-between gap-2">
          <div className="font-heading text-[17px] font-medium text-text-primary truncate">
            {loc.name}
          </div>
          {renderRemainingBadge(remaining, done)}
        </div>
        <div className="flex items-center gap-2">
          <ProgressBar
            visited={visited}
            total={total}
            visitedCyclic={visitedCyclic}
            totalCyclic={totalCyclic}
            hideText
          />
          <span className="shrink-0 text-[11px] text-text-secondary tabular-nums whitespace-nowrap">
            {visited}/{total}
            {hasCyclic && (
              <span className="text-text-secondary/60 ml-0.5">
                · {visitedCyclic}/{totalCyclic}↻
              </span>
            )}
          </span>
        </div>
      </CardShell>

      {editing && (
        <button
          type="button"
          aria-label="Удалить из главы"
          title="Удалить из главы"
          onClick={onRemove}
          className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center
            rounded bg-bg-elevated/90 text-text-secondary hover:text-red
            hover:bg-red/10 text-[14px]"
        >
          ✕
        </button>
      )}
    </div>
  );
}
