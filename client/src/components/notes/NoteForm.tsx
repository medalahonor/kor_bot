import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import type { NotePath, NoteType } from '@tg/shared';
import { Button } from '@/components/ui/button';
import { NOTE_LABELS, NOTE_TYPES } from '../../lib/noteLabels';
import { formatNotePath } from '../../lib/formatLocationNumber';

const BODY_MAX = 2000;

interface NoteFormProps {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: { type: NoteType; body: string };
  attachmentPath?: NotePath | null;
  onSubmit: (values: { type: NoteType; body: string }) => Promise<void> | void;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
}

export default function NoteForm({
  open,
  mode,
  initial,
  attachmentPath,
  onSubmit,
  onClose,
  busy,
  error,
}: NoteFormProps) {
  const [type, setType] = useState<NoteType>(initial?.type ?? 'general');
  const [body, setBody] = useState(initial?.body ?? '');

  const trimmed = body.trim();
  const overflow = body.length > BODY_MAX;
  const canSubmit = trimmed.length > 0 && !overflow && !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({ type, body: trimmed });
  };

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
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,360px)]
            -translate-x-1/2 -translate-y-1/2 flex flex-col gap-3
            rounded-lg border border-separator bg-bg-card p-4 outline-none"
        >
          <Dialog.Title className="font-heading text-rune text-lg">
            {mode === 'create' ? 'Новая заметка' : 'Редактировать заметку'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-1.5">
              {NOTE_TYPES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={
                    'flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors ' +
                    (type === value
                      ? 'border-rune bg-rune/15 text-text-primary'
                      : 'border-separator text-text-secondary hover:border-rune/40')
                  }
                >
                  {NOTE_LABELS[value].singular}
                </button>
              ))}
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Текст заметки..."
              rows={6}
              className="w-full resize-none rounded-lg border border-input bg-transparent
                px-2.5 py-2 text-[13px] text-text-primary outline-none
                focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              autoFocus
            />

            <div className="flex items-start justify-between gap-2 text-[11px] text-text-secondary">
              <span className="flex-1 break-words">
                {attachmentPath && attachmentPath.length > 0
                  ? `Путь: ${formatNotePath(attachmentPath)}`
                  : 'Без привязки к строфе'}
              </span>
              <span className={overflow ? 'text-red tabular-nums' : 'tabular-nums'}>
                {body.length}/{BODY_MAX}
              </span>
            </div>

            {error && <p className="text-xs text-red">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={busy}
              >
                Отмена
              </Button>
              <Button type="submit" size="sm" disabled={!canSubmit}>
                {mode === 'create' ? 'Создать' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
