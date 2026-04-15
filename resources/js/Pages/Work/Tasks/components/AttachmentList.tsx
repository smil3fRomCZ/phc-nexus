import ConfirmModal from '@/Components/ConfirmModal';
import { formatFileSize } from '@/utils/formatDate';
import { router } from '@inertiajs/react';
import { Download, Paperclip, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import type { Attachment } from './types';

export default function AttachmentList({
    attachments,
    projectId,
    taskId,
    currentUserId,
}: {
    attachments: Attachment[];
    projectId: string;
    taskId: string;
    currentUserId?: string;
}) {
    const [uploading, setUploading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        fetch(`/projects/${projectId}/tasks/${taskId}/attachments`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                Accept: 'text/html',
            },
            body: formData,
        }).then(() => {
            setUploading(false);
            router.reload();
        });
    }

    function handleDelete(attachmentId: string) {
        setDeleteTarget(attachmentId);
    }

    return (
        <div className="space-y-2">
            {attachments.map((att) => (
                <div
                    key={att.id}
                    className="flex items-center gap-2 rounded border border-border-subtle px-3 py-2 text-xs"
                >
                    <Paperclip className="h-3 w-3 flex-shrink-0 text-text-muted" />
                    <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-text-strong">{att.original_filename}</div>
                        <div className="text-text-muted">{formatFileSize(att.size)}</div>
                    </div>
                    <a
                        href={`/attachments/${att.id}/download`}
                        className="rounded p-2 text-text-muted hover:bg-surface-hover hover:text-text-default"
                    >
                        <Download className="h-3 w-3" />
                    </a>
                    {att.uploader?.id === currentUserId && (
                        <button
                            onClick={() => handleDelete(att.id)}
                            className="rounded p-2 text-text-muted hover:bg-status-danger-subtle hover:text-status-danger"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    )}
                </div>
            ))}

            <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-border-default px-3 py-2 text-xs text-text-muted transition-colors hover:border-brand-primary hover:text-brand-primary">
                <Upload className="h-3 w-3" />
                {uploading ? 'Nahrávání...' : 'Nahrát soubor'}
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <ConfirmModal
                open={!!deleteTarget}
                variant="danger"
                title="Smazat přílohu"
                message="Opravdu chcete smazat tuto přílohu?"
                confirmLabel="Smazat"
                onConfirm={() => {
                    if (deleteTarget) router.delete(`/attachments/${deleteTarget}`);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
