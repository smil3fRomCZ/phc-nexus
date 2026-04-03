import { router } from '@inertiajs/react';
import { useCallback } from 'react';

/**
 * Returns an `applyFilter` function that updates a query parameter and navigates.
 *
 * @param url   — Target URL for router.get
 * @param filters — Current filter state (passed from server props). When provided,
 *                   the filter is merged into this object directly (avoids reading
 *                   window.location.search). When omitted, reads from URLSearchParams.
 * @param options — Extra Inertia visit options (e.g. `replace: true`)
 */
export function useFilterRouter(
    url: string,
    filters?: Record<string, string | undefined>,
    options?: { replace?: boolean },
) {
    return useCallback(
        (key: string, value: string) => {
            if (filters) {
                const params = { ...filters, [key]: value || undefined };
                router.get(url, params, { preserveState: true, ...options });
            } else {
                const params = new URLSearchParams(window.location.search);
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
                router.get(url, Object.fromEntries(params), { preserveState: true, ...options });
            }
        },
        [url, filters, options],
    );
}
