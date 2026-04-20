import type { Option, OptionStatus } from '@tg/shared';
import { formatLocationRef } from './formatLocationNumber';

export function getAccentClass(option: Option, status: OptionStatus, pending: boolean): string {
  if (option.type === 'condition') return '';
  if (status === 'visited') return 'choice-accent-green';
  if (status === 'requirements_not_met') return 'choice-accent-amber';
  if (status === 'closed') return 'choice-accent-red';
  if (pending) return 'choice-accent-blue';
  if (option.targetType === 'end') return 'choice-accent-red';
  if (option.requirement) return 'choice-accent-amber';
  return 'choice-accent-default';
}

export function getGlowClass(option: Option, status: OptionStatus): string {
  if (option.type === 'condition') return '';
  if (status === 'visited') return 'shadow-[inset_0_0_30px_rgba(90,138,90,0.06)]';
  if (status === 'requirements_not_met') return 'shadow-[inset_0_0_30px_rgba(224,160,64,0.06)]';
  if (status === 'closed') return 'shadow-[inset_0_0_30px_rgba(224,96,96,0.06)]';
  return '';
}

export function getTextColor(option: Option, status: OptionStatus, pending: boolean): string {
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
export function getContainerClass(option: Option, status: OptionStatus, pending: boolean): string {
  if (option.type === 'condition') {
    let borderColor = 'border-l-amber';
    if (status === 'visited') borderColor = 'border-l-green';
    else if (status === 'closed') borderColor = 'border-l-red';
    else if (pending) borderColor = 'border-l-blue';
    return `px-4 py-3.5 bg-amber-dim border border-separator border-l-[3px] ${borderColor} italic hover:border-rune transition-colors`;
  }
  return 'px-4 py-3.5 bg-bg-card border border-separator hover:border-rune transition-colors';
}

export function getTargetLabel(option: Option): { text: string; className: string } | null {
  const base = 'font-semibold uppercase tracking-[0.12em]';
  if (option.targetType === 'end') {
    return { text: 'Конец', className: `text-red ${base}` };
  }
  if (option.targetType === 'cross_location' && option.targetLocationDn) {
    return {
      text: `→ ${formatLocationRef(option.targetLocationDn, option.targetVerseDn)}`,
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

export function isCyclic(option: Option): boolean {
  return option.result?.includes('Сделайте новый выбор') ?? false;
}
