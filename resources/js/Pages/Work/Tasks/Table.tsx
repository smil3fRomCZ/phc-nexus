import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import EmptyState from '@/Components/EmptyState';
import FilterSelect from '@/Components/FilterSelect';
import FormSelect from '@/Components/FormSelect';
import SortableHeader, { PlainHeader } from '@/Components/SortableHeader';
import { useFilterRouter } from '@/hooks/useFilterRouter';
import { getPriority } from '@/constants/priority';
import { displayKey } from '@/utils/displayKey';
import { formatDate } from '@/utils/formatDate';
import { Link, router } from '@inertiajs/react';
import { Layers } from 'lucide-react';
import { useState } from 'react';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';

interface Task {
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    assignee: { id: string; name: string } | null;
    reporter: { id: string; name: string } | null;
    epic: { id: string; title: string } | null;
    workflow_status: { id: string; name: string; color: string | null } | null;
}

interface Option {
    value: string;
    label: string;
}

interface Member {
    id: string;
    name: string;
}

interface Props {
    project: { id: string; name: string; key: string; status: string };
    tasks: Task[];
    filters: Record<string, string | undefined>;
    statuses: Option[];
    priorities: Option[];
    members: Member[];
}

export default function TaskTable({ project, tasks, filters, statuses, priorities, members = [] }: Props) {
    const [selected, setSelected] = useState<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState('');

    function toggleSelect(id: string) {
        setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    }

    function toggleAll() {
        setSelected(selected.length === tasks.length ? [] : tasks.map((t) => t.id));
    }

    function handleBulkStatus() {
        if (!bulkStatus || selected.length === 0) return;
        router.post(
            `/projects/${project.id}/tasks/bulk-status`,
            { task_ids: selected, status: bulkStatus },
            {
                onSuccess: () => {
                    setSelected([]);
                    setBulkStatus('');
                },
                preserveScroll: true,
            },
        );
    }

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Backlog' },
    ];

    const applyFilter = useFilterRouter(`/projects/${project.id}/table`, filters, { replace: true });

    function applySort(field: string) {
        const dir = filters.sort === field && filters.dir !== 'desc' ? 'desc' : 'asc';
        router.get(`/projects/${project.id}/table`, { ...filters, sort: field, dir }, { replace: true });
    }

    function handleStatusChange(taskId: string, newStatus: string) {
        router.patch(`/projects/${project.id}/tasks/${taskId}/status`, { status: newStatus }, { preserveScroll: true });
    }

    return (
        <AppLayout title={`${project.key} — Tabulka`} breadcrumbs={breadcrumbs}>
            <div className="mb-4">
                <ProjectHeaderCompact project={project} />
            </div>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="table" />
            </div>

            {/* Filters */}
            <div className="mb-5 flex flex-wrap gap-2">
                <FilterSelect
                    label="Stav"
                    value={filters.status ?? ''}
                    onChange={(v) => applyFilter('status', v)}
                    options={statuses}
                    placeholder="Všechny"
                />
                <FilterSelect
                    label="Priorita"
                    value={filters.priority ?? ''}
                    onChange={(v) => applyFilter('priority', v)}
                    options={priorities}
                    placeholder="Všechny"
                />
                <FilterSelect
                    label="Řešitel"
                    value={filters.assignee_id ?? ''}
                    onChange={(v) => applyFilter('assignee_id', v)}
                    options={members.map((m) => ({ value: m.id, label: m.name }))}
                    placeholder="Všichni"
                />
            </div>

            {/* Bulk Actions */}
            {selected.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-brand-primary/30 bg-brand-soft px-4 py-2">
                    <span className="text-sm font-medium text-text-strong">{selected.length} vybráno</span>
                    <FormSelect
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value)}
                        options={statuses}
                        placeholder="Změnit stav na..."
                    />
                    <Button size="sm" onClick={handleBulkStatus} disabled={!bulkStatus}>
                        Použít
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                        Zrušit
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="w-10 border-b border-border-default bg-surface-secondary px-3 py-3">
                                <input
                                    type="checkbox"
                                    checked={selected.length === tasks.length && tasks.length > 0}
                                    onChange={toggleAll}
                                    className="rounded border-border-default"
                                />
                            </th>
                            {[
                                { field: 'title', label: 'Název', sortable: true },
                                { field: 'status', label: 'Stav', sortable: true },
                                { field: 'priority', label: 'Priorita', sortable: true },
                                { field: 'assignee', label: 'Řešitel', sortable: false },
                                { field: 'epic', label: 'Epic', sortable: false },
                                { field: 'due_date', label: 'Termín', sortable: true },
                            ].map((col) =>
                                col.sortable ? (
                                    <SortableHeader
                                        key={col.field}
                                        field={col.field}
                                        label={col.label}
                                        sortField={filters.sort}
                                        sortDir={filters.dir === 'desc' ? 'desc' : 'asc'}
                                        onSort={applySort}
                                    />
                                ) : (
                                    <PlainHeader key={col.field} label={col.label} />
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr
                                key={task.id}
                                className={`transition-colors ${selected.includes(task.id) ? 'bg-brand-soft' : 'hover:bg-brand-soft'}`}
                            >
                                <td className="border-b border-border-subtle px-3 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(task.id)}
                                        onChange={() => toggleSelect(task.id)}
                                        className="rounded border-border-default"
                                    />
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-base">
                                    <Link
                                        href={`/projects/${project.id}/tasks/${task.id}`}
                                        className="font-medium text-text-strong no-underline hover:text-brand-primary"
                                    >
                                        <span className="mr-1.5 text-xs font-semibold text-text-muted">
                                            {displayKey(project.key, task.number)}
                                        </span>
                                        {task.title}
                                    </Link>
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3">
                                    <select
                                        value={task.workflow_status?.id ?? ''}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        className="rounded-[10px] border-0 px-2 py-px text-xs font-semibold"
                                        style={
                                            task.workflow_status?.color
                                                ? {
                                                      backgroundColor: `${task.workflow_status.color}20`,
                                                      color: task.workflow_status.color,
                                                  }
                                                : undefined
                                        }
                                    >
                                        {statuses.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td
                                    className={`border-b border-border-subtle px-5 py-3 text-xs font-semibold ${getPriority(task.priority).textClass}`}
                                >
                                    {getPriority(task.priority).label}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                    {task.assignee?.name ?? '\u2014'}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                    {task.epic ? (
                                        <Link
                                            href={`/projects/${project.id}/epics/${task.epic.id}`}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-text-default no-underline transition-colors hover:bg-brand-soft hover:text-brand-primary"
                                        >
                                            <Layers className="h-3 w-3 text-text-subtle" />
                                            {task.epic.title}
                                        </Link>
                                    ) : (
                                        '\u2014'
                                    )}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                    {task.due_date ? formatDate(task.due_date) : '\u2014'}
                                </td>
                            </tr>
                        ))}
                        {tasks.length === 0 && <EmptyState message="Žádné úkoly neodpovídají filtrům." colSpan={7} />}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
