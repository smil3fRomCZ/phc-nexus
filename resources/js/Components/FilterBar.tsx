import type { ReactNode } from 'react';

interface FilterBarProps {
    children: ReactNode;
}

export default function FilterBar({ children }: FilterBarProps) {
    return <div className="mb-6 flex flex-wrap gap-3">{children}</div>;
}
