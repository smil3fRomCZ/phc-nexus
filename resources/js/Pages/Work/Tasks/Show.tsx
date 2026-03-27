import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import StatusBadge from '@/Components/StatusBadge';
import ActivityTimeline from '@/Components/ActivityTimeline';
import type { ActivityEntry } from '@/Components/ActivityTimeline';
import { TASK_STATUS } from '@/constants/status';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Paperclip,
    Send,
    Download,
    Trash2,
    MessageSquare,
    Upload,
    Pencil,
    X,
    ShieldCheck,
    Clock,
    Link2,
    Plus,
} from 'lucide-react';
import type { PageProps } from '@/types';
import { useState, type FormEvent } from 'react';

interface Comment {
    id: string;
    body: string;
    author: { id: string; name: string };
    created_at: string;
    edited_at: string | null;
    replies: Comment[];
}

interface Attachment {
    id: string;
    original_filename: string;
    mime_type: string;
    size: number;
    uploader: { id: string; name: string } | null;
    created_at: string;
}

interface DependencyTask {
    id: string;
    title: string;
    status: string;
    project_id: string;
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignee: { id: string; name: string } | null;
    reporter: { id: string; name: string } | null;
    epic: { id: string; title: string } | null;
    due_date: string | null;
    data_classification: string;
    root_comments: Comment[];
    attachments: Attachment[];
    blockers: DependencyTask[];
    blocking: DependencyTask[];
    attachments_count: number;
    comments_count: number;
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

interface ProjectTask {
    id: string;
    title: string;
}

interface Props {
    project: { id: string; name: string; key: string };
    task: Task;
    allowedTransitions: SelectOption[];
    members: Member[];
    statuses: SelectOption[];
    priorities: SelectOption[];
    activity: ActivityEntry[];
    projectTasks: ProjectTask[];
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function TaskShow({
    project,
    task,
    allowedTransitions,
    members,
    statuses,
    priorities,
    activity,
    projectTasks,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const [editing, setEditing] = useState(false);
    const [requestingApproval, setRequestingApproval] = useState(false);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Tasks', href: `/projects/${project.id}/tasks` },
        { label: task.title },
    ];

    function inlineUpdate(fields: Record<string, unknown>) {
        router.put(
            `/projects/${project.id}/tasks/${task.id}`,
            {
                title: task.title,
                description: task.description ?? '',
                status: task.status,
                priority: task.priority,
                assignee_id: task.assignee?.id ?? '',
                reporter_id: task.reporter?.id ?? '',
                due_date: task.due_date ?? '',
                ...fields,
            },
            { preserveScroll: true },
        );
    }

    function handleStatusChange(newStatus: string) {
        fetch(`/projects/${project.id}/tasks/${task.id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    return (
        <AppLayout title={`${project.key} — ${task.title}`} breadcrumbs={breadcrumbs}>
            <div className="flex gap-8">
                {/* ── Main Column ── */}
                <div className="min-w-0 flex-1">
                    {/* Title */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold leading-tight text-text-strong">{task.title}</h1>
                            <StatusBadge statusMap={TASK_STATUS} value={task.status} />
                            <div className="ml-auto flex gap-2">
                                <button
                                    onClick={() => setRequestingApproval(true)}
                                    className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default"
                                >
                                    <ShieldCheck className="mr-1 inline-block h-3 w-3" />
                                    Request Approval
                                </button>
                                <button
                                    onClick={() => setEditing(true)}
                                    className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default"
                                >
                                    <Pencil className="mr-1 inline-block h-3 w-3" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        if (
                                            confirm(
                                                'Are you sure you want to delete this task? This action cannot be undone.',
                                            )
                                        ) {
                                            router.delete(`/projects/${project.id}/tasks/${task.id}`);
                                        }
                                    }}
                                    className="rounded-md border border-status-danger/30 px-3 py-1.5 text-xs font-medium text-status-danger transition-colors hover:bg-status-danger-subtle"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        {task.description && (
                            <p className="mt-3 text-base leading-relaxed text-text-default">{task.description}</p>
                        )}
                    </div>

                    {editing && (
                        <TaskEditDialog
                            project={project}
                            task={task}
                            members={members}
                            statuses={statuses}
                            priorities={priorities}
                            onClose={() => setEditing(false)}
                        />
                    )}

                    {requestingApproval && (
                        <RequestApprovalDialog
                            projectId={project.id}
                            taskId={task.id}
                            members={members}
                            onClose={() => setRequestingApproval(false)}
                        />
                    )}

                    {/* Metadata strip */}
                    <div className="mb-6 flex gap-6 rounded-lg border border-border-subtle bg-surface-secondary px-5 py-3 text-xs text-text-muted">
                        <span>
                            Created <strong className="text-text-default">{formatDate(task.created_at)}</strong>
                        </span>
                        <span>
                            Updated <strong className="text-text-default">{formatDate(task.updated_at)}</strong>
                        </span>
                        {task.data_classification === 'phi' && (
                            <span className="rounded bg-status-warning-subtle px-1.5 py-0.5 text-xs font-bold tracking-wide text-status-warning">
                                PHI
                            </span>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="mb-8">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-strong">
                            <MessageSquare className="h-4 w-4" />
                            Comments
                            <span className="rounded-full bg-status-neutral-subtle px-2 py-px text-xs font-medium text-text-muted">
                                {task.comments_count}
                            </span>
                        </h2>

                        <div className="space-y-4">
                            {task.root_comments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    projectId={project.id}
                                    taskId={task.id}
                                    currentUserId={auth.user?.id}
                                />
                            ))}
                        </div>

                        <CommentForm projectId={project.id} taskId={task.id} />
                    </div>

                    {/* Activity Timeline */}
                    <div>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-strong">
                            <Clock className="h-4 w-4" />
                            Activity
                        </h2>
                        <ActivityTimeline entries={activity} />
                    </div>
                </div>

                {/* ── Right Sidebar ── */}
                <div className="w-72 flex-shrink-0 space-y-5">
                    <SidebarSection label="Status">
                        <StatusBadge statusMap={TASK_STATUS} value={task.status} />
                        {allowedTransitions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {allowedTransitions.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => handleStatusChange(t.value)}
                                        className="rounded border border-border-default px-2 py-0.5 text-xs text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default"
                                    >
                                        &rarr; {t.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </SidebarSection>

                    <SidebarSection label="Priority">
                        <select
                            value={task.priority}
                            onChange={(e) => inlineUpdate({ priority: e.target.value })}
                            className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm font-medium transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                        >
                            {priorities.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </SidebarSection>

                    <SidebarSection label="Assignee">
                        <select
                            value={task.assignee?.id ?? ''}
                            onChange={(e) => inlineUpdate({ assignee_id: e.target.value || null })}
                            className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                        >
                            <option value="">Unassigned</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </SidebarSection>

                    <SidebarSection label="Reporter">
                        {task.reporter ? (
                            <div className="flex items-center gap-2">
                                <Avatar name={task.reporter.name} />
                                <span className="text-sm text-text-default">{task.reporter.name}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-text-muted">{'\u2014'}</span>
                        )}
                    </SidebarSection>

                    <SidebarSection label="Project">
                        <Link
                            href={`/projects/${project.id}`}
                            className="text-sm text-brand-primary no-underline hover:underline"
                        >
                            {project.name}
                        </Link>
                    </SidebarSection>

                    {task.epic && (
                        <SidebarSection label="Epic">
                            <Link
                                href={`/projects/${project.id}/epics/${task.epic.id}`}
                                className="text-sm text-brand-primary no-underline hover:underline"
                            >
                                {task.epic.title}
                            </Link>
                        </SidebarSection>
                    )}

                    <SidebarSection label="Due Date">
                        <input
                            type="date"
                            value={task.due_date ?? ''}
                            onChange={(e) => inlineUpdate({ due_date: e.target.value || null })}
                            className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                        />
                    </SidebarSection>

                    <SidebarSection label="Dependencies">
                        <DependenciesPanel project={project} task={task} projectTasks={projectTasks} />
                    </SidebarSection>

                    <SidebarSection label={`Attachments (${task.attachments_count})`}>
                        <AttachmentList
                            attachments={task.attachments}
                            projectId={project.id}
                            taskId={task.id}
                            currentUserId={auth.user?.id}
                        />
                    </SidebarSection>
                </div>
            </div>
        </AppLayout>
    );
}

function TaskEditDialog({
    project,
    task,
    members,
    statuses,
    priorities,
    onClose,
}: {
    project: { id: string };
    task: Task;
    members: Member[];
    statuses: SelectOption[];
    priorities: SelectOption[];
    onClose: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm({
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        priority: task.priority,
        assignee_id: task.assignee?.id ?? '',
        reporter_id: task.reporter?.id ?? '',
        due_date: task.due_date ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/projects/${project.id}/tasks/${task.id}`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg border border-border-subtle bg-surface-primary p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-strong">Edit Task</h2>
                    <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-hover">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <EditField label="Title *" error={errors.title}>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </EditField>

                    <EditField label="Description" error={errors.description}>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </EditField>

                    <div className="grid grid-cols-2 gap-4">
                        <EditField label="Status" error={errors.status}>
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
                        </EditField>

                        <EditField label="Priority" error={errors.priority}>
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
                        </EditField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <EditField label="Assignee" error={errors.assignee_id}>
                            <select
                                value={data.assignee_id}
                                onChange={(e) => setData('assignee_id', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            >
                                <option value="">Unassigned</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </EditField>

                        <EditField label="Reporter" error={errors.reporter_id}>
                            <select
                                value={data.reporter_id}
                                onChange={(e) => setData('reporter_id', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            >
                                <option value="">—</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </EditField>
                    </div>

                    <EditField label="Due Date" error={errors.due_date}>
                        <input
                            type="date"
                            value={data.due_date}
                            onChange={(e) => setData('due_date', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </EditField>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-text-default">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        </div>
    );
}

function RequestApprovalDialog({
    projectId,
    taskId,
    members,
    onClose,
}: {
    projectId: string;
    taskId: string;
    members: Member[];
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm<{
        task_id: string;
        approver_ids: string[];
        description: string;
        expires_at: string;
    }>({
        task_id: taskId,
        approver_ids: [],
        description: '',
        expires_at: '',
    });

    function toggleApprover(id: string) {
        setData(
            'approver_ids',
            data.approver_ids.includes(id) ? data.approver_ids.filter((a) => a !== id) : [...data.approver_ids, id],
        );
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/projects/${projectId}/approvals`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg border border-border-subtle bg-surface-primary p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-strong">Request Approval</h2>
                    <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-hover">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <EditField label="Description" error={errors.description}>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            placeholder="What needs to be approved?"
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </EditField>

                    <div>
                        <label className="block text-xs font-medium text-text-default">Approvers *</label>
                        {errors.approver_ids && (
                            <p className="mt-1 text-xs text-status-danger">{errors.approver_ids}</p>
                        )}
                        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border-default p-2">
                            {members.map((m) => (
                                <label
                                    key={m.id}
                                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-hover"
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.approver_ids.includes(m.id)}
                                        onChange={() => toggleApprover(m.id)}
                                        className="rounded border-border-default"
                                    />
                                    <span className="text-text-default">{m.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <EditField label="Expires at" error={errors.expires_at}>
                        <input
                            type="datetime-local"
                            value={data.expires_at}
                            onChange={(e) => setData('expires_at', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </EditField>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || data.approver_ids.length === 0}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DependenciesPanel({
    project,
    task,
    projectTasks,
}: {
    project: { id: string };
    task: Task;
    projectTasks: ProjectTask[];
}) {
    const [adding, setAdding] = useState(false);
    const [selectedId, setSelectedId] = useState('');

    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    function addBlocker() {
        if (!selectedId) return;
        fetch(`/projects/${project.id}/tasks/${task.id}/dependencies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' },
            body: JSON.stringify({ blocker_id: selectedId }),
        }).then((res) => {
            if (res.ok) {
                setAdding(false);
                setSelectedId('');
                router.reload();
            }
        });
    }

    function removeBlocker(blockerId: string) {
        fetch(`/projects/${project.id}/tasks/${task.id}/dependencies/${blockerId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' },
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    const existingIds = new Set([...task.blockers.map((b) => b.id), ...task.blocking.map((b) => b.id), task.id]);
    const available = projectTasks.filter((t) => !existingIds.has(t.id));

    return (
        <div className="space-y-2">
            {task.blockers.length > 0 && (
                <div>
                    <div className="mb-1 text-xs text-text-subtle">Blocked by</div>
                    {task.blockers.map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 py-0.5">
                            <Link2 className="h-3 w-3 flex-shrink-0 text-status-danger" />
                            <Link
                                href={`/projects/${b.project_id}/tasks/${b.id}`}
                                className="truncate text-xs text-text-default no-underline hover:text-brand-primary"
                            >
                                {b.title}
                            </Link>
                            <button
                                onClick={() => removeBlocker(b.id)}
                                className="ml-auto rounded p-0.5 text-text-subtle hover:bg-status-danger-subtle hover:text-status-danger"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {task.blocking.length > 0 && (
                <div>
                    <div className="mb-1 text-xs text-text-subtle">Blocks</div>
                    {task.blocking.map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 py-0.5">
                            <Link2 className="h-3 w-3 flex-shrink-0 text-status-warning" />
                            <Link
                                href={`/projects/${b.project_id}/tasks/${b.id}`}
                                className="truncate text-xs text-text-default no-underline hover:text-brand-primary"
                            >
                                {b.title}
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {adding ? (
                <div className="flex gap-1">
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="flex-1 rounded border border-border-default bg-surface-primary px-2 py-1 text-xs focus:border-border-focus focus:outline-none"
                    >
                        <option value="">Select blocker...</option>
                        {available.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={addBlocker}
                        disabled={!selectedId}
                        className="rounded bg-brand-primary px-2 py-1 text-xs text-text-inverse disabled:opacity-50"
                    >
                        Add
                    </button>
                    <button
                        onClick={() => setAdding(false)}
                        className="rounded px-1 py-1 text-xs text-text-muted hover:bg-surface-hover"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-primary"
                >
                    <Plus className="h-3 w-3" />
                    Add blocker
                </button>
            )}
        </div>
    );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">{label}</div>
            {children}
        </div>
    );
}

function CommentItem({
    comment,
    projectId,
    taskId,
    currentUserId,
    isReply = false,
}: {
    comment: Comment;
    projectId: string;
    taskId: string;
    currentUserId?: string;
    isReply?: boolean;
}) {
    const [showReply, setShowReply] = useState(false);
    const isOwner = comment.author.id === currentUserId;

    function handleDelete() {
        if (confirm('Delete this comment?')) {
            router.delete(`/comments/${comment.id}`);
        }
    }

    return (
        <div className={isReply ? 'ml-8 border-l-2 border-border-subtle pl-4' : ''}>
            <div className="rounded-lg border border-border-subtle bg-surface-primary p-4">
                <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar name={comment.author.name} />
                        <span className="text-sm font-medium text-text-strong">{comment.author.name}</span>
                        <span className="text-xs text-text-muted">{timeAgo(comment.created_at)}</span>
                        {comment.edited_at && <span className="text-xs italic text-text-subtle">(edited)</span>}
                    </div>
                    <div className="flex gap-1">
                        {!isReply && (
                            <button
                                onClick={() => setShowReply(!showReply)}
                                className="rounded px-2 py-0.5 text-xs text-text-muted hover:bg-surface-hover hover:text-text-default"
                            >
                                Reply
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                className="rounded px-2 py-0.5 text-xs text-text-muted hover:bg-status-danger-subtle hover:text-status-danger"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-default">{comment.body}</p>
            </div>

            {comment.replies?.map((reply) => (
                <CommentItem
                    key={reply.id}
                    comment={reply}
                    projectId={projectId}
                    taskId={taskId}
                    currentUserId={currentUserId}
                    isReply
                />
            ))}

            {showReply && (
                <div className="ml-8 mt-2">
                    <CommentForm
                        projectId={projectId}
                        taskId={taskId}
                        parentId={comment.id}
                        onDone={() => setShowReply(false)}
                    />
                </div>
            )}
        </div>
    );
}

function CommentForm({
    projectId,
    taskId,
    parentId,
    onDone,
}: {
    projectId: string;
    taskId: string;
    parentId?: string;
    onDone?: () => void;
}) {
    const { data, setData, post, processing, reset } = useForm({
        body: '',
        parent_id: parentId ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/projects/${projectId}/tasks/${taskId}/comments`, {
            onSuccess: () => {
                reset();
                onDone?.();
            },
        });
    }

    return (
        <form onSubmit={submit} className="mt-4 flex gap-2">
            <textarea
                value={data.body}
                onChange={(e) => setData('body', e.target.value)}
                placeholder={parentId ? 'Write a reply...' : 'Add a comment...'}
                rows={parentId ? 2 : 3}
                className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
            />
            <button
                type="submit"
                disabled={processing || !data.body.trim()}
                className="self-end rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
                <Send className="h-4 w-4" />
            </button>
        </form>
    );
}

function AttachmentList({
    attachments,
    projectId,
    taskId,
    currentUserId,
}: {
    attachments: Attachment[];
    projectId: string;
    taskId: string;
    currentUserId?: string;
}) {
    const [uploading, setUploading] = useState(false);

    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        fetch(`/projects/${projectId}/tasks/${taskId}/attachments`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'text/html',
            },
            body: formData,
        }).then(() => {
            setUploading(false);
            router.reload();
        });
    }

    function handleDelete(attachmentId: string) {
        if (confirm('Delete this attachment?')) {
            router.delete(`/attachments/${attachmentId}`);
        }
    }

    return (
        <div className="space-y-2">
            {attachments.map((att) => (
                <div
                    key={att.id}
                    className="flex items-center gap-2 rounded border border-border-subtle px-3 py-2 text-xs"
                >
                    <Paperclip className="h-3 w-3 flex-shrink-0 text-text-muted" />
                    <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-text-strong">{att.original_filename}</div>
                        <div className="text-text-muted">{formatFileSize(att.size)}</div>
                    </div>
                    <a
                        href={`/attachments/${att.id}/download`}
                        className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-default"
                    >
                        <Download className="h-3 w-3" />
                    </a>
                    {att.uploader?.id === currentUserId && (
                        <button
                            onClick={() => handleDelete(att.id)}
                            className="rounded p-1 text-text-muted hover:bg-status-danger-subtle hover:text-status-danger"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    )}
                </div>
            ))}

            <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-border-default px-3 py-2 text-xs text-text-muted transition-colors hover:border-brand-primary hover:text-brand-primary">
                <Upload className="h-3 w-3" />
                {uploading ? 'Uploading...' : 'Upload file'}
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
        </div>
    );
}
