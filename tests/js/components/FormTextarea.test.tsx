import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FormTextarea from '@/Components/FormTextarea';

describe('FormTextarea', () => {
    it('renders with label', () => {
        render(<FormTextarea id="test" label="Popis" />);
        expect(screen.getByText('Popis')).toBeInTheDocument();
    });

    it('shows error message', () => {
        render(<FormTextarea id="test" error="Příliš dlouhé" />);
        expect(screen.getByText('Příliš dlouhé')).toBeInTheDocument();
    });

    it('passes rows prop', () => {
        render(<FormTextarea id="test" rows={5} />);
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('rows', '5');
    });

    it('shows required marker', () => {
        render(<FormTextarea id="test" label="Bio" required />);
        expect(screen.getByText('Bio *')).toBeInTheDocument();
    });
});
