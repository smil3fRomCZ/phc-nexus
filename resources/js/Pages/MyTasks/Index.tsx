import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import StatusBadge from '@/Components/StatusBadge';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import type { PaginationLink } from '@/Components/Pagination';

import { getPriority } from '@/constants/priority';
import { formatDate } from '@/utils/formatDate';
import { displayKey } from '@/utils/displayKey';
import { Link, router } from '@inertiajs/react';

interface Task {
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    project: { id: string; name: string; key: string } | null;
    epic: { id: string; title: string } | null;
    workflow_status: { id: string; name: string; color: string | null } | null;
}

interface SelectOption {
    value: string;
    label: string;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
}

interface Props {
    tasks: Paginated<Task>;
    filters: { status?: string; priority?: string };
    statuses: SelectOption[];
    priorities: SelectOption[];
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Moje úkoly' }];

function formatDueDate(dateStr: string | null): { text: string; overdue: boolean } {
    if (!dateStr) return { text: '\u2014', overdue: false };
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = date < now;
    const text = formatDate(dateStr);
    return { text: overdue ? `${text} — PO TERMÍNU` : text, overdue };
}

export default function MyTasksIndex({ tasks, filters, statuses, priorities }: Props) {
    function applyFilter(key: string, value: string) {
        const params = new URLSearchParams(window.location.search);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.get('/my-tasks', Object.fromEntries(params), { preserveState: true });
    }

    return (
        <AppLayout title="Moje úkoly" breadcrumbs={BREADCRUMBS}>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">Moje úkoly</h1>
                <div className="flex gap-3">
                    <select
                        value={filters.status ?? ''}
                        onChange={(e) => applyFilter('status', e.target.value)}
                        className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                    >
                        <option value="">Všechny stavy</option>
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.priority ?? ''}
                        onChange={(e) => applyFilter('priority', e.target.value)}
                        className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                    >
                        <option value="">Všechny priority</option>
                        {priorities.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {['Úkol', 'Projekt', 'Epic', 'Stav', 'Priorita', 'Termín'].map((header) => (
                                <th
                                    key={header}
                                    className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.data.map((task) => {
                            const due = formatDueDate(task.due_date);
                            const priority = getPriority(task.priority);
                            return (
                                <tr key={task.id} className="transition-colors hover:bg-brand-soft">
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm font-medium text-text-strong">
                                        {task.project ? (
                                            <Link
                                                href={`/projects/${task.project.id}/tasks/${task.id}`}
                                                className="no-underline hover:text-brand-primary"
                                            >
                                                <span className="mr-1.5 text-xs font-semibold text-text-muted">
                                                    {displayKey(task.project.key, task.number)}
                                                </span>
                                                {task.title}
                                            </Link>
                                        ) : (
                                            task.title
                                        )}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                        {task.project ? (
                                            <Link
                                                href={`/projects/${task.project.id}`}
                                                className="no-underline hover:text-brand-primary"
                                            >
                                                {task.project.name}
                                            </Link>
                                        ) : (
                                            '\u2014'
                                        )}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                        {task.epic?.title ?? '\u2014'}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        <StatusBadge
                                            label={task.workflow_status?.name ?? task.status}
                                            color={task.workflow_status?.color ?? null}
                                        />
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${priority.textClass === 'text-status-danger' ? 'bg-status-danger-subtle text-status-danger' : priority.textClass === 'text-status-warning' ? 'bg-status-warning-subtle text-status-warning' : priority.textClass === 'text-text-muted' ? 'bg-status-info-subtle text-status-info' : 'bg-status-neutral-subtle text-status-neutral'}`}
                                        >
                                            {priority.label}
                                        </span>
                                    </td>
                                    <td
                                        className={`border-b border-border-subtle px-5 py-3 text-sm ${due.overdue ? 'font-semibold text-status-danger' : 'text-text-muted'}`}
                                    >
                                        {due.text}
                                    </td>
                                </tr>
                            );
                        })}
                        {tasks.data.length === 0 && <EmptyState colSpan={6} message="Nemáte přiřazené žádné úkoly." />}
                    </tbody>
                </table>
            </div>

            <Pagination links={tasks.links} />
        </AppLayout>
    );
}
