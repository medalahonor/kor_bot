import { Popover } from '@base-ui/react/popover';
import type { OptionStatus } from '@tg/shared';
import { STATUS_SVGS, LABEL_COLORS } from '../lib/statusIcons';

interface StatusPickerProps {
  status: OptionStatus;
  onStatusChange: (status: OptionStatus) => void;
}

const STATUSES: { value: OptionStatus; label: string; hint?: string }[] = [
  { value: 'available', label: 'Доступно' },
  { value: 'visited', label: 'Пройдено' },
  { value: 'requirements_not_met', label: 'Требования', hint: 'не выполнены' },
  { value: 'closed', label: 'Закрыто', hint: 'навсегда' },
];

export default function StatusPicker({ status, onStatusChange }: StatusPickerProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={<span />}
        nativeButton={false}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="flex-shrink-0 w-[22px] h-[22px] flex items-center justify-center cursor-pointer rounded-full transition-transform hover:scale-[1.15] border-none bg-transparent p-0"
        title="Изменить статус"
      >
        {STATUS_SVGS[status]}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} side="bottom" align="end">
          <Popover.Popup
            className="min-w-[180px] bg-bg-card border border-separator rounded-xl p-1.5 flex flex-col gap-0.5 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {STATUSES.map((s) => (
              <Popover.Close
                key={s.value}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onStatusChange(s.value);
                }}
                className={`
                  flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg
                  cursor-pointer border-none font-medium text-xs
                  transition-colors hover:bg-bg-elevated
                  ${status === s.value ? 'bg-bg-elevated outline outline-1 outline-white/8' : 'bg-transparent'}
                `}
              >
                <span className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                  {STATUS_SVGS[s.value]}
                </span>
                <span className={`flex-1 ${LABEL_COLORS[s.value]}`}>{s.label}</span>
                {s.hint && (
                  <span className="text-[10px] text-text-secondary opacity-70">{s.hint}</span>
                )}
              </Popover.Close>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
