import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface Props {
    onClick?: () => void;
    href?: string;
    label: string;
    variant?: 'default' | 'danger';
    children: ReactNode;
    className?: string;
}

const VARIANTS = {
    default:
        'rounded-md border border-border-default p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default',
    danger: 'rounded-md border border-status-danger/30 p-2 text-status-danger transition-colors hover:bg-status-danger-subtle',
};

export default function ActionIconButton({ onClick, href, label, variant = 'default', children, className }: Props) {
    const cls = className ?? VARIANTS[variant];

    if (href) {
        return (
            <Link
                href={href}
                title={label}
                className={`group relative inline-flex items-center justify-center no-underline ${cls}`}
            >
                {children}
                <Tooltip label={label} />
            </Link>
        );
    }

    return (
        <button
            onClick={onClick}
            title={label}
            className={`group relative inline-flex items-center justify-center ${cls}`}
        >
            {children}
            <Tooltip label={label} />
        </button>
    );
}

function Tooltip({ label }: { label: string }) {
    return (
        <span className="pointer-events-none absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-surface-inverse px-2 py-1 text-xs font-medium text-text-inverse opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {label}
        </span>
    );
}
