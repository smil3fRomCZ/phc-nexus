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
            <label className="text-xs text-text-muted">{labelFrom}</label>
            <input
                type="date"
                value={from}
                onChange={(e) => onFromChange(e.target.value)}
                max={to || undefined}
                className="rounded-md border border-border-default bg-surface-primary px-2.5 py-1.5 text-sm focus:border-border-focus focus:outline-none"
            />
            <label className="text-xs text-text-muted">{labelTo}</label>
            <input
                type="date"
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                min={from || undefined}
                className="rounded-md border border-border-default bg-surface-primary px-2.5 py-1.5 text-sm focus:border-border-focus focus:outline-none"
            />
        </div>
    );
}
