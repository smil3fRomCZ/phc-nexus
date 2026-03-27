<?php

declare(strict_types=1);

namespace App\Modules\Audit\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class AuditLogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $query = AuditEntry::query()
            ->with(['actor:id,name']);

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->input('entity_type'));
        }

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->input('actor_id'));
        }

        $entries = $query
            ->latest('created_at')
            ->limit(100)
            ->get();

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
            'filters' => $request->only(['action', 'entity_type', 'actor_id']),
            'actions' => $actions,
            'entityTypes' => $entityTypes,
            'actors' => $actors,
        ]);
    }
}
