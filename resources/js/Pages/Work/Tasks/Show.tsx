import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import Button from '@/Components/Button';
import StatusBadge from '@/Components/StatusBadge';
import ActivityTimeline from '@/Components/ActivityTimeline';
import type { ActivityEntry } from '@/Components/ActivityTimeline';
import CommentsSection from '@/Components/CommentsSection';
import type { Comment } from '@/Components/CommentsSection';
import InlineDescription from '@/Components/InlineDescription';
import RichTextEditor from '@/Components/RichTextEditor';
import ActionIconButton from '@/Components/ActionIconButton';
import Modal from '@/Components/Modal';
import TabBar from '@/Components/TabBar';
import TimeLogSection from '@/Components/TimeLogSection';
import type { TimeEntryData } from '@/Components/TimeLogSection';
import { formatDate, formatFileSize, toDateInputValue } from '@/utils/formatDate';
import { displayKey } from '@/utils/displayKey';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Paperclip,
    Download,
    Trash2,
    MessageSquare,
    Upload,
    Pencil,
    X,
    ShieldCheck,
    Link2,
    Plus,
    Clock,
    Timer,
    Copy,
    ChevronDown,
} from 'lucide-react';
import type { PageProps } from '@/types';
import ConfirmModal from '@/Components/ConfirmModal';
import { useState, type FormEvent } from 'react';

interface Attachment {
    id: string;
    original_filename: string;
    mime_type: string;
    size: number;
    uploader: { id: string; name: string } | null;
    created_at: string;
}

interface DependencyTask {
    id: string;
    title: string;
    status: string;
    project_id: string;
}

interface Task {
    id: string;
    number: number;
    title: string;
    description: string | null;
    status: string;
    workflow_status: { id: string; name: string; color: string | null; is_done: boolean; is_cancelled: boolean } | null;
    priority: string;
    assignee: { id: string; name: string } | null;
    reporter: { id: string; name: string } | null;
    epic: { id: string; title: string } | null;
    due_date: string | null;
    data_classification: string;
    benefit_type: string | null;
    benefit_amount: string | null;
    benefit_note: string | null;
    root_comments: Comment[];
    attachments: Attachment[];
    blockers: DependencyTask[];
    blocking: DependencyTask[];
    recurrence_rule: string | null;
    recurrence_next_at: string | null;
    attachments_count: number;
    comments_count: number;
    created_at: string;
    updated_at: string;
}

interface Member {
    id: string;
    name: string;
}

interface SelectOption {
    value: string;
    label: string;
}

interface ProjectTask {
    id: string;
    title: string;
}

interface BenefitTypeOption {
    value: string;
    label: string;
    hasMoney: boolean;
}

interface Props {
    project: { id: string; name: string; key: string };
    task: Task;
    hasPendingApproval: boolean;
    allowedTransitions: SelectOption[];
    members: Member[];
    statuses: SelectOption[];
    priorities: SelectOption[];
    activity: ActivityEntry[];
    projectTasks: ProjectTask[];
    recurrenceRules: SelectOption[];
    benefitTypes: BenefitTypeOption[];
    timeEntries: TimeEntryData[];
    totalHours: number;
}

