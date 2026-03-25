import AppLayout from '@/Layouts/AppLayout';
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
    in_progress: 'V průběhu',
    done: 'Hotovo',
    cancelled: 'Zrušeno',
};

export default function EpicShow({ project, epic }: Props) {
    return (
        <AppLayout title={`${project.key} — ${epic.title}`}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-4">
                    <Link href={`/projects/${project.id}/epics`} className="text-sm text-text-muted hover:text-brand-primary">
                        &larr; Epiky
                    </Link>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-text-strong">{epic.title}</h2>
                    {epic.description && (
                        <p className="mt-2 text-text-default">{epic.description}</p>
                    )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border-default bg-surface-secondary p-4 text-sm md:grid-cols-4">
                    <div>
                        <span className="text-text-muted">Status</span>
                        <p className="font-medium text-text-strong">{statusLabels[epic.status] ?? epic.status}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Vlastník</span>
                        <p className="font-medium text-text-strong">{epic.owner?.name ?? '—'}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Úkolů</span>
                        <p className="font-medium text-text-strong">{epic.tasks_count}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Příloh / Komentářů</span>
                        <p className="font-medium text-text-strong">{epic.attachments_count} / {epic.comments_count}</p>
                    </div>
                </div>

                {epic.tasks.length > 0 && (
                    <div>
                        <h3 className="mb-3 text-sm font-medium text-text-muted">Úkoly</h3>
                        <div className="space-y-1">
                            {epic.tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between rounded border border-border-default px-3 py-2 text-sm">
                                    <span className="text-text-strong">{task.title}</span>
                                    <span className="text-text-muted">{task.assignee?.name ?? 'Nepřiřazeno'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
