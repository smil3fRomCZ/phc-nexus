interface ProgressBarProps {
    value: number;
    max?: number;
    showLabel?: boolean;
    size?: 'sm' | 'md';
}

export default function ProgressBar({ value, max = 100, showLabel = false, size = 'sm' }: ProgressBarProps) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const heightClass = size === 'md' ? 'h-2.5' : 'h-1.5';

    return (
        <div className="flex items-center gap-2">
            <div className={`flex-1 overflow-hidden rounded-full bg-surface-secondary ${heightClass}`}>
                <div
                    className={`${heightClass} rounded-full bg-brand-primary transition-[width] duration-300`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel && <span className="text-xs font-medium text-text-muted">{pct} %</span>}
        </div>
    );
}
