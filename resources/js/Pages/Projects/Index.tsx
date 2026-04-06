import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import EmptyState from '@/Components/EmptyState';
import FilterSelect from '@/Components/FilterSelect';
import SearchInput from '@/Components/SearchInput';
import StatusBadge from '@/Components/StatusBadge';
import { PROJECT_STATUS } from '@/constants/status';
import { formatDate } from '@/utils/formatDate';
import SortableHeader, { PlainHeader } from '@/Components/SortableHeader';
import { useClientSort } from '@/hooks/useSortable';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Projekty' }];

interface Project {
    id: string;
    name: string;
    key: string;
    status: string;
    owner: { id: string; name: string } | null;
    team: { id: string; name: string } | null;
    members_count: number;
    tasks_count: number;
    tasks_completed_count: number;
    updated_at: string;
}

interface Props {
    projects: {
        data: Project[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

function getProgress(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

function compareProjects(a: Project, b: Project, field: string): number {
    switch (field) {
        case 'name':
            return a.name.localeCompare(b.name, 'cs');
        case 'status':
            return a.status.localeCompare(b.status, 'cs');
        case 'tasks_count':
            return a.tasks_count - b.tasks_count;
        case 'progress':
            return (
                getProgress(a.tasks_completed_count, a.tasks_count) -
                getProgress(b.tasks_completed_count, b.tasks_count)
            );
        case 'updated_at':
            return a.updated_at.localeCompare(b.updated_at);
        default:
            return 0;
    }
}

export default function ProjectsIndex({ projects }: Props) {
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = projects.data.filter((project) => {
        const matchesStatus = !statusFilter || project.status === statusFilter;
        const matchesSearch = !searchQuery || project.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const { sorted: filteredProjects, sortField, sortDir, toggle } = useClientSort(filtered, compareProjects);

    const statusOptions = Object.entries(PROJECT_STATUS).map(([value, config]) => ({
        value,
        label: config.label,
    }));

    return (
        <AppLayout title="Projekty" breadcrumbs={BREADCRUMBS}>
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold leading-tight text-text-strong">Projekty</h1>
                <Link
                    href="/projects/create"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary px-5 py-2 text-xs font-medium text-text-inverse no-underline transition-colors hover:bg-brand-hover"
                >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Nový projekt
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <FilterSelect
                    label="Stav"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                    placeholder="Všechny"
                />

                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Hledat projekty..." />
            </div>

            {/* Projects Table */}
            <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <SortableHeader
                                field="name"
                                label="Název projektu"
                                sortField={sortField}
                                sortDir={sortDir}
                                onSort={toggle}
                            />
                            <SortableHeader
                                field="status"
                                label="Stav"
                                sortField={sortField}
                                sortDir={sortDir}
                                onSort={toggle}
                            />
                            <PlainHeader label="Vlastník" />
                            <PlainHeader label="Tým" />
                            <SortableHeader
                                field="tasks_count"
                                label="Úkoly"
                                sortField={sortField}
                                sortDir={sortDir}
                                onSort={toggle}
                            />
                            <SortableHeader
                                field="progress"
                                label="Průběh"
                                sortField={sortField}
                                sortDir={sortDir}
                                onSort={toggle}
                            />
                            <SortableHeader
                                field="updated_at"
                                label="Aktualizováno"
                                sortField={sortField}
                                sortDir={sortDir}
                                onSort={toggle}
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.map((project) => {
                            const progress = getProgress(project.tasks_completed_count, project.tasks_count);

                            return (
                                <tr key={project.id} className="transition-colors duration-100 hover:bg-brand-soft">
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm font-medium text-text-strong">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="text-text-strong no-underline hover:text-brand-primary"
                                        >
                                            {project.name}
                                        </Link>
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        <StatusBadge statusMap={PROJECT_STATUS} value={project.status} />
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        {project.owner ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar name={project.owner.name} />
                                                <span className="text-xs text-text-default">{project.owner.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-text-muted">&mdash;</span>
                                        )}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-default">
                                        {project.team?.name ?? '\u2014'}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-xs text-text-muted">
                                        {project.tasks_completed_count}/{project.tasks_count}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle"
                                                style={{ minWidth: 60 }}
                                            >
                                                <div
                                                    className="h-full rounded-full bg-brand-primary transition-[width] duration-300 ease-out"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="min-w-[28px] text-right text-[11px] font-medium text-text-muted">
                                                {progress}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-xs text-text-muted">
                                        {formatDate(project.updated_at)}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProjects.length === 0 && (
                            <EmptyState
                                colSpan={7}
                                message={
                                    projects.data.length === 0
                                        ? 'Zatím žádné projekty. Vytvořte svůj první.'
                                        : 'Žádné projekty neodpovídají filtrům.'
                                }
                            />
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
