import AppLayout from '@/Layouts/AppLayout';
import { Link, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

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
    pending: 'Čeká na schválení',
    approved: 'Schváleno',
    rejected: 'Zamítnuto',
    cancelled: 'Zrušeno',
};

const statusColors: Record<string, string> = {
    pending: 'bg-status-warning-subtle text-status-warning',
    approved: 'bg-status-success-subtle text-status-success',
    rejected: 'bg-status-danger-subtle text-status-danger',
    cancelled: 'bg-surface-active text-text-muted',
};

const decisionLabels: Record<string, string> = {
    approved: 'Schváleno',
    rejected: 'Zamítnuto',
};

const decisionColors: Record<string, string> = {
    approved: 'text-status-success',
    rejected: 'text-status-danger',
};

export default function ApprovalShow({ project, approvalRequest: req, auth }: Props) {
    const { data, setData, post, processing } = useForm({
        decision: '',
        comment: '',
    });

    const canVote = req.status === 'pending' &&
        req.votes.some((v) => v.voter.id === auth.user?.id && v.decision === null);

    function submitVote(decision: string) {
        post(`/projects/${project.id}/approvals/${req.id}/vote`, {
            data: { decision, comment: data.comment },
        });
    }

    function cancelRequest() {
        router.post(`/projects/${project.id}/approvals/${req.id}/cancel`);
    }

    const isRequester = req.requester.id === auth.user?.id;

    return (
        <AppLayout title={`${project.key} — Approval`}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-4">
                    <Link href={`/projects/${project.id}/approvals`} className="text-sm text-text-muted hover:text-brand-primary">
                        &larr; Approval requesty
                    </Link>
                </div>

                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[req.status] ?? ''}`}>
                            {statusLabels[req.status] ?? req.status}
                        </span>
                        <h2 className="text-xl font-semibold text-text-strong">
                            {req.description ?? 'Approval request'}
                        </h2>
                    </div>
                </div>

                {/* Metadata */}
                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border-default bg-surface-secondary p-4 text-sm md:grid-cols-3">
                    <div>
                        <span className="text-text-muted">Požadoval/a</span>
                        <p className="font-medium text-text-strong">{req.requester.name}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Entita</span>
                        <p className="font-medium text-text-strong">
                            <Link
                                href={`/projects/${project.id}/tasks/${req.approvable.id}`}
                                className="hover:text-brand-primary"
                            >
                                {req.approvable.title}
                            </Link>
                        </p>
                    </div>
                    <div>
                        <span className="text-text-muted">Režim</span>
                        <p className="font-medium text-text-strong">Všichni musí schválit</p>
                    </div>
                    {req.expires_at && (
                        <div>
                            <span className="text-text-muted">Expirace</span>
                            <p className="font-medium text-text-strong">{req.expires_at}</p>
                        </div>
                    )}
                    {req.decided_at && (
                        <div>
                            <span className="text-text-muted">Rozhodnuto</span>
                            <p className="font-medium text-text-strong">{req.decided_at}</p>
                        </div>
                    )}
                </div>

                {/* Votes */}
                <h3 className="mb-3 text-sm font-medium text-text-muted">Hlasy</h3>
                <div className="mb-6 space-y-2">
                    {req.votes.map((vote) => (
                        <div key={vote.id} className="flex items-center justify-between rounded-md border border-border-default px-4 py-3">
                            <span className="text-sm font-medium text-text-strong">{vote.voter.name}</span>
                            <div className="flex items-center gap-3">
                                {vote.comment && (
                                    <span className="text-xs text-text-muted italic">{vote.comment}</span>
                                )}
                                {vote.decision ? (
                                    <span className={`text-sm font-medium ${decisionColors[vote.decision] ?? ''}`}>
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
                    <div className="rounded-lg border border-border-default bg-surface-secondary p-4">
                        <h3 className="mb-3 text-sm font-medium text-text-strong">Vaše rozhodnutí</h3>
                        <textarea
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            placeholder="Komentář (volitelný)..."
                            className="mb-3 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                            rows={2}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => submitVote('approved')}
                                disabled={processing}
                                className="rounded-md bg-status-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                            >
                                Schválit
                            </button>
                            <button
                                onClick={() => submitVote('rejected')}
                                disabled={processing}
                                className="rounded-md bg-status-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                            >
                                Zamítnout
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
                            Zrušit request
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
