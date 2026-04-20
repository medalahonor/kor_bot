import { useNavigate } from 'react-router';
import ProgressBar from './ProgressBar';
import CardShell from './CardShell';
import type { KsVerseEntry } from '@tg/shared';
import { renderRemainingBadge } from '../lib/cardBadges';

interface KsVerseCardProps {
  verse: KsVerseEntry;
}

export default function KsVerseCard({ verse }: KsVerseCardProps) {
  const navigate = useNavigate();
  const done = verse.totalPaths > 0 && verse.completedPaths >= verse.totalPaths;
  const remaining = verse.totalPaths - verse.completedPaths;

  return (
    <CardShell
      onClick={() => navigate(`/location/${verse.locationDn}/verse/${verse.verseDn}`)}
      accent={done ? 'done' : 'default'}
      numberColumnMinWidth={64}
      contentClassName="flex items-center gap-3"
      numberSlot={
        <span
          className={`font-heading text-[20px] font-medium tracking-[0.04em] whitespace-nowrap ${
            done
              ? 'text-green'
              : 'text-rune [text-shadow:0_0_4px_var(--color-rune-glow)]'
          }`}
        >
          {verse.verseDn}
        </span>
      }
    >
      <ProgressBar
        visited={verse.completedPaths}
        total={verse.totalPaths}
        visitedCyclic={verse.completedCyclic}
        totalCyclic={verse.totalCyclic}
      />
      {renderRemainingBadge(remaining, done)}
    </CardShell>
  );
}