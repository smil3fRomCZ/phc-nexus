interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-[var(--skeleton-radius)]',
};

export default function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-[var(--skeleton-bg)] ${variantClasses[variant]} ${className}`}
            style={{ width, height }}
            aria-hidden="true"
        />
    );
}
