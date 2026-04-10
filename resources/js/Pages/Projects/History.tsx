import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';
import { formatDateTime } from '@/utils/formatDate';
import { CheckCircle, Clock, MessageSquare, Settings2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

type Health = 'on_track' | 'at_risk' | 'blocked';

interface Actor {
    id: string;
    name: string;
}

type EventBase = {
    id: string;
    created_at: string | null;
    actor: Actor | null;
};

type UpdateEvent = EventBase & {
    type: 'update';
    data: { health: Health; body: string | null };
};

type AuditEvent = EventBase & {
    type: 'audit';
    data: {
        action: string;
        old_values: Record<string, unknown> | null;
        new_values: Record<string, unknown> | null;
    };
};

type CommentEvent = EventBase & {
    type: 'comment';
    data: { body: string };
};

type TimeEvent = EventBase & {
    type: 'time';
    data: { date: string; hours: number; entries_count: number };
};

type HistoryEvent = UpdateEvent | AuditEvent | CommentEvent | TimeEvent;

interface Props {
    project: { id: string; name: string; key: string; status: string };
    events: HistoryEvent[];
    lastUpdate: { health: Health; created_at: string | null } | null;
}

type FilterKey = 'all' | 'update' | 'comment' | 'audit' | 'time';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Vše' },
    { key: 'update', label: 'Updates' },
    { key: 'comment', label: 'Komentáře' },
    { key: 'audit', label: 'Změny' },
    { key: 'time', label: 'Čas' },
];

const HEALTH_STYLES: Record<Health, { label: string; dot: string; body: string; text: string }> = {
    on_track: {
        label: 'ON TRACK',
        dot: 'bg-status-success',
        body: 'bg-status-success-subtle border-status-success/20',
        text: 'text-status-success',
    },
    at_risk: {
        label: 'AT RISK',
        dot: 'bg-status-warning',
        body: 'bg-status-warning-subtle border-status-warning/20',
        text: 'text-status-warning',
    },
    blocked: {
        label: 'BLOCKED',
        dot: 'bg-status-danger',
        body: 'bg-status-danger-subtle border-status-danger/20',
        text: 'text-status-danger',
    },
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
    created: 'vytvořil projekt',
    updated: 'upravil projekt',
    deleted: 'smazal projekt',
    restored: 'obnovil projekt',
};

