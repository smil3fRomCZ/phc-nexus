import Avatar from '@/Components/Avatar';
import StatusBadge from '@/Components/StatusBadge';
import { getPriority } from '@/constants/priority';
import { displayKey } from '@/utils/displayKey';
import { formatDate } from '@/utils/formatDate';
import { Link } from '@inertiajs/react';
import { Layers, MessageSquare, ShieldAlert } from 'lucide-react';
import type { DragEvent } from 'react';

export interface BoardTask {
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    data_classification: string;
    due_date: string | null;
    comments_count: number;
    story_points: number | null;
    assignee: { id: string; name: string } | null;
    reporter: { id: string; name: string } | null;
    epic: { id: string; title: string } | null;
    workflow_status: { id: string; name: string; color: string | null } | null;
}

interface Props {
    task: BoardTask;
    projectId: string;
    projectKey: string;
    cardFields: string[];
    isDragging: boolean;
    isDone: boolean;
    onDragStart: (e: DragEvent, taskId: string) => void;
    onDragEnd?: () => void;
}

export default function BoardCard({
    task,
    projectId,
    projectKey,
    cardFields,
    isDragging,
    isDone,
    onDragStart,
    onDragEnd,
}: Props) {
    const priority = getPriority(task.priority);

    function shows(field: string) {
        return cardFields.includes(field);
    }

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnd={onDragEnd}
            className={`cursor-grab rounded-md border border-border-subtle bg-surface-primary p-2.5 shadow-sm transition-opacity hover:border-brand-muted hover:shadow-md active:cursor-grabbing ${
                isDragging ? 'opacity-50' : ''
            } ${isDone ? 'opacity-65' : ''}`}
        >
            <Link
                href={`/projects/${projectId}/tasks/${task.id}`}
                draggable={false}
                className="line-clamp-2 text-sm font-medium leading-snug text-text-strong no-underline hover:text-brand-primary"
            >
                <span className="mr-1 text-xs font-semibold text-text-muted">
                    {displayKey(projectKey, task.number)}
                </span>
                {task.title}
            </Link>

            {shows('status') && task.workflow_status && (
                <div className="mt-1">
                    <StatusBadge label={task.workflow_status.name} color={task.workflow_status.color} />
                </div>
            )}

            {shows('epic') && task.epic && (
                <div className="mt-1 flex items-center gap-1 text-xs text-text-subtle">
                    <Layers className="h-2.5 w-2.5" />
                    <span className="truncate">{task.epic.title}</span>
                </div>
            )}

            {shows('due_date') && task.due_date && (
                <div className="mt-1 text-xs text-text-muted">{formatDate(task.due_date)}</div>
            )}

            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {shows('priority') && (
                        <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${priority.textClass}`}
                            style={{
                                backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)',
                            }}
                        >
                            {priority.label}
                        </span>
                    )}
                    {shows('phi') && task.data_classification === 'phi' && (
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-brand-primary px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-brand-hover">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            PHI
                        </span>
                    )}
                    {shows('comments_count') && task.comments_count > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-text-muted">
                            <MessageSquare className="h-2.5 w-2.5" />
                            {task.comments_count}
                        </span>
                    )}
                    {shows('story_points') && task.story_points != null && (
                        <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-tight ${
                                task.story_points <= 2
                                    ? 'bg-status-success-subtle text-status-success'
                                    : task.story_points <= 5
                                      ? 'bg-status-warning-subtle text-status-warning'
                                      : 'bg-status-danger-subtle text-status-danger'
                            }`}
                        >
                            {task.story_points} SP
                        </span>
                    )}
                </div>
                {shows('assignee') &&
                    (task.assignee ? (
                        <Avatar name={task.assignee.name} size="sm" />
                    ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-border-strong text-[8px] text-text-muted">
                            ?
                        </div>
                    ))}
            </div>

            {shows('reporter') && task.reporter && (
                <div className="mt-1 text-[10px] text-text-subtle">Zadavatel: {task.reporter.name}</div>
            )}
        </div>
    );
}
