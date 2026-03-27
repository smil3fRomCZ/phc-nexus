import { MetadataGrid, MetadataField } from '@/Components/MetadataGrid';
import StatusBadge from '@/Components/StatusBadge';
import { EPIC_STATUS } from '@/constants/status';
import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { Link, router, useForm } from '@inertiajs/react';
import { Pencil, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

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

interface Member {
    id: string;
    name: string;
}

interface SelectOption {
    value: string;
    label: string;
}

interface Props {
    project: { id: string; name: string; key: string };
    epic: Epic;
    members: Member[];
    statuses: SelectOption[];
}

export default function EpicShow({ project, epic, members, statuses }: Props) {
    const [editing, setEditing] = useState(false);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Epics', href: `/projects/${project.id}/epics` },
        { label: epic.title },
    ];

    return (
        <AppLayout title={`${project.key} — ${epic.title}`} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold leading-tight text-text-strong">{epic.title}</h1>
                        <StatusBadge statusMap={EPIC_STATUS} value={epic.status} />
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={() => setEditing(true)}
                                className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default"
                            >
                                <Pencil className="mr-1 inline-block h-3 w-3" />
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this epic? This action cannot be undone.')) {
                                        router.delete(`/projects/${project.id}/epics/${epic.id}`);
                                    }
                                }}
                                className="rounded-md border border-status-danger/30 px-3 py-1.5 text-xs font-medium text-status-danger transition-colors hover:bg-status-danger-subtle"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                    {epic.description && <p className="mt-2 text-base text-text-default">{epic.description}</p>}
                </div>

                {editing && (
                    <EpicEditDialog
                        project={project}
                        epic={epic}
                        members={members}
                        statuses={statuses}
                        onClose={() => setEditing(false)}
                    />
                )}

                <div className="mb-6">
                    <MetadataGrid columns={4}>
                        <MetadataField label="Status">{EPIC_STATUS[epic.status]?.label ?? epic.status}</MetadataField>
                        <MetadataField label="Owner">{epic.owner?.name ?? '\u2014'}</MetadataField>
                        <MetadataField label="Tasks">{epic.tasks_count}</MetadataField>
                        <MetadataField label="Attachments / Comments">
                            {epic.attachments_count} / {epic.comments_count}
                        </MetadataField>
                    </MetadataGrid>
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

function EpicEditDialog({
    project,
    epic,
    members,
    statuses,
    onClose,
}: {
    project: { id: string };
    epic: Epic;
    members: Member[];
    statuses: SelectOption[];
    onClose: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm({
        title: epic.title,
        description: epic.description ?? '',
        status: epic.status,
        owner_id: epic.owner?.id ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/projects/${project.id}/epics/${epic.id}`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg border border-border-subtle bg-surface-primary p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-strong">Edit Epic</h2>
                    <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-hover">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-default">Title *</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                        {errors.title && <p className="mt-1 text-xs text-status-danger">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-default">Description</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                        {errors.description && <p className="mt-1 text-xs text-status-danger">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-text-default">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            >
                                {statuses.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            {errors.status && <p className="mt-1 text-xs text-status-danger">{errors.status}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-default">Owner</label>
                            <select
                                value={data.owner_id}
                                onChange={(e) => setData('owner_id', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            >
                                <option value="">—</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            {errors.owner_id && <p className="mt-1 text-xs text-status-danger">{errors.owner_id}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
