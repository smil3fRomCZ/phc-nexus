import { Link } from '@inertiajs/react';
import {
    Info,
    LayoutGrid,
    Table2,
    Layers,
    Timer,
    GanttChart,
    CheckSquare,
    BookOpen,
    Dices,
    BarChart3,
} from 'lucide-react';

interface ProjectTabsProps {
    projectId: string;
    active:
        | 'overview'
        | 'board'
        | 'table'
        | 'epics'
        | 'time'
        | 'gantt'
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
    { key: 'time', path: '/time', label: 'Čas', icon: Timer },
    { key: 'gantt', path: '/gantt', label: 'Gantt', icon: GanttChart },
    { key: 'estimation', path: '/estimation', label: 'Estimation', icon: Dices },
    { key: 'reports', path: '/reports', label: 'Reporty', icon: BarChart3 },
    { key: 'approvals', path: '/approvals', label: 'Schvalování', icon: CheckSquare },
    { key: 'wiki', path: '/wiki', label: 'Dokumentace', icon: BookOpen },
] as const;

export default function ProjectTabs({ projectId, active }: ProjectTabsProps) {
    return (
        <nav className="-mb-px flex overflow-x-auto border-b border-border-subtle scrollbar-hide">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.key === active;
                return (
                    <Link
                        key={tab.key}
                        href={`/projects/${projectId}${tab.path}`}
                        className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium no-underline whitespace-nowrap transition-colors sm:px-4 ${
                            isActive
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-text-muted hover:text-text-default'
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
