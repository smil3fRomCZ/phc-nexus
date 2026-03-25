import AppLayout from '@/Layouts/AppLayout';
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
    in_review: 'bg-status-warning-subtle text-status-warning',
    done: 'bg-status-success-subtle text-status-success',
    cancelled: 'bg-surface-active text-text-muted',
};

const priorityColors: Record<string, string> = {
    low: 'text-text-muted',
    medium: 'text-text-default',
    high: 'text-status-warning',
    urgent: 'text-status-danger',
};

export default function TaskTable({ project, tasks, filters, statuses, priorities }: Props) {
    function applyFilter(key: string, value: string) {
        const params = { ...filters, [key]: value || undefined };
        router.get(`/projects/${project.id}/table`, params, {
            preserveState: true,
            replace: true,
        });
    }

    function applySort(field: string) {
        const dir = filters.sort === field && filters.dir !== 'desc' ? 'desc' : 'asc';
        router.get(`/projects/${project.id}/table`, { ...filters, sort: field, dir }, {
            preserveState: true,
            replace: true,
        });
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
                'Accept': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        }).then((res) => {
            if (res.ok) {
                router.reload({ only: ['tasks'] });
            }
        });
    }

    return (
        <AppLayout title={`${project.key} — Tabulka`}>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${project.id}`} className="text-sm text-text-muted hover:text-brand-primary">
                        &larr; {project.name}
                    </Link>
                    <h2 className="text-xl font-semibold text-text-strong">Tabulka</h2>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/projects/${project.id}/board`}
                        className="rounded-md border border-border-default px-3 py-1.5 text-sm font-medium text-text-default hover:bg-surface-hover"
                    >
                        Board
                    </Link>
                    <Link
                        href={`/projects/${project.id}/table`}
                        className="rounded-md bg-brand-primary px-3 py-1.5 text-sm font-medium text-text-inverse"
                    >
                        Tabulka
                    </Link>
                </div>
            </div>

            {/* Filtry */}
            <div className="mb-4 flex gap-3">
                <select
                    value={filters.status ?? ''}
                    onChange={(e) => applyFilter('status', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="">Všechny stavy</option>
                    {statuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
                <select
                    value={filters.priority ?? ''}
                    onChange={(e) => applyFilter('priority', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="">Všechny priority</option>
                    {priorities.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>

            {/* Tabulka */}
            <div className="overflow-x-auto rounded-lg border border-border-default">
                <table className="w-full text-sm">
                    <thead className="bg-surface-secondary text-left text-text-muted">
                        <tr>
                            <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => applySort('title')}>
                                Název{sortIndicator('title')}
                            </th>
                            <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => applySort('status')}>
                                Status{sortIndicator('status')}
                            </th>
                            <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => applySort('priority')}>
                                Priorita{sortIndicator('priority')}
                            </th>
                            <th className="px-4 py-3 font-medium">Přiřazeno</th>
                            <th className="px-4 py-3 font-medium">Epik</th>
                            <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => applySort('due_date')}>
                                Termín{sortIndicator('due_date')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                        {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-surface-hover">
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/projects/${project.id}/tasks/${task.id}`}
                                        className="font-medium text-text-strong hover:text-brand-primary"
                                    >
                                        {task.title}
                                    </Link>
                                </td>
                                <td className="px-4 py-3">
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${statusColors[task.status] ?? ''}`}
                                    >
                                        {statuses.map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className={`px-4 py-3 text-xs font-medium ${priorityColors[task.priority] ?? ''}`}>
                                    {priorities.find((p) => p.value === task.priority)?.label ?? task.priority}
                                </td>
                                <td className="px-4 py-3 text-text-muted">
                                    {task.assignee?.name ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-text-muted">
                                    {task.epic ? (
                                        <Link href={`/projects/${project.id}/epics/${task.epic.id}`} className="hover:text-brand-primary">
                                            {task.epic.title}
                                        </Link>
                                    ) : '—'}
                                </td>
                                <td className="px-4 py-3 text-text-muted">
                                    {task.due_date ?? '—'}
                                </td>
                            </tr>
                        ))}
                        {tasks.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                                    Žádné úkoly neodpovídají filtrům.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
