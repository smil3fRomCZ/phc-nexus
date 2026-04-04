import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmModal from '@/Components/ConfirmModal';

describe('ConfirmModal', () => {
    it('renders title and message when open', () => {
        render(
            <ConfirmModal
                open
                title="Smazat?"
                message="Opravdu smazat?"
                confirmLabel="Ano"
                onConfirm={() => {}}
                onCancel={() => {}}
            />,
        );
        expect(screen.getByText('Smazat?')).toBeInTheDocument();
        expect(screen.getByText('Opravdu smazat?')).toBeInTheDocument();
    });

    it('calls onConfirm on confirm click', () => {
        const onConfirm = vi.fn();
        render(
            <ConfirmModal
                open
                title="Test"
                message="Test"
                confirmLabel="OK"
                onConfirm={onConfirm}
                onCancel={() => {}}
            />,
        );
        screen.getByText('OK').click();
        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('calls onCancel on cancel click', () => {
        const onCancel = vi.fn();
        render(
            <ConfirmModal
                open
                title="Test"
                message="Test"
                confirmLabel="OK"
                onConfirm={() => {}}
                onCancel={onCancel}
            />,
        );
        screen.getByText('Zrušit').click();
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('does not render when closed', () => {
        render(
            <ConfirmModal
                open={false}
                title="Hidden"
                message="Hidden"
                confirmLabel="OK"
                onConfirm={() => {}}
                onCancel={() => {}}
            />,
        );
        expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });
});
