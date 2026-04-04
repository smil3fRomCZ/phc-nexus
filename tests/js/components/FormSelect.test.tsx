import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormSelect from '@/Components/FormSelect';

const OPTIONS = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
];

describe('FormSelect', () => {
    it('renders options', () => {
        render(<FormSelect id="test" options={OPTIONS} />);
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    it('renders placeholder option', () => {
        render(<FormSelect id="test" options={OPTIONS} placeholder="Vyberte..." />);
        expect(screen.getByText('Vyberte...')).toBeInTheDocument();
    });

    it('shows error message', () => {
        render(<FormSelect id="test" options={OPTIONS} error="Chyba" />);
        expect(screen.getByText('Chyba')).toBeInTheDocument();
    });

    it('renders with label', () => {
        render(<FormSelect id="test" label="Role" options={OPTIONS} />);
        expect(screen.getByText('Role')).toBeInTheDocument();
    });

    it('calls onChange', () => {
        const onChange = vi.fn();
        render(<FormSelect id="test" options={OPTIONS} onChange={onChange} />);
        const select = screen.getByRole('combobox');
        select.dispatchEvent(new Event('change', { bubbles: true }));
        expect(onChange).toHaveBeenCalled();
    });
});
