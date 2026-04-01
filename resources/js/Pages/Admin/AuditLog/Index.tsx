import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import type { PaginationLink } from '@/Components/Pagination';
import { formatDateTime } from '@/utils/formatDate';
import { router } from '@inertiajs/react';

interface AuditEntry {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    actor: { id: string; name: string } | null;
    payload: Record<string, unknown> | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
}

interface SelectOption {
    value: string;
    label: string;
}

interface Actor {
    id: string;
    name: string;
}

interface Props {
    entries: { data: AuditEntry[]; links: PaginationLink[] };
    filters: { action?: string; entity_type?: string; actor_id?: string };
    actions: SelectOption[];
    entityTypes: SelectOption[];
    actors: Actor[];
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Administrace' }, { label: 'Audit log' }];

function formatTime(dateStr: string): string {
    return formatDateTime(dateStr);
}

function entityLabel(type: string): string {
    return type.split('\\').pop() ?? type;
}

export default function AuditLogIndex({ entries, filters, actions, entityTypes, actors }: Props) {
    function applyFilter(key: string, value: string) {
        const params = new URLSearchParams(window.location.search);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.get('/admin/audit-log', Object.fromEntries(params), { preserveState: true });
    }

    return (
        <AppLayout title="Audit log" breadcrumbs={BREADCRUMBS}>
            <h1 className="mb-6 text-xl md:text-2xl font-bold leading-tight text-text-strong">Audit log</h1>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
                <select
                    value={filters.action ?? ''}
                    onChange={(e) => applyFilter('action', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="">Všechny akce</option>
                    {actions.map((a) => (
                        <option key={a.value} value={a.value}>
                            {a.label}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.entity_type ?? ''}
                    onChange={(e) => applyFilter('entity_type', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="">Všechny entity</option>
                    {entityTypes.map((e) => (
                        <option key={e.value} value={e.value}>
                            {e.label}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.actor_id ?? ''}
                    onChange={(e) => applyFilter('actor_id', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="">Všichni uživatelé</option>
                    {actors.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {['Čas', 'Uživatel', 'Akce', 'Entita', 'Detail'].map((h) => (
                                <th
                                    key={h}
                                    className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {entries.data.map((entry) => (
                            <tr key={entry.id} className="transition-colors hover:bg-brand-soft">
                                <td className="border-b border-border-subtle px-5 py-3 text-xs text-text-muted whitespace-nowrap">
                                    {formatTime(entry.created_at)}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-default">
                                    {entry.actor?.name ?? 'Systém'}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3">
                                    <span className="inline-flex rounded-[10px] bg-status-info-subtle px-2 py-px text-xs font-semibold text-status-info">
                                        {entry.action}
                                    </span>
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                    {entityLabel(entry.entity_type)}
                                    <span className="ml-1 font-mono text-xs text-text-subtle">
                                        {entry.entity_id.slice(0, 8)}
                                    </span>
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-xs text-text-muted">
                                    {entry.new_values && (
                                        <span className="truncate">
                                            {JSON.stringify(entry.new_values).slice(0, 80)}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {entries.data.length === 0 && <EmptyState colSpan={5} message="Žádné záznamy v auditu." />}
                    </tbody>
                </table>
            </div>

            <Pagination links={entries.links} />
        </AppLayout>
    );
}
