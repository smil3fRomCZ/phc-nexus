import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import FormInput from '@/Components/FormInput';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';
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
    project: { id: string; name: string; key: string; status: string };
    pages: WikiPage[];
}

export default function WikiIndex({ project, pages }: Props) {
    const [creating, setCreating] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        parent_id: '',
    });

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Dokumentace' },
    ];

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/projects/${project.id}/wiki`, {
            onSuccess: () => {
                reset();
                setCreating(false);
            },
        });
    }

    return (
        <AppLayout title={`${project.key} — Dokumentace`} breadcrumbs={breadcrumbs}>
            <div className="mb-4">
                <ProjectHeaderCompact project={project} />
            </div>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="wiki" />
            </div>

            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Dokumentace</h2>
                <Button
                    icon={<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    onClick={() => setCreating(!creating)}
                >
                    Nová stránka
                </Button>
            </div>

            {creating && (
                <form onSubmit={submit} className="mb-4 flex items-end gap-2">
                    <FormInput
                        id="wiki-title"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="Název stránky..."
                        autoFocus
                        wrapperClassName="flex-1"
                    />
                    <Button type="submit" disabled={processing || !data.title} loading={processing}>
                        Vytvořit
                    </Button>
                    <Button variant="secondary" type="button" onClick={() => setCreating(false)}>
                        Zrušit
                    </Button>
                </form>
            )}

            <div className="rounded-lg border border-border-subtle bg-surface-primary">
                {pages.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                        {pages.map((page) => (
                            <PageTreeItem key={page.id} page={page} projectId={project.id} depth={0} />
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

function PageTreeItem({ page, projectId, depth }: { page: WikiPage; projectId: string; depth: number }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = page.children && page.children.length > 0;

    return (
        <>
            <Link
                href={`/projects/${projectId}/wiki/${page.id}`}
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
                        <PageTreeItem key={child.id} page={child} projectId={projectId} depth={depth + 1} />
                    ))}
                </>
            )}
        </>
    );
}
