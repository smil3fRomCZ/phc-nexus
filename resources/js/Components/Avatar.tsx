import { useState } from 'react';

const COLORS = ['bg-brand-primary', 'bg-[#5243aa]', 'bg-[#0747a6]', 'bg-[#006644]', 'bg-[#974f0c]'];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

interface AvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    avatarUrl?: string | null;
}

const SIZE_MAP = {
    sm: 'h-6 w-6 text-[9px]',
    md: 'h-7 w-7 text-xs',
    lg: 'h-10 w-10 text-sm',
    xl: 'h-14 w-14 text-lg',
} as const;

export default function Avatar({ name, size = 'sm', avatarUrl }: AvatarProps) {
    const [imgError, setImgError] = useState(false);
    const sizeClasses = SIZE_MAP[size];

    if (avatarUrl && !imgError) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                className={`flex-shrink-0 rounded-full object-cover ${sizeClasses}`}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div
            className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-text-inverse ${sizeClasses} ${getColor(name)}`}
        >
            {getInitials(name)}
        </div>
    );
}

export { getInitials };
