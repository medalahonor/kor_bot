interface ProgressBarProps {
  visited: number;
  total: number;
  done?: boolean;
  visitedCyclic?: number;
  totalCyclic?: number;
  hideText?: boolean;
}

export default function ProgressBar({
  visited,
  total,
  visitedCyclic = 0,
  totalCyclic = 0,
  hideText = false,
}: ProgressBarProps) {
  const hasCyclic = totalCyclic > 0;
  const combinedTotal = total + totalCyclic;
  const mainPct = combinedTotal > 0 ? (visited / combinedTotal) * 100 : 0;
  const cyclicPct = combinedTotal > 0 ? (visitedCyclic / combinedTotal) * 100 : 0;
  const mainDone = total > 0 && visited >= total;
  const cyclicDone = totalCyclic > 0 && visitedCyclic >= totalCyclic;

  return (
    <div className="flex items-center gap-2 mt-1 flex-1 min-w-0">
      <div className="flex-1 h-0.5 bg-separator overflow-hidden flex">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${mainPct}%`,
            background: mainDone
              ? 'linear-gradient(90deg, #5e8a6a, #7ea888)'
              : 'linear-gradient(90deg, #5ec8d8, #7adfee)',
          }}
        />
        {hasCyclic && cyclicPct > 0 && (
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${cyclicPct}%`,
              background: cyclicDone
                ? 'linear-gradient(90deg, #5e8a6a, #7ea888)'
                : 'linear-gradient(90deg, #c89040, #d4a050)',
              backgroundImage: `repeating-linear-gradient(
                -45deg, transparent, transparent 2px,
                rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px
              )`,
            }}
          />
        )}
      </div>
      {!hideText && (
        <span className="text-[11px] text-text-secondary tabular-nums whitespace-nowrap">
          {visited}/{total}
          {hasCyclic && (
            <span className="text-text-secondary/60 ml-0.5">
              · {visitedCyclic}/{totalCyclic}↻
            </span>
          )}
        </span>
      )}
    </div>
  );
}
