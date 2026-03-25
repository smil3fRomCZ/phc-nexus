import AppLayout from '@/Layouts/AppLayout';
import { formatTime } from '@/utils/formatTime';
import { router } from '@inertiajs/react';

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
    notifications: Notification[];
    unreadCount: number;
}

const typeIcons: Record<string, string> = {
    approval_requested: '\u2705',
    approval_vote_cast: '\u{1F5F3}',
    task_assigned: '\u{1F4CB}',
    task_status_changed: '\u{1F504}',
};

export default function NotificationsIndex({ notifications, unreadCount }: Props) {
    function markAsRead(id: string) {
        fetch(`/notifications/${id}/read`, {
            method: 'PATCH',
            headers: {
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                'Accept': 'application/json',
            },
        }).then(() => router.reload({ only: ['notifications', 'unreadCount'] }));
    }

    function markAllAsRead() {
        fetch('/notifications/read-all', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                'Accept': 'application/json',
            },
        }).then(() => router.reload({ only: ['notifications', 'unreadCount'] }));
    }

    return (
        <AppLayout title="Notifikace">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-text-strong">
                        Notifikace
                        {unreadCount > 0 && (
                            <span className="ml-2 inline-flex rounded-full bg-brand-primary px-2 py-0.5 text-xs text-text-inverse">
                                {unreadCount}
                            </span>
                        )}
                    </h2>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-brand-primary hover:underline"
                        >
                            Označit vše jako přečtené
                        </button>
                    )}
                </div>

                <div className="space-y-1">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                                n.read_at
                                    ? 'border-border-default bg-surface-primary'
                                    : 'border-brand-primary/20 bg-brand-primary/5'
                            }`}
                        >
                            <span className="mt-0.5 text-lg">
                                {typeIcons[n.data.type] ?? '\u{1F514}'}
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-text-strong">{n.data.title}</p>
                                <p className="text-sm text-text-muted">{n.data.body}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-text-muted">{formatTime(n.created_at)}</span>
                                {!n.read_at && (
                                    <button
                                        onClick={() => markAsRead(n.id)}
                                        className="rounded px-2 py-1 text-xs text-brand-primary hover:bg-surface-hover"
                                    >
                                        Přečteno
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {notifications.length === 0 && (
                        <p className="py-8 text-center text-text-muted">Žádné notifikace.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
