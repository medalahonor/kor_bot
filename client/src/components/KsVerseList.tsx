import KsVerseCard from './KsVerseCard';
import type { KsVerseEntry } from '@tg/shared';

interface KsVerseListProps {
  verses: KsVerseEntry[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function KsVerseList({
  verses,
  page,
  totalPages,
  onPageChange,
}: KsVerseListProps) {
  if (verses.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary text-sm">
        Нет данных
      </div>
    );
  }

  return (
    <div>
      <div className="mx-4 flex flex-col gap-2.5">
        {verses.map((verse) => (
          <KsVerseCard key={`${verse.locationDn}:${verse.verseDn}`} verse={verse} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 px-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-medium
              bg-bg-card border border-separator text-text-secondary
              disabled:opacity-30 transition-colors hover:border-rune"
          >
            &#8249;
          </button>
          <span className="text-xs text-text-secondary tabular-nums">
            Стр. {page} из {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-medium
              bg-bg-card border border-separator text-text-secondary
              disabled:opacity-30 transition-colors hover:border-rune"
          >
            &#8250;
          </button>
        </div>
      )}
    </div>
  );
}
