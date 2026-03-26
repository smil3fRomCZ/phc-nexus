export interface StatusConfig {
    label: string;
    className: string;
}

// ── Project statuses ──

export const PROJECT_STATUS: Record<string, StatusConfig> = {
    draft: { label: 'Draft', className: 'bg-status-neutral-subtle text-status-neutral' },
    active: { label: 'Active', className: 'bg-status-success-subtle text-status-success' },
    planning: { label: 'Planning', className: 'bg-status-info-subtle text-status-info' },
    on_hold: { label: 'On Hold', className: 'bg-status-warning-subtle text-status-warning' },
    in_review: { label: 'In Review', className: 'bg-status-review-subtle text-status-review' },
    completed: { label: 'Completed', className: 'bg-status-success-subtle text-status-success' },
    cancelled: { label: 'Cancelled', className: 'bg-status-danger-subtle text-status-danger' },
    archived: { label: 'Archived', className: 'bg-status-neutral-subtle text-status-neutral' },
};

// ── Task statuses ──

export const TASK_STATUS: Record<string, StatusConfig> = {
    backlog: { label: 'Backlog', className: 'bg-status-neutral-subtle text-status-neutral' },
    todo: { label: 'To Do', className: 'bg-status-neutral-subtle text-status-neutral' },
    in_progress: { label: 'In Progress', className: 'bg-status-info-subtle text-status-info' },
    in_review: { label: 'In Review', className: 'bg-status-review-subtle text-status-review' },
    done: { label: 'Done', className: 'bg-status-success-subtle text-status-success' },
    cancelled: { label: 'Cancelled', className: 'bg-status-neutral-subtle text-text-muted' },
};

// ── Epic statuses ──

export const EPIC_STATUS: Record<string, StatusConfig> = {
    backlog: { label: 'Backlog', className: 'bg-status-neutral-subtle text-status-neutral' },
    in_progress: { label: 'In Progress', className: 'bg-status-info-subtle text-status-info' },
    done: { label: 'Done', className: 'bg-status-success-subtle text-status-success' },
    cancelled: { label: 'Cancelled', className: 'bg-status-neutral-subtle text-text-muted' },
};

// ── Approval statuses ──

export const APPROVAL_STATUS: Record<string, StatusConfig> = {
    pending: { label: 'Pending', className: 'bg-status-warning-subtle text-status-warning' },
    approved: { label: 'Approved', className: 'bg-status-success-subtle text-status-success' },
    rejected: { label: 'Rejected', className: 'bg-status-danger-subtle text-status-danger' },
    cancelled: { label: 'Cancelled', className: 'bg-status-neutral-subtle text-text-muted' },
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
    label: 'Unknown',
    className: 'bg-status-neutral-subtle text-status-neutral',
};

export function getStatus(map: Record<string, StatusConfig>, key: string): StatusConfig {
    return map[key] ?? FALLBACK_STATUS;
}
