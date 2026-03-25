import AppLayout from '@/Layouts/AppLayout';
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

export default function ApprovalsIndex({ project, approvalRequests }: Props) {
    return (
        <AppLayout title={`${project.key} — Approvals`}>
            <div className="mb-4">
                <Link href={`/projects/${project.id}`} className="text-sm text-text-muted hover:text-brand-primary">
                    &larr; {project.name}
                </Link>
            </div>

            <h2 className="mb-6 text-xl font-semibold text-text-strong">Approval requesty</h2>

            <div className="space-y-2">
                {approvalRequests.map((req) => (
                    <Link
                        key={req.id}
                        href={`/projects/${project.id}/approvals/${req.id}`}
                        className="flex items-center justify-between rounded-lg border border-border-default bg-surface-primary px-4 py-3 hover:bg-surface-hover"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[req.status] ?? ''}`}>
                                {statusLabels[req.status] ?? req.status}
                            </span>
                            <span className="text-sm text-text-strong">
                                {req.description ?? 'Approval request'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-muted">
                            <span>{req.requester.name}</span>
                            <span>
                                {req.votes.filter((v) => v.decision !== null).length}/{req.votes.length} hlasů
                            </span>
                        </div>
                    </Link>
                ))}
                {approvalRequests.length === 0 && (
                    <p className="py-8 text-center text-text-muted">Žádné approval requesty.</p>
                )}
            </div>
        </AppLayout>
    );
}
