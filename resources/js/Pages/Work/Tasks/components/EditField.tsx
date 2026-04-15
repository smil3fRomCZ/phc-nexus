export default function EditField({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-text-default">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        </div>
    );
}
