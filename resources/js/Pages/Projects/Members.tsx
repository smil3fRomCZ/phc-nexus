import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import Button from '@/Components/Button';
import FilterSelect from '@/Components/FilterSelect';
import FormSelect from '@/Components/FormSelect';
import MemberUsageModal from '@/Components/Projects/MemberUsageModal';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';
import { router } from '@inertiajs/react';
import { Clock, FolderKanban, UserPlus } from 'lucide-react';
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

interface MemberUsage {
    open_tasks: number;
    done_tasks: number;
    hours: number;
}

interface Props {
    project: {
        id: string;
        name: string;
        key: string;
        status: string;
        members: Member[];
        members_count: number;
        owner_id: string;
    };
    availableUsers: AvailableUser[];
    roleCounts: Record<string, number>;
    usage: Record<string, MemberUsage>;
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

export default function ProjectMembers({ project, availableUsers, roleCounts, usage, can }: Props) {
    const [addUserId, setAddUserId] = useState('');
    const [addRole, setAddRole] = useState('member');
    const [usageTarget, setUsageTarget] = useState<Member | null>(null);

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
                                <th className="bg-surface-secondary px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Aktivita v projektu
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.members.map((member) => {
                                const role = member.pivot.role;
                                const isOwner = role === 'owner';
                                const memberUsage = usage[member.id];
                                const rowClickable = can.manageMembers && !isOwner;
                                return (
                                    <tr
                                        key={member.id}
                                        className={`transition-colors ${rowClickable ? 'cursor-pointer hover:bg-brand-soft' : ''}`}
                                        onClick={rowClickable ? () => setUsageTarget(member) : undefined}
                                    >
                                        <td className="border-b border-border-subtle px-4 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={member.name} size="md" />
                                                <span className="text-sm font-medium text-text-strong">
                                                    {member.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td
                                            className="border-b border-border-subtle px-4 py-2.5"
                                            onClick={(e) => e.stopPropagation()}
                                        >
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
                                        <td className="border-b border-border-subtle px-4 py-2.5">
                                            <UsageChips usage={memberUsage} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {usageTarget && (
                <MemberUsageModal projectId={project.id} member={usageTarget} onClose={() => setUsageTarget(null)} />
            )}
        </AppLayout>
    );
}

function UsageChips({ usage }: { usage?: MemberUsage }) {
    if (!usage || (usage.open_tasks === 0 && usage.done_tasks === 0 && usage.hours === 0)) {
        return <span className="text-xs text-text-subtle">Žádná aktivita</span>;
    }
    return (
        <div className="flex flex-wrap gap-1.5">
            {usage.hours > 0 && (
                <span className="inline-flex items-center gap-1 rounded-[10px] bg-surface-secondary px-2 py-0.5 text-xs font-semibold text-text-muted">
                    <Clock className="h-3 w-3" /> {usage.hours} h
                </span>
            )}
            {usage.open_tasks > 0 && (
                <span className="inline-flex items-center gap-1 rounded-[10px] bg-status-warning-subtle px-2 py-0.5 text-xs font-semibold text-status-warning">
                    <FolderKanban className="h-3 w-3" /> {usage.open_tasks} otevřených
                </span>
            )}
            {usage.done_tasks > 0 && (
                <span className="inline-flex items-center gap-1 rounded-[10px] bg-surface-secondary px-2 py-0.5 text-xs font-semibold text-text-muted">
                    {usage.done_tasks} dokončených
                </span>
            )}
        </div>
    );
}
