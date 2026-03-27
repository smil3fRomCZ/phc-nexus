import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import { Link } from '@inertiajs/react';

interface Vote {
    id: string;
    decision: string | null;
    voter: { id: string; name: string };
}

interface Approval {
    id: string;
    description: string | null;
    status: string;
    mode: string;
    requester: { id: string; name: string };
    votes: Vote[];
    created_at: string;
    expires_at: string | null;
    project_id: string | null;
    approvable_title: string | null;
}

interface Props {
    approvals: Approval[];
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Home', href: '/' }, { label: 'Approvals' }];

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function GlobalApprovals({ approvals }: Props) {
    return (
        <AppLayout title="Approvals" breadcrumbs={BREADCRUMBS}>
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-6 text-2xl font-bold leading-tight text-text-strong">Pending Approvals</h1>

                {approvals.length > 0 ? (
                    <div className="space-y-3">
                        {approvals.map((approval) => (
                            <div
                                key={approval.id}
                                className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-primary px-5 py-4 transition-shadow hover:shadow-md"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-text-strong">
                                        {approval.approvable_title ?? approval.description ?? 'Approval request'}
                                    </p>
                                    {approval.description && approval.approvable_title && (
                                        <p className="mt-0.5 text-sm text-text-muted">{approval.description}</p>
                                    )}
                                    <div className="mt-1 flex gap-3 text-xs text-text-muted">
                                        <span>Requested by {approval.requester.name}</span>
                                        <span>&middot;</span>
                                        <span>{timeAgo(approval.created_at)}</span>
                                        <span>&middot;</span>
                                        <span>
                                            {approval.votes.filter((v) => v.decision !== null).length}/
                                            {approval.votes.length} voted
                                        </span>
                                    </div>
                                </div>
                                {approval.project_id && (
                                    <Link
                                        href={`/projects/${approval.project_id}/approvals/${approval.id}`}
                                        className="ml-4 rounded-md bg-brand-primary px-4 py-1.5 text-xs font-medium text-text-inverse no-underline transition-colors hover:bg-brand-hover"
                                    >
                                        Review
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState message="No pending approvals." />
                )}
            </div>
        </AppLayout>
    );
}
