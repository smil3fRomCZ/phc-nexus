import AppLayout from '@/Layouts/AppLayout';
import { Link, useForm } from '@inertiajs/react';
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

const statusLabels: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'K zpracování',
    in_progress: 'V průběhu',
    in_review: 'V revizi',
    done: 'Hotovo',
    cancelled: 'Zrušeno',
};

const statusColors: Record<string, string> = {
    backlog: 'bg-status-neutral-subtle text-status-neutral',
    todo: 'bg-status-neutral-subtle text-status-neutral',
    in_progress: 'bg-status-info-subtle text-status-info',
    in_review: 'bg-status-warning-subtle text-status-warning',
    done: 'bg-status-success-subtle text-status-success',
    cancelled: 'bg-surface-active text-text-muted',
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

export default function TasksIndex({ project, epic, tasks }: Props) {
    const storeUrl = epic
        ? `/projects/${project.id}/epics/${epic.id}/tasks`
        : `/projects/${project.id}/tasks`;

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        status: 'backlog',
        priority: 'medium',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(storeUrl, {
            onSuccess: () => reset(),
        });
    }

    const backUrl = epic
        ? `/projects/${project.id}/epics/${epic.id}`
        : `/projects/${project.id}`;

    const backLabel = epic ? epic.title : project.name;

    return (
        <AppLayout title={`${project.key} — Úkoly`}>
            <div className="mb-4">
                <Link href={backUrl} className="text-sm text-text-muted hover:text-brand-primary">
                    &larr; {backLabel}
                </Link>
            </div>

            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-strong">
                    Úkoly{epic ? ` — ${epic.title}` : ''}
                </h2>
            </div>

            {/* Quick add */}
            <form onSubmit={submit} className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Název nového úkolu..."
                    className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                />
                <select
                    value={data.priority}
                    onChange={(e) => setData('priority', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="low">Nízká</option>
                    <option value="medium">Střední</option>
                    <option value="high">Vysoká</option>
                    <option value="urgent">Urgentní</option>
                </select>
                <button
                    type="submit"
                    disabled={processing || !data.title}
                    className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                >
                    Přidat
                </button>
            </form>
            {errors.title && <p className="mb-4 text-xs text-status-danger">{errors.title}</p>}

            {/* Task list */}
            <div className="space-y-2">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border border-border-default bg-surface-primary px-4 py-3 hover:bg-surface-hover"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[task.status] ?? ''}`}>
                                {statusLabels[task.status] ?? task.status}
                            </span>
                            <Link
                                href={`/projects/${project.id}/tasks/${task.id}`}
                                className="font-medium text-text-strong hover:text-brand-primary"
                            >
                                {task.title}
                            </Link>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className={priorityColors[task.priority] ?? ''}>
                                {priorityLabels[task.priority] ?? task.priority}
                            </span>
                            <span className="text-text-muted">
                                {task.assignee?.name ?? 'Nepřiřazeno'}
                            </span>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <p className="py-8 text-center text-text-muted">Zatím žádné úkoly. Přidejte první.</p>
                )}
            </div>
        </AppLayout>
    );
}
