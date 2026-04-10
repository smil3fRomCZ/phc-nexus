import Modal from '@/Components/Modal';
import type { Tab, TabKey } from '@/Components/ProjectTabs';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router } from '@inertiajs/react';
import { GripVertical, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

type TabConfig = { order: string[]; hidden: string[] };

interface Props {
    projectId: string;
    allTabs: readonly Tab[];
    config: TabConfig | null;
    onClose: () => void;
}

interface RowState {
    key: TabKey;
    label: string;
    visible: boolean;
}

export default function ProjectTabsCustomizeModal({ projectId, allTabs, config, onClose }: Props) {
    const initialRows = useMemo<RowState[]>(() => buildInitialRows(allTabs, config), [allTabs, config]);
    const [rows, setRows] = useState<RowState[]>(initialRows);
    const [submitting, setSubmitting] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const visibleCount = rows.filter((r) => r.visible).length;
    const hiddenCount = rows.length - visibleCount;

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        if (active.id === 'overview') return; // overview je locked

        const oldIndex = rows.findIndex((r) => r.key === active.id);
        const newIndex = rows.findIndex((r) => r.key === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        if (newIndex === 0) return; // nelze přesunout před overview
        setRows(arrayMove(rows, oldIndex, newIndex));
    }

    function toggleVisible(key: TabKey) {
        if (key === 'overview') return;
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, visible: !r.visible } : r)));
    }

    function handleSave() {
        setSubmitting(true);
        const order = rows.map((r) => r.key);
        const hidden = rows.filter((r) => !r.visible).map((r) => r.key);
        router.put(
            `/projects/${projectId}/tab-config`,
            { order, hidden },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                onSuccess: () => onClose(),
            },
        );
    }

    function handleReset() {
        setSubmitting(true);
        router.delete(`/projects/${projectId}/tab-config`, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
            onSuccess: () => onClose(),
        });
    }

    return (
        <Modal open onClose={onClose} size="max-w-xl">
            <div>
                <div className="mb-4 border-b border-border-subtle pb-4">
                    <h3 className="text-base font-bold text-text-strong">Přizpůsobit pořadí tabů</h3>
                    <div className="mt-1 text-xs text-text-muted">
                        Nastavení platí jen pro tento projekt. Přetáhněte pro změnu pořadí, přepínačem schovejte tab,
                        který projekt nepoužívá. <strong>Přehled</strong> je vždy první.
                    </div>
                </div>

                <div className="mb-3 rounded-md border-l-[3px] border-status-info bg-status-info-subtle px-3 py-2 text-[11px] text-status-info">
                    ℹ Taby, které se v tab baru nevejdou, se automaticky přesunou do <strong>"Další ▾"</strong>{' '}
                    dropdownu. Pořadí určuje které se vejdou jako první.
                </div>

                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                    <span>Pořadí tabů</span>
                    <span className="font-medium normal-case tracking-normal text-text-muted">
                        Zapnuto: <strong className="text-text-default">{visibleCount}</strong> · Vypnuto:{' '}
                        <strong className="text-text-default">{hiddenCount}</strong>
                    </span>
                </div>

                <div className="max-h-[400px] overflow-y-auto rounded-md border border-border-subtle">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
                            {rows.map((row) => (
                                <SortableRow key={row.key} row={row} onToggle={() => toggleVisible(row.key)} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-border-subtle pt-4">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-hover underline hover:text-brand-primary disabled:opacity-50"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Obnovit výchozí pořadí
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-md border border-border-default bg-surface-secondary px-4 py-2 text-sm font-semibold text-text-default hover:bg-surface-hover disabled:opacity-50"
                        >
                            Zrušit
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={submitting}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
                        >
                            {submitting ? 'Ukládám...' : 'Uložit'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

function SortableRow({ row, onToggle }: { row: RowState; onToggle: () => void }) {
    const isLocked = row.key === 'overview';
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.key,
        disabled: isLocked,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0 ${
                row.visible ? 'bg-surface-primary' : 'bg-surface-secondary'
            }`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                disabled={isLocked}
                className={`flex h-6 w-4 items-center justify-center text-text-subtle ${
                    isLocked
                        ? 'cursor-not-allowed opacity-20'
                        : 'cursor-grab hover:text-text-default active:cursor-grabbing'
                }`}
                aria-label={isLocked ? 'Přehled nelze přesunout' : `Přesunout ${row.label}`}
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <span className={`flex-1 text-sm font-medium ${row.visible ? 'text-text-default' : 'text-text-muted'}`}>
                {row.label}
            </span>
            {isLocked ? (
                <span className="rounded bg-surface-secondary px-2 py-0.5 text-[10px] font-semibold text-text-subtle">
                    Vždy první
                </span>
            ) : (
                <Toggle on={row.visible} onClick={onToggle} />
            )}
        </div>
    );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={onClick}
            className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors ${
                on ? 'bg-brand-primary' : 'bg-border-default'
            }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    on ? 'translate-x-4' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}

function buildInitialRows(allTabs: readonly Tab[], config: TabConfig | null): RowState[] {
    const hidden = new Set(config?.hidden ?? []);
    const order = config?.order ?? [];

    const byKey = new Map(allTabs.map((t) => [t.key, t]));
    const result: RowState[] = [];
    const seen = new Set<string>();

    // overview vždy první
    const overview = byKey.get('overview');
    if (overview) {
        result.push({ key: overview.key, label: overview.label, visible: true });
        seen.add('overview');
    }

    // taby z config.order (v pořadí)
    for (const key of order) {
        if (seen.has(key)) continue;
        const tab = byKey.get(key as TabKey);
        if (tab) {
            result.push({ key: tab.key, label: tab.label, visible: !hidden.has(key) });
            seen.add(key);
        }
    }

    // zbývající taby (nové nebo nekonfigurované) na konec
    for (const tab of allTabs) {
        if (seen.has(tab.key)) continue;
        result.push({ key: tab.key, label: tab.label, visible: !hidden.has(tab.key) });
        seen.add(tab.key);
    }

    return result;
}
