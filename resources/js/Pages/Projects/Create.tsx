import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Spinner from '@/Components/Spinner';
import { validate, required, maxLength, pattern } from '@/utils/validate';
import { useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface BenefitTypeOption {
    value: string;
    label: string;
    hasMoney: boolean;
}

interface ProjectTypeOption {
    value: string;
    label: string;
    description: string;
    icon: string;
    hasLeadDeveloper: boolean;
}

interface Props {
    projectTypes: ProjectTypeOption[];
    existingKeys: string[];
    classifications: Array<{ value: string; label: string }>;
    teams: Array<{ id: string; name: string }>;
    benefitTypes: BenefitTypeOption[];
}

const BREADCRUMBS: Breadcrumb[] = [
    { label: 'Domů', href: '/' },
    { label: 'Projekty', href: '/projects' },
    { label: 'Nový projekt' },
];

const KEY_RULES = [required(), pattern(/^[A-Z][A-Z0-9-]*$/, 'Musí začínat písmenem (A-Z, 0-9, -)'), maxLength(10)];
const NAME_RULES = [required(), maxLength(255)];

function generateKey(name: string, existingKeys: string[]): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    let base = '';

    if (words.length >= 3) {
        base = words
            .slice(0, 3)
            .map((w) => w[0])
            .join('');
    } else if (words.length === 2) {
        base = words[0][0] + words[1].slice(0, 2);
    } else if (words.length === 1) {
        base = words[0].slice(0, 3);
    }

    base = base.toUpperCase().replace(/[^A-Z]/g, '');
    if (base.length < 2) return base;
    if (base.length > 3) base = base.slice(0, 3);

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

export default function ProjectCreate({
    projectTypes = [],
    existingKeys,
    classifications = DEFAULT_CLASSIFICATIONS,
    teams = [],
    benefitTypes = [],
}: Props) {
    const [step, setStep] = useState<'type' | 'form'>('type');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        key: '',
        description: '',
        project_type: '',
        data_classification: 'non_phi',
        status: 'draft',
        team_id: '',
        benefit_type: '',
        benefit_amount: '',
        benefit_note: '',
        start_date: '',
        target_date: '',
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string | null>>({});
    const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

    const selectedType = projectTypes.find((t) => t.value === data.project_type);

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

    function selectType(value: string) {
        setData('project_type', value);
        setStep('form');
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        const nameErr = validateField('name', data.name, NAME_RULES);
        const keyErr = validateField('key', data.key, KEY_RULES);
        if (nameErr || keyErr) return;
        post('/projects');
    }

    if (step === 'type') {
        return (
            <AppLayout title="Nový projekt" breadcrumbs={BREADCRUMBS}>
                <div className="mx-auto max-w-3xl">
                    <h1 className="mb-2 text-xl md:text-2xl font-bold leading-tight text-text-strong">Nový projekt</h1>
                    <p className="mb-6 text-sm text-text-muted">
                        Vyberte typ projektu. Určuje výchozí workflow a dostupná pole.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {projectTypes.map((pt) => (
                            <button
                                key={pt.value}
                                onClick={() => selectType(pt.value)}
                                className="flex flex-col items-start gap-2 rounded-lg border-2 border-border-subtle bg-surface-primary p-5 text-left transition-all hover:border-brand-primary hover:shadow-md"
                            >
                                <span className="text-2xl">{pt.icon}</span>
                                <span className="text-base font-semibold text-text-strong">{pt.label}</span>
                                <span className="text-sm text-text-muted">{pt.description}</span>
                                {pt.hasLeadDeveloper && (
                                    <span className="mt-1 rounded bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-primary">
                                        Lead Developer
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Nový projekt" breadcrumbs={BREADCRUMBS}>
            <div className="mx-auto max-w-2xl">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => setStep('type')}
                        className="rounded-md border border-border-default p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-default"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold leading-tight text-text-strong">Nový projekt</h1>
                        {selectedType && (
                            <p className="text-sm text-text-muted">
                                {selectedType.icon} {selectedType.label}
                            </p>
                        )}
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <Field label="Název *" error={errors.name ?? clientErrors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            onBlur={() => validateField('name', data.name, NAME_RULES)}
                            autoFocus
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
