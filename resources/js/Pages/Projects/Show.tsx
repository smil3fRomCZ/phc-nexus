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
import {
    Trash2,
    Pencil,
    FileDown,
    ChevronDown,
    CheckCircle2,
    AlertCircle,
    Layers,
    Timer,
    Info,
    AlertTriangle,
    X,
    MoreVertical,
} from 'lucide-react';
import ConfirmModal from '@/Components/ConfirmModal';
import DeleteButton from '@/Components/DeleteButton';
import Modal from '@/Components/Modal';
import ProjectTabs from '@/Components/ProjectTabs';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useState } from 'react';

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

interface StatusUpdate {
    id: string;
    health: 'on_track' | 'at_risk' | 'blocked';
    body: string;
    author: { id: string; name: string };
    created_at: string;
}

const HEALTH_CONFIG: Record<
    string,
    { label: string; badgeBg: string; border: string; bg: string; text: string; icon: string }
> = {
    on_track: {
        label: 'Na trati',
        badgeBg: 'bg-green-600',
        border: 'border-green-600/20',
        bg: 'bg-green-50',
        text: 'text-green-800',
        icon: 'text-green-600',
    },
    at_risk: {
        label: 'Ohrožen',
        badgeBg: 'bg-amber-500',
        border: 'border-amber-500/20',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        icon: 'text-amber-500',
    },
    blocked: {
        label: 'Blokován',
        badgeBg: 'bg-red-600',
        border: 'border-red-600/20',
        bg: 'bg-red-50',
        text: 'text-red-800',
        icon: 'text-red-600',
    },
};