export default function TaskShow({
    project,
    task,
    allowedTransitions,
    members,
    statuses,
    priorities,
    activity,
    projectTasks,
    recurrenceRules,
    benefitTypes = [],
    hasPendingApproval = false,
    timeEntries = [],
    totalHours = 0,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const [editing, setEditing] = useState(false);
    const [requestingApproval, setRequestingApproval] = useState(false);
    const [activeTab, setActiveTab] = useState<'detail' | 'activity' | 'time'>('detail');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const isDone = task.workflow_status?.is_done || task.workflow_status?.is_cancelled || false;

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Backlog', href: `/projects/${project.id}/table` },
        { label: displayKey(project.key, task.number) },
    ];

    function inlineUpdate(fields: Record<string, unknown>) {
        router.put(
            `/projects/${project.id}/tasks/${task.id}`,
            {
                title: task.title,
                description: task.description ?? '',
                workflow_status_id: task.workflow_status?.id ?? '',
                priority: task.priority,
                assignee_id: task.assignee?.id ?? '',
                reporter_id: task.reporter?.id ?? '',
                due_date: toDateInputValue(task.due_date),
                ...fields,
            },
            { preserveScroll: true },
        );
    }

    function handleStatusChange(newStatus: string) {
        fetch(`/projects/${project.id}/tasks/${task.id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    return (
        <AppLayout title={`${displayKey(project.key, task.number)} — ${task.title}`} breadcrumbs={breadcrumbs}>
            <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-8">
                {/* ── Main Column ── */}
                <div className="min-w-0 flex-1 space-y-5">
                    {/* Header card */}
                    <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Úkol</span>
                        <div className="mt-0.5 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <h1 className="text-xl md:text-2xl font-bold leading-tight text-text-strong">
                                    <span className="mr-2 text-text-muted">{displayKey(project.key, task.number)}</span>
                                    {task.title}
                                </h1>
                            </div>
                            {!isDone && (
                                <div className="sm:ml-auto flex items-center gap-1">
                                    <ActionIconButton
                                        onClick={() => setRequestingApproval(true)}
                                        label="Žádost o schválení"
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                    </ActionIconButton>
                                    <ActionIconButton onClick={() => setEditing(true)} label="Upravit">
                                        <Pencil className="h-4 w-4" />
                                    </ActionIconButton>
                                    <ActionIconButton
                                        onClick={() =>
                                            router.post(`/projects/${project.id}/tasks/${task.id}/duplicate`)
                                        }
                                        label="Duplikovat"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </ActionIconButton>
                                    <ActionIconButton
                                        onClick={() => setShowDeleteModal(true)}
                                        label="Smazat"
                                        variant="danger"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </ActionIconButton>
                                </div>
                            )}
                        </div>

                        {/* Description — inline editable */}
                        <InlineDescription
                            content={task.description}
                            updateUrl={`/projects/${project.id}/tasks/${task.id}`}
                            readonly={isDone}
                        />

                        {/* Metadata strip */}
                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-border-subtle pt-4 text-xs text-text-muted">
                            <span>
                                Vytvořil/a{' '}
                                <strong className="text-text-default">{task.reporter?.name ?? '\u2014'}</strong>
                            </span>
                            <span>
                                Vytvořeno <strong className="text-text-default">{formatDate(task.created_at)}</strong>
                            </span>
                            <span>
                                Aktualizováno{' '}
                                <strong className="text-text-default">{formatDate(task.updated_at)}</strong>
                            </span>
                            {task.data_classification === 'phi' && (
                                <span className="rounded bg-status-warning-subtle px-1.5 py-0.5 text-xs font-bold tracking-wide text-status-warning">
                                    PHI
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Dependencies — collapsible section */}
                    <CollapsibleDependencies project={project} task={task} projectTasks={projectTasks} />

                    {editing && (
                        <TaskEditDialog
                            project={project}
                            task={task}
                            members={members}
                            statuses={statuses}
                            priorities={priorities}
                            onClose={() => setEditing(false)}
                        />
                    )}

                    {requestingApproval && (
                        <RequestApprovalDialog
                            projectId={project.id}
                            taskId={task.id}
                            members={members}
                            onClose={() => setRequestingApproval(false)}
                        />
                    )}

                    {/* Tab navigation */}
                    <TabBar
                        tabs={[
                            { key: 'detail', label: 'Detail', icon: MessageSquare, badge: task.comments_count },
                            { key: 'activity', label: 'Aktivita', icon: Clock, badge: activity.length },
                            { key: 'time', label: 'Čas', icon: Timer, badge: `${totalHours}h` },
                        ]}
                        activeTab={activeTab}
                        onChange={(key) => setActiveTab(key as 'detail' | 'activity' | 'time')}
                    />

                    {/* Tab content */}
                    {activeTab === 'detail' && (
                        <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-strong">
                                <MessageSquare className="h-4 w-4" />
                                Komentáře
                            </h2>

                            <CommentsSection
                                comments={task.root_comments}
                                commentsCount={task.comments_count}
                                postUrl={`/projects/${project.id}/tasks/${task.id}/comments`}
                                showHeader={false}
                            />
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                            <ActivityTimeline entries={activity} />
                        </div>
                    )}

                    {activeTab === 'time' && (
                        <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                            <TimeLogSection
                                timeEntries={timeEntries}
                                totalHours={totalHours}
                                postUrl={`/projects/${project.id}/tasks/${task.id}/time-entries`}
                                exportUrl={`/projects/${project.id}/tasks/${task.id}/export/time`}
                                currentUserId={auth.user?.id}
                            />
                        </div>
                    )}
                </div>

                {/* ── Right Sidebar ── */}
                <div className="w-full lg:w-72 lg:flex-shrink-0">
                    <div className="lg:sticky lg:top-20 max-h-[calc(100vh-6rem)] space-y-0 overflow-y-auto rounded-lg border border-border-subtle bg-surface-primary p-3 sm:p-5">
                        {/* Group: Status + Priority */}
                        <div className="pb-4 mb-4 border-b border-border-subtle">
                            <SidebarSection label="Stav">
                                <StatusBadge
                                    label={task.workflow_status?.name ?? '—'}
                                    color={task.workflow_status?.color ?? null}
                                />
                                {hasPendingApproval && (
                                    <p className="mt-2 rounded bg-status-warning-subtle px-2 py-1 text-xs text-status-warning">
                                        Čeká na schválení — změna stavu blokována
                                    </p>
                                )}
                                {allowedTransitions.length > 0 && !hasPendingApproval && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {allowedTransitions.map((t) => (
                                            <Button
                                                key={t.value}
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleStatusChange(t.value)}
                                            >
                                                &rarr; {t.label}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </SidebarSection>
                            <div className="mt-4">
                                <SidebarSection label="Priorita">
                                    <select
                                        value={task.priority}
                                        onChange={(e) => inlineUpdate({ priority: e.target.value })}
                                        className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm font-medium transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                    >
                                        {priorities.map((p) => (
                                            <option key={p.value} value={p.value}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                </SidebarSection>
                            </div>
                        </div>

                        {/* Group: People */}
                        <div className="pb-4 mb-4 border-b border-border-subtle">
                            <SidebarSection label="Řešitel">
                                <select
                                    value={task.assignee?.id ?? ''}
                                    onChange={(e) => inlineUpdate({ assignee_id: e.target.value || null })}
                                    className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                >
                                    <option value="">Nepřiřazeno</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </SidebarSection>
                            <div className="mt-4">
                                <SidebarSection label="Zadavatel">
                                    {task.reporter ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar name={task.reporter.name} />
                                            <span className="text-sm text-text-default">{task.reporter.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-text-muted">{'\u2014'}</span>
                                    )}
                                </SidebarSection>
                            </div>
                        </div>

                        {/* Group: Context */}
                        <div className="pb-4 mb-4 border-b border-border-subtle space-y-4">
                            <SidebarSection label="Projekt">
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="text-sm text-brand-primary no-underline hover:underline"
                                >
                                    {project.name}
                                </Link>
                            </SidebarSection>

                            {task.epic && (
                                <SidebarSection label="Epic">
                                    <Link
                                        href={`/projects/${project.id}/epics/${task.epic.id}`}
                                        className="text-sm text-brand-primary no-underline hover:underline"
                                    >
                                        {task.epic.title}
                                    </Link>
                                </SidebarSection>
                            )}

                            <SidebarSection label="Termín">
                                <input
                                    type="date"
                                    value={toDateInputValue(task.due_date)}
                                    onChange={(e) => inlineUpdate({ due_date: e.target.value || null })}
                                    className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                />
                            </SidebarSection>

                            <SidebarSection label="Opakování">
                                <select
                                    value={task.recurrence_rule ?? ''}
                                    onChange={(e) => {
                                        fetch(`/projects/${project.id}/tasks/${task.id}/recurrence`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN':
                                                    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                                                        ?.content ?? '',
                                                Accept: 'application/json',
                                            },
                                            body: JSON.stringify({ recurrence_rule: e.target.value || null }),
                                        }).then((res) => {
                                            if (res.ok) router.reload();
                                        });
                                    }}
                                    className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                >
                                    <option value="">Bez opakování</option>
                                    {recurrenceRules.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                                {task.recurrence_next_at && (
                                    <p className="mt-1 text-xs text-text-muted">
                                        Next: {formatDate(task.recurrence_next_at)}
                                    </p>
                                )}
                            </SidebarSection>
                        </div>

                        {/* Group: Classification */}
                        <div className="pb-4 mb-4 border-b border-border-subtle">
                            <SidebarSection label="Klasifikace dat">
                                <span
                                    className={`rounded px-2 py-0.5 text-sm font-semibold ${
                                        task.data_classification === 'phi'
                                            ? 'bg-status-warning-subtle text-status-warning'
                                            : 'bg-status-neutral-subtle text-text-muted'
                                    }`}
                                >
                                    {task.data_classification.toUpperCase()}
                                </span>
                            </SidebarSection>
                        </div>

                        {/* Group: Benefit */}
                        <div className="pb-4 mb-4 border-b border-border-subtle space-y-3">
                            <SidebarSection label="Přínos">
                                <select
                                    value={task.benefit_type ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value || null;
                                        inlineUpdate({
                                            benefit_type: val,
                                            benefit_amount: null,
                                            benefit_note: null,
                                        });
                                    }}
                                    className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                >
                                    <option value="">Bez přínosu</option>
                                    {benefitTypes.map((b) => (
                                        <option key={b.value} value={b.value}>
                                            {b.label}
                                        </option>
                                    ))}
                                </select>
                            </SidebarSection>
                            {task.benefit_type && benefitTypes.find((b) => b.value === task.benefit_type)?.hasMoney && (
                                <SidebarSection label="Částka (Kč)">
                                    <input
                                        type="number"
                                        value={task.benefit_amount ?? ''}
                                        onChange={(e) =>
                                            inlineUpdate({
                                                benefit_amount: e.target.value || null,
                                            })
                                        }
                                        placeholder="0"
                                        className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                    />
                                </SidebarSection>
                            )}
                            {task.benefit_type &&
                                !benefitTypes.find((b) => b.value === task.benefit_type)?.hasMoney && (
                                    <SidebarSection label="Odůvodnění">
                                        <textarea
                                            value={task.benefit_note ?? ''}
                                            onChange={(e) =>
                                                inlineUpdate({
                                                    benefit_note: e.target.value || null,
                                                })
                                            }
                                            rows={2}
                                            placeholder="Textové odůvodnění..."
                                            className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                        />
                                    </SidebarSection>
                                )}
                        </div>

                        {/* Group: Attachments */}
                        <div>
                            <SidebarSection label={`Přílohy (${task.attachments_count})`}>
                                <AttachmentList
                                    attachments={task.attachments}
                                    projectId={project.id}
                                    taskId={task.id}
                                    currentUserId={auth.user?.id}
                                />
                            </SidebarSection>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmModal
                open={showDeleteModal}
                variant="danger"
                title="Smazat úkol"
                message="Opravdu chcete smazat tento úkol? Tuto akci nelze vrátit."
                confirmLabel="Smazat"
                onConfirm={() => router.delete(`/projects/${project.id}/tasks/${task.id}`)}
                onCancel={() => setShowDeleteModal(false)}
            />
        </AppLayout>
    );
}

function TaskEditDialog({
    project,
    task,
    members,
    statuses,
    priorities,
    onClose,
}: {
    project: { id: string };
    task: Task;
    members: Member[];
    statuses: SelectOption[];
    priorities: SelectOption[];
    onClose: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm({
        title: task.title,
        description: task.description ?? '',
        workflow_status_id: task.workflow_status?.id ?? '',
        priority: task.priority,
        assignee_id: task.assignee?.id ?? '',
        reporter_id: task.reporter?.id ?? '',
        due_date: toDateInputValue(task.due_date),
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/projects/${project.id}/tasks/${task.id}`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <Modal open onClose={onClose} size="max-w-lg" showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Upravit úkol</h2>
                <button onClick={onClose} className="rounded p-2 text-text-muted hover:bg-surface-hover">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <EditField label="Název *" error={errors.title}>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </EditField>

                <EditField label="Popis" error={errors.description}>
                    <div className="mt-1">
                        <RichTextEditor
                            content={data.description}
                            onChange={(html) => setData('description', html)}
                            placeholder="Popis úkolu..."
                        />
                    </div>
                </EditField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditField label="Stav" error={errors.workflow_status_id}>
                        <select
                            value={data.workflow_status_id}
                            onChange={(e) => setData('workflow_status_id', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </EditField>

                    <EditField label="Priorita" error={errors.priority}>
                        <select
                            value={data.priority}
                            onChange={(e) => setData('priority', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            {priorities.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </EditField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditField label="Řešitel" error={errors.assignee_id}>
                        <select
                            value={data.assignee_id}
                            onChange={(e) => setData('assignee_id', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            <option value="">Nepřiřazeno</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </EditField>

                    <EditField label="Zadavatel" error={errors.reporter_id}>
                        <select
                            value={data.reporter_id}
                            onChange={(e) => setData('reporter_id', e.target.value)}
                            className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                        >
                            <option value="">—</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </EditField>
                </div>

                <EditField label="Termín" error={errors.due_date}>
                    <input
                        type="date"
                        value={data.due_date}
                        onChange={(e) => setData('due_date', e.target.value)}
                        className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </EditField>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
                    >
                        Zrušit
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                    >
                        Uložit změny
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function EditField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-text-default">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        </div>
    );
}

function RequestApprovalDialog({
    projectId,
    taskId,
    members,
    onClose,
}: {
    projectId: string;
    taskId: string;
    members: Member[];
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm<{
        task_id: string;
        approver_ids: string[];
        description: string;
        expires_at: string;
    }>({
        task_id: taskId,
        approver_ids: [],
        description: '',
        expires_at: '',
    });

    function toggleApprover(id: string) {
        setData(
            'approver_ids',
            data.approver_ids.includes(id) ? data.approver_ids.filter((a) => a !== id) : [...data.approver_ids, id],
        );
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post(`/projects/${projectId}/approvals`, {
            onSuccess: () => onClose(),
        });
    }

    return (
        <Modal open onClose={onClose} size="max-w-lg" showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Žádost o schválení</h2>
                <button onClick={onClose} className="rounded p-2 text-text-muted hover:bg-surface-hover">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <EditField label="Popis" error={errors.description}>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={2}
                        placeholder="Co potřebuje schválení?"
                        className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </EditField>

                <div>
                    <label className="block text-xs font-medium text-text-default">Schvalovatelé *</label>
                    {errors.approver_ids && <p className="mt-1 text-xs text-status-danger">{errors.approver_ids}</p>}
                    <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border-default p-2">
                        {members.map((m) => (
                            <label
                                key={m.id}
                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-hover"
                            >
                                <input
                                    type="checkbox"
                                    checked={data.approver_ids.includes(m.id)}
                                    onChange={() => toggleApprover(m.id)}
                                    className="rounded border-border-default"
                                />
                                <span className="text-text-default">{m.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <EditField label="Platnost do" error={errors.expires_at}>
                    <input
                        type="datetime-local"
                        value={data.expires_at}
                        onChange={(e) => setData('expires_at', e.target.value)}
                        className="mt-1 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                </EditField>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
                    >
                        Zrušit
                    </button>
                    <button
                        type="submit"
                        disabled={processing || data.approver_ids.length === 0}
                        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                    >
                        Odeslat žádost
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function DependenciesPanel({
    project,
    task,
    projectTasks,
}: {
    project: { id: string };
    task: Task;
    projectTasks: ProjectTask[];
}) {
    const [adding, setAdding] = useState(false);
    const [selectedId, setSelectedId] = useState('');

    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    function addBlocker() {
        if (!selectedId) return;
        fetch(`/projects/${project.id}/tasks/${task.id}/dependencies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' },
            body: JSON.stringify({ blocker_id: selectedId }),
        }).then((res) => {
            if (res.ok) {
                setAdding(false);
                setSelectedId('');
                router.reload();
            }
        });
    }

    function removeBlocker(blockerId: string) {
        fetch(`/projects/${project.id}/tasks/${task.id}/dependencies/${blockerId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken, Accept: 'application/json' },
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    const existingIds = new Set([...task.blockers.map((b) => b.id), ...task.blocking.map((b) => b.id), task.id]);
    const available = projectTasks.filter((t) => !existingIds.has(t.id));

    return (
        <div className="space-y-2">
            {task.blockers.length > 0 && (
                <div>
                    <div className="mb-1 text-xs text-text-subtle">Blokováno</div>
                    {task.blockers.map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 py-0.5">
                            <Link2 className="h-3 w-3 flex-shrink-0 text-status-danger" />
                            <Link
                                href={`/projects/${b.project_id}/tasks/${b.id}`}
                                className="truncate text-xs text-text-default no-underline hover:text-brand-primary"
                            >
                                {b.title}
                            </Link>
                            <button
                                onClick={() => removeBlocker(b.id)}
                                className="ml-auto rounded p-1.5 text-text-subtle hover:bg-status-danger-subtle hover:text-status-danger"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {task.blocking.length > 0 && (
                <div>
                    <div className="mb-1 text-xs text-text-subtle">Blokuje</div>
                    {task.blocking.map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 py-0.5">
                            <Link2 className="h-3 w-3 flex-shrink-0 text-status-warning" />
                            <Link
                                href={`/projects/${b.project_id}/tasks/${b.id}`}
                                className="truncate text-xs text-text-default no-underline hover:text-brand-primary"
                            >
                                {b.title}
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {adding ? (
                <div className="space-y-1">
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full rounded border border-border-default bg-surface-primary px-2 py-1 text-xs focus:border-border-focus focus:outline-none"
                    >
                        <option value="">Vyberte blokaci...</option>
                        {available.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
                        ))}
                    </select>
                    <div className="flex gap-1">
                        <button
                            onClick={addBlocker}
                            disabled={!selectedId}
                            className="rounded bg-brand-primary px-2 py-1 text-xs text-text-inverse disabled:opacity-50"
                        >
                            Přidat
                        </button>
                        <button
                            onClick={() => setAdding(false)}
                            className="rounded px-1 py-1 text-xs text-text-muted hover:bg-surface-hover"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-primary"
                >
                    <Plus className="h-3 w-3" />
                    Přidat blokaci
                </button>
            )}
        </div>
    );
}

function CollapsibleDependencies({
    project,
    task,
    projectTasks,
}: {
    project: { id: string };
    task: Task;
    projectTasks: ProjectTask[];
}) {
    const [open, setOpen] = useState(true);
    const total = task.blockers.length + task.blocking.length;

    return (
        <div className="overflow-hidden rounded-lg border border-border-subtle">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between bg-surface-secondary px-4 py-2.5"
            >
                <div className="flex items-center gap-2">
                    <ChevronDown
                        className={`h-3.5 w-3.5 text-text-subtle transition-transform ${open ? '' : '-rotate-90'}`}
                    />
                    <span className="text-sm font-semibold text-text-strong">Závislosti</span>
                    {total > 0 && (
                        <span
                            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                                task.blockers.length > 0
                                    ? 'bg-status-danger-subtle text-status-danger'
                                    : 'bg-border-subtle text-text-muted'
                            }`}
                        >
                            {total}
                        </span>
                    )}
                    {total === 0 && <span className="text-xs text-text-subtle">Žádné závislosti</span>}
                </div>
            </button>
            {open && (
                <div className="bg-surface-primary px-4 py-3">
                    <DependenciesPanel project={project} task={task} projectTasks={projectTasks} />
                </div>
            )}
        </div>
    );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">{label}</div>
            {children}
        </div>
    );
}

function AttachmentList({
    attachments,
    projectId,
    taskId,
    currentUserId,
}: {
    attachments: Attachment[];
    projectId: string;
    taskId: string;
    currentUserId?: string;
}) {
    const [uploading, setUploading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        fetch(`/projects/${projectId}/tasks/${taskId}/attachments`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'text/html',
            },
            body: formData,
        }).then(() => {
            setUploading(false);
            router.reload();
        });
    }

    function handleDelete(attachmentId: string) {
        setDeleteTarget(attachmentId);
    }

    return (
        <div className="space-y-2">
            {attachments.map((att) => (
                <div
                    key={att.id}
                    className="flex items-center gap-2 rounded border border-border-subtle px-3 py-2 text-xs"
                >
                    <Paperclip className="h-3 w-3 flex-shrink-0 text-text-muted" />
                    <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-text-strong">{att.original_filename}</div>
                        <div className="text-text-muted">{formatFileSize(att.size)}</div>
                    </div>
                    <a
                        href={`/attachments/${att.id}/download`}
                        className="rounded p-2 text-text-muted hover:bg-surface-hover hover:text-text-default"
                    >
                        <Download className="h-3 w-3" />
                    </a>
                    {att.uploader?.id === currentUserId && (
                        <button
                            onClick={() => handleDelete(att.id)}
                            className="rounded p-2 text-text-muted hover:bg-status-danger-subtle hover:text-status-danger"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    )}
                </div>
            ))}

            <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-border-default px-3 py-2 text-xs text-text-muted transition-colors hover:border-brand-primary hover:text-brand-primary">
                <Upload className="h-3 w-3" />
                {uploading ? 'Nahrávání...' : 'Nahrát soubor'}
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <ConfirmModal
                open={!!deleteTarget}
                variant="danger"
                title="Smazat přílohu"
                message="Opravdu chcete smazat tuto přílohu?"
                confirmLabel="Smazat"
                onConfirm={() => {
                    if (deleteTarget) router.delete(`/attachments/${deleteTarget}`);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
