import { useAppStore } from '../stores/app';

export default function ModeStrip() {
  const gameMode = useAppStore((s) => s.gameMode);
  const adminMode = useAppStore((s) => s.adminMode);
  const toggleGameMode = useAppStore((s) => s.toggleGameMode);
  const toggleAdminMode = useAppStore((s) => s.toggleAdminMode);

  return (
    <div className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-bg-card border-b border-separator">
      <button
        onClick={toggleAdminMode}
        className={`
          inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold
          border transition-all
          ${
            adminMode
              ? 'bg-amber-dim text-amber border-amber/30 hover:bg-amber-dim hover:text-amber'
              : 'bg-bg-card text-text-secondary/70 border-separator hover:bg-bg-elevated hover:text-text-primary/80'
          }
        `}
      >
        <span className="text-[16px] leading-none">&#9998;</span>
        Редактор
      </button>

      <button
        onClick={toggleGameMode}
        className={`
          inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold
          border transition-all
          ${
            gameMode
              ? 'bg-rune/15 text-rune border-rune/30 hover:bg-rune/20 hover:text-rune'
              : 'bg-bg-card text-text-secondary/70 border-separator hover:bg-bg-elevated hover:text-text-primary/80'
          }
        `}
      >
        <span className="text-[16px] leading-none">&#9876;</span>
        Игра
      </button>
    </div>
  );
}
