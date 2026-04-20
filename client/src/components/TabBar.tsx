import { Tabs } from '@base-ui/react/tabs';
import type { ContextType } from '@tg/shared';

const TABS: { id: ContextType; label: string }[] = [
  { id: 'locations', label: 'Локации' },
  { id: 'ks', label: 'Книга секретов' },
  { id: 'ek', label: 'Эхо краха' },
];

interface TabBarProps {
  active: ContextType;
  onChange: (tab: ContextType) => void;
}

// TabBar использует base-ui примитивы напрямую, чтобы получить чистые стили
// без фоновой подложки у активной вкладки из default variant.
export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <Tabs.Root value={active} onValueChange={(v) => onChange(v as ContextType)}>
      <Tabs.List className="flex w-full px-5 border-b border-separator">
        {TABS.map((tab) => (
          <Tabs.Tab
            key={tab.id}
            value={tab.id}
            className="
              relative flex-1 py-3 min-h-[48px] cursor-pointer
              bg-transparent border-0 outline-none
              font-body text-[10px] uppercase tracking-[0.16em] font-semibold
              text-text-secondary/60 transition-colors duration-150
              hover:text-text-secondary
              data-[active]:text-rune
              after:content-[''] after:absolute after:left-[15%] after:right-[15%]
              after:bottom-[-1px] after:h-0.5 after:bg-transparent
              data-[active]:after:bg-rune
              data-[active]:after:shadow-[0_0_8px_var(--color-rune-glow)]
            "
          >
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
