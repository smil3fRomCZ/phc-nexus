import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';

const BREADCRUMBS: Breadcrumb[] = [
    { label: 'Home' },
];

export default function DashboardIndex() {
    return (
        <AppLayout title="Dashboard" breadcrumbs={BREADCRUMBS}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold leading-tight text-text-strong">Dashboard</h1>
                <p className="mt-1 text-base text-text-muted">Welcome back</p>
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface-primary p-8 text-center">
                <h2 className="text-xl font-semibold text-text-strong">
                    PHC Nexus
                </h2>
                <p className="mt-2 text-base text-text-muted">
                    Platforma běží. Milestone 0 — Foundation je hotový.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-status-success-subtle px-4 py-2 text-sm font-medium text-status-success">
                    <span className="h-2 w-2 rounded-full bg-status-success" />
                    System operational
                </div>
            </div>
        </AppLayout>
    );
}
