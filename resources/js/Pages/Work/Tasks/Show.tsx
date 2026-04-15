import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Avatar from '@/Components/Avatar';
import Button from '@/Components/Button';
import StatusBadge from '@/Components/StatusBadge';
import ActivityTimeline from '@/Components/ActivityTimeline';
import type { ActivityEntry } from '@/Components/ActivityTimeline';
import CommentsSection from '@/Components/CommentsSection';
import InlineDescription from '@/Components/InlineDescription';
import ActionIconButton from '@/Components/ActionIconButton';
import TabBar from '@/Components/TabBar';
import TimeLogSection from '@/Components/TimeLogSection';
import type { TimeEntryData } from '@/Components/TimeLogSection';
import { formatDate, toDateInputValue } from '@/utils/formatDate';
import { displayKey } from '@/utils/displayKey';
import { Link, router, usePage } from '@inertiajs/react';
import { MessageSquare, Pencil, ShieldCheck, Clock, Timer, Copy, Trash2 } from 'lucide-react';
import type { PageProps } from '@/types';
import ConfirmModal from '@/Components/ConfirmModal';
import { useState } from 'react';
import AttachmentList from './components/AttachmentList';
import CollapsibleDependencies from './components/DependenciesPanel';
import RequestApprovalDialog from './components/RequestApprovalDialog';
import SidebarSection from './components/SidebarSection';
import TaskEditDialog from './components/TaskEditDialog';
import type {
    BenefitTypeOption,
    EpicOption,
    Member,
    ProjectTask,
    SelectOption,
    Task,
} from './components/types';

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
    epics: EpicOption[];
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
    epics = [],
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
                epic_id: task.epic?.id ?? '',
                start_date: toDateInputValue(task.start_date),
                due_date: toDateInputValue(task.due_date),
                story_points: task.story_points,
                estimated_hours: task.estimated_hours,
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
                            epics={epics}
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

                            <SidebarSection label="Začátek">
                                <input
                                    type="date"
                                    value={toDateInputValue(task.start_date)}
                                    onChange={(e) => inlineUpdate({ start_date: e.target.value || null })}
                                    className="w-full rounded border border-transparent bg-transparent px-0 py-0.5 text-sm transition-colors hover:border-border-default focus:border-border-focus focus:outline-none"
                                />
                            </SidebarSection>

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

                        {/* Group: Estimation */}
                        <div className="pb-4 mb-4 border-b border-border-subtle space-y-3">
                            <SidebarSection label="Story Points">
                                <div className="flex flex-wrap gap-1">
                                    {[1, 2, 3, 5, 8, 13, 21].map((sp) => (
                                        <button
                                            key={sp}
                                            onClick={() =>
                                                inlineUpdate({
                                                    story_points: task.story_points === sp ? null : sp,
                                                    estimated_hours:
                                                        task.story_points === sp ? null : task.estimated_hours,
                                                })
                                            }
                                            className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                                                task.story_points === sp
                                                    ? 'bg-brand-primary text-text-inverse'
                                                    : sp <= 2
                                                      ? 'bg-status-success-subtle text-status-success hover:bg-status-success-subtle/80'
                                                      : sp <= 5
                                                        ? 'bg-status-warning-subtle text-status-warning hover:bg-status-warning-subtle/80'
                                                        : 'bg-status-danger-subtle text-status-danger hover:bg-status-danger-subtle/80'
                                            }`}
                                        >
                                            {sp}
                                        </button>
                                    ))}
                                </div>
                            </SidebarSection>
                            {task.story_points && (
                                <SidebarSection label="Odhad hodin">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-text-strong">
                                            {task.estimated_hours ?? task.story_points * 4}h
                                        </span>
                                        <span className="text-xs text-text-muted">({task.story_points} SP × 4h)</span>
                                    </div>
                                    {totalHours > 0 && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-text-muted">Odpracováno</span>
                                                <span className="font-semibold text-text-strong">
                                                    {totalHours}h / {task.estimated_hours ?? task.story_points * 4}h
                                                </span>
                                            </div>
                                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        totalHours /
                                                            Number(task.estimated_hours ?? task.story_points * 4) >
                                                        1
                                                            ? 'bg-status-danger'
                                                            : totalHours /
                                                                    Number(
                                                                        task.estimated_hours ?? task.story_points * 4,
                                                                    ) >
                                                                0.8
                                                              ? 'bg-status-warning'
                                                              : 'bg-status-success'
                                                    }`}
                                                    style={{
                                                        width: `${Math.min(100, (totalHours / Number(task.estimated_hours ?? task.story_points * 4)) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </SidebarSection>
                            )}
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
                                !benefitTypes.find((b) => b.value === task.benefit_type)?.hasMoney &&
                                task.benefit_note && (
                                    <SidebarSection label="Poznámka">
                                        <span className="text-sm text-text-muted">{task.benefit_note}</span>
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
