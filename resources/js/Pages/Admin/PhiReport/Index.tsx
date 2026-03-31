import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import { formatDateTime } from '@/utils/formatDate';
import { router } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';

interface AuditEntry {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    actor: { id: string; name: string } | null;
    payload: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
}

interface Actor {
    id: string;
    name: string;
}

interface Props {
    entries: AuditEntry[];
    filters: { actor_id?: string; from?: string; to?: string };
    actors: Actor[];
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Administrace' }, { label: 'PHI report' }];

function formatTime(dateStr: string): string {
    return formatDateTime(dateStr);
}

function entityLabel(type: string): string {
    return type.split('\\').pop() ?? type;
}

export default function PhiReportIndex({ entries, filters, actors }: Props) {
    function applyFilter(key: string, value: string) {
        const params = new URLSearchParams(window.location.search);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.get('/admin/phi-report', Object.fromEntries(params), { preserveState: true });
    }

    return (
        <AppLayout title="PHI report" breadcrumbs={BREADCRUMBS}>
            <div className="mb-6 flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-status-warning" />
                <h1 className="text-2xl font-bold leading-tight text-text-strong">PHI report</h1>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-3">
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
                <input
                    type="date"
                    value={filters.from ?? ''}
                    onChange={(e) => applyFilter('from', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                />
                <input
                    type="date"
                    value={filters.to ?? ''}
                    onChange={(e) => applyFilter('to', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {['Čas', 'Uživatel', 'Entita', 'IP adresa'].map((h) => (
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
                        {entries.map((entry) => (
                            <tr key={entry.id} className="transition-colors hover:bg-brand-soft">
                                <td className="border-b border-border-subtle px-5 py-3 text-xs text-text-muted whitespace-nowrap">
                                    {formatTime(entry.created_at)}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm font-medium text-text-strong">
                                    {entry.actor?.name ?? 'Systém'}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                    {entityLabel(entry.entity_type)}
                                    <span className="ml-1 font-mono text-xs text-text-subtle">
                                        {entry.entity_id.slice(0, 8)}
                                    </span>
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-xs font-mono text-text-muted">
                                    {entry.ip_address ?? '\u2014'}
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && <EmptyState colSpan={4} message="Žádné záznamy o přístupu k PHI." />}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
