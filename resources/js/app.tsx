import './bootstrap';
import '../css/app.css';

import { createInertiaApp, router, type ResolvedComponent } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '@/Components/ErrorBoundary';
import ErrorModal from '@/Components/ErrorModal';
import { useState, type ReactNode } from 'react';

// Global navigation progress bar
let progressTimeout: ReturnType<typeof setTimeout>;

router.on('start', () => {
    progressTimeout = setTimeout(() => {
        document.getElementById('nav-progress')?.classList.remove('opacity-0');
    }, 250);
});

router.on('finish', () => {
    clearTimeout(progressTimeout);
    document.getElementById('nav-progress')?.classList.add('opacity-0');
});

function AppWithErrorModal({ children }: { children: ReactNode }) {
    const [error, setError] = useState<{ status: number; message: string } | null>(null);

    // Handle non-Inertia responses (404, 500, etc.)
    // V Inertia v3 byl event 'invalid' přejmenován na 'httpException'.
    router.on('httpException', (event) => {
        event.preventDefault();
        const status = event.detail.response.status;
        setError({ status, message: '' });
    });

    return (
        <>
            {children}
            <ErrorModal
                open={!!error}
                status={error?.status}
                message={error?.message ?? ''}
                onClose={() => setError(null)}
            />
        </>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} — PHC Nexus` : 'PHC Nexus'),
    resolve: (name) => {
        const pages = import.meta.glob<{ default: ResolvedComponent }>('./Pages/**/*.tsx', { eager: true });
        return pages[`./Pages/${name}.tsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ErrorBoundary>
                <AppWithErrorModal>
                    <App {...props} />
                </AppWithErrorModal>
            </ErrorBoundary>,
        );
    },
});
