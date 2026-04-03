import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { formatDate } from '@/utils/formatDate';
import { Mail, Shield, Users, Calendar } from 'lucide-react';

interface Props {
    user: {
        id: string;
        name: string;
        email: string;
        system_role: string;
        status: string;
        team: { id: string; name: string } | null;
        created_at: string;
    };
}

const ROLE_LABELS: Record<string, string> = {
    executive: 'Executive',
    project_manager: 'Project Manager',
    team_member: 'Team Member',
    service_desk_agent: 'Service Desk',
    reader: 'Reader',
};

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Můj profil' }];

export default function ProfileIndex({ user }: Props) {
    return (
        <AppLayout title="Můj profil" breadcrumbs={BREADCRUMBS}>
            <div className="max-w-screen-sm">
                <h1 className="mb-6 text-xl font-bold text-text-strong md:text-2xl">Můj profil</h1>

                <div className="rounded-lg border border-border-subtle bg-surface-primary">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-4 border-b border-border-subtle px-6 py-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-text-inverse">
                            {user.name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-text-strong">{user.name}</h2>
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
                    </div>

                    {/* Details */}
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

                <p className="mt-4 text-xs text-text-muted">Pro změnu údajů kontaktujte administrátora.</p>
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
