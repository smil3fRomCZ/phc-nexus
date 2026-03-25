import { Head, Link, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { PageProps } from '@/types';

interface AppLayoutProps {
    title?: string;
    children: ReactNode;
}

export default function AppLayout({ title, children }: AppLayoutProps) {
    const { auth } = usePage<PageProps>().props;

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
                            <NavItem href="/projects" label="Projekty" />
                        </ul>
                    </nav>
                    {auth.user && (
                        <div className="border-t border-border-default p-3">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-text-default">
                                        {auth.user.name}
                                    </p>
                                    <p className="truncate text-xs text-text-muted">
                                        {auth.user.email}
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.post('/logout')}
                                    className="ml-2 rounded px-2 py-1 text-xs text-text-muted hover:bg-surface-hover hover:text-text-default"
                                >
                                    Odhlásit
                                </button>
                            </div>
                        </div>
                    )}
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
