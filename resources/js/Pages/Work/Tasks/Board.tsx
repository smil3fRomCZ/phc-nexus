import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import BoardCard from '@/Components/BoardCard';
import type { BoardTask } from '@/Components/BoardCard';
import Button from '@/Components/Button';
import FilterSelect from '@/Components/FilterSelect';
import FormInput from '@/Components/FormInput';
import FormSelect from '@/Components/FormSelect';
import FormTextarea from '@/Components/FormTextarea';
import Popover from '@/Components/Popover';
import { COLUMN_COLORS } from '@/constants/status';
import { Link, router, useForm } from '@inertiajs/react';
import { Plus, Settings2, X } from 'lucide-react';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';
import ConfirmModal from '@/Components/ConfirmModal';
import Modal from '@/Components/Modal';
import { useFilterRouter } from '@/hooks/useFilterRouter';
import { useState, type DragEvent } from 'react';

interface Column {
    id: string | null;
    status: string;
    label: string;
    color: string | null;
    is_done?: boolean;
    is_cancelled?: boolean;
    tasks: BoardTask[];
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
    project: { id: string; name: string; key: string; status: string };
    columns: Column[];
    canManageColumns: boolean;
    members: Member[];
    epics: EpicOption[];
    filters: Record<string, string | undefined>;
    boardSettings: BoardSettings;
}

const CARD_FIELD_OPTIONS = [
    { value: 'status', label: 'Stav' },
    { value: 'priority', label: 'Priorita' },
    { value: 'assignee', label: 'Řešitel' },
    { value: 'epic', label: 'Epic' },
    { value: 'due_date', label: 'Termín' },
    { value: 'comments_count', label: 'Komentáře' },
    { value: 'phi', label: 'PHI' },
    { value: 'reporter', label: 'Zadavatel' },
    { value: 'story_points', label: 'Story Points' },
];

