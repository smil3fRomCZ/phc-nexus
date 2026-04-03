import ConfirmModal from '@/Components/ConfirmModal';
import { Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';

export interface TimeEntryData {
    id: string;
    date: string;
    hours: string;
    note: string | null;
    user: { id: string; name: string };
    task?: { id: string; title: string; number: number } | null;
}

interface SummaryItem {
    label: string;
    value: string;
    variant?: 'info' | 'success';
}

interface Props {
    timeEntries: TimeEntryData[];
    totalHours: number;
    postUrl: string;
    currentUserId?: string;
    summaryItems?: SummaryItem[];
    showTaskColumn?: boolean;
}

export default function TimeLogSection({
    timeEntries,
    totalHours,
    postUrl,
    currentUserId,
    summaryItems,
    showTaskColumn = false,
}: Props) {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [hours, setHours] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const defaultSummary: SummaryItem[] = [
        { label: 'Celkem', value: `${totalHours} h`, variant: 'info' },
        { label: 'Záznamů', value: String(timeEntries.length), variant: 'info' },
    ];
    const summary = summaryItems ?? defaultSummary;

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!hours || submitting) return;
        setSubmitting(true);
        fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ date, hours: parseFloat(hours), note: note || null }),
        }).then((res) => {
            setSubmitting(false);
            if (res.ok) {
                setHours('');
                setNote('');
                router.reload();
            }
        });
    }

    function handleDelete(id: string) {
        setDeleteTarget(id);
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        fetch(`/time-entries/${deleteTarget}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
        }).then((res) => {
            if (res.ok) router.reload();
        });
        setDeleteTarget(null);
    }

    const headers = ['Datum', 'Hodiny', ...(showTaskColumn ? ['Úkol'] : []), 'Uživatel', 'Poznámka', ''];

    return (
        <div>
            {/* Summary */}
            <div className="mb-4 flex gap-4">
                {summary.map((item) => (
                    <div
                        key={item.label}
                        className={`rounded-md px-4 py-3 ${
                            item.variant === 'success' ? 'bg-status-success-subtle' : 'bg-status-info-subtle'
                        }`}
                    >
                        <div
                            className={`text-xs font-semibold uppercase tracking-wider ${
                                item.variant === 'success' ? 'text-status-success' : 'text-status-info'
                            }`}
                        >
                            {item.label}
                        </div>
                        <div className="text-lg font-bold text-text-strong">{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Add form */}
            <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Datum</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-36 rounded-md border border-border-default bg-surface-primary px-2 py-1.5 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Hodiny</label>
                    <input
                        type="number"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        step="0.25"
                        min="0.25"
                        max="24"
                        placeholder="0"
                        className="w-20 rounded-md border border-border-default bg-surface-primary px-2 py-1.5 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Poznámka</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Na čem jste pracovali..."
                        className="w-full rounded-md border border-border-default bg-surface-primary px-2 py-1.5 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting || !hours}
                    className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                >
                    + Zalogovat
                </button>
            </form>

            {/* Entries table */}
            {timeEntries.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                {headers.map((h) => (
                                    <th
                                        key={h}
                                        className="border-b-2 border-border-subtle px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeEntries.map((entry) => (
                                <tr key={entry.id} className="transition-colors hover:bg-brand-soft">
                                    <td className="border-b border-border-subtle px-3 py-2 text-sm">
                                        {formatDate(entry.date)}
                                    </td>
                                    <td className="border-b border-border-subtle px-3 py-2 text-sm font-bold text-text-strong">
                                        {entry.hours} h
                                    </td>
                                    {showTaskColumn && (
                                        <td className="border-b border-border-subtle px-3 py-2 text-sm text-text-muted">
                                            {entry.task ? (
                                                <span className="font-medium text-brand-primary">
                                                    {entry.task.title}
                                                </span>
                                            ) : (
                                                <em className="text-text-subtle">Epic</em>
                                            )}
                                        </td>
                                    )}
                                    <td className="border-b border-border-subtle px-3 py-2 text-sm text-text-muted">
                                        {entry.user.name}
                                    </td>
                                    <td className="border-b border-border-subtle px-3 py-2 text-sm text-text-muted">
                                        {entry.note ?? '\u2014'}
                                    </td>
                                    <td className="border-b border-border-subtle px-3 py-2 text-right">
                                        {entry.user.id === currentUserId && (
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="text-xs text-text-subtle transition-colors hover:text-status-danger"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-sm text-text-muted">Zatím žádné záznamy. Přidejte první výše.</p>
            )}
            <ConfirmModal
                open={!!deleteTarget}
                variant="danger"
                title="Smazat záznam"
                message="Opravdu chcete smazat tento časový záznam?"
                confirmLabel="Smazat"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
