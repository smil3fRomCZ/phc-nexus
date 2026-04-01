import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import ProjectTabs from '@/Components/ProjectTabs';
import TimeLogSection from '@/Components/TimeLogSection';
import type { TimeEntryData } from '@/Components/TimeLogSection';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface Props {
    project: { id: string; name: string; key: string };
    timeEntries: TimeEntryData[];
    totalHours: number;
}

export default function ProjectTime({ project, timeEntries = [], totalHours = 0 }: Props) {
    const { auth } = usePage<PageProps>().props;

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Čas' },
    ];

    return (
        <AppLayout title={`${project.key} — Čas`} breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-5xl space-y-5">
                <div className="flex items-center justify-between">
                    <ProjectTabs projectId={project.id} active="time" />
                </div>

                <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                    <TimeLogSection
                        timeEntries={timeEntries}
                        totalHours={totalHours}
                        postUrl={`/projects/${project.id}/time-entries`}
                        currentUserId={auth.user?.id}
                        showTaskColumn
                    />
                </div>
            </div>
        </AppLayout>
    );
}
