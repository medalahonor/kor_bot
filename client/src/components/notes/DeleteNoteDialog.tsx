import { Dialog } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';

interface DeleteNoteDialogProps {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteNoteDialog({
  open,
  busy,
  error,
  onConfirm,
  onClose,
}: DeleteNoteDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,320px)]
            -translate-x-1/2 -translate-y-1/2 flex flex-col gap-3
            rounded-lg border border-separator bg-bg-card p-4 text-center outline-none"
        >
          <Dialog.Title className="font-heading text-rune text-lg">
            Удалить заметку?
          </Dialog.Title>
          <Dialog.Description className="text-xs text-text-secondary">
            Действие необратимо.
          </Dialog.Description>

          {error && <p className="text-xs text-red">{error}</p>}

          <div className="flex gap-2 justify-center">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
              Отмена
            </Button>
            <Button variant="destructive" size="sm" onClick={onConfirm} disabled={busy}>
              Удалить
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
