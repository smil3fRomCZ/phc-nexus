import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Avatar from '@/Components/Avatar';

describe('Avatar', () => {
    it('renders correct initials', () => {
        const { container } = render(<Avatar name="Jan Novák" />);
        expect(container.textContent).toBe('JN');
    });

    it('handles single name', () => {
        const { container } = render(<Avatar name="Admin" />);
        expect(container.textContent).toBe('A');
    });

    it('applies sm size by default', () => {
        const { container } = render(<Avatar name="Test" />);
        expect(container.firstElementChild?.className).toContain('h-6');
    });

    it('applies md size', () => {
        const { container } = render(<Avatar name="Test" size="md" />);
        expect(container.firstElementChild?.className).toContain('h-7');
    });
});
