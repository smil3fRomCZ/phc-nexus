import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import type { PaginationLink } from '@/Components/Pagination';
import { formatDateTime } from '@/utils/formatDate';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { X } from 'lucide-react';

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
    user_agent: string | null;
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

function JsonBlock({ label, data }: { label: string; data: Record<string, unknown> | null }) {
    if (!data || Object.keys(data).length === 0) return null;
    return (
        <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">{label}</h4>
            <pre className="overflow-x-auto rounded-md bg-surface-secondary p-3 text-xs text-text-default">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

export default function AuditLogIndex({ entries, filters, actions, entityTypes, actors }: Props) {
    const [selected, setSelected] = useState<AuditEntry | null>(null);

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
                            <tr
                                key={entry.id}
                                className="cursor-pointer transition-colors hover:bg-brand-soft"
                                onClick={() => setSelected(entry)}
                            >
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

            {/* Detail Modal */}
            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="mx-4 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-border-subtle bg-surface-primary p-4 sm:p-6 shadow-xl sm:mx-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-text-strong">Detail záznamu</h2>
                            <button
                                onClick={() => setSelected(null)}
                                className="rounded p-2 text-text-muted hover:bg-surface-hover"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Metadata */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Akce</span>
                                    <div className="mt-0.5">
                                        <span className="inline-flex rounded-[10px] bg-status-info-subtle px-2 py-px text-xs font-semibold text-status-info">
                                            {selected.action}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Čas</span>
                                    <p className="mt-0.5 text-sm text-text-default">{formatTime(selected.created_at)}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Uživatel</span>
                                    <p className="mt-0.5 text-sm text-text-default">{selected.actor?.name ?? 'Systém'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Entita</span>
                                    <p className="mt-0.5 text-sm text-text-default">
                                        {entityLabel(selected.entity_type)}{' '}
                                        <span className="font-mono text-xs text-text-subtle">{selected.entity_id.slice(0, 8)}</span>
                                    </p>
                                </div>
                                {selected.ip_address && (
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">IP adresa</span>
                                        <p className="mt-0.5 font-mono text-sm text-text-default">{selected.ip_address}</p>
                                    </div>
                                )}
                                {selected.user_agent && (
                                    <div className="sm:col-span-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">User Agent</span>
                                        <p className="mt-0.5 text-xs text-text-muted break-all">{selected.user_agent}</p>
                                    </div>
                                )}
                            </div>

                            {/* JSON blocks */}
                            <JsonBlock label="Payload" data={selected.payload} />
                            <JsonBlock label="Staré hodnoty" data={selected.old_values} />
                            <JsonBlock label="Nové hodnoty" data={selected.new_values} />
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
