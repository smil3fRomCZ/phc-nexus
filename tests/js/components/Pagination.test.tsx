import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pagination from '@/Components/Pagination';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...props }: { href: string; children?: React.ReactNode; [key: string]: unknown }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const MULTI_PAGE_LINKS = [
    { url: null, label: '&laquo;', active: false },
    { url: '/page/1', label: '1', active: true },
    { url: '/page/2', label: '2', active: false },
    { url: '/page/3', label: '3', active: false },
    { url: '/page/2', label: '&raquo;', active: false },
];

describe('Pagination', () => {
    it('renders pagination links when more than 3', () => {
        const { container } = render(<Pagination links={MULTI_PAGE_LINKS} />);
        expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('highlights active page with brand class', () => {
        const { container } = render(<Pagination links={MULTI_PAGE_LINKS} />);
        const activeLink = container.querySelector('.bg-brand-primary');
        expect(activeLink).toBeInTheDocument();
    });

    it('renders nothing when 3 or fewer links', () => {
        const links = [
            { url: null, label: '&laquo;', active: false },
            { url: '/page/1', label: '1', active: true },
            { url: null, label: '&raquo;', active: false },
        ];
        const { container } = render(<Pagination links={links} />);
        expect(container.querySelector('nav')).toBeNull();
    });
});
