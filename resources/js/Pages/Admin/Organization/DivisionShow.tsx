import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import ConfirmModal from '@/Components/ConfirmModal';
import EmptyState from '@/Components/EmptyState';
import FormInput from '@/Components/FormInput';
import FormSelect from '@/Components/FormSelect';
import FormTextarea from '@/Components/FormTextarea';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PersonChip from '@/Components/PersonChip';
import { Plus, Pencil, Trash2, ArrowRight, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';

interface Team {
    id: string;
    name: string;
    description: string | null;
    division_id: string;
    team_lead: { id: string; name: string } | null;
    team_lead_id: string | null;
    members_count: number;
}

interface Division {
    id: string;
    name: string;
    description: string | null;
    teams: Team[];
}

interface UserOption {
    id: string;
    name: string;
}

interface Props {
    division: Division;
    users: UserOption[];
    can: { editDivision: boolean; deleteDivision: boolean; createTeam: boolean };
}

export default function DivisionShow({ division, users, can }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Administrace' },
        { label: 'Organizace', href: '/admin/organization' },
        { label: division.name },
    ];

    const [editModal, setEditModal] = useState(false);
    const [teamModal, setTeamModal] = useState<{ open: boolean; team?: Team }>({ open: false });
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'division' | 'team'; id: string; name: string } | null>(
        null,
    );

    return (
        <AppLayout title={division.name} breadcrumbs={breadcrumbs}>
            <PageHeader
                title={division.name}
                actions={
                    <div className="flex items-center gap-2">
                        {can.createTeam && (
                            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setTeamModal({ open: true })}>
                                Nový tým
                            </Button>
                        )}
                        {can.editDivision && (
                            <Button variant="ghost" size="sm" onClick={() => setEditModal(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                        {can.deleteDivision && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setDeleteTarget({ type: 'division', id: division.id, name: division.name })
                                }
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                }
            />

            {division.description && <p className="mb-6 text-sm text-text-muted">{division.description}</p>}

            {/* Teams table */}
            <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Tým
                            </th>
                            <th className="bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Team Lead
                            </th>
                            <th className="bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Členů
                            </th>
                            <th className="bg-surface-secondary px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Akce
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {division.teams.map((team) => (
                            <tr
                                key={team.id}
                                className="cursor-pointer transition-colors hover:bg-brand-soft"
                                onClick={() => router.get(`/admin/organization/teams/${team.id}`)}
                            >
                                <td className="border-b border-border-subtle px-5 py-3">
                                    <div>
                                        <span className="text-sm font-medium text-text-strong">{team.name}</span>
                                        {team.description && (
                                            <p className="text-xs text-text-muted truncate max-w-xs">
                                                {team.description}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-default">
                                    {team.team_lead ? (
                                        <PersonChip name={team.team_lead.name} />
                                    ) : (
                                        <span className="text-text-muted">—</span>
                                    )}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-default">
                                    {team.members_count}
                                </td>
                                <td className="border-b border-border-subtle px-5 py-3 text-right">
                                    <div
                                        className="flex items-center justify-end gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {can.createTeam && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setTeamModal({ open: true, team })}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        {can.deleteDivision && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setDeleteTarget({ type: 'team', id: team.id, name: team.name })
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        <ArrowRight className="ml-1 h-4 w-4 text-text-subtle" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {division.teams.length === 0 && <EmptyState colSpan={4} message="Žádné týmy v této divizi." />}
                    </tbody>
                </table>
            </div>

            {/* Edit division modal */}
            {editModal && <EditDivisionModal division={division} onClose={() => setEditModal(false)} />}

            {/* Team modal */}
            {teamModal.open && (
                <TeamFormModal
                    team={teamModal.team}
                    divisionId={division.id}
                    users={users}
                    onClose={() => setTeamModal({ open: false })}
                />
            )}

            <ConfirmModal
                open={!!deleteTarget}
                variant="danger"
                title={deleteTarget?.type === 'division' ? 'Smazat divizi' : 'Smazat tým'}
                message={`Opravdu chcete smazat ${deleteTarget?.type === 'division' ? 'divizi' : 'tým'} „${deleteTarget?.name}"?`}
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

function EditDivisionModal({ division, onClose }: { division: Division; onClose: () => void }) {
    const [name, setName] = useState(division.name);
    const [description, setDescription] = useState(division.description ?? '');
    const [processing, setProcessing] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.put(
            `/admin/divisions/${division.id}`,
            { name, description },
            {
                onFinish: () => setProcessing(false),
                onSuccess: onClose,
            },
        );
    }

    return (
        <Modal open onClose={onClose} showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Upravit divizi</h2>
                <button onClick={onClose} className="rounded p-2 text-text-muted hover:bg-surface-hover">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    id="div-name"
                    label="Název"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <FormTextarea
                    id="div-desc"
                    label="Popis"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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

function TeamFormModal({
    team,
    divisionId,
    users,
    onClose,
}: {
    team?: Team;
    divisionId: string;
    users: UserOption[];
    onClose: () => void;
}) {
    const [name, setName] = useState(team?.name ?? '');
    const [description, setDescription] = useState(team?.description ?? '');
    const [teamLeadId, setTeamLeadId] = useState(team?.team_lead_id ?? '');
    const [processing, setProcessing] = useState(false);

    const userOptions = users.map((u) => ({ value: u.id, label: u.name }));

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
                        {team ? 'Uložit' : 'Vytvořit'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