export default function ProjectHistory({ project, events, lastUpdate }: Props) {
    const [filter, setFilter] = useState<FilterKey>('all');

    const counts = useMemo(() => {
        const c: Record<FilterKey, number> = { all: events.length, update: 0, comment: 0, audit: 0, time: 0 };
        events.forEach((e) => {
            c[e.type] += 1;
        });
        return c;
    }, [events]);

    const filtered = useMemo(
        () => (filter === 'all' ? events : events.filter((e) => e.type === filter)),
        [events, filter],
    );

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Historie' },
    ];

    return (
        <AppLayout title={`${project.key} — Historie`} breadcrumbs={breadcrumbs}>
            <div className="mb-4">
                <ProjectHeaderCompact project={project} />
            </div>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="history" lastUpdate={lastUpdate} />
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                <div className="mb-4 flex flex-wrap gap-2">
                    {FILTERS.map((f) => {
                        const isActive = filter === f.key;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setFilter(f.key)}
                                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    isActive
                                        ? 'border-brand-primary bg-brand-soft text-brand-hover'
                                        : 'border-border-default bg-surface-primary text-text-muted hover:bg-surface-hover'
                                }`}
                            >
                                {f.label}
                                <span
                                    className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                                        isActive ? 'bg-white text-brand-hover' : 'bg-surface-secondary text-text-muted'
                                    }`}
                                >
                                    {counts[f.key]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-text-muted">Žádné události k zobrazení.</div>
                ) : (
                    <div className="relative pl-6">
                        <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-border-subtle" />
                        {filtered.map((event) => (
                            <TimelineItem key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function TimelineItem({ event }: { event: HistoryEvent }) {
    return (
        <div className="relative pb-5 last:pb-0">
            <TimelineDot type={event.type} />
            <div className="mb-1 flex flex-wrap items-baseline gap-2 text-xs text-text-muted">
                <span className="text-sm font-semibold text-text-strong">{event.actor?.name ?? 'Systém'}</span>
                <span>{actionLabel(event)}</span>
                {event.created_at && <span className="text-text-subtle">— {formatDateTime(event.created_at)}</span>}
            </div>
            <EventBody event={event} />
        </div>
    );
}

function TimelineDot({ type }: { type: HistoryEvent['type'] }) {
    const map: Record<HistoryEvent['type'], { ring: string; bg: string; icon: ReactNode }> = {
        update: {
            ring: 'border-status-success',
            bg: 'bg-status-success-subtle',
            icon: <CheckCircle className="h-2.5 w-2.5 text-status-success" />,
        },
        comment: {
            ring: 'border-status-info',
            bg: 'bg-status-info-subtle',
            icon: <MessageSquare className="h-2.5 w-2.5 text-status-info" />,
        },
        audit: {
            ring: 'border-brand-primary',
            bg: 'bg-brand-soft',
            icon: <Settings2 className="h-2.5 w-2.5 text-brand-primary" />,
        },
        time: {
            ring: 'border-text-subtle',
            bg: 'bg-surface-secondary',
            icon: <Clock className="h-2.5 w-2.5 text-text-muted" />,
        },
    };
    const style = map[type];
    return (
        <div
            className={`absolute -left-[22px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${style.ring} ${style.bg}`}
        >
            {style.icon}
        </div>
    );
}

function actionLabel(event: HistoryEvent): string {
    switch (event.type) {
        case 'update':
            return 'přidal status update';
        case 'comment':
            return 'přidal komentář';
        case 'audit':
            return AUDIT_ACTION_LABELS[event.data.action] ?? `akce: ${event.data.action}`;
        case 'time':
            return 'zalogoval čas';
    }
}

function EventBody({ event }: { event: HistoryEvent }) {
    if (event.type === 'update') {
        const style = HEALTH_STYLES[event.data.health];
        return (
            <div className={`rounded-md border px-3 py-2 text-sm text-text-default ${style.body}`}>
                <div className={`text-[11px] font-bold ${style.text}`}>● {style.label}</div>
                <p className="mt-1 whitespace-pre-wrap">{event.data.body}</p>
            </div>
        );
    }

    if (event.type === 'comment') {
        return (
            <div className="whitespace-pre-wrap rounded-md border border-border-subtle bg-surface-secondary px-3 py-2 text-sm text-text-default">
                {event.data.body}
            </div>
        );
    }

    if (event.type === 'audit') {
        const changes = buildFieldChanges(event.data.old_values, event.data.new_values);
        if (changes.length === 0) {
            return (
                <div className="rounded-md border border-border-subtle bg-surface-secondary px-3 py-2 text-sm text-text-muted">
                    {event.data.action === 'created'
                        ? 'Projekt byl založen.'
                        : event.data.action === 'deleted'
                          ? 'Projekt byl smazán.'
                          : 'Beze změn v datech.'}
                </div>
            );
        }
        return (
            <div className="rounded-md border border-border-subtle bg-surface-secondary px-3 py-2 font-mono text-xs">
                {changes.map((c) => (
                    <div key={c.key} className="flex flex-wrap items-center gap-1.5">
                        <span className="text-text-muted">{c.key}:</span>
                        {c.old !== null && (
                            <span className="text-status-danger line-through">{formatValue(c.old)}</span>
                        )}
                        {c.old !== null && <span className="text-text-subtle">→</span>}
                        <span className="font-semibold text-status-success">{formatValue(c.new)}</span>
                    </div>
                ))}
            </div>
        );
    }

    // time
    return (
        <div className="rounded-md border border-border-subtle bg-surface-secondary px-3 py-2 text-sm text-text-default">
            <strong className="text-text-strong">{event.data.hours} h</strong>
            <span className="text-text-muted"> · {event.data.date}</span>
            {event.data.entries_count > 1 && (
                <span className="text-text-subtle"> · {event.data.entries_count} záznamů</span>
            )}
        </div>
    );
}

function buildFieldChanges(
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
): { key: string; old: unknown; new: unknown }[] {
    const keys = new Set<string>([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})]);
    const result: { key: string; old: unknown; new: unknown }[] = [];
    keys.forEach((key) => {
        const oldVal = oldValues?.[key] ?? null;
        const newVal = newValues?.[key] ?? null;
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            result.push({ key, old: oldVal, new: newVal });
        }
    });
    return result;
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
}
