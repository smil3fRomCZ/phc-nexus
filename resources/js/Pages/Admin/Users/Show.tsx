import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import Button from '@/Components/Button';
import ConfirmModal from '@/Components/ConfirmModal';
import FormInput from '@/Components/FormInput';
import FormSelect from '@/Components/FormSelect';
import FormTextarea from '@/Components/FormTextarea';
import StatusBadge from '@/Components/StatusBadge';
import { USER_STATUS } from '@/constants/status';
import { router } from '@inertiajs/react';
import { Ban, CheckCircle, Mail, Briefcase, Phone, Users, Calendar, Save } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/utils/formatDate';

interface UserDetail {
    id: string;
    name: string;
    email: string;
    system_role: string;
    status: string;
    team: { id: string; name: string } | null;
    team_id: string | null;
    job_title: string | null;
    phone: string | null;
    bio: string | null;
    capacity_h_week: string | null;
    created_at: string;
}

interface DirectReport {
    id: string;
    name: string;
    email: string;
    system_role: string;
    status: string;
    job_title: string | null;
    team: { id: string; name: string } | null;
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
    user: UserDetail;
    directReports: DirectReport[];
    teams: TeamOption[];
    roles: SelectOption[];
    statuses: SelectOption[];
    can: { edit: boolean; deactivate: boolean };
}

