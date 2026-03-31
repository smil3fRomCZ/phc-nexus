import { AlertTriangle, Trash2, Info } from 'lucide-react';

type ModalVariant = 'warning' | 'danger' | 'info';

interface Props {
    open: boolean;
    variant?: ModalVariant;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

const VARIANT_CONFIG: Record<ModalVariant, { icon: typeof Info; iconBg: string; iconColor: string; btnClass: string }> =
    {
        warning: {
            icon: AlertTriangle,
            iconBg: 'bg-status-warning-subtle',
            iconColor: 'text-status-warning',
            btnClass: 'bg-brand-primary text-text-inverse hover:bg-brand-hover',
        },
        danger: {
            icon: Trash2,
            iconBg: 'bg-status-danger-subtle',
            iconColor: 'text-status-danger',
            btnClass: 'bg-status-danger text-text-inverse hover:opacity-90',
        },
        info: {
            icon: Info,
            iconBg: 'bg-status-info-subtle',
            iconColor: 'text-status-info',
            btnClass: 'bg-brand-primary text-text-inverse hover:bg-brand-hover',
        },
    };

export default function ConfirmModal({
    open,
    variant = 'info',
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
}: Props) {
    if (!open) return null;

    const config = VARIANT_CONFIG[variant];
    const Icon = config.icon;
    const showCancel = !!onCancel;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface-primary p-6 text-center shadow-xl">
                <div
                    className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg}`}
                >
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text-strong">{title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-text-muted">{message}</p>
                <div className="flex justify-center gap-3">
                    {showCancel && (
                        <button
                            onClick={onCancel}
                            className="rounded-md border border-border-default px-5 py-2 text-sm font-medium text-text-default transition-colors hover:bg-surface-hover"
                        >
                            {cancelLabel ?? 'Zrušit'}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${config.btnClass}`}
                    >
                        {confirmLabel ?? (showCancel ? 'Potvrdit' : 'Rozumím')}
                    </button>
                </div>
            </div>
        </div>
    );
}
