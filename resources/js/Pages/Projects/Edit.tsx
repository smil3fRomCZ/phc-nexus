import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Project {
    id: string;
    name: string;
    key: string;
    description: string | null;
    status: string;
    team_id: string | null;
    start_date: string | null;
    target_date: string | null;
}

interface Props {
    project: Project;
    statuses: Array<{ value: string; label: string }>;
}

export default function ProjectEdit({ project, statuses }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: project.name,
        description: project.description ?? '',
        status: project.status,
        team_id: project.team_id ?? '',
        start_date: project.start_date ?? '',
        target_date: project.target_date ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/projects/${project.id}`);
    }

    return (
        <AppLayout title={`Upravit ${project.name}`}>
            <div className="mx-auto max-w-2xl">
                <h2 className="mb-6 text-xl font-semibold text-text-strong">
                    Upravit projekt <span className="font-mono text-text-muted">{project.key}</span>
                </h2>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-default">Název *</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                        />
                        {errors.name && <p className="mt-1 text-xs text-status-danger">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-default">Popis</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-default">Status</label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="mt-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                        >
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-default">Datum začátku</label>
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-default">Cílové datum</label>
                            <input
                                type="date"
                                value={data.target_date}
                                onChange={(e) => setData('target_date', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                            />
                            {errors.target_date && <p className="mt-1 text-xs text-status-danger">{errors.target_date}</p>}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-brand-primary px-6 py-2 text-sm font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                        >
                            Uložit změny
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
