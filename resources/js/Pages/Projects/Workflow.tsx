import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Plus, Trash2, X } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    type Node,
    type Edge,
    type Connection,
    type NodeChange,
    applyNodeChanges,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface WorkflowStatus {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    position: number;
    pos_x: number;
    pos_y: number;
    is_initial: boolean;
    is_done: boolean;
    is_cancelled: boolean;
    allow_transition_from_any: boolean;
}

interface WorkflowTransition {
    id: string;
    from_status_id: string;
    to_status_id: string;
    from_status: { id: string; name: string };
    to_status: { id: string; name: string };
}

interface Props {
    project: { id: string; name: string; key: string };
    statuses: WorkflowStatus[];
    transitions: WorkflowTransition[];
}

function csrfHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        Accept: 'application/json',
    };
}

function StatusNode({ data }: { data: WorkflowStatus & { onEdit: (id: string) => void } }) {
    return (
        <div
            className={`relative rounded-lg border-2 bg-surface-primary shadow-sm transition-shadow hover:shadow-md ${data.allow_transition_from_any ? 'border-dashed' : ''}`}
            style={{ borderColor: data.color ?? '#dfe1e6', minWidth: 140 }}
            onClick={() => data.onEdit(data.id)}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-3 !w-3 !border-2 !border-white !bg-brand-primary"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!h-3 !w-3 !border-2 !border-white !bg-brand-primary"
            />
            <div className="rounded-t-md px-3 py-1.5" style={{ backgroundColor: data.color ?? '#97a0af' }}>
                <span className="text-xs font-semibold text-white">{data.name}</span>
            </div>
            <div className="flex flex-wrap gap-1 px-3 py-1.5">
                {data.is_initial && (
                    <span className="rounded bg-status-info-subtle px-1 py-px text-[9px] font-bold text-status-info">
                        VÝCHOZÍ
                    </span>
                )}
                {data.is_done && (
                    <span className="rounded bg-status-success-subtle px-1 py-px text-[9px] font-bold text-status-success">
                        HOTOVO
                    </span>
                )}
                {data.is_cancelled && (
                    <span className="rounded bg-status-neutral-subtle px-1 py-px text-[9px] font-bold text-text-muted">
                        ZRUŠENO
                    </span>
                )}
                {data.allow_transition_from_any && (
                    <span className="rounded bg-brand-soft px-1 py-px text-[9px] font-bold text-brand-hover">
                        ODKUDKOLIV
                    </span>
                )}
            </div>
        </div>
    );
}

const nodeTypes = { status: StatusNode };

