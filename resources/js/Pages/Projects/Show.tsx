import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';

interface Comment {
    id: string;
    body: string;
    author: { id: string; name: string };
    created_at: string;
    edited_at: string | null;
    replies: Comment[];
}

interface Project {
    id: string;
    name: string;
    key: string;
    description: string | null;
    status: string;
    data_classification: string;
    owner: { id: string; name: string; email: string };
    team: { id: string; name: string } | null;
    members: Array<{ id: string; name: string; email: string }>;
    root_comments: Comment[];
    attachments_count: number;
    comments_count: number;
    start_date: string | null;
    target_date: string | null;
    created_at: string;
}

const statusLabels: Record<string, string> = {
    draft: 'Návrh',
    active: 'Aktivní',
    on_hold: 'Pozastavený',
    completed: 'Dokončený',
    archived: 'Archivovaný',
};

export default function ProjectShow({ project }: { project: Project }) {
    return (
        <AppLayout title={project.name}>
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-text-muted">{project.key}</span>
                            <h2 className="text-xl font-semibold text-text-strong">{project.name}</h2>
                        </div>
                        {project.description && (
                            <p className="mt-2 text-text-default">{project.description}</p>
                        )}
                    </div>
                    <Link
                        href={`/projects/${project.id}/edit`}
                        className="rounded-md border border-border-default px-3 py-1.5 text-sm text-text-default hover:bg-surface-hover"
                    >
                        Upravit
                    </Link>
                </div>

                {/* Metadata */}
                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border-default bg-surface-secondary p-4 text-sm md:grid-cols-4">
                    <div>
                        <span className="text-text-muted">Status</span>
                        <p className="font-medium text-text-strong">{statusLabels[project.status] ?? project.status}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Vlastník</span>
                        <p className="font-medium text-text-strong">{project.owner.name}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Tým</span>
                        <p className="font-medium text-text-strong">{project.team?.name ?? '—'}</p>
                    </div>
                    <div>
                        <span className="text-text-muted">Klasifikace</span>
                        <p className="font-medium text-text-strong">{project.data_classification.toUpperCase()}</p>
                    </div>
                </div>

                {/* Members */}
                <div className="mb-6">
                    <h3 className="mb-3 text-sm font-medium text-text-muted">Členové ({project.members.length})</h3>
                    <div className="flex flex-wrap gap-2">
                        {project.members.map((member) => (
                            <span key={member.id} className="rounded-full bg-surface-secondary px-3 py-1 text-sm text-text-default">
                                {member.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm text-text-muted">
                    <span>{project.comments_count} komentářů</span>
                    <span>{project.attachments_count} příloh</span>
                    {project.start_date && <span>Start: {project.start_date}</span>}
                    {project.target_date && <span>Cíl: {project.target_date}</span>}
                </div>
            </div>
        </AppLayout>
    );
}
