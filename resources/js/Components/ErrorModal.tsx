import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Props {
    open: boolean;
    status?: number;
    message: string;
    onClose: () => void;
}

function statusTitle(status?: number): string {
    switch (status) {
        case 403:
            return 'Přístup odepřen';
        case 404:
            return 'Nenalezeno';
        case 419:
            return 'Relace vypršela';
        case 422:
            return 'Neplatný požadavek';
        case 429:
            return 'Příliš mnoho požadavků';
        case 500:
            return 'Chyba serveru';
        case 503:
            return 'Služba nedostupná';
        default:
            return 'Chyba';
    }
}

function statusMessage(status?: number): string {
    switch (status) {
        case 403:
            return 'Nemáte oprávnění k provedení této akce.';
        case 404:
            return 'Požadovaný zdroj nebyl nalezen.';
        case 419:
            return 'Vaše relace vypršela. Obnovte stránku a zkuste to znovu.';
        case 422:
            return 'Odeslaná data nejsou platná.';
        case 429:
            return 'Příliš mnoho požadavků. Zkuste to za chvíli.';
        case 500:
            return 'Na serveru došlo k neočekávané chybě.';
        case 503:
            return 'Služba je dočasně nedostupná. Zkuste to později.';
        default:
            return 'Došlo k neočekávané chybě.';
    }
}

export default function ErrorModal({ open, status, message, onClose }: Props) {
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleEsc(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);

    if (!open) return null;

    const title = statusTitle(status);
    const defaultMessage = statusMessage(status);

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
            onClick={(e) => {
                if (e.target === backdropRef.current) onClose();
            }}
        >
            <div className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface-primary p-6 shadow-xl">
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-status-danger-subtle">
                            <AlertTriangle className="h-5 w-5 text-status-danger" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-text-strong">
                                {title}
                                {status && <span className="ml-2 text-sm font-normal text-text-muted">{status}</span>}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-text-muted">{message || defaultMessage}</p>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-brand-primary px-5 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover"
                    >
                        Zavřít
                    </button>
                </div>
            </div>
        </div>
    );
}
