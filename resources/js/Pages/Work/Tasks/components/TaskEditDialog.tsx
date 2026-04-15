import Modal from '@/Components/Modal';
import RichTextEditor from '@/Components/RichTextEditor';
import SearchableSelect from '@/Components/SearchableSelect';
import { toDateInputValue } from '@/utils/formatDate';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import EditField from './EditField';
import type { EpicOption, Member, SelectOption, Task } from './types';

export default function TaskEditDialog({
    project,
    task,
    members,
    statuses,
    priorities,
    epics,
    onClose,
}: {
    project: { id: string };
    task: Task;
    members: Member[];
    statuses: SelectOption[];
    priorities: SelectOption[];
    epics: EpicOption[];
    onClose: () => void;
}) {
    const { data, setData, put, processing, errors, isDirty } = useForm({
        title: task.title,
        description: task.description ?? '',
        workflow_status_id: task.workflow_status?.id ?? '',
        priority: task.priority,
        assignee_id: task.assignee?.id ?? '',
        reporter_id: task.reporter?.id ?? '',
        epic_id: task.epic?.id ?? '',
        start_date: toDateInputValue(task.start_date),
        due_date: toDateInputValue(task.due_date),
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/projects/${project.id}/tasks/${task.id}`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <Modal
            open
            onClose={onClose}
            size="max-w-lg"
            isDirty={isDirty}
            closeConfirmMessage="Máte rozpracované změny v úkolu. Opravdu chcete zavřít?"
        >
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Upravit úkol</h2>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <EditField label="Název *" error={errors.title}>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </EditField>

                <EditField label="Popis" error={errors.description}>
                    <div className="mt-1">
                        <RichTextEditor
                            content={data.description}
                            onChange={(html) => setData('description', html)}
                            placeholder="Popis úkolu..."
                        />
                    </div>
                </EditField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditField label="Stav" error={errors.workflow_status_id}>
                        <select
                            value={data.workflow_status_id}
                            onChange={(e) => setData('workflow_status_id', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </EditField>

                    <EditField label="Priorita" error={errors.priority}>
                        <select
                            value={data.priority}
                            onChange={(e) => setData('priority', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            {priorities.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </EditField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <SearchableSelect
                            variant="form"
                            label="Řešitel"
                            value={data.assignee_id}
                            onChange={(v) => setData('assignee_id', v)}
                            placeholder="Nepřiřazeno"
                            options={members.map((m) => ({ value: m.id, label: m.name }))}
                        />
                        {errors.assignee_id && <p className="mt-1 text-xs text-status-danger">{errors.assignee_id}</p>}
                    </div>
                    <div>
                        <SearchableSelect
                            variant="form"
                            label="Zadavatel"
                            value={data.reporter_id}
                            onChange={(v) => setData('reporter_id', v)}
                            placeholder="—"
                            options={members.map((m) => ({ value: m.id, label: m.name }))}
                        />
                        {errors.reporter_id && <p className="mt-1 text-xs text-status-danger">{errors.reporter_id}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <SearchableSelect
                            variant="form"
                            label="Epic"
                            value={data.epic_id}
                            onChange={(v) => setData('epic_id', v)}
                            placeholder="Bez epicu"
                            options={epics.map((ep) => ({ value: ep.id, label: ep.title }))}
                        />
                        {errors.epic_id && <p className="mt-1 text-xs text-status-danger">{errors.epic_id}</p>}
                    </div>

                    <EditField label="Termín" error={errors.due_date}>
                        <input
                            type="date"
                            value={data.due_date}
                            onChange={(e) => setData('due_date', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </EditField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditField label="Začátek" error={errors.start_date}>
                        <input
                            type="date"
                            value={data.start_date}
                            onChange={(e) => setData('start_date', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </EditField>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
                    >
                        Zrušit
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                    >
                        Uložit změny
                    </button>
                </div>
            </form>
        </Modal>
    );
}
