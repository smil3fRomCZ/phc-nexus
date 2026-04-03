import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FormInput from '@/Components/FormInput';

describe('FormInput', () => {
    it('renders with label', () => {
        render(<FormInput id="test" label="Jméno" />);
        expect(screen.getByText('Jméno')).toBeInTheDocument();
    });

    it('shows required marker', () => {
        render(<FormInput id="test" label="Email" required />);
        expect(screen.getByText('Email *')).toBeInTheDocument();
    });

    it('shows error message', () => {
        render(<FormInput id="test" error="Povinné pole" />);
        expect(screen.getByText('Povinné pole')).toBeInTheDocument();
    });

    it('passes input props', () => {
        render(<FormInput id="test" placeholder="Zadejte..." type="email" />);
        const input = screen.getByPlaceholderText('Zadejte...');
        expect(input).toHaveAttribute('type', 'email');
    });

    it('renders without label', () => {
        const { container } = render(<FormInput id="test" />);
        expect(container.querySelector('label')).toBeNull();
    });
});
