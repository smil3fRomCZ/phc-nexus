import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';
import { Link } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, Clock, Layers, Target, TrendingUp, Users } from 'lucide-react';

interface StatusStat {
    name: string;
    color: string | null;
    count: number;
    is_done: boolean;
    is_cancelled: boolean;
}

interface TaskStats {
    total: number;
    completed: number;
    overdue: number;
    completedPercent: number;
    totalSp: number;
    completedSp: number;
    byStatus: StatusStat[];
    byPriority: Record<string, number>;
}

interface TimeMember {
    name: string;
    total_hours: number;
    entries_count: number;
}

interface TimeWeek {
    week: string;
    total_hours: number;
}

interface TimeStats {
    totalHours: number;
    estimatedHours: number;
    byMember: TimeMember[];
    byWeek: TimeWeek[];
}

interface EpicProgress {
    id: string;
    title: string;
    tasks_count: number;
    tasks_done_count: number;
    total_sp: number;
    done_sp: number;
    percent: number;
}

interface MemberActivity {
    id: string;
    name: string;
    assigned: number;
    completed: number;
    hours: number;
}

interface ApprovalStats {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

interface Props {
    project: { id: string; name: string; key: string; status: string };
    taskStats: TaskStats;
    timeStats: TimeStats;
    epicProgress: EpicProgress[];
    memberActivity: MemberActivity[];
    approvalStats: ApprovalStats;
}

const PRIORITY_LABELS: Record<string, string> = {
    urgent: 'Urgentní',
    high: 'Vysoká',
    medium: 'Střední',
    low: 'Nízká',
};

const PRIORITY_COLORS: Record<string, string> = {
    urgent: 'bg-status-danger',
    high: 'bg-status-warning',
    medium: 'bg-brand-primary',
    low: 'bg-status-success',
};

export default function Reports({ project, taskStats, timeStats, epicProgress, memberActivity, approvalStats }: Props) {
    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Reporty' },
    ];

