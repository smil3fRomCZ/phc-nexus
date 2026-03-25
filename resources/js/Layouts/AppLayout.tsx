import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface AppLayoutProps {
    title?: string;
    children: ReactNode;
}

export default function AppLayout({ title, children }: AppLayoutProps) {
    return (
        <>
            <Head title={title} />
            <div className="flex h-screen bg-surface-primary">
                {/* Sidebar */}
                <aside className="flex w-60 flex-col border-r border-border-default bg-surface-secondary">
                    <div className="flex h-14 items-center gap-2 border-b border-border-default px-4">
                        <span className="text-lg font-semibold text-brand-primary">
                            PHC Nexus
                        </span>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-3">
                        <ul className="space-y-1">
                            <NavItem href="/" label="Dashboard" />
                        </ul>
                    </nav>
                </aside>

                {/* Main content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <header className="flex h-14 items-center border-b border-border-default px-6">
                        <h1 className="text-lg font-medium text-text-strong">
                            {title ?? 'PHC Nexus'}
                        </h1>
                    </header>
                    <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </div>
            </div>
        </>
    );
}

function NavItem({ href, label }: { href: string; label: string }) {
    return (
        <li>
            <Link
                href={href}
                className="flex items-center rounded-md px-3 py-2 text-sm text-text-default hover:bg-surface-hover"
            >
                {label}
            </Link>
        </li>
    );
}
