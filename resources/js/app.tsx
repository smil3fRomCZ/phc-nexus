import './bootstrap';
import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '@/Components/ErrorBoundary';

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

createInertiaApp({
    title: (title) => (title ? `${title} — PHC Nexus` : 'PHC Nexus'),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true });
        return pages[`./Pages/${name}.tsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>,
        );
    },
});
