import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from '@/Components/EmptyState';
import { Bell } from 'lucide-react';

// Mock Inertia Link
vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode;[key: string]: unknown }) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

describe('EmptyState', () => {
    it('renders message only (backward compat)', () => {
        render(<EmptyState message="No items found." />);
        expect(screen.getByText('No items found.')).toBeInTheDocument();
    });

    it('renders table row with colSpan', () => {
        const { container } = render(
            <table>
                <tbody>
                    <EmptyState colSpan={5} message="Empty table." />
                </tbody>
            </table>,
        );
        const td = container.querySelector('td');
        expect(td).toHaveAttribute('colspan', '5');
        expect(screen.getByText('Empty table.')).toBeInTheDocument();
    });

    it('renders with icon', () => {
        const { container } = render(<EmptyState icon={Bell} message="No notifications." />);
        // lucide-react renders an SVG
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(screen.getByText('No notifications.')).toBeInTheDocument();
    });

    it('renders with CTA link', () => {
        render(
            <EmptyState
                message="No projects."
                action={{ label: 'Create Project', href: '/projects/create' }}
            />,
        );
        const link = screen.getByText('Create Project');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/projects/create');
    });

    it('renders with CTA button', () => {
        const onClick = vi.fn();
        render(
            <EmptyState
                message="No items."
                action={{ label: 'Add Item', onClick }}
            />,
        );
        const button = screen.getByText('Add Item');
        expect(button.tagName).toBe('BUTTON');
        button.click();
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('renders compact variant with smaller padding', () => {
        const { container } = render(<EmptyState message="Compact." compact />);
        const wrapper = container.firstElementChild;
        expect(wrapper?.className).toContain('py-4');
    });
});
