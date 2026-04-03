import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    /** Max-width class for the modal panel. Default: "max-w-md" */
    size?: string;
    /** Show the X close button in top-right corner. Default: true */
    showClose?: boolean;
    /** z-index class. Default: "z-50" */
    zIndex?: string;
}

export default function Modal({ open, onClose, children, size = 'max-w-md', showClose = true, zIndex = 'z-50' }: Props) {
    if (!open) return null;

    return (
        <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/50`} onClick={onClose}>
            <div
                className={`mx-4 w-full ${size} max-h-[85vh] overflow-y-auto rounded-lg border border-border-subtle bg-surface-primary p-4 shadow-xl sm:mx-auto sm:p-6`}
                onClick={(e) => e.stopPropagation()}
            >
                {showClose && (
                    <button
                        onClick={onClose}
                        className="absolute right-3 top-3 rounded p-2 text-text-muted hover:bg-surface-hover"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                {children}
            </div>
        </div>
    );
}
