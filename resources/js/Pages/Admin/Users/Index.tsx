import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import EmptyState from '@/Components/EmptyState';
import FilterBar from '@/Components/FilterBar';
import FilterSelect from '@/Components/FilterSelect';
import FormInput from '@/Components/FormInput';
import FormSelect from '@/Components/FormSelect';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import SortableHeader, { PlainHeader } from '@/Components/SortableHeader';
import StatusBadge from '@/Components/StatusBadge';
import { USER_STATUS } from '@/constants/status';
import { useFilterRouter } from '@/hooks/useFilterRouter';
import { router, useForm } from '@inertiajs/react';
import { UserPlus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    system_role: string;
    status: string;
    team: { id: string; name: string } | null;
    created_at: string;
}

interface SelectOption {
    value: string;
    label: string;
}

interface TeamOption {
    id: string;
    name: string;
}

interface Props {
    users: User[];
    filters: { search?: string; role?: string; status?: string; team_id?: string; sort?: string; dir?: string };
    roles: SelectOption[];
    statuses: SelectOption[];
    teams: TeamOption[];
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Administrace' }, { label: 'Uživatelé' }];

export default function UsersIndex({ users, filters, roles, statuses, teams }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [inviting, setInviting] = useState(false);

    const applyFilter = useFilterRouter('/admin/users');

    function applySort(field: string) {
        const dir = filters.sort === field && filters.dir !== 'desc' ? 'desc' : 'asc';
        router.get('/admin/users', { ...filters, sort: field, dir }, { replace: true });
    }

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    const teamOptions = [{ value: '_none', label: 'Bez týmu' }, ...teams.map((t) => ({ value: t.id, label: t.name }))];

    return (
        <AppLayout title="Uživatelé" breadcrumbs={BREADCRUMBS}>
            <PageHeader
                title="Uživatelé"
                actions={
                    <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setInviting(true)}>
                        Pozvat uživatele
                    </Button>
                }
            />

            {inviting && <InviteDialog roles={roles} onClose={() => setInviting(false)} />}

            <FilterBar>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <FormInput
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Hledat jméno nebo email..."
                        wrapperClassName="w-full sm:w-64"
                    />
                    <Button type="submit" size="md">
                        Hledat
                    </Button>
                </form>
                <FilterSelect
                    label="Role"
                    value={filters.role ?? ''}
                    onChange={(v) => applyFilter('role', v)}
                    options={roles}
                    placeholder="Všechny"
                />
                <FilterSelect
                    label="Stav"
                    value={filters.status ?? ''}
                    onChange={(v) => applyFilter('status', v)}
                    options={statuses}
                    placeholder="Všechny"
                />
                <FilterSelect
                    label="Tým"
                    value={filters.team_id ?? ''}
                    onChange={(v) => applyFilter('team_id', v)}
                    options={teamOptions}
                    placeholder="Všechny"
                />
            </FilterBar>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {[
                                { field: 'name', label: 'Jméno', sortable: true },
                                { field: 'email', label: 'Email', sortable: true },
                                { field: 'system_role', label: 'Role', sortable: true },
                                { field: 'team', label: 'Tým', sortable: false },
                                { field: 'status', label: 'Stav', sortable: true },
                            ].map((col) =>
                                col.sortable ? (
                                    <SortableHeader
                                        key={col.field}
                                        field={col.field}
                                        label={col.label}
                                        sortField={filters.sort}
                                        sortDir={filters.dir === 'desc' ? 'desc' : 'asc'}
                                        onSort={applySort}
                                    />
                                ) : (
                                    <PlainHeader key={col.field} label={col.label} />
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="cursor-pointer transition-colors hover:bg-brand-soft"
                                onClick={() => router.get(`/admin/users/${user.id}`)}
                            >
                                <td className="border-b border-border-subtle px-5 py-3 text-sm font-medium text-text-strong">
                                    {user.name}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                    {user.email}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-default">
                                    {roles.find((r) => r.value === user.system_role)?.label ?? user.system_role}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                    {user.team?.name ?? '\u2014'}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3">
                                    <StatusBadge statusMap={USER_STATUS} value={user.status} />
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && <EmptyState colSpan={5} message="Žádní uživatelé nenalezeni." />}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}

function InviteDialog({ roles, onClose }: { roles: SelectOption[]; onClose: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        system_role: 'team_member',
        team_id: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/invitations', { onSuccess: () => onClose() });
    }

    return (
        <Modal open onClose={onClose} showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Pozvat uživatele</h2>
                <button onClick={onClose} className="rounded p-2 text-text-muted hover:bg-surface-hover">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <FormInput
                    id="invite-email"
                    label="Email"
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="user@pearshealthcare.com"
                    error={errors.email}
                />

                <FormSelect
                    id="invite-role"
                    label="Role"
                    value={data.system_role}
                    onChange={(e) => setData('system_role', e.target.value)}
                    options={roles}
                    error={errors.system_role}
                />

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Zrušit
                    </Button>
                    <Button type="submit" loading={processing}>
                        Odeslat pozvánku
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
