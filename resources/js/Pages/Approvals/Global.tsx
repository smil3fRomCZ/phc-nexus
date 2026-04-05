import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import { timeAgo } from '@/utils/formatDate';
import { Link } from '@inertiajs/react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

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

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Schvalování' }];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Čeká', color: 'text-status-warning', bg: 'bg-status-warning-subtle' },
    approved: { label: 'Schváleno', color: 'text-status-info', bg: 'bg-status-info-subtle' },
    rejected: { label: 'Zamítnuto', color: 'text-status-danger', bg: 'bg-status-danger-subtle' },
    cancelled: { label: 'Zrušeno', color: 'text-status-neutral', bg: 'bg-status-neutral-subtle' },
};

export default function GlobalApprovals({ approvals }: Props) {
    const [filter, setFilter] = useState<string>('pending');

    const counts = {
        all: approvals.length,
        pending: approvals.filter((a) => a.status === 'pending').length,
        approved: approvals.filter((a) => a.status === 'approved').length,
        rejected: approvals.filter((a) => a.status === 'rejected').length,
    };

    const filtered = filter === 'all' ? approvals : approvals.filter((a) => a.status === filter);

    return (
        <AppLayout title="Schvalování" breadcrumbs={BREADCRUMBS}>
            <div className="max-w-screen-xl">
                <h1 className="mb-6 text-xl md:text-2xl font-bold leading-tight text-text-strong">Schvalování</h1>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        {
                            key: 'pending',
                            label: 'Čeká',
                            value: counts.pending,
                            icon: Clock,
                            color: 'text-status-warning',
                            bg: 'bg-status-warning-subtle',
                        },
                        {
                            key: 'approved',
                            label: 'Schváleno',
                            value: counts.approved,
                            icon: CheckCircle,
                            color: 'text-status-info',
                            bg: 'bg-status-info-subtle',
                        },
                        {
                            key: 'rejected',
                            label: 'Zamítnuto',
                            value: counts.rejected,
                            icon: XCircle,
                            color: 'text-status-danger',
                            bg: 'bg-status-danger-subtle',
                        },
                        {
                            key: 'all',
                            label: 'Celkem',
                            value: counts.all,
                            color: 'text-text-strong',
                            bg: 'bg-surface-secondary',
                        },
                    ].map((tile) => {
                        const Icon = 'icon' in tile ? tile.icon : null;
                        const isActive = filter === tile.key;
                        return (
                            <button
                                key={tile.key}
                                onClick={() => setFilter(tile.key)}
                                className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors ${
                                    isActive
                                        ? 'border-brand-primary bg-brand-soft'
                                        : 'border-border-subtle bg-surface-primary hover:border-border-default'
                                }`}
                            >
                                {Icon && (
                                    <div className={`flex h-6 w-6 items-center justify-center rounded-md ${tile.bg}`}>
                                        <Icon className={`h-3.5 w-3.5 ${tile.color}`} />
                                    </div>
                                )}
                                <span className="text-lg font-bold text-text-strong">{tile.value}</span>
                                <span className="text-xs text-text-muted">{tile.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* List */}
                {filtered.length > 0 ? (
                    <div className="space-y-3">
                        {filtered.map((approval) => {
                            const sc = STATUS_CONFIG[approval.status] ?? STATUS_CONFIG.pending;
                            return (
                                <div
                                    key={approval.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-primary px-5 py-4 transition-shadow hover:shadow-md"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-text-strong truncate">
                                                {approval.approvable_title ??
                                                    approval.description ??
                                                    'Žádost o schválení'}
                                            </p>
                                            <span
                                                className={`inline-flex shrink-0 rounded-[10px] px-2 py-px text-xs font-semibold ${sc.bg} ${sc.color}`}
                                            >
                                                {sc.label}
                                            </span>
                                        </div>
                                        {approval.description && approval.approvable_title && (
                                            <p className="mt-0.5 text-sm text-text-muted truncate">
                                                {approval.description}
                                            </p>
                                        )}
                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted">
                                            <span>Vyžádal/a {approval.requester.name}</span>
                                            <span>&middot;</span>
                                            <span>{timeAgo(approval.created_at)}</span>
                                            <span>&middot;</span>
                                            <span>
                                                {approval.votes.filter((v) => v.decision !== null).length}/
                                                {approval.votes.length} hlasů
                                            </span>
                                        </div>
                                    </div>
                                    {approval.project_id && (
                                        <Link
                                            href={`/projects/${approval.project_id}/approvals/${approval.id}`}
                                            className="shrink-0 rounded-md bg-brand-primary px-4 py-1.5 text-xs font-medium text-text-inverse no-underline transition-colors hover:bg-brand-hover"
                                        >
                                            Posoudit
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        message={filter === 'pending' ? 'Žádná čekající schválení.' : 'Žádné žádosti v tomto filtru.'}
                    />
                )}
            </div>
        </AppLayout>
    );
}
