import EmptyState from '@/Components/EmptyState';
import FilterSelect from '@/Components/FilterSelect';
import SortableHeader, { PlainHeader } from '@/Components/SortableHeader';
import StatusBadge from '@/Components/StatusBadge';
import { APPROVAL_STATUS } from '@/constants/status';
import { useFilterRouter } from '@/hooks/useFilterRouter';
import { formatDate } from '@/utils/formatDate';
import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
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
    project: { id: string; name: string; key: string; status: string };
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

    const applyFilter = useFilterRouter(`/projects/${project.id}/approvals`, filters, { replace: true });

    function applySort(field: string) {
        const dir = filters.sort === field && filters.dir !== 'desc' ? 'desc' : 'asc';
        router.get(
            `/projects/${project.id}/approvals`,
            { ...filters, sort: field, dir },
            { preserveState: true, replace: true },
        );
    }

    return (
        <AppLayout title={`${project.key} — Schvalování`} breadcrumbs={breadcrumbs}>
            <div className="mb-4">
                <ProjectHeaderCompact project={project} />
            </div>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="approvals" />
            </div>

            {/* Filter */}
            <div className="mb-4 flex gap-2">
                <FilterSelect
                    label="Stav"
                    value={filters.status ?? ''}
                    onChange={(v) => applyFilter('status', v)}
                    options={[
                        { value: 'pending', label: 'Čeká na schválení' },
                        { value: 'approved', label: 'Schváleno' },
                        { value: 'rejected', label: 'Zamítnuto' },
                        { value: 'cancelled', label: 'Zrušeno' },
                    ]}
                    placeholder="Všechny"
                />
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
                            ].map((col) =>
                                col.sortable ? (
                                    <SortableHeader
                                        key={col.field}
                                        field={col.field}
                                        label={col.label}
                                        sortField={filters.sort}
                                        sortDir={filters.dir === 'desc' ? 'desc' : 'asc'}
                                        onSort={applySort}
                                        className="cursor-pointer select-none border-b-2 border-border-subtle px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle hover:text-text-default"
                                    />
                                ) : (
                                    <PlainHeader
                                        key={col.field}
                                        label={col.label}
                                        className="border-b-2 border-border-subtle px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                    />
                                ),
                            )}
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
