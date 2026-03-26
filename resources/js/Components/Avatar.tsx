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
    size?: 'sm' | 'md';
}

export default function Avatar({ name, size = 'sm' }: AvatarProps) {
    const sizeClasses = size === 'md' ? 'h-7 w-7 text-xs' : 'h-6 w-6 text-[9px]';

    return (
        <div
            className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-text-inverse ${sizeClasses} ${getColor(name)}`}
        >
            {getInitials(name)}
        </div>
    );
}

export { getInitials };
