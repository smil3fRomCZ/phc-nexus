import AppLayout from '@/Layouts/AppLayout';

export default function DashboardIndex() {
    return (
        <AppLayout title="Dashboard">
            <div className="mx-auto max-w-4xl">
                <div className="rounded-lg border border-border-default bg-surface-secondary p-8 text-center">
                    <h2 className="text-2xl font-semibold text-text-strong">
                        PHC Nexus
                    </h2>
                    <p className="mt-2 text-text-muted">
                        Platforma běží. Milestone 0 — Foundation je hotový.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-status-success-subtle px-4 py-2 text-sm font-medium text-status-success">
                        <span className="h-2 w-2 rounded-full bg-status-success" />
                        System operational
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
