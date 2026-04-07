import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import EmptyState from '@/Components/EmptyState';
import FormInput from '@/Components/FormInput';
import FormSelect from '@/Components/FormSelect';
import StatusBadge from '@/Components/StatusBadge';

import { getPriority } from '@/constants/priority';
import { displayKey } from '@/utils/displayKey';
import { Link, useForm } from '@inertiajs/react';
import { Plus, ClipboardList } from 'lucide-react';
import type { FormEvent } from 'react';

interface Task {
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    assignee: { id: string; name: string } | null;
    reporter: { id: string; name: string } | null;
    sort_order: number;
    workflow_status: { id: string; name: string; color: string | null } | null;
}

interface Props {
    project: { id: string; name: string; key: string };
    epic?: { id: string; title: string };
    tasks: Task[];
}

export default function TasksIndex({ project, epic, tasks }: Props) {
    const storeUrl = epic ? `/projects/${project.id}/epics/${epic.id}/tasks` : `/projects/${project.id}/tasks`;

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        status: 'backlog',
        priority: 'medium',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(storeUrl, { onSuccess: () => reset(), preserveScroll: true });
    }

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        ...(epic
            ? [
                  { label: 'Epic', href: `/projects/${project.id}/epics` },
                  { label: epic.title, href: `/projects/${project.id}/epics/${epic.id}` },
                  { label: 'Úkoly' },
              ]
            : [{ label: 'Úkoly' }]),
    ];

    return (
        <AppLayout title={`${project.key} — Úkoly`} breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold leading-tight text-text-strong">
                    {epic ? `Úkoly — ${epic.title}` : 'Nezařazené úkoly'}
                </h1>
            </div>
            {!epic && (
                <p className="mb-4 text-sm text-text-muted">Úkoly, které zatím nejsou přiřazeny žádnému epicu.</p>
            )}

            {/* Quick add */}
            <form onSubmit={submit} className="mb-6 flex items-end gap-2">
                <FormInput
                    id="quick-title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Název nového úkolu..."
                    error={errors.title}
                    wrapperClassName="flex-1"
                />
                <FormSelect
                    id="quick-priority"
                    value={data.priority}
                    onChange={(e) => setData('priority', e.target.value)}
                    options={[
                        { value: 'low', label: 'Nízká' },
                        { value: 'medium', label: 'Střední' },
                        { value: 'high', label: 'Vysoká' },
                        { value: 'urgent', label: 'Urgentní' },
                    ]}
                />
                <Button
                    type="submit"
                    disabled={processing || !data.title}
                    icon={<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
                >
                    Přidat
                </Button>
            </form>

            {/* Task list */}
            <div className="space-y-2">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-primary px-5 py-3 transition-colors hover:bg-brand-soft"
                    >
                        <div className="flex items-center gap-3">
                            <StatusBadge
                                label={task.workflow_status?.name ?? task.status}
                                color={task.workflow_status?.color ?? null}
                            />
                            <Link
                                href={`/projects/${project.id}/tasks/${task.id}`}
                                className="text-base font-medium text-text-strong no-underline hover:text-brand-primary"
                            >
                                <span className="mr-1.5 text-xs font-semibold text-text-muted">
                                    {displayKey(project.key, task.number)}
                                </span>
                                {task.title}
                            </Link>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className={getPriority(task.priority).textClass}>
                                {getPriority(task.priority).label}
                            </span>
                            <span className="text-text-muted">{task.assignee?.name ?? 'Nepřiřazeno'}</span>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && <EmptyState icon={ClipboardList} message="Zatím žádné úkoly. Přidejte první." />}
            </div>
        </AppLayout>
    );
}
