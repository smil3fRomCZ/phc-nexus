import AppLayout from '@/Layouts/AppLayout';
import { Link, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Epic {
    id: string;
    title: string;
    status: string;
    owner: { id: string; name: string } | null;
    tasks_count: number;
    sort_order: number;
}

interface Props {
    project: { id: string; name: string; key: string };
    epics: Epic[];
}

const statusLabels: Record<string, string> = {
    backlog: 'Backlog',
    in_progress: 'V průběhu',
    done: 'Hotovo',
    cancelled: 'Zrušeno',
};

const statusColors: Record<string, string> = {
    backlog: 'bg-status-neutral-subtle text-status-neutral',
    in_progress: 'bg-status-info-subtle text-status-info',
    done: 'bg-status-success-subtle text-status-success',
    cancelled: 'bg-surface-active text-text-muted',
};

export default function EpicsIndex({ project, epics }: Props) {
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        status: 'backlog',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/projects/${project.id}/epics`, {
            onSuccess: () => reset(),
        });
    }

    return (
        <AppLayout title={`${project.key} — Epiky`}>
            <div className="mb-4">
                <Link href={`/projects/${project.id}`} className="text-sm text-text-muted hover:text-brand-primary">
                    &larr; {project.name}
                </Link>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-strong">Epiky</h2>
            </div>

            {/* Quick add */}
            <form onSubmit={submit} className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Název nového epiku..."
                    className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={processing || !data.title}
                    className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                >
                    Přidat
                </button>
            </form>
            {errors.title && <p className="mb-4 text-xs text-status-danger">{errors.title}</p>}

            {/* Epic list */}
            <div className="space-y-2">
                {epics.map((epic) => (
                    <div
                        key={epic.id}
                        className="flex items-center justify-between rounded-lg border border-border-default bg-surface-primary px-4 py-3 hover:bg-surface-hover"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[epic.status] ?? ''}`}>
                                {statusLabels[epic.status] ?? epic.status}
                            </span>
                            <Link
                                href={`/projects/${project.id}/epics/${epic.id}`}
                                className="font-medium text-text-strong hover:text-brand-primary"
                            >
                                {epic.title}
                            </Link>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-muted">
                            {epic.owner && <span>{epic.owner.name}</span>}
                            <span>{epic.tasks_count} úkolů</span>
                        </div>
                    </div>
                ))}
                {epics.length === 0 && (
                    <p className="py-8 text-center text-text-muted">Zatím žádné epiky. Přidejte první.</p>
                )}
            </div>
        </AppLayout>
    );
}
