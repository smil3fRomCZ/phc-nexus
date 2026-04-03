interface SortableHeaderProps {
    field: string;
    label: string;
    sortField: string | null | undefined;
    sortDir: 'asc' | 'desc';
    onSort: (field: string) => void;
    className?: string;
}

const BASE_CLASS =
    'cursor-pointer select-none border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle hover:text-text-default';

export default function SortableHeader({ field, label, sortField, sortDir, onSort, className }: SortableHeaderProps) {
    const indicator = sortField === field ? (sortDir === 'desc' ? ' \u25BC' : ' \u25B2') : '';

    return (
        <th className={className ?? BASE_CLASS} onClick={() => onSort(field)}>
            {label}
            {indicator}
        </th>
    );
}

/** Non-sortable table header with consistent styling. */
export function PlainHeader({ label, className }: { label: string; className?: string }) {
    return (
        <th
            className={
                className ??
                'border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle'
            }
        >
            {label}
        </th>
    );
}
