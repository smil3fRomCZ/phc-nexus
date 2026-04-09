import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import Button from '@/Components/Button';
import ConfirmModal from '@/Components/ConfirmModal';
import FilterSelect from '@/Components/FilterSelect';
import FormSelect from '@/Components/FormSelect';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';
import { router } from '@inertiajs/react';
import { UserPlus, X } from 'lucide-react';
import { useState } from 'react';

interface Member {
    id: string;
    name: string;
    email: string;
    pivot: { role: string };
}

interface AvailableUser {
    id: string;
    name: string;
    email: string;
}

interface Props {
    project: {
        id: string;
        name: string;
        key: string;
        status: string;
        members: Member[];
        members_count: number;
    };
    availableUsers: AvailableUser[];
    roleCounts: Record<string, number>;
    can: { manageMembers: boolean };
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Vlastník',
    project_manager: 'Project Manager',
    member: 'Člen',
};

const ROLE_BADGE: Record<string, string> = {
    owner: 'bg-status-warning-subtle text-status-warning',
    project_manager: 'bg-status-info-subtle text-status-info',
    member: 'bg-surface-secondary text-text-muted',
};

export default function ProjectMembers({ project, availableUsers, roleCounts, can }: Props) {
    const [addUserId, setAddUserId] = useState('');
    const [addRole, setAddRole] = useState('member');
    const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Členové' },
    ];

    function handleAdd() {
        if (!addUserId) return;
        router.post(
            `/projects/${project.id}/members`,
            { user_id: addUserId, role: addRole },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAddUserId('');
                    setAddRole('member');
                },
            },
        );
    }

    function handleRoleChange(userId: string, role: string) {
        router.patch(`/projects/${project.id}/members/${userId}`, { role }, { preserveScroll: true });
    }

    function handleRemove() {
        if (!removeTarget) return;
        router.delete(`/projects/${project.id}/members/${removeTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setRemoveTarget(null),
        });
    }

    const statChips = [
        { label: 'členů celkem', value: project.members_count },
        { label: 'vlastník', value: roleCounts.owner ?? 0 },
        { label: 'PM', value: roleCounts.project_manager ?? 0 },
        { label: 'členů', value: roleCounts.member ?? 0 },
    ];

    return (
        <AppLayout title={`${project.key} — Členové`} breadcrumbs={breadcrumbs}>
            <div className="max-w-screen-xl space-y-5">
                <ProjectHeaderCompact project={project} />
                <ProjectTabs projectId={project.id} active="members" />

                {/* Stats */}
                <div className="flex flex-wrap gap-3">
                    {statChips.map((chip) => (
                        <div
                            key={chip.label}
                            className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-primary px-4 py-2"
                        >
                            <span className="text-base font-bold text-text-strong">{chip.value}</span>
                            <span className="text-sm text-text-muted">{chip.label}</span>
                        </div>
                    ))}
                </div>

                {/* Add member */}
                {can.manageMembers && availableUsers.length > 0 && (
                    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle bg-surface-secondary p-4">
                        <FilterSelect
                            label="Přidat člena"
                            value={addUserId}
                            onChange={setAddUserId}
                            options={availableUsers.map((u) => ({ value: u.id, label: `${u.name} — ${u.email}` }))}
                            placeholder="Vyberte uživatele..."
                        />
                        <FilterSelect
                            label="Role"
                            value={addRole}
                            onChange={setAddRole}
                            options={[
                                { value: 'member', label: 'Člen' },
                                { value: 'project_manager', label: 'Project Manager' },
                            ]}
                        />
                        <Button
                            size="sm"
                            icon={<UserPlus className="h-3.5 w-3.5" />}
                            disabled={!addUserId}
                            onClick={handleAdd}
                        >
                            Přidat
                        </Button>
                    </div>
                )}

                {/* Members table */}
                <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-primary">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="bg-surface-secondary px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Jméno
                                </th>
                                <th className="bg-surface-secondary px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Role
                                </th>
                                <th className="bg-surface-secondary px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Email
                                </th>
                                {can.manageMembers && (
                                    <th className="w-12 bg-surface-secondary px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                        Akce
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {project.members.map((member) => {
                                const role = member.pivot.role;
                                const isOwner = role === 'owner';
                                return (
                                    <tr key={member.id} className="transition-colors hover:bg-brand-soft">
                                        <td className="border-b border-border-subtle px-4 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={member.name} size="md" />
                                                <span className="text-sm font-medium text-text-strong">
                                                    {member.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="border-b border-border-subtle px-4 py-2.5">
                                            {isOwner || !can.manageMembers ? (
                                                <span
                                                    className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${ROLE_BADGE[role] ?? ROLE_BADGE.member}`}
                                                >
                                                    {ROLE_LABELS[role] ?? role}
                                                </span>
                                            ) : (
                                                <FormSelect
                                                    value={role}
                                                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                    options={[
                                                        { value: 'member', label: 'Člen' },
                                                        { value: 'project_manager', label: 'Project Manager' },
                                                    ]}
                                                    wrapperClassName="w-44"
                                                />
                                            )}
                                        </td>
                                        <td className="border-b border-border-subtle px-4 py-2.5 text-sm text-text-muted">
                                            {member.email}
                                        </td>
                                        {can.manageMembers && (
                                            <td className="border-b border-border-subtle px-4 py-2.5 text-right">
                                                {!isOwner && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setRemoveTarget({ id: member.id, name: member.name })
                                                        }
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                open={!!removeTarget}
                variant="warning"
                title="Odebrat člena"
                message={`Opravdu chcete odebrat uživatele ${removeTarget?.name} z projektu?`}
                confirmLabel="Odebrat"
                onConfirm={handleRemove}
                onCancel={() => setRemoveTarget(null)}
            />
        </AppLayout>
    );
}
