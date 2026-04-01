import { MetadataGrid, MetadataField } from '@/Components/MetadataGrid';
import StatusBadge from '@/Components/StatusBadge';
import { APPROVAL_STATUS } from '@/constants/status';
import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { formatDate } from '@/utils/formatDate';
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

const decisionLabels: Record<string, string> = {
    approved: 'Schváleno',
    rejected: 'Zamítnuto',
};

const decisionColors: Record<string, string> = {
    approved: 'text-status-success',
    rejected: 'text-status-danger',
};

export default function ApprovalShow({ project, approvalRequest: req, auth }: Props) {
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Schvalování', href: `/projects/${project.id}/approvals` },
        { label: req.description ?? 'Approval' },
    ];

    const canVote =
        req.status === 'pending' && req.votes.some((v) => v.voter.id === auth.user?.id && v.decision === null);

    function submitVote(decision: string) {
        setSubmitting(true);
        router.post(
            `/projects/${project.id}/approvals/${req.id}/vote`,
            {
                decision,
                comment,
            },
            {
                onFinish: () => setSubmitting(false),
            },
        );
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
                        <h1 className="text-xl md:text-2xl font-bold leading-tight text-text-strong">
                            {req.description ?? 'Žádost o schválení'}
                        </h1>
                        <StatusBadge statusMap={APPROVAL_STATUS} value={req.status} />
                    </div>
                </div>

                {/* Metadata */}
                <div className="mb-6">
                    <MetadataGrid columns={3}>
                        <MetadataField label="Žadatel">{req.requester.name}</MetadataField>
                        <MetadataField label="Entita">
                            <Link
                                href={`/projects/${project.id}/tasks/${req.approvable.id}`}
                                className="no-underline hover:text-brand-primary"
                            >
                                {req.approvable.title}
                            </Link>
                        </MetadataField>
                        <MetadataField label="Režim">All must approve</MetadataField>
                        {req.expires_at && <MetadataField label="Vyprší">{formatDate(req.expires_at)}</MetadataField>}
                        {req.decided_at && (
                            <MetadataField label="Rozhodnuto">{formatDate(req.decided_at)}</MetadataField>
                        )}
                    </MetadataGrid>
                </div>

                {/* Votes */}
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">Hlasy</h3>
                <div className="mb-6 space-y-2">
                    {req.votes.map((vote) => (
                        <div
                            key={vote.id}
                            className="flex items-center justify-between rounded-md border border-border-subtle px-5 py-3"
                        >
                            <span className="text-sm font-medium text-text-strong">{vote.voter.name}</span>
                            <div className="flex items-center gap-3">
                                {vote.comment && <span className="text-xs italic text-text-muted">{vote.comment}</span>}
                                {vote.decision ? (
                                    <span className={`text-sm font-semibold ${decisionColors[vote.decision] ?? ''}`}>
                                        {decisionLabels[vote.decision] ?? vote.decision}
                                    </span>
                                ) : (
                                    <span className="text-sm text-text-muted">Čeká</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Vote form */}
                {canVote && (
                    <div className="rounded-lg border-2 border-brand-primary bg-surface-secondary p-5">
                        <h3 className="mb-3 text-sm font-semibold text-text-strong">Vaše rozhodnutí</h3>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Komentář (nepovinný)..."
                            className="mb-3 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            rows={2}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => submitVote('approved')}
                                disabled={submitting}
                                className="rounded-md bg-[#006644] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                Schválit
                            </button>
                            <button
                                onClick={() => submitVote('rejected')}
                                disabled={submitting}
                                className="rounded-md bg-[#bf2600] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                Zamítnout
                            </button>
                        </div>
                    </div>
                )}

                {/* Cancel */}
                {isRequester && req.status === 'pending' && (
                    <div className="mt-4">
                        <button onClick={cancelRequest} className="text-sm text-status-danger hover:underline">
                            Zrušit žádost
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
