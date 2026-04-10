import StatusBadge from '@/Components/StatusBadge';
import { PROJECT_STATUS } from '@/constants/status';
import { formatDate } from '@/utils/formatDate';
import { Link, usePage } from '@inertiajs/react';

interface Props {
    project: {
        id: string;
        name: string;
        key: string;
        status: string;
    };
}

type Health = 'on_track' | 'at_risk' | 'blocked';

type SharedProps = {
    projectLastUpdate?: { health: Health; created_at: string | null } | null;
};

const HEALTH_DOT: Record<Health, string> = {
    on_track: 'bg-status-success',
    at_risk: 'bg-status-warning',
    blocked: 'bg-status-danger',
};

export default function ProjectHeaderCompact({ project }: Props) {
    const page = usePage<SharedProps>();
    const lastUpdate = page.props.projectLastUpdate ?? null;

    return (
        <div className="rounded-lg border border-border-subtle bg-surface-primary px-5 py-3">
            <div className="flex items-center gap-3">
                <Link
                    href={`/projects/${project.id}`}
                    className="text-xs font-semibold uppercase tracking-wider text-text-subtle no-underline hover:text-brand-primary"
                >
                    Projekt
                </Link>
                <h1 className="text-lg font-bold leading-tight text-text-strong">{project.name}</h1>
                <span className="font-mono text-xs text-text-muted">{project.key}</span>
                <StatusBadge statusMap={PROJECT_STATUS} value={project.status} />
                {lastUpdate && (
                    <>
                        <div className="ml-auto" />
                        <Link
                            href={`/projects/${project.id}/history`}
                            title="Poslední status update — kliknutím zobrazit historii"
                            className="hidden shrink-0 items-center gap-2 rounded-md border border-border-subtle bg-surface-secondary px-3 py-1.5 text-xs text-text-muted no-underline transition-colors hover:bg-surface-hover hover:text-text-default md:flex"
                        >
                            <span
                                className={`inline-block h-1.5 w-1.5 rounded-full ${HEALTH_DOT[lastUpdate.health] ?? 'bg-text-subtle'}`}
                            />
                            <span className="hidden lg:inline">Poslední update:</span>
                            <strong className="font-semibold text-text-default">
                                {lastUpdate.created_at ? formatDate(lastUpdate.created_at) : '—'}
                            </strong>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
