import { Link } from '@inertiajs/react';
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
} from 'lucide-react';

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
        | 'wiki';
}

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
    { key: 'approvals', path: '/approvals', label: 'Schvalování', icon: CheckSquare },
    { key: 'wiki', path: '/wiki', label: 'Dokumentace', icon: BookOpen },
] as const;

export default function ProjectTabs({ projectId, active }: ProjectTabsProps) {
    return (
        <nav className="inline-flex gap-0.5 overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary p-1 scrollbar-hide">
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
        </nav>
    );
}
