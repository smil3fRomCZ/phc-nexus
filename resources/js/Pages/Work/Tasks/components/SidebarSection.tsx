export default function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">{label}</div>
            {children}
        </div>
    );
}
