import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import FormInput from '@/Components/FormInput';
import FormSelect from '@/Components/FormSelect';
import FormTextarea from '@/Components/FormTextarea';
import Modal from '@/Components/Modal';
import { Link, useForm } from '@inertiajs/react';
import { GitBranch, Plus, Shield, X } from 'lucide-react';
import { useState } from 'react';

interface Template {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
    category: string;
    version: number;
    statuses_count: number;
    transitions_count: number;
    projects_count: number;
    author: { id: string; name: string } | null;
    published_at: string | null;
    created_at: string;
}

interface Props {
    templates: Template[];
}

const CATEGORY_LABELS: Record<string, string> = {
    software: 'Software',
    task_management: 'Správa úkolů',
    approval: 'Schvalování',
    custom: 'Vlastní',
};

export default function WorkflowTemplates({ templates }: Props) {
    const [createOpen, setCreateOpen] = useState(false);

    const breadcrumbs: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Šablony workflow' }];

    return (
        <AppLayout title="Šablony workflow" breadcrumbs={breadcrumbs}>
            <div className="max-w-screen-xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-text-strong md:text-2xl">Šablony workflow</h1>
                        <p className="mt-1 text-sm text-text-muted">
                            Vytvářejte a spravujte workflow šablony použitelné napříč projekty
                        </p>
                    </div>
                    <Button
                        icon={<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
                        onClick={() => setCreateOpen(true)}
                    >
                        Vytvořit šablonu
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <Link
                            key={template.id}
                            href={`/workflow-templates/${template.id}`}
                            className="group rounded-lg border border-border-subtle bg-surface-primary p-4 no-underline transition-all hover:border-brand-muted hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="h-4 w-4 text-brand-primary" />
                                    <h3 className="text-sm font-semibold text-text-strong group-hover:text-brand-primary">
                                        {template.name}
                                    </h3>
                                </div>
                                {template.is_system && (
                                    <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                                        <Shield className="h-2.5 w-2.5" />
                                        Systémová
                                    </span>
                                )}
                            </div>

                            {template.description && (
                                <p className="mt-2 text-xs text-text-muted line-clamp-2">{template.description}</p>
                            )}

                            <div className="mt-3 flex items-center gap-3 text-xs text-text-subtle">
                                <span className="rounded bg-surface-secondary px-1.5 py-0.5 font-medium">
                                    {CATEGORY_LABELS[template.category] ?? template.category}
                                </span>
                                <span>{template.statuses_count} stavů</span>
                                <span>{template.transitions_count} přechodů</span>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                                <span>Použito v {template.projects_count} projektech</span>
                                {template.author && <span>{template.author.name}</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {createOpen && <CreateTemplateDialog onClose={() => setCreateOpen(false)} />}
        </AppLayout>
    );
}

function CreateTemplateDialog({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        category: 'custom',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/workflow-templates', { onSuccess: onClose });
    }

    return (
        <Modal open onClose={onClose} size="max-w-md" showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Nová workflow šablona</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <form onSubmit={submit} className="space-y-3">
                <FormInput
                    id="tpl-name"
                    label="Název"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    autoFocus
                    error={errors.name}
                />
                <FormTextarea
                    id="tpl-desc"
                    label="Popis"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={2}
                />
                <FormSelect
                    id="tpl-cat"
                    label="Kategorie"
                    value={data.category}
                    onChange={(e) => setData('category', e.target.value)}
                    options={[
                        { value: 'software', label: 'Software' },
                        { value: 'task_management', label: 'Správa úkolů' },
                        { value: 'approval', label: 'Schvalování' },
                        { value: 'custom', label: 'Vlastní' },
                    ]}
                />
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Zrušit
                    </Button>
                    <Button type="submit" disabled={processing || !data.name} loading={processing}>
                        Vytvořit
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
