import DOMPurify, { type Config } from 'dompurify';

interface Props {
    content: string;
}

const SANITIZE_CONFIG: Config = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
        'h2', 'h3', 'h4',
        'ul', 'ol', 'li',
        'blockquote',
        'a',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
    RETURN_TRUSTED_TYPE: false,
};

export default function RichTextDisplay({ content }: Props) {
    const sanitized = DOMPurify.sanitize(content, SANITIZE_CONFIG);
    return (
        <div
            className="prose prose-sm max-w-none text-sm leading-relaxed text-text-default [&_a]:text-brand-primary [&_code]:rounded [&_code]:bg-surface-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-0 [&_p]:my-1 [&_ul]:my-1"
            dangerouslySetInnerHTML={{ __html: sanitized as unknown as string }}
        />
    );
}
