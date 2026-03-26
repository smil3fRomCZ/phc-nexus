import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';

interface Vote {
    id: string;
    decision: string | null;
    voter: { id: string; name: string };
    voted_at: string | null;
}

interface ApprovalRequest {
    id: string;
    status: string;
    mode: string;
    description: string | null;
    requester: { id: string; name: string };
    votes: Vote[];
    created_at: string;
    expires_at: string | null;
}

interface Props {
    project: { id: string; name: string; key: string };
    approvalRequests: ApprovalRequest[];
}

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
};

const statusColors: Record<string, string> = {
    pending: 'bg-status-warning-subtle text-status-warning',
    approved: 'bg-status-success-subtle text-status-success',
    rejected: 'bg-status-danger-subtle text-status-danger',
    cancelled: 'bg-status-neutral-subtle text-text-muted',
};

export default function ApprovalsIndex({ project, approvalRequests }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Approvals' },
    ];

    return (
        <AppLayout title={`${project.key} — Approvals`} breadcrumbs={breadcrumbs}>
            <h1 className="mb-6 text-2xl font-bold leading-tight text-text-strong">
                Approvals
            </h1>

            <div className="space-y-2">
                {approvalRequests.map((req) => (
                    <Link
                        key={req.id}
                        href={`/projects/${project.id}/approvals/${req.id}`}
                        className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-primary px-5 py-3 no-underline transition-colors hover:bg-brand-soft"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${statusColors[req.status] ?? ''}`}>
                                {statusLabels[req.status] ?? req.status}
                            </span>
                            <span className="text-base text-text-strong">
                                {req.description ?? 'Approval request'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-muted">
                            <span>{req.requester.name}</span>
                            <span>
                                {req.votes.filter((v) => v.decision !== null).length}/{req.votes.length} votes
                            </span>
                        </div>
                    </Link>
                ))}
                {approvalRequests.length === 0 && (
                    <p className="py-8 text-center text-base text-text-muted">
                        No approval requests.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
