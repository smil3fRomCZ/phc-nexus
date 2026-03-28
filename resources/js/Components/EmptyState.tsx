import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
    label: string;
    href?: string;
    onClick?: () => void;
}

interface EmptyStateProps {
    message: string;
    colSpan?: number;
    icon?: LucideIcon;
    action?: EmptyStateAction;
    compact?: boolean;
}

export default function EmptyState({ message, colSpan, icon: Icon, action, compact }: EmptyStateProps) {
    if (colSpan) {
        return (
            <tr>
                <td colSpan={colSpan} className="px-5 py-8 text-center text-sm text-text-muted">
                    {message}
                </td>
            </tr>
        );
    }

    const py = compact ? 'py-4' : 'py-8';

    return (
        <div className={`${py} flex flex-col items-center gap-3 text-center`}>
            {Icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
                    <Icon className="h-5 w-5 text-text-subtle" strokeWidth={1.5} />
                </div>
            )}
            <p className="text-base text-text-muted">{message}</p>
            {action &&
                (action.href ? (
                    <Link
                        href={action.href}
                        className="mt-1 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse no-underline transition-colors hover:bg-brand-hover"
                    >
                        {action.label}
                    </Link>
                ) : (
                    <button
                        onClick={action.onClick}
                        className="mt-1 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover"
                    >
                        {action.label}
                    </button>
                ))}
        </div>
    );
}
