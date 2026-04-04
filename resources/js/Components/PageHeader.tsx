import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    actions?: ReactNode;
}

export default function PageHeader({ title, actions }: PageHeaderProps) {
    return (
        <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold leading-tight text-text-strong md:text-2xl">{title}</h1>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
