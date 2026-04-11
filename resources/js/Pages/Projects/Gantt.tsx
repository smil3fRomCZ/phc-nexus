import 'frappe-gantt-css';
import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';
import EmptyState from '@/Components/EmptyState';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface GanttTask {
    id: string;
    title: string;
    number: number;
    due_date: string;
    start_date: string | null;
    created_at: string;
    assignee: { id: string; name: string } | null;
    epic: { id: string; title: string } | null;
    workflow_status: { id: string; name: string; is_done: boolean } | null;
    blockers?: { id: string }[];
}

interface GanttEpic {
    id: string;
    title: string;
    number: number;
    target_date: string;
    start_date: string | null;
    status: string;
}

interface Props {
    project: { id: string; name: string; key: string; status: string };
    tasks: GanttTask[];
    epics: GanttEpic[];
}

export default function ProjectGantt({ project, tasks, epics }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Week');

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Gantt' },
    ];

    const ganttItems = [
        ...epics.map((e) => ({
            id: `epic-${e.id}`,
            name: `[Epic] ${e.title}`,
            start: e.start_date ?? e.target_date,
            end: e.target_date,
            progress: e.status === 'done' ? 100 : e.status === 'in_progress' ? 50 : 0,
            custom_class: 'gantt-epic',
        })),
        ...tasks.map((t) => {
            const start = t.start_date ?? t.created_at.split('T')[0];
            const end = t.due_date;
            const dependencies = (t.blockers ?? []).map((b) => `task-${b.id}`).join(',');
            return {
                id: `task-${t.id}`,
                name: `${project.key}-${t.number} ${t.title}`,
                start: start > end ? end : start,
                end,
                progress: t.workflow_status?.is_done ? 100 : 0,
                custom_class: t.workflow_status?.is_done ? 'gantt-done' : 'gantt-task',
                dependencies,
            };
        }),
    ];

    useEffect(() => {
        if (!containerRef.current || ganttItems.length === 0) return;

        let mounted = true;

        import('frappe-gantt').then((module) => {
            if (!mounted || !containerRef.current) return;

            const Gantt = module.default;
            containerRef.current.innerHTML = '';

            const handleClick = (item: { id: string }) => {
                if (item.id.startsWith('task-')) {
                    const taskId = item.id.slice('task-'.length);
                    router.visit(`/projects/${project.id}/tasks/${taskId}`);
                } else if (item.id.startsWith('epic-')) {
                    const epicId = item.id.slice('epic-'.length);
                    router.visit(`/projects/${project.id}/epics/${epicId}`);
                }
            };

            const instance = new Gantt(containerRef.current, ganttItems, {
                view_mode: viewMode,
                date_format: 'YYYY-MM-DD',
                language: 'cs',
                readonly: true,
                popup_on: 'hover',
                on_click: handleClick,
            });

            // Frappe-gantt umisťuje tooltip podle event.offsetX/Y, což u SVG bar elementů
            // selhává a popup končí v levém horním rohu. Přepočítáme pozici z bounding rectu
            // skutečného bar elementu vůči gantt-containeru.
            const originalShowPopup = instance.show_popup.bind(instance);
            instance.show_popup = (args) => {
                const target = args.target;
                const container = instance.$container;
                if (target && container && typeof target.getBoundingClientRect === 'function') {
                    const targetRect = target.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    args.x =
                        targetRect.left - containerRect.left + container.scrollLeft + targetRect.width / 2;
                    args.y = targetRect.top - containerRect.top + container.scrollTop + targetRect.height;
                }
                originalShowPopup(args);
            };

            // SVG bary nemají kurzor pointer ve frappe-gantt — přidáme ho ručně,
            // aby uživatel věděl, že jsou klikatelné.
            instance.$container
                .querySelectorAll<SVGGElement>('.bar-wrapper')
                .forEach((el) => {
                    el.style.cursor = 'pointer';
                });
        });

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, ganttItems.length, project.id]);

    const hasData = ganttItems.length > 0;

    return (
        <AppLayout title={`${project.key} — Gantt`} breadcrumbs={breadcrumbs}>
            <div className="max-w-screen-xl space-y-5">
                <div className="mb-4">
                    <ProjectHeaderCompact project={project} />
                </div>
                <div className="flex items-center justify-between">
                    <ProjectTabs projectId={project.id} active="gantt" />
                </div>

                {hasData ? (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {(['Day', 'Week', 'Month'] as const).map((mode) => (
                                <Button
                                    key={mode}
                                    variant={viewMode === mode ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => setViewMode(mode)}
                                >
                                    {mode === 'Day' ? 'Den' : mode === 'Week' ? 'Týden' : 'Měsíc'}
                                </Button>
                            ))}
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                            <div ref={containerRef} />
                        </div>
                    </>
                ) : (
                    <EmptyState message="Žádné úkoly s termínem pro zobrazení v Gantt diagramu." />
                )}
            </div>
        </AppLayout>
    );
}
