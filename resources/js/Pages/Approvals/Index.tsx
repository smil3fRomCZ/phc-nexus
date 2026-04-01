import EmptyState from '@/Components/EmptyState';
import StatusBadge from '@/Components/StatusBadge';
import { APPROVAL_STATUS } from '@/constants/status';
import { formatDate } from '@/utils/formatDate';
import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import ProjectTabs from '@/Components/ProjectTabs';

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
    filters: Record<string, string | undefined>;
}

export default function ApprovalsIndex({ project, approvalRequests, filters = {} }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Schvalování' },
    ];

    function applyFilter(key: string, value: string) {
        const params = { ...filters, [key]: value || undefined };
        router.get(`/projects/${project.id}/approvals`, params, { preserveState: true, replace: true });
    }

    function applySort(field: string) {
        const dir = filters.sort === field && filters.dir !== 'desc' ? 'desc' : 'asc';
        router.get(
            `/projects/${project.id}/approvals`,
            { ...filters, sort: field, dir },
            { preserveState: true, replace: true },
        );
    }

    function sortIndicator(field: string) {
        if (filters.sort !== field) return '';
        return filters.dir === 'desc' ? ' \u25BC' : ' \u25B2';
    }

    return (
        <AppLayout title={`${project.key} — Schvalování`} breadcrumbs={breadcrumbs}>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="approvals" />
            </div>

            {/* Filter */}
            <div className="mb-4 flex gap-3">
                <select
                    value={filters.status ?? ''}
                    onChange={(e) => applyFilter('status', e.target.value)}
                    className="h-8 rounded-md border border-border-default bg-surface-primary px-3 text-sm focus:border-brand-primary focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                >
                    <option value="">Všechny stavy</option>
                    <option value="pending">Čeká na schválení</option>
                    <option value="approved">Schváleno</option>
                    <option value="rejected">Zamítnuto</option>
                    <option value="cancelled">Zrušeno</option>
                </select>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {[
                                { field: 'status', label: 'Stav', sortable: true },
                                { field: 'description', label: 'Popis', sortable: false },
                                { field: 'requester', label: 'Žadatel', sortable: false },
                                { field: 'votes', label: 'Hlasy', sortable: false },
                                { field: 'created_at', label: 'Vytvořeno', sortable: true },
                                { field: 'expires_at', label: 'Vyprší', sortable: true },
                            ].map((col) => (
                                <th
                                    key={col.field}
                                    className={`border-b-2 border-border-subtle px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle ${col.sortable ? 'cursor-pointer hover:text-text-default' : ''}`}
                                    onClick={col.sortable ? () => applySort(col.field) : undefined}
                                >
                                    {col.label}
                                    {col.sortable ? sortIndicator(col.field) : ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {approvalRequests.map((req) => (
                            <tr
                                key={req.id}
                                className="cursor-pointer transition-colors hover:bg-brand-soft"
                                onClick={() => (window.location.href = `/projects/${project.id}/approvals/${req.id}`)}
                            >
                                <td className="border-b border-border-subtle px-4 py-2.5">
                                    <StatusBadge statusMap={APPROVAL_STATUS} value={req.status} />
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5 text-sm font-medium text-text-strong">
                                    {req.description ?? 'Žádost o schválení'}
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-muted">
                                    {req.requester.name}
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-muted">
                                    {req.votes.filter((v) => v.decision !== null).length}/{req.votes.length} hlasů
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-muted">
                                    {formatDate(req.created_at)}
                                </td>
                                <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-muted">
                                    {req.expires_at ? formatDate(req.expires_at) : '\u2014'}
                                </td>
                            </tr>
                        ))}
                        {approvalRequests.length === 0 && (
                            <EmptyState message="Žádné žádosti o schválení." colSpan={6} />
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
