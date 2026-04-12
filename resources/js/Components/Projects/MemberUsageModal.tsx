import Modal from '@/Components/Modal';
import Spinner from '@/Components/Spinner';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, CheckCircle2, Clock, FolderKanban, Info, MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Member {
    id: string;
    name: string;
    email: string;
    pivot: { role: string };
}

interface TaskRow {
    id: string;
    number: number;
    title: string;
    status: string;
    due_date: string | null;
}

interface ReassignableMember {
    id: string;
    name: string;
    role: string;
}

interface UsageData {
    member: { id: string; name: string; email: string };
    open_tasks: number;
    done_tasks: number;
    hours: number;
    comments: number;
    tasks: TaskRow[];
    reassignable_members: ReassignableMember[];
}

interface Props {
    projectId: string;
    member: Member;
    onClose: () => void;
}

type View = 'summary' | 'reassign';

const ROLE_LABELS: Record<string, string> = {
    owner: 'Vlastník',
    admin: 'Admin',
    contributor: 'Contributor',
    viewer: 'Viewer',
};

export default function MemberUsageModal({ projectId, member, onClose }: Props) {
    const [data, setData] = useState<UsageData | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [view, setView] = useState<View>('summary');
    const [reassignments, setReassignments] = useState<Record<string, string>>({});
    const [bulkTarget, setBulkTarget] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        axios
            .get<UsageData>(`/projects/${projectId}/members/${member.id}/usage`)
            .then((res) => {
                if (!cancelled) {
                    setData(res.data);
                    setLoaded(true);
                }
            })
            .catch(() => {
                if (!cancelled) setLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, [projectId, member.id]);

    const allReassigned = useMemo(() => {
        if (!data) return false;
        return data.tasks.every((t) => !!reassignments[t.id]);
    }, [data, reassignments]);

    function applyBulk() {
        if (!data || !bulkTarget) return;
        const next: Record<string, string> = { ...reassignments };
        data.tasks.forEach((t) => {
            next[t.id] = bulkTarget;
        });
        setReassignments(next);
    }

    function handleRemove() {
        if (!data) return;
        setSubmitting(true);
        router.delete(`/projects/${projectId}/members/${member.id}`, {
            data: { reassignments },
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
            onSuccess: () => onClose(),
        });
    }

    return (
        <Modal open onClose={onClose} size="max-w-2xl">
            {!loaded || !data ? (
                <div className="flex items-center justify-center py-12">
                    <Spinner size="md" />
                </div>
            ) : view === 'summary' ? (
                <SummaryView
                    data={data}
                    member={member}
                    onClose={onClose}
                    onReassign={() => setView('reassign')}
                    onRemove={handleRemove}
                    submitting={submitting}
                />
            ) : (
                <ReassignView
                    data={data}
                    reassignments={reassignments}
                    setReassignments={setReassignments}
                    bulkTarget={bulkTarget}
                    setBulkTarget={setBulkTarget}
                    onApplyBulk={applyBulk}
                    allReassigned={allReassigned}
                    onBack={() => setView('summary')}
                    onConfirm={handleRemove}
                    submitting={submitting}
                />
            )}
        </Modal>
    );
}

function SummaryView({
    data,
    member,
    onClose,
    onReassign,
    onRemove,
    submitting,
}: {
    data: UsageData;
    member: Member;
    onClose: () => void;
    onReassign: () => void;
    onRemove: () => void;
    submitting: boolean;
}) {
    const blocked = data.open_tasks > 0;
    const hasActivity = data.open_tasks > 0 || data.done_tasks > 0 || data.hours > 0 || data.comments > 0;

    return (
        <div>
            <div className="mb-4 flex items-center gap-3 border-b border-border-subtle pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-hover">
                    {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                </div>
                <div>
                    <h3 className="text-base font-bold text-text-strong">{member.name}</h3>
                    <div className="text-xs text-text-muted">
                        {ROLE_LABELS[member.pivot.role] ?? member.pivot.role} · {member.email}
                    </div>
                </div>
            </div>

            {blocked ? (
                <div className="mb-4 flex gap-2 rounded-md border border-status-warning/30 bg-status-warning-subtle px-3 py-2.5 text-xs text-status-warning">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <div>
                        <strong className="font-bold">Tohoto člena nelze rovnou odebrat.</strong>
                        <br />
                        Má v projektu {data.open_tasks} {data.open_tasks === 1 ? 'otevřený úkol' : 'otevřených úkolů'}.
                        Před odebráním je nutné je přeřadit jinému členovi nebo uzavřít.
                    </div>
                </div>
            ) : hasActivity ? (
                <div className="mb-4 flex gap-2 rounded-md border border-status-info/20 bg-status-info-subtle px-3 py-2.5 text-xs text-status-info">
                    <Info className="h-4 w-4 shrink-0" />
                    <div>
                        <strong className="font-bold">Tohoto člena lze odebrat.</strong>
                        <br />
                        Historie (dokončené úkoly, zalogovaný čas, komentáře) zůstane v projektu pro reporting a audit.
                    </div>
                </div>
            ) : (
                <div className="mb-4 flex gap-2 rounded-md border border-status-info/20 bg-status-info-subtle px-3 py-2.5 text-xs text-status-info">
                    <Info className="h-4 w-4 shrink-0" />
                    <div>Tento člen nemá v projektu žádnou aktivitu. Lze ho bezpečně odebrat.</div>
                </div>
            )}

            {hasActivity && (
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <UsageCard
                        icon={<FolderKanban className="h-3 w-3" />}
                        label="Otevřené úkoly"
                        value={data.open_tasks}
                        alert={data.open_tasks > 0}
                    />
                    <UsageCard icon={<CheckCircle2 className="h-3 w-3" />} label="Dokončené" value={data.done_tasks} />
                    <UsageCard icon={<Clock className="h-3 w-3" />} label="Čas" value={`${data.hours} h`} />
                    <UsageCard icon={<MessageSquare className="h-3 w-3" />} label="Komentáře" value={data.comments} />
                </div>
            )}

            {blocked && (
                <div>
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-subtle">
                        Otevřené úkoly
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-md border border-border-subtle">
                        {data.tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center gap-2 border-b border-border-subtle px-3 py-2 text-sm last:border-b-0"
                            >
                                <span className="font-mono text-xs font-bold text-text-muted">#{task.number}</span>
                                <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-text-muted">
                                    {task.status}
                                </span>
                                <span className="flex-1 text-text-default">{task.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-5 flex justify-between gap-2 border-t border-border-subtle pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-border-default bg-surface-secondary px-4 py-2 text-sm font-semibold text-text-default hover:bg-surface-hover"
                >
                    Zavřít
                </button>
                <div className="flex gap-2">
                    {blocked ? (
                        <button
                            type="button"
                            onClick={onReassign}
                            className="rounded-md border border-border-default bg-surface-secondary px-4 py-2 text-sm font-semibold text-text-default hover:bg-surface-hover"
                        >
                            Přeřadit úkoly
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={onRemove}
                            className="rounded-md bg-status-danger px-4 py-2 text-sm font-semibold text-white hover:bg-status-danger/90 disabled:opacity-50"
                        >
                            {submitting ? 'Odebírám...' : 'Odebrat člena'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReassignView({
    data,
    reassignments,
    setReassignments,
    bulkTarget,
    setBulkTarget,
    onApplyBulk,
    allReassigned,
    onBack,
    onConfirm,
    submitting,
}: {
    data: UsageData;
    reassignments: Record<string, string>;
    setReassignments: (r: Record<string, string>) => void;
    bulkTarget: string;
    setBulkTarget: (v: string) => void;
    onApplyBulk: () => void;
    allReassigned: boolean;
    onBack: () => void;
    onConfirm: () => void;
    submitting: boolean;
}) {
    const reassignedCount = data.tasks.filter((t) => !!reassignments[t.id]).length;
    const memberOptions = data.reassignable_members;

    return (
        <div>
            <div className="mb-4 border-b border-border-subtle pb-4">
                <h3 className="text-base font-bold text-text-strong">Přeřadit úkoly před odebráním</h3>
                <div className="mt-1 text-xs text-text-muted">
                    {data.member.name} má v projektu <strong className="text-text-default">{data.open_tasks}</strong>{' '}
                    {data.open_tasks === 1 ? 'otevřený úkol' : 'otevřených úkolů'}. Každý je nutné přeřadit jinému
                    členovi projektu.
                </div>
            </div>

            {/* Bulk bar */}
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border-subtle bg-surface-secondary px-3 py-2">
                <span className="text-xs text-text-muted">
                    Přeřadit <strong>všechny</strong> najednou na:
                </span>
                <select
                    value={bulkTarget}
                    onChange={(e) => setBulkTarget(e.target.value)}
                    className="rounded-md border border-border-default bg-surface-primary px-2 py-1 text-xs text-text-default"
                >
                    <option value="">Vyberte člena...</option>
                    {memberOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.name} ({ROLE_LABELS[m.role] ?? m.role})
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    disabled={!bulkTarget}
                    onClick={onApplyBulk}
                    className="rounded-md bg-brand-primary px-3 py-1 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
                >
                    Použít na vše
                </button>
            </div>

            {/* Task list */}
            <div className="max-h-80 overflow-y-auto rounded-md border border-border-subtle">
                {data.tasks.map((task) => {
                    const assigned = reassignments[task.id];
                    return (
                        <div
                            key={task.id}
                            className={`flex items-center gap-3 border-b border-border-subtle px-3 py-2.5 last:border-b-0 ${
                                assigned ? 'bg-status-success-subtle/40' : ''
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-text-muted">
                                        #{task.number}
                                    </span>
                                    <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-text-muted">
                                        {task.status}
                                    </span>
                                </div>
                                <div className="mt-0.5 truncate text-sm text-text-default">{task.title}</div>
                                {task.due_date && (
                                    <div className="text-[11px] text-text-subtle">Termín: {task.due_date}</div>
                                )}
                            </div>
                            <div className="shrink-0">
                                <select
                                    value={assigned ?? ''}
                                    onChange={(e) => setReassignments({ ...reassignments, [task.id]: e.target.value })}
                                    className={`rounded-md border bg-surface-primary px-2 py-1 text-xs ${
                                        assigned
                                            ? 'border-status-success text-status-success'
                                            : 'border-border-default text-text-muted'
                                    }`}
                                >
                                    <option value="">Vyberte...</option>
                                    {memberOptions.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-border-subtle pt-4">
                <div className="text-xs text-text-muted">
                    {allReassigned && <span className="text-status-success">✓ </span>}
                    <strong className="text-text-default">
                        {reassignedCount} / {data.tasks.length}
                    </strong>{' '}
                    úkolů přeřazeno
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-md border border-border-default bg-surface-secondary px-4 py-2 text-sm font-semibold text-text-default hover:bg-surface-hover"
                    >
                        Zpět
                    </button>
                    <button
                        type="button"
                        disabled={!allReassigned || submitting}
                        onClick={onConfirm}
                        className="rounded-md bg-status-danger px-4 py-2 text-sm font-semibold text-white hover:bg-status-danger/90 disabled:opacity-50"
                    >
                        {submitting ? 'Odebírám...' : 'Potvrdit a odebrat'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function UsageCard({
    icon,
    label,
    value,
    alert,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    alert?: boolean;
}) {
    return (
        <div
            className={`rounded-md border px-3 py-2 ${
                alert
                    ? 'border-status-warning/30 bg-status-warning-subtle'
                    : 'border-border-subtle bg-surface-secondary'
            }`}
        >
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                {icon}
                {label}
            </div>
            <div className={`mt-0.5 text-xl font-bold ${alert ? 'text-status-warning' : 'text-text-strong'}`}>
                {value}
            </div>
        </div>
    );
}
