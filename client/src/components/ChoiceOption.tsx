import { useAppStore } from '../stores/app';
import EditOption from './admin/EditOption';
import StatusPicker from './StatusPicker';
import type { Option, OptionStatus } from '@tg/shared';
import { formatLocationRef } from '../lib/formatLocationNumber';

interface ChoiceOptionProps {
  option: Option;
  status: OptionStatus;
  pending?: boolean;
  onClick: () => void;
  onStatusChange?: (optionId: number, status: OptionStatus) => void;
}

function getAccentClass(option: Option, status: OptionStatus, pending: boolean): string {
  if (option.type === 'condition') return '';
  if (status === 'visited') return 'choice-accent-green';
  if (status === 'requirements_not_met') return 'choice-accent-amber';
  if (status === 'closed') return 'choice-accent-red';
  if (pending) return 'choice-accent-blue';
  if (option.targetType === 'end') return 'choice-accent-red';
  if (option.requirement) return 'choice-accent-amber';
  return 'choice-accent-default';
}

function getGlowClass(option: Option, status: OptionStatus): string {
  if (option.type === 'condition') return '';
  if (status === 'visited') return 'shadow-[inset_0_0_30px_rgba(90,138,90,0.06)]';
  if (status === 'requirements_not_met') return 'shadow-[inset_0_0_30px_rgba(224,160,64,0.06)]';
  if (status === 'closed') return 'shadow-[inset_0_0_30px_rgba(224,96,96,0.06)]';
  return '';
}

function getTextColor(option: Option, status: OptionStatus, pending: boolean): string {
  if (option.type === 'condition') {
    if (status === 'visited') return 'text-green';
    if (status === 'closed') return 'text-red';
    if (pending) return 'text-blue';
    return 'text-amber';
  }
  if (status === 'visited') return 'text-green';
  if (status === 'requirements_not_met') return 'text-amber';
  if (status === 'closed') return 'text-red';
  if (pending) return 'text-blue';
  if (option.targetType === 'end') return 'text-red';
  return 'text-choice';
}

// condition использует ту же форму/padding/border что и choice —
// визуально это «вариант» choice с amber-фоном и italic текстом,
// осознанное отклонение от темы 2 ради унификации размера и touch target.
// border-l-[3px] совпадает по ширине с .choice-accent-*::before (width: 3px в index.css),
// чтобы полоски слева выглядели одинаково на обоих вариантах.
function getContainerClass(option: Option, status: OptionStatus, pending: boolean): string {
  if (option.type === 'condition') {
    let borderColor = 'border-l-amber';
    if (status === 'visited') borderColor = 'border-l-green';
    else if (status === 'closed') borderColor = 'border-l-red';
    else if (pending) borderColor = 'border-l-blue';
    return `px-4 py-3.5 bg-amber-dim border border-separator border-l-[3px] ${borderColor} italic hover:border-rune transition-colors`;
  }
  return 'px-4 py-3.5 bg-bg-card border border-separator hover:border-rune transition-colors';
}

function getTargetLabel(option: Option): { text: string; className: string } | null {
  const base = 'font-semibold uppercase tracking-[0.12em]';
  if (option.targetType === 'end') {
    return { text: 'Конец', className: `text-red ${base}` };
  }
  if (option.targetType === 'cross_location' && option.targetLocationDn) {
    return {
      text: `→ ${formatLocationRef(option.targetLocationDn!, option.targetVerseDn)}`,
      className: `text-rune ${base}`,
    };
  }
  if (option.targetType === 'verse' && option.targetVerseDn !== null) {
    return { text: `→ #${option.targetVerseDn}`, className: `text-rune ${base}` };
  }
  if (option.conditionalTargets?.length) {
    const targets = option.conditionalTargets
      .filter((ct) => ct.verse !== undefined)
      .map((ct) =>
        ct.location !== undefined
          ? formatLocationRef(ct.location, ct.verse)
          : `#${ct.verse}`,
      );
    if (targets.length > 0) {
      return { text: `→ ${targets.join(' / ')}`, className: `text-rune ${base}` };
    }
  }
  return null;
}

function isCyclic(option: Option): boolean {
  return option.result?.includes('Сделайте новый выбор') ?? false;
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
