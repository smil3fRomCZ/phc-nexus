import AppLayout from '@/Layouts/AppLayout';
import type { Breadcrumb } from '@/Layouts/AppLayout';
import Button from '@/Components/Button';
import ProjectHeaderCompact from '@/Components/ProjectHeaderCompact';
import { router, usePage } from '@inertiajs/react';
import { CheckCircle, Dices, Eye, RefreshCw, Trophy } from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '@/types';

interface Vote {
    id: string;
    user: { id: string; name: string };
    value: number | null;
}

interface Round {
    id: string;
    task: {
        id: string;
        title: string;
        number: number;
        priority: string;
        description: string | null;
        story_points: number | null;
    };
    round_number: number;
    final_value: number | null;
    status: string; // voting | revealed | confirmed
    votes: Vote[];
}

interface Session {
    id: string;
    name: string;
    scale_type: string;
    status: string;
    creator: { id: string; name: string };
    rounds: Round[];
}

interface Member {
    id: string;
    name: string;
}

interface Props {
    project: { id: string; name: string; key: string; status: string };
    session: Session;
    members: Member[];
}

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

function spColor(sp: number): string {
    if (sp <= 2) return 'bg-status-success-subtle text-status-success';
    if (sp <= 5) return 'bg-status-warning-subtle text-status-warning';
    return 'bg-status-danger-subtle text-status-danger';
}