export default function TaskBoard({
    project,
    columns: initialColumns,
    canManageColumns = false,
    members = [],
    epics = [],
    filters = {},
    boardSettings,
}: Props) {
    const [columns, setColumns] = useState(initialColumns);
    const [createOpen, setCreateOpen] = useState(false);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState<string | null>(null);
    const [cardFields, setCardFields] = useState<string[]>(
        boardSettings?.card_fields ?? ['priority', 'assignee', 'comments_count'],
    );

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Kanban' },
    ];

    const applyFilter = useFilterRouter(`/projects/${project.id}/board`, filters, { replace: true });

    function toggleCardField(field: string) {
        const next = cardFields.includes(field) ? cardFields.filter((f) => f !== field) : [...cardFields, field];
        setCardFields(next);
        router.patch('/user/board-settings', { card_fields: next }, { preserveState: true, preserveScroll: true });
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

        let sourceTask: BoardTask | undefined;
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
            <div className="mb-4">
                <ProjectHeaderCompact project={project} />
            </div>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="board" />
            </div>

            {/* Filter + controls bar */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <FilterSelect
                    label="Řešitel"
                    value={filters.assignee_id ?? ''}
                    onChange={(v) => applyFilter('assignee_id', v)}
                    options={members.map((m) => ({ value: m.id, label: m.name }))}
                    placeholder="Všichni"
                />
                <FilterSelect
                    label="Epic"
                    value={filters.epic_id ?? ''}
                    onChange={(v) => applyFilter('epic_id', v)}
                    options={epics.map((e) => ({ value: e.id, label: e.title }))}
                    placeholder="Všechny"
                />

                {/* Settings popover */}
                <div className="relative ml-auto">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<Settings2 className="h-3.5 w-3.5" />}
                        onClick={() => setSettingsOpen(!settingsOpen)}
                    >
                        Nastavení
                    </Button>
                    <Popover open={settingsOpen} onClose={() => setSettingsOpen(false)} className="w-56 p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                            Viditelná pole na kartě
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
                        {canManageColumns && (
                            <>
                                <div className="my-2 border-t border-border-subtle" />
                                <Link
                                    href={`/projects/${project.id}/workflow`}
                                    className="flex items-center gap-2 rounded px-1 py-1.5 text-sm font-medium text-brand-primary no-underline hover:bg-brand-soft"
                                >
                                    Workflow editor
                                </Link>
                            </>
                        )}
                    </Popover>
                </div>

                <Button icon={<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />} onClick={() => setCreateOpen(true)}>
                    Přidat úkol
                </Button>
            </div>

            {/* Active filter chips */}
            {(filters.assignee_id || filters.epic_id) && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-muted">Filtry:</span>
                    {filters.assignee_id && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-primary">
                            {members.find((m) => m.id === filters.assignee_id)?.name ?? 'Řešitel'}
                            <button
                                onClick={() => applyFilter('assignee_id', '')}
                                className="rounded-full p-0.5 hover:bg-brand-primary/10"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {filters.epic_id && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-primary">
                            {epics.find((e) => e.id === filters.epic_id)?.title ?? 'Epic'}
                            <button
                                onClick={() => applyFilter('epic_id', '')}
                                className="rounded-full p-0.5 hover:bg-brand-primary/10"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            applyFilter('assignee_id', '');
                            applyFilter('epic_id', '');
                        }}
                    >
                        Zrušit vše
                    </Button>
                </div>
            )}

            {/* Board columns */}
            <div className="flex gap-3 overflow-x-auto pb-4">
                {columns.map((col) => (
                    <div
                        key={col.status}
                        className={`flex min-w-[14rem] flex-1 flex-col overflow-hidden rounded-lg border border-border-subtle ${
                            dropTarget === col.status && !col.color ? 'ring-2 ring-inset ring-brand-primary' : ''
                        }`}
                        style={
                            dropTarget === col.status && col.color
                                ? { boxShadow: `inset 0 0 0 2px ${col.color}` }
                                : undefined
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
                            {col.tasks.map((task) => (
                                <BoardCard
                                    key={task.id}
                                    task={task}
                                    projectId={project.id}
                                    projectKey={project.key}
                                    cardFields={cardFields}
                                    isDragging={dragging === task.id}
                                    isDone={!!(col.is_done || col.is_cancelled)}
                                    onDragStart={handleDragStart}
                                />
                            ))}
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
        <Modal open onClose={onClose} size="max-w-md" showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Nový úkol</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <form onSubmit={submit} className="space-y-3">
                <FormInput
                    id="task-title"
                    label="Název"
                    required
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Co je potřeba udělat..."
                    autoFocus
                    error={errors.title}
                />

                <FormTextarea
                    id="task-desc"
                    label="Popis"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={2}
                    placeholder="Volitelný popis..."
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormSelect
                        id="task-priority"
                        label="Priorita"
                        value={data.priority}
                        onChange={(e) => setData('priority', e.target.value)}
                        options={[
                            { value: 'low', label: 'Nízká' },
                            { value: 'medium', label: 'Střední' },
                            { value: 'high', label: 'Vysoká' },
                            { value: 'urgent', label: 'Urgentní' },
                        ]}
                    />
                    <FormSelect
                        id="task-assignee"
                        label="Řešitel"
                        value={data.assignee_id}
                        onChange={(e) => setData('assignee_id', e.target.value)}
                        options={members.map((m) => ({ value: m.id, label: m.name }))}
                        placeholder="Nepřiřazeno"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormSelect
                        id="task-epic"
                        label="Epic"
                        value={data.epic_id}
                        onChange={(e) => setData('epic_id', e.target.value)}
                        options={epics.map((ep) => ({ value: ep.id, label: ep.title }))}
                        placeholder="Bez epicu"
                    />
                    <FormInput
                        id="task-due-date"
                        label="Termín"
                        type="date"
                        value={data.due_date}
                        onChange={(e) => setData('due_date', e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Zrušit
                    </Button>
                    <Button type="submit" disabled={processing || !data.title} loading={processing}>
                        Vytvořit úkol
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
