import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface WorkflowStatus {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    position: number;
    is_initial: boolean;
    is_done: boolean;
    is_cancelled: boolean;
    allow_transition_from_any: boolean;
}

interface WorkflowTransition {
    id: string;
    from_status_id: string;
    to_status_id: string;
    from_status: { id: string; name: string };
    to_status: { id: string; name: string };
}

interface Props {
    project: { id: string; name: string; key: string };
    statuses: WorkflowStatus[];
    transitions: WorkflowTransition[];
}

function csrfHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        Accept: 'application/json',
    };
}

export default function Workflow({ project, statuses, transitions }: Props) {
    const [newName, setNewName] = useState('');
    const [newTransFrom, setNewTransFrom] = useState('');
    const [newTransTo, setNewTransTo] = useState('');

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Workflow' },
    ];

    function addStatus() {
        if (!newName) return;
        fetch(`/projects/${project.id}/workflow/statuses`, {
            method: 'POST',
            headers: csrfHeaders(),
            body: JSON.stringify({ name: newName }),
        }).then((res) => {
            if (res.ok) {
                setNewName('');
                router.reload();
            }
        });
    }

    function updateStatus(id: string, data: Record<string, unknown>) {
        fetch(`/projects/${project.id}/workflow/statuses/${id}`, {
            method: 'PUT',
            headers: csrfHeaders(),
            body: JSON.stringify(data),
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    function deleteStatus(id: string, name: string) {
        if (!confirm(`Smazat stav "${name}"? Úkoly budou přesunuty do předchozího stavu.`)) return;
        fetch(`/projects/${project.id}/workflow/statuses/${id}`, {
            method: 'DELETE',
            headers: csrfHeaders(),
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    function addTransition() {
        if (!newTransFrom || !newTransTo || newTransFrom === newTransTo) return;
        fetch(`/projects/${project.id}/workflow/transitions`, {
            method: 'POST',
            headers: csrfHeaders(),
            body: JSON.stringify({ from_status_id: newTransFrom, to_status_id: newTransTo }),
        }).then((res) => {
            if (res.ok) {
                setNewTransFrom('');
                setNewTransTo('');
                router.reload();
            }
        });
    }

    function deleteTransition(id: string) {
        fetch(`/projects/${project.id}/workflow/transitions/${id}`, {
            method: 'DELETE',
            headers: csrfHeaders(),
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    return (
        <AppLayout title={`${project.key} — Workflow`} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-strong">Workflow Editor</h1>
                    <span className="text-sm text-text-muted">
                        {statuses.length} stavů · {transitions.length} přechodů
                    </span>
                </div>

                {/* Statuses */}
                <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                    <h2 className="mb-1 text-base font-semibold text-text-strong">Stavy</h2>
                    <p className="mb-4 text-xs text-text-muted">
                        Definujte stavy, kterými úkoly procházejí. Pořadí určuje sloupce na Kanbanu.
                    </p>

                    <div className="space-y-2">
                        {statuses.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface-secondary px-3 py-2"
                            >
                                <input
                                    type="color"
                                    value={s.color ?? '#97a0af'}
                                    onChange={(e) => updateStatus(s.id, { color: e.target.value })}
                                    className="h-6 w-6 cursor-pointer rounded border-0 p-0"
                                />
                                <input
                                    type="text"
                                    defaultValue={s.name}
                                    onBlur={(e) => {
                                        if (e.target.value !== s.name) updateStatus(s.id, { name: e.target.value });
                                    }}
                                    className="flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-text-strong hover:border-border-default focus:border-border-focus focus:outline-none"
                                />
                                <span className="font-mono text-xs text-text-subtle">{s.slug}</span>
                                {s.is_initial && (
                                    <span className="rounded bg-status-info-subtle px-1.5 py-0.5 text-[10px] font-bold text-status-info">
                                        VÝCHOZÍ
                                    </span>
                                )}
                                {s.is_done && (
                                    <span className="rounded bg-status-success-subtle px-1.5 py-0.5 text-[10px] font-bold text-status-success">
                                        HOTOVO
                                    </span>
                                )}
                                {s.is_cancelled && (
                                    <span className="rounded bg-status-neutral-subtle px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
                                        ZRUŠENO
                                    </span>
                                )}
                                {s.allow_transition_from_any && (
                                    <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-hover">
                                        ODKUDKOLIV
                                    </span>
                                )}
                                <div className="flex gap-1">
                                    {!s.is_initial && (
                                        <button
                                            onClick={() => updateStatus(s.id, { is_initial: true })}
                                            className="rounded px-1.5 py-0.5 text-[10px] text-text-subtle hover:bg-status-info-subtle hover:text-status-info"
                                            title="Nastavit jako výchozí"
                                        >
                                            ★
                                        </button>
                                    )}
                                    <button
                                        onClick={() =>
                                            updateStatus(s.id, {
                                                allow_transition_from_any: !s.allow_transition_from_any,
                                            })
                                        }
                                        className={`rounded px-1.5 py-0.5 text-[10px] ${s.allow_transition_from_any ? 'bg-brand-soft text-brand-hover' : 'text-text-subtle hover:bg-brand-soft hover:text-brand-hover'}`}
                                        title="Přechod odkudkoliv"
                                    >
                                        ↞
                                    </button>
                                </div>
                                <button
                                    onClick={() => deleteStatus(s.id, s.name)}
                                    className="rounded p-1 text-text-subtle transition-colors hover:bg-status-danger-subtle hover:text-status-danger"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Název nového stavu..."
                            onKeyDown={(e) => e.key === 'Enter' && addStatus()}
                            className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                        <button
                            onClick={addStatus}
                            disabled={!newName}
                            className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                        >
                            <Plus className="mr-1 inline-block h-3 w-3" />
                            Přidat stav
                        </button>
                    </div>

                    <p className="mt-2 rounded-md bg-status-warning-subtle px-3 py-2 text-xs text-status-warning">
                        Smazáním stavu se úkoly automaticky přesunou do předchozího stavu. Stav označený jako VÝCHOZÍ se
                        použije pro nové úkoly.
                    </p>
                </div>

                {/* Transitions */}
                <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                    <h2 className="mb-1 text-base font-semibold text-text-strong">Přechody</h2>
                    <p className="mb-4 text-xs text-text-muted">
                        Definujte povolené přechody mezi stavy. Stavy s flagem "Odkudkoliv" jsou automaticky dostupné ze
                        všech stavů.
                    </p>

                    <div className="space-y-1">
                        {transitions.map((t) => (
                            <div
                                key={t.id}
                                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-surface-secondary"
                            >
                                <span className="font-medium text-text-strong">{t.from_status.name}</span>
                                <ArrowRight className="h-3.5 w-3.5 text-brand-primary" />
                                <span className="font-medium text-text-strong">{t.to_status.name}</span>
                                <button
                                    onClick={() => deleteTransition(t.id)}
                                    className="ml-auto rounded p-1 text-text-subtle transition-colors hover:bg-status-danger-subtle hover:text-status-danger"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        {transitions.length === 0 && (
                            <p className="text-sm text-text-muted">Žádné přechody. Přidejte první.</p>
                        )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <select
                            value={newTransFrom}
                            onChange={(e) => setNewTransFrom(e.target.value)}
                            className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                        >
                            <option value="">Z stavu...</option>
                            {statuses.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-text-subtle" />
                        <select
                            value={newTransTo}
                            onChange={(e) => setNewTransTo(e.target.value)}
                            className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                        >
                            <option value="">Do stavu...</option>
                            {statuses.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={addTransition}
                            disabled={!newTransFrom || !newTransTo || newTransFrom === newTransTo}
                            className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                        >
                            <Plus className="mr-1 inline-block h-3 w-3" />
                            Přidat
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
