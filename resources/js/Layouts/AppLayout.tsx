import { Head, Link, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { PageProps } from '@/types';
import {
    LayoutDashboard,
    FolderKanban,
    Clock,
    CheckSquare,
    Bell,
    Users,
    Building2,
    ScrollText,
    ShieldAlert,
    LogOut,
    ChevronRight,
} from 'lucide-react';
import GlobalSearch from '@/Components/GlobalSearch';

/* ── Types ── */

export interface Breadcrumb {
    label: string;
    href?: string;
}

interface AppLayoutProps {
    title?: string;
    breadcrumbs?: Breadcrumb[];
    children: ReactNode;
}

/* ── Navigation config ── */

const NAV_SECTIONS = [
    {
        label: 'Main',
        items: [
            { href: '/', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/projects', label: 'Projects', icon: FolderKanban },
            { href: '/my-tasks', label: 'My Tasks', icon: Clock },
        ],
    },
    {
        label: 'Management',
        items: [
            { href: '/approvals', label: 'Approvals', icon: CheckSquare },
            { href: '/notifications', label: 'Notifications', icon: Bell },
        ],
    },
    {
        label: 'Admin',
        items: [
            { href: '/admin/users', label: 'Users', icon: Users },
            { href: '/admin/organization', label: 'Organization', icon: Building2 },
            { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
            { href: '/admin/phi-report', label: 'PHI Report', icon: ShieldAlert },
        ],
    },
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/* ── Component ── */

export default function AppLayout({ title, breadcrumbs, children }: AppLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    function isActive(href: string): boolean {
        if (href === '/') return currentPath === '/';
        return currentPath.startsWith(href);
    }

    return (
        <>
            <Head title={title} />
            <div className="flex h-screen flex-col bg-surface-canvas">
                {/* ── Topbar ── */}
                <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border-default bg-surface-primary px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 font-bold text-base text-text-strong no-underline"
                        style={{ minWidth: '14.5rem' }}
                    >
                        <span className="inline-block h-2 w-2 rounded-full bg-brand-primary" />
                        PHC Nexus
                    </Link>

                    <div className="flex flex-1 justify-center px-6">
                        <GlobalSearch />
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative text-text-muted transition-colors hover:text-text-strong">
                            <Bell className="h-[18px] w-[18px]" />
                            <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[0.625rem] font-semibold leading-none text-text-inverse">
                                5
                            </span>
                        </button>
                        {auth.user && (
                            <div className="flex items-center gap-2 cursor-pointer">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-text-inverse">
                                    {getInitials(auth.user.name)}
                                </div>
                                <span className="text-sm font-medium text-text-default">{auth.user.name}</span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* ── Sidebar ── */}
                    <aside className="flex w-64 flex-shrink-0 flex-col border-r border-border-default bg-surface-primary overflow-y-auto">
                        <nav className="flex-1 py-4">
                            {NAV_SECTIONS.map((section) => (
                                <div key={section.label} className="mb-4">
                                    <div className="px-6 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.05em] text-text-subtle">
                                        {section.label}
                                    </div>
                                    {section.items.map((item) => {
                                        const active = isActive(item.href);
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.href + item.label}
                                                href={item.href}
                                                className={`flex items-center gap-3 border-l-[3px] px-6 py-2 text-sm transition-colors ${
                                                    active
                                                        ? 'border-l-brand-hover bg-brand-soft font-medium text-brand-hover'
                                                        : 'border-l-transparent text-text-default hover:bg-surface-hover'
                                                }`}
                                            >
                                                <Icon
                                                    className={`h-4 w-4 flex-shrink-0 ${
                                                        active ? 'text-brand-hover' : 'text-text-muted'
                                                    }`}
                                                    strokeWidth={2}
                                                />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            ))}
                        </nav>

                        {auth.user && (
                            <div className="border-t border-border-default p-3">
                                <button
                                    onClick={() => router.post('/logout')}
                                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Odhlásit
                                </button>
                            </div>
                        )}
                    </aside>

                    {/* ── Main Content ── */}
                    <main className="flex-1 overflow-y-auto px-12 py-8">
                        {/* Breadcrumbs */}
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <nav className="mb-1 flex items-center gap-1 text-sm text-text-subtle">
                                {breadcrumbs.map((crumb, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                        {i > 0 && <ChevronRight className="h-3 w-3 text-text-subtle" />}
                                        {crumb.href ? (
                                            <Link
                                                href={crumb.href}
                                                className="text-text-subtle no-underline transition-colors hover:text-text-muted hover:underline"
                                            >
                                                {crumb.label}
                                            </Link>
                                        ) : (
                                            <span className="text-text-muted">{crumb.label}</span>
                                        )}
                                    </span>
                                ))}
                            </nav>
                        )}
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
