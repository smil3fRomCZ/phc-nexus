interface Props {
    content: string;
}

export default function RichTextDisplay({ content }: Props) {
    return (
        <div
            className="prose prose-sm max-w-none text-sm leading-relaxed text-text-default [&_a]:text-brand-primary [&_code]:rounded [&_code]:bg-surface-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-0 [&_p]:my-1 [&_ul]:my-1"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
