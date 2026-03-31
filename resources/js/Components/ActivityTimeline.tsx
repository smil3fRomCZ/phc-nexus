import { formatDateTime } from '@/utils/formatDate';
import { Clock, Plus, Edit3, Trash2, Eye, ArrowRight } from 'lucide-react';

export interface ActivityEntry {
    id: string;
    action: string;
    actor: { id: string; name: string } | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    created_at: string;
}

interface Props {
    entries: ActivityEntry[];
}

const ACTION_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string }> = {
    created: { icon: Plus, label: 'Vytvořeno', color: 'text-status-info' },
    updated: { icon: Edit3, label: 'Aktualizováno', color: 'text-status-warning' },
    deleted: { icon: Trash2, label: 'Smazáno', color: 'text-status-danger' },
    viewed: { icon: Eye, label: 'Zobrazeno', color: 'text-text-muted' },
    status_changed: { icon: ArrowRight, label: 'Změna stavu', color: 'text-brand-primary' },
};

const FIELD_LABELS: Record<string, string> = {
    title: 'Název',
    description: 'Popis',
    status: 'Stav',
    priority: 'Priorita',
    assignee_id: 'Řešitel',
    reporter_id: 'Zadavatel',
    due_date: 'Termín',
    data_classification: 'Klasifikace',
};

function formatTime(dateStr: string): string {
    return formatDateTime(dateStr);
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '\u2014';
    return String(value);
}

function describeChanges(
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
): Array<{ field: string; from: string; to: string }> {
    if (!newValues) return [];
    const changes: Array<{ field: string; from: string; to: string }> = [];
    for (const key of Object.keys(newValues)) {
        const label = FIELD_LABELS[key] ?? key;
        const oldVal = oldValues?.[key];
        const newVal = newValues[key];
        if (oldVal !== newVal) {
            changes.push({ field: label, from: formatValue(oldVal), to: formatValue(newVal) });
        }
    }
    return changes;
}

export default function ActivityTimeline({ entries }: Props) {
    if (entries.length === 0) {
        return <p className="text-sm text-text-muted">Žádná aktivita.</p>;
    }

    return (
        <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute bottom-0 left-3 top-0 w-px bg-border-subtle" />

            {entries.map((entry) => {
                const config = ACTION_CONFIG[entry.action] ?? {
                    icon: Clock,
                    label: entry.action.replace(/_/g, ' '),
                    color: 'text-text-muted',
                };
                const Icon = config.icon;
                const changes = entry.action === 'updated' ? describeChanges(entry.old_values, entry.new_values) : [];

                return (
                    <div key={entry.id} className="relative flex gap-3 py-2.5 pl-0">
                        <div
                            className={`relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-surface-primary ring-2 ring-border-subtle ${config.color}`}
                        >
                            <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 pt-0.5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-medium text-text-strong">
                                    {entry.actor?.name ?? 'System'}
                                </span>
                                <span className="text-xs text-text-muted">{config.label}</span>
                                <span className="ml-auto text-xs text-text-subtle">{formatTime(entry.created_at)}</span>
                            </div>

                            {entry.action === 'created' && entry.new_values?.['title'] != null && (
                                <p className="mt-0.5 text-xs text-text-muted">
                                    Vytvořen úkol &ldquo;{String(entry.new_values['title'])}&rdquo;
                                </p>
                            )}

                            {changes.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                    {changes.map((c) => (
                                        <p key={c.field} className="text-xs text-text-muted">
                                            <span className="font-medium text-text-default">{c.field}</span>: {c.from}{' '}
                                            <ArrowRight className="mx-0.5 inline h-2.5 w-2.5 text-text-subtle" /> {c.to}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
