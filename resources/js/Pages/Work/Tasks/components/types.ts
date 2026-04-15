import type { Comment } from '@/Components/CommentsSection';

export interface Attachment {
    id: string;
    original_filename: string;
    mime_type: string;
    size: number;
    uploader: { id: string; name: string } | null;
    created_at: string;
}

export interface DependencyTask {
    id: string;
    title: string;
    status: string;
    project_id: string;
}

export interface Task {
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
    start_date: string | null;
    due_date: string | null;
    data_classification: string;
    story_points: number | null;
    estimated_hours: string | null;
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

export interface Member {
    id: string;
    name: string;
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface ProjectTask {
    id: string;
    title: string;
}

export interface BenefitTypeOption {
    value: string;
    label: string;
    hasMoney: boolean;
}

export interface EpicOption {
    id: string;
    title: string;
}
