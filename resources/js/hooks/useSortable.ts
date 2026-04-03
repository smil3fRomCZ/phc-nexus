import { useState, useMemo, useCallback } from 'react';

interface SortState {
    field: string | null;
    dir: 'asc' | 'desc';
}

/**
 * Client-side sorting hook — manages sort state and provides sorted data.
 * Use for tables that don't have server-side sorting (no pagination or client-filtered data).
 */
export function useClientSort<T>(
    data: T[],
    compareFn: (a: T, b: T, field: string) => number,
    defaultField?: string,
    defaultDir: 'asc' | 'desc' = 'asc',
) {
    const [sort, setSort] = useState<SortState>({ field: defaultField ?? null, dir: defaultDir });

    const toggle = useCallback(
        (field: string) => {
            setSort((prev) =>
                prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' },
            );
        },
        [],
    );

    const sorted = useMemo(() => {
        if (!sort.field) return data;
        const f = sort.field;
        return [...data].sort((a, b) => {
            const cmp = compareFn(a, b, f);
            return sort.dir === 'desc' ? -cmp : cmp;
        });
    }, [data, sort.field, sort.dir, compareFn]);

    return { sorted, sortField: sort.field, sortDir: sort.dir, toggle };
}
