<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Modules\Approvals\Models\ApprovalRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class ApprovalAnalyticsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $all = ApprovalRequest::query()
            ->with(['requester:id,name', 'approvable'])
            ->latest()
            ->limit(200)
            ->get();

        $resolved = $all->whereNotNull('decided_at');

        $avgTimeHours = $resolved->isEmpty() ? 0 : $resolved->avg(function (ApprovalRequest $r) {
            return $r->created_at->diffInMinutes($r->decided_at) / 60;
        });

        $stats = [
            'total' => $all->count(),
            'pending' => $all->where('status.value', 'pending')->count(),
            'approved' => $all->where('status.value', 'approved')->count(),
            'rejected' => $all->where('status.value', 'rejected')->count(),
            'cancelled' => $all->where('status.value', 'cancelled')->count(),
            'avg_resolution_hours' => round($avgTimeHours, 1),
        ];

        $history = $all->map(function (ApprovalRequest $r): array {
            $approvable = $r->approvable;
            /** @var Carbon|null $decidedAt */
            $decidedAt = $r->decided_at;

            return [
                'id' => $r->id,
                'description' => $r->description,
                'status' => is_object($r->status) ? $r->status->value : (string) $r->status,
                'requester_name' => $r->requester->name ?? '',
                'approvable_title' => method_exists($approvable, 'getAttribute') ? ($approvable->getAttribute('title') ?? '') : '',
                'created_at' => $r->created_at->toISOString(),
                'decided_at' => $decidedAt instanceof \DateTimeInterface ? $decidedAt->format('c') : null,
                'resolution_hours' => $decidedAt instanceof \DateTimeInterface
                    ? round($r->created_at->diffInMinutes($decidedAt) / 60, 1)
                    : null,
            ];
        });

        return Inertia::render('Admin/ApprovalAnalytics/Index', [
            'stats' => $stats,
            'history' => $history,
        ]);
    }
}
