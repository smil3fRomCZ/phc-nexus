import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import { COLUMN_COLORS } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import { displayKey } from '@/utils/displayKey';
import { formatDate } from '@/utils/formatDate';
import { Link, router } from '@inertiajs/react';
import { MessageSquare, Plus, ShieldAlert, Settings2, Layers } from 'lucide-react';
import ProjectTabs from '@/Components/ProjectTabs';
import { useState, useRef, useEffect, type DragEvent } from 'react';

interface Task {
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    data_classification: string;
    due_date: string | null;
    comments_count: number;
    assignee: { id: string; name: string } | null;
    reporter: { id: string; name: string } | null;
    epic: { id: string; title: string } | null;
}

interface Column {
    status: string;
    label: string;
    tasks: Task[];
}

interface Member {
    id: string;
    name: string;
}

interface EpicOption {
    id: string;
    title: string;
}

interface BoardSettings {
    card_fields: string[];
}

interface Props {
    project: { id: string; name: string; key: string };
    columns: Column[];
    members: Member[];
    epics: EpicOption[];
    filters: Record<string, string | undefined>;
    boardSettings: BoardSettings;
}

const CARD_FIELD_OPTIONS = [
    { value: 'priority', label: 'Priorita' },
    { value: 'assignee', label: 'Řešitel' },
    { value: 'epic', label: 'Epic' },
    { value: 'due_date', label: 'Termín' },
    { value: 'comments_count', label: 'Komentáře' },
    { value: 'phi', label: 'PHI' },
    { value: 'reporter', label: 'Zadavatel' },
];

