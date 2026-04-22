import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import FormInput from '@/Components/FormInput';
import FormSelect from '@/Components/FormSelect';
import FormTextarea from '@/Components/FormTextarea';
import { toDateInputValue } from '@/utils/formatDate';
import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Project {
    id: string;
    name: string;
    key: string;
    description: string | null;
    status: string;
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
    teams: Array<{ id: string; name: string }>;
    benefitTypes: BenefitTypeOption[];
}

export default function ProjectEdit({ project, statuses, teams = [], benefitTypes = [] }: Props) {
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
        team_id: project.team_id ?? '',
        benefit_type: project.benefit_type ?? '',
        benefit_amount: project.benefit_amount ?? '',
        benefit_note: project.benefit_note ?? '',
        start_date: toDateInputValue(project.start_date),
        target_date: toDateInputValue(project.target_date),
    });

    const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/projects/${project.id}`);
    }

    return (
        <AppLayout title={`Upravit ${project.name}`} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-2xl">
                <h1 className="mb-6 text-xl font-bold leading-tight text-text-strong md:text-2xl">
                    Upravit projekt <span className="font-mono text-text-muted">{project.key}</span>
                </h1>

                <form onSubmit={submit} className="space-y-5">
                    <FormInput
                        id="project-name"
                        label="Název"
                        required
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                    />

                    <FormTextarea
                        id="project-desc"
                        label="Popis"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={3}
                    />

                    <FormSelect
                        id="project-team"
                        label="Tým"
                        value={data.team_id}
                        onChange={(e) => setData('team_id', e.target.value)}
                        options={teamOptions}
                        placeholder="Bez týmu"
                    />

                    <FormSelect
                        id="project-status"
                        label="Stav"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        options={statuses}
                    />

                    <FormSelect
                        id="project-benefit"
                        label="Přínos"
                        value={data.benefit_type}
                        onChange={(e) => {
                            setData((prev) => ({
                                ...prev,
                                benefit_type: e.target.value,
                                benefit_amount: '',
                                benefit_note: '',
                            }));
                        }}
                        options={benefitTypes.map((b) => ({ value: b.value, label: b.label }))}
                        placeholder="Bez přínosu"
                    />

                    {data.benefit_type && benefitTypes.find((b) => b.value === data.benefit_type)?.hasMoney && (
                        <FormInput
                            id="project-benefit-amount"
                            label="Částka (Kč)"
                            type="number"
                            value={data.benefit_amount}
                            onChange={(e) => setData('benefit_amount', e.target.value)}
                            placeholder="0"
                            error={errors.benefit_amount}
                        />
                    )}

                    {data.benefit_type && !benefitTypes.find((b) => b.value === data.benefit_type)?.hasMoney && (
                        <FormTextarea
                            id="project-benefit-note"
                            label="Odůvodnění"
                            value={data.benefit_note}
                            onChange={(e) => setData('benefit_note', e.target.value)}
                            rows={2}
                            placeholder="Textové odůvodnění přínosu..."
                            error={errors.benefit_note}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            id="project-start-date"
                            label="Datum zahájení"
                            type="date"
                            value={data.start_date}
                            onChange={(e) => setData('start_date', e.target.value)}
                        />
                        <FormInput
                            id="project-target-date"
                            label="Cílové datum"
                            type="date"
                            value={data.target_date}
                            onChange={(e) => setData('target_date', e.target.value)}
                            error={errors.target_date}
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <Button type="submit" loading={processing}>
                            Uložit změny
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.visit(`/projects/${project.id}`)}
                        >
                            Zrušit
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
