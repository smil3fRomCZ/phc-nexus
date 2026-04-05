import Avatar from '@/Components/Avatar';
import ConfirmModal from '@/Components/ConfirmModal';
import Spinner from '@/Components/Spinner';
import { timeAgo } from '@/utils/formatDate';
import { router, useForm, usePage } from '@inertiajs/react';
import { MessageSquare, Pencil, Send } from 'lucide-react';
import type { PageProps } from '@/types';
import { useState, useRef, useEffect, type FormEvent } from 'react';

export interface Comment {
    id: string;
    body: string;
    author: { id: string; name: string };
    created_at: string;
    edited_at: string | null;
    replies: Comment[];
}

export default function CommentsSection({
    comments,
    commentsCount,
    postUrl,
    showHeader = true,
}: {
    comments: Comment[];
    commentsCount: number;
    postUrl: string;
    showHeader?: boolean;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <div className={showHeader ? 'mb-8' : ''}>
            {showHeader && (
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-strong">
                    <MessageSquare className="h-4 w-4" />
                    Komentáře
                    <span className="rounded-full bg-status-neutral-subtle px-2 py-px text-xs font-medium text-text-muted">
                        {commentsCount}
                    </span>
                </h2>
            )}

            <div className="space-y-4">
                {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} postUrl={postUrl} currentUserId={auth.user?.id} />
                ))}
            </div>

            <CommentForm postUrl={postUrl} />
        </div>
    );
}

/** Recursively collect all nested replies into a flat array. */
function flattenReplies(comment: Comment): Comment[] {
    const result: Comment[] = [];
    for (const reply of comment.replies ?? []) {
        result.push(reply);
        result.push(...flattenReplies(reply));
    }
    return result;
}

function CommentItem({
    comment,
    postUrl,
    currentUserId,
    isReply = false,
    rootId,
}: {
    comment: Comment;
    postUrl: string;
    currentUserId?: string;
    isReply?: boolean;
    rootId?: string;
}) {
    const [showReply, setShowReply] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editBody, setEditBody] = useState(comment.body);
    const [editSaving, setEditSaving] = useState(false);
    const editRef = useRef<HTMLTextAreaElement>(null);
    const isOwner = comment.author.id === currentUserId;
    const effectiveRootId = rootId ?? comment.id;

    useEffect(() => {
        if (editing && editRef.current) {
            editRef.current.focus();
            editRef.current.setSelectionRange(editRef.current.value.length, editRef.current.value.length);
        }
    }, [editing]);

    function handleEdit() {
        setEditBody(comment.body);
        setEditing(true);
    }

    function saveEdit() {
        setEditSaving(true);
        router.put(
            `/comments/${comment.id}`,
            { body: editBody },
            {
                onFinish: () => setEditSaving(false),
                onSuccess: () => setEditing(false),
                preserveScroll: true,
            },
        );
    }

    function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && (e.shiftKey || e.metaKey) && editBody.trim() && !editSaving) {
            e.preventDefault();
            saveEdit();
        }
        if (e.key === 'Escape') {
            setEditing(false);
            setEditBody(comment.body);
        }
    }

    const allReplies = !isReply ? flattenReplies(comment) : [];

    return (
        <div>
            <div className="rounded-lg border border-border-subtle bg-surface-primary p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar name={comment.author.name} />
                        <span className="text-sm font-medium text-text-strong">{comment.author.name}</span>
                        <span className="text-xs text-text-muted">{timeAgo(comment.created_at)}</span>
                        {comment.edited_at && <span className="text-xs italic text-text-subtle">(upraveno)</span>}
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setShowReply(!showReply)}
                            className="rounded px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hover hover:text-text-default"
                        >
                            Odpovědět
                        </button>
                        {isOwner && (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="rounded px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hover hover:text-text-default"
                                >
                                    <Pencil className="inline h-3 w-3" /> Upravit
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="rounded px-2.5 py-1 text-xs text-text-muted hover:bg-status-danger-subtle hover:text-status-danger"
                                >
                                    Smazat
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {editing ? (
                    <div>
                        <textarea
                            ref={editRef}
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            rows={3}
                            className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                        <div className="mt-1.5 flex gap-2">
                            <button
                                onClick={saveEdit}
                                disabled={editSaving || !editBody.trim()}
                                className="rounded-md bg-brand-primary px-3 py-1 text-xs font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                            >
                                {editSaving ? 'Ukládání...' : 'Uložit'}
                            </button>
                            <button
                                onClick={() => {
                                    setEditing(false);
                                    setEditBody(comment.body);
                                }}
                                className="rounded-md border border-border-default px-3 py-1 text-xs font-medium text-text-muted hover:bg-surface-hover"
                            >
                                Zrušit
                            </button>
                            <span className="self-center text-xs text-text-subtle">⌘+Enter uloží, Esc zruší</span>
                        </div>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-default">{comment.body}</p>
                )}
            </div>

            {!isReply && allReplies.length > 0 && (
                <div className="ml-4 sm:ml-8 border-l-2 border-border-subtle pl-3 sm:pl-4 space-y-2 mt-2">
                    {allReplies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            postUrl={postUrl}
                            currentUserId={currentUserId}
                            isReply
                            rootId={effectiveRootId}
                        />
                    ))}
                </div>
            )}

            {showReply && (
                <div className={isReply ? 'mt-2' : 'ml-4 sm:ml-8 mt-2'}>
                    <CommentForm postUrl={postUrl} parentId={effectiveRootId} onDone={() => setShowReply(false)} />
                </div>
            )}
            <ConfirmModal
                open={showDeleteModal}
                variant="danger"
                title="Smazat komentář"
                message="Opravdu chcete smazat tento komentář?"
                confirmLabel="Smazat"
                onConfirm={() => {
                    setShowDeleteModal(false);
                    router.delete(`/comments/${comment.id}`);
                }}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}

function CommentForm({ postUrl, parentId, onDone }: { postUrl: string; parentId?: string; onDone?: () => void }) {
    const { data, setData, post, processing, reset } = useForm({
        body: '',
        parent_id: parentId ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(postUrl, {
            onSuccess: () => {
                reset();
                onDone?.();
            },
        });
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && (e.shiftKey || e.metaKey) && data.body.trim() && !processing) {
            e.preventDefault();
            post(postUrl, {
                onSuccess: () => {
                    reset();
                    onDone?.();
                },
            });
        }
    }

    return (
        <form onSubmit={submit} className="mt-4 flex gap-2">
            <textarea
                value={data.body}
                onChange={(e) => setData('body', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                    parentId
                        ? 'Napsat odpověď… (Shift+Enter / ⌘+Enter odešle)'
                        : 'Přidat komentář… (Shift+Enter / ⌘+Enter odešle)'
                }
                rows={parentId ? 2 : 3}
                className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
            />
            <button
                type="submit"
                disabled={processing || !data.body.trim()}
                className="self-end rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
                {processing ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
            </button>
        </form>
    );
}
