export interface User {
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
}

export interface PageProps {
    [key: string]: unknown;
    auth: {
        user: User | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
    notificationCount: number;
}
