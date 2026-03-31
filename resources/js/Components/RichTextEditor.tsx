import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Code, Heading2, Heading3, List, ListOrdered, Link2 } from 'lucide-react';

interface Props {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = 'Začněte psát...' }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder }),
        ],
        content,
        onUpdate: ({ editor: ed }) => {
            onChange(ed.getHTML());
        },
    });

    if (!editor) return null;

    function toggleLink() {
        if (!editor) return;
        if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
            return;
        }
        const url = prompt('URL odkazu:');
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    }

    const btnClass = (active: boolean) =>
        `flex h-7 w-7 items-center justify-center rounded text-sm transition-colors ${
            active
                ? 'bg-brand-soft text-brand-primary'
                : 'text-text-muted hover:bg-surface-hover hover:text-text-strong'
        }`;

    return (
        <div className="overflow-hidden rounded-md border border-border-default">
            <div className="flex flex-wrap gap-0.5 border-b border-border-subtle bg-surface-secondary px-2 py-1.5">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={btnClass(editor.isActive('bold'))}
                    title="Tučné"
                >
                    <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={btnClass(editor.isActive('italic'))}
                    title="Kurzíva"
                >
                    <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={btnClass(editor.isActive('code'))}
                    title="Kód"
                >
                    <Code className="h-3.5 w-3.5" />
                </button>
                <div className="mx-1 h-5 w-px self-center bg-border-subtle" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={btnClass(editor.isActive('heading', { level: 2 }))}
                    title="Nadpis 2"
                >
                    <Heading2 className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={btnClass(editor.isActive('heading', { level: 3 }))}
                    title="Nadpis 3"
                >
                    <Heading3 className="h-3.5 w-3.5" />
                </button>
                <div className="mx-1 h-5 w-px self-center bg-border-subtle" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={btnClass(editor.isActive('bulletList'))}
                    title="Odrážky"
                >
                    <List className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={btnClass(editor.isActive('orderedList'))}
                    title="Číslovaný seznam"
                >
                    <ListOrdered className="h-3.5 w-3.5" />
                </button>
                <div className="mx-1 h-5 w-px self-center bg-border-subtle" />
                <button type="button" onClick={toggleLink} className={btnClass(editor.isActive('link'))} title="Odkaz">
                    <Link2 className="h-3.5 w-3.5" />
                </button>
            </div>
            <EditorContent
                editor={editor}
                className="max-w-none px-3 py-2 text-sm text-text-default focus-within:outline-none [&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-text-subtle [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
            />
        </div>
    );
}
