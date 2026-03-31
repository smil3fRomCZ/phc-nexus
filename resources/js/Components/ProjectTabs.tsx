import { Link } from '@inertiajs/react';
import { Info, LayoutGrid, Table2, Layers, CheckSquare } from 'lucide-react';

interface ProjectTabsProps {
    projectId: string;
    active: 'overview' | 'board' | 'table' | 'epics' | 'approvals';
}

const TABS = [
    { key: 'overview', path: '', label: 'Přehled', icon: Info },
    { key: 'board', path: '/board', label: 'Board', icon: LayoutGrid },
    { key: 'table', path: '/table', label: 'Tabulka', icon: Table2 },
    { key: 'epics', path: '/epics', label: 'EPIC', icon: Layers },
    { key: 'approvals', path: '/approvals', label: 'Schvalování', icon: CheckSquare },
] as const;

export default function ProjectTabs({ projectId, active }: ProjectTabsProps) {
    return (
        <nav className="flex gap-0 border-b border-border-subtle">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.key === active;
                return (
                    <Link
                        key={tab.key}
                        href={`/projects/${projectId}${tab.path}`}
                        className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium no-underline transition-colors ${
                            isActive
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-text-muted hover:text-text-default'
                        }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
