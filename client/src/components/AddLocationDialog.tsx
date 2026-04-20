import { useMemo, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatLocationNumber, matchesLocationSearch } from '@/lib/formatLocationNumber';
import type { Location } from '@tg/shared';

interface AddLocationDialogProps {
  open: boolean;
  onClose: () => void;
  onPick: (dn: number) => void;
  candidates: Location[];
  alreadyInChapter: ReadonlySet<number>;
}

export default function AddLocationDialog({
  open,
  onClose,
  onPick,
  candidates,
  alreadyInChapter,
}: AddLocationDialogProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) || matchesLocationSearch(loc.displayNumber, q),
    );
  }, [candidates, query]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setQuery('');
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] max-h-[80vh]
            -translate-x-1/2 -translate-y-1/2 flex flex-col
            rounded-lg border border-separator bg-bg-card text-text-primary
            shadow-2xl outline-none"
        >
          <div className="px-4 pt-4 pb-3 border-b border-separator">
            <Dialog.Title className="font-heading text-[16px] font-medium">
              Добавить локацию
            </Dialog.Title>
            <div className="mt-3">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по номеру или названию"
                className="h-9 text-[13px]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-sm">Ничего не найдено</div>
            ) : (
              <ul className="flex flex-col gap-1">
                {filtered.map((loc) => {
                  const already = alreadyInChapter.has(loc.displayNumber);
                  return (
                    <li key={loc.id}>
                      <button
                        type="button"
                        disabled={already}
                        onClick={() => {
                          onPick(loc.displayNumber);
                          setQuery('');
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md
                          hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed
                          text-left"
                      >
                        <span className="min-w-[56px] font-heading text-rune text-[15px]">
                          {formatLocationNumber(loc.displayNumber)}
                        </span>
                        <span className="flex-1 text-[14px] truncate">{loc.name}</span>
                        {already && (
                          <span className="text-[11px] text-text-secondary/80">уже в главе</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-4 py-3 border-t border-separator flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