export default function Workflow({ project, statuses, transitions }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Workflow' },
    ];

    const editingStatus = statuses.find((s) => s.id === editingId) ?? null;

    // Build React Flow nodes from statuses
    const buildNodes = useCallback(
        (): Node[] =>
            statuses.map((s, i) => ({
                id: s.id,
                type: 'status',
                position: {
                    x: s.pos_x != null && s.pos_x !== 0 ? s.pos_x : (i % 3) * 250 + 50,
                    y: s.pos_y != null && s.pos_y !== 0 ? s.pos_y : Math.floor(i / 3) * 150 + 50,
                },
                data: { ...s, onEdit: setEditingId },
            })),
        [statuses],
    );

    const [nodes, setNodes] = useState<Node[]>(buildNodes);

    // Sync nodes when statuses prop changes (Inertia navigation)
    useEffect(() => {
        setNodes(buildNodes());
    }, [buildNodes]);

    const onNodeDragStop = useCallback(
        (_event: unknown, node: Node) => {
            fetch(`/projects/${project.id}/workflow/statuses/${node.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ pos_x: Math.round(node.position.x), pos_y: Math.round(node.position.y) }),
            });
        },
        [project.id],
    );

    const edges: Edge[] = useMemo(
        () =>
            transitions.map((t) => ({
                id: t.id,
                source: t.from_status_id,
                target: t.to_status_id,
                markerEnd: { type: MarkerType.ArrowClosed, color: '#97a0af' },
                style: { stroke: '#97a0af', strokeWidth: 2 },
                animated: false,
            })),
        [transitions],
    );

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target || connection.source === connection.target) return;
            fetch(`/projects/${project.id}/workflow/transitions`, {
                method: 'POST',
                headers: csrfHeaders(),
                body: JSON.stringify({
                    from_status_id: connection.source,
                    to_status_id: connection.target,
                }),
            }).then((res) => {
                if (res.ok) router.reload();
            });
        },
        [project.id],
    );

    function addStatus() {
        if (!newName) return;
        fetch(`/projects/${project.id}/workflow/statuses`, {
            method: 'POST',
            headers: csrfHeaders(),
            body: JSON.stringify({ name: newName }),
        }).then((res) => {
            if (res.ok) {
                setNewName('');
                router.reload();
            }
        });
    }

    function updateStatus(id: string, data: Record<string, unknown>) {
        fetch(`/projects/${project.id}/workflow/statuses/${id}`, {
            method: 'PUT',
            headers: csrfHeaders(),
            body: JSON.stringify(data),
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    function deleteStatus(id: string, name: string) {
        if (!confirm(`Smazat stav "${name}"? Úkoly budou přesunuty do předchozího stavu.`)) return;
        fetch(`/projects/${project.id}/workflow/statuses/${id}`, {
            method: 'DELETE',
            headers: csrfHeaders(),
        }).then((res) => {
            if (res.ok) {
                setEditingId(null);
                router.reload();
            }
        });
    }

    function deleteTransition(id: string) {
        fetch(`/projects/${project.id}/workflow/transitions/${id}`, {
            method: 'DELETE',
            headers: csrfHeaders(),
        }).then((res) => {
            if (res.ok) router.reload();
        });
    }

    return (
        <AppLayout title={`${project.key} — Workflow`} breadcrumbs={breadcrumbs}>
            <div className="max-w-screen-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl md:text-2xl font-bold text-text-strong">Workflow Editor</h1>
                    <span className="text-sm text-text-muted">
                        {statuses.length} stavů · {transitions.length} přechodů
                    </span>
                </div>

                {/* Toolbar */}
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-secondary px-4 py-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Název nového stavu..."
                        onKeyDown={(e) => e.key === 'Enter' && addStatus()}
                        className="w-48 rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none focus:shadow-[0_0_0_2px_var(--color-brand-soft)]"
                    />
                    <button
                        onClick={addStatus}
                        disabled={!newName}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
                    >
                        <Plus className="h-3 w-3" />
                        Přidat stav
                    </button>
                    <span className="ml-auto text-xs text-text-subtle">
                        Táhnutím z uzlu na uzel vytvoříte přechod. Kliknutím na uzel ho editujte.
                    </span>
                </div>

                {/* Canvas + Detail panel */}
                <div className="flex gap-4">
                    {/* React Flow canvas */}
                    <div
                        className="flex-1 overflow-hidden rounded-lg border border-border-subtle"
                        style={{ height: 500 }}
                    >
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onNodeDragStop={onNodeDragStop}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                            proOptions={{ hideAttribution: true }}
                        >
                            <Background gap={20} size={1} />
                            <Controls showInteractive={false} />
                        </ReactFlow>
                    </div>

                    {/* Detail panel */}
                    {editingStatus && (
                        <div className="w-64 flex-shrink-0 rounded-lg border border-border-subtle bg-surface-primary p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-text-strong">Editace stavu</span>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="rounded p-2 text-text-muted hover:bg-surface-hover"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                        Název
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={editingStatus.name}
                                        onBlur={(e) => {
                                            if (e.target.value !== editingStatus.name)
                                                updateStatus(editingStatus.id, { name: e.target.value });
                                        }}
                                        className="mt-1 w-full rounded-md border border-border-default px-2 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                        Barva
                                    </label>
                                    <input
                                        type="color"
                                        value={editingStatus.color ?? '#97a0af'}
                                        onChange={(e) => updateStatus(editingStatus.id, { color: e.target.value })}
                                        className="mt-1 h-8 w-full cursor-pointer rounded-md border border-border-default"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                        Flagy
                                    </label>
                                    <div className="mt-1 space-y-1">
                                        {[
                                            { key: 'is_initial', label: 'Výchozí (nové úkoly)' },
                                            { key: 'is_done', label: 'Hotovo (progress)' },
                                            { key: 'is_cancelled', label: 'Zrušeno' },
                                            { key: 'allow_transition_from_any', label: 'Přechod odkudkoliv' },
                                        ].map((flag) => (
                                            <label
                                                key={flag.key}
                                                className="flex cursor-pointer items-center gap-2 text-xs text-text-default"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={editingStatus[flag.key as keyof WorkflowStatus] as boolean}
                                                    onChange={(e) =>
                                                        updateStatus(editingStatus.id, {
                                                            [flag.key]: e.target.checked,
                                                        })
                                                    }
                                                    className="accent-brand-primary"
                                                />
                                                {flag.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                        Přechody z tohoto stavu
                                    </label>
                                    <div className="mt-1 space-y-0.5">
                                        {transitions
                                            .filter((t) => t.from_status_id === editingStatus.id)
                                            .map((t) => (
                                                <div
                                                    key={t.id}
                                                    className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-surface-secondary"
                                                >
                                                    <span>→ {t.to_status.name}</span>
                                                    <button
                                                        onClick={() => deleteTransition(t.id)}
                                                        className="text-text-subtle hover:text-status-danger"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                        Přechody do tohoto stavu
                                    </label>
                                    <div className="mt-1 space-y-0.5">
                                        {transitions
                                            .filter((t) => t.to_status_id === editingStatus.id)
                                            .map((t) => (
                                                <div key={t.id} className="rounded px-2 py-1 text-xs text-text-muted">
                                                    ← {t.from_status.name}
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteStatus(editingStatus.id, editingStatus.name)}
                                    className="w-full rounded-md border border-status-danger/30 px-3 py-1.5 text-xs font-medium text-status-danger transition-colors hover:bg-status-danger-subtle"
                                >
                                    Smazat stav
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
