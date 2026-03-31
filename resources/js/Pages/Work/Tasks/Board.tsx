import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import { COLUMN_COLORS } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import { displayKey } from '@/utils/displayKey';
import { Link, router } from '@inertiajs/react';
import { MessageSquare, Plus, Filter, ShieldAlert } from 'lucide-react';
import { useState, type DragEvent } from 'react';

interface Task {
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    data_classification: string;
    comments_count: number;
    assignee: { id: string; name: string } | null;
    epic: { id: string; title: string } | null;
}

interface Column {
    status: string;
    label: string;
    tasks: Task[];
}

interface Props {
    project: { id: string; name: string; key: string };
    columns: Column[];
}

export default function TaskBoard({ project, columns: initialColumns }: Props) {
    const [columns, setColumns] = useState(initialColumns);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Board' },
    ];

    function handleDragStart(e: DragEvent, taskId: string) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
        setDragging(taskId);
    }

    function handleDragOver(e: DragEvent, status: string) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(status);
    }

    function handleDragLeave() {
        setDropTarget(null);
    }

    function handleDrop(e: DragEvent, targetStatus: string) {
        e.preventDefault();
        setDropTarget(null);
        setDragging(null);

        const taskId = e.dataTransfer.getData('text/plain');
        if (!taskId) return;

        let sourceTask: Task | undefined;
        let sourceStatus: string | undefined;
        for (const col of columns) {
            const found = col.tasks.find((t) => t.id === taskId);
            if (found) {
                sourceTask = found;
                sourceStatus = col.status;
                break;
            }
        }

        if (!sourceTask || sourceStatus === targetStatus) return;

        setColumns((prev) =>
            prev.map((col) => {
                if (col.status === sourceStatus) {
                    return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
                }
                if (col.status === targetStatus) {
                    return { ...col, tasks: [...col.tasks, { ...sourceTask!, status: targetStatus }] };
                }
                return col;
            }),
        );

        fetch(`/projects/${project.id}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ status: targetStatus }),
        }).then((res) => {
            if (!res.ok) {
                router.reload({ only: ['columns'] });
            }
        });
    }

    return (
        <AppLayout title={`${project.key} — Board`} breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">Board</h1>
                <div className="flex gap-2">
                    <Link
                        href={`/projects/${project.id}/board`}
                        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse no-underline"
                    >
                        Board
                    </Link>
                    <Link
                        href={`/projects/${project.id}/table`}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default no-underline transition-colors hover:bg-surface-hover"
                    >
                        Tabulka
                    </Link>
                </div>
            </div>

            {/* Controls bar */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <button className="inline-flex items-center gap-2 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm text-text-default transition-colors hover:bg-surface-hover">
                    <Filter className="h-3.5 w-3.5" />
                    Filtr
                </button>
                <Link
                    href={`/projects/${project.id}/tasks/create`}
                    className="ml-auto inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-1.5 text-sm font-semibold text-text-inverse no-underline transition-colors hover:bg-brand-hover"
                >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Přidat úkol
                </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((col) => (
                    <div
                        key={col.status}
                        className={`flex w-72 flex-shrink-0 flex-col rounded-lg border border-border-subtle ${
                            dropTarget === col.status ? 'ring-2 ring-brand-primary' : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, col.status)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.status)}
                    >
                        <div
                            className={`rounded-t-lg px-3 py-2 ${COLUMN_COLORS[col.status] ?? 'bg-surface-secondary'}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold uppercase tracking-wide text-text-strong">
                                    {col.label}
                                </span>
                                <span className="rounded-full bg-surface-primary px-2 py-px text-xs font-semibold text-text-muted">
                                    {col.tasks.length}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-2 p-2" style={{ minHeight: '200px' }}>
                            {col.tasks.map((task) => {
                                const priority = getPriority(task.priority);
                                const isDone = col.status === 'done' || col.status === 'cancelled';

                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        className={`cursor-grab rounded-md border border-border-subtle bg-surface-primary p-3 shadow-sm transition-opacity hover:border-brand-muted hover:shadow-md active:cursor-grabbing ${
                                            dragging === task.id ? 'opacity-50' : ''
                                        } ${isDone ? 'opacity-65' : ''}`}
                                    >
                                        <Link
                                            href={`/projects/${project.id}/tasks/${task.id}`}
                                            className="text-sm font-medium text-text-strong no-underline hover:text-brand-primary"
                                        >
                                            <span className="mr-1.5 text-xs font-semibold text-text-muted">
                                                {displayKey(project.key, task.number)}
                                            </span>
                                            {task.title}
                                        </Link>
                                        <div className="mt-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold leading-tight ${priority.textClass} bg-opacity-10`}
                                                    style={{
                                                        backgroundColor: `color-mix(in srgb, currentColor 12%, transparent)`,
                                                    }}
                                                >
                                                    {priority.label}
                                                </span>
                                                {task.data_classification === 'phi' && (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full border border-brand-primary px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-brand-hover">
                                                        <ShieldAlert className="h-2.5 w-2.5" />
                                                        PHI
                                                    </span>
                                                )}
                                                {task.comments_count > 0 && (
                                                    <span className="inline-flex items-center gap-0.5 text-xs text-text-muted">
                                                        <MessageSquare className="h-3 w-3" />
                                                        {task.comments_count}
                                                    </span>
                                                )}
                                            </div>
                                            {task.assignee ? (
                                                <Avatar name={task.assignee.name} size="sm" />
                                            ) : (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-border-strong text-[9px] text-text-muted">
                                                    ?
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
