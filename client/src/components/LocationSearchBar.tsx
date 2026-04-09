import { Input } from '@/components/ui/input';

interface LocationSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function LocationSearchBar({
  value,
  onChange,
  placeholder = 'Поиск по номеру или названию',
}: LocationSearchBarProps) {
  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-3.5 pr-8 rounded-lg bg-bg-card border-separator text-[13px] text-text-primary
          placeholder:text-text-secondary/40 focus-visible:border-rune/50 focus-visible:ring-rune/20"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-secondary/80 hover:text-text-primary text-sm"
        >
          &#10005;
        </button>
      )}
    </div>
  );
}
