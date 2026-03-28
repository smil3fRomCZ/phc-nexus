import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Spinner from '@/Components/Spinner';
import { validate, required, maxLength, pattern } from '@/utils/validate';
import { useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';

interface Props {
    statuses: Array<{ value: string; label: string }>;
}

const BREADCRUMBS: Breadcrumb[] = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'New Project' },
];

const KEY_RULES = [required(), pattern(/^[A-Z][A-Z0-9-]*$/, 'Must start with a letter (A-Z, 0-9, -)'), maxLength(10)];
const NAME_RULES = [required(), maxLength(255)];

export default function ProjectCreate({ statuses }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        key: '',
        description: '',
        status: 'draft',
        team_id: '',
        start_date: '',
        target_date: '',
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string | null>>({});

    function validateField(field: string, value: string, rules: typeof NAME_RULES) {
        const error = validate(value, rules);
        setClientErrors((prev) => ({ ...prev, [field]: error }));
        return error;
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        const nameErr = validateField('name', data.name, NAME_RULES);
        const keyErr = validateField('key', data.key, KEY_RULES);
        if (nameErr || keyErr) return;
        post('/projects');
    }

    return (
        <AppLayout title="New Project" breadcrumbs={BREADCRUMBS}>
            <div className="mx-auto max-w-2xl">
                <h1 className="mb-6 text-2xl font-bold leading-tight text-text-strong">New Project</h1>

                <form onSubmit={submit} className="space-y-5">
                    <Field label="Name *" error={errors.name ?? clientErrors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            onBlur={() => validateField('name', data.name, NAME_RULES)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </Field>

                    <Field label="Key * (e.g. NEXUS, PHC-01)" error={errors.key ?? clientErrors.key}>
                        <input
                            type="text"
                            value={data.key}
                            onChange={(e) => setData('key', e.target.value.toUpperCase())}
                            onBlur={() => validateField('key', data.key, KEY_RULES)}
                            maxLength={10}
                            className="mt-1 w-40 rounded-md border border-border-default bg-surface-primary px-3 py-2 font-mono text-base uppercase focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </Field>

                    <Field label="Description">
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </Field>

                    <Field label="Status">
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

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Start date">
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                            />
                        </Field>
                        <Field label="Target date" error={errors.target_date}>
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
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string | null; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-text-default">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        </div>
    );
}
