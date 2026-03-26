interface EmptyStateProps {
    message: string;
    colSpan?: number;
}

export default function EmptyState({ message, colSpan }: EmptyStateProps) {
    if (colSpan) {
        return (
            <tr>
                <td colSpan={colSpan} className="px-5 py-8 text-center text-sm text-text-muted">
                    {message}
                </td>
            </tr>
        );
    }

    return <p className="py-8 text-center text-base text-text-muted">{message}</p>;
}
