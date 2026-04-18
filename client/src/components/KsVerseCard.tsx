import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import ProgressBar from './ProgressBar';
import type { KsVerseEntry } from '@tg/shared';

interface KsVerseCardProps {
  verse: KsVerseEntry;
}

export default function KsVerseCard({ verse }: KsVerseCardProps) {
  const navigate = useNavigate();
  const done = verse.totalPaths > 0 && verse.completedPaths >= verse.totalPaths;
  const remaining = verse.totalPaths - verse.completedPaths;

  return (
    <button
      onClick={() =>
        navigate(`/location/${verse.locationDn}/verse/${verse.verseDn}`)
      }
      className="w-full flex items-stretch bg-bg-card border border-separator text-left
        transition-colors duration-150
        hover:border-rune hover:shadow-[0_0_14px_rgba(94,200,216,0.1)]
        active:bg-bg-elevated"
    >
      {/* Колонка номера строфы — уже чем у локации (64px),
          т.к. номера строф без суффиксов (3-4 символа максимум) */}
      <div
        className={`min-w-[64px] shrink-0 flex items-center justify-center
          py-3.5 px-1.5 border-r border-separator
          ${done ? 'bg-green/[0.03]' : 'bg-rune/[0.03]'}`}
      >
        <span
          className={`font-heading text-[20px] font-medium tracking-[0.04em] whitespace-nowrap ${
            done
              ? 'text-green'
              : 'text-rune [text-shadow:0_0_4px_var(--color-rune-glow)]'
          }`}
        >
          {verse.verseDn}
        </span>
      </div>

      <div className="flex-1 min-w-0 p-3.5 flex items-center gap-3">
        <ProgressBar
          visited={verse.completedPaths}
          total={verse.totalPaths}
          visitedCyclic={verse.completedCyclic}
          totalCyclic={verse.totalCyclic}
        />
        {remaining > 0 ? (
          <Badge
            variant="outline"
            className="h-auto rounded-none text-[10px] font-semibold uppercase tracking-[0.12em] bg-amber-dim text-amber border-amber/20 tabular-nums"
          >
            {remaining} осталось
          </Badge>
        ) : done ? (
          <Badge
            variant="outline"
            className="h-auto rounded-none text-[10px] font-semibold uppercase tracking-[0.12em] bg-green-dim text-green-bright border-green/20"
          >
            &#10003; Пройдено
          </Badge>
        ) : null}
      </div>
    </button>
  );
}
