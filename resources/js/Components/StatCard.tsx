import type { ReactNode } from 'react';

interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: string | number;
    color?: string;
}

export default function StatCard({ icon, label, value, color }: StatCardProps) {
    return (
        <div className="rounded-lg border border-border-subtle bg-surface-primary px-5 py-4">
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${color ?? 'bg-brand-soft text-brand-primary'}`}
                >
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-text-strong">{value}</p>
                    <p className="text-xs text-text-muted">{label}</p>
                </div>
            </div>
        </div>
    );
}
