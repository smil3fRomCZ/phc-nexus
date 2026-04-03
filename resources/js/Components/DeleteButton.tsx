import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    onClick: () => void;
    children?: ReactNode;
    className?: string;
}

const BASE_CLASS =
    'rounded-md border border-status-danger/30 text-status-danger transition-colors hover:bg-status-danger-subtle';

/**
 * Standardised danger/delete button. Shows just the Trash2 icon by default,
 * or custom children when provided.
 */
export default function DeleteButton({ onClick, children, className }: Props) {
    return (
        <button onClick={onClick} className={className ?? `${BASE_CLASS} px-3 py-1.5 text-xs font-medium`}>
            {children ?? <Trash2 className="h-3 w-3" />}
        </button>
    );
}
