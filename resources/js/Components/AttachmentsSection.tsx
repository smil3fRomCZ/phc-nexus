import ConfirmModal from '@/Components/ConfirmModal';
import { formatFileSize } from '@/utils/formatDate';
import { router, usePage } from '@inertiajs/react';
import { Paperclip, Download, Trash2, Upload } from 'lucide-react';
import type { PageProps } from '@/types';
import { useState } from 'react';

export interface Attachment {
    id: string;
    original_filename: string;
    mime_type: string;
    size: number;
    uploader: { id: string; name: string } | null;
    created_at: string;
}

export default function AttachmentsSection({
    attachments,
    uploadUrl,
}: {
    attachments: Attachment[];
    uploadUrl: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const [uploading, setUploading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Klientská validace — server je autoritativní, tohle je jen UX.
        const MAX_BYTES = 20 * 1024 * 1024; // 20 MB, sjednoceno s config/attachments.php
        if (file.size > MAX_BYTES) {
            alert(`Soubor je příliš velký (max 20 MB). Velikost: ${formatFileSize(file.size)}`);
            e.target.value = '';
            return;
        }

        setUploading(true);
        router.post(
            uploadUrl,
            { file },
            {
                forceFormData: true,
                onFinish: () => setUploading(false),
                preserveScroll: true,
            },
        );
    }

    function handleDelete(attachmentId: string) {
        setDeleteTarget(attachmentId);
    }

    return (
        <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                Přílohy ({attachments.length})
            </h3>
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
                        {att.uploader?.id === auth.user?.id && (
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
                    <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.jpg,.jpeg,.png,.gif,.webp,.zip,.7z"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>
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
