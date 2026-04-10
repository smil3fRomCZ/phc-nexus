import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from '@/Components/Spinner';

const VARIANT_CLASSES = {
    primary: 'bg-brand-primary text-text-inverse hover:bg-brand-hover',
    secondary: 'border border-border-default text-text-muted hover:bg-surface-hover',
    danger: 'border border-status-danger/30 text-status-danger hover:bg-status-danger-subtle',
    ghost: 'text-text-muted hover:bg-surface-hover hover:text-text-default',
} as const;

const SIZE_CLASSES = {
    sm: 'h-8 px-3 text-xs',
    md: 'px-4 py-2 text-sm',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof VARIANT_CLASSES;
    size?: keyof typeof SIZE_CLASSES;
    loading?: boolean;
    icon?: ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    disabled,
    className,
    ...rest
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className ?? ''}`}
            {...rest}
        >
            {loading ? <Spinner size="sm" /> : icon}
            {children}
        </button>
    );
}
