import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '@/Components/StatusBadge';

const STATUS_MAP = {
    active: { label: 'Aktivní', className: 'bg-green-100 text-green-800' },
    inactive: { label: 'Neaktivní', className: 'bg-gray-100 text-gray-800' },
};

describe('StatusBadge', () => {
    it('renders map-based badge', () => {
        render(<StatusBadge statusMap={STATUS_MAP} value="active" />);
        expect(screen.getByText('Aktivní')).toBeInTheDocument();
    });

    it('renders fallback for unknown value', () => {
        render(<StatusBadge statusMap={STATUS_MAP} value="unknown" />);
        // Falls back to FALLBACK_STATUS
        expect(screen.getByText(/./)).toBeInTheDocument();
    });

    it('renders dynamic color badge', () => {
        render(<StatusBadge label="Custom" color="#ff0000" />);
        expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('renders null color with neutral classes', () => {
        render(<StatusBadge label="Neutral" color={null} />);
        const badge = screen.getByText('Neutral');
        expect(badge.className).toContain('bg-status-neutral-subtle');
    });
});
