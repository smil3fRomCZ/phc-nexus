import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DateRangePicker from '@/Components/DateRangePicker';

describe('DateRangePicker', () => {
    it('renders from and to inputs', () => {
        render(<DateRangePicker from="" to="" onFromChange={() => {}} onToChange={() => {}} />);
        expect(screen.getByText('Od')).toBeInTheDocument();
        expect(screen.getByText('Do')).toBeInTheDocument();
    });

    it('calls onFromChange when from date changes', () => {
        const onFromChange = vi.fn();
        const { container } = render(
            <DateRangePicker from="" to="" onFromChange={onFromChange} onToChange={() => {}} />,
        );
        const inputs = container.querySelectorAll('input[type="date"]');
        fireEvent.change(inputs[0], { target: { value: '2026-01-01' } });
        expect(onFromChange).toHaveBeenCalledWith('2026-01-01');
    });

    it('calls onToChange when to date changes', () => {
        const onToChange = vi.fn();
        const { container } = render(
            <DateRangePicker from="" to="" onFromChange={() => {}} onToChange={onToChange} />,
        );
        const inputs = container.querySelectorAll('input[type="date"]');
        fireEvent.change(inputs[1], { target: { value: '2026-12-31' } });
        expect(onToChange).toHaveBeenCalledWith('2026-12-31');
    });

    it('sets max on from input based on to value', () => {
        const { container } = render(
            <DateRangePicker from="" to="2026-06-15" onFromChange={() => {}} onToChange={() => {}} />,
        );
        const fromInput = container.querySelectorAll('input[type="date"]')[0];
        expect(fromInput).toHaveAttribute('max', '2026-06-15');
    });
});
