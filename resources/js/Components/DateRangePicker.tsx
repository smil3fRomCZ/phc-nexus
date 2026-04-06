interface DateRangePickerProps {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    labelFrom?: string;
    labelTo?: string;
}

export default function DateRangePicker({
    from,
    to,
    onFromChange,
    onToChange,
    labelFrom = 'Od',
    labelTo = 'Do',
}: DateRangePickerProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface-primary transition-colors hover:border-text-subtle focus-within:border-border-focus focus-within:shadow-[0_0_0_2px_var(--color-brand-soft)]">
                <span className="pl-2.5 text-[0.6875rem] font-semibold text-text-subtle">{labelFrom}:</span>
                <input
                    type="date"
                    value={from}
                    onChange={(e) => onFromChange(e.target.value)}
                    max={to || undefined}
                    className="h-8 cursor-pointer border-none bg-transparent pr-2 pl-0 text-sm text-text-default outline-none"
                />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface-primary transition-colors hover:border-text-subtle focus-within:border-border-focus focus-within:shadow-[0_0_0_2px_var(--color-brand-soft)]">
                <span className="pl-2.5 text-[0.6875rem] font-semibold text-text-subtle">{labelTo}:</span>
                <input
                    type="date"
                    value={to}
                    onChange={(e) => onToChange(e.target.value)}
                    min={from || undefined}
                    className="h-8 cursor-pointer border-none bg-transparent pr-2 pl-0 text-sm text-text-default outline-none"
                />
            </div>
        </div>
    );
}
