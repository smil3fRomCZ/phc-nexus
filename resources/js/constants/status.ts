export interface StatusConfig {
    label: string;
    className: string;
}

// ── Project statuses ──

export const PROJECT_STATUS: Record<string, StatusConfig> = {
    draft: { label: 'Návrh', className: 'bg-status-neutral-subtle text-status-neutral' },
    active: { label: 'Aktivní', className: 'bg-status-success-subtle text-status-success' },
    on_hold: { label: 'Pozastavený', className: 'bg-status-warning-subtle text-status-warning' },
    completed: { label: 'Dokončený', className: 'bg-status-success-subtle text-status-success' },
    archived: { label: 'Archivovaný', className: 'bg-status-neutral-subtle text-status-neutral' },
};

// ── Epic statuses ──

export const EPIC_STATUS: Record<string, StatusConfig> = {
    backlog: { label: 'Backlog', className: 'bg-status-neutral-subtle text-status-neutral' },
    in_progress: { label: 'V průběhu', className: 'bg-status-info-subtle text-status-info' },
    done: { label: 'Hotovo', className: 'bg-status-success-subtle text-status-success' },
    cancelled: { label: 'Zrušeno', className: 'bg-status-neutral-subtle text-text-muted' },
};

// ── Approval statuses ──

export const APPROVAL_STATUS: Record<string, StatusConfig> = {
    pending: { label: 'Čeká na schválení', className: 'bg-status-warning-subtle text-status-warning' },
    approved: { label: 'Schváleno', className: 'bg-status-success-subtle text-status-success' },
    rejected: { label: 'Zamítnuto', className: 'bg-status-danger-subtle text-status-danger' },
    cancelled: { label: 'Zrušeno', className: 'bg-status-neutral-subtle text-text-muted' },
};

// ── Kanban column colors ──

export const COLUMN_COLORS: Record<string, string> = {
    backlog: 'bg-status-neutral-subtle',
    todo: 'bg-status-neutral-subtle',
    in_progress: 'bg-status-info-subtle',
    in_review: 'bg-status-review-subtle',
    done: 'bg-status-success-subtle',
};

// ── Fallback ──

export const FALLBACK_STATUS: StatusConfig = {
    label: 'Neznámý',
    className: 'bg-status-neutral-subtle text-status-neutral',
};

export function getStatus(map: Record<string, StatusConfig>, key: string): StatusConfig {
    return map[key] ?? FALLBACK_STATUS;
}
