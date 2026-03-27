import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ToastItem {
    id: number;
    type: 'success' | 'error';
    message: string;
}

let toastId = 0;

export default function Toast() {
    const { flash } = usePage<PageProps>().props;
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        if (flash?.success) {
            const id = ++toastId;
            setToasts((prev) => [...prev, { id, type: 'success', message: flash.success! }]);
            setTimeout(() => dismiss(id), 4000);
        }
        if (flash?.error) {
            const id = ++toastId;
            setToasts((prev) => [...prev, { id, type: 'error', message: flash.error! }]);
            setTimeout(() => dismiss(id), 6000);
        }
    }, [flash?.success, flash?.error]);

    function dismiss(id: number) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all ${
                        toast.type === 'success'
                            ? 'border-status-info/30 bg-surface-primary text-status-info'
                            : 'border-status-danger/30 bg-surface-primary text-status-danger'
                    }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                        <XCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-text-strong">{toast.message}</span>
                    <button
                        onClick={() => dismiss(toast.id)}
                        className="ml-2 rounded p-0.5 text-text-muted hover:bg-surface-hover"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}
        </div>
    );
}
