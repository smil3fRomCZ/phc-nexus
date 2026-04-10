import { Link, usePage } from '@inertiajs/react';
import {
    Info,
    LayoutGrid,
    Table2,
    Layers,
    Users,
    Timer,
    GanttChart,
    CheckSquare,
    BookOpen,
    Dices,
    BarChart3,
    GitBranch,
    History,
} from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

interface ProjectTabsProps {
    projectId: string;
    active:
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
    lastUpdate?: { health: 'on_track' | 'at_risk' | 'blocked'; created_at: string | null } | null;
}

type SharedProps = {
    projectLastUpdate?: { health: 'on_track' | 'at_risk' | 'blocked'; created_at: string | null } | null;
};

const TABS = [
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
] as const;

const HEALTH_DOT: Record<string, string> = {
    on_track: 'bg-status-success',
    at_risk: 'bg-status-warning',
    blocked: 'bg-status-danger',
};

export default function ProjectTabs({ projectId, active, lastUpdate }: ProjectTabsProps) {
    const page = usePage<SharedProps>();
    const update = lastUpdate ?? page.props.projectLastUpdate ?? null;
    return (
        <nav className="flex w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary p-1 scrollbar-hide">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.key === active;
                return (
                    <Link
                        key={tab.key}
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
            })}
            <div className="flex-1" />
            {update && (
                <Link
                    href={`/projects/${projectId}/history`}
                    title="Poslední status update — kliknutím zobrazit historii"
                    className="mr-1 hidden shrink-0 items-center gap-2 rounded-md border border-border-subtle bg-surface-secondary px-3 py-1.5 text-xs text-text-muted no-underline transition-colors hover:bg-surface-hover hover:text-text-default md:flex"
                >
                    <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${HEALTH_DOT[update.health] ?? 'bg-text-subtle'}`}
                    />
                    Poslední update:{' '}
                    <strong className="font-semibold text-text-default">
                        {update.created_at ? formatDate(update.created_at) : '—'}
                    </strong>
                </Link>
            )}
        </nav>
    );
}
