import ModeStrip from './ModeStrip';

export default function Header() {
  return (
    <>
      <header
        className="sticky top-0 z-[100] text-center border-b border-rune/20"
        style={{
          background: 'linear-gradient(180deg, #1c2428 0%, #141a1c 100%)',
          paddingTop: 'max(12px, env(safe-area-inset-top))',
        }}
      >
        <div className="px-4 pb-2.5">
          <div className="text-rune text-xl leading-none">⟐</div>
          <h1
            className="font-heading text-text-primary text-xl font-semibold tracking-[2px] mt-1 mb-0.5"
            style={{ textShadow: '0 0 12px var(--color-rune-glow)' }}
          >
            Kings of Ruin
          </h1>
          <p className="text-rune/70 text-[10px] uppercase tracking-[2px]">
            Tainted Grail
          </p>
          <div className="fantasy-divider w-[60%] mx-auto mt-3" />
        </div>
      </header>

      <ModeStrip />
    </>
  );
}
