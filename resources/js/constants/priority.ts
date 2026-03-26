export interface PriorityConfig {
    label: string;
    textClass: string;
    borderClass: string;
}

export const PRIORITY: Record<string, PriorityConfig> = {
    low: { label: 'Low', textClass: 'text-text-muted', borderClass: 'border-l-text-muted' },
    medium: { label: 'Medium', textClass: 'text-text-default', borderClass: 'border-l-text-default' },
    high: { label: 'High', textClass: 'text-status-warning', borderClass: 'border-l-status-warning' },
    urgent: { label: 'Urgent', textClass: 'text-status-danger', borderClass: 'border-l-status-danger' },
};

export function getPriority(key: string): PriorityConfig {
    return PRIORITY[key] ?? PRIORITY.medium;
}
