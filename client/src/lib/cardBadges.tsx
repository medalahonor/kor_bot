import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

const BADGE_BASE = 'h-auto rounded-none text-[10px] font-semibold uppercase tracking-[0.12em] tabular-nums';

export function renderRemainingBadge(remaining: number, done: boolean): ReactNode {
  if (remaining > 0) {
    return (
      <Badge
        variant="outline"
        className={`${BADGE_BASE} bg-amber-dim text-amber border-amber/20`}
      >
        {remaining} осталось
      </Badge>
    );
  }
  if (done) {
    return (
      <Badge
        variant="outline"
        className={`${BADGE_BASE} bg-green-dim text-green-bright border-green/20`}
      >
        &#10003; Пройдено
      </Badge>
    );
  }
  return null;
}
