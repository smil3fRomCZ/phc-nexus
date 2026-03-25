import AppLayout from '@/Layouts/AppLayout';
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
    todo: 'K zpracování',
    in_progress: 'V průběhu',
    in_review: 'V revizi',
    done: 'Hotovo',
    cancelled: 'Zrušeno',
};

const priorityLabels: Record<string, string> = {
    low: 'Nízká',
    medium: 'Střední',
    high: 'Vysoká',
    urgent: 'Urgentní',
};

const priorityColors: Record<string, string> = {
    low: 'text-text-muted',
    medium: 'text-text-default',
    high: 'text-status-warning',
    urgent: 'text-status-danger',
};

export default function TaskShow({ project, task }: Props) {
    return (
        <AppLayout title={`${project.key} — ${task.title}`}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-4">
                    <Link href={`/projects/${project.id}/tasks`} className="text-sm text-text-muted hover:text-brand-primary">
                        &larr; Úkoly
                    </Link>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-text-strong">{task.title}</h2>
                    {task.description && (
                        <p className="mt-2 text-text-default">{task.description}</p>
                    )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border-default bg-surface-secondary p-4 text-sm md:grid-cols-4">
                    <div>
                        <span className="text-text-muted">Status</span>
                        <p className="font-medium text-text-strong">{statusLabels[task.status] ?? task.status}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Priorita</span>
                        <p className={`font-medium ${priorityColors[task.priority] ?? ''}`}>
                            {priorityLabels[task.priority] ?? task.priority}
                        </p>
                    </div>
                    <div>
                        <span className="text-text-muted">Přiřazeno</span>
                        <p className="font-medium text-text-strong">{task.assignee?.name ?? '—'}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Reporter</span>
                        <p className="font-medium text-text-strong">{task.reporter?.name ?? '—'}</p>
                    </div>
                    {task.epic && (
                        <div>
                            <span className="text-text-muted">Epik</span>
                            <p className="font-medium text-text-strong">
                                <Link
                                    href={`/projects/${project.id}/epics/${task.epic.id}`}
                                    className="hover:text-brand-primary"
                                >
                                    {task.epic.title}
                                </Link>
                            </p>
                        </div>
                    )}
                    {task.due_date && (
                        <div>
                            <span className="text-text-muted">Termín</span>
                            <p className="font-medium text-text-strong">{task.due_date}</p>
                        </div>
                    )}
                    <div>
                        <span className="text-text-muted">Příloh / Komentářů</span>
                        <p className="font-medium text-text-strong">{task.attachments_count} / {task.comments_count}</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