export default function ProjectShow({
    project,
    totalHours = 0,
    latestUpdate,
}: {
    project: Project;
    totalHours: number;
    latestUpdate?: StatusUpdate | null;
}) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name },
    ];

    return (
        <AppLayout title={project.name} breadcrumbs={breadcrumbs}>
            <div className="max-w-screen-xl space-y-5">
                {/* Header card */}
                <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Projekt
                            </span>
                            <div className="mt-0.5 flex items-center gap-3">
                                <h1 className="text-xl md:text-2xl font-bold leading-tight text-text-strong">
                                    {project.name}
                                </h1>
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
                        <div className="flex items-center gap-2">
                            <StatusUpdateForm projectId={project.id} />
                            <div className="hidden sm:flex items-center gap-2">
                                <Link
                                    href={`/projects/${project.id}/edit`}
                                    className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Upravit
                                </Link>
                                <ExportDropdown projectId={project.id} />
                                <DeleteButton onClick={() => { setDeleteConfirmName(''); setShowDeleteModal(true); }} />
                            </div>
                            {/* Mobile options */}
                            <ProjectOptionsMenu projectId={project.id} onDelete={() => { setDeleteConfirmName(''); setShowDeleteModal(true); }} />
                        </div>
                    </div>

                    {/* Metadata grid */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-border-subtle pt-4">
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
                    {latestUpdate && <StatusUpdateBanner update={latestUpdate} />}
                </div>

                {/* Tab navigation */}
                <ProjectTabs projectId={project.id} active="overview" />

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
            <ConfirmModal
                open={showDeleteModal}
                variant="danger"
                title="Smazat projekt"
                message={`Pro potvrzení smazání zadejte název projektu: „${project.name}"`}
                confirmLabel="Smazat projekt"
                confirmDisabled={deleteConfirmName !== project.name}
                onConfirm={() => router.delete(`/projects/${project.id}`)}
                onCancel={() => { setShowDeleteModal(false); setDeleteConfirmName(''); }}
            >
                <input
                    type="text"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder={project.name}
                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    autoFocus
                />
            </ConfirmModal>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
    const ref = useClickOutside(() => setOpen(false));

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

function StatusUpdateBanner({ update }: { update: StatusUpdate }) {
    const cfg = HEALTH_CONFIG[update.health] ?? HEALTH_CONFIG.on_track;
    return (
        <div className={`mt-3 flex items-center gap-3 rounded-md border ${cfg.border} ${cfg.bg} px-4 py-2.5`}>
            {update.health === 'on_track' ? (
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${cfg.icon}`} />
            ) : (
                <AlertTriangle className={`h-4 w-4 shrink-0 ${cfg.icon}`} />
            )}
            <div className="min-w-0 flex-1">
                <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.icon}`}>Status</span>
                <p className={`mt-0.5 text-sm ${cfg.text} truncate`}>{update.body}</p>
            </div>
            <span className="shrink-0 text-xs text-text-muted">{formatDate(update.created_at)}</span>
            <span className={`shrink-0 rounded-full ${cfg.badgeBg} px-2.5 py-0.5 text-xs font-semibold text-white`}>
                {cfg.label}
            </span>
        </div>
    );
}

function StatusUpdateForm({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false);
    const [health, setHealth] = useState<'on_track' | 'at_risk' | 'blocked'>('on_track');
    const [body, setBody] = useState('');
    const [processing, setProcessing] = useState(false);

    function submit() {
        if (!body.trim()) return;
        setProcessing(true);
        router.post(
            `/projects/${projectId}/updates`,
            { health, body },
            {
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setOpen(false);
                    setBody('');
                },
            },
        );
    }

    const healthOptions: Array<{
        value: 'on_track' | 'at_risk' | 'blocked';
        label: string;
        active: string;
    }> = [
        {
            value: 'on_track',
            label: '✓ Na trati',
            active: 'border-green-600 bg-green-50 text-green-700',
        },
        {
            value: 'at_risk',
            label: '⚠ Ohrožen',
            active: 'border-amber-500 bg-amber-50 text-amber-700',
        },
        {
            value: 'blocked',
            label: '✕ Blokován',
            active: 'border-red-600 bg-red-50 text-red-700',
        },
    ];

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-2 text-sm font-medium text-text-default transition-colors hover:bg-surface-hover"
            >
                <Info className="h-3.5 w-3.5" />
                Update
            </button>

            <Modal open={open} onClose={() => setOpen(false)} size="max-w-lg" showClose={false}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-text-strong">Status update</h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="rounded p-2 text-text-muted hover:bg-surface-hover"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Stav projektu
                                </label>
                                <div className="flex gap-2">
                                    {healthOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setHealth(opt.value)}
                                            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                                                health === opt.value
                                                    ? opt.active
                                                    : 'border-border-default text-text-muted hover:bg-surface-hover'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Zpráva
                                </label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={3}
                                    placeholder="Co se změnilo od posledního updatu..."
                                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover"
                                >
                                    Zrušit
                                </button>
                                <button
                                    onClick={submit}
                                    disabled={processing || !body.trim()}
                                    className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                                >
                                    Přidat update
                                </button>
                            </div>
                        </div>
            </Modal>
        </>
    );
}

function ProjectOptionsMenu({ projectId, onDelete }: { projectId: string; onDelete: () => void }) {
    const [open, setOpen] = useState(false);
    const ref = useClickOutside(() => setOpen(false));

    return (
        <div ref={ref} className="relative sm:hidden">
            <button
                onClick={() => setOpen(!open)}
                className="rounded-md border border-border-default px-2.5 py-2 text-text-muted transition-colors hover:bg-surface-hover"
            >
                <MoreVertical className="h-4 w-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border-subtle bg-surface-primary py-1 shadow-xl">
                    <Link
                        href={`/projects/${projectId}/edit`}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-default no-underline hover:bg-surface-hover"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Upravit
                    </Link>
                    <a
                        href={`/projects/${projectId}/export/tasks?format=csv`}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-default no-underline hover:bg-surface-hover"
                    >
                        <FileDown className="h-3.5 w-3.5" />
                        Export CSV
                    </a>
                    <button
                        onClick={() => { setOpen(false); onDelete(); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-status-danger hover:bg-status-danger-subtle"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Smazat
                    </button>
                </div>
            )}
        </div>
    );
}
