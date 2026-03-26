import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import StatusBadge from '@/Components/StatusBadge';
import { TASK_STATUS } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Paperclip, Send, Download, Trash2, MessageSquare, Upload } from 'lucide-react';
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
    attachments_count: number;
    comments_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    project: { id: string; name: string; key: string };
    task: Task;
    allowedTransitions: Array<{ value: string; label: string }>;
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

export default function TaskShow({ project, task, allowedTransitions }: Props) {
    const { auth } = usePage<PageProps>().props;

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Tasks', href: `/projects/${project.id}/tasks` },
        { label: task.title },
    ];

    const priority = getPriority(task.priority);

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
                        </div>
                        {task.description && (
                            <p className="mt-3 text-base leading-relaxed text-text-default">{task.description}</p>
                        )}
                    </div>

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
                        <span className={`text-sm font-medium ${priority.textClass}`}>{priority.label}</span>
                    </SidebarSection>

                    <SidebarSection label="Assignee">
                        {task.assignee ? (
                            <div className="flex items-center gap-2">
                                <Avatar name={task.assignee.name} />
                                <span className="text-sm text-text-default">{task.assignee.name}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-text-muted">Unassigned</span>
                        )}
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

                    {task.due_date && (
                        <SidebarSection label="Due Date">
                            <span
                                className={`text-sm font-medium ${new Date(task.due_date) < new Date() ? 'text-status-danger' : 'text-text-default'}`}
                            >
                                {formatDate(task.due_date)}
                            </span>
                        </SidebarSection>
                    )}

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
