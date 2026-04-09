import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import FormInput from '@/Components/FormInput';
import Modal from '@/Components/Modal';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';
import { formatDate } from '@/utils/formatDate';
import { Link, useForm } from '@inertiajs/react';
import { Dices, Plus, X } from 'lucide-react';
import { useState } from 'react';

interface Session {
    id: string;
    name: string;
    scale_type: string;
    status: string;
    rounds_count: number;
    creator: { id: string; name: string };
    created_at: string;
}

interface Props {
    project: { id: string; name: string; key: string; status: string };
    sessions: Session[];
}

export default function EstimationIndex({ project, sessions }: Props) {
    const [createOpen, setCreateOpen] = useState(false);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Estimation' },
    ];

    return (
        <AppLayout title={`${project.key} — Estimation`} breadcrumbs={breadcrumbs}>
            <div className="mb-4">
                <ProjectHeaderCompact project={project} />
            </div>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="estimation" />
            </div>

            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-strong">Estimation Sessions</h2>
                <Button icon={<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />} onClick={() => setCreateOpen(true)}>
                    Nová session
                </Button>
            </div>

            {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-primary py-16 text-center">
                    <Dices className="mb-3 h-10 w-10 text-text-subtle" />
                    <p className="text-sm font-semibold text-text-strong">Zatím žádné estimation sessions</p>
                    <p className="mt-1 text-xs text-text-muted">
                        Vytvořte session pro odhad story pointů s týmem pomocí Planning Poker
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <Link
                            key={session.id}
                            href={`/projects/${project.id}/estimation/${session.id}`}
                            className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-primary px-4 py-3 no-underline transition-colors hover:bg-surface-hover"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <Dices className="h-4 w-4 text-text-subtle" />
                                    <span className="text-sm font-semibold text-text-strong">{session.name}</span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                            session.status === 'active'
                                                ? 'bg-status-success-subtle text-status-success'
                                                : 'bg-surface-secondary text-text-muted'
                                        }`}
                                    >
                                        {session.status === 'active' ? 'Aktivní' : 'Dokončeno'}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-text-muted">
                                    {session.rounds_count} úkolů ·{' '}
                                    {session.scale_type === 'fibonacci' ? 'Fibonacci' : 'T-Shirt'} ·{' '}
                                    {session.creator.name} · {formatDate(session.created_at)}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {createOpen && <CreateSessionDialog projectId={project.id} onClose={() => setCreateOpen(false)} />}
        </AppLayout>
    );
}

interface TaskOption {
    id: string;
    number: number;
    title: string;
    workflow_status?: { id: string; name: string } | null;
}

function CreateSessionDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        scale_type: 'fibonacci',
        task_ids: [] as string[],
    });

    const [tasks, setTasks] = useState<TaskOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    function loadTasks() {
        if (loaded && !search && !statusFilter) return;
        setLoading(true);
        const params = new URLSearchParams({ format: 'json' });
        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);
        fetch(`/projects/${projectId}/tasks?${params}`)
            .then((res) => res.json())
            .then((json) => {
                setTasks(json.tasks ?? []);
                setLoaded(true);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }

    function onSearchChange(value: string) {
        setSearch(value);
        setLoading(true);
        const params = new URLSearchParams({ format: 'json' });
        if (value) params.append('search', value);
        if (statusFilter) params.append('status', statusFilter);
        fetch(`/projects/${projectId}/tasks?${params}`)
            .then((res) => res.json())
            .then((json) => { setTasks(json.tasks ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }

    function onStatusChange(value: string) {
        setStatusFilter(value);
        setLoading(true);
        const params = new URLSearchParams({ format: 'json' });
        if (search) params.append('search', search);
        if (value) params.append('status', value);
        fetch(`/projects/${projectId}/tasks?${params}`)
            .then((res) => res.json())
            .then((json) => { setTasks(json.tasks ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }

    const statuses = Array.from(
        new Map(tasks.filter((t) => t.workflow_status).map((t) => [t.workflow_status!.id, t.workflow_status!.name])),
        ([value, label]) => ({ value, label }),
    );

    function toggleTask(id: string) {
        setData(
            'task_ids',
            data.task_ids.includes(id) ? data.task_ids.filter((t) => t !== id) : [...data.task_ids, id],
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/projects/${projectId}/estimation`, { onSuccess: onClose });
    }

    return (
        <Modal open onClose={onClose} size="max-w-lg" showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Nová estimation session</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <FormInput
                    id="session-name"
                    label="Název session"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Např. Sprint 14 planning"
                    autoFocus
                    error={errors.name}
                />

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                        Škála
                    </label>
                    <div className="flex gap-2">
                        {[
                            { value: 'fibonacci', label: 'Fibonacci (1,2,3,5,8,13,21)' },
                            { value: 'tshirt', label: 'T-Shirt (XS–XL)' },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setData('scale_type', opt.value)}
                                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                                    data.scale_type === opt.value
                                        ? 'border-brand-primary bg-brand-soft text-brand-primary'
                                        : 'border-border-subtle bg-surface-primary text-text-muted hover:bg-surface-hover'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                        Úkoly k odhadu ({data.task_ids.length} vybráno)
                    </label>
                    <div className="mb-2 flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Hledat úkoly..."
                            className="flex-1 rounded border border-border-default bg-surface-primary px-2.5 py-1.5 text-xs focus:border-border-focus focus:outline-none"
                            onFocus={loadTasks}
                        />
                        {statuses.length > 0 && (
                            <select
                                value={statusFilter}
                                onChange={(e) => onStatusChange(e.target.value)}
                                className="rounded border border-border-default bg-surface-primary px-2 py-1.5 text-xs focus:border-border-focus focus:outline-none"
                            >
                                <option value="">Všechny stavy</option>
                                {statuses.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div
                        className="max-h-48 overflow-y-auto rounded-md border border-border-subtle"
                        onFocus={loadTasks}
                        onMouseEnter={loadTasks}
                    >
                        {loading && <p className="p-3 text-xs text-text-muted">Načítání...</p>}
                        {!loading && tasks.length === 0 && (
                            <p className="p-3 text-xs text-text-muted">
                                {loaded ? 'Žádné úkoly neodpovídají filtru' : 'Klikněte pro načtení úkolů'}
                            </p>
                        )}
                        {tasks.map((task) => (
                            <label
                                key={task.id}
                                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover"
                            >
                                <input
                                    type="checkbox"
                                    checked={data.task_ids.includes(task.id)}
                                    onChange={() => toggleTask(task.id)}
                                    className="accent-brand-primary"
                                />
                                <span className="text-xs font-semibold text-text-muted">#{task.number}</span>
                                <span className="truncate text-text-default">{task.title}</span>
                                {task.workflow_status && (
                                    <span className="ml-auto text-[10px] text-text-subtle">{task.workflow_status.name}</span>
                                )}
                            </label>
                        ))}
                    </div>
                    {errors.task_ids && <p className="mt-1 text-xs text-status-danger">{errors.task_ids}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Zrušit
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing || !data.name || data.task_ids.length === 0}
                        loading={processing}
                    >
                        Zahájit session
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
