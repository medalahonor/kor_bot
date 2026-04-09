interface StateMessageProps {
  text: string;
  error?: boolean;
  onRetry?: () => void;
}

/** Тематическое сообщение об ожидании/ошибке с глифом ⟐ — единым знаком предтеч во всём UI. */
export default function StateMessage({ text, error = false, onRetry }: StateMessageProps) {
  return (
    <div
      className={`mx-4 my-4 p-6 rounded-[14px] text-center ${
        error
          ? 'bg-red-dim border-l-2 border-red'
          : 'bg-bg-card border border-separator'
      }`}
    >
      <div className="font-heading text-rune text-xl mb-2" aria-hidden>
        ⟐
      </div>
      <p className={`text-sm ${error ? 'text-red' : 'text-text-secondary'}`}>
        {text}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 min-h-[44px] rounded-lg bg-bg-card border border-rune/30 text-rune text-xs font-semibold hover:bg-bg-elevated transition-colors"
        >
          Повторить
        </button>
      )}
    </div>
  );
}
