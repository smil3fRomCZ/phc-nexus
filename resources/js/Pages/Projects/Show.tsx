import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import StatusBadge from '@/Components/StatusBadge';
import { MetadataGrid, MetadataField } from '@/Components/MetadataGrid';
import CommentsSection from '@/Components/CommentsSection';
import type { Comment } from '@/Components/CommentsSection';
import AttachmentsSection from '@/Components/AttachmentsSection';
import type { Attachment } from '@/Components/AttachmentsSection';
import { PROJECT_STATUS } from '@/constants/status';
import { Link, router } from '@inertiajs/react';
import { Trash2, FileDown } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    key: string;
    description: string | null;
    status: string;
    data_classification: string;
    owner: { id: string; name: string; email: string };
    team: { id: string; name: string } | null;
    members: Array<{ id: string; name: string; email: string }>;
    root_comments: Comment[];
    attachments: Attachment[];
    attachments_count: number;
    comments_count: number;
    start_date: string | null;
    target_date: string | null;
    created_at: string;
}

export default function ProjectShow({ project }: { project: Project }) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name },
    ];

    return (
        <AppLayout title={project.name} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold leading-tight text-text-strong">{project.name}</h1>
                            <StatusBadge statusMap={PROJECT_STATUS} value={project.status} />
                        </div>
                        <span className="text-sm font-mono text-text-muted">{project.key}</span>
                        {project.description && (
                            <p className="mt-2 text-base text-text-default">{project.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/projects/${project.id}/edit`}
                            className="rounded-md border border-border-default px-5 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                        >
                            Edit
                        </Link>
                        <button
                            onClick={() => {
                                if (
                                    confirm(
                                        'Are you sure you want to delete this project? This action cannot be undone.',
                                    )
                                ) {
                                    router.delete(`/projects/${project.id}`);
                                }
                            }}
                            className="rounded-md border border-status-danger/30 px-3 py-2 text-sm font-medium text-status-danger transition-colors hover:bg-status-danger-subtle"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Metadata */}
                <div className="mb-6">
                    <MetadataGrid>
                        <MetadataField label="Owner">{project.owner.name}</MetadataField>
                        <MetadataField label="Team">{project.team?.name ?? '\u2014'}</MetadataField>
                        <MetadataField label="Classification">
                            {project.data_classification.toUpperCase()}
                        </MetadataField>
                        <MetadataField label="Created">
                            {new Date(project.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </MetadataField>
                    </MetadataGrid>
                </div>

                {/* Members */}
                <div className="mb-6">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                        Members ({project.members.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {project.members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-2 rounded-full bg-surface-secondary px-3 py-1"
                            >
                                <Avatar name={member.name} />
                                <span className="text-sm text-text-default">{member.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="flex gap-3">
                    <Link
                        href={`/projects/${project.id}/board`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Board
                    </Link>
                    <Link
                        href={`/projects/${project.id}/table`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Table
                    </Link>
                    <Link
                        href={`/projects/${project.id}/epics`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Epics
                    </Link>
                    <Link
                        href={`/projects/${project.id}/approvals`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Approvals
                    </Link>
                    <a
                        href={`/projects/${project.id}/export/tasks`}
                        className="flex items-center gap-1.5 rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        <FileDown className="h-3.5 w-3.5" />
                        Export Tasks
                    </a>
                    <a
                        href={`/projects/${project.id}/export/summary`}
                        className="flex items-center gap-1.5 rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        <FileDown className="h-3.5 w-3.5" />
                        Export Summary
                    </a>
                </div>

                {/* Dates */}
                {(project.start_date || project.target_date) && (
                    <div className="mt-6 flex gap-4 text-sm text-text-muted">
                        {project.start_date && <span>Start: {project.start_date}</span>}
                        {project.target_date && <span>Target: {project.target_date}</span>}
                    </div>
                )}

                {/* Attachments */}
                <div className="mt-6">
                    <AttachmentsSection
                        attachments={project.attachments}
                        uploadUrl={`/projects/${project.id}/attachments`}
                    />
                </div>

                {/* Comments */}
                <div className="mt-6">
                    <CommentsSection
                        comments={project.root_comments}
                        commentsCount={project.comments_count}
                        postUrl={`/projects/${project.id}/comments`}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
