import CommentsSection from '@/Components/CommentsSection';
import type { Comment } from '@/Components/CommentsSection';
import AttachmentsSection from '@/Components/AttachmentsSection';
import type { Attachment } from '@/Components/AttachmentsSection';
import Avatar from '@/Components/Avatar';
import StatusBadge from '@/Components/StatusBadge';
import { EPIC_STATUS } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { displayKey } from '@/utils/displayKey';
import { formatDate } from '@/utils/formatDate';
import { Link, router, useForm } from '@inertiajs/react';
import ActionIconButton from '@/Components/ActionIconButton';
import InlineDescription from '@/Components/InlineDescription';
import TabBar from '@/Components/TabBar';
import { Pencil, Plus, FileText, Timer, BookOpen, Trash2 } from 'lucide-react';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import RichTextEditor from '@/Components/RichTextEditor';
import TimeLogSection from '@/Components/TimeLogSection';
import type { TimeEntryData } from '@/Components/TimeLogSection';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import ConfirmModal from '@/Components/ConfirmModal';
import { useState, type FormEvent } from 'react';

interface Task {
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    assignee: { id: string; name: string } | null;
    workflow_status: { id: string; name: string; color: string | null } | null;
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
            <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-8">
                {/* ── Left Column ── */}
                <div className="min-w-0 flex-1 space-y-5">
                    {/* Header card */}
                    <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Epic</span>
                        <div className="mt-0.5 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <h1 className="text-xl md:text-2xl font-bold leading-tight text-text-strong">
                                    <span className="mr-2 text-text-muted">{displayKey(project.key, epic.number)}</span>
                                    {epic.title}
                                </h1>
                                <StatusBadge statusMap={EPIC_STATUS} value={epic.status} />
                            </div>
                            <div className="sm:ml-auto flex items-center gap-1">
                                <ActionIconButton onClick={() => setEditing(true)} label="Upravit">
                                    <Pencil className="h-4 w-4" />
                                </ActionIconButton>
                                <ActionIconButton
                                    onClick={() => setShowDeleteModal(true)}
                                    label="Smazat"
                                    variant="danger"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </ActionIconButton>
                            </div>
                        </div>

                        {/* Description — inline editable */}
                        <InlineDescription
                            content={epic.description}
                            updateUrl={`/projects/${project.id}/epics/${epic.id}/description`}
                            readonly={false}
                        />

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
                    <TabBar
                        tabs={[
                            { key: 'detail', label: 'Detail', icon: FileText },
                            { key: 'time', label: 'Čas', icon: Timer, badge: `${totalHours}h` },
                        ]}
                        activeTab={activeTab}
                        onChange={(key) => setActiveTab(key as 'detail' | 'time')}
                        trailing={
                            <Link
                                href={`/projects/${project.id}/epics/${epic.id}/wiki`}
                                className="flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium no-underline transition-colors text-text-muted hover:text-text-default"
                            >
                                <BookOpen className="h-3.5 w-3.5" />
                                Dokumentace
                                {epic.wiki_pages_count > 0 && (
                                    <span className="rounded-full bg-status-neutral-subtle px-1.5 py-px text-xs font-medium text-text-muted">
                                        {epic.wiki_pages_count}
                                    </span>
                                )}
                            </Link>
                        }
                    />

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

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex-1">
                                        <QuickAddTask projectId={project.id} epicId={epic.id} />
                                    </div>
                                    <AttachExistingTask projectId={project.id} epicId={epic.id} />
                                </div>

