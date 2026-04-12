import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Modal from '@/Components/Modal';

describe('Modal', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

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
        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('hides close button when showClose=false', () => {
        const { container } = render(
            <Modal open onClose={() => {}} showClose={false}>
                <span>No close</span>
            </Modal>,
        );
        expect(screen.getByText('No close')).toBeInTheDocument();
        expect(container.querySelectorAll('button')).toHaveLength(0);
    });

    it('calls onClose when X button clicked (no dirty guard)', () => {
        const onClose = vi.fn();
        const { container } = render(
            <Modal open onClose={onClose}>
                <span>Test</span>
            </Modal>,
        );
        const closeBtn = container.querySelector('button');
        fireEvent.click(closeBtn!);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked (no dirty guard)', () => {
        const onClose = vi.fn();
        const { container } = render(
            <Modal open onClose={onClose}>
                <span>Test</span>
            </Modal>,
        );
        const backdrop = container.firstElementChild as HTMLElement;
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when inner panel clicked', () => {
        const onClose = vi.fn();
        render(
            <Modal open onClose={onClose}>
                <span>Inner</span>
            </Modal>,
        );
        fireEvent.click(screen.getByText('Inner'));
        expect(onClose).not.toHaveBeenCalled();
    });

    describe('isDirty guard', () => {
        it('asks for confirmation on backdrop click when isDirty=true', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
            const onClose = vi.fn();
            const { container } = render(
                <Modal open onClose={onClose} isDirty closeConfirmMessage="Opravdu zavřít?">
                    <span>Dirty</span>
                </Modal>,
            );
            const backdrop = container.firstElementChild as HTMLElement;
            fireEvent.click(backdrop);
            expect(confirmSpy).toHaveBeenCalledWith('Opravdu zavřít?');
            expect(onClose).not.toHaveBeenCalled();
        });

        it('asks for confirmation on X click when isDirty=true', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
            const onClose = vi.fn();
            const { container } = render(
                <Modal open onClose={onClose} isDirty closeConfirmMessage="Opravdu zavřít?">
                    <span>Dirty</span>
                </Modal>,
            );
            const closeBtn = container.querySelector('button');
            fireEvent.click(closeBtn!);
            expect(confirmSpy).toHaveBeenCalledWith('Opravdu zavřít?');
            expect(onClose).not.toHaveBeenCalled();
        });

        it('closes when user confirms the prompt', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const onClose = vi.fn();
            const { container } = render(
                <Modal open onClose={onClose} isDirty>
                    <span>Dirty</span>
                </Modal>,
            );
            const backdrop = container.firstElementChild as HTMLElement;
            fireEvent.click(backdrop);
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('does not prompt when isDirty=false', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
            const onClose = vi.fn();
            const { container } = render(
                <Modal open onClose={onClose} isDirty={false}>
                    <span>Clean</span>
                </Modal>,
            );
            const backdrop = container.firstElementChild as HTMLElement;
            fireEvent.click(backdrop);
            expect(confirmSpy).not.toHaveBeenCalled();
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('Escape key triggers dirty guard', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
            const onClose = vi.fn();
            render(
                <Modal open onClose={onClose} isDirty>
                    <span>Dirty</span>
                </Modal>,
            );
            fireEvent.keyDown(window, { key: 'Escape' });
            expect(confirmSpy).toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
        });
    });
});
