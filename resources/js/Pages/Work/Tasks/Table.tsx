import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';

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

const statusColors: Record<string, string> = {
    backlog: 'bg-status-neutral-subtle text-status-neutral',
    todo: 'bg-status-neutral-subtle text-status-neutral',
    in_progress: 'bg-status-info-subtle text-status-info',
    in_review: 'bg-status-review-subtle text-status-review',
    done: 'bg-status-success-subtle text-status-success',
    cancelled: 'bg-status-neutral-subtle text-text-muted',
};

const priorityColors: Record<string, string> = {
    low: 'text-text-muted',
    medium: 'text-text-default',
    high: 'text-status-warning',
    urgent: 'text-status-danger',
};

export default function TaskTable({ project, tasks, filters, statuses, priorities }: Props) {
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

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
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
                            <tr key={task.id} className="transition-colors hover:bg-brand-soft">
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
                                        className={`rounded-[10px] border-0 px-2 py-px text-xs font-semibold ${statusColors[task.status] ?? ''}`}
                                    >
                                        {statuses.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td
                                    className={`border-b border-border-subtle px-5 py-3 text-xs font-semibold ${priorityColors[task.priority] ?? ''}`}
                                >
                                    {priorities.find((p) => p.value === task.priority)?.label ?? task.priority}
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
                        {tasks.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-8 text-center text-base text-text-muted">
                                    No tasks match your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
