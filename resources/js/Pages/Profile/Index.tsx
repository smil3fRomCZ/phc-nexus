import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import Button from '@/Components/Button';
import ConfirmModal from '@/Components/ConfirmModal';
import FormInput from '@/Components/FormInput';
import FormTextarea from '@/Components/FormTextarea';
import Modal from '@/Components/Modal';
import PersonChip from '@/Components/PersonChip';
import StatusBadge from '@/Components/StatusBadge';
import { USER_STATUS } from '@/constants/status';
import { router } from '@inertiajs/react';
import { Camera, Mail, Shield, Trash2, Upload, Users, Calendar, Save, X } from 'lucide-react';
import { useRef, useState } from 'react';
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
    avatar_url: string | null;
    avatar_path: string | null;
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

function getAvatarSrc(user: UserProfile): string | null {
    if (user.avatar_path) return `/storage/${user.avatar_path}`;
    if (user.avatar_url) return user.avatar_url;
    return null;
}

export default function ProfileIndex({ user, directReports }: Props) {
    const [form, setForm] = useState({
        job_title: user.job_title ?? '',
        phone: user.phone ?? '',
        bio: user.bio ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [avatarModal, setAvatarModal] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const avatarSrc = getAvatarSrc(user);

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

    function handleAvatarUpload(file: File) {
        setUploading(true);
        router.post(
            '/profile/avatar',
            { avatar: file },
            {
                forceFormData: true,
                onFinish: () => {
                    setUploading(false);
                    setAvatarModal(false);
                },
            },
        );
    }

    function handleAvatarRemove() {
        router.delete('/profile/avatar', {
            onSuccess: () => {
                setShowRemoveConfirm(false);
                setAvatarModal(false);
            },
        });
    }

    return (
        <AppLayout title="Můj profil" breadcrumbs={BREADCRUMBS}>
            <div className="max-w-screen-sm">
                <h1 className="mb-6 text-xl font-bold text-text-strong md:text-2xl">Můj profil</h1>

                {/* Header card */}
                <div className="rounded-lg border border-border-subtle bg-surface-primary">
                    <div className="flex items-center gap-4 border-b border-border-subtle px-6 py-5">
                        <div className="relative">
                            <Avatar name={user.name} size="xl" avatarUrl={avatarSrc} />
                            <button
                                type="button"
                                onClick={() => setAvatarModal(true)}
                                className="absolute -right-0.5 -bottom-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-border-default bg-surface-primary shadow-sm transition-colors hover:bg-surface-hover"
                            >
                                <Camera className="h-3.5 w-3.5 text-text-muted" />
                            </button>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold text-text-strong">{user.name}</h2>
                            {user.job_title && <p className="text-sm text-text-muted">{user.job_title}</p>}
                        </div>
                        <StatusBadge statusMap={USER_STATUS} value={user.status} />
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

            {/* Avatar edit modal */}
            <Modal open={avatarModal} onClose={() => setAvatarModal(false)} showClose={false}>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-strong">Změnit profilový obrázek</h2>
                    <button
                        onClick={() => setAvatarModal(false)}
                        className="rounded p-2 text-text-muted hover:bg-surface-hover"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mb-5 flex flex-col items-center gap-3">
                    <Avatar name={user.name} size="xl" avatarUrl={avatarSrc} />
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-text-subtle">
                        {user.avatar_path ? 'Vlastní obrázek' : user.avatar_url ? 'Z Google účtu' : 'Iniciály'}
                    </span>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                    }}
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-4 flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border-default p-6 transition-colors hover:border-brand-primary hover:bg-brand-soft"
                >
                    <Upload className="h-6 w-6 text-text-subtle" />
                    <span className="text-sm text-text-muted">Klikněte nebo přetáhněte obrázek</span>
                    <span className="text-[0.6875rem] text-text-subtle">
                        JPG, PNG nebo WebP · Max 2 MB · Min 128×128 px
                    </span>
                </button>

                <div className="flex gap-2">
                    {user.avatar_path && (
                        <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            onClick={() => setShowRemoveConfirm(true)}
                        >
                            Odstranit
                        </Button>
                    )}
                </div>
            </Modal>

            <ConfirmModal
                open={showRemoveConfirm}
                variant="danger"
                title="Odstranit avatar"
                message="Opravdu chcete odstranit profilový obrázek? Bude zobrazen Google avatar nebo iniciály."
                confirmLabel="Odstranit"
                onConfirm={handleAvatarRemove}
                onCancel={() => setShowRemoveConfirm(false)}
            />
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