export default function TaskBoard({
    project,
    columns: initialColumns,
    members = [],
    epics = [],
    filters = {},
    boardSettings,
}: Props) {
    const [columns, setColumns] = useState(initialColumns);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [cardFields, setCardFields] = useState<string[]>(
        boardSettings?.card_fields ?? ['priority', 'assignee', 'comments_count'],
    );
    const settingsRef = useRef<HTMLDivElement>(null);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Kanban' },
    ];

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function applyFilter(key: string, value: string) {
        const params = { ...filters, [key]: value || undefined };
        router.get(`/projects/${project.id}/board`, params, { preserveState: true, replace: true });
    }

    function toggleCardField(field: string) {
        const next = cardFields.includes(field) ? cardFields.filter((f) => f !== field) : [...cardFields, field];
        setCardFields(next);
        fetch('/user/board-settings', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ card_fields: next }),
        });
    }

    function shows(field: string) {
        return cardFields.includes(field);
    }

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
        }).then(async (res) => {
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                if (data?.error) {
                    alert(data.error);
                }
                router.reload({ only: ['columns'] });
            }
        });
    }

    return (
        <AppLayout title={`${project.key} — Kanban`} breadcrumbs={breadcrumbs}>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="board" />
            </div>

            {/* Filter + controls bar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                    value={filters.assignee_id ?? ''}
                    onChange={(e) => applyFilter('assignee_id', e.target.value)}
                    className="h-8 rounded-md border border-border-default bg-surface-primary px-3 text-sm focus:border-brand-primary focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                >
                    <option value="">Všichni řešitelé</option>
                    {members.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.name}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.epic_id ?? ''}
                    onChange={(e) => applyFilter('epic_id', e.target.value)}
                    className="h-8 rounded-md border border-border-default bg-surface-primary px-3 text-sm focus:border-brand-primary focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                >
                    <option value="">Všechny epicy</option>
                    {epics.map((ep) => (
                        <option key={ep.id} value={ep.id}>
                            {ep.title}
                        </option>
                    ))}
                </select>

                {/* Settings popover */}
                <div ref={settingsRef} className="relative ml-auto">
                    <button
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-hover"
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                        Zobrazení karet
                    </button>
                    {settingsOpen && (
                        <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border-subtle bg-surface-primary p-3 shadow-lg">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Viditelná pole
                            </div>
                            {CARD_FIELD_OPTIONS.map((opt) => (
                                <label
                                    key={opt.value}
                                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-text-default hover:bg-surface-hover"
                                >
                                    <input
                                        type="checkbox"
                                        checked={cardFields.includes(opt.value)}
                                        onChange={() => toggleCardField(opt.value)}
                                        className="accent-brand-primary"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <Link
                    href={`/projects/${project.id}/tasks/create`}
                    className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-1.5 text-sm font-semibold text-text-inverse no-underline transition-colors hover:bg-brand-hover"
                >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Přidat úkol
                </Link>
            </div>

            {/* Board columns */}
            <div className="flex gap-3 overflow-x-auto pb-4">
                {columns.map((col) => (
                    <div
                        key={col.status}
                        className={`flex w-64 flex-shrink-0 flex-col rounded-lg border border-border-subtle ${
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
                                <span className="text-xs font-semibold uppercase tracking-wide text-text-strong">
                                    {col.label}
                                </span>
                                <span className="rounded-full bg-surface-primary px-2 py-px text-xs font-semibold text-text-muted">
                                    {col.tasks.length}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-2 p-2" style={{ minHeight: '150px' }}>
                            {col.tasks.map((task) => {
                                const priority = getPriority(task.priority);
                                const isDone = col.status === 'done' || col.status === 'cancelled';

                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        className={`cursor-grab rounded-md border border-border-subtle bg-surface-primary p-2.5 shadow-sm transition-opacity hover:border-brand-muted hover:shadow-md active:cursor-grabbing ${
                                            dragging === task.id ? 'opacity-50' : ''
                                        } ${isDone ? 'opacity-65' : ''}`}
                                    >
                                        <Link
                                            href={`/projects/${project.id}/tasks/${task.id}`}
                                            className="line-clamp-2 text-sm font-medium leading-snug text-text-strong no-underline hover:text-brand-primary"
                                        >
                                            <span className="mr-1 text-xs font-semibold text-text-muted">
                                                {displayKey(project.key, task.number)}
                                            </span>
                                            {task.title}
                                        </Link>

                                        {/* Epic */}
                                        {shows('epic') && task.epic && (
                                            <div className="mt-1 flex items-center gap-1 text-xs text-text-subtle">
                                                <Layers className="h-2.5 w-2.5" />
                                                <span className="truncate">{task.epic.title}</span>
                                            </div>
                                        )}

                                        {/* Due date */}
                                        {shows('due_date') && task.due_date && (
                                            <div className="mt-1 text-xs text-text-muted">
                                                {formatDate(task.due_date)}
                                            </div>
                                        )}

                                        {/* Bottom row: priority + badges + assignee */}
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                {shows('priority') && (
                                                    <span
                                                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${priority.textClass}`}
                                                        style={{
                                                            backgroundColor:
                                                                'color-mix(in srgb, currentColor 12%, transparent)',
                                                        }}
                                                    >
                                                        {priority.label}
                                                    </span>
                                                )}
                                                {shows('phi') && task.data_classification === 'phi' && (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full border border-brand-primary px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-brand-hover">
                                                        <ShieldAlert className="h-2.5 w-2.5" />
                                                        PHI
                                                    </span>
                                                )}
                                                {shows('comments_count') && task.comments_count > 0 && (
                                                    <span className="inline-flex items-center gap-0.5 text-xs text-text-muted">
                                                        <MessageSquare className="h-2.5 w-2.5" />
                                                        {task.comments_count}
                                                    </span>
                                                )}
                                            </div>
                                            {shows('assignee') &&
                                                (task.assignee ? (
                                                    <Avatar name={task.assignee.name} size="sm" />
                                                ) : (
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-border-strong text-[8px] text-text-muted">
                                                        ?
                                                    </div>
                                                ))}
                                        </div>

                                        {/* Reporter */}
                                        {shows('reporter') && task.reporter && (
                                            <div className="mt-1 text-[10px] text-text-subtle">
                                                Zadavatel: {task.reporter.name}
                                            </div>
                                        )}
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
