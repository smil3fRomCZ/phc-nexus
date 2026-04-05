import RichTextDisplay from '@/Components/RichTextDisplay';
import RichTextEditor from '@/Components/RichTextEditor';
import { router } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

interface Props {
    content: string | null;
    updateUrl: string;
    readonly: boolean;
}

export default function InlineDescription({ content, updateUrl, readonly }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(content ?? '');
    const [saving, setSaving] = useState(false);

    function save() {
        setSaving(true);
        router.patch(
            updateUrl,
            { description: value },
            {
                onFinish: () => setSaving(false),
                onSuccess: () => setEditing(false),
                preserveScroll: true,
            },
        );
    }

    if (editing && !readonly) {
        return (
            <div className="mt-4 rounded-md border border-brand-primary bg-surface-primary px-4 py-3">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                    Popis
                </span>
                <RichTextEditor content={value} onChange={setValue} autoFocus />
                <div className="mt-2 flex gap-2">
                    <button
                        onClick={save}
                        disabled={saving}
                        className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50"
                    >
                        {saving ? 'Ukládání...' : 'Uložit'}
                    </button>
                    <button
                        onClick={() => {
                            setEditing(false);
                            setValue(content ?? '');
                        }}
                        className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-hover"
                    >
                        Zrušit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`mt-4 rounded-md border border-border-subtle bg-surface-secondary px-4 py-3 group ${!readonly ? 'cursor-pointer hover:border-brand-muted' : ''}`}
            onClick={!readonly ? () => setEditing(true) : undefined}
        >
            <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">Popis</span>
                {!readonly && (
                    <Pencil className="h-3 w-3 text-text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                )}
            </div>
            {content ? (
                <RichTextDisplay content={content} />
            ) : (
                <p className="text-sm text-text-muted italic">
                    {readonly ? 'Žádný popis' : 'Klikněte pro přidání popisu...'}
                </p>
            )}
        </div>
    );
}
