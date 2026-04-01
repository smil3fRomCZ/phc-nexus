import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Spinner from '@/Components/Spinner';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Project {
    id: string;
    name: string;
    key: string;
    description: string | null;
    status: string;
    data_classification: string;
    team_id: string | null;
    benefit_type: string | null;
    benefit_amount: string | null;
    benefit_note: string | null;
    start_date: string | null;
    target_date: string | null;
}

interface BenefitTypeOption {
    value: string;
    label: string;
    hasMoney: boolean;
}

interface Props {
    project: Project;
    statuses: Array<{ value: string; label: string }>;
    classifications: Array<{ value: string; label: string }>;
    teams: Array<{ id: string; name: string }>;
    benefitTypes: BenefitTypeOption[];
}

export default function ProjectEdit({ project, statuses, classifications, teams = [], benefitTypes = [] }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Upravit' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: project.name,
        description: project.description ?? '',
        status: project.status,
        data_classification: project.data_classification ?? 'non_phi',
        team_id: project.team_id ?? '',
        benefit_type: project.benefit_type ?? '',
        benefit_amount: project.benefit_amount ?? '',
        benefit_note: project.benefit_note ?? '',
        start_date: project.start_date ?? '',
        target_date: project.target_date ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/projects/${project.id}`);
    }

    return (
        <AppLayout title={`Upravit ${project.name}`} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-2xl">
                <h1 className="mb-6 text-xl md:text-2xl font-bold leading-tight text-text-strong">
                    Upravit projekt <span className="font-mono text-text-muted">{project.key}</span>
                </h1>

                <form onSubmit={submit} className="space-y-5">
                    <Field label="Název *" error={errors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </Field>

                    <Field label="Popis">
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </Field>

                    <Field label="Klasifikace dat">
                        <select
                            value={data.data_classification}
                            onChange={(e) => setData('data_classification', e.target.value)}
                            className="mt-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            {classifications.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Tým">
                        <select
                            value={data.team_id}
                            onChange={(e) => setData('team_id', e.target.value)}
                            className="mt-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            <option value="">Bez týmu</option>
                            {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Stav">
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="mt-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Přínos">
                        <select
                            value={data.benefit_type}
                            onChange={(e) => {
                                setData((prev) => ({
                                    ...prev,
                                    benefit_type: e.target.value,
                                    benefit_amount: '',
                                    benefit_note: '',
                                }));
                            }}
                            className="mt-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            <option value="">Bez přínosu</option>
                            {benefitTypes.map((b) => (
                                <option key={b.value} value={b.value}>
                                    {b.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {data.benefit_type && benefitTypes.find((b) => b.value === data.benefit_type)?.hasMoney && (
                        <Field label="Částka (Kč)" error={errors.benefit_amount}>
                            <input
                                type="number"
                                value={data.benefit_amount}
                                onChange={(e) => setData('benefit_amount', e.target.value)}
                                placeholder="0"
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            />
                        </Field>
                    )}

                    {data.benefit_type && !benefitTypes.find((b) => b.value === data.benefit_type)?.hasMoney && (
                        <Field label="Odůvodnění" error={errors.benefit_note}>
                            <textarea
                                value={data.benefit_note}
                                onChange={(e) => setData('benefit_note', e.target.value)}
                                rows={2}
                                placeholder="Textové odůvodnění přínosu..."
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            />
                        </Field>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Datum zahájení">
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            />
                        </Field>
                        <Field label="Cílové datum" error={errors.target_date}>
                            <input
                                type="date"
                                value={data.target_date}
                                onChange={(e) => setData('target_date', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            />
                        </Field>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                        >
                            {processing && <Spinner size="sm" />}
                            Uložit změny
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-text-default">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        </div>
    );
}
