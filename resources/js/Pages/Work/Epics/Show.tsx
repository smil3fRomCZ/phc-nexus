import CommentsSection from '@/Components/CommentsSection';
import type { Comment } from '@/Components/CommentsSection';
import AttachmentsSection from '@/Components/AttachmentsSection';
import type { Attachment } from '@/Components/AttachmentsSection';
import Avatar from '@/Components/Avatar';
import StatusBadge from '@/Components/StatusBadge';
import { EPIC_STATUS, TASK_STATUS } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { displayKey } from '@/utils/displayKey';
import { formatDate } from '@/utils/formatDate';
import { Link, router, useForm } from '@inertiajs/react';
import { Pencil, Trash2, X, Plus, FileText, Timer, BookOpen } from 'lucide-react';
import RichTextDisplay from '@/Components/RichTextDisplay';
import RichTextEditor from '@/Components/RichTextEditor';
import TimeLogSection from '@/Components/TimeLogSection';
import type { TimeEntryData } from '@/Components/TimeLogSection';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { useState, type FormEvent } from 'react';

interface Task {
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    assignee: { id: string; name: string } | null;
}

interface Epic {
    id: string;
    number: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    owner: { id: string; name: string } | null;
    pm: { id: string; name: string } | null;
    lead_developer: { id: string; name: string } | null;
    tasks: Task[];
    tasks_count: number;
    root_comments: Comment[];
    attachments: Attachment[];
    attachments_count: number;
    comments_count: number;
    wiki_pages_count: number;
    start_date: string | null;
    target_date: string | null;
    created_at: string;
    updated_at: string;
}

interface Member {
    id: string;
    name: string;
}

interface SelectOption {
    value: string;
    label: string;
}

interface Props {
    project: { id: string; name: string; key: string };
    epic: Epic;
    members: Member[];
    statuses: SelectOption[];
    priorities: SelectOption[];
    timeEntries: TimeEntryData[];
    epicDirectHours: number;
    taskHours: number;
    totalHours: number;
}

