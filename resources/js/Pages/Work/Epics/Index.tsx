import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { Link, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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

export default function EpicsIndex({ project, epics }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Epics' },
    ];

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        status: 'backlog',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/projects/${project.id}/epics`, { onSuccess: () => reset() });
    }

    return (
        <AppLayout title={`${project.key} — Epics`} breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">Epics</h1>
            </div>

            {/* Quick add */}
            <form onSubmit={submit} className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="New epic title..."
                    className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                />
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

            {/* Epic list */}
            <div className="space-y-2">
                {epics.map((epic) => (
                    <div
                        key={epic.id}
                        className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-primary px-5 py-3 transition-colors hover:bg-brand-soft"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${statusColors[epic.status] ?? ''}`}>
                                {statusLabels[epic.status] ?? epic.status}
                            </span>
                            <Link
                                href={`/projects/${project.id}/epics/${epic.id}`}
                                className="text-base font-medium text-text-strong no-underline hover:text-brand-primary"
                            >
                                {epic.title}
                            </Link>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-muted">
                            {epic.owner && <span>{epic.owner.name}</span>}
                            <span>{epic.tasks_count} tasks</span>
                        </div>
                    </div>
                ))}
                {epics.length === 0 && (
                    <p className="py-8 text-center text-base text-text-muted">
                        No epics yet. Add your first one.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
