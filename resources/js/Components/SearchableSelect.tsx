import { useRef, useState, useEffect } from 'react';

interface Option {
    value: string;
    label: string;
}

interface Props {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
}

export default function SearchableSelect({ label, value, onChange, options, placeholder = 'Vyberte...' }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedLabel = options.find((o) => o.value === value)?.label;

    const filtered = search ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleSelect(val: string) {
        onChange(val);
        setOpen(false);
        setSearch('');
    }

    function handleClear() {
        onChange('');
        setOpen(false);
        setSearch('');
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface-primary transition-colors hover:border-text-subtle focus-within:border-border-focus focus-within:shadow-[0_0_0_2px_var(--color-brand-soft)]">
                <span className="pl-2.5 text-[0.6875rem] font-semibold text-text-subtle">{label}:</span>
                <button
                    type="button"
                    onClick={() => {
                        setOpen(!open);
                        setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className="h-8 cursor-pointer border-none bg-transparent pr-6 pl-0 text-left text-sm text-text-default outline-none"
                >
                    {selectedLabel || placeholder}
                </button>
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-subtle hover:text-text-default"
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute left-0 z-50 mt-1 w-56 rounded-md border border-border-default bg-surface-primary shadow-md">
                    <div className="p-1.5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Hledat..."
                            className="w-full rounded border border-border-subtle bg-surface-primary px-2 py-1 text-xs focus:border-border-focus focus:outline-none"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="w-full px-3 py-1.5 text-left text-xs text-text-muted hover:bg-surface-hover"
                        >
                            {placeholder}
                        </button>
                        {filtered.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => handleSelect(o.value)}
                                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-surface-hover ${
                                    o.value === value
                                        ? 'bg-brand-soft font-semibold text-brand-primary'
                                        : 'text-text-default'
                                }`}
                            >
                                {o.label}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div className="px-3 py-2 text-xs text-text-muted">Žádné výsledky</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
