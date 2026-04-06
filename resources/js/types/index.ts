export interface User {
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
    system_role?: string;
    avatar_url: string | null;
    avatar_path: string | null;
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
