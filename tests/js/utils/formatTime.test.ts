import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatTime } from '@/utils/formatTime';

describe('formatTime', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('vrací "Právě teď" pro čas před méně než minutou', () => {
        const now = new Date();
        expect(formatTime(now.toISOString())).toBe('Právě teď');
    });

    it('vrací minuty pro čas před méně než hodinou', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-25T12:30:00Z'));

        expect(formatTime('2026-03-25T12:15:00Z')).toBe('15m');
        expect(formatTime('2026-03-25T12:25:00Z')).toBe('5m');
    });

    it('vrací hodiny pro čas před méně než dnem', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-25T18:00:00Z'));

        expect(formatTime('2026-03-25T15:00:00Z')).toBe('3h');
        expect(formatTime('2026-03-25T06:00:00Z')).toBe('12h');
    });

    it('vrací dny pro čas starší než den', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-25T12:00:00Z'));

        expect(formatTime('2026-03-24T12:00:00Z')).toBe('1d');
        expect(formatTime('2026-03-20T12:00:00Z')).toBe('5d');
    });
});
