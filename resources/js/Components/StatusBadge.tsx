import type { StatusConfig } from '@/constants/status';
import { FALLBACK_STATUS } from '@/constants/status';

interface MapProps {
    statusMap: Record<string, StatusConfig>;
    value: string;
    label?: never;
    color?: never;
}

interface DynamicProps {
    label: string;
    color: string | null;
    statusMap?: never;
    value?: never;
}

type StatusBadgeProps = MapProps | DynamicProps;

function colorToClasses(color: string | null): string {
    if (!color) return 'bg-status-neutral-subtle text-status-neutral';
    return '';
}

export default function StatusBadge(props: StatusBadgeProps) {
    if (props.statusMap) {
        const config = props.statusMap[props.value] ?? FALLBACK_STATUS;
        return (
            <span
                className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${config.className}`}
            >
                {config.label}
            </span>
        );
    }

    const classes = colorToClasses(props.color);

    return (
        <span
            className={`inline-flex items-center rounded-[10px] px-2 py-px text-xs font-semibold leading-relaxed ${classes}`}
            style={
                props.color
                    ? {
                          backgroundColor: `${props.color}20`,
                          color: props.color,
                      }
                    : undefined
            }
        >
            {props.label}
        </span>
    );
}
