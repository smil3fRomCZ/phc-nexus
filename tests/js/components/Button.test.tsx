import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '@/Components/Button';

describe('Button', () => {
    it('renders children text', () => {
        render(<Button>Uložit</Button>);
        expect(screen.getByText('Uložit')).toBeInTheDocument();
    });

    it('applies primary variant by default', () => {
        render(<Button>OK</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-brand-primary');
    });

    it('applies secondary variant', () => {
        render(<Button variant="secondary">Zrušit</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('border-border-default');
    });

    it('applies danger variant', () => {
        render(<Button variant="danger">Smazat</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('text-status-danger');
    });

    it('shows loading state', () => {
        render(<Button loading>Saving</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
    });

    it('handles click', () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Klik</Button>);
        screen.getByRole('button').click();
        expect(onClick).toHaveBeenCalledOnce();
    });
});
