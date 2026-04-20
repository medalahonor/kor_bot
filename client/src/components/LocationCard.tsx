import { useNavigate } from 'react-router';
import ProgressBar from './ProgressBar';
import CardShell from './CardShell';
import type { Location } from '@tg/shared';
import { formatLocationNumber } from '../lib/formatLocationNumber';
import { renderRemainingBadge } from '../lib/cardBadges';

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
    <CardShell
      onClick={() => navigate(`/location/${location.displayNumber}`)}
      accent={done ? 'done' : 'default'}
      numberColumnMinWidth={80}
      contentClassName="flex flex-col gap-2"
      numberSlot={
        <span
          className={`font-heading text-[22px] font-medium tracking-[0.04em] whitespace-nowrap ${
            done
              ? 'text-green'
              : 'text-rune [text-shadow:0_0_4px_var(--color-rune-glow)]'
          }`}
        >
          {formatLocationNumber(location.displayNumber)}
        </span>
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-heading text-[17px] font-medium text-text-primary truncate">
          {location.name}
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
  );
}