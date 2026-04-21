import { Dialog } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';

export type ResearchEndModalState = 'pending' | { kind: 'error'; message: string };

interface ResearchEndModalProps {
  state: ResearchEndModalState;
  onRetry: () => void;
  onClose: () => void;
}

export default function ResearchEndModal({ state, onRetry, onClose }: ResearchEndModalProps) {
  const isPending = state === 'pending';

  return (
    <Dialog.Root
      open
      onOpenChange={(next) => {
        // Non-closable во время pending: backdrop-click / Esc игнорируются,
        // пока не пришёл ack от backend. В error-state dismiss — только через Закрыть.
        if (!next && !isPending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,320px)]
            -translate-x-1/2 -translate-y-1/2 flex flex-col items-center
            rounded-lg border border-separator bg-bg-card p-6 text-center
            shadow-2xl outline-none"
        >
          <div
            className={`font-heading text-rune text-2xl mb-3 ${isPending ? 'animate-pulse' : ''}`}
            aria-hidden
          >
            ⟐
          </div>

          {isPending ? (
            <Dialog.Description className="text-sm text-text-secondary">
              Завершение исследования...
            </Dialog.Description>
          ) : (
            <>
              <Dialog.Description className="mb-4 text-sm text-red">
                {state.message}
              </Dialog.Description>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Повторить
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Закрыть
                </Button>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
