import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import { formatDate } from '@/utils/formatDate';
import { BarChart3, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Stats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    avg_resolution_hours: number;
}

interface HistoryItem {
    id: string;
    description: string | null;
    status: string;
    requester_name: string;
    approvable_title: string;
    project_id: string | null;
    created_at: string;
    decided_at: string | null;
    resolution_hours: number | null;
}

interface Props {
    stats: Stats;
    history: HistoryItem[];
}

const BREADCRUMBS: Breadcrumb[] = [
    { label: 'Domů', href: '/' },
    { label: 'Administrace' },
    { label: 'Analytika schvalování' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    pending: { color: 'text-status-warning', bg: 'bg-status-warning-subtle' },
    approved: { color: 'text-status-info', bg: 'bg-status-info-subtle' },
    rejected: { color: 'text-status-danger', bg: 'bg-status-danger-subtle' },
    cancelled: { color: 'text-status-neutral', bg: 'bg-status-neutral-subtle' },
};

function formatHours(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
}

type SortField = 'approvable_title' | 'requester_name' | 'status' | 'created_at' | 'decided_at' | 'resolution_hours';

export default function ApprovalAnalyticsIndex({ stats, history }: Props) {
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    function applySort(field: SortField) {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    }

    function sortIndicator(field: SortField) {
        if (sortField !== field) return '';
        return sortDir === 'desc' ? ' ▼' : ' ▲';
    }

    const sorted = useMemo(() => {
        return [...history].sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            const av = a[sortField];
            const bv = b[sortField];
            if (av === null && bv === null) return 0;
            if (av === null) return 1;
            if (bv === null) return -1;
            if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
            return String(av).localeCompare(String(bv), 'cs') * dir;
        });
    }, [history, sortField, sortDir]);

    const tiles = [
        { label: 'Celkem', value: stats.total, icon: BarChart3, color: 'text-text-strong', bg: 'bg-surface-secondary' },
        {
            label: 'Čeká',
            value: stats.pending,
            icon: Clock,
            color: 'text-status-warning',
            bg: 'bg-status-warning-subtle',
        },
        {
            label: 'Schváleno',
            value: stats.approved,
            icon: CheckCircle,
            color: 'text-status-info',
            bg: 'bg-status-info-subtle',
        },
        {
            label: 'Zamítnuto',
            value: stats.rejected,
            icon: XCircle,
            color: 'text-status-danger',
            bg: 'bg-status-danger-subtle',
        },
        {
            label: 'Zrušeno',
            value: stats.cancelled,
            icon: Ban,
            color: 'text-status-neutral',
            bg: 'bg-status-neutral-subtle',
        },
        {
            label: 'Prům. doba',
            value: formatHours(stats.avg_resolution_hours),
            icon: Clock,
            color: 'text-brand-primary',
            bg: 'bg-brand-soft',
        },
    ];

    const columns: { field: SortField; label: string }[] = [
        { field: 'approvable_title', label: 'Žádost' },
        { field: 'requester_name', label: 'Žadatel' },
        { field: 'status', label: 'Stav' },
        { field: 'created_at', label: 'Vytvořeno' },
        { field: 'decided_at', label: 'Vyřešeno' },
        { field: 'resolution_hours', label: 'Doba řešení' },
    ];

    return (
        <AppLayout title="Analytika schvalování" breadcrumbs={BREADCRUMBS}>
            <h1 className="mb-6 text-2xl font-bold leading-tight text-text-strong">Analytika schvalování</h1>

            {/* Stat Tiles */}
            <div className="mb-8 grid grid-cols-3 gap-4 md:grid-cols-6">
                {tiles.map((tile) => {
                    const Icon = tile.icon;
                    return (
                        <div
                            key={tile.label}
                            className="flex flex-col items-center gap-1 rounded-lg border border-border-subtle bg-surface-primary p-4"
                        >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-md ${tile.bg}`}>
                                <Icon className={`h-4 w-4 ${tile.color}`} />
                            </div>
                            <span className="text-2xl font-bold text-text-strong">{tile.value}</span>
                            <span className="text-xs text-text-muted">{tile.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* History Table */}
            <h2 className="mb-4 text-lg font-semibold text-text-strong">Historie</h2>
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.field}
                                    className="cursor-pointer border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle hover:text-text-default"
                                    onClick={() => applySort(col.field)}
                                >
                                    {col.label}
                                    {sortIndicator(col.field)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((item) => {
                            const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
                            return (
                                <tr
                                    key={item.id}
                                    className={`transition-colors hover:bg-brand-soft ${item.project_id ? 'cursor-pointer' : ''}`}
                                    onClick={
                                        item.project_id
                                            ? () => {
                                                  window.location.href = `/projects/${item.project_id}/approvals/${item.id}`;
                                              }
                                            : undefined
                                    }
                                >
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm font-medium text-text-strong">
                                        {item.approvable_title || item.description || 'Žádost o schválení'}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                        {item.requester_name}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        <span
                                            className={`inline-flex rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${sc.bg} ${sc.color}`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-xs text-text-muted">
                                        {formatDate(item.created_at)}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-xs text-text-muted">
                                        {item.decided_at ? formatDate(item.decided_at) : '\u2014'}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm font-medium text-text-default">
                                        {item.resolution_hours !== null ? formatHours(item.resolution_hours) : '\u2014'}
                                    </td>
                                </tr>
                            );
                        })}
                        {history.length === 0 && <EmptyState colSpan={6} message="Žádné žádosti o schválení." />}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
