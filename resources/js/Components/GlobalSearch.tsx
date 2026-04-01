import { router } from '@inertiajs/react';
import { Search, FolderKanban, CheckSquare } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import StatusBadge from '@/Components/StatusBadge';
import { PROJECT_STATUS } from '@/constants/status';

interface SearchProject {
    id: string;
    name: string;
    key: string;
    status: string;
}

interface SearchTask {
    id: string;
    title: string;
    status: string;
    project: { id: string; name: string; key: string } | null;
    workflow_status: { id: string; name: string; color: string | null } | null;
}

interface SearchResults {
    projects: SearchProject[];
    tasks: SearchTask[];
}

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const allItems = results
        ? [
              ...results.projects.map((p) => ({ type: 'project' as const, ...p })),
              ...results.tasks.map((t) => ({ type: 'task' as const, ...t })),
          ]
        : [];

    // Debounced fetch
    useEffect(() => {
        if (query.length < 2) {
            return;
        }

        const timer = setTimeout(() => {
            fetch(`/search?q=${encodeURIComponent(query)}`, {
                headers: { Accept: 'application/json' },
            })
                .then((res) => res.json())
                .then((data: SearchResults) => {
                    setResults(data);
                    setOpen(true);
                    setSelectedIndex(-1);
                });
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    function handleChange(value: string) {
        setQuery(value);
        if (value.length < 2) {
            setResults(null);
            setOpen(false);
        }
    }

    // Cmd+K shortcut
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const navigate = useCallback((item: (typeof allItems)[number]) => {
        setOpen(false);
        setQuery('');
        if (item.type === 'project') {
            router.visit(`/projects/${item.id}`);
        } else {
            const task = item as SearchTask;
            if (task.project) {
                router.visit(`/projects/${task.project.id}/tasks/${task.id}`);
            }
        }
    }, []);

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!open || allItems.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            navigate(allItems[selectedIndex]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    }

    const hasResults = results && (results.projects.length > 0 || results.tasks.length > 0);
    const noResults = results && results.projects.length === 0 && results.tasks.length === 0;

    return (
        <div ref={wrapperRef} className="relative w-full max-w-[480px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-text-muted" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={() => results && setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Hledat úkoly, projekty... (⌘K)"
                className="h-8 w-full rounded-md border border-border-default bg-surface-hover pl-[2.25rem] pr-4 text-sm text-text-default placeholder:text-text-subtle outline-none transition-colors focus:border-brand-primary focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
            />

            {/* Dropdown */}
            {open && (hasResults || noResults) && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border-default bg-surface-primary shadow-lg">
                    {noResults && (
                        <div className="px-4 py-6 text-center text-sm text-text-muted">
                            Žádné výsledky pro &ldquo;{query}&rdquo;
                        </div>
                    )}

                    {results && results.projects.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Projekty
                            </div>
                            {results.projects.map((project, i) => {
                                const idx = i;
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => navigate({ type: 'project', ...project })}
                                        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${selectedIndex === idx ? 'bg-brand-soft' : 'hover:bg-surface-hover'}`}
                                    >
                                        <FolderKanban className="h-4 w-4 flex-shrink-0 text-text-muted" />
                                        <div className="min-w-0 flex-1">
                                            <span className="font-medium text-text-strong">{project.name}</span>
                                            <span className="ml-2 font-mono text-xs text-text-muted">
                                                {project.key}
                                            </span>
                                        </div>
                                        <StatusBadge statusMap={PROJECT_STATUS} value={project.status} />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {results && results.tasks.length > 0 && (
                        <div className={results.projects.length > 0 ? 'border-t border-border-subtle' : ''}>
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                Úkoly
                            </div>
                            {results.tasks.map((task, i) => {
                                const idx = (results.projects?.length ?? 0) + i;
                                return (
                                    <button
                                        key={task.id}
                                        onClick={() => navigate({ type: 'task', ...task })}
                                        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${selectedIndex === idx ? 'bg-brand-soft' : 'hover:bg-surface-hover'}`}
                                    >
                                        <CheckSquare className="h-4 w-4 flex-shrink-0 text-text-muted" />
                                        <div className="min-w-0 flex-1">
                                            <span className="font-medium text-text-strong">{task.title}</span>
                                            {task.project && (
                                                <span className="ml-2 text-xs text-text-muted">
                                                    {task.project.name}
                                                </span>
                                            )}
                                        </div>
                                        <StatusBadge
                                            label={task.workflow_status?.name ?? task.status}
                                            color={task.workflow_status?.color ?? null}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
