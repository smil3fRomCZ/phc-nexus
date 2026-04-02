import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, type ReactNode } from 'react';
import type { PageProps } from '@/types';
import Toast from '@/Components/Toast';
import {
    LayoutDashboard,
    FolderKanban,
    Clock,
    CalendarDays,
    CheckSquare,
    Bell,
    Users,
    Building2,
    ScrollText,
    ShieldAlert,
    BarChart3,
    LogOut,
    ChevronRight,
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import GlobalSearch from '@/Components/GlobalSearch';
import useNotificationCount from '@/hooks/useNotificationCount';

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
        label: 'Hlavní',
        items: [
            { href: '/', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/projects', label: 'Projekty', icon: FolderKanban },
            { href: '/my-tasks', label: 'Moje úkoly', icon: Clock },
            { href: '/calendar', label: 'Kalendář', icon: CalendarDays },
        ],
    },
    {
        label: 'Správa',
        items: [
            { href: '/approvals', label: 'Schvalování', icon: CheckSquare },
            { href: '/notifications', label: 'Notifikace', icon: Bell },
        ],
    },
    {
        label: 'Administrace',
        items: [
            { href: '/admin/users', label: 'Uživatelé', icon: Users },
            { href: '/admin/organization', label: 'Organizace', icon: Building2 },
            { href: '/admin/audit-log', label: 'Audit log', icon: ScrollText },
            { href: '/admin/phi-report', label: 'PHI report', icon: ShieldAlert },
            { href: '/admin/approval-analytics', label: 'Analytika schvalování', icon: BarChart3 },
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
    const { auth, notificationCount: initialCount } = usePage<PageProps>().props;
    const notificationCount = useNotificationCount(initialCount);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('sidebar-collapsed') === '1';
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0');
    }, [collapsed]);

    function isActive(href: string): boolean {
        if (href === '/') return currentPath === '/';
        return currentPath.startsWith(href);
    }

    return (
        <>
            <Head title={title} />
            <Toast />
            <div
                id="nav-progress"
                className="fixed left-0 top-0 z-[200] h-0.5 w-full animate-pulse bg-brand-primary opacity-0 transition-opacity"
            />
            <div className="flex h-screen flex-col bg-surface-canvas">
                {/* ── Topbar ── */}
                <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border-default bg-surface-primary px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="rounded p-2 text-text-muted hover:bg-surface-hover md:hidden"
                        >
                            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                        <Link
                            href="/"
                            className="flex items-center gap-2 font-bold text-base text-text-strong no-underline"
                        >
                            <span className="inline-block h-2 w-2 rounded-full bg-brand-primary" />
                            <span className="hidden sm:inline">PHC Nexus</span>
                        </Link>
                    </div>

                    <div className="hidden flex-1 justify-center px-6 md:flex">
                        <GlobalSearch />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.visit('/notifications')}
                            className="relative cursor-pointer text-text-muted transition-colors hover:text-text-strong"
                            aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
                        >
                            <Bell className="h-[18px] w-[18px]" />
                            {notificationCount > 0 && (
                                <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[0.625rem] font-semibold leading-none text-text-inverse">
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </span>
                            )}
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
                    {/* ── Mobile overlay ── */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 z-30 bg-black/50 md:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* ── Sidebar ── */}
                    <aside
                        className={`fixed inset-y-0 left-0 z-40 flex flex-shrink-0 flex-col border-r border-border-default bg-surface-primary overflow-y-auto pt-12 transition-all md:static md:z-auto md:pt-0 md:translate-x-0 ${
                            collapsed ? 'md:w-16' : 'md:w-64'
                        } w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    >
                        <nav className="flex-1 py-4">
                            {NAV_SECTIONS.map((section) => (
                                <div key={section.label} className="mb-4">
                                    {!collapsed && (
                                        <div className="px-6 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.05em] text-text-subtle">
                                            {section.label}
                                        </div>
                                    )}
                                    {collapsed && <div className="mb-1 border-b border-border-subtle mx-2" />}
                                    {section.items.map((item) => {
                                        const active = isActive(item.href);
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.href + item.label}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                title={collapsed ? item.label : undefined}
                                                className={`flex items-center gap-3 border-l-[3px] py-2 text-sm transition-colors ${
                                                    collapsed ? 'justify-center px-2' : 'px-6'
                                                } ${
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
                                                {!collapsed && item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            ))}
                        </nav>

                        <div className="border-t border-border-default p-3">
                            {auth.user && (
                                <button
                                    onClick={() => router.post('/logout')}
                                    title={collapsed ? 'Odhlásit' : undefined}
                                    className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default ${collapsed ? 'justify-center' : ''}`}
                                >
                                    <LogOut className="h-4 w-4 flex-shrink-0" />
                                    {!collapsed && 'Odhlásit'}
                                </button>
                            )}
                            {/* Collapse toggle — desktop only */}
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="mt-1 hidden w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default md:flex justify-center"
                                title={collapsed ? 'Rozbalit menu' : 'Sbalit menu'}
                            >
                                {collapsed ? (
                                    <PanelLeftOpen className="h-4 w-4" />
                                ) : (
                                    <>
                                        <PanelLeftClose className="h-4 w-4" />
                                        <span>Sbalit</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </aside>

                    {/* ── Main Content ── */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Breadcrumbs bar */}
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <div className="border-b border-border-subtle bg-surface-secondary/50 px-4 md:px-12">
                                <div className="mx-auto max-w-screen-2xl">
                                    <nav className="flex items-center gap-1 py-2 text-xs text-text-subtle">
                                        {breadcrumbs.map((crumb, i) => (
                                            <span key={i} className="flex items-center gap-1">
                                                {i > 0 && <ChevronRight className="h-3 w-3 text-text-subtle" />}
                                                {crumb.href ? (
                                                    <Link
                                                        href={crumb.href}
                                                        className="text-text-subtle no-underline transition-colors hover:text-brand-primary hover:underline"
                                                    >
                                                        {crumb.label}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium text-text-default">{crumb.label}</span>
                                                )}
                                            </span>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        )}
                        <main className="px-4 py-6 md:px-12 md:py-8">
                            <div className="mx-auto max-w-screen-2xl">{children}</div>
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}
