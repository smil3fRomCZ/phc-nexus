import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PageHeader from '@/Components/PageHeader';

describe('PageHeader', () => {
    it('renders title', () => {
        render(<PageHeader title="Uživatelé" />);
        expect(screen.getByText('Uživatelé')).toBeInTheDocument();
    });

    it('renders actions slot', () => {
        render(<PageHeader title="Test" actions={<button>Akce</button>} />);
        expect(screen.getByText('Akce')).toBeInTheDocument();
    });

    it('renders without actions', () => {
        const { container } = render(<PageHeader title="Solo" />);
        expect(container.querySelector('h1')?.textContent).toBe('Solo');
    });
});
