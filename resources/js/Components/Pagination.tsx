import { Link } from '@inertiajs/react';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    links: PaginationLink[];
}

export default function Pagination({ links }: Props) {
    if (links.length <= 3) return null;

    return (
        <nav className="mt-4 flex items-center justify-center gap-1">
            {links.map((link, i) => {
                const label = link.label
                    .replace('&laquo;', '\u00AB')
                    .replace('&raquo;', '\u00BB')
                    .replace('Previous', '\u00AB Předchozí')
                    .replace('Next', 'Další \u00BB');

                if (!link.url) {
                    return (
                        <span
                            key={i}
                            className="rounded px-3 py-1.5 text-xs text-text-subtle"
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url}
                        className={`rounded px-3 py-1.5 text-xs font-medium no-underline transition-colors ${
                            link.active
                                ? 'bg-brand-primary text-text-inverse'
                                : 'text-text-default hover:bg-surface-hover'
                        }`}
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </nav>
    );
}
