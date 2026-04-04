import { Link } from '@inertiajs/react';
import { type ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
    const [show, setShow] = useState(false);
    const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (show && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + 6,
                left: rect.left + rect.width / 2,
            });
        }
    }, [show]);

    const tooltip =
        show &&
        createPortal(
            <span
                style={{ top: pos.top, left: pos.left }}
                className="pointer-events-none fixed z-[9999] -translate-x-1/2 whitespace-nowrap rounded bg-surface-inverse px-2 py-1 text-xs font-medium text-text-inverse shadow-lg"
            >
                {label}
            </span>,
            document.body,
        );

    const handlers = {
        onMouseEnter: () => setShow(true),
        onMouseLeave: () => setShow(false),
    };

    if (href) {
        return (
            <>
                <Link
                    href={href}
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    title={label}
                    className={`inline-flex items-center justify-center no-underline ${cls}`}
                    {...handlers}
                >
                    {children}
                </Link>
                {tooltip}
            </>
        );
    }

    return (
        <>
            <button
                onClick={onClick}
                ref={ref as React.Ref<HTMLButtonElement>}
                title={label}
                className={`inline-flex items-center justify-center ${cls}`}
                {...handlers}
            >
                {children}
            </button>
            {tooltip}
        </>
    );
}
