import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import StatusBadge from '@/Components/StatusBadge';

import CommentsSection from '@/Components/CommentsSection';
import type { Comment } from '@/Components/CommentsSection';
import AttachmentsSection from '@/Components/AttachmentsSection';
import type { Attachment } from '@/Components/AttachmentsSection';
import { PROJECT_STATUS } from '@/constants/status';
import { formatDate } from '@/utils/formatDate';
import { Link, router } from '@inertiajs/react';
import { Trash2, FileDown, ChevronDown, CheckCircle2, AlertCircle, Layers, Timer } from 'lucide-react';
import ProjectTabs from '@/Components/ProjectTabs';
import { useState, useRef, useEffect } from 'react';

interface Project {
    id: string;
    name: string;
    key: string;
    description: string | null;
    status: string;
    data_classification: string;
    benefit_type: string | null;
    benefit_amount: string | null;
    benefit_note: string | null;
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

export default function ProjectShow({
    project,
    totalHours = 0,
}: {
    project: Project;
    totalHours: number;
}) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name },
    ];

    return (
        <AppLayout title={project.name} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-5xl space-y-5">
                {/* Header card */}
                <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Projekt
                            </span>
                            <div className="mt-0.5 flex items-center gap-3">
                                <h1 className="text-2xl font-bold leading-tight text-text-strong">{project.name}</h1>
                                <StatusBadge statusMap={PROJECT_STATUS} value={project.status} />
                            </div>
                            <div className="mt-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Kód:{' '}
                                </span>
                                <span className="font-mono text-sm text-text-muted">{project.key}</span>
                            </div>
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

                    {/* Metadata grid */}
                    <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border-subtle pt-4">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Vlastník
                            </div>
                            <div className="mt-0.5 text-sm font-medium text-text-strong">{project.owner.name}</div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Tým</div>
                            <div className="mt-0.5 text-sm font-medium text-text-strong">
                                {project.team?.name ?? '\u2014'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Klasifikace
                            </div>
                            <div className="mt-0.5 text-sm font-medium text-text-strong">
                                {project.data_classification.toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Zahájení
                            </div>
                            <div className="mt-0.5 text-sm text-text-muted">
                                {project.start_date ? formatDate(project.start_date) : '\u2014'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Cíl</div>
                            <div className="mt-0.5 text-sm text-text-muted">
                                {project.target_date ? formatDate(project.target_date) : '\u2014'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Vytvořeno
                            </div>
                            <div className="mt-0.5 text-sm text-text-muted">{formatDate(project.created_at)}</div>
                        </div>
                    </div>

                    {/* Benefit row */}
                    {project.benefit_type && (
                        <BenefitDisplay
                            type={project.benefit_type}
                            amount={project.benefit_amount}
                            note={project.benefit_note}
                        />
                    )}
                </div>

                {/* Tab navigation */}
                <div className="flex items-center justify-between">
                    <ProjectTabs projectId={project.id} active="overview" />
                    <ExportDropdown projectId={project.id} />
                </div>

                {/* Metrics */}
                <ProjectMetrics project={project} totalHours={totalHours} />

                {/* Members */}
                <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
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

                {/* Attachments */}
                <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                    <AttachmentsSection
                        attachments={project.attachments}
                        uploadUrl={`/projects/${project.id}/attachments`}
                    />
                </div>

                {/* Comments */}
                <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
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

function ProjectMetrics({ project, totalHours }: { project: Project; totalHours: number }) {
    const progress =
        project.tasks_count > 0 ? Math.round((project.tasks_completed_count / project.tasks_count) * 100) : 0;

    const tiles = [
        {
            label: 'Úkoly',
            value: `${project.tasks_completed_count}/${project.tasks_count}`,
            icon: CheckCircle2,
            color: 'info' as const,
            progress,
            href: `/projects/${project.id}/table`,
        },
        {
            label: 'Po termínu',
            value: project.tasks_overdue_count,
            icon: AlertCircle,
            color: 'danger' as const,
            href: `/projects/${project.id}/table?status=overdue`,
        },
        {
            label: 'Epic',
            value: project.epics_count,
            icon: Layers,
            color: 'neutral' as const,
            href: `/projects/${project.id}/epics`,
        },
        {
            label: 'Celkový čas',
            value: `${totalHours} h`,
            icon: Timer,
            color: 'info' as const,
            href: `/projects/${project.id}/time`,
        },
    ];

    const colors: Record<string, { bg: string; text: string }> = {
        info: { bg: 'bg-status-info-subtle', text: 'text-status-info' },
        danger: { bg: 'bg-status-danger-subtle', text: 'text-status-danger' },
        neutral: { bg: 'bg-status-neutral-subtle', text: 'text-status-neutral' },
    };

    return (
        <div className="grid grid-cols-4 gap-4">
            {tiles.map((tile) => {
                const c = colors[tile.color];
                const Icon = tile.icon;
                return (
                    <Link
                        key={tile.label}
                        href={tile.href}
                        className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border-subtle bg-surface-primary p-4 no-underline transition-shadow hover:shadow-md"
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
                    </Link>
                );
            })}
        </div>
    );
}

const BENEFIT_LABELS: Record<string, string> = {
    revenue: 'Obrat',
    costsave: 'Costsave',
    legal: 'Legal',
    platform: 'Platforma',
    strategy: 'Strategie',
};

const BENEFIT_MONEY_TYPES = new Set(['revenue', 'costsave']);

function BenefitDisplay({ type, amount, note }: { type: string; amount: string | null; note: string | null }) {
    const label = BENEFIT_LABELS[type] ?? type;
    const hasMoney = BENEFIT_MONEY_TYPES.has(type);

    return (
        <div className="mt-3 flex items-center gap-3 rounded-md border border-brand-primary/20 bg-brand-soft px-4 py-2.5">
            <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-hover">Přínos: {label}</span>
                {!hasMoney && note && <p className="mt-0.5 text-sm italic text-text-default">{note}</p>}
            </div>
            {hasMoney && amount && (
                <span className="ml-auto text-lg font-bold text-text-strong">
                    {Number(amount).toLocaleString('cs-CZ')} Kč
                </span>
            )}
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
