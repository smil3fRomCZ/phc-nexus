import EmptyState from '@/Components/EmptyState';
import StatusBadge from '@/Components/StatusBadge';
import { APPROVAL_STATUS } from '@/constants/status';
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

export default function ApprovalsIndex({ project, approvalRequests }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Schvalování' },
    ];

    return (
        <AppLayout title={`${project.key} — Schvalování`} breadcrumbs={breadcrumbs}>
            <h1 className="mb-6 text-2xl font-bold leading-tight text-text-strong">Schvalování</h1>

            <div className="space-y-2">
                {approvalRequests.map((req) => (
                    <Link
                        key={req.id}
                        href={`/projects/${project.id}/approvals/${req.id}`}
                        className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-primary px-5 py-3 no-underline transition-colors hover:bg-brand-soft"
                    >
                        <div className="flex items-center gap-3">
                            <StatusBadge statusMap={APPROVAL_STATUS} value={req.status} />
                            <span className="text-base text-text-strong">
                                {req.description ?? 'Žádost o schválení'}
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
                {approvalRequests.length === 0 && <EmptyState message="Žádné žádosti o schválení." />}
            </div>
        </AppLayout>
    );
}
