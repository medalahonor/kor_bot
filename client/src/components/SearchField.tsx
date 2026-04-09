import { useState } from 'react';

interface SearchFieldProps {
  onSearch: (verseNumber: number) => void;
  placeholder?: string;
}

export default function SearchField({ onSearch, placeholder }: SearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      onSearch(num);
      setValue('');
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-full bg-bg-card border border-separator text-text-secondary text-xs flex items-center gap-1.5 transition-colors hover:border-rune/30"
      >
        <span>&#128269;</span>
        <span>Поиск</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? 'Номер строфы'}
        className="w-28 px-3 py-1.5 rounded-lg bg-bg-card border border-separator text-text-primary text-sm
          placeholder:text-text-secondary/50 focus:outline-none focus:border-rune/50"
      />
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg bg-rune/15 text-rune text-xs font-semibold border border-rune/30"
      >
        &#8250;
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setValue(''); }}
        className="text-text-secondary text-xs"
      >
        &#10005;
      </button>
    </form>
  );
}
