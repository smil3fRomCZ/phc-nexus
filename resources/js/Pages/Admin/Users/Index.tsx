import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
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

interface Props {
    users: User[];
    filters: { search?: string; role?: string; status?: string };
    roles: SelectOption[];
    statuses: SelectOption[];
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Users' }];

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-status-info-subtle text-status-info',
    invited: 'bg-status-warning-subtle text-status-warning',
    deactivated: 'bg-status-neutral-subtle text-status-neutral',
};

export default function UsersIndex({ users, filters, roles, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [inviting, setInviting] = useState(false);

    function applyFilter(key: string, value: string) {
        const params = new URLSearchParams(window.location.search);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.get('/admin/users', Object.fromEntries(params), { preserveState: true });
    }

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    return (
        <AppLayout title="Users" breadcrumbs={BREADCRUMBS}>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">Users</h1>
                <button
                    onClick={() => setInviting(true)}
                    className="flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover"
                >
                    <UserPlus className="h-4 w-4" />
                    Invite User
                </button>
            </div>

            {inviting && <InviteDialog roles={roles} onClose={() => setInviting(false)} />}

            {/* Filters */}
            <div className="mb-6 flex gap-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email..."
                        className="w-64 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="rounded-md bg-brand-primary px-3 py-1.5 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover"
                    >
                        Search
                    </button>
                </form>
                <select
                    value={filters.role ?? ''}
                    onChange={(e) => applyFilter('role', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="">All roles</option>
                    {roles.map((r) => (
                        <option key={r.value} value={r.value}>
                            {r.label}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.status ?? ''}
                    onChange={(e) => applyFilter('status', e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                >
                    <option value="">All statuses</option>
                    {statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {['Name', 'Email', 'Role', 'Team', 'Status'].map((h) => (
                                <th
                                    key={h}
                                    className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="transition-colors hover:bg-brand-soft">
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
                                    <span
                                        className={`inline-flex rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${STATUS_COLORS[user.status] ?? 'bg-status-neutral-subtle text-status-neutral'}`}
                                    >
                                        {statuses.find((s) => s.value === user.status)?.label ?? user.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && <EmptyState colSpan={5} message="No users found." />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg border border-border-subtle bg-surface-primary p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-strong">Invite User</h2>
                    <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-hover">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-default">Email *</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="user@pearshealthcare.com"
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        />
                        {errors.email && <p className="mt-1 text-xs text-status-danger">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-default">Role</label>
                        <select
                            value={data.system_role}
                            onChange={(e) => setData('system_role', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            {roles.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                        {errors.system_role && <p className="mt-1 text-xs text-status-danger">{errors.system_role}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                        >
                            Send Invitation
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
