import type { StatusConfig } from '@/constants/status';
import { FALLBACK_STATUS } from '@/constants/status';

interface StatusBadgeProps {
    statusMap: Record<string, StatusConfig>;
    value: string;
}

export default function StatusBadge({ statusMap, value }: StatusBadgeProps) {
    const config = statusMap[value] ?? FALLBACK_STATUS;

    return (
        <span
            className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${config.className}`}
        >
            {config.label}
        </span>
    );
}
