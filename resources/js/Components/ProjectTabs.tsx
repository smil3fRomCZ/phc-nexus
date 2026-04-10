import ProjectTabsCustomizeModal from '@/Components/Projects/ProjectTabsCustomizeModal';
import { Link, usePage } from '@inertiajs/react';
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
    Settings2,
    Table2,
    Timer,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export type TabKey =
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

export type Tab = { key: TabKey; path: string; label: string; icon: LucideIcon };

export const ALL_TABS: readonly Tab[] = [
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

type TabConfig = { order: string[]; hidden: string[] };

type SharedProps = {
    projectTabConfig?: TabConfig | null;
    projectCanUpdate?: boolean;
};

function applyTabConfig(allTabs: readonly Tab[], config: TabConfig | null | undefined): Tab[] {
    if (!config) return [...allTabs];
    const byKey = new Map(allTabs.map((t) => [t.key, t]));
    const hidden = new Set(config.hidden.filter((k) => k !== 'overview'));
    const ordered: Tab[] = [];
    const seen = new Set<string>();

    // 1) overview vždy první
    const overview = byKey.get('overview');
    if (overview) {
        ordered.push(overview);
        seen.add('overview');
    }

    // 2) pak config.order (kromě overview a hidden)
    for (const key of config.order) {
        if (seen.has(key) || hidden.has(key)) continue;
        const tab = byKey.get(key as TabKey);
        if (tab) {
            ordered.push(tab);
            seen.add(key);
        }
    }

    // 3) pak všechny neznámé taby (nové, které nejsou v configu) na konec
    for (const tab of allTabs) {
        if (seen.has(tab.key) || hidden.has(tab.key)) continue;
        ordered.push(tab);
        seen.add(tab.key);
    }

    return ordered;
}

const MORE_BUTTON_WIDTH = 96;
const GAP = 2;
const HORIZONTAL_PADDING = 8;

export default function ProjectTabs({ projectId, active }: ProjectTabsProps) {
    const page = usePage<SharedProps>();
    const tabConfig = page.props.projectTabConfig ?? null;
    const canUpdate = page.props.projectCanUpdate ?? false;

    const orderedTabs = useMemo(() => applyTabConfig(ALL_TABS, tabConfig), [tabConfig]);

    const containerRef = useRef<HTMLElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [tabWidths, setTabWidths] = useState<number[]>([]);
    const [containerWidth, setContainerWidth] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [customizeOpen, setCustomizeOpen] = useState(false);

    // Measure tab widths whenever order/active changes (active affects font weight → width)
    useLayoutEffect(() => {
        const measure = measureRef.current;
        if (!measure) return;
        const widths = Array.from(measure.children).map((el) => (el as HTMLElement).offsetWidth);
        setTabWidths(widths);
    }, [active, orderedTabs]);

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
        () => computeLayout(orderedTabs, tabWidths, containerWidth, active, canUpdate),
        [orderedTabs, tabWidths, containerWidth, active, canUpdate],
    );

    return (
        <>
            {/* Hidden measurement row — renders all ordered tabs off-screen to cache widths */}
            <div
                ref={measureRef}
                aria-hidden
                className="pointer-events-none invisible absolute left-[-9999px] top-0 flex gap-0.5"
            >
                {orderedTabs.map((tab) => (
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

                <div ref={dropdownRef} className="relative ml-auto flex items-center">
                    {overflow.length > 0 && (
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
                    )}

                    {canUpdate && (
                        <button
                            type="button"
                            onClick={() => setCustomizeOpen(true)}
                            title="Přizpůsobit pořadí tabů"
                            aria-label="Přizpůsobit pořadí tabů"
                            className="flex shrink-0 items-center justify-center rounded-md border-l border-border-subtle px-2 py-1.5 text-text-subtle transition-colors hover:bg-surface-secondary hover:text-text-default"
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                        </button>
                    )}

                    {dropdownOpen && overflow.length > 0 && (
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
                            {canUpdate && (
                                <>
                                    <div className="my-1 h-px bg-border-subtle" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            setCustomizeOpen(true);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] font-semibold text-brand-hover transition-colors hover:bg-brand-soft"
                                    >
                                        <Settings2 className="h-3.5 w-3.5" />
                                        Přizpůsobit pořadí…
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {customizeOpen && (
                <ProjectTabsCustomizeModal
                    projectId={projectId}
                    allTabs={ALL_TABS}
                    config={tabConfig}
                    onClose={() => setCustomizeOpen(false)}
                />
            )}
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

const CUSTOMIZE_BUTTON_WIDTH = 40;

function computeLayout(
    tabs: readonly Tab[],
    widths: number[],
    containerWidth: number,
    active: TabKey,
    canUpdate: boolean,
): { visible: Tab[]; overflow: Tab[] } {
    if (widths.length === 0 || containerWidth === 0) {
        return { visible: [...tabs], overflow: [] };
    }

    const customizeReserve = canUpdate ? CUSTOMIZE_BUTTON_WIDTH : 0;

    const fits = (count: number, reserveForMore: boolean): boolean => {
        let used = HORIZONTAL_PADDING + customizeReserve;
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
