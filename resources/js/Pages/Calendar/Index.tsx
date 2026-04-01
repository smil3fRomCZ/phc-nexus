import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { formatMonthYear } from '@/utils/formatDate';
import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    priority: string;
    due_date: string;
    project: { id: string; name: string; key: string } | null;
    workflow_status: { id: string; name: string; color: string | null; is_done: boolean; is_cancelled: boolean } | null;
}

interface Props {
    tasks: Task[];
    month: string; // "YYYY-MM"
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Kalendář' }];

const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const PRIORITY_DOT: Record<string, string> = {
    urgent: 'bg-status-danger',
    high: 'bg-status-warning',
    medium: 'bg-brand-primary',
    low: 'bg-status-neutral',
};

function parseMonth(month: string): Date {
    const [y, m] = month.split('-').map(Number);
    return new Date(y, m - 1, 1);
}

function formatMonthLabel(date: Date): string {
    return formatMonthYear(date);
}

function shiftMonth(month: string, delta: number): string {
    const d = parseMonth(month);
    d.setMonth(d.getMonth() + delta);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface DayCell {
    date: number;
    inMonth: boolean;
    iso: string;
    isToday: boolean;
}

function buildCalendarGrid(month: string): DayCell[] {
    const first = parseMonth(month);
    const year = first.getFullYear();
    const m = first.getMonth();
    const daysInMonth = new Date(year, m + 1, 0).getDate();

    // Monday = 0, Sunday = 6
    let startDay = first.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cells: DayCell[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, m, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        cells.push({ date: d, inMonth: false, iso: '', isToday: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ date: d, inMonth: true, iso, isToday: iso === todayIso });
    }

    // Next month padding
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
        for (let d = 1; d <= remaining; d++) {
            cells.push({ date: d, inMonth: false, iso: '', isToday: false });
        }
    }

    return cells;
}

export default function CalendarIndex({ tasks, month }: Props) {
    const cells = buildCalendarGrid(month);
    const monthDate = parseMonth(month);

    const tasksByDate = new Map<string, Task[]>();
    for (const task of tasks) {
        const date = task.due_date;
        if (!tasksByDate.has(date)) tasksByDate.set(date, []);
        tasksByDate.get(date)!.push(task);
    }

    function navigate(delta: number) {
        router.get('/calendar', { month: shiftMonth(month, delta) }, { preserveState: true });
    }

    return (
        <AppLayout title="Kalendář" breadcrumbs={BREADCRUMBS}>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">Kalendář</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-md border border-border-default p-1.5 text-text-muted transition-colors hover:bg-surface-hover"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[10rem] text-center text-base font-semibold capitalize text-text-strong">
                        {formatMonthLabel(monthDate)}
                    </span>
                    <button
                        onClick={() => navigate(1)}
                        className="rounded-md border border-border-default p-1.5 text-text-muted transition-colors hover:bg-surface-hover"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => router.get('/calendar', {}, { preserveState: true })}
                        className="rounded-md border border-border-default px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-hover"
                    >
                        Dnes
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-primary">
                {/* Day names */}
                <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-secondary">
                    {DAY_NAMES.map((d) => (
                        <div
                            key={d}
                            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-subtle"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Cells */}
                <div className="grid grid-cols-7">
                    {cells.map((cell, i) => {
                        const dayTasks = cell.iso ? (tasksByDate.get(cell.iso) ?? []) : [];
                        return (
                            <div
                                key={i}
                                className={`min-h-[6rem] border-b border-r border-border-subtle p-1.5 ${
                                    !cell.inMonth ? 'bg-surface-secondary/50' : ''
                                } ${cell.isToday ? 'bg-brand-soft' : ''}`}
                            >
                                <div
                                    className={`mb-1 text-xs font-medium ${
                                        cell.isToday
                                            ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-text-inverse'
                                            : cell.inMonth
                                              ? 'text-text-default'
                                              : 'text-text-subtle'
                                    }`}
                                >
                                    {cell.date}
                                </div>
                                <div className="space-y-0.5">
                                    {dayTasks.map((task) => (
                                        <Link
                                            key={task.id}
                                            href={task.project ? `/projects/${task.project.id}/tasks/${task.id}` : '#'}
                                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-xs no-underline transition-colors hover:bg-surface-hover ${task.workflow_status?.is_done ? 'opacity-50 line-through' : 'text-text-default'}`}
                                        >
                                            <span
                                                className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-status-neutral'}`}
                                            />
                                            <span className="truncate">{task.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
