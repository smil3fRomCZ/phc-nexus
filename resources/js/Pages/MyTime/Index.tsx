import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import FilterSelect from '@/Components/FilterSelect';
import Pagination from '@/Components/Pagination';
import type { PaginationLink } from '@/Components/Pagination';
import StatCard from '@/Components/StatCard';
import { formatDate } from '@/utils/formatDate';
import { Link, router } from '@inertiajs/react';
import { Clock } from 'lucide-react';

interface TimeEntry {
    id: string;
    date: string;
    hours: number;
    note: string | null;
    project: { id: string; name: string; key: string } | null;
    task: { id: string; title: string; number: number } | null;
    epic: { id: string; title: string } | null;
}

interface SelectOption {
    value: string;
    label: string;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
}

interface Props {
    entries: Paginated<TimeEntry>;
    totalHours: number;
    projects: SelectOption[];
    filters: { project_id?: string; date_from?: string; date_to?: string };
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Moje výkazy' }];

export default function MyTime({ entries, totalHours, projects, filters }: Props) {
    function applyFilter(key: string, value: string) {
        router.get('/my-time', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout title="Moje výkazy" breadcrumbs={BREADCRUMBS}>
            <div className="max-w-screen-xl space-y-5">
                <h1 className="text-xl font-bold text-text-strong md:text-2xl">Moje výkazy</h1>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard label="Celkem hodin" value={totalHours} icon={<Clock className="h-5 w-5" />} />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <FilterSelect
                        label="Projekt"
                        value={filters.project_id ?? ''}
                        onChange={(v) => applyFilter('project_id', v)}
                        options={projects}
                        placeholder="Všechny projekty"
                    />
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                            Od
                        </label>
                        <input
                            type="date"
                            value={filters.date_from ?? ''}
                            onChange={(e) => applyFilter('date_from', e.target.value)}
                            className="rounded border border-border-default bg-surface-primary px-2.5 py-1.5 text-xs focus:border-border-focus focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                            Do
                        </label>
                        <input
                            type="date"
                            value={filters.date_to ?? ''}
                            onChange={(e) => applyFilter('date_to', e.target.value)}
                            className="rounded border border-border-default bg-surface-primary px-2.5 py-1.5 text-xs focus:border-border-focus focus:outline-none"
                        />
                    </div>
                </div>

                {entries.data.length === 0 ? (
                    <EmptyState message="Žádné výkazy k zobrazení." />
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-surface-secondary px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                            Datum
                                        </th>
                                        <th className="bg-surface-secondary px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                            Projekt
                                        </th>
                                        <th className="bg-surface-secondary px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                            Úkol / Epic
                                        </th>
                                        <th className="bg-surface-secondary px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                            Hodiny
                                        </th>
                                        <th className="bg-surface-secondary px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                            Poznámka
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.data.map((entry) => (
                                        <tr key={entry.id} className="transition-colors hover:bg-brand-soft">
                                            <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-default">
                                                {formatDate(entry.date)}
                                            </td>
                                            <td className="border-b border-border-subtle px-4 py-2.5 text-sm">
                                                {entry.project ? (
                                                    <Link
                                                        href={`/projects/${entry.project.id}`}
                                                        className="font-medium text-text-default no-underline hover:text-brand-primary"
                                                    >
                                                        {entry.project.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-text-muted">&mdash;</span>
                                                )}
                                            </td>
                                            <td className="border-b border-border-subtle px-4 py-2.5 text-sm">
                                                {entry.task ? (
                                                    <Link
                                                        href={`/projects/${entry.project?.id}/tasks/${entry.task.id}`}
                                                        className="text-text-default no-underline hover:text-brand-primary"
                                                    >
                                                        <span className="font-semibold text-text-muted">
                                                            #{entry.task.number}
                                                        </span>{' '}
                                                        {entry.task.title}
                                                    </Link>
                                                ) : entry.epic ? (
                                                    <span className="text-text-muted">[Epic] {entry.epic.title}</span>
                                                ) : (
                                                    <span className="text-text-muted">&mdash;</span>
                                                )}
                                            </td>
                                            <td className="border-b border-border-subtle px-4 py-2.5 text-right text-sm font-semibold text-text-strong">
                                                {entry.hours}h
                                            </td>
                                            <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-muted">
                                                {entry.note ?? ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination links={entries.links} />
                    </>
                )}
            </div>
        </AppLayout>
    );
}
