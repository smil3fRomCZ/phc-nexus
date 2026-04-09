import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import ProjectTabs from '@/Components/ProjectTabs';
import RichTextDisplay from '@/Components/RichTextDisplay';
import RichTextEditor from '@/Components/RichTextEditor';
import CommentsSection from '@/Components/CommentsSection';
import type { Comment } from '@/Components/CommentsSection';
import AttachmentsSection from '@/Components/AttachmentsSection';
import type { Attachment } from '@/Components/AttachmentsSection';
import { formatDate } from '@/utils/formatDate';
import { Link, router, useForm } from '@inertiajs/react';
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import ActionIconButton from '@/Components/ActionIconButton';
import ConfirmModal from '@/Components/ConfirmModal';
import { useState, type FormEvent } from 'react';

interface WikiPageTree {
    id: string;
    title: string;
    children: WikiPageTree[];
}

interface WikiPage {
    id: string;
    title: string;
    content: string;
    author: { id: string; name: string };
    parent: { id: string; title: string } | null;
    root_comments: Comment[];
    attachments: Attachment[];
    comments_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    project: { id: string; name: string; key: string };
    page: WikiPage;
    pages: WikiPageTree[];
}

export default function WikiShow({ project, page, pages }: Props) {
    const [editing, setEditing] = useState(false);
    const [addingChild, setAddingChild] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Dokumentace', href: `/projects/${project.id}/wiki` },
        { label: page.title },
    ];

    const childForm = useForm({ title: '', parent_id: page.id });

    function submitChild(e: FormEvent) {
        e.preventDefault();
        childForm.post(`/projects/${project.id}/wiki`, {
            onSuccess: () => {
                childForm.reset();
                setAddingChild(false);
            },
        });
    }

    return (
        <AppLayout title={`${project.key} — ${page.title}`} breadcrumbs={breadcrumbs}>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="wiki" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Sidebar — tree */}
                <div className="hidden sm:block sm:w-56 sm:flex-shrink-0">
                    <div className="sm:sticky sm:top-20 rounded-lg border border-border-subtle bg-surface-primary p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Stránky
                            </span>
                            <Link
                                href={`/projects/${project.id}/wiki`}
                                className="text-xs text-text-muted no-underline hover:text-brand-primary"
                            >
                                Vše
                            </Link>
                        </div>
                        {pages.map((p) => (
                            <SidebarTreeItem key={p.id} item={p} projectId={project.id} activeId={page.id} depth={0} />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-5">
                    <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Dokumentace
                                </span>
                                <h1 className="mt-0.5 text-xl md:text-2xl font-bold text-text-strong">{page.title}</h1>
                                <div className="mt-1 text-xs text-text-muted">
                                    Autor: {page.author.name} · Aktualizováno: {formatDate(page.updated_at)}
                                    {page.parent && (
                                        <>
                                            {' '}
                                            · v sekci:{' '}
                                            <Link
                                                href={`/projects/${project.id}/wiki/${page.parent.id}`}
                                                className="text-brand-primary no-underline hover:underline"
                                            >
                                                {page.parent.title}
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <ActionIconButton onClick={() => setEditing(true)} label="Upravit">
                                    <Pencil className="h-4 w-4" />
                                </ActionIconButton>
                                <ActionIconButton onClick={() => setAddingChild(!addingChild)} label="Podstránka">
                                    <Plus className="h-4 w-4" />
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

                        {addingChild && (
                            <form onSubmit={submitChild} className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    value={childForm.data.title}
                                    onChange={(e) => childForm.setData('title', e.target.value)}
                                    placeholder="Název podstránky..."
                                    autoFocus
                                    className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                                />
                                <button
                                    type="submit"
                                    disabled={childForm.processing || !childForm.data.title}
                                    className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                                >
                                    Vytvořit
                                </button>
                            </form>
                        )}

                        {/* Content */}
                        {!editing && (
                            <div className="mt-4">
                                {page.content ? (
                                    <RichTextDisplay content={page.content} />
                                ) : (
                                    <p className="text-sm italic text-text-muted">Stránka nemá zatím obsah.</p>
                                )}
                            </div>
                        )}

                        {editing && (
                            <WikiEditForm
                                projectId={project.id}
                                page={page}
                                pages={pages}
                                onClose={() => setEditing(false)}
                            />
                        )}
                    </div>

                    {/* Attachments */}
                    <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                        <AttachmentsSection
                            attachments={page.attachments}
                            uploadUrl={`/projects/${project.id}/wiki/${page.id}/attachments`}
                        />
                    </div>

                    {/* Comments */}
                    <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                        <CommentsSection
                            comments={page.root_comments}
                            commentsCount={page.comments_count}
                            postUrl={`/projects/${project.id}/wiki/${page.id}/comments`}
                        />
                    </div>
                </div>
            </div>
            <ConfirmModal
                open={showDeleteModal}
                variant="danger"
                title="Smazat stránku"
                message="Opravdu chcete smazat tuto stránku? Tuto akci nelze vrátit."
                confirmLabel="Smazat"
                onConfirm={() => router.delete(`/projects/${project.id}/wiki/${page.id}`)}
                onCancel={() => setShowDeleteModal(false)}
            />
        </AppLayout>
    );
}

function SidebarTreeItem({
    item,
    projectId,
    activeId,
    depth,
}: {
    item: WikiPageTree;
    projectId: string;
    activeId: string;
    depth: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.id === activeId;

    return (
        <>
            <div
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    isActive
                        ? 'bg-brand-soft font-medium text-brand-primary'
                        : 'text-text-default hover:bg-surface-secondary'
                }`}
                style={{ paddingLeft: `${0.5 + depth * 1}rem` }}
            >
                {hasChildren ? (
                    <button onClick={() => setExpanded(!expanded)} className="text-text-subtle">
                        <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                ) : (
                    <span className="w-3" />
                )}
                <Link href={`/projects/${projectId}/wiki/${item.id}`} className="flex-1 truncate no-underline">
                    {item.title}
                </Link>
            </div>
            {hasChildren && expanded && (
                <>
                    {item.children.map((child) => (
                        <SidebarTreeItem
                            key={child.id}
                            item={child}
                            projectId={projectId}
                            activeId={activeId}
                            depth={depth + 1}
                        />
                    ))}
                </>
            )}
        </>
    );
}

function WikiEditForm({
    projectId,
    page,
    pages,
    onClose,
}: {
    projectId: string;
    page: WikiPage;
    pages: WikiPageTree[];
    onClose: () => void;
}) {
    const { data, setData, put, processing } = useForm({
        title: page.title,
        content: page.content,
        parent_id: page.parent?.id ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/projects/${projectId}/wiki/${page.id}`, { onSuccess: () => onClose() });
    }

    function flattenPages(items: WikiPageTree[], depth = 0): Array<{ id: string; title: string; depth: number }> {
        const result: Array<{ id: string; title: string; depth: number }> = [];
        for (const item of items) {
            if (item.id !== page.id) {
                result.push({ id: item.id, title: item.title, depth });
                if (item.children) {
                    result.push(...flattenPages(item.children, depth + 1));
                }
            }
        }
        return result;
    }

    const flatPages = flattenPages(pages);

    return (
        <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                    Název stránky
                </label>
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                    Nadřazená stránka
                </label>
                <select
                    value={data.parent_id}
                    onChange={(e) => setData('parent_id', e.target.value)}
                    className="mt-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="">(kořen — bez nadřazené)</option>
                    {flatPages.map((p) => (
                        <option key={p.id} value={p.id}>
                            {'\u00A0'.repeat(p.depth * 2)}
                            {p.title}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">Obsah</label>
                <div className="mt-1">
                    <RichTextEditor
                        content={data.content}
                        onChange={(html) => setData('content', html)}
                        placeholder="Obsah stránky..."
                        imageUploadUrl={`/projects/${projectId}/wiki/${page.id}/images`}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
                >
                    Zrušit
                </button>
                <button
                    type="submit"
                    disabled={processing || !data.title}
                    className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                >
                    Uložit
                </button>
            </div>
        </form>
    );
}
