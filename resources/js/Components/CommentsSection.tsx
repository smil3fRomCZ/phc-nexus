import Avatar from '@/Components/Avatar';
import Spinner from '@/Components/Spinner';
import { router, useForm, usePage } from '@inertiajs/react';
import { MessageSquare, Send } from 'lucide-react';
import type { PageProps } from '@/types';
import { useState, type FormEvent } from 'react';

export interface Comment {
    id: string;
    body: string;
    author: { id: string; name: string };
    created_at: string;
    edited_at: string | null;
    replies: Comment[];
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

export default function CommentsSection({
    comments,
    commentsCount,
    postUrl,
}: {
    comments: Comment[];
    commentsCount: number;
    postUrl: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-strong">
                <MessageSquare className="h-4 w-4" />
                Komentáře
                <span className="rounded-full bg-status-neutral-subtle px-2 py-px text-xs font-medium text-text-muted">
                    {commentsCount}
                </span>
            </h2>

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
    const isOwner = comment.author.id === currentUserId;
    // Root comment ID for threading — replies always point to the root
    const effectiveRootId = rootId ?? comment.id;

    function handleDelete() {
        if (confirm('Smazat tento komentář?')) {
            router.delete(`/comments/${comment.id}`);
        }
    }

    // For root comments, collect all replies (flat, not nested)
    const allReplies = !isReply ? flattenReplies(comment) : [];

    return (
        <div>
            <div className="rounded-lg border border-border-subtle bg-surface-primary p-4">
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
                            className="rounded px-2 py-0.5 text-xs text-text-muted hover:bg-surface-hover hover:text-text-default"
                        >
                            Odpovědět
                        </button>
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                className="rounded px-2 py-0.5 text-xs text-text-muted hover:bg-status-danger-subtle hover:text-status-danger"
                            >
                                Smazat
                            </button>
                        )}
                    </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-default">{comment.body}</p>
            </div>

            {/* Flat replies — all at the same indentation level */}
            {!isReply && allReplies.length > 0 && (
                <div className="ml-8 border-l-2 border-border-subtle pl-4 space-y-2 mt-2">
                    {allReplies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} postUrl={postUrl} currentUserId={currentUserId} isReply rootId={effectiveRootId} />
                    ))}
                </div>
            )}

            {showReply && (
                <div className={isReply ? 'mt-2' : 'ml-8 mt-2'}>
                    <CommentForm postUrl={postUrl} parentId={effectiveRootId} onDone={() => setShowReply(false)} />
                </div>
            )}
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

    return (
        <form onSubmit={submit} className="mt-4 flex gap-2">
            <textarea
                value={data.body}
                onChange={(e) => setData('body', e.target.value)}
                placeholder={parentId ? 'Napsat odpověď...' : 'Přidat komentář...'}
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
