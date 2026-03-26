import type { ReactNode } from 'react';

interface MetadataGridProps {
    columns?: 3 | 4;
    children: ReactNode;
}

export function MetadataGrid({ columns = 4, children }: MetadataGridProps) {
    const colClass = columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';

    return (
        <div
            className={`grid grid-cols-2 gap-4 rounded-lg border border-border-subtle bg-surface-secondary p-5 text-sm ${colClass}`}
        >
            {children}
        </div>
    );
}

interface MetadataFieldProps {
    label: string;
    children: ReactNode;
}

export function MetadataField({ label, children }: MetadataFieldProps) {
    return (
        <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">{label}</span>
            <p className="mt-1 font-medium text-text-strong">{children}</p>
        </div>
    );
}
