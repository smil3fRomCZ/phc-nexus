import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressBar from '@/Components/ProgressBar';

describe('ProgressBar', () => {
    it('renders correct width percentage', () => {
        const { container } = render(<ProgressBar value={50} />);
        const bar = container.querySelector('[style]');
        expect(bar?.getAttribute('style')).toContain('width: 50%');
    });

    it('shows label when enabled', () => {
        render(<ProgressBar value={75} showLabel />);
        expect(screen.getByText('75 %')).toBeInTheDocument();
    });

    it('caps at 100%', () => {
        const { container } = render(<ProgressBar value={150} />);
        const bar = container.querySelector('[style]');
        expect(bar?.getAttribute('style')).toContain('width: 100%');
    });

    it('handles zero value', () => {
        const { container } = render(<ProgressBar value={0} showLabel />);
        expect(screen.getByText('0 %')).toBeInTheDocument();
    });
});
