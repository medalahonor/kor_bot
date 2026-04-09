import { useState, useRef, useEffect } from 'react';

interface NumericAutocompleteProps {
  value: number | null;
  suggestions: number[];
  onChange: (value: number | null) => void;
  placeholder?: string;
}

export default function NumericAutocomplete({
  value,
  suggestions,
  onChange,
  placeholder = '',
}: NumericAutocompleteProps) {
  const [input, setInput] = useState(value !== null ? String(value) : '');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(value !== null ? String(value) : '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = input
    ? suggestions.filter((n) => String(n).startsWith(input))
    : suggestions;

  const handleInputChange = (val: string) => {
    setInput(val);
    setOpen(true);
    if (val === '') {
      onChange(null);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  const handleSelect = (num: number) => {
    setInput(String(num));
    onChange(num);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={input}
        onChange={(e) => handleInputChange(e.target.value.replace(/\D/g, ''))}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-2 py-1 text-xs bg-bg-card border border-separator rounded text-text-primary focus:outline-none focus:border-rune/50"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-0.5 w-full max-h-32 overflow-y-auto bg-bg-card border border-separator rounded shadow-lg">
          {filtered.slice(0, 50).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleSelect(n)}
              className="w-full text-left px-2 py-1 text-xs text-text-primary hover:bg-bg-elevated"
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
