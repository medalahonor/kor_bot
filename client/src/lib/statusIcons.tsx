import type { OptionStatus } from '@tg/shared';

export const STATUS_SVGS: Record<OptionStatus, React.ReactNode> = {
  available: (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
      <circle cx="10" cy="10" r="7" stroke="#666" strokeWidth="1.5" />
    </svg>
  ),
  visited: (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
      <circle cx="10" cy="10" r="7" fill="rgba(90,138,90,0.2)" stroke="var(--color-green)" strokeWidth="1.5" />
      <path d="M6.5 10l2 2 4-4.5" stroke="var(--color-green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  requirements_not_met: (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
      <circle cx="10" cy="10" r="7" fill="rgba(224,160,64,0.15)" stroke="var(--color-amber)" strokeWidth="1.5" />
      <text x="10" y="14" textAnchor="middle" fill="var(--color-amber)" fontSize="12" fontWeight="700">!</text>
    </svg>
  ),
  closed: (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
      <circle cx="10" cy="10" r="7" fill="rgba(224,96,96,0.15)" stroke="var(--color-red)" strokeWidth="1.5" />
      <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="var(--color-red)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

export const LABEL_COLORS: Record<OptionStatus, string> = {
  available: 'text-text-primary',
  visited: 'text-green',
  requirements_not_met: 'text-amber',
  closed: 'text-red',
};
