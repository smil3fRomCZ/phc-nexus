import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useNotificationCount from '@/hooks/useNotificationCount';

describe('useNotificationCount', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns initial count', () => {
        const { result } = renderHook(() => useNotificationCount(5));
        expect(result.current).toBe(5);
    });

    it('defaults to 0', () => {
        const { result } = renderHook(() => useNotificationCount());
        expect(result.current).toBe(0);
    });

    it('polls and updates count', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ count: 3 }),
        } as Response);

        const { result } = renderHook(() => useNotificationCount(0));

        // Advance past poll interval (60s)
        await act(async () => {
            vi.advanceTimersByTime(60_000);
        });

        expect(fetchSpy).toHaveBeenCalledWith('/notifications/unread-count', expect.objectContaining({
            headers: { Accept: 'application/json' },
        }));
        expect(result.current).toBe(3);
    });

    it('handles fetch errors gracefully', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useNotificationCount(7));

        await act(async () => {
            vi.advanceTimersByTime(60_000);
        });

        // Count should remain unchanged on error
        expect(result.current).toBe(7);
    });

    it('cleans up interval on unmount', () => {
        const clearSpy = vi.spyOn(globalThis, 'clearInterval');
        const { unmount } = renderHook(() => useNotificationCount(0));

        unmount();

        expect(clearSpy).toHaveBeenCalled();
    });
});
