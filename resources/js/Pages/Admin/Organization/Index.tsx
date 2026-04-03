import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import ConfirmModal from '@/Components/ConfirmModal';
import EmptyState from '@/Components/EmptyState';
import Modal from '@/Components/Modal';
import Avatar from '@/Components/Avatar';
import { Building2, Users, Crown, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';

interface UserOption {
    id: string;
    name: string;
}

interface Member {
    id: string;
    name: string;
    email: string;
    system_role: string;
    status: string;
}

interface Team {
    id: string;
    name: string;
    description: string | null;
    division_id: string;
    team_lead: { id: string; name: string } | null;
    team_lead_id: string | null;
    members: Member[];
}

interface Division {
    id: string;
    name: string;
    description: string | null;
    teams: Team[];
}

interface Props {
    divisions: Division[];
    users: UserOption[];
    can: { createDivision: boolean; createTeam: boolean };
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Administrace' }, { label: 'Organizace' }];

// ── Division Form Modal ──
function DivisionModal({ division, onClose }: { division?: Division; onClose: () => void }) {
    const [name, setName] = useState(division?.name ?? '');
    const [description, setDescription] = useState(division?.description ?? '');
    const [processing, setProcessing] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        if (division) {
            router.put(
                `/admin/divisions/${division.id}`,
                { name, description },
                { onFinish: () => setProcessing(false), onSuccess: onClose },
            );
        } else {
            router.post(
                '/admin/divisions',
                { name, description },
                { onFinish: () => setProcessing(false), onSuccess: onClose },
            );
        }
    }

    return (
        <Modal open onClose={onClose} showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">
                    {division ? 'Upravit divizi' : 'Nová divize'}
                </h2>
                <button onClick={onClose} className="rounded p-2 text-text-muted hover:bg-surface-hover">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="div-name" className="mb-1 block text-xs font-semibold text-text-subtle">
                        Název *
                    </label>
                    <input
                        id="div-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="div-desc" className="mb-1 block text-xs font-semibold text-text-subtle">
                        Popis
                    </label>
                    <textarea
                        id="div-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover"
                    >
                        Zrušit
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                    >
                        {division ? 'Uložit' : 'Vytvořit'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Team Form Modal ──
function TeamModal({
    team,
    divisions,
    users,
    defaultDivisionId,
    onClose,
}: {
    team?: Team;
    divisions: Division[];
    users: UserOption[];
    defaultDivisionId?: string;
    onClose: () => void;
}) {
    const [name, setName] = useState(team?.name ?? '');
    const [description, setDescription] = useState(team?.description ?? '');
    const [divisionId, setDivisionId] = useState(team?.division_id ?? defaultDivisionId ?? divisions[0]?.id ?? '');
    const [teamLeadId, setTeamLeadId] = useState(team?.team_lead_id ?? '');
    const [processing, setProcessing] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        const data = { name, description, division_id: divisionId, team_lead_id: teamLeadId || null };
        if (team) {
            router.put(`/admin/teams/${team.id}`, data, { onFinish: () => setProcessing(false), onSuccess: onClose });
        } else {
            router.post('/admin/teams', data, { onFinish: () => setProcessing(false), onSuccess: onClose });
        }
    }

    return (
        <Modal open onClose={onClose} showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">{team ? 'Upravit tým' : 'Nový tým'}</h2>
                <button onClick={onClose} className="rounded p-2 text-text-muted hover:bg-surface-hover">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="team-name" className="mb-1 block text-xs font-semibold text-text-subtle">
                        Název *
                    </label>
                    <input
                        id="team-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="team-desc" className="mb-1 block text-xs font-semibold text-text-subtle">
                        Popis
                    </label>
                    <textarea
                        id="team-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="team-div" className="mb-1 block text-xs font-semibold text-text-subtle">
                            Divize *
                        </label>
                        <select
                            id="team-div"
                            value={divisionId}
                            onChange={(e) => setDivisionId(e.target.value)}
                            required
                            className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                        >
                            {divisions.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="team-lead" className="mb-1 block text-xs font-semibold text-text-subtle">
                            Team Lead
                        </label>
                        <select
                            id="team-lead"
                            value={teamLeadId}
                            onChange={(e) => setTeamLeadId(e.target.value)}
                            className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                        >
                            <option value="">— žádný —</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover"
                    >
                        Zrušit
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                    >
                        {team ? 'Uložit' : 'Vytvořit'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Members Modal ──
function MembersModal({ team, users, onClose }: { team: Team; users: UserOption[]; onClose: () => void }) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const available = users.filter((u) => !team.members.some((m) => m.id === u.id));

    function addMember() {
        if (!selectedUserId) return;
        router.post(
            `/admin/teams/${team.id}/members`,
            { user_id: selectedUserId },
            { onSuccess: () => setSelectedUserId('') },
        );
    }

    function removeMember(userId: string) {
        router.delete(`/admin/teams/${team.id}/members/${userId}`);
    }

    return (
        <Modal open onClose={onClose} showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Členové — {team.name}</h2>
                <button onClick={onClose} className="rounded p-2 text-text-muted hover:bg-surface-hover">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Current members */}
            <div className="mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                    Aktuální členové ({team.members.length})
                </span>
                <div className="mt-1.5 space-y-1.5">
                    {team.members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2"
                        >
                            <div className="flex items-center gap-2">
                                <Avatar name={member.name} />
                                <span className="text-sm text-text-default">{member.name}</span>
                                {team.team_lead?.id === member.id && (
                                    <span className="rounded-full bg-status-warning-subtle px-1.5 py-px text-[0.65rem] font-medium text-status-warning">
                                        Lead
                                    </span>
                                )}
                            </div>
                            {team.team_lead?.id !== member.id && (
                                <button
                                    onClick={() => removeMember(member.id)}
                                    className="rounded p-1.5 text-text-muted hover:bg-status-danger-subtle hover:text-status-danger"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                    {team.members.length === 0 && <p className="text-xs text-text-muted py-2">Žádní členové</p>}
                </div>
            </div>

            {/* Add member */}
            {available.length > 0 && (
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                        Přidat člena
                    </span>
                    <div className="mt-1 flex gap-2">
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                        >
                            <option value="">Vyberte uživatele...</option>
                            {available.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={addMember}
                            disabled={!selectedUserId}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                        >
                            Přidat
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

export default function OrganizationIndex({ divisions, users, can }: Props) {
    const [divisionModal, setDivisionModal] = useState<{ open: boolean; division?: Division }>({ open: false });
    const [teamModal, setTeamModal] = useState<{ open: boolean; team?: Team; divisionId?: string }>({ open: false });
    const [membersModal, setMembersModal] = useState<{ open: boolean; team?: Team }>({ open: false });
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'division' | 'team'; id: string; name: string } | null>(
        null,
    );

    return (
        <AppLayout title="Organizace" breadcrumbs={BREADCRUMBS}>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold leading-tight text-text-strong">Organizační struktura</h1>
                {can.createDivision && (
                    <button
                        onClick={() => setDivisionModal({ open: true })}
                        className="flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-brand-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Nová divize
                    </button>
                )}
            </div>

            {divisions.length === 0 && <EmptyState message="Žádné divize nastaveny." />}

            <div className="space-y-6">
                {divisions.map((division) => (
                    <div key={division.id} className="rounded-lg border border-border-subtle bg-surface-primary">
                        <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
                            <Building2 className="h-5 w-5 text-brand-primary" />
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base font-semibold text-text-strong">{division.name}</h2>
                                {division.description && (
                                    <p className="text-sm text-text-muted">{division.description}</p>
                                )}
                            </div>
                            <span className="rounded-full bg-status-neutral-subtle px-2 py-px text-xs font-medium text-text-muted">
                                {division.teams.length} týmů
                            </span>
                            {can.createDivision && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setDivisionModal({ open: true, division })}
                                        className="rounded p-2 text-text-muted hover:bg-surface-hover"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            setDeleteTarget({ type: 'division', id: division.id, name: division.name })
                                        }
                                        className="rounded p-2 text-text-muted hover:bg-status-danger-subtle hover:text-status-danger"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="divide-y divide-border-subtle">
                            {division.teams.map((team) => (
                                <div key={team.id} className="px-5 py-4">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <Users className="h-4 w-4 text-text-muted" />
                                        <h3 className="text-sm font-semibold text-text-strong">{team.name}</h3>
                                        {team.team_lead && (
                                            <span className="flex items-center gap-1 rounded-full bg-status-warning-subtle px-2 py-px text-xs text-status-warning">
                                                <Crown className="h-3 w-3" />
                                                {team.team_lead.name}
                                            </span>
                                        )}
                                        <span className="ml-auto text-xs text-text-muted">
                                            {team.members.length} členů
                                        </span>
                                        {can.createTeam && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setMembersModal({ open: true, team })}
                                                    className="rounded-md border border-border-default px-2.5 py-1 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text-default"
                                                >
                                                    Členové
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setTeamModal({ open: true, team, divisionId: division.id })
                                                    }
                                                    className="rounded p-2 text-text-muted hover:bg-surface-hover"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDeleteTarget({ type: 'team', id: team.id, name: team.name })
                                                    }
                                                    className="rounded p-2 text-text-muted hover:bg-status-danger-subtle hover:text-status-danger"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {team.members.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 pl-6">
                                            {team.members.map((member) => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center gap-2 rounded-full bg-surface-secondary px-3 py-1"
                                                >
                                                    <Avatar name={member.name} />
                                                    <span className="text-xs text-text-default">{member.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="pl-6 text-xs text-text-muted">Žádní členové</p>
                                    )}
                                </div>
                            ))}
                            {division.teams.length === 0 && (
                                <p className="px-5 py-4 text-sm text-text-muted">Žádné týmy v této divizi.</p>
                            )}

                            {/* Add team button */}
                            {can.createTeam && (
                                <div className="px-5 py-3">
                                    <button
                                        onClick={() => setTeamModal({ open: true, divisionId: division.id })}
                                        className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-primary"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Přidat tým
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {divisionModal.open && (
                <DivisionModal division={divisionModal.division} onClose={() => setDivisionModal({ open: false })} />
            )}
            {teamModal.open && (
                <TeamModal
                    team={teamModal.team}
                    divisions={divisions}
                    users={users}
                    defaultDivisionId={teamModal.divisionId}
                    onClose={() => setTeamModal({ open: false })}
                />
            )}
            {membersModal.open && membersModal.team && (
                <MembersModal team={membersModal.team} users={users} onClose={() => setMembersModal({ open: false })} />
            )}
            <ConfirmModal
                open={!!deleteTarget}
                variant="danger"
                title={deleteTarget?.type === 'division' ? 'Smazat divizi' : 'Smazat tým'}
                message={
                    deleteTarget?.type === 'division'
                        ? `Opravdu chcete smazat divizi „${deleteTarget?.name}"? Týmy pod ní musí být prázdné.`
                        : `Opravdu chcete smazat tým „${deleteTarget?.name}"?`
                }
                confirmLabel="Smazat"
                onConfirm={() => {
                    if (deleteTarget) {
                        const url =
                            deleteTarget.type === 'division'
                                ? `/admin/divisions/${deleteTarget.id}`
                                : `/admin/teams/${deleteTarget.id}`;
                        router.delete(url);
                    }
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}
