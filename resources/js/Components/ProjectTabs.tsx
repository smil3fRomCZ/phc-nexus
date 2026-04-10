import { Link } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    CheckSquare,
    ChevronDown,
    Dices,
    GanttChart,
    GitBranch,
    History,
    Info,
    Layers,
    LayoutGrid,
    Table2,
    Timer,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

type TabKey =
    | 'overview'
    | 'board'
    | 'table'
    | 'epics'
    | 'members'
    | 'time'
    | 'gantt'
    | 'workflow'
    | 'estimation'
    | 'reports'
    | 'approvals'
    | 'wiki'
    | 'history';

interface ProjectTabsProps {
    projectId: string;
    active: TabKey;
}

type Tab = { key: TabKey; path: string; label: string; icon: LucideIcon };

const TABS: readonly Tab[] = [
    { key: 'overview', path: '', label: 'Přehled', icon: Info },
    { key: 'board', path: '/board', label: 'Kanban', icon: LayoutGrid },
    { key: 'table', path: '/table', label: 'Backlog', icon: Table2 },
    { key: 'epics', path: '/epics', label: 'Epic', icon: Layers },
    { key: 'members', path: '/members', label: 'Členové', icon: Users },
    { key: 'time', path: '/time', label: 'Čas', icon: Timer },
    { key: 'gantt', path: '/gantt', label: 'Gantt', icon: GanttChart },
    { key: 'workflow', path: '/workflow', label: 'Workflow', icon: GitBranch },
    { key: 'estimation', path: '/estimation', label: 'Estimation', icon: Dices },
    { key: 'reports', path: '/reports', label: 'Reporty', icon: BarChart3 },
    { key: 'history', path: '/history', label: 'Historie', icon: History },
    { key: 'approvals', path: '/approvals', label: 'Schvalování', icon: CheckSquare },
    { key: 'wiki', path: '/wiki', label: 'Dokumentace', icon: BookOpen },
];

const MORE_BUTTON_WIDTH = 96;
const GAP = 2;
const HORIZONTAL_PADDING = 8;

export default function ProjectTabs({ projectId, active }: ProjectTabsProps) {
    const containerRef = useRef<HTMLElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [tabWidths, setTabWidths] = useState<number[]>([]);
    const [containerWidth, setContainerWidth] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Measure tab widths (once after mount and when active changes, as active affects label weight)
    useLayoutEffect(() => {
        const measure = measureRef.current;
        if (!measure) return;
        const widths = Array.from(measure.children).map((el) => (el as HTMLElement).offsetWidth);
        setTabWidths(widths);
    }, [active]);

    // Measure container width + observe resize
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        setContainerWidth(container.clientWidth);

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    const { visible, overflow } = useMemo(
        () => computeLayout(TABS, tabWidths, containerWidth, active),
        [tabWidths, containerWidth, active],
    );

    return (
        <>
            {/* Hidden measurement row — renders all tabs off-screen to cache widths */}
            <div
                ref={measureRef}
                aria-hidden
                className="pointer-events-none invisible absolute left-[-9999px] top-0 flex gap-0.5"
            >
                {TABS.map((tab) => (
                    <TabButton key={tab.key} tab={tab} isActive={tab.key === active} measuring />
                ))}
            </div>

            <nav
                ref={containerRef}
                className="relative flex w-full items-center gap-0.5 rounded-lg border border-border-subtle bg-surface-primary p-1"
            >
                {visible.map((tab) => (
                    <TabLink key={tab.key} tab={tab} projectId={projectId} isActive={tab.key === active} />
                ))}

                {overflow.length > 0 && (
                    <div ref={dropdownRef} className="relative ml-auto">
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((v) => !v)}
                            aria-expanded={dropdownOpen}
                            aria-haspopup="menu"
                            className="flex shrink-0 items-center gap-1.5 rounded-md border-l border-border-subtle px-3 py-1.5 text-[13px] font-medium text-text-muted no-underline transition-all hover:bg-surface-secondary hover:text-text-default"
                        >
                            Další
                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                            />
                            <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-brand-soft px-1 text-[10px] font-bold text-brand-hover">
                                {overflow.length}
                            </span>
                        </button>

                        {dropdownOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[220px] rounded-lg border border-border-default bg-surface-primary p-1 shadow-lg"
                            >
                                {overflow.map((tab) => (
                                    <TabLink
                                        key={tab.key}
                                        tab={tab}
                                        projectId={projectId}
                                        isActive={tab.key === active}
                                        variant="dropdown"
                                        onClick={() => setDropdownOpen(false)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </>
    );
}

function TabLink({
    tab,
    projectId,
    isActive,
    variant = 'bar',
    onClick,
}: {
    tab: Tab;
    projectId: string;
    isActive: boolean;
    variant?: 'bar' | 'dropdown';
    onClick?: () => void;
}) {
    const Icon = tab.icon;
    if (variant === 'dropdown') {
        return (
            <Link
                href={`/projects/${projectId}${tab.path}`}
                onClick={onClick}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium no-underline transition-colors ${
                    isActive
                        ? 'bg-brand-soft font-semibold text-brand-hover'
                        : 'text-text-default hover:bg-surface-secondary'
                }`}
            >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
            </Link>
        );
    }
    return (
        <Link
            href={`/projects/${projectId}${tab.path}`}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium no-underline whitespace-nowrap transition-all ${
                isActive
                    ? 'bg-brand-soft font-semibold text-brand-hover shadow-sm'
                    : 'text-text-muted hover:bg-surface-secondary hover:text-text-default'
            }`}
        >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
        </Link>
    );
}

function TabButton({ tab, isActive, measuring }: { tab: Tab; isActive: boolean; measuring?: boolean }) {
    const Icon = tab.icon;
    return (
        <div
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap ${
                isActive ? 'font-semibold' : ''
            }`}
            aria-hidden={measuring}
        >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
        </div>
    );
}

function computeLayout(
    tabs: readonly Tab[],
    widths: number[],
    containerWidth: number,
    active: TabKey,
): { visible: Tab[]; overflow: Tab[] } {
    if (widths.length === 0 || containerWidth === 0) {
        return { visible: [...tabs], overflow: [] };
    }

    const fits = (count: number, reserveForMore: boolean): boolean => {
        let used = HORIZONTAL_PADDING;
        for (let i = 0; i < count; i++) {
            used += (widths[i] ?? 0) + GAP;
        }
        if (reserveForMore) used += MORE_BUTTON_WIDTH;
        return used <= containerWidth;
    };

    // First check if all tabs fit without the more button
    if (fits(tabs.length, false)) {
        return { visible: [...tabs], overflow: [] };
    }

    // Otherwise find the biggest count that fits with the more button reserved
    let count = 0;
    for (let i = 1; i <= tabs.length; i++) {
        if (fits(i, true)) count = i;
        else break;
    }

    // Always keep at least the first tab (Přehled)
    count = Math.max(count, 1);

    let visible = tabs.slice(0, count);
    let overflow = tabs.slice(count);

    // Active tab promotion — if active is in overflow, swap it with the last visible (non-first) tab
    const activeIdx = tabs.findIndex((t) => t.key === active);
    if (activeIdx >= count && activeIdx >= 0) {
        const activeTab = tabs[activeIdx];
        overflow = overflow.filter((t) => t.key !== activeTab.key);
        if (visible.length > 1) {
            const displaced = visible[visible.length - 1];
            visible = [...visible.slice(0, -1), activeTab];
            overflow = [displaced, ...overflow];
        } else {
            visible = [...visible, activeTab];
        }
    }

    return { visible, overflow };
}
