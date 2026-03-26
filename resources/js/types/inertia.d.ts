/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageProps } from './';

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps, PageProps {}
}
