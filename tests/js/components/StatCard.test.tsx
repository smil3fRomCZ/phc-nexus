import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '@/Components/StatCard';

describe('StatCard', () => {
    it('renders value and label', () => {
        render(<StatCard icon={<span>I</span>} label="Uživatelé" value={42} />);
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Uživatelé')).toBeInTheDocument();
    });

    it('renders icon', () => {
        render(<StatCard icon={<span data-testid="icon">X</span>} label="Test" value={0} />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('applies custom color', () => {
        const { container } = render(
            <StatCard icon={<span>I</span>} label="Test" value={5} color="bg-red-100 text-red-600" />,
        );
        const iconWrap = container.querySelector('.bg-red-100');
        expect(iconWrap).toBeInTheDocument();
    });
});
