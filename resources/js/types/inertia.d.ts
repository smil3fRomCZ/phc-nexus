import type { PageProps } from './';

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps, PageProps {}
}
