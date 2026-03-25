import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState, type DragEvent } from 'react';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
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

const priorityColors: Record<string, string> = {
    low: 'border-l-text-muted',
    medium: 'border-l-text-default',
    high: 'border-l-status-warning',
    urgent: 'border-l-status-danger',
};

const columnColors: Record<string, string> = {
    backlog: 'bg-status-neutral-subtle',
    todo: 'bg-status-neutral-subtle',
    in_progress: 'bg-status-info-subtle',
    in_review: 'bg-status-warning-subtle',
    done: 'bg-status-success-subtle',
};

export default function TaskBoard({ project, columns: initialColumns }: Props) {
    const [columns, setColumns] = useState(initialColumns);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);

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

        // Najdi úkol a jeho zdrojový sloupec
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

        // Optimistický update
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

        // PATCH na server
        fetch(`/projects/${project.id}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ status: targetStatus }),
        }).then((res) => {
            if (!res.ok) {
                // Revert — reload dat ze serveru
                router.reload({ only: ['columns'] });
            }
        });
    }

    return (
        <AppLayout title={`${project.key} — Kanban`}>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${project.id}`} className="text-sm text-text-muted hover:text-brand-primary">
                        &larr; {project.name}
                    </Link>
                    <h2 className="text-xl font-semibold text-text-strong">Kanban</h2>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/projects/${project.id}/board`}
                        className="rounded-md bg-brand-primary px-3 py-1.5 text-sm font-medium text-text-inverse"
                    >
                        Board
                    </Link>
                    <Link
                        href={`/projects/${project.id}/table`}
                        className="rounded-md border border-border-default px-3 py-1.5 text-sm font-medium text-text-default hover:bg-surface-hover"
                    >
                        Tabulka
                    </Link>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((col) => (
                    <div
                        key={col.status}
                        className={`flex w-72 flex-shrink-0 flex-col rounded-lg border border-border-default ${
                            dropTarget === col.status ? 'ring-2 ring-brand-primary' : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, col.status)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.status)}
                    >
                        <div className={`rounded-t-lg px-3 py-2 ${columnColors[col.status] ?? 'bg-surface-secondary'}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-text-strong">{col.label}</span>
                                <span className="rounded-full bg-surface-primary px-2 py-0.5 text-xs text-text-muted">
                                    {col.tasks.length}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-2 p-2" style={{ minHeight: '200px' }}>
                            {col.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className={`cursor-grab rounded-md border border-border-default border-l-4 bg-surface-primary p-3 shadow-sm transition-opacity hover:shadow-md active:cursor-grabbing ${
                                        priorityColors[task.priority] ?? ''
                                    } ${dragging === task.id ? 'opacity-50' : ''}`}
                                >
                                    <Link
                                        href={`/projects/${project.id}/tasks/${task.id}`}
                                        className="text-sm font-medium text-text-strong hover:text-brand-primary"
                                    >
                                        {task.title}
                                    </Link>
                                    <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                                        {task.epic && <span>{task.epic.title}</span>}
                                        <span>{task.assignee?.name ?? 'Nepřiřazeno'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
