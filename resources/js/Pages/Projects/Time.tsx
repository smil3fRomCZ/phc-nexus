import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import ProjectTabs from '@/Components/ProjectTabs';
import TimeLogSection from '@/Components/TimeLogSection';
import type { TimeEntryData } from '@/Components/TimeLogSection';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface TaskOption {
    id: string;
    title: string;
    number: number;
}

interface Props {
    project: { id: string; name: string; key: string; status: string };
    timeEntries: TimeEntryData[];
    totalHours: number;
    availableTasks?: TaskOption[];
}

export default function ProjectTime({ project, timeEntries = [], totalHours = 0, availableTasks = [] }: Props) {
    const { auth } = usePage<PageProps>().props;

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Čas' },
    ];

    return (
        <AppLayout title={`${project.key} — Čas`} breadcrumbs={breadcrumbs}>
            <div className="max-w-screen-xl space-y-5">
                <div className="mb-4">
                    <ProjectHeaderCompact project={project} />
                </div>
                <div className="flex items-center justify-between">
                    <ProjectTabs projectId={project.id} active="time" />
                </div>

                <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                    <TimeLogSection
                        timeEntries={timeEntries}
                        totalHours={totalHours}
                        postUrl={`/projects/${project.id}/time-entries`}
                        exportUrl={`/projects/${project.id}/export/time`}
                        currentUserId={auth.user?.id}
                        showTaskColumn
                        availableTasks={availableTasks}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