export default function UserShow({ user, directReports, teams, roles, statuses, can }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Administrace' },
        { label: 'Uživatelé', href: '/admin/users' },
        { label: user.name },
    ];

    const [form, setForm] = useState({
        system_role: user.system_role,
        team_id: user.team_id ?? '',
        capacity_h_week: user.capacity_h_week ?? '',
        job_title: user.job_title ?? '',
        phone: user.phone ?? '',
        bio: user.bio ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [showDeactivate, setShowDeactivate] = useState(false);

    const hasChanges =
        form.system_role !== user.system_role ||
        form.team_id !== (user.team_id ?? '') ||
        form.capacity_h_week !== (user.capacity_h_week ?? '') ||
        form.job_title !== (user.job_title ?? '') ||
        form.phone !== (user.phone ?? '') ||
        form.bio !== (user.bio ?? '');

    function handleSave() {
        setSaving(true);
        router.patch(
            `/admin/users/${user.id}`,
            {
                system_role: form.system_role,
                team_id: form.team_id || null,
                capacity_h_week: form.capacity_h_week || null,
                job_title: form.job_title || null,
                phone: form.phone || null,
                bio: form.bio || null,
            },
            {
                onFinish: () => setSaving(false),
            },
        );
    }

    function handleToggleStatus() {
        if (user.status === 'deactivated') {
            router.post(`/admin/users/${user.id}/activate`);
        } else {
            setShowDeactivate(true);
        }
    }

    const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

    return (
        <AppLayout title={user.name} breadcrumbs={breadcrumbs}>
            <div className="max-w-screen-md">
                {/* Header card */}
                <div className="mb-6 rounded-lg border border-border-subtle bg-surface-primary">
                    <div className="flex items-center gap-5 px-6 py-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-text-inverse">
                            {user.name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold text-text-strong">{user.name}</h1>
                            <p className="text-sm text-text-muted">{user.email}</p>
                            {user.job_title && <p className="mt-0.5 text-sm text-text-default">{user.job_title}</p>}
                        </div>
                        <StatusBadge statusMap={USER_STATUS} value={user.status} />
                    </div>

                    {/* Info rows */}
                    <div className="divide-y divide-border-subtle border-t border-border-subtle">
                        <InfoRow icon={Mail} label="Email" value={user.email} />
                        <InfoRow icon={Briefcase} label="Pozice" value={user.job_title ?? '—'} />
                        <InfoRow icon={Phone} label="Telefon" value={user.phone ?? '—'} />
                        <InfoRow icon={Users} label="Tým" value={user.team?.name ?? '—'} />
                        <InfoRow icon={Calendar} label="Vytvořen" value={formatDate(user.created_at)} />
                    </div>
                </div>

                {/* Editable section — only for executives */}
                {can.edit && (
                    <div className="mb-6 rounded-lg border border-border-subtle bg-surface-primary px-6 py-5">
                        <h2 className="mb-4 text-base font-semibold text-text-strong">Správa uživatele</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormSelect
                                id="user-role"
                                label="Role"
                                value={form.system_role}
                                onChange={(e) => setForm({ ...form, system_role: e.target.value })}
                                options={roles}
                            />
                            <FormSelect
                                id="user-team"
                                label="Tým"
                                value={form.team_id}
                                onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                                options={teamOptions}
                                placeholder="— bez týmu —"
                            />
                            <FormInput
                                id="user-capacity"
                                label="Kapacita (h/týden)"
                                type="number"
                                min={0}
                                max={168}
                                step={0.5}
                                value={form.capacity_h_week}
                                onChange={(e) => setForm({ ...form, capacity_h_week: e.target.value })}
                            />
                            <FormInput
                                id="user-job-title"
                                label="Pozice"
                                value={form.job_title}
                                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                            />
                            <FormInput
                                id="user-phone"
                                label="Telefon"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                            <FormTextarea
                                id="user-bio"
                                label="Bio"
                                rows={3}
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                wrapperClassName="sm:col-span-2"
                            />
                        </div>
                        {hasChanges && (
                            <div className="mt-4 flex justify-end">
                                <Button icon={<Save className="h-4 w-4" />} loading={saving} onClick={handleSave}>
                                    Uložit změny
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Bio display (read-only if not editable) */}
                {!can.edit && user.bio && (
                    <div className="mb-6 rounded-lg border border-border-subtle bg-surface-primary px-6 py-5">
                        <h2 className="mb-2 text-sm font-semibold text-text-subtle">Bio</h2>
                        <p className="text-sm text-text-default whitespace-pre-wrap">{user.bio}</p>
                    </div>
                )}

                {/* Direct reports */}
                {directReports.length > 0 && (
                    <div className="mb-6 rounded-lg border border-border-subtle bg-surface-primary px-6 py-5">
                        <h2 className="mb-3 text-base font-semibold text-text-strong">
                            Podřízení ({directReports.length})
                        </h2>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {directReports.map((dr) => (
                                <div
                                    key={dr.id}
                                    className="flex items-center gap-3 rounded-md bg-surface-secondary px-3 py-2 cursor-pointer hover:bg-brand-soft transition-colors"
                                    onClick={() => router.get(`/admin/users/${dr.id}`)}
                                >
                                    <Avatar name={dr.name} size="md" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-text-strong truncate">{dr.name}</p>
                                        <p className="text-xs text-text-muted truncate">
                                            {dr.job_title ?? roles.find((r) => r.value === dr.system_role)?.label}
                                            {dr.team && ` · ${dr.team.name}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status actions */}
                {can.deactivate && (
                    <div className="rounded-lg border border-border-subtle bg-surface-primary px-6 py-5">
                        {user.status === 'deactivated' ? (
                            <Button
                                variant="secondary"
                                icon={<CheckCircle className="h-4 w-4" />}
                                onClick={handleToggleStatus}
                            >
                                Aktivovat uživatele
                            </Button>
                        ) : (
                            <Button variant="danger" icon={<Ban className="h-4 w-4" />} onClick={handleToggleStatus}>
                                Deaktivovat uživatele
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <ConfirmModal
                open={showDeactivate}
                variant="warning"
                title="Deaktivovat uživatele"
                message={`Opravdu chcete deaktivovat uživatele ${user.name}?`}
                confirmLabel="Deaktivovat"
                onConfirm={() => {
                    setShowDeactivate(false);
                    router.post(`/admin/users/${user.id}/deactivate`);
                }}
                onCancel={() => setShowDeactivate(false)}
            />
        </AppLayout>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 px-6 py-3">
            <Icon className="h-4 w-4 flex-shrink-0 text-text-muted" />
            <span className="w-28 text-sm text-text-muted">{label}</span>
            <span className="text-sm font-medium text-text-strong">{value}</span>
        </div>
    );
}
