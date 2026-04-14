<?php

declare(strict_types=1);

namespace App\Modules\Audit\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Projects\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class AuditLogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Gate::authorize('viewAny', AuditEntry::class);

        $filters = $request->validate([
            'action' => ['nullable', 'string'],
            'entity_type' => ['nullable', 'string'],
            'actor_id' => ['nullable', 'uuid'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
            'sort' => ['nullable', 'string'],
            'dir' => ['nullable', 'in:asc,desc'],
        ]);

        $viewer = $request->user();
        $hasGlobalAccess = Gate::allows('viewAll', AuditEntry::class);

        $query = AuditEntry::query()
            ->with(['actor:id,name']);

        // Non-Executive scope: jen entries kde je viewer actorem, nebo entries
        // k projektům/subentitám, kterých je viewer member/owner.
        if (! $hasGlobalAccess && $viewer) {
            $projectIds = Project::query()
                ->where(fn ($q) => $q
                    ->where('owner_id', $viewer->id)
                    ->orWhereHas('members', fn ($m) => $m->where('users.id', $viewer->id))
                )
                ->pluck('id');

            $query->where(function ($q) use ($viewer, $projectIds): void {
                $q->where('actor_id', $viewer->id)
                    ->orWhere(function ($sub) use ($viewer): void {
                        $sub->where('entity_type', User::class)
                            ->where('entity_id', $viewer->id);
                    })
                    ->orWhere(function ($sub) use ($projectIds): void {
                        $sub->where('entity_type', Project::class)
                            ->whereIn('entity_id', $projectIds);
                    });
            });
        }

        if (! empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (! empty($filters['entity_type'])) {
            $query->where('entity_type', $filters['entity_type']);
        }

        if (! empty($filters['actor_id'])) {
            // Ne-Executive uživatel může filtrovat actor_id jen na sebe — bez
            // globálního přístupu by jinak šlo šťourat v cizích aktivitách.
            if (! $hasGlobalAccess && $viewer && $filters['actor_id'] !== $viewer->id) {
                abort(403, 'Nemáte oprávnění filtrovat podle jiného uživatele.');
            }
            $query->where('actor_id', $filters['actor_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from'].' 00:00:00');
        }

        if (! empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to'].' 23:59:59');
        }

        $allowedSorts = ['created_at', 'action', 'entity_type'];
        $sort = $filters['sort'] ?? null;
        $dir = ($filters['dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        if ($sort && in_array($sort, $allowedSorts, true)) {
            $query->orderBy($sort, $dir);
        } else {
            $query->latest('created_at');
        }

        $entries = $query
            ->paginate(50)
            ->withQueryString();

        $actions = collect(AuditAction::cases())
            ->map(fn (AuditAction $a) => ['value' => $a->value, 'label' => $a->label()]);

        $entityTypes = AuditEntry::query()
            ->select('entity_type')
            ->distinct()
            ->pluck('entity_type')
            ->map(fn (string $type) => [
                'value' => $type,
                'label' => class_basename($type),
            ]);

        $actors = User::query()
            ->whereIn('id', AuditEntry::select('actor_id')->whereNotNull('actor_id')->distinct())
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/AuditLog/Index', [
            'entries' => $entries,
            'filters' => $request->only(['action', 'entity_type', 'actor_id', 'date_from', 'date_to', 'sort', 'dir']),
            'actions' => $actions,
            'entityTypes' => $entityTypes,
            'actors' => $actors,
        ]);
    }
}
