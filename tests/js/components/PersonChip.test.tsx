import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PersonChip from '@/Components/PersonChip';

describe('PersonChip', () => {
    it('renders name', () => {
        render(<PersonChip name="Jan Novák" />);
        expect(screen.getByText('Jan Novák')).toBeInTheDocument();
    });

    it('shows detail text', () => {
        render(<PersonChip name="Jan Novák" detail="Developer" />);
        expect(screen.getByText('Developer')).toBeInTheDocument();
    });

    it('renders avatar initials', () => {
        const { container } = render(<PersonChip name="Jan Novák" />);
        expect(container.textContent).toContain('JN');
    });
});
