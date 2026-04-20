import { useAppStore } from '../stores/app';

export default function ShowOnlyNewToggle() {
  const showOnlyNew = useAppStore((s) => s.showOnlyNew);
  const toggleShowOnlyNew = useAppStore((s) => s.toggleShowOnlyNew);

  return (
    <div className="flex bg-bg-card rounded-lg p-0.5 border border-separator">
      <button
        onClick={() => showOnlyNew && toggleShowOnlyNew()}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          !showOnlyNew
            ? 'bg-bg-elevated text-text-primary font-semibold'
            : 'text-text-secondary'
        }`}
      >
        Все
      </button>
      <button
        onClick={() => !showOnlyNew && toggleShowOnlyNew()}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          showOnlyNew
            ? 'bg-bg-elevated text-text-primary font-semibold'
            : 'text-text-secondary'
        }`}
      >
        Только новые
      </button>
    </div>
  );
}
