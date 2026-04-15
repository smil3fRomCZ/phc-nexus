import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import EditField from './EditField';
import type { Member } from './types';

export default function RequestApprovalDialog({
    projectId,
    taskId,
    members,
    onClose,
}: {
    projectId: string;
    taskId: string;
    members: Member[];
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, isDirty } = useForm<{
        task_id: string;
        approver_ids: string[];
        description: string;
        expires_at: string;
    }>({
        task_id: taskId,
        approver_ids: [],
        description: '',
        expires_at: '',
    });

    function toggleApprover(id: string) {
        setData(
            'approver_ids',
            data.approver_ids.includes(id) ? data.approver_ids.filter((a) => a !== id) : [...data.approver_ids, id],
        );
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/projects/${projectId}/approvals`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <Modal
            open
            onClose={onClose}
            size="max-w-lg"
            isDirty={isDirty}
            closeConfirmMessage="Máte rozpracovanou žádost o schválení. Opravdu chcete zavřít?"
        >
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Žádost o schválení</h2>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <EditField label="Popis" error={errors.description}>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={2}
                        placeholder="Co potřebuje schválení?"
                        className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </EditField>

                <div>
                    <label className="block text-xs font-medium text-text-default">Schvalovatelé *</label>
                    {errors.approver_ids && <p className="mt-1 text-xs text-status-danger">{errors.approver_ids}</p>}
                    <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border-default p-2">
                        {members.map((m) => (
                            <label
                                key={m.id}
                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-hover"
                            >
                                <input
                                    type="checkbox"
                                    checked={data.approver_ids.includes(m.id)}
                                    onChange={() => toggleApprover(m.id)}
                                    className="rounded border-border-default"
                                />
                                <span className="text-text-default">{m.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <EditField label="Platnost do" error={errors.expires_at}>
                    <input
                        type="datetime-local"
                        value={data.expires_at}
                        onChange={(e) => setData('expires_at', e.target.value)}
                        className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </EditField>

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
                        disabled={processing || data.approver_ids.length === 0}
                        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                    >
                        Odeslat žádost
                    </button>
                </div>
            </form>
        </Modal>
    );
}