                                {epic.tasks.length > 0 && (
                                    <div className="mt-2 overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr>
                                                    {['Klíč', 'Název', 'Stav', 'Priorita', 'Řešitel', 'Termín'].map(
                                                        (h) => (
                                                            <th
                                                                key={h}
                                                                className="border-b-2 border-border-subtle px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                                            >
                                                                {h}
                                                            </th>
                                                        ),
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {epic.tasks.map((task) => (
                                                    <tr
                                                        key={task.id}
                                                        className="cursor-pointer transition-colors hover:bg-brand-soft"
                                                        onClick={() =>
                                                            router.visit(`/projects/${project.id}/tasks/${task.id}`)
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
                                                            <StatusBadge
                                                                label={task.workflow_status?.name ?? task.status}
                                                                color={task.workflow_status?.color ?? null}
                                                            />
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
                                    </div>
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
                                exportUrl={`/projects/${project.id}/epics/${epic.id}/export/time`}
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
                <div className="w-full lg:w-72 lg:flex-shrink-0">
                    <div className="lg:sticky lg:top-20 space-y-0 rounded-lg border border-border-subtle bg-surface-primary p-3 sm:p-5">
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
            <ConfirmModal
                open={showDeleteModal}
                variant="danger"
                title="Smazat Epic"
                message="Opravdu chcete smazat tento Epic? Tuto akci nelze vrátit."
                confirmLabel="Smazat"
                onConfirm={() => router.delete(`/projects/${project.id}/epics/${epic.id}`)}
                onCancel={() => setShowDeleteModal(false)}
            />
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

function AttachExistingTask({ projectId, epicId }: { projectId: string; epicId: string }) {
    const [open, setOpen] = useState(false);
    const [tasks, setTasks] = useState<{ id: string; number: number; title: string }[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');

    function fetchTasks(query: string) {
        setLoading(true);
        const params = new URLSearchParams({ format: 'json', no_epic: '1' });
        if (query) params.append('search', query);
        fetch(`/projects/${projectId}/tasks?${params}`)
            .then((res) => res.json())
            .then((json) => {
                setTasks(json.tasks ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }

    function toggle(taskId: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    }

    function handleOpen() {
        setOpen(true);
        setSearch('');
        setSelected(new Set());
        fetchTasks('');
    }

    function submit() {
        if (selected.size === 0 || submitting) return;
        setSubmitting(true);
        router.post(
            `/projects/${projectId}/epics/${epicId}/attach-tasks`,
            { task_ids: Array.from(selected) },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    setOpen(false);
                    setSelected(new Set());
                },
            },
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className="inline-flex items-center gap-1 rounded-md border border-border-default px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default"
            >
                <Plus className="h-3 w-3" />
                Připojit existující
            </button>

            <Modal open={open} onClose={() => setOpen(false)} size="max-w-md">
                <h3 className="mb-3 text-base font-bold text-text-strong">Připojit úkoly k epicu</h3>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        fetchTasks(e.target.value);
                    }}
                    placeholder="Hledat úkoly..."
                    className="mb-3 w-full rounded border border-border-default bg-surface-primary px-2.5 py-1.5 text-xs focus:border-border-focus focus:outline-none"
                    autoFocus
                />
                <div className="max-h-64 overflow-y-auto rounded-md border border-border-subtle">
                    {loading && <p className="p-3 text-xs text-text-muted">Načítání...</p>}
                    {!loading && tasks.length === 0 && <p className="p-3 text-xs text-text-muted">Žádné volné úkoly</p>}
                    {!loading &&
                        tasks.map((task) => {
                            const isChecked = selected.has(task.id);
                            return (
                                <label
                                    key={task.id}
                                    className="flex cursor-pointer items-center gap-3 border-b border-border-subtle px-3 py-2 text-sm last:border-b-0 hover:bg-surface-hover"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggle(task.id)}
                                        className="h-4 w-4 rounded border-border-default"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <span className="text-xs font-semibold text-text-muted">#{task.number}</span>{' '}
                                        <span className="text-text-default">{task.title}</span>
                                    </div>
                                </label>
                            );
                        })}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-text-muted">Vybráno: {selected.size}</span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-hover"
                        >
                            Zrušit
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={selected.size === 0 || submitting}
                            className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                        >
                            Připojit vybrané
                        </button>
                    </div>
                </div>
            </Modal>
        </>
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
    const { data, setData, put, processing, errors, isDirty } = useForm({
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
        <Modal
            open
            onClose={onClose}
            size="max-w-lg"
            isDirty={isDirty}
            closeConfirmMessage="Máte rozpracované změny v epicu. Opravdu chcete zavřít?"
        >
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Upravit Epic</h2>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SearchableSelect
                        variant="form"
                        label="Vlastník"
                        value={data.owner_id}
                        onChange={(v) => setData('owner_id', v)}
                        placeholder="—"
                        options={members.map((m) => ({ value: m.id, label: m.name }))}
                    />

                    <SearchableSelect
                        variant="form"
                        label="PM"
                        value={data.pm_id}
                        onChange={(v) => setData('pm_id', v)}
                        placeholder="—"
                        options={members.map((m) => ({ value: m.id, label: m.name }))}
                    />

                    <SearchableSelect
                        variant="form"
                        label="Lead Developer"
                        value={data.lead_developer_id}
                        onChange={(v) => setData('lead_developer_id', v)}
                        placeholder="—"
                        options={members.map((m) => ({ value: m.id, label: m.name }))}
                    />
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
        </Modal>
    );
}
