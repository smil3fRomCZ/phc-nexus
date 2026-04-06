import { useEffect, useRef, type ReactNode } from 'react';

interface PopoverProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
}

export default function Popover({ open, onClose, children, className }: PopoverProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            ref={ref}
            className={`absolute right-0 z-20 mt-1 rounded-lg border border-border-subtle bg-surface-primary shadow-lg ${className ?? 'w-48 py-1'}`}
        >
            {children}
        </div>
    );
}

interface PopoverItemProps {
    onClick: () => void;
    children: ReactNode;
    variant?: 'default' | 'danger';
}

export function PopoverItem({ onClick, children, variant = 'default' }: PopoverItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                variant === 'danger'
                    ? 'text-status-danger hover:bg-status-danger-subtle'
                    : 'text-text-default hover:bg-surface-hover'
            }`}
        >
            {children}
        </button>
    );
}
