import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import { Bell, ShieldCheck, Vote, ClipboardList, RefreshCw, type LucideIcon } from 'lucide-react';
import type { PaginationLink } from '@/Components/Pagination';
import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { formatTime } from '@/utils/formatTime';
import { router, Link } from '@inertiajs/react';

interface NotificationData {
    title: string;
    body: string;
    type: string;
    [key: string]: unknown;
}

interface Notification {
    id: string;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
}

interface Props {
    notifications: { data: Notification[]; links: PaginationLink[] };
    unreadCount: number;
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Notifikace' }];

const typeIcons: Record<string, LucideIcon> = {
    approval_requested: ShieldCheck,
    approval_vote_cast: Vote,
    task_assigned: ClipboardList,
    task_status_changed: RefreshCw,
};

function getNotificationHref(data: NotificationData): string | null {
    const projectId = data.project_id as string | undefined;
    const taskId = data.task_id as string | undefined;
    const approvalRequestId = data.approval_request_id as string | undefined;

    if (taskId && projectId) {
        return `/projects/${projectId}/tasks/${taskId}`;
    }
    if (approvalRequestId && projectId) {
        return `/projects/${projectId}/approvals/${approvalRequestId}`;
    }
    return null;
}

export default function NotificationsIndex({ notifications, unreadCount }: Props) {
    function markAsRead(id: string) {
        fetch(`/notifications/${id}/read`, {
            method: 'PATCH',
            headers: {
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
        }).then(() => router.reload({ only: ['notifications', 'unreadCount'] }));
    }

    function markAllAsRead() {
        fetch('/notifications/read-all', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
        }).then(() => router.reload({ only: ['notifications', 'unreadCount'] }));
    }

    return (
        <AppLayout title="Notifikace" breadcrumbs={BREADCRUMBS}>
            <div className="max-w-screen-lg">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-xl md:text-2xl font-bold leading-tight text-text-strong">
                        Notifikace
                        {unreadCount > 0 && (
                            <span className="ml-2 inline-flex rounded-full bg-brand-primary px-2 py-px text-xs font-semibold text-text-inverse">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-sm text-brand-primary hover:underline">
                            Označit vše jako přečtené
                        </button>
                    )}
                </div>

                <div className="space-y-1">
                    {notifications.data.map((n) => {
                        const href = getNotificationHref(n.data);
                        const cardClass = `flex items-start gap-3 rounded-lg border px-5 py-3 ${
                            n.read_at
                                ? 'border-border-subtle bg-surface-primary'
                                : 'border-l-[3px] border-l-brand-primary border-t-border-subtle border-r-border-subtle border-b-border-subtle bg-brand-soft'
                        }`;

                        const content = (
                            <>
                                {(() => {
                                    const Icon = typeIcons[n.data.type] ?? Bell;
                                    return <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-text-muted" />;
                                })()}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-text-strong">{n.data.title}</p>
                                    <p className="text-sm text-text-muted">{n.data.body}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-text-muted">{formatTime(n.created_at)}</span>
                                    {!n.read_at && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                markAsRead(n.id);
                                            }}
                                            className="rounded-sm px-2 py-1 text-xs text-brand-primary transition-colors hover:bg-surface-hover"
                                        >
                                            Přečteno
                                        </button>
                                    )}
                                </div>
                            </>
                        );

                        return href ? (
                            <Link
                                key={n.id}
                                href={href}
                                className={`${cardClass} no-underline transition-shadow hover:shadow-md`}
                            >
                                {content}
                            </Link>
                        ) : (
                            <div key={n.id} className={cardClass}>
                                {content}
                            </div>
                        );
                    })}
                    {notifications.data.length === 0 && <EmptyState icon={Bell} message="Žádné notifikace." />}
                </div>

                <Pagination links={notifications.links} />
            </div>
        </AppLayout>
    );
}
