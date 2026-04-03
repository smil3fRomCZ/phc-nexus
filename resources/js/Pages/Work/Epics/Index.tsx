import EmptyState from '@/Components/EmptyState';
import SortableHeader, { PlainHeader } from '@/Components/SortableHeader';
import StatusBadge from '@/Components/StatusBadge';
import { EPIC_STATUS } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { displayKey } from '@/utils/displayKey';
import { formatDate } from '@/utils/formatDate';
import { Link, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import ProjectTabs from '@/Components/ProjectTabs';
import type { FormEvent } from 'react';

interface Epic {
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    owner: { id: string; name: string } | null;
    tasks_count: number;
    sort_order: number;
    start_date: string | null;
    target_date: string | null;
}

interface Props {
    project: { id: string; name: string; key: string };
    epics: Epic[];
    filters: Record<string, string | undefined>;
}

export default function EpicsIndex({ project, epics, filters = {} }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Epic' },
    ];

    function applySort(field: string) {
        const dir = filters.sort === field && filters.dir !== 'desc' ? 'desc' : 'asc';
        router.get(
            `/projects/${project.id}/epics`,
            { ...filters, sort: field, dir },
            { preserveState: true, replace: true },
        );
    }

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        status: 'backlog',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/projects/${project.id}/epics`, { onSuccess: () => reset() });
    }

    return (
        <AppLayout title={`${project.key} — Epic`} breadcrumbs={breadcrumbs}>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="epics" />
            </div>

            {/* Quick add */}
            <form onSubmit={submit} className="mb-4 flex gap-2">
                <Plus className="mt-2.5 h-4 w-4 flex-shrink-0 text-text-muted" />
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Název nového Epicu..."
                    className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                />
                <button
                    type="submit"
                    disabled={processing || !data.title}
                    className="rounded-md bg-brand-primary px-4 py-2 text-xs font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                >
                    Přidat
                </button>
            </form>
            {errors.title && <p className="mb-4 text-xs text-status-danger">{errors.title}</p>}

            {/* Data grid */}
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {[
                                { field: 'number', label: 'Klíč', sortable: true },
                                { field: 'title', label: 'Název', sortable: true },
                                { field: 'status', label: 'Stav', sortable: true },
                                { field: 'priority', label: 'Priorita', sortable: true },
                                { field: 'owner', label: 'Vlastník', sortable: false },
                                { field: 'tasks_count', label: 'Úkoly', sortable: true },
                                { field: 'start_date', label: 'Start', sortable: true },
                                { field: 'target_date', label: 'Cíl', sortable: true },
                            ].map((col) =>
                                col.sortable ? (
                                    <SortableHeader
                                        key={col.field}
                                        field={col.field}
                                        label={col.label}
                                        sortField={filters.sort}
                                        sortDir={filters.dir === 'desc' ? 'desc' : 'asc'}
                                        onSort={applySort}
                                        className="cursor-pointer select-none border-b-2 border-border-subtle px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle hover:text-text-default"
                                    />
                                ) : (
                                    <PlainHeader
                                        key={col.field}
                                        label={col.label}
                                        className="border-b-2 border-border-subtle px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                    />
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {epics.map((epic) => (
                            <tr
                                key={epic.id}
                                className="cursor-pointer transition-colors hover:bg-brand-soft"
                                onClick={() => (window.location.href = `/projects/${project.id}/epics/${epic.id}`)}
                            >
                                <td className="border-b border-border-subtle px-4 py-2.5 font-mono text-xs font-semibold text-text-muted">
                                    {displayKey(project.key, epic.number)}
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5">
                                    <Link
                                        href={`/projects/${project.id}/epics/${epic.id}`}
                                        className="text-sm font-medium text-text-strong no-underline hover:text-brand-primary"
                                    >
                                        {epic.title}
                                    </Link>
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5">
                                    <StatusBadge statusMap={EPIC_STATUS} value={epic.status} />
                                </td>
                                <td
                                    className={`border-b border-border-subtle px-4 py-2.5 text-xs font-semibold ${getPriority(epic.priority).textClass}`}
                                >
                                    {getPriority(epic.priority).label}
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-muted">
                                    {epic.owner?.name ?? '\u2014'}
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5 text-xs text-text-muted">
                                    {epic.tasks_count} úkolů
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-muted">
                                    {epic.start_date ? formatDate(epic.start_date) : '\u2014'}
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-muted">
                                    {epic.target_date ? formatDate(epic.target_date) : '\u2014'}
                                </td>
                            </tr>
                        ))}
                        {epics.length === 0 && <EmptyState message="Zatím žádné epicy. Přidejte první." colSpan={8} />}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
