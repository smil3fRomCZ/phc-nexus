import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignee: { id: string; name: string } | null;
    reporter: { id: string; name: string } | null;
    epic: { id: string; title: string } | null;
    due_date: string | null;
    attachments_count: number;
    comments_count: number;
}

interface Props {
    project: { id: string; name: string; key: string };
    task: Task;
}

const statusLabels: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
    cancelled: 'Cancelled',
};

const statusColors: Record<string, string> = {
    backlog: 'bg-status-neutral-subtle text-status-neutral',
    todo: 'bg-status-neutral-subtle text-status-neutral',
    in_progress: 'bg-status-info-subtle text-status-info',
    in_review: 'bg-status-review-subtle text-status-review',
    done: 'bg-status-success-subtle text-status-success',
    cancelled: 'bg-status-neutral-subtle text-text-muted',
};

const priorityLabels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

const priorityColors: Record<string, string> = {
    low: 'text-text-muted',
    medium: 'text-text-default',
    high: 'text-status-warning',
    urgent: 'text-status-danger',
};

export default function TaskShow({ project, task }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Tasks', href: `/projects/${project.id}/tasks` },
        { label: task.title },
    ];

    const status = statusColors[task.status] ?? '';

    return (
        <AppLayout title={`${project.key} — ${task.title}`} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold leading-tight text-text-strong">
                            {task.title}
                        </h1>
                        <span className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${status}`}>
                            {statusLabels[task.status] ?? task.status}
                        </span>
                    </div>
                    {task.description && (
                        <p className="mt-2 text-base text-text-default">{task.description}</p>
                    )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border-subtle bg-surface-secondary p-5 text-sm md:grid-cols-4">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Status</span>
                        <p className="mt-1 font-medium text-text-strong">{statusLabels[task.status] ?? task.status}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Priority</span>
                        <p className={`mt-1 font-medium ${priorityColors[task.priority] ?? ''}`}>
                            {priorityLabels[task.priority] ?? task.priority}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Assignee</span>
                        <p className="mt-1 font-medium text-text-strong">{task.assignee?.name ?? '\u2014'}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Reporter</span>
                        <p className="mt-1 font-medium text-text-strong">{task.reporter?.name ?? '\u2014'}</p>
                    </div>
                    {task.epic && (
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Epic</span>
                            <p className="mt-1 font-medium text-text-strong">
                                <Link
                                    href={`/projects/${project.id}/epics/${task.epic.id}`}
                                    className="no-underline hover:text-brand-primary"
                                >
                                    {task.epic.title}
                                </Link>
                            </p>
                        </div>
                    )}
                    {task.due_date && (
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Due Date</span>
                            <p className="mt-1 font-medium text-text-strong">{task.due_date}</p>
                        </div>
                    )}
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Attachments / Comments</span>
                        <p className="mt-1 font-medium text-text-strong">{task.attachments_count} / {task.comments_count}</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
