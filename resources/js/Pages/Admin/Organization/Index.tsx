import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/EmptyState';
import Avatar from '@/Components/Avatar';
import { Building2, Users, Crown } from 'lucide-react';

interface User {
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
    team_lead: { id: string; name: string } | null;
    members: User[];
}

interface Division {
    id: string;
    name: string;
    description: string | null;
    teams: Team[];
}

interface Props {
    divisions: Division[];
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Administrace' }, { label: 'Organizace' }];

export default function OrganizationIndex({ divisions }: Props) {
    return (
        <AppLayout title="Organizace" breadcrumbs={BREADCRUMBS}>
            <h1 className="mb-6 text-2xl font-bold leading-tight text-text-strong">Organizační struktura</h1>

            {divisions.length === 0 && <EmptyState message="Žádné divize nastaveny." />}

            <div className="space-y-6">
                {divisions.map((division) => (
                    <div key={division.id} className="rounded-lg border border-border-subtle bg-surface-primary">
                        <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
                            <Building2 className="h-5 w-5 text-brand-primary" />
                            <div>
                                <h2 className="text-base font-semibold text-text-strong">{division.name}</h2>
                                {division.description && (
                                    <p className="text-sm text-text-muted">{division.description}</p>
                                )}
                            </div>
                            <span className="ml-auto rounded-full bg-status-neutral-subtle px-2 py-px text-xs font-medium text-text-muted">
                                {division.teams.length} týmů
                            </span>
                        </div>

                        <div className="divide-y divide-border-subtle">
                            {division.teams.map((team) => (
                                <div key={team.id} className="px-5 py-4">
                                    <div className="mb-3 flex items-center gap-2">
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
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
