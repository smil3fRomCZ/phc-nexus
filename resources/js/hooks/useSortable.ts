import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface SortState {
    field: string | null;
    dir: 'asc' | 'desc';
}

/**
 * Client-side sorting hook — manages sort state and provides sorted data.
 * Use for tables that don't have server-side sorting (no pagination or client-filtered data).
 *
 * The compareFn is stored in a ref so callers can pass inline functions
 * without causing unnecessary re-sorts.
 */
export function useClientSort<T>(
    data: T[],
    compareFn: (a: T, b: T, field: string) => number,
    defaultField?: string,
    defaultDir: 'asc' | 'desc' = 'asc',
) {
    const [sort, setSort] = useState<SortState>({ field: defaultField ?? null, dir: defaultDir });
    const compareFnRef = useRef(compareFn);

    useEffect(() => {
        compareFnRef.current = compareFn;
    });

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
        const fn = compareFnRef.current;
        return [...data].sort((a, b) => {
            const cmp = fn(a, b, f);
            return sort.dir === 'desc' ? -cmp : cmp;
        });
    }, [data, sort.field, sort.dir]);

    return { sorted, sortField: sort.field, sortDir: sort.dir, toggle };
}
