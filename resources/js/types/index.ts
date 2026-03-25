export interface User {
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
}

export interface PageProps {
    auth: {
        user: User | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
}
