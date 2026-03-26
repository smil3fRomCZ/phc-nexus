import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Vote {
    id: string;
    decision: string | null;
    comment: string | null;
    voter: { id: string; name: string };
    voted_at: string | null;
}

interface Approvable {
    id: string;
    title: string;
}

interface ApprovalRequest {
    id: string;
    status: string;
    mode: string;
    description: string | null;
    requester: { id: string; name: string };
    approvable: Approvable;
    votes: Vote[];
    created_at: string;
    decided_at: string | null;
    expires_at: string | null;
}

interface Props {
    project: { id: string; name: string; key: string };
    approvalRequest: ApprovalRequest;
    auth: { user: { id: string } | null };
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

const decisionLabels: Record<string, string> = {
    approved: 'Approved',
    rejected: 'Rejected',
};

const decisionColors: Record<string, string> = {
    approved: 'text-status-success',
    rejected: 'text-status-danger',
};

export default function ApprovalShow({ project, approvalRequest: req, auth }: Props) {
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Approvals', href: `/projects/${project.id}/approvals` },
        { label: req.description ?? 'Approval' },
    ];

    const canVote = req.status === 'pending' &&
        req.votes.some((v) => v.voter.id === auth.user?.id && v.decision === null);

    function submitVote(decision: string) {
        setSubmitting(true);
        router.post(`/projects/${project.id}/approvals/${req.id}/vote`, {
            decision,
            comment,
        }, {
            onFinish: () => setSubmitting(false),
        });
    }

    function cancelRequest() {
        router.post(`/projects/${project.id}/approvals/${req.id}/cancel`);
    }

    const isRequester = req.requester.id === auth.user?.id;

    return (
        <AppLayout title={`${project.key} — Approval`} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold leading-tight text-text-strong">
                            {req.description ?? 'Approval Request'}
                        </h1>
                        <span className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${statusColors[req.status] ?? ''}`}>
                            {statusLabels[req.status] ?? req.status}
                        </span>
                    </div>
                </div>

                {/* Metadata */}
                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border-subtle bg-surface-secondary p-5 text-sm md:grid-cols-3">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Requester</span>
                        <p className="mt-1 font-medium text-text-strong">{req.requester.name}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Entity</span>
                        <p className="mt-1 font-medium text-text-strong">
                            <Link
                                href={`/projects/${project.id}/tasks/${req.approvable.id}`}
                                className="no-underline hover:text-brand-primary"
                            >
                                {req.approvable.title}
                            </Link>
                        </p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Mode</span>
                        <p className="mt-1 font-medium text-text-strong">All must approve</p>
                    </div>
                    {req.expires_at && (
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Expires</span>
                            <p className="mt-1 font-medium text-text-strong">{req.expires_at}</p>
                        </div>
                    )}
                    {req.decided_at && (
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Decided</span>
                            <p className="mt-1 font-medium text-text-strong">{req.decided_at}</p>
                        </div>
                    )}
                </div>

                {/* Votes */}
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                    Votes
                </h3>
                <div className="mb-6 space-y-2">
                    {req.votes.map((vote) => (
                        <div key={vote.id} className="flex items-center justify-between rounded-md border border-border-subtle px-5 py-3">
                            <span className="text-sm font-medium text-text-strong">{vote.voter.name}</span>
                            <div className="flex items-center gap-3">
                                {vote.comment && (
                                    <span className="text-xs italic text-text-muted">{vote.comment}</span>
                                )}
                                {vote.decision ? (
                                    <span className={`text-sm font-semibold ${decisionColors[vote.decision] ?? ''}`}>
                                        {decisionLabels[vote.decision] ?? vote.decision}
                                    </span>
                                ) : (
                                    <span className="text-sm text-text-muted">Pending</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Vote form */}
                {canVote && (
                    <div className="rounded-lg border-2 border-brand-primary bg-surface-secondary p-5">
                        <h3 className="mb-3 text-sm font-semibold text-text-strong">Your Decision</h3>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Comment (optional)..."
                            className="mb-3 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            rows={2}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => submitVote('approved')}
                                disabled={submitting}
                                className="rounded-md bg-[#006644] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => submitVote('rejected')}
                                disabled={submitting}
                                className="rounded-md bg-[#bf2600] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                )}

                {/* Cancel */}
                {isRequester && req.status === 'pending' && (
                    <div className="mt-4">
                        <button
                            onClick={cancelRequest}
                            className="text-sm text-status-danger hover:underline"
                        >
                            Cancel Request
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
