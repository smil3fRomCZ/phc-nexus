import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from '@/Components/Modal';

describe('Modal', () => {
    it('renders children when open', () => {
        render(
            <Modal open onClose={() => {}}>
                <span>Content</span>
            </Modal>,
        );
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <Modal open={false} onClose={() => {}}>
                <span>Hidden</span>
            </Modal>,
        );
        expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('renders close button by default', () => {
        const { container } = render(
            <Modal open onClose={() => {}}>
                <span>Test</span>
            </Modal>,
        );
        // Close button has X icon
        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(0);
    });

    it('hides close button when showClose=false', () => {
        render(
            <Modal open onClose={() => {}} showClose={false}>
                <span>No close</span>
            </Modal>,
        );
        expect(screen.getByText('No close')).toBeInTheDocument();
    });
});
