import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';

interface Comment {
    id: string;
    body: string;
    author: { id: string; name: string };
    created_at: string;
    edited_at: string | null;
    replies: Comment[];
}

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
    attachments_count: number;
    comments_count: number;
    start_date: string | null;
    target_date: string | null;
    created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-status-neutral-subtle text-status-neutral' },
    active: { label: 'Active', className: 'bg-status-success-subtle text-status-success' },
    planning: { label: 'Planning', className: 'bg-status-info-subtle text-status-info' },
    on_hold: { label: 'On Hold', className: 'bg-status-warning-subtle text-status-warning' },
    in_review: { label: 'In Review', className: 'bg-status-review-subtle text-status-review' },
    completed: { label: 'Completed', className: 'bg-status-success-subtle text-status-success' },
    cancelled: { label: 'Cancelled', className: 'bg-status-danger-subtle text-status-danger' },
    archived: { label: 'Archived', className: 'bg-status-neutral-subtle text-status-neutral' },
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function ProjectShow({ project }: { project: Project }) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name },
    ];

    const status = STATUS_CONFIG[project.status] ?? {
        label: project.status,
        className: 'bg-status-neutral-subtle text-status-neutral',
    };

    return (
        <AppLayout title={project.name} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold leading-tight text-text-strong">{project.name}</h1>
                            <span
                                className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${status.className}`}
                            >
                                {status.label}
                            </span>
                        </div>
                        <span className="text-sm font-mono text-text-muted">{project.key}</span>
                        {project.description && (
                            <p className="mt-2 text-base text-text-default">{project.description}</p>
                        )}
                    </div>
                    <Link
                        href={`/projects/${project.id}/edit`}
                        className="rounded-md border border-border-default px-5 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Edit
                    </Link>
                </div>

                {/* Metadata */}
                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border-subtle bg-surface-secondary p-5 text-sm md:grid-cols-4">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Owner</span>
                        <p className="mt-1 font-medium text-text-strong">{project.owner.name}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Team</span>
                        <p className="mt-1 font-medium text-text-strong">{project.team?.name ?? '\u2014'}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                            Classification
                        </span>
                        <p className="mt-1 font-medium text-text-strong">{project.data_classification.toUpperCase()}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Created</span>
                        <p className="mt-1 font-medium text-text-strong">
                            {new Date(project.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
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
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[9px] font-semibold text-text-inverse">
                                    {getInitials(member.name)}
                                </div>
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
                </div>

                {/* Stats */}
                <div className="mt-6 flex gap-4 text-sm text-text-muted">
                    <span>{project.comments_count} comments</span>
                    <span>{project.attachments_count} attachments</span>
                    {project.start_date && <span>Start: {project.start_date}</span>}
                    {project.target_date && <span>Target: {project.target_date}</span>}
                </div>
            </div>
        </AppLayout>
    );
}
