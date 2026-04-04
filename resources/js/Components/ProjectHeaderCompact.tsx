import StatusBadge from '@/Components/StatusBadge';
import { PROJECT_STATUS } from '@/constants/status';
import { Link } from '@inertiajs/react';

interface Props {
    project: {
        id: string;
        name: string;
        key: string;
        status: string;
    };
}

export default function ProjectHeaderCompact({ project }: Props) {
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
            </div>
        </div>
    );
}
