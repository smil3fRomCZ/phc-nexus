import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Spinner from '@/Components/Spinner';
import { validate, required, maxLength, pattern } from '@/utils/validate';
import { useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';

interface Props {
    existingKeys: string[];
    classifications: Array<{ value: string; label: string }>;
    teams: Array<{ id: string; name: string }>;
}

const BREADCRUMBS: Breadcrumb[] = [
    { label: 'Domů', href: '/' },
    { label: 'Projekty', href: '/projects' },
    { label: 'Nový projekt' },
];

const KEY_RULES = [required(), pattern(/^[A-Z][A-Z0-9-]*$/, 'Musí začínat písmenem (A-Z, 0-9, -)'), maxLength(10)];
const NAME_RULES = [required(), maxLength(255)];

/**
 * Generuje 3písmenný klíč z názvu projektu (JIRA styl).
 * "Datový sklad" → "DAS", "PHC Nexus" → "PHN"
 * Pokud koliduje s existujícími, přidá číslo: "DAS1", "DAS2"
 */
function generateKey(name: string, existingKeys: string[]): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    let base = '';

    if (words.length >= 3) {
        // 3+ slov: první písmeno z každého z prvních 3 slov
        base = words
            .slice(0, 3)
            .map((w) => w[0])
            .join('');
    } else if (words.length === 2) {
        // 2 slova: první písmeno z prvního + první dvě z druhého
        base = words[0][0] + words[1].slice(0, 2);
    } else if (words.length === 1) {
        // 1 slovo: první 3 písmena
        base = words[0].slice(0, 3);
    }

    base = base.toUpperCase().replace(/[^A-Z]/g, '');
    if (base.length < 2) return base;
    if (base.length > 3) base = base.slice(0, 3);

    // Zajistit unikátnost
    const existing = new Set(existingKeys.map((k) => k.toUpperCase()));
    if (!existing.has(base)) return base;

    for (let i = 1; i <= 99; i++) {
        const candidate = `${base}${i}`;
        if (!existing.has(candidate)) return candidate;
    }

    return base;
}

const DEFAULT_CLASSIFICATIONS = [
    { value: 'non_phi', label: 'Non-PHI' },
    { value: 'phi', label: 'PHI' },
    { value: 'unknown', label: 'Unknown' },
];

export default function ProjectCreate({ existingKeys, classifications = DEFAULT_CLASSIFICATIONS, teams = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        key: '',
        description: '',
        data_classification: 'non_phi',
        status: 'draft',
        team_id: '',
        start_date: '',
        target_date: '',
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string | null>>({});
    const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

    function validateField(field: string, value: string, rules: typeof NAME_RULES) {
        const error = validate(value, rules);
        setClientErrors((prev) => ({ ...prev, [field]: error }));
        return error;
    }

    function handleNameChange(name: string) {
        setData('name', name);
        if (!keyManuallyEdited) {
            const key = generateKey(name, existingKeys);
            setData((prev) => ({ ...prev, name, key }));
        }
    }

    function handleKeyChange(key: string) {
        setKeyManuallyEdited(true);
        setData('key', key.toUpperCase());
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        const nameErr = validateField('name', data.name, NAME_RULES);
        const keyErr = validateField('key', data.key, KEY_RULES);
        if (nameErr || keyErr) return;
        post('/projects');
    }

    return (
        <AppLayout title="Nový projekt" breadcrumbs={BREADCRUMBS}>
            <div className="mx-auto max-w-2xl">
                <h1 className="mb-6 text-2xl font-bold leading-tight text-text-strong">Nový projekt</h1>

                <form onSubmit={submit} className="space-y-5">
                    <Field label="Název *" error={errors.name ?? clientErrors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            onBlur={() => validateField('name', data.name, NAME_RULES)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </Field>

                    <Field label="Klíč * (generováno z názvu, lze upravit)" error={errors.key ?? clientErrors.key}>
                        <input
                            type="text"
                            value={data.key}
                            onChange={(e) => handleKeyChange(e.target.value)}
                            onBlur={() => validateField('key', data.key, KEY_RULES)}
                            maxLength={10}
                            className="mt-1 w-40 rounded-md border border-border-default bg-surface-primary px-3 py-2 font-mono text-base uppercase focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
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

                    <Field label="Popis">
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-base focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                    </Field>

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
                            Vytvořit projekt
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
