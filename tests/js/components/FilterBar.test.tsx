import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FilterBar from '@/Components/FilterBar';

describe('FilterBar', () => {
    it('renders children', () => {
        render(
            <FilterBar>
                <span>Filter A</span>
                <span>Filter B</span>
            </FilterBar>,
        );
        expect(screen.getByText('Filter A')).toBeInTheDocument();
        expect(screen.getByText('Filter B')).toBeInTheDocument();
    });

    it('has flex wrapper class', () => {
        const { container } = render(
            <FilterBar>
                <span>Test</span>
            </FilterBar>,
        );
        expect(container.firstElementChild?.className).toContain('flex');
    });
});
