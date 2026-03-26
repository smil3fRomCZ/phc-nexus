import { MetadataGrid, MetadataField } from '@/Components/MetadataGrid';
import StatusBadge from '@/Components/StatusBadge';
import { EPIC_STATUS } from '@/constants/status';
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

export default function EpicShow({ project, epic }: Props) {
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
                    </div>
                    {epic.description && <p className="mt-2 text-base text-text-default">{epic.description}</p>}
                </div>

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
