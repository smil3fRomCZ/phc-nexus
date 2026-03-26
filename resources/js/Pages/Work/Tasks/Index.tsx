import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import StatusBadge from '@/Components/StatusBadge';
import { TASK_STATUS } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import { Link, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee: { id: string; name: string } | null;
    reporter: { id: string; name: string } | null;
    sort_order: number;
}

interface Props {
    project: { id: string; name: string; key: string };
    epic?: { id: string; title: string };
    tasks: Task[];
}

export default function TasksIndex({ project, epic, tasks }: Props) {
    const storeUrl = epic ? `/projects/${project.id}/epics/${epic.id}/tasks` : `/projects/${project.id}/tasks`;

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        status: 'backlog',
        priority: 'medium',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(storeUrl, { onSuccess: () => reset() });
    }

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        ...(epic
            ? [
                  { label: 'Epics', href: `/projects/${project.id}/epics` },
                  { label: epic.title, href: `/projects/${project.id}/epics/${epic.id}` },
                  { label: 'Tasks' },
              ]
            : [{ label: 'Tasks' }]),
    ];

    return (
        <AppLayout title={`${project.key} — Tasks`} breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">
                    Tasks{epic ? ` — ${epic.title}` : ''}
                </h1>
            </div>

            {/* Quick add */}
            <form onSubmit={submit} className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="New task title..."
                    className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                />
                <select
                    value={data.priority}
                    onChange={(e) => setData('priority', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
                <button
                    type="submit"
                    disabled={processing || !data.title}
                    className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Add
                </button>
            </form>
            {errors.title && <p className="mb-4 text-xs text-status-danger">{errors.title}</p>}

            {/* Task list */}
            <div className="space-y-2">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-primary px-5 py-3 transition-colors hover:bg-brand-soft"
                    >
                        <div className="flex items-center gap-3">
                            <StatusBadge statusMap={TASK_STATUS} value={task.status} />
                            <Link
                                href={`/projects/${project.id}/tasks/${task.id}`}
                                className="text-base font-medium text-text-strong no-underline hover:text-brand-primary"
                            >
                                {task.title}
                            </Link>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className={getPriority(task.priority).textClass}>
                                {getPriority(task.priority).label}
                            </span>
                            <span className="text-text-muted">{task.assignee?.name ?? 'Unassigned'}</span>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && <EmptyState message="No tasks yet. Add your first one." />}
            </div>
        </AppLayout>
    );
}