export default function EpicShow({
    project,
    epic,
    members,
    statuses,
    priorities = [],
    timeEntries = [],
    epicDirectHours = 0,
    taskHours = 0,
    totalHours = 0,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'detail' | 'time'>('detail');

    function inlineUpdate(fields: Record<string, unknown>) {
        router.put(
            `/projects/${project.id}/epics/${epic.id}`,
            {
                title: epic.title,
                description: epic.description ?? '',
                status: epic.status,
                priority: epic.priority,
                owner_id: epic.owner?.id ?? '',
                pm_id: epic.pm?.id ?? '',
                lead_developer_id: epic.lead_developer?.id ?? '',
                ...fields,
            },
            { preserveScroll: true },
        );
    }

    const doneCount = epic.tasks.filter((t) => t.status === 'done').length;
    const progress = epic.tasks_count > 0 ? Math.round((doneCount / epic.tasks_count) * 100) : 0;

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Epic', href: `/projects/${project.id}/epics` },
        { label: displayKey(project.key, epic.number) },
    ];

    return (
        <AppLayout title={`${displayKey(project.key, epic.number)} — ${epic.title}`} breadcrumbs={breadcrumbs}>
            <div className="flex items-start gap-8">
                {/* ── Left Column ── */}
                <div className="min-w-0 flex-1 space-y-5">
                    {/* Header card */}
                    <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Epic</span>
                        <div className="mt-0.5 flex items-center gap-3">
                            <h1 className="text-2xl font-bold leading-tight text-text-strong">
                                <span className="mr-2 text-text-muted">{displayKey(project.key, epic.number)}</span>
                                {epic.title}
                            </h1>
                            <StatusBadge statusMap={EPIC_STATUS} value={epic.status} />
                            <div className="ml-auto flex gap-2">
                                <button
                                    onClick={() => setEditing(true)}
                                    className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default"
                                >
                                    <Pencil className="mr-1 inline-block h-3 w-3" />
                                    Upravit
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Opravdu chcete smazat tento Epic? Tuto akci nelze vrátit.')) {
                                            router.delete(`/projects/${project.id}/epics/${epic.id}`);
                                        }
                                    }}
                                    className="rounded-md border border-status-danger/30 px-3 py-1.5 text-xs font-medium text-status-danger transition-colors hover:bg-status-danger-subtle"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        {epic.description && (
                            <div className="mt-4 rounded-md border border-border-subtle bg-surface-secondary px-4 py-3">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Popis
                                </span>
                                <RichTextDisplay content={epic.description} />
                            </div>
                        )}

                        {/* Metadata strip */}
                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-border-subtle pt-4 text-xs text-text-muted">
                            <span>
                                Vlastník <strong className="text-text-default">{epic.owner?.name ?? '\u2014'}</strong>
                            </span>
                            <span>
                                Vytvořeno <strong className="text-text-default">{formatDate(epic.created_at)}</strong>
                            </span>
                            <span>
                                Aktualizováno{' '}
                                <strong className="text-text-default">{formatDate(epic.updated_at)}</strong>
                            </span>
                        </div>
                    </div>

                    {editing && (
                        <EpicEditDialog
                            project={project}
                            epic={epic}
                            members={members}
                            statuses={statuses}
                            priorities={priorities}
                            onClose={() => setEditing(false)}
                        />
                    )}

                    {/* Tab navigation */}
                    <div className="flex gap-0 border-b border-border-subtle">
                        <button
                            onClick={() => setActiveTab('detail')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                activeTab === 'detail'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-text-muted hover:text-text-default'
                            }`}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Detail
                        </button>
                        <button
                            onClick={() => setActiveTab('time')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                activeTab === 'time'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-text-muted hover:text-text-default'
                            }`}
                        >
                            <Timer className="h-3.5 w-3.5" />
                            Čas
                            <span className="rounded-full bg-status-neutral-subtle px-1.5 py-px text-xs font-medium text-text-muted">
                                {totalHours}h
                            </span>
                        </button>
                        <Link
                            href={`/projects/${project.id}/epics/${epic.id}/wiki`}
                            className={`flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium no-underline transition-colors text-text-muted hover:text-text-default`}
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            Dokumentace
                            {epic.wiki_pages_count > 0 && (
                                <span className="rounded-full bg-status-neutral-subtle px-1.5 py-px text-xs font-medium text-text-muted">
                                    {epic.wiki_pages_count}
                                </span>
                            )}
                        </Link>
                    </div>

                    {activeTab === 'detail' && (
                        <>
                            {/* Tasks with progress */}
                            <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-base font-semibold text-text-strong">
                                        Úkoly ({epic.tasks_count})
                                    </h2>
                                    <Link
                                        href={`/projects/${project.id}/epics/${epic.id}/tasks`}
                                        className="cursor-pointer text-xs text-text-muted no-underline hover:text-brand-primary"
                                    >
                                        Zobrazit vše
                                    </Link>
                                </div>

                                {/* Progress bar */}
                                {epic.tasks_count > 0 && (
                                    <div className="mb-4">
                                        <div className="mb-1 text-xs text-text-muted">
                                            {doneCount} z {epic.tasks_count} hotovo ({progress}%)
                                        </div>
                                        <div className="h-2 rounded-full bg-border-subtle">
                                            <div
                                                className="h-2 rounded-full bg-brand-primary transition-all"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <QuickAddTask projectId={project.id} epicId={epic.id} />

                                {epic.tasks.length > 0 && (
                                    <table className="mt-2 w-full border-collapse">
                                        <thead>
                                            <tr>
                                                {['Klíč', 'Název', 'Stav', 'Priorita', 'Řešitel', 'Termín'].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="border-b-2 border-border-subtle px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {epic.tasks.map((task) => (
                                                <tr
                                                    key={task.id}
                                                    className="cursor-pointer transition-colors hover:bg-brand-soft"
                                                    onClick={() =>
                                                        (window.location.href = `/projects/${project.id}/tasks/${task.id}`)
                                                    }
                                                >
                                                    <td className="border-b border-border-subtle px-3 py-2 font-mono text-xs font-semibold text-text-muted">
                                                        {displayKey(project.key, task.number)}
                                                    </td>
                                                    <td className="border-b border-border-subtle px-3 py-2">
                                                        <Link
                                                            href={`/projects/${project.id}/tasks/${task.id}`}
                                                            className="text-sm font-medium text-text-strong no-underline hover:text-brand-primary"
                                                        >
                                                            {task.title}
                                                        </Link>
                                                    </td>
                                                    <td className="border-b border-border-subtle px-3 py-2">
                                                        <StatusBadge statusMap={TASK_STATUS} value={task.status} />
                                                    </td>
                                                    <td
                                                        className={`border-b border-border-subtle px-3 py-2 text-xs font-semibold ${getPriority(task.priority).textClass}`}
                                                    >
                                                        {getPriority(task.priority).label}
                                                    </td>
                                                    <td className="border-b border-border-subtle px-3 py-2 text-sm text-text-muted">
                                                        {task.assignee ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Avatar name={task.assignee.name} size="sm" />
                                                                <span>{task.assignee.name}</span>
                                                            </div>
                                                        ) : (
                                                            '\u2014'
                                                        )}
                                                    </td>
                                                    <td className="border-b border-border-subtle px-3 py-2 text-sm text-text-muted">
                                                        {task.due_date ? formatDate(task.due_date) : '\u2014'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {epic.tasks.length === 0 && (
                                    <p className="mt-2 text-sm text-text-muted">
                                        Zatím žádné úkoly. Přidejte první výše.
                                    </p>
                                )}
                            </div>

                            {/* Comments */}
                            <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                                <CommentsSection
                                    comments={epic.root_comments}
                                    commentsCount={epic.comments_count}
                                    postUrl={`/projects/${project.id}/epics/${epic.id}/comments`}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'time' && (
                        <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                            <TimeLogSection
                                timeEntries={timeEntries}
                                totalHours={totalHours}
                                postUrl={`/projects/${project.id}/epics/${epic.id}/time-entries`}
                                currentUserId={auth.user?.id}
                                showTaskColumn
                                summaryItems={[
                                    { label: 'Celkem Epic', value: `${totalHours} h`, variant: 'info' },
                                    { label: 'Z úkolů', value: `${taskHours} h`, variant: 'success' },
                                    { label: 'Přímo na epicu', value: `${epicDirectHours} h`, variant: 'info' },
                                ]}
                            />
                        </div>
                    )}
                </div>

                {/* ── Right Sidebar ── */}
                <div className="w-72 flex-shrink-0">
                    <div className="sticky top-20 space-y-0 rounded-lg border border-border-subtle bg-surface-primary p-5">
                        {/* Group: Status + Priority */}
                        <div className="pb-4 mb-4 border-b border-border-subtle space-y-4">
                            <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Stav
                                </div>
                                <StatusBadge statusMap={EPIC_STATUS} value={epic.status} />
                            </div>
                            <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Priorita
                                </div>
                                <select
                                    value={epic.priority}
                                    onChange={(e) => inlineUpdate({ priority: e.target.value })}
                                    className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm font-medium transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                >
                                    {priorities.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Group: People */}
                        <div className="pb-4 mb-4 border-b border-border-subtle space-y-4">
                            <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Vlastník
                                </div>
                                <select
                                    value={epic.owner?.id ?? ''}
                                    onChange={(e) => inlineUpdate({ owner_id: e.target.value || null })}
                                    className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                >
                                    <option value="">Nepřiřazeno</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    PM
                                </div>
                                <select
                                    value={epic.pm?.id ?? ''}
                                    onChange={(e) => inlineUpdate({ pm_id: e.target.value || null })}
                                    className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                >
                                    <option value="">Nepřiřazeno</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Lead Developer
                                </div>
                                <select
                                    value={epic.lead_developer?.id ?? ''}
                                    onChange={(e) => inlineUpdate({ lead_developer_id: e.target.value || null })}
                                    className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                >
                                    <option value="">Nepřiřazeno</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Group: Context */}
                        <div className="pb-4 mb-4 border-b border-border-subtle space-y-3">
                            <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Projekt
                                </div>
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="text-sm text-brand-primary no-underline hover:underline"
                                >
                                    {project.name}
                                </Link>
                            </div>
                            {epic.start_date && (
                                <div>
                                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                        Zahájení
                                    </div>
                                    <span className="text-sm text-text-default">{formatDate(epic.start_date)}</span>
                                </div>
                            )}
                            {epic.target_date && (
                                <div>
                                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                        Cíl
                                    </div>
                                    <span className="text-sm text-text-default">{formatDate(epic.target_date)}</span>
                                </div>
                            )}
                        </div>

                        {/* Group: Attachments */}
                        <div>
                            <AttachmentsSection
                                attachments={epic.attachments}
                                uploadUrl={`/projects/${project.id}/epics/${epic.id}/attachments`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function QuickAddTask({ projectId, epicId }: { projectId: string; epicId: string }) {
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        status: 'backlog',
        priority: 'medium',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        if (!data.title.trim()) return;
        post(`/projects/${projectId}/epics/${epicId}/tasks`, {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    }

    return (
        <form onSubmit={submit} className="flex items-center gap-2">
            <Plus className="h-4 w-4 flex-shrink-0 text-text-muted" />
            <input
                type="text"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                placeholder="Název nového úkolu..."
                className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm placeholder:text-text-subtle focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
            />
            <button
                type="submit"
                disabled={processing || !data.title.trim()}
                className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
                Přidat
            </button>
        </form>
    );
}

function EpicEditDialog({
    project,
    epic,
    members,
    statuses,
    priorities,
    onClose,
}: {
    project: { id: string };
    epic: Epic;
    members: Member[];
    statuses: SelectOption[];
    priorities: SelectOption[];
    onClose: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm({
        title: epic.title,
        description: epic.description ?? '',
        status: epic.status,
        priority: epic.priority ?? 'medium',
        owner_id: epic.owner?.id ?? '',
        pm_id: epic.pm?.id ?? '',
        lead_developer_id: epic.lead_developer?.id ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/projects/${project.id}/epics/${epic.id}`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg border border-border-subtle bg-surface-primary p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-strong">Upravit Epic</h2>
                    <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-hover">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-default">Název *</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                        {errors.title && <p className="mt-1 text-xs text-status-danger">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-default">Popis</label>
                        <div className="mt-1">
                            <RichTextEditor
                                content={data.description}
                                onChange={(html) => setData('description', html)}
                                placeholder="Popis epicu..."
                            />
                        </div>
                        {errors.description && <p className="mt-1 text-xs text-status-danger">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-text-default">Stav</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            >
                                {statuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            {errors.status && <p className="mt-1 text-xs text-status-danger">{errors.status}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-default">Priorita</label>
                            <select
                                value={data.priority}
                                onChange={(e) => setData('priority', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            >
                                {priorities.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-text-default">Vlastník</label>
                            <select
                                value={data.owner_id}
                                onChange={(e) => setData('owner_id', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            >
                                <option value="">—</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-default">PM</label>
                            <select
                                value={data.pm_id}
                                onChange={(e) => setData('pm_id', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            >
                                <option value="">—</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-default">Lead Developer</label>
                            <select
                                value={data.lead_developer_id}
                                onChange={(e) => setData('lead_developer_id', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            >
                                <option value="">—</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                        >
                            Uložit změny
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