export default function EstimationShow({ project, session, members }: Props) {
    const { auth } = usePage<PageProps>().props;
    const currentUserId = auth.user?.id;

    // Najdi aktuální kolo (první nevyřešené nebo poslední)
    const activeRounds = session.rounds.filter((r) => r.status !== 'confirmed');
    const confirmedRounds = session.rounds.filter((r) => r.status === 'confirmed');

    // Group rounds by task — keep only the latest round per task
    const latestRoundsByTask = new Map<string, Round>();
    for (const round of session.rounds) {
        const existing = latestRoundsByTask.get(round.task.id);
        if (!existing || round.round_number > existing.round_number) {
            latestRoundsByTask.set(round.task.id, round);
        }
    }
    const allLatestRounds = Array.from(latestRoundsByTask.values());

    const [activeIndex, setActiveIndex] = useState(() => {
        const firstActive = allLatestRounds.findIndex((r) => r.status !== 'confirmed');
        return firstActive >= 0 ? firstActive : 0;
    });

    const currentRound = allLatestRounds[activeIndex];
    const isCompleted = session.status === 'completed';

    const breadcrumbs: Breadcrumb[] = [
        { label: 'Domů', href: '/' },
        { label: 'Projekty', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Estimation', href: `/projects/${project.id}/estimation` },
        { label: session.name },
    ];

    function castVote(value: number) {
        if (!currentRound || currentRound.status !== 'voting') return;
        router.post(
            `/projects/${project.id}/estimation/${session.id}/rounds/${currentRound.id}/vote`,
            { value },
            { preserveScroll: true },
        );
    }

    function reveal() {
        if (!currentRound) return;
        router.post(
            `/projects/${project.id}/estimation/${session.id}/rounds/${currentRound.id}/reveal`,
            {},
            { preserveScroll: true },
        );
    }

    function confirm(value: number) {
        if (!currentRound) return;
        router.post(
            `/projects/${project.id}/estimation/${session.id}/rounds/${currentRound.id}/confirm`,
            { final_value: value },
            { preserveScroll: true },
        );
    }

    function revote() {
        if (!currentRound) return;
        router.post(
            `/projects/${project.id}/estimation/${session.id}/rounds/${currentRound.id}/revote`,
            {},
            { preserveScroll: true },
        );
    }

    function completeSession() {
        router.post(`/projects/${project.id}/estimation/${session.id}/complete`, {}, { preserveScroll: true });
    }

    const myVote = currentRound?.votes.find((v) => v.user.id === currentUserId);
    const voteValues = currentRound?.votes.filter((v) => v.value != null).map((v) => v.value!) ?? [];
    const average = voteValues.length > 0 ? voteValues.reduce((a, b) => a + b, 0) / voteValues.length : 0;
    const allSame = voteValues.length > 0 && voteValues.every((v) => v === voteValues[0]);
    const nearestFib = FIBONACCI.reduce(
        (prev, curr) => (Math.abs(curr - average) < Math.abs(prev - average) ? curr : prev),
        FIBONACCI[0],
    );

    return (
        <AppLayout title={`${session.name} — Estimation`} breadcrumbs={breadcrumbs}>
            <div className="mb-4">
                <ProjectHeaderCompact project={project} />
            </div>

            {/* Session header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Dices className="h-5 w-5 text-brand-primary" />
                        <h1 className="text-xl font-bold text-text-strong">{session.name}</h1>
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                session.status === 'active'
                                    ? 'bg-status-success-subtle text-status-success'
                                    : 'bg-surface-secondary text-text-muted'
                            }`}
                        >
                            {session.status === 'active' ? 'Aktivní' : 'Dokončeno'}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">
                        {confirmedRounds.length}/{allLatestRounds.length} odhadnuto · Vytvořil {session.creator.name}
                    </p>
                </div>
                {session.status === 'active' && confirmedRounds.length === allLatestRounds.length && (
                    <Button onClick={completeSession} icon={<Trophy className="h-3.5 w-3.5" />}>
                        Dokončit session
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Task navigation */}
                <div className="w-full space-y-1 lg:w-56 lg:flex-shrink-0">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">Úkoly</p>
                    {allLatestRounds.map((round, idx) => (
                        <button
                            key={round.id}
                            onClick={() => setActiveIndex(idx)}
                            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                idx === activeIndex
                                    ? 'bg-brand-soft text-brand-primary'
                                    : 'text-text-default hover:bg-surface-hover'
                            }`}
                        >
                            {round.status === 'confirmed' ? (
                                <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-status-success" />
                            ) : (
                                <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border border-border-default text-[8px] font-bold">
                                    {idx + 1}
                                </span>
                            )}
                            <span className="truncate">
                                <span className="mr-1 font-semibold text-text-muted">#{round.task.number}</span>
                                {round.task.title}
                            </span>
                            {round.final_value != null && (
                                <span
                                    className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${spColor(round.final_value)}`}
                                >
                                    {round.final_value}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Main voting area */}
                <div className="min-w-0 flex-1">
                    {currentRound && (
                        <div className="space-y-4">
                            {/* Task card */}
                            <div className="rounded-lg border border-border-subtle bg-surface-primary p-5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-text-muted">
                                        #{currentRound.task.number}
                                    </span>
                                    <h2 className="text-lg font-bold text-text-strong">{currentRound.task.title}</h2>
                                    {currentRound.task.story_points != null && (
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${spColor(currentRound.task.story_points)}`}
                                        >
                                            Aktuální: {currentRound.task.story_points} SP
                                        </span>
                                    )}
                                </div>
                                {currentRound.task.description && (
                                    <p className="mt-2 text-sm text-text-muted line-clamp-3">
                                        {currentRound.task.description}
                                    </p>
                                )}
                                {currentRound.round_number > 1 && (
                                    <p className="mt-2 text-xs text-status-warning">Kolo {currentRound.round_number}</p>
                                )}
                            </div>

                            {/* Voting cards */}
                            {currentRound.status === 'voting' && !isCompleted && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                        Vaše volba
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {FIBONACCI.map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => castVote(val)}
                                                className={`flex h-16 w-12 items-center justify-center rounded-lg border-2 text-lg font-bold transition-all hover:-translate-y-1 hover:shadow-md ${
                                                    myVote?.value === val
                                                        ? 'border-brand-primary bg-brand-primary text-text-inverse shadow-md'
                                                        : 'border-border-subtle bg-surface-primary text-text-strong hover:border-brand-muted'
                                                }`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Participants */}
                            <div className="rounded-lg border border-border-subtle bg-surface-primary p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Hlasování ({currentRound.votes.length}/{members.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {members.map((member) => {
                                        const vote = currentRound.votes.find((v) => v.user.id === member.id);
                                        const hasVoted = !!vote;
                                        const isRevealed = currentRound.status !== 'voting';
                                        return (
                                            <div
                                                key={member.id}
                                                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                                                    hasVoted
                                                        ? 'border-status-success/30 bg-status-success-subtle/30'
                                                        : 'border-border-subtle bg-surface-secondary'
                                                }`}
                                            >
                                                <span className="text-text-default">{member.name}</span>
                                                {hasVoted && isRevealed && vote?.value != null && (
                                                    <span
                                                        className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${spColor(vote.value)}`}
                                                    >
                                                        {vote.value}
                                                    </span>
                                                )}
                                                {hasVoted && !isRevealed && (
                                                    <span className="rounded-full bg-status-success-subtle px-1.5 py-0.5 text-[10px] font-bold text-status-success">
                                                        ✓
                                                    </span>
                                                )}
                                                {!hasVoted && <span className="text-xs text-text-muted">—</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Reveal button */}
                                {currentRound.status === 'voting' && !isCompleted && (
                                    <div className="mt-3">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={reveal}
                                            disabled={currentRound.votes.length === 0}
                                            icon={<Eye className="h-3.5 w-3.5" />}
                                        >
                                            Odhalit karty
                                        </Button>
                                    </div>
                                )}

                                {/* Results after reveal */}
                                {currentRound.status === 'revealed' && (
                                    <div className="mt-4 space-y-3 border-t border-border-subtle pt-3">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-xs text-text-muted">Průměr</p>
                                                <p className="text-lg font-bold text-text-strong">
                                                    {average.toFixed(1)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-muted">Konsenzus</p>
                                                <p
                                                    className={`text-sm font-bold ${allSame ? 'text-status-success' : 'text-status-warning'}`}
                                                >
                                                    {allSame ? 'Shoda!' : 'Bez shody'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-muted">Doporučená hodnota</p>
                                                <p className="text-lg font-bold text-brand-primary">{nearestFib}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <p className="w-full text-xs font-semibold text-text-subtle">
                                                Potvrdit hodnotu:
                                            </p>
                                            {FIBONACCI.map((val) => (
                                                <Button
                                                    key={val}
                                                    variant={val === nearestFib ? 'primary' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => confirm(val)}
                                                >
                                                    {val}
                                                </Button>
                                            ))}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={revote}
                                                icon={<RefreshCw className="h-3 w-3" />}
                                            >
                                                Přehlasovat
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Confirmed result */}
                                {currentRound.status === 'confirmed' && currentRound.final_value != null && (
                                    <div className="mt-4 flex items-center gap-3 border-t border-border-subtle pt-3">
                                        <CheckCircle className="h-5 w-5 text-status-success" />
                                        <span className="text-sm font-semibold text-text-strong">Finální odhad:</span>
                                        <span
                                            className={`rounded-full px-3 py-1 text-sm font-bold ${spColor(currentRound.final_value)}`}
                                        >
                                            {currentRound.final_value} SP
                                        </span>
                                        <span className="text-xs text-text-muted">
                                            ({currentRound.final_value * 4}h)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={activeIndex === 0}
                                    onClick={() => setActiveIndex(activeIndex - 1)}
                                >
                                    ← Předchozí
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={activeIndex === allLatestRounds.length - 1}
                                    onClick={() => setActiveIndex(activeIndex + 1)}
                                >
                                    Další →
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
