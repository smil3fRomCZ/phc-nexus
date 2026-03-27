import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import { TASK_STATUS, getStatus } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    assignee: { id: string; name: string } | null;
    reporter: { id: string; name: string } | null;
    epic: { id: string; title: string } | null;
}

interface Option {
    value: string;
    label: string;
}

interface Props {
    project: { id: string; name: string; key: string };
    tasks: Task[];
    filters: Record<string, string | undefined>;
    statuses: Option[];
    priorities: Option[];
}

export default function TaskTable({ project, tasks, filters, statuses, priorities }: Props) {
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
        fetch(`/projects/${project.id}/tasks/bulk-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ task_ids: selected, status: bulkStatus }),
        }).then((res) => {
            if (res.ok) {
                setSelected([]);
                setBulkStatus('');
                router.reload({ only: ['tasks'] });
            }
        });
    }

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Table' },
    ];

    function applyFilter(key: string, value: string) {
        const params = { ...filters, [key]: value || undefined };
        router.get(`/projects/${project.id}/table`, params, {
            preserveState: true,
            replace: true,
        });
    }

    function applySort(field: string) {
        const dir = filters.sort === field && filters.dir !== 'desc' ? 'desc' : 'asc';
        router.get(
            `/projects/${project.id}/table`,
            { ...filters, sort: field, dir },
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    function sortIndicator(field: string) {
        if (filters.sort !== field) return '';
        return filters.dir === 'desc' ? ' \u25BC' : ' \u25B2';
    }

    function handleStatusChange(taskId: string, newStatus: string) {
        fetch(`/projects/${project.id}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        }).then((res) => {
            if (res.ok) {
                router.reload({ only: ['tasks'] });
            }
        });
    }

    return (
        <AppLayout title={`${project.key} — Table`} breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">Table</h1>
                <div className="flex gap-2">
                    <Link
                        href={`/projects/${project.id}/board`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Board
                    </Link>
                    <Link
                        href={`/projects/${project.id}/table`}
                        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse no-underline"
                    >
                        Table
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-5 flex gap-3">
                <select
                    value={filters.status ?? ''}
                    onChange={(e) => applyFilter('status', e.target.value)}
                    className="h-8 rounded-md border border-border-default bg-surface-primary px-3 text-sm focus:border-brand-primary focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                >
                    <option value="">All Statuses</option>
                    {statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.priority ?? ''}
                    onChange={(e) => applyFilter('priority', e.target.value)}
                    className="h-8 rounded-md border border-border-default bg-surface-primary px-3 text-sm focus:border-brand-primary focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                >
                    <option value="">All Priorities</option>
                    {priorities.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Bulk Actions */}
            {selected.length > 0 && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-brand-primary/30 bg-brand-soft px-4 py-2">
                    <span className="text-sm font-medium text-text-strong">{selected.length} selected</span>
                    <select
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value)}
                        className="rounded-md border border-border-default bg-surface-primary px-3 py-1 text-sm"
                    >
                        <option value="">Change status to...</option>
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleBulkStatus}
                        disabled={!bulkStatus}
                        className="rounded-md bg-brand-primary px-3 py-1 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                    >
                        Apply
                    </button>
                    <button onClick={() => setSelected([])} className="text-sm text-text-muted hover:text-text-default">
                        Clear
                    </button>
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
                                { field: 'title', label: 'Title', sortable: true },
                                { field: 'status', label: 'Status', sortable: true },
                                { field: 'priority', label: 'Priority', sortable: true },
                                { field: 'assignee', label: 'Assignee', sortable: false },
                                { field: 'epic', label: 'Epic', sortable: false },
                                { field: 'due_date', label: 'Due Date', sortable: true },
                            ].map((col) => (
                                <th
                                    key={col.field}
                                    className={`border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle ${
                                        col.sortable ? 'cursor-pointer' : ''
                                    }`}
                                    onClick={col.sortable ? () => applySort(col.field) : undefined}
                                >
                                    {col.label}
                                    {col.sortable ? sortIndicator(col.field) : ''}
                                </th>
                            ))}
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
                                        {task.title}
                                    </Link>
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3">
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        className={`rounded-[10px] border-0 px-2 py-px text-xs font-semibold ${getStatus(TASK_STATUS, task.status).className}`}
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
                                            className="no-underline hover:text-brand-primary"
                                        >
                                            {task.epic.title}
                                        </Link>
                                    ) : (
                                        '\u2014'
                                    )}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                    {task.due_date ?? '\u2014'}
                                </td>
                            </tr>
                        ))}
                        {tasks.length === 0 && <EmptyState message="No tasks match your filters." colSpan={7} />}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