    return (
        <AppLayout title={`${project.key} — Reporty`} breadcrumbs={breadcrumbs}>
            <div className="mb-4">
                <ProjectHeaderCompact project={project} />
            </div>
            <div className="mb-6">
                <ProjectTabs projectId={project.id} active="reports" />
            </div>

            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <KpiCard
                        icon={<Target className="h-5 w-5 text-brand-primary" />}
                        label="Celkem úkolů"
                        value={taskStats.total}
                    />
                    <KpiCard
                        icon={<CheckCircle className="h-5 w-5 text-status-success" />}
                        label="Dokončeno"
                        value={`${taskStats.completedPercent}%`}
                        sub={`${taskStats.completed}/${taskStats.total}`}
                    />
                    <KpiCard
                        icon={<AlertTriangle className="h-5 w-5 text-status-danger" />}
                        label="Po termínu"
                        value={taskStats.overdue}
                        variant={taskStats.overdue > 0 ? 'danger' : 'default'}
                    />
                    <KpiCard
                        icon={<Clock className="h-5 w-5 text-status-warning" />}
                        label="Odpracováno"
                        value={`${timeStats.totalHours}h`}
                        sub={timeStats.estimatedHours > 0 ? `z ${timeStats.estimatedHours}h odhadu` : undefined}
                    />
                </div>

                {/* Story Points Summary */}
                {taskStats.totalSp > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <KpiCard
                            icon={<TrendingUp className="h-5 w-5 text-brand-primary" />}
                            label="Celkem SP"
                            value={taskStats.totalSp}
                        />
                        <KpiCard
                            icon={<CheckCircle className="h-5 w-5 text-status-success" />}
                            label="Hotovo SP"
                            value={taskStats.completedSp}
                        />
                        <KpiCard label="SP zbývá" value={taskStats.totalSp - taskStats.completedSp} />
                        <KpiCard
                            label="SP progress"
                            value={`${taskStats.totalSp > 0 ? Math.round((taskStats.completedSp / taskStats.totalSp) * 100) : 0}%`}
                        />
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Task Status Distribution */}
                    <Widget title="Stav úkolů">
                        <div className="space-y-2">
                            {taskStats.byStatus.map((status) => (
                                <div key={status.name} className="flex items-center gap-3">
                                    <div
                                        className="h-3 w-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: status.color ?? '#97a0af' }}
                                    />
                                    <span className="min-w-[8rem] text-sm text-text-default">{status.name}</span>
                                    <div className="flex-1">
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${taskStats.total > 0 ? (status.count / taskStats.total) * 100 : 0}%`,
                                                    backgroundColor: status.color ?? '#97a0af',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="min-w-[2rem] text-right text-sm font-semibold text-text-strong">
                                        {status.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Widget>

                    {/* Priority Breakdown */}
                    <Widget title="Rozložení priorit">
                        <div className="space-y-2">
                            {(['urgent', 'high', 'medium', 'low'] as const).map((priority) => {
                                const count = taskStats.byPriority[priority] ?? 0;
                                return (
                                    <div key={priority} className="flex items-center gap-3">
                                        <span className="min-w-[8rem] text-sm text-text-default">
                                            {PRIORITY_LABELS[priority]}
                                        </span>
                                        <div className="flex-1">
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
                                                <div
                                                    className={`h-full rounded-full ${PRIORITY_COLORS[priority]}`}
                                                    style={{
                                                        width: `${taskStats.total > 0 ? (count / taskStats.total) * 100 : 0}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <span className="min-w-[2rem] text-right text-sm font-semibold text-text-strong">
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Widget>

                    {/* Time by Member */}
                    <Widget title="Čas podle členů" icon={<Users className="h-4 w-4" />}>
                        {timeStats.byMember.length === 0 ? (
                            <p className="text-sm text-text-muted">Zatím žádné záznamy času</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-subtle">
                                            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                Člen
                                            </th>
                                            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                Hodiny
                                            </th>
                                            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                Záznamů
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeStats.byMember.map((m) => (
                                            <tr key={m.name} className="border-b border-border-subtle/50">
                                                <td className="py-2 text-text-default">{m.name}</td>
                                                <td className="py-2 text-right font-semibold text-text-strong">
                                                    {Number(m.total_hours).toFixed(1)}h
                                                </td>
                                                <td className="py-2 text-right text-text-muted">{m.entries_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Widget>

                    {/* Time by Week */}
                    <Widget title="Hodiny za týden" icon={<Clock className="h-4 w-4" />}>
                        {timeStats.byWeek.length === 0 ? (
                            <p className="text-sm text-text-muted">Zatím žádné záznamy času</p>
                        ) : (
                            <div className="flex items-end gap-1" style={{ height: 120 }}>
                                {timeStats.byWeek.map((w) => {
                                    const max = Math.max(...timeStats.byWeek.map((wk) => Number(wk.total_hours)));
                                    const pct = max > 0 ? (Number(w.total_hours) / max) * 100 : 0;
                                    return (
                                        <div key={w.week} className="group relative flex flex-1 flex-col items-center">
                                            <div className="absolute -top-5 hidden text-[10px] font-semibold text-text-strong group-hover:block">
                                                {Number(w.total_hours).toFixed(1)}h
                                            </div>
                                            <div
                                                className="w-full rounded-t bg-brand-primary transition-all hover:bg-brand-hover"
                                                style={{ height: `${Math.max(pct, 4)}%` }}
                                            />
                                            <span className="mt-1 text-[9px] text-text-muted">
                                                {w.week.split('-')[1]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Widget>

                    {/* Epic Progress */}
                    <Widget title="Postup Epiců" icon={<Layers className="h-4 w-4" />} className="lg:col-span-2">
                        {epicProgress.length === 0 ? (
                            <p className="text-sm text-text-muted">Žádné epicy v projektu</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-subtle">
                                            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                Epic
                                            </th>
                                            <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                Úkoly
                                            </th>
                                            <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                SP
                                            </th>
                                            <th
                                                className="pb-2 text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                                style={{ minWidth: 120 }}
                                            >
                                                Postup
                                            </th>
                                            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                %
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {epicProgress.map((epic) => (
                                            <tr key={epic.id} className="border-b border-border-subtle/50">
                                                <td className="py-2">
                                                    <Link
                                                        href={`/projects/${project.id}/epics/${epic.id}`}
                                                        className="text-sm font-medium text-text-strong no-underline hover:text-brand-primary"
                                                    >
                                                        {epic.title}
                                                    </Link>
                                                </td>
                                                <td className="py-2 text-center text-text-muted">
                                                    {epic.tasks_done_count}/{epic.tasks_count}
                                                </td>
                                                <td className="py-2 text-center text-text-muted">
                                                    {epic.done_sp}/{epic.total_sp}
                                                </td>
                                                <td className="py-2">
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
                                                        <div
                                                            className="h-full rounded-full bg-status-success transition-all"
                                                            style={{ width: `${epic.percent}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-2 text-right font-semibold text-text-strong">
                                                    {epic.percent}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Widget>

                    {/* Member Activity */}
                    <Widget title="Aktivita členů" icon={<Users className="h-4 w-4" />}>
                        {memberActivity.length === 0 ? (
                            <p className="text-sm text-text-muted">Žádní členové</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-subtle">
                                            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                Člen
                                            </th>
                                            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                Přiřazeno
                                            </th>
                                            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                Hotovo
                                            </th>
                                            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                                Hodiny
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {memberActivity.map((m) => (
                                            <tr key={m.id} className="border-b border-border-subtle/50">
                                                <td className="py-2 text-text-default">{m.name}</td>
                                                <td className="py-2 text-right text-text-muted">{m.assigned}</td>
                                                <td className="py-2 text-right font-semibold text-status-success">
                                                    {m.completed}
                                                </td>
                                                <td className="py-2 text-right font-semibold text-text-strong">
                                                    {m.hours}h
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Widget>

                    {/* Approval Stats */}
                    <Widget title="Schvalování">
                        {approvalStats.total === 0 ? (
                            <p className="text-sm text-text-muted">Zatím žádné žádosti o schválení</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-status-warning">{approvalStats.pending}</p>
                                    <p className="text-xs text-text-muted">Čekající</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-status-success">{approvalStats.approved}</p>
                                    <p className="text-xs text-text-muted">Schváleno</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-status-danger">{approvalStats.rejected}</p>
                                    <p className="text-xs text-text-muted">Zamítnuto</p>
                                </div>
                            </div>
                        )}
                    </Widget>
                </div>
            </div>
        </AppLayout>
    );
}

function KpiCard({
    icon,
    label,
    value,
    sub,
    variant = 'default',
}: {
    icon?: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    variant?: 'default' | 'danger';
}) {
    return (
        <div className="rounded-lg border border-border-subtle bg-surface-primary p-4">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">{label}</span>
            </div>
            <p
                className={`mt-1 text-2xl font-bold ${variant === 'danger' ? 'text-status-danger' : 'text-text-strong'}`}
            >
                {value}
            </p>
            {sub && <p className="text-xs text-text-muted">{sub}</p>}
        </div>
    );
}

function Widget({
    title,
    icon,
    children,
    className = '',
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`rounded-lg border border-border-subtle bg-surface-primary p-5 ${className}`}>
            <div className="mb-4 flex items-center gap-2">
                {icon && <span className="text-text-subtle">{icon}</span>}
                <h3 className="text-sm font-semibold text-text-strong">{title}</h3>
            </div>
            {children}
        </div>
    );
}
