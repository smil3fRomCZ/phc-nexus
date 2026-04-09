interface FilterDateProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

export default function FilterDate({ label, value, onChange }: FilterDateProps) {
    return (
        <div className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface-primary transition-colors hover:border-text-subtle focus-within:border-border-focus focus-within:shadow-[0_0_0_2px_var(--color-brand-soft)]">
            <span className="pl-2.5 text-[0.6875rem] font-semibold text-text-subtle">{label}:</span>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 cursor-pointer border-none bg-transparent pr-2 pl-0 text-sm text-text-default outline-none"
            />
        </div>
    );
}
