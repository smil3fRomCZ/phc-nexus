import Avatar from '@/Components/Avatar';

interface PersonChipProps {
    name: string;
    detail?: string;
    size?: 'sm' | 'md';
}

export default function PersonChip({ name, detail, size = 'sm' }: PersonChipProps) {
    const textSize = size === 'md' ? 'text-sm' : 'text-xs';

    return (
        <div className="flex items-center gap-2">
            <Avatar name={name} size={size} />
            <span className={`${textSize} text-text-default`}>{name}</span>
            {detail && <span className={`${textSize} text-text-muted`}>{detail}</span>}
        </div>
    );
}
