import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import FormInput from '@/Components/FormInput';
import FormTextarea from '@/Components/FormTextarea';
import PersonChip from '@/Components/PersonChip';
import { router } from '@inertiajs/react';
import { Mail, Shield, Users, Calendar, Save } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/utils/formatDate';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    system_role: string;
    status: string;
    team: { id: string; name: string } | null;
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

interface Props {
    user: UserProfile;
    directReports: DirectReport[];
}

const ROLE_LABELS: Record<string, string> = {
    executive: 'Executive',
    project_manager: 'Project Manager',
    team_member: 'Team Member',
    service_desk_agent: 'Service Desk',
    reader: 'Reader',
};

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Můj profil' }];

export default function ProfileIndex({ user, directReports }: Props) {
    const [form, setForm] = useState({
        job_title: user.job_title ?? '',
        phone: user.phone ?? '',
        bio: user.bio ?? '',
    });
    const [saving, setSaving] = useState(false);

    const hasChanges =
        form.job_title !== (user.job_title ?? '') || form.phone !== (user.phone ?? '') || form.bio !== (user.bio ?? '');

    function handleSave() {
        setSaving(true);
        router.patch(
            '/profile',
            {
                job_title: form.job_title || null,
                phone: form.phone || null,
                bio: form.bio || null,
            },
            {
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <AppLayout title="Můj profil" breadcrumbs={BREADCRUMBS}>
            <div className="max-w-screen-sm">
                <h1 className="mb-6 text-xl font-bold text-text-strong md:text-2xl">Můj profil</h1>

                {/* Header card */}
                <div className="rounded-lg border border-border-subtle bg-surface-primary">
                    <div className="flex items-center gap-4 border-b border-border-subtle px-6 py-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-text-inverse">
                            {user.name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold text-text-strong">{user.name}</h2>
                            {user.job_title && <p className="text-sm text-text-muted">{user.job_title}</p>}
                        </div>
                        <span
                            className={`inline-flex rounded-full px-2 py-px text-xs font-semibold ${
                                user.status === 'active'
                                    ? 'bg-status-success-subtle text-status-success'
                                    : 'bg-status-danger-subtle text-status-danger'
                            }`}
                        >
                            {user.status === 'active' ? 'Aktivní' : 'Deaktivován'}
                        </span>
                    </div>

                    {/* Read-only details */}
                    <div className="divide-y divide-border-subtle">
                        <DetailRow icon={Mail} label="Email" value={user.email} />
                        <DetailRow
                            icon={Shield}
                            label="Role"
                            value={ROLE_LABELS[user.system_role] ?? user.system_role}
                        />
                        <DetailRow icon={Users} label="Tým" value={user.team?.name ?? '—'} />
                        <DetailRow icon={Calendar} label="Účet vytvořen" value={formatDate(user.created_at)} />
                    </div>
                </div>

                {/* Editable profile fields */}
                <div className="mt-6 rounded-lg border border-border-subtle bg-surface-primary px-6 py-5">
                    <h2 className="mb-4 text-base font-semibold text-text-strong">Osobní údaje</h2>
                    <div className="space-y-4">
                        <FormInput
                            id="profile-job-title"
                            label="Pozice"
                            value={form.job_title}
                            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                            placeholder="např. Head of Operations"
                        />
                        <FormInput
                            id="profile-phone"
                            label="Telefon"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+420 ..."
                        />
                        <FormTextarea
                            id="profile-bio"
                            label="Bio"
                            rows={3}
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            placeholder="Krátký popis role, zodpovědnosti..."
                        />
                    </div>
                    {hasChanges && (
                        <div className="mt-4 flex justify-end">
                            <Button icon={<Save className="h-4 w-4" />} loading={saving} onClick={handleSave}>
                                Uložit
                            </Button>
                        </div>
                    )}
                </div>

                {/* Direct reports */}
                {directReports.length > 0 && (
                    <div className="mt-6 rounded-lg border border-border-subtle bg-surface-primary px-6 py-5">
                        <h2 className="mb-3 text-base font-semibold text-text-strong">
                            Podřízení ({directReports.length})
                        </h2>
                        <div className="space-y-2">
                            {directReports.map((dr) => (
                                <div
                                    key={dr.id}
                                    className="flex items-center gap-3 rounded-md bg-surface-secondary px-3 py-2"
                                >
                                    <PersonChip name={dr.name} detail={dr.job_title ?? undefined} size="md" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 px-6 py-3">
            <Icon className="h-4 w-4 flex-shrink-0 text-text-muted" />
            <span className="w-28 text-sm text-text-muted">{label}</span>
            <span className="text-sm font-medium text-text-strong">{value}</span>
        </div>
    );
}
