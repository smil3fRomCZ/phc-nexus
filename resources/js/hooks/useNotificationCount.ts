import { useState, useEffect, useCallback } from 'react';

const POLL_INTERVAL = 60_000;

export default function useNotificationCount(initialCount: number = 0) {
    const [count, setCount] = useState(initialCount);

    const fetchCount = useCallback(async () => {
        try {
            const res = await fetch('/notifications/unread-count', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (res.ok) {
                const data = (await res.json()) as { count: number };
                setCount(data.count);
            }
        } catch {
            // Silently ignore network errors — next poll will retry
        }
    }, []);

    useEffect(() => {
        setCount(initialCount);
    }, [initialCount]);

    useEffect(() => {
        const interval = setInterval(fetchCount, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchCount]);

    return count;
}
