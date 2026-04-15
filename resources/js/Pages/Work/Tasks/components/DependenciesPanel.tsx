import { Link, router } from '@inertiajs/react';
import { ChevronDown, Link2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { ProjectTask, Task } from './types';

function DependenciesPanel({
    project,
    task,
    projectTasks,
}: {
    project: { id: string };
    task: Task;
    projectTasks: ProjectTask[];
}) {
    const [addingType, setAddingType] = useState<'blocker' | 'blocking' | null>(null);
    const [selectedId, setSelectedId] = useState('');

    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    function addBlocker() {
        if (!selectedId) return;
        fetch(`/projects/${project.id}/tasks/${task.id}/dependencies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' },
            body: JSON.stringify({ blocker_id: selectedId }),
        }).then((res) => {
            if (res.ok) {
                setAddingType(null);
                setSelectedId('');
                router.reload();
            }
        });
    }

    function addBlocking() {
        if (!selectedId) return;
        fetch(`/projects/${project.id}/tasks/${task.id}/blocking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' },
            body: JSON.stringify({ blocked_id: selectedId }),
        }).then((res) => {
            if (res.ok) {
                setAddingType(null);
                setSelectedId('');
                router.reload();
            }
        });
    }

    function removeBlocker(blockerId: string) {
        fetch(`/projects/${project.id}/tasks/${task.id}/dependencies/${blockerId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' },
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    function removeBlocking(blockedId: string) {
        fetch(`/projects/${project.id}/tasks/${task.id}/blocking/${blockedId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' },
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    const existingIds = new Set([...task.blockers.map((b) => b.id), ...task.blocking.map((b) => b.id), task.id]);
    const available = projectTasks.filter((t) => !existingIds.has(t.id));

    return (
        <div className="space-y-2">
            {task.blockers.length > 0 && (
                <div>
                    <div className="mb-1 text-xs text-text-subtle">Blokováno</div>
                    {task.blockers.map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 py-0.5">
                            <Link2 className="h-3 w-3 flex-shrink-0 text-status-danger" />
                            <Link
                                href={`/projects/${b.project_id}/tasks/${b.id}`}
                                className="truncate text-xs text-text-default no-underline hover:text-brand-primary"
                            >
                                {b.title}
                            </Link>
                            <button
                                onClick={() => removeBlocker(b.id)}
                                className="ml-auto rounded p-1.5 text-text-subtle hover:bg-status-danger-subtle hover:text-status-danger"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {task.blocking.length > 0 && (
                <div>
                    <div className="mb-1 text-xs text-text-subtle">Blokuje</div>
                    {task.blocking.map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 py-0.5">
                            <Link2 className="h-3 w-3 flex-shrink-0 text-status-warning" />
                            <Link
                                href={`/projects/${b.project_id}/tasks/${b.id}`}
                                className="truncate text-xs text-text-default no-underline hover:text-brand-primary"
                            >
                                {b.title}
                            </Link>
                            <button
                                onClick={() => removeBlocking(b.id)}
                                className="ml-auto rounded p-1.5 text-text-subtle hover:bg-status-danger-subtle hover:text-status-danger"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {addingType ? (
                <div className="space-y-1">
                    <div className="text-xs font-medium text-text-subtle">
                        {addingType === 'blocker' ? 'Blokováno čím:' : 'Blokuje co:'}
                    </div>
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full rounded border border-border-default bg-surface-primary px-2 py-1 text-xs focus:border-border-focus focus:outline-none"
                    >
                        <option value="">Vyberte úkol...</option>
                        {available.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
                        ))}
                    </select>
                    <div className="flex gap-1">
                        <button
                            onClick={addingType === 'blocker' ? addBlocker : addBlocking}
                            disabled={!selectedId}
                            className="rounded bg-brand-primary px-2 py-1 text-xs text-text-inverse disabled:opacity-50"
                        >
                            Přidat
                        </button>
                        <button
                            onClick={() => {
                                setAddingType(null);
                                setSelectedId('');
                            }}
                            className="rounded px-1 py-1 text-xs text-text-muted hover:bg-surface-hover"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button
                        onClick={() => setAddingType('blocker')}
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-primary"
                    >
                        <Plus className="h-3 w-3" />
                        Je blokováno
                    </button>
                    <button
                        onClick={() => setAddingType('blocking')}
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-primary"
                    >
                        <Plus className="h-3 w-3" />
                        Blokuje
                    </button>
                </div>
            )}
        </div>
    );
}

export default function CollapsibleDependencies({
    project,
    task,
    projectTasks,
}: {
    project: { id: string };
    task: Task;
    projectTasks: ProjectTask[];
}) {
    const [open, setOpen] = useState(true);
    const total = task.blockers.length + task.blocking.length;

    return (
        <div className="overflow-hidden rounded-lg border border-border-subtle">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between bg-surface-secondary px-4 py-2.5"
            >
                <div className="flex items-center gap-2">
                    <ChevronDown
                        className={`h-3.5 w-3.5 text-text-subtle transition-transform ${open ? '' : '-rotate-90'}`}
                    />
                    <span className="text-sm font-semibold text-text-strong">Závislosti</span>
                    {total > 0 && (
                        <span
                            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                                task.blockers.length > 0
                                    ? 'bg-status-danger-subtle text-status-danger'
                                    : 'bg-border-subtle text-text-muted'
                            }`}
                        >
                            {total}
                        </span>
                    )}
                    {total === 0 && <span className="text-xs text-text-subtle">Žádné závislosti</span>}
                </div>
            </button>
            {open && (
                <div className="bg-surface-primary px-4 py-3">
                    <DependenciesPanel project={project} task={task} projectTasks={projectTasks} />
                </div>
            )}
        </div>
    );
}
