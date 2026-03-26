import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

const BREADCRUMBS: Breadcrumb[] = [
    { label: 'Home', href: '/' },
    { label: 'Projects' },
];

interface Project {
    id: string;
    name: string;
    key: string;
    status: string;
    owner: { id: string; name: string } | null;
    team: { id: string; name: string } | null;
    members_count: number;
    tasks_count: number;
    tasks_completed_count: number;
    updated_at: string;
}

interface Props {
    projects: {
        data: Project[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-status-neutral-subtle text-status-neutral' },
    active: { label: 'Active', className: 'bg-status-success-subtle text-status-success' },
    planning: { label: 'Planning', className: 'bg-status-info-subtle text-status-info' },
    on_hold: { label: 'On Hold', className: 'bg-status-warning-subtle text-status-warning' },
    in_review: { label: 'In Review', className: 'bg-status-review-subtle text-status-review' },
    completed: { label: 'Completed', className: 'bg-status-success-subtle text-status-success' },
    cancelled: { label: 'Cancelled', className: 'bg-status-danger-subtle text-status-danger' },
    archived: { label: 'Archived', className: 'bg-status-neutral-subtle text-status-neutral' },
};

const AVATAR_COLORS = [
    'bg-brand-primary',
    'bg-[#5243aa]',
    'bg-[#0747a6]',
    'bg-[#006644]',
    'bg-[#974f0c]',
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getProgress(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

function formatUpdatedAt(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProjectsIndex({ projects }: Props) {
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = projects.data.filter((project) => {
        const matchesStatus = !statusFilter || project.status === statusFilter;
        const matchesSearch =
            !searchQuery ||
            project.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <AppLayout title="Projects" breadcrumbs={BREADCRUMBS}>
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">Projects</h1>
                <Link
                    href="/projects/create"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary px-5 py-2 text-xs font-medium text-text-inverse no-underline transition-colors hover:bg-brand-hover"
                >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    New Project
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="mb-5 flex items-center gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 rounded-md border border-border-default bg-surface-primary px-3 text-xs text-text-default outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-soft"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="on_hold">On Hold</option>
                    <option value="in_review">In Review</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 w-56 rounded-md border border-border-default bg-surface-primary pl-8 pr-3 text-xs text-text-default placeholder:text-text-subtle outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-soft"
                    />
                </div>
            </div>

            {/* Projects Table */}
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                                Project Name
                            </th>
                            <th className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                                Status
                            </th>
                            <th className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                                Owner
                            </th>
                            <th className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                                Team
                            </th>
                            <th className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                                Tasks
                            </th>
                            <th className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-subtle" style={{ minWidth: 130 }}>
                                Progress
                            </th>
                            <th className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                                Updated
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.map((project) => {
                            const status = STATUS_CONFIG[project.status] ?? {
                                label: project.status,
                                className: 'bg-status-neutral-subtle text-status-neutral',
                            };
                            const progress = getProgress(
                                project.tasks_completed_count,
                                project.tasks_count,
                            );

                            return (
                                <tr
                                    key={project.id}
                                    className="transition-colors duration-100 hover:bg-brand-soft"
                                >
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm font-medium text-text-strong">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="text-text-strong no-underline hover:text-brand-primary"
                                        >
                                            {project.name}
                                        </Link>
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-[10px] px-2 py-px text-[11px] font-semibold leading-relaxed ${status.className}`}
                                        >
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        {project.owner ? (
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-text-inverse ${getAvatarColor(project.owner.name)}`}
                                                >
                                                    {getInitials(project.owner.name)}
                                                </div>
                                                <span className="text-xs text-text-default">
                                                    {project.owner.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-text-muted">&mdash;</span>
                                        )}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-default">
                                        {project.team?.name ?? '\u2014'}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-xs text-text-muted">
                                        {project.tasks_completed_count}/{project.tasks_count}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle" style={{ minWidth: 60 }}>
                                                <div
                                                    className="h-full rounded-full bg-brand-primary transition-[width] duration-300 ease-out"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="min-w-[28px] text-right text-[11px] font-medium text-text-muted">
                                                {progress}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-xs text-text-muted">
                                        {formatUpdatedAt(project.updated_at)}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProjects.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-5 py-8 text-center text-sm text-text-muted"
                                >
                                    {projects.data.length === 0
                                        ? 'No projects yet. Create your first one.'
                                        : 'No projects match your filters.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
