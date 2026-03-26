import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import StatusBadge from '@/Components/StatusBadge';
import { MetadataGrid, MetadataField } from '@/Components/MetadataGrid';
import { TASK_STATUS, getStatus } from '@/constants/status';
import { getPriority } from '@/constants/priority';
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

export default function TaskShow({ project, task }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Tasks', href: `/projects/${project.id}/tasks` },
        { label: task.title },
    ];

    return (
        <AppLayout title={`${project.key} — ${task.title}`} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold leading-tight text-text-strong">{task.title}</h1>
                        <StatusBadge statusMap={TASK_STATUS} value={task.status} />
                    </div>
                    {task.description && <p className="mt-2 text-base text-text-default">{task.description}</p>}
                </div>

                <MetadataGrid columns={4}>
                    <MetadataField label="Status">{getStatus(TASK_STATUS, task.status).label}</MetadataField>
                    <MetadataField label="Priority">
                        <span className={getPriority(task.priority).textClass}>{getPriority(task.priority).label}</span>
                    </MetadataField>
                    <MetadataField label="Assignee">{task.assignee?.name ?? '\u2014'}</MetadataField>
                    <MetadataField label="Reporter">{task.reporter?.name ?? '\u2014'}</MetadataField>
                    {task.epic && (
                        <MetadataField label="Epic">
                            <Link
                                href={`/projects/${project.id}/epics/${task.epic.id}`}
                                className="no-underline hover:text-brand-primary"
                            >
                                {task.epic.title}
                            </Link>
                        </MetadataField>
                    )}
                    {task.due_date && <MetadataField label="Due Date">{task.due_date}</MetadataField>}
                    <MetadataField label="Attachments / Comments">
                        {task.attachments_count} / {task.comments_count}
                    </MetadataField>
                </MetadataGrid>
            </div>
        </AppLayout>
    );
}
