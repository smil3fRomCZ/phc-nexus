import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import { COLUMN_COLORS } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import { displayKey } from '@/utils/displayKey';
import { formatDate } from '@/utils/formatDate';
import { Link, router, useForm } from '@inertiajs/react';
import { MessageSquare, Plus, ShieldAlert, Settings2, Layers, Columns3, Trash2 } from 'lucide-react';
import ProjectTabs from '@/Components/ProjectTabs';
import ConfirmModal from '@/Components/ConfirmModal';
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
    id: string | null;
    status: string;
    label: string;
    color: string | null;
    tasks: Task[];
}

interface BoardColumnConfig {
    id: string;
    name: string;
    status_key: string;
    color: string | null;
    position: number;
}

interface StatusOption {
    value: string;
    label: string;
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
    boardColumnsConfig: BoardColumnConfig[];
    canManageColumns: boolean;
    statuses: StatusOption[];
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
    boardColumnsConfig = [],
    canManageColumns = false,
    statuses = [],
    members = [],
    epics = [],
    filters = {},
    boardSettings,
}: Props) {
    const [columns, setColumns] = useState(initialColumns);
    const [configOpen, setConfigOpen] = useState(false);
    const [newColName, setNewColName] = useState('');
    const [newColStatus, setNewColStatus] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState<string | null>(null);
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

    function csrfHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
            Accept: 'application/json',
        };
    }

    function addColumn() {
        if (!newColName || !newColStatus) return;
        fetch(`/projects/${project.id}/board-columns`, {
            method: 'POST',
            headers: csrfHeaders(),
            body: JSON.stringify({ name: newColName, status_key: newColStatus }),
        }).then((res) => {
            if (res.ok) {
                setNewColName('');
                setNewColStatus('');
                router.reload();
            }
        });
    }

    function updateColumn(id: string, data: Record<string, unknown>) {
        fetch(`/projects/${project.id}/board-columns/${id}`, {
            method: 'PUT',
            headers: csrfHeaders(),
            body: JSON.stringify(data),
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    function deleteColumn(id: string) {
        fetch(`/projects/${project.id}/board-columns/${id}`, {
            method: 'DELETE',
            headers: csrfHeaders(),
        }).then((res) => {
            if (res.ok) router.reload();
        });
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

        const snapshot = columns;

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
                setColumns(snapshot);
                const data = await res.json().catch(() => null);
                setModalMessage(data?.error ?? 'Změna stavu se nezdařila.');
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

                {/* Column config button (owner/PM only) */}
                {canManageColumns && (
                    <button
                        onClick={() => setConfigOpen(true)}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-hover"
                    >
                        <Columns3 className="h-3.5 w-3.5" />
                        Sloupce
                    </button>
                )}

                {/* Settings popover */}
                <div ref={settingsRef} className={`relative ${!canManageColumns ? 'ml-auto' : ''}`}>
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

                <button
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-1.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
                >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Přidat úkol
                </button>
            </div>

            {/* Board columns */}
            <div className="flex gap-3 overflow-x-auto pb-4">
                {columns.map((col) => (
                    <div
                        key={col.status}
                        className={`flex w-64 flex-shrink-0 flex-col overflow-hidden rounded-lg border border-border-subtle ${
                            dropTarget === col.status && !col.color ? 'ring-2 ring-brand-primary' : ''
                        }`}
                        style={
                            dropTarget === col.status && col.color ? { boxShadow: `0 0 0 2px ${col.color}` } : undefined
                        }
                        onDragOver={(e) => handleDragOver(e, col.status)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.status)}
                    >
                        <div
                            className={`rounded-t-lg px-3 py-2 ${!col.color ? (COLUMN_COLORS[col.status] ?? 'bg-surface-secondary') : ''}`}
                            style={col.color ? { backgroundColor: col.color } : undefined}
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

            <ConfirmModal
                open={!!modalMessage}
                variant="warning"
                title="Změna stavu blokována"
                message={modalMessage ?? ''}
                onConfirm={() => setModalMessage(null)}
            />

            {/* Column config modal */}
            {configOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg rounded-lg border border-border-subtle bg-surface-primary p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-strong">
                                <Columns3 className="h-4 w-4" />
                                Nastavení sloupců
                            </h2>
                            <button
                                onClick={() => setConfigOpen(false)}
                                className="rounded p-1 text-text-muted hover:bg-surface-hover"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="mb-4 text-xs text-text-muted">
                            Upravte názvy a barvy sloupců. Smazáním sloupce se úkoly přesunou do předchozího.
                        </p>

                        <div className="mb-4 space-y-2">
                            {boardColumnsConfig.map((col) => (
                                <div
                                    key={col.id}
                                    className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface-secondary px-3 py-2"
                                >
                                    <input
                                        type="color"
                                        value={col.color ?? '#97a0af'}
                                        onChange={(e) => updateColumn(col.id, { color: e.target.value })}
                                        className="h-6 w-6 cursor-pointer rounded border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        defaultValue={col.name}
                                        onBlur={(e) => {
                                            if (e.target.value !== col.name) {
                                                updateColumn(col.id, { name: e.target.value });
                                            }
                                        }}
                                        className="flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-text-strong hover:border-border-default focus:border-border-focus focus:outline-none"
                                    />
                                    <span className="font-mono text-xs text-text-subtle">{col.status_key}</span>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Smazat sloupec "${col.name}"? Úkoly budou přesunuty.`)) {
                                                deleteColumn(col.id);
                                            }
                                        }}
                                        className="rounded p-1 text-text-subtle transition-colors hover:bg-status-danger-subtle hover:text-status-danger"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                            {boardColumnsConfig.length === 0 && (
                                <p className="text-sm text-text-muted">
                                    Žádné vlastní sloupce. Přidejte první pro přepsání výchozího rozložení.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newColName}
                                onChange={(e) => setNewColName(e.target.value)}
                                placeholder="Název sloupce..."
                                className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            />
                            <select
                                value={newColStatus}
                                onChange={(e) => setNewColStatus(e.target.value)}
                                className="rounded-md border border-border-default bg-surface-primary px-2 py-1.5 text-sm"
                            >
                                <option value="">Status...</option>
                                {statuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={addColumn}
                                disabled={!newColName || !newColStatus}
                                className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                            >
                                + Přidat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task create modal */}
            {createOpen && (
                <TaskCreateDialog
                    projectId={project.id}
                    members={members}
                    epics={epics}
                    onClose={() => setCreateOpen(false)}
                />
            )}
        </AppLayout>
    );
}

function TaskCreateDialog({
    projectId,
    members,
    epics,
    onClose,
}: {
    projectId: string;
    members: Member[];
    epics: EpicOption[];
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'backlog',
        assignee_id: '',
        epic_id: '',
        due_date: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/projects/${projectId}/tasks`, {
            onSuccess: () => {
                onClose();
                router.reload();
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg border border-border-subtle bg-surface-primary p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-strong">Nový úkol</h2>
                    <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-hover">
                        ✕
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                            Název *
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Co je potřeba udělat..."
                            autoFocus
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                        {errors.title && <p className="mt-1 text-xs text-status-danger">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                            Popis
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            placeholder="Volitelný popis..."
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Priorita
                            </label>
                            <select
                                value={data.priority}
                                onChange={(e) => setData('priority', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                            >
                                <option value="low">Nízká</option>
                                <option value="medium">Střední</option>
                                <option value="high">Vysoká</option>
                                <option value="urgent">Urgentní</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Řešitel
                            </label>
                            <select
                                value={data.assignee_id}
                                onChange={(e) => setData('assignee_id', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                            >
                                <option value="">Nepřiřazeno</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Epic
                            </label>
                            <select
                                value={data.epic_id}
                                onChange={(e) => setData('epic_id', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                            >
                                <option value="">Bez epicu</option>
                                {epics.map((ep) => (
                                    <option key={ep.id} value={ep.id}>
                                        {ep.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Termín
                            </label>
                            <input
                                type="date"
                                value={data.due_date}
                                onChange={(e) => setData('due_date', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default transition-colors hover:bg-surface-hover"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.title}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                        >
                            Vytvořit úkol
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
