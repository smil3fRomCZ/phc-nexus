import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import StatusBadge from '@/Components/StatusBadge';
import EmptyState from '@/Components/EmptyState';
import { TASK_STATUS } from '@/constants/status';
import { getPriority } from '@/constants/priority';
import { Link, usePage } from '@inertiajs/react';
import { Clock, CheckSquare, AlertCircle, FolderKanban } from 'lucide-react';
import type { PageProps } from '@/types';

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Home' }];

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    project: { id: string; name: string; key: string } | null;
}

interface ApprovalRequest {
    id: string;
    description: string | null;
    status: string;
    requester: { id: string; name: string };
    created_at: string;
}

interface Props {
    stats: {
        active_tasks: number;
        pending_approvals: number;
        overdue: number;
        my_projects: number;
    };
    myTasks: Task[];
    pendingApprovals: ApprovalRequest[];
}

const STAT_TILES = [
    { key: 'active_tasks', label: 'Active Tasks', icon: Clock, color: 'info' },
    { key: 'pending_approvals', label: 'Pending Approvals', icon: CheckSquare, color: 'warning' },
    { key: 'overdue', label: 'Overdue', icon: AlertCircle, color: 'danger' },
    { key: 'my_projects', label: 'My Projects', icon: FolderKanban, color: 'neutral' },
] as const;

const TILE_COLORS: Record<string, { bg: string; text: string }> = {
    info: { bg: 'bg-status-info-subtle', text: 'text-status-info' },
    warning: { bg: 'bg-status-warning-subtle', text: 'text-status-warning' },
    danger: { bg: 'bg-status-danger-subtle', text: 'text-status-danger' },
    neutral: { bg: 'bg-status-neutral-subtle', text: 'text-status-neutral' },
};

function formatDueDate(dateStr: string | null): { text: string; overdue: boolean } {
    if (!dateStr) return { text: '\u2014', overdue: false };
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = date < now;
    const text = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { text: overdue ? `${text} — OVERDUE` : text, overdue };
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function DashboardIndex({ stats, myTasks, pendingApprovals }: Props) {
    const { auth } = usePage<PageProps>().props;
    const firstName = auth.user?.name?.split(' ')[0] ?? '';

    return (
        <AppLayout title="Dashboard" breadcrumbs={BREADCRUMBS}>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">Dashboard</h1>
                <p className="mt-1 text-base text-text-muted">Welcome back, {firstName}</p>
            </div>

            {/* Stat Tiles */}
            <div className="mb-8 grid grid-cols-4 gap-5">
                {STAT_TILES.map((tile) => {
                    const colors = TILE_COLORS[tile.color];
                    const Icon = tile.icon;
                    return (
                        <div
                            key={tile.key}
                            className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface-primary p-5 transition-shadow hover:shadow-md"
                        >
                            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-md ${colors.bg}`}>
                                <Icon className={`h-4 w-4 ${colors.text}`} strokeWidth={2} />
                            </div>
                            <span className="text-sm font-medium text-text-muted">{tile.label}</span>
                            <span className="text-2xl font-bold text-text-strong">
                                {stats[tile.key as keyof typeof stats]}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* My Work Table */}
            <h2 className="mb-4 text-lg font-semibold text-text-strong">My Work</h2>
            <div className="mb-8 overflow-hidden rounded-lg border border-border-subtle bg-surface-primary">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            {['Task', 'Project', 'Status', 'Priority', 'Due Date'].map((header) => (
                                <th
                                    key={header}
                                    className="border-b border-border-default bg-surface-secondary px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {myTasks.map((task) => {
                            const due = formatDueDate(task.due_date);
                            const priority = getPriority(task.priority);
                            return (
                                <tr key={task.id} className="transition-colors hover:bg-brand-soft">
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm font-medium text-text-strong">
                                        {task.project ? (
                                            <Link
                                                href={`/projects/${task.project.id}/tasks/${task.id}`}
                                                className="no-underline hover:text-brand-primary"
                                            >
                                                {task.title}
                                            </Link>
                                        ) : (
                                            task.title
                                        )}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3 text-sm text-text-muted">
                                        {task.project?.name ?? '\u2014'}
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        <StatusBadge statusMap={TASK_STATUS} value={task.status} />
                                    </td>
                                    <td className="border-b border-border-subtle px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${priority.textClass === 'text-status-danger' ? 'bg-status-danger-subtle text-status-danger' : priority.textClass === 'text-status-warning' ? 'bg-status-warning-subtle text-status-warning' : priority.textClass === 'text-text-muted' ? 'bg-status-info-subtle text-status-info' : 'bg-status-neutral-subtle text-status-neutral'}`}
                                        >
                                            {priority.label}
                                        </span>
                                    </td>
                                    <td
                                        className={`border-b border-border-subtle px-5 py-3 text-sm ${due.overdue ? 'font-semibold text-status-danger' : 'text-text-muted'}`}
                                    >
                                        {due.text}
                                    </td>
                                </tr>
                            );
                        })}
                        {myTasks.length === 0 && <EmptyState colSpan={5} message="No active tasks assigned to you." />}
                    </tbody>
                </table>
            </div>

            {/* Pending Approvals */}
            <h2 className="mb-4 text-lg font-semibold text-text-strong">Pending Approvals</h2>
            {pendingApprovals.length > 0 ? (
                <div className="grid grid-cols-3 gap-5">
                    {pendingApprovals.map((approval) => (
                        <div
                            key={approval.id}
                            className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-primary p-5 transition-shadow hover:shadow-md"
                        >
                            <div className="text-sm font-semibold text-text-strong">
                                {approval.description ?? 'Approval request'}
                            </div>
                            <div className="text-xs text-text-muted">
                                Requested by {approval.requester.name} &middot; {timeAgo(approval.created_at)}
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={`/projects/${approval.id}`}
                                    className="inline-flex items-center rounded-md bg-brand-primary px-3 py-1 text-xs font-medium text-text-inverse no-underline transition-colors hover:bg-brand-hover"
                                >
                                    Review
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-border-subtle bg-surface-primary p-8 text-center text-sm text-text-muted">
                    No pending approvals.
                </div>
            )}
        </AppLayout>
    );
}
