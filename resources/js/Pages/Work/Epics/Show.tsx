import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';

interface Task {
    id: string;
    title: string;
    status: string;
    assignee: { id: string; name: string } | null;
}

interface Epic {
    id: string;
    title: string;
    description: string | null;
    status: string;
    owner: { id: string; name: string } | null;
    tasks: Task[];
    tasks_count: number;
    attachments_count: number;
    comments_count: number;
}

interface Props {
    project: { id: string; name: string; key: string };
    epic: Epic;
}

const statusLabels: Record<string, string> = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    done: 'Done',
    cancelled: 'Cancelled',
};

const statusColors: Record<string, string> = {
    backlog: 'bg-status-neutral-subtle text-status-neutral',
    in_progress: 'bg-status-info-subtle text-status-info',
    done: 'bg-status-success-subtle text-status-success',
    cancelled: 'bg-status-neutral-subtle text-text-muted',
};

export default function EpicShow({ project, epic }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Epics', href: `/projects/${project.id}/epics` },
        { label: epic.title },
    ];

    const status = statusColors[epic.status] ?? '';

    return (
        <AppLayout title={`${project.key} — ${epic.title}`} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold leading-tight text-text-strong">{epic.title}</h1>
                        <span
                            className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${status}`}
                        >
                            {statusLabels[epic.status] ?? epic.status}
                        </span>
                    </div>
                    {epic.description && <p className="mt-2 text-base text-text-default">{epic.description}</p>}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border-subtle bg-surface-secondary p-5 text-sm md:grid-cols-4">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Status</span>
                        <p className="mt-1 font-medium text-text-strong">{statusLabels[epic.status] ?? epic.status}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Owner</span>
                        <p className="mt-1 font-medium text-text-strong">{epic.owner?.name ?? '\u2014'}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Tasks</span>
                        <p className="mt-1 font-medium text-text-strong">{epic.tasks_count}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                            Attachments / Comments
                        </span>
                        <p className="mt-1 font-medium text-text-strong">
                            {epic.attachments_count} / {epic.comments_count}
                        </p>
                    </div>
                </div>

                {epic.tasks.length > 0 && (
                    <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">Tasks</h3>
                        <div className="space-y-1">
                            {epic.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between rounded-md border border-border-subtle px-4 py-2 text-sm transition-colors hover:bg-brand-soft"
                                >
                                    <Link
                                        href={`/projects/${project.id}/tasks/${task.id}`}
                                        className="font-medium text-text-strong no-underline hover:text-brand-primary"
                                    >
                                        {task.title}
                                    </Link>
                                    <span className="text-text-muted">{task.assignee?.name ?? 'Unassigned'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
