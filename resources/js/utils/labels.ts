export const taskStatusLabels: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'K zpracování',
    in_progress: 'V průběhu',
    in_review: 'V revizi',
    done: 'Hotovo',
    cancelled: 'Zrušeno',
};

export const taskPriorityLabels: Record<string, string> = {
    low: 'Nízká',
    medium: 'Střední',
    high: 'Vysoká',
    urgent: 'Urgentní',
};

export const epicStatusLabels: Record<string, string> = {
    backlog: 'Backlog',
    in_progress: 'V průběhu',
    done: 'Hotovo',
    cancelled: 'Zrušeno',
};

export const projectStatusLabels: Record<string, string> = {
    draft: 'Návrh',
    active: 'Aktivní',
    on_hold: 'Pozastavený',
    completed: 'Dokončený',
    archived: 'Archivovaný',
};

export const approvalStatusLabels: Record<string, string> = {
    pending: 'Čeká na schválení',
    approved: 'Schváleno',
    rejected: 'Zamítnuto',
    cancelled: 'Zrušeno',
};
