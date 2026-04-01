import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { displayKey } from '@/utils/displayKey';
import { Link, useForm } from '@inertiajs/react';
import { BookOpen, ChevronRight, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface WikiPage {
    id: string;
    title: string;
    author: { id: string; name: string };
    children: WikiPage[];
}

interface Props {
    project: { id: string; name: string; key: string };
    epic: { id: string; title: string; number: number };
    pages: WikiPage[];
}

export default function EpicWikiIndex({ project, epic, pages }: Props) {
    const [creating, setCreating] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        parent_id: '',
    });

    const epicKey = displayKey(project.key, epic.number);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Epic', href: `/projects/${project.id}/epics` },
        { label: epicKey, href: `/projects/${project.id}/epics/${epic.id}` },
        { label: 'Dokumentace' },
    ];

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/projects/${project.id}/epics/${epic.id}/wiki`, {
            onSuccess: () => {
                reset();
                setCreating(false);
            },
        });
    }

    return (
        <AppLayout title={`${epicKey} — Dokumentace`} breadcrumbs={breadcrumbs}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">
                    Dokumentace — {epicKey} {epic.title}
                </h2>
                <button
                    onClick={() => setCreating(!creating)}
                    className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-1.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
                >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Nová stránka
                </button>
            </div>

            {creating && (
                <form onSubmit={submit} className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="Název stránky..."
                        autoFocus
                        className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                    <button
                        type="submit"
                        disabled={processing || !data.title}
                        className="rounded-md bg-brand-primary px-4 py-2 text-xs font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                    >
                        Vytvořit
                    </button>
                    <button
                        type="button"
                        onClick={() => setCreating(false)}
                        className="rounded-md border border-border-default px-4 py-2 text-xs font-medium text-text-muted hover:bg-surface-hover"
                    >
                        Zrušit
                    </button>
                </form>
            )}

            <div className="rounded-lg border border-border-subtle bg-surface-primary">
                {pages.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                        {pages.map((page) => (
                            <PageTreeItem key={page.id} page={page} projectId={project.id} epicId={epic.id} depth={0} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
                        <BookOpen className="h-8 w-8 text-text-subtle" />
                        <p className="text-sm">Zatím žádné stránky dokumentace. Vytvořte první.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function PageTreeItem({
    page,
    projectId,
    epicId,
    depth,
}: {
    page: WikiPage;
    projectId: string;
    epicId: string;
    depth: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = page.children && page.children.length > 0;

    return (
        <>
            <Link
                href={`/projects/${projectId}/epics/${epicId}/wiki/${page.id}`}
                className="flex items-center gap-2 px-4 py-3 text-sm no-underline transition-colors hover:bg-brand-soft"
                style={{ paddingLeft: `${1 + depth * 1.5}rem` }}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setExpanded(!expanded);
                        }}
                        className="text-text-subtle"
                    >
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                ) : (
                    <span className="w-3.5" />
                )}
                <BookOpen className="h-3.5 w-3.5 text-text-subtle" />
                <span className="font-medium text-text-strong">{page.title}</span>
                <span className="ml-auto text-xs text-text-muted">{page.author.name}</span>
            </Link>
            {hasChildren && expanded && (
                <>
                    {page.children.map((child) => (
                        <PageTreeItem
                            key={child.id}
                            page={child}
                            projectId={projectId}
                            epicId={epicId}
                            depth={depth + 1}
                        />
                    ))}
                </>
            )}
        </>
    );
}
