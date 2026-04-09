import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  type: 'location' | 'verse';
  onClick?: () => void;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

interface BreadcrumbGroup {
  location: BreadcrumbItem;
  verses: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const groups = useMemo(() => {
    const result: BreadcrumbGroup[] = [];
    for (const item of items) {
      if (item.type === 'location') {
        result.push({ location: item, verses: [] });
      } else if (result.length > 0) {
        result[result.length - 1].verses.push(item);
      }
    }
    return result;
  }, [items]);

  return (
    <div data-testid="breadcrumb" className="px-3 py-2 flex flex-wrap items-center text-xs">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center" data-testid="breadcrumb-group">
          {gi > 0 && (
            <span data-testid="breadcrumb-separator" className="text-text-secondary opacity-30 text-[0.7rem] mx-1">
              ›
            </span>
          )}

          {/* Location node */}
          {group.location.onClick ? (
            <button
              onClick={group.location.onClick}
              className="min-h-9 flex items-center gap-1.5 px-1 cursor-pointer transition-colors group/loc"
            >
              <span className="w-2 h-2 rotate-45 rounded-[1px] border-[1.5px] border-amber bg-amber/15 group-hover/loc:bg-amber/30 transition-colors" />
              <span className="font-heading text-amber text-[0.66rem] tracking-wide group-hover/loc:text-[#f0b850] transition-colors">
                {group.location.label}
              </span>
            </button>
          ) : (
            <span className="min-h-9 flex items-center gap-1.5 px-1">
              <span className="w-2 h-2 rotate-45 rounded-[1px] border-[1.5px] border-amber bg-amber/15" />
              <span className="font-heading text-amber text-[0.66rem] tracking-wide">
                {group.location.label}
              </span>
            </span>
          )}

          {/* Verses */}
          {group.verses.map((verse, vi) => (
            <div key={vi} className="flex items-center">
              <span className="w-2 h-[1.5px] bg-separator" />
              {verse.onClick && !verse.current ? (
                <button
                  onClick={verse.onClick}
                  className="min-h-9 flex items-center gap-1.5 px-1 cursor-pointer transition-colors group/verse"
                >
                  <span className="w-[7px] h-[7px] rounded-full border-[1.5px] border-text-secondary bg-bg-card group-hover/verse:border-text-primary transition-colors" />
                  <span className="text-text-secondary text-[0.7rem] group-hover/verse:text-text-primary transition-colors">
                    {verse.label}
                  </span>
                </button>
              ) : verse.current ? (
                <span data-current="true" className="min-h-9 flex items-center gap-1.5 px-1">
                  <span className="w-[7px] h-[7px] rounded-full border-[1.5px] border-rune bg-rune shadow-[0_0_8px_var(--color-rune-dim)]" />
                  <span className="text-rune font-semibold text-[0.7rem]">
                    {verse.label}
                  </span>
                </span>
              ) : (
                <span className="min-h-9 flex items-center gap-1.5 px-1">
                  <span className="w-[7px] h-[7px] rounded-full border-[1.5px] border-text-secondary bg-bg-card" />
                  <span className="text-text-secondary text-[0.7rem]">
                    {verse.label}
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
