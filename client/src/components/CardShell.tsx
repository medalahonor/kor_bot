import type { ReactNode } from 'react';

interface CardShellProps {
  onClick: () => void;
  accent: 'default' | 'done';
  numberSlot: ReactNode;
  // 80 для локаций (номер «115-Б», до 5 символов),
  // 64 для КС-строф (номер до 4 символов без суффиксов).
  numberColumnMinWidth: 64 | 80;
  // Дополнительные классы правой колонки (обычно — flex-направление).
  contentClassName?: string;
  children: ReactNode;
}

export default function CardShell({
  onClick,
  accent,
  numberSlot,
  numberColumnMinWidth,
  contentClassName,
  children,
}: CardShellProps) {
  const minWidthClass = numberColumnMinWidth === 80 ? 'min-w-[80px]' : 'min-w-[64px]';
  const tintClass = accent === 'done' ? 'bg-green/[0.03]' : 'bg-rune/[0.03]';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-stretch bg-bg-card border border-separator text-left
        transition-colors duration-150
        hover:border-rune hover:shadow-[0_0_14px_rgba(94,200,216,0.1)]
        active:bg-bg-elevated"
    >
      <div
        className={`${minWidthClass} shrink-0 flex items-center justify-center
          py-3.5 px-1.5 border-r border-separator
          ${tintClass}`}
      >
        {numberSlot}
      </div>

      <div className={`flex-1 min-w-0 p-3.5 ${contentClassName ?? ''}`}>
        {children}
      </div>
    </button>
  );
}