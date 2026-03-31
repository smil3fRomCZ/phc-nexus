import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import StatusBadge from '@/Components/StatusBadge';
import { MetadataGrid, MetadataField } from '@/Components/MetadataGrid';
import CommentsSection from '@/Components/CommentsSection';
import type { Comment } from '@/Components/CommentsSection';
import AttachmentsSection from '@/Components/AttachmentsSection';
import type { Attachment } from '@/Components/AttachmentsSection';
import { PROJECT_STATUS } from '@/constants/status';
import { formatDate } from '@/utils/formatDate';
import { Link, router } from '@inertiajs/react';
import { Trash2, FileDown, ChevronDown, CheckCircle2, AlertCircle, Layers, Users } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
    attachments: Attachment[];
    attachments_count: number;
    comments_count: number;
    tasks_count: number;
    tasks_completed_count: number;
    tasks_overdue_count: number;
    epics_count: number;
    members_count: number;
    start_date: string | null;
    target_date: string | null;
    created_at: string;
}

export default function ProjectShow({ project }: { project: Project }) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name },
    ];

    return (
        <AppLayout title={project.name} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold leading-tight text-text-strong">{project.name}</h1>
                            <StatusBadge statusMap={PROJECT_STATUS} value={project.status} />
                        </div>
                        <span className="text-sm font-mono text-text-muted">{project.key}</span>
                        {project.description && (
                            <p className="mt-2 text-base text-text-default">{project.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/projects/${project.id}/edit`}
                            className="rounded-md border border-border-default px-5 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                        >
                            Upravit
                        </Link>
                        <button
                            onClick={() => {
                                if (confirm('Opravdu chcete smazat tento projekt? Tuto akci nelze vrátit.')) {
                                    router.delete(`/projects/${project.id}`);
                                }
                            }}
                            className="rounded-md border border-status-danger/30 px-3 py-2 text-sm font-medium text-status-danger transition-colors hover:bg-status-danger-subtle"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Metadata */}
                <div className="mb-6">
                    <MetadataGrid>
                        <MetadataField label="Vlastník">{project.owner.name}</MetadataField>
                        <MetadataField label="Tým">{project.team?.name ?? '\u2014'}</MetadataField>
                        <MetadataField label="Klasifikace">{project.data_classification.toUpperCase()}</MetadataField>
                        <MetadataField label="Vytvořeno">
                            {formatDate(project.created_at)}
                        </MetadataField>
                    </MetadataGrid>
                </div>

                {/* Metrics */}
                <ProjectMetrics project={project} />

                {/* Members */}
                <div className="mb-6">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                        Členové ({project.members.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {project.members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-2 rounded-full bg-surface-secondary px-3 py-1"
                            >
                                <Avatar name={member.name} />
                                <span className="text-sm text-text-default">{member.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="flex gap-3">
                    <Link
                        href={`/projects/${project.id}/board`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Board
                    </Link>
                    <Link
                        href={`/projects/${project.id}/table`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Tabulka
                    </Link>
                    <Link
                        href={`/projects/${project.id}/epics`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        EPIC
                    </Link>
                    <Link
                        href={`/projects/${project.id}/approvals`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Schvalování
                    </Link>
                    <ExportDropdown projectId={project.id} />
                </div>

                {/* Dates */}
                {(project.start_date || project.target_date) && (
                    <div className="mt-6 flex gap-4 text-sm text-text-muted">
                        {project.start_date && (
                            <span>Zahájení: {formatDate(project.start_date)}</span>
                        )}
                        {project.target_date && (
                            <span>Cíl: {formatDate(project.target_date)}</span>
                        )}
                    </div>
                )}

                {/* Attachments */}
                <div className="mt-6">
                    <AttachmentsSection
                        attachments={project.attachments}
                        uploadUrl={`/projects/${project.id}/attachments`}
                    />
                </div>

                {/* Comments */}
                <div className="mt-6">
                    <CommentsSection
                        comments={project.root_comments}
                        commentsCount={project.comments_count}
                        postUrl={`/projects/${project.id}/comments`}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

function ProjectMetrics({ project }: { project: Project }) {
    const progress =
        project.tasks_count > 0 ? Math.round((project.tasks_completed_count / project.tasks_count) * 100) : 0;

    const tiles = [
        {
            label: 'Úkoly',
            value: `${project.tasks_completed_count}/${project.tasks_count}`,
            icon: CheckCircle2,
            color: 'info' as const,
            progress,
        },
        { label: 'Po termínu', value: project.tasks_overdue_count, icon: AlertCircle, color: 'danger' as const },
        { label: 'EPIC', value: project.epics_count, icon: Layers, color: 'neutral' as const },
        { label: 'Členové', value: project.members_count, icon: Users, color: 'neutral' as const },
    ];

    const colors: Record<string, { bg: string; text: string }> = {
        info: { bg: 'bg-status-info-subtle', text: 'text-status-info' },
        danger: { bg: 'bg-status-danger-subtle', text: 'text-status-danger' },
        neutral: { bg: 'bg-status-neutral-subtle', text: 'text-status-neutral' },
    };

    return (
        <div className="mb-6 grid grid-cols-4 gap-4">
            {tiles.map((tile) => {
                const c = colors[tile.color];
                const Icon = tile.icon;
                return (
                    <div
                        key={tile.label}
                        className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface-primary p-4 transition-shadow hover:shadow-md"
                    >
                        <div className={`mb-1 flex h-7 w-7 items-center justify-center rounded-md ${c.bg}`}>
                            <Icon className={`h-3.5 w-3.5 ${c.text}`} strokeWidth={2} />
                        </div>
                        <span className="text-xs font-medium text-text-muted">{tile.label}</span>
                        <span className="text-xl font-bold text-text-strong">{tile.value}</span>
                        {tile.progress !== undefined && (
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                                <div
                                    className="h-full rounded-full bg-status-info transition-all"
                                    style={{ width: `${tile.progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const EXPORT_FORMATS = [
    { value: 'csv', label: 'CSV', ext: 'csv' },
    { value: 'excel', label: 'Excel', ext: 'xls' },
    { value: 'html', label: 'HTML', ext: 'html' },
    { value: 'md', label: 'Markdown', ext: 'md' },
];

function ExportDropdown({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default transition-colors hover:bg-surface-hover"
            >
                <FileDown className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3" />
            </button>

            {open && (
                <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-border-subtle bg-surface-primary py-1 shadow-lg">
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase text-text-subtle">Úkoly</div>
                    {EXPORT_FORMATS.map((f) => (
                        <a
                            key={`tasks-${f.value}`}
                            href={`/projects/${projectId}/export/tasks?format=${f.value}`}
                            onClick={() => setOpen(false)}
                            className="block px-3 py-1.5 text-sm text-text-default no-underline hover:bg-surface-hover"
                        >
                            {f.label}
                        </a>
                    ))}
                    <div className="my-1 border-t border-border-subtle" />
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase text-text-subtle">Souhrn</div>
                    <a
                        href={`/projects/${projectId}/export/summary`}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-1.5 text-sm text-text-default no-underline hover:bg-surface-hover"
                    >
                        CSV
                    </a>
                </div>
            )}
        </div>
    );
}
