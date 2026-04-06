import { Search } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Hledat...', className }: SearchInputProps) {
    return (
        <div className={`relative ${className ?? ''}`}>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-text-muted" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-full rounded-md border border-border-default bg-surface-primary pl-8 pr-3 text-xs text-text-default outline-none transition-colors placeholder:text-text-subtle focus:border-brand-primary focus:ring-2 focus:ring-brand-soft sm:w-56"
            />
        </div>
    );
}
