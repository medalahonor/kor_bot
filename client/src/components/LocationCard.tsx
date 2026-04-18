import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import ProgressBar from './ProgressBar';
import type { Location } from '@tg/shared';
import { formatLocationNumber } from '../lib/formatLocationNumber';

interface LocationCardProps {
  location: Location;
  visited: number;
  total: number;
  visitedCyclic: number;
  totalCyclic: number;
}

export default function LocationCard({
  location,
  visited,
  total,
  visitedCyclic,
  totalCyclic,
}: LocationCardProps) {
  const navigate = useNavigate();
  const done = total > 0 && visited >= total;
  const remaining = total - visited;
  const hasCyclic = totalCyclic > 0;

  return (
    <button
      onClick={() => navigate(`/location/${location.displayNumber}`)}
      className="w-full flex items-stretch bg-bg-card border border-separator text-left
        transition-colors duration-150
        hover:border-rune hover:shadow-[0_0_14px_rgba(94,200,216,0.1)]
        active:bg-bg-elevated"
    >
      {/* Колонка номера: min-w-[80px] под «115-Б» (до 5 символов),
          shrink-0 явно запрещает сжатие под узкими viewport */}
      <div
        className={`min-w-[80px] shrink-0 flex items-center justify-center
          py-3.5 px-1.5 border-r border-separator
          ${done ? 'bg-green/[0.03]' : 'bg-rune/[0.03]'}`}
      >
        <span
          className={`font-heading text-[22px] font-medium tracking-[0.04em] whitespace-nowrap ${
            done
              ? 'text-green'
              : 'text-rune [text-shadow:0_0_4px_var(--color-rune-glow)]'
          }`}
        >
          {formatLocationNumber(location.displayNumber)}
        </span>
      </div>

      <div className="flex-1 min-w-0 p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="font-heading text-[17px] font-medium text-text-primary truncate">
            {location.name}
          </div>
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
      </div>
    </button>
  );
}
