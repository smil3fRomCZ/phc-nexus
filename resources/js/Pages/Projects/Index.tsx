import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';

interface Project {
    id: string;
    name: string;
    key: string;
    status: string;
    owner: { id: string; name: string } | null;
    team: { id: string; name: string } | null;
    members_count: number;
    created_at: string;
}

interface Props {
    projects: {
        data: Project[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

const statusLabels: Record<string, string> = {
    draft: 'Návrh',
    active: 'Aktivní',
    on_hold: 'Pozastavený',
    completed: 'Dokončený',
    archived: 'Archivovaný',
};

const statusColors: Record<string, string> = {
    draft: 'bg-status-neutral-subtle text-status-neutral',
    active: 'bg-status-success-subtle text-status-success',
    on_hold: 'bg-status-warning-subtle text-status-warning',
    completed: 'bg-status-info-subtle text-status-info',
    archived: 'bg-surface-active text-text-muted',
};

export default function ProjectsIndex({ projects }: Props) {
    return (
        <AppLayout title="Projekty">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-strong">Projekty</h2>
                <Link
                    href="/projects/create"
                    className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-hover"
                >
                    Nový projekt
                </Link>
            </div>

            <div className="overflow-hidden rounded-lg border border-border-default">
                <table className="w-full text-sm">
                    <thead className="bg-surface-secondary">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-text-muted">Klíč</th>
                            <th className="px-4 py-3 text-left font-medium text-text-muted">Název</th>
                            <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-text-muted">Vlastník</th>
                            <th className="px-4 py-3 text-left font-medium text-text-muted">Tým</th>
                            <th className="px-4 py-3 text-right font-medium text-text-muted">Členů</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                        {projects.data.map((project) => (
                            <tr key={project.id} className="hover:bg-surface-hover">
                                <td className="px-4 py-3 font-mono text-xs text-text-muted">
                                    {project.key}
                                </td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="font-medium text-text-strong hover:text-brand-primary"
                                    >
                                        {project.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[project.status] ?? ''}`}>
                                        {statusLabels[project.status] ?? project.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-text-default">{project.owner?.name ?? '—'}</td>
                                <td className="px-4 py-3 text-text-default">{project.team?.name ?? '—'}</td>
                                <td className="px-4 py-3 text-right text-text-muted">{project.members_count}</td>
                            </tr>
                        ))}
                        {projects.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                                    Zatím žádné projekty. Vytvořte první.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
