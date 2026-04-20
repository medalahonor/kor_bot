import { useAppStore } from '../stores/app';
import EditOption from './admin/EditOption';
import StatusPicker from './StatusPicker';
import type { Option, OptionStatus } from '@tg/shared';
import {
  getAccentClass,
  getGlowClass,
  getTextColor,
  getContainerClass,
  getTargetLabel,
  isCyclic,
} from '../lib/optionStyles';

interface ChoiceOptionProps {
  option: Option;
  status: OptionStatus;
  pending?: boolean;
  onClick: () => void;
  onStatusChange?: (optionId: number, status: OptionStatus) => void;
}

export default function ChoiceOption({ option, status, pending = false, onClick, onStatusChange }: ChoiceOptionProps) {
  const adminMode = useAppStore((s) => s.adminMode);
  const isCondition = option.type === 'condition';
  const target = getTargetLabel(option);
  const cyclic = isCyclic(option);
  const textSize = isCondition ? 'text-sm italic' : 'text-sm font-medium';

  // div+role="button" вместо <button>: ChoiceOption содержит вложенные
  // интерактивные элементы (StatusPicker trigger, EditOption кнопки, input'ы),
  // а HTML <button> не может содержать другие button → nested button warning.
  // Проверка target===currentTarget: Space/Enter во вложенном input не должны
  // дёргать выбор родителя (пробел preventDefault'ился и превращался в переход).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`
        w-full text-left ${getContainerClass(option, status, pending)}
        relative cursor-pointer
        active:bg-bg-elevated active:scale-[0.99]
        ${getAccentClass(option, status, pending)}
        ${getGlowClass(option, status)}
        ${status === 'closed' ? 'opacity-45' : status === 'visited' ? 'opacity-55' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex-1 ${textSize} ${getTextColor(option, status, pending)} ${status === 'closed' ? 'line-through' : ''}`}>
          {option.text}
          {cyclic && <span className="ml-1 text-text-secondary">↻</span>}
        </div>

        {onStatusChange && (
          <StatusPicker
            status={status}
            onStatusChange={(newStatus) => onStatusChange(option.id, newStatus)}
          />
        )}
      </div>

      {option.requirement && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {option.requirement.split(/[.;]/).filter(Boolean).map((req, i) => (
            <span
              key={i}
              className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] bg-amber-dim text-amber border border-amber/30"
            >
              {req.trim()}
            </span>
          ))}
        </div>
      )}

      {option.result && (
        <div className="mt-1 text-xs text-green-bright opacity-90 not-italic">{option.result}</div>
      )}

      {target && (
        <div className="mt-1.5 text-right">
          <span className={`text-[10px] ${target.className} not-italic`}>
            {target.text}
          </span>
        </div>
      )}

      {adminMode && (
        <div onClick={(e) => e.stopPropagation()}>
          <EditOption option={option} />
        </div>
      )}
    </div>
  );
}
