import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import Button from '@/Components/Button';
import ConfirmModal from '@/Components/ConfirmModal';
import EmptyState from '@/Components/EmptyState';
import FormInput from '@/Components/FormInput';
import FormSelect from '@/Components/FormSelect';
import FormTextarea from '@/Components/FormTextarea';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import { Crown, Pencil, Trash2, UserPlus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';

interface Member {
    id: string;
    name: string;
    email: string;
    system_role: string;
    status: string;
    job_title: string | null;
}

interface Team {
    id: string;
    name: string;
    description: string | null;
    division_id: string;
    division: { id: string; name: string };
    team_lead: { id: string; name: string } | null;
    team_lead_id: string | null;
    members: Member[];
}

interface UserOption {
    id: string;
    name: string;
}

interface Props {
    team: Team;
    users: UserOption[];
    can: { editTeam: boolean; deleteTeam: boolean; manageMembers: boolean };
}

const ROLE_LABELS: Record<string, string> = {
    executive: 'Executive',
    project_manager: 'Project Manager',
    team_member: 'Team Member',
    service_desk_agent: 'Service Desk',
    reader: 'Reader',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-status-info-subtle text-status-info',
    invited: 'bg-status-warning-subtle text-status-warning',
    deactivated: 'bg-status-neutral-subtle text-status-neutral',
};

export default function TeamShow({ team, users, can }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Administrace' },
        { label: 'Organizace', href: '/admin/organization' },
        { label: team.division.name, href: `/admin/organization/divisions/${team.division.id}` },
        { label: team.name },
    ];

    const [editModal, setEditModal] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [addMemberId, setAddMemberId] = useState('');
    const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

    const available = users.filter((u) => !team.members.some((m) => m.id === u.id));
    const memberOptions = available.map((u) => ({ value: u.id, label: u.name }));

    function addMember() {
        if (!addMemberId) return;
        router.post(
            `/admin/teams/${team.id}/members`,
            { user_id: addMemberId },
            {
                onSuccess: () => setAddMemberId(''),
            },
        );
    }

    return (
        <AppLayout title={team.name} breadcrumbs={breadcrumbs}>
            <PageHeader
                title={team.name}
                actions={
                    <div className="flex items-center gap-2">
                        {can.editTeam && (
                            <Button variant="ghost" size="sm" onClick={() => setEditModal(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                        {can.deleteTeam && (
                            <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Team info */}
            <div className="mb-6 rounded-lg border border-border-subtle bg-surface-primary px-6 py-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Divize</span>
                        <p className="mt-0.5 text-sm text-text-default">{team.division.name}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                            Team Lead
                        </span>
                        <p className="mt-0.5 text-sm text-text-default">{team.team_lead?.name ?? '—'}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Popis</span>
                        <p className="mt-0.5 text-sm text-text-default">{team.description ?? '—'}</p>
                    </div>
                </div>
            </div>

            {/* Add member */}
            {can.manageMembers && available.length > 0 && (
                <div className="mb-4 flex items-end gap-2">
                    <FormSelect
                        id="add-member"
                        label="Přidat člena"
                        value={addMemberId}
                        onChange={(e) => setAddMemberId(e.target.value)}
                        options={memberOptions}
                        placeholder="Vyberte uživatele..."
                        wrapperClassName="w-64"
                    />
                    <Button icon={<UserPlus className="h-4 w-4" />} disabled={!addMemberId} onClick={addMember}>
                        Přidat
                    </Button>
                </div>
            )}

            {/* Members table */}
            <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Jméno
                            </th>
                            <th className="bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Email
                            </th>
                            <th className="bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Pozice
                            </th>
                            <th className="bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Role
                            </th>
                            <th className="bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Stav
                            </th>
                            {can.manageMembers && (
                                <th className="bg-surface-secondary px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Akce
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {team.members.map((member) => (
                            <tr key={member.id} className="transition-colors hover:bg-brand-soft">
                                <td className="border-b border-border-subtle px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <Avatar name={member.name} size="md" />
                                        <span className="text-sm font-medium text-text-strong">{member.name}</span>
                                        {team.team_lead?.id === member.id && (
                                            <span className="flex items-center gap-0.5 rounded-full bg-status-warning-subtle px-1.5 py-px text-[0.65rem] font-medium text-status-warning">
                                                <Crown className="h-3 w-3" />
                                                Lead
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                    {member.email}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-default">
                                    {member.job_title ?? '—'}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-default">
                                    {ROLE_LABELS[member.system_role] ?? member.system_role}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3">
                                    <span
                                        className={`inline-flex rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${STATUS_COLORS[member.status] ?? 'bg-status-neutral-subtle text-status-neutral'}`}
                                    >
                                        {member.status === 'active'
                                            ? 'Aktivní'
                                            : member.status === 'invited'
                                              ? 'Pozvaný'
                                              : 'Deaktivovaný'}
                                    </span>
                                </td>
                                {can.manageMembers && (
                                    <td className="border-b border-border-subtle px-5 py-3 text-right">
                                        {team.team_lead?.id !== member.id && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setRemoveTarget({ id: member.id, name: member.name })}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {team.members.length === 0 && (
                            <EmptyState colSpan={can.manageMembers ? 6 : 5} message="Žádní členové v tomto týmu." />
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit team modal */}
            {editModal && <EditTeamModal team={team} users={users} onClose={() => setEditModal(false)} />}

            {/* Delete team confirm */}
            <ConfirmModal
                open={showDelete}
                variant="danger"
                title="Smazat tým"
                message={`Opravdu chcete smazat tým „${team.name}"?`}
                confirmLabel="Smazat"
                onConfirm={() => {
                    router.delete(`/admin/teams/${team.id}`);
                    setShowDelete(false);
                }}
                onCancel={() => setShowDelete(false)}
            />

            {/* Remove member confirm */}
            <ConfirmModal
                open={!!removeTarget}
                variant="warning"
                title="Odebrat člena"
                message={`Opravdu chcete odebrat uživatele ${removeTarget?.name} z týmu?`}
                confirmLabel="Odebrat"
                onConfirm={() => {
                    if (removeTarget) {
                        router.delete(`/admin/teams/${team.id}/members/${removeTarget.id}`);
                    }
                    setRemoveTarget(null);
                }}
                onCancel={() => setRemoveTarget(null)}
            />
        </AppLayout>
    );
}

function EditTeamModal({ team, users, onClose }: { team: Team; users: UserOption[]; onClose: () => void }) {
    const [name, setName] = useState(team.name);
    const [description, setDescription] = useState(team.description ?? '');
    const [teamLeadId, setTeamLeadId] = useState(team.team_lead_id ?? '');
    const [processing, setProcessing] = useState(false);

    const userOptions = users.map((u) => ({ value: u.id, label: u.name }));

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.put(
            `/admin/teams/${team.id}`,
            {
                name,
                description,
                division_id: team.division_id,
                team_lead_id: teamLeadId || null,
            },
            {
                onFinish: () => setProcessing(false),
                onSuccess: onClose,
            },
        );
    }

    return (
        <Modal open onClose={onClose} showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Upravit tým</h2>
                <button onClick={onClose} className="rounded p-2 text-text-muted hover:bg-surface-hover">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    id="team-name"
                    label="Název"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <FormTextarea
                    id="team-desc"
                    label="Popis"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <FormSelect
                    id="team-lead"
                    label="Team Lead"
                    value={teamLeadId}
                    onChange={(e) => setTeamLeadId(e.target.value)}
                    options={userOptions}
                    placeholder="— žádný —"
                />
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Zrušit
                    </Button>
                    <Button type="submit" loading={processing}>
                        Uložit
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
