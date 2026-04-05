import type { LucideIcon } from 'lucide-react';

export interface Tab {
    key: string;
    label: string;
    icon?: LucideIcon;
    badge?: string | number;
}

interface Props {
    tabs: Tab[];
    activeTab: string;
    onChange: (key: string) => void;
    trailing?: React.ReactNode;
}

export default function TabBar({ tabs, activeTab, onChange, trailing }: Props) {
    return (
        <div className="flex gap-0 border-b border-border-subtle">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.key === activeTab;
                return (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                            isActive
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-text-muted hover:text-text-default'
                        }`}
                    >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {tab.label}
                        {tab.badge !== undefined && (
                            <span className="rounded-full bg-status-neutral-subtle px-1.5 py-px text-xs font-medium text-text-muted">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
            {trailing}
        </div>
    );
}
