import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import ConfirmModal from '@/Components/ConfirmModal';
import Modal from '@/Components/Modal';
import FormInput from '@/Components/FormInput';
import FormTextarea from '@/Components/FormTextarea';
import PageHeader from '@/Components/PageHeader';
import StatCard from '@/Components/StatCard';
import { Building2, Users, UserX, LayoutGrid, Plus, ArrowRight, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';

interface Team {
    id: string;
    name: string;
    members_count: number;
}

interface Division {
    id: string;
    name: string;
    description: string | null;
    teams: Team[];
    teams_count: number;
    member_count: number;
}

interface Stats {
    totalUsers: number;
    totalDivisions: number;
    totalTeams: number;
    unassigned: number;
}

interface UserOption {
    id: string;
    name: string;
}

interface Props {
    divisions: Division[];
    stats: Stats;
    users: UserOption[];
    can: { createDivision: boolean; createTeam: boolean };
}

const BREADCRUMBS: Breadcrumb[] = [{ label: 'Domů', href: '/' }, { label: 'Administrace' }, { label: 'Organizace' }];

export default function OrganizationIndex({ divisions, stats, can }: Props) {
    const [divisionModal, setDivisionModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    return (
        <AppLayout title="Organizace" breadcrumbs={BREADCRUMBS}>
            <PageHeader
                title="Organizační struktura"
                actions={
                    can.createDivision ? (
                        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setDivisionModal(true)}>
                            Nová divize
                        </Button>
                    ) : undefined
                }
            />

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard icon={<Users className="h-5 w-5" />} label="Aktivních uživatelů" value={stats.totalUsers} />
                <StatCard
                    icon={<Building2 className="h-5 w-5" />}
                    label="Divize"
                    value={stats.totalDivisions}
                    color="bg-status-info-subtle text-status-info"
                />
                <StatCard
                    icon={<LayoutGrid className="h-5 w-5" />}
                    label="Týmy"
                    value={stats.totalTeams}
                    color="bg-status-warning-subtle text-status-warning"
                />
                <StatCard
                    icon={<UserX className="h-5 w-5" />}
                    label="Bez týmu"
                    value={stats.unassigned}
                    color="bg-status-danger-subtle text-status-danger"
                />
            </div>

            {/* Division cards grid */}
            {divisions.length === 0 ? (
                <div className="rounded-lg border border-border-subtle bg-surface-primary px-6 py-12 text-center">
                    <Building2 className="mx-auto mb-3 h-10 w-10 text-text-subtle" />
                    <p className="text-sm text-text-muted">Žádné divize nastaveny.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {divisions.map((division) => (
                        <div
                            key={division.id}
                            className="group cursor-pointer rounded-lg border border-border-subtle bg-surface-primary transition-colors hover:border-brand-primary"
                            onClick={() => router.get(`/admin/organization/divisions/${division.id}`)}
                        >
                            <div className="px-5 py-4">
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-primary">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-semibold text-text-strong">{division.name}</h3>
                                        {division.description && (
                                            <p className="truncate text-xs text-text-muted">{division.description}</p>
                                        )}
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <div className="flex gap-4 text-xs text-text-muted">
                                    <span>{division.teams_count} týmů</span>
                                    <span>{division.member_count} členů</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create division modal */}
            {divisionModal && <DivisionFormModal onClose={() => setDivisionModal(false)} />}

            <ConfirmModal
                open={!!deleteTarget}
                variant="danger"
                title="Smazat divizi"
                message={`Opravdu chcete smazat divizi „${deleteTarget?.name}"?`}
                confirmLabel="Smazat"
                onConfirm={() => {
                    if (deleteTarget) {
                        router.delete(`/admin/divisions/${deleteTarget.id}`);
                    }
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AppLayout>
    );
}

function DivisionFormModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [processing, setProcessing] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.post(
            '/admin/divisions',
            { name, description },
            {
                onFinish: () => setProcessing(false),
                onSuccess: onClose,
            },
        );
    }

    return (
        <Modal open onClose={onClose} showClose={false}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-strong">Nová divize</h2>
                <button onClick={onClose} className="rounded p-2 text-text-muted hover:bg-surface-hover">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    id="div-name"
                    label="Název"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <FormTextarea
                    id="div-desc"
                    label="Popis"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Zrušit
                    </Button>
                    <Button type="submit" loading={processing}>
                        Vytvořit
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
