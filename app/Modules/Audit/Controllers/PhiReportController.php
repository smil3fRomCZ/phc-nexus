<?php

declare(strict_types=1);

namespace App\Modules\Audit\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Audit\Models\AuditEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class PhiReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $query = AuditEntry::query()
            ->with(['actor:id,name'])
            ->where('action', 'phi_accessed');

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->input('actor_id'));
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->input('to').' 23:59:59');
        }

        $entries = $query
            ->latest('created_at')
            ->limit(200)
            ->get();

        $actors = User::query()
            ->whereIn('id', AuditEntry::where('action', 'phi_accessed')->select('actor_id')->whereNotNull('actor_id')->distinct())
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/PhiReport/Index', [
            'entries' => $entries,
            'filters' => $request->only(['actor_id', 'from', 'to']),
            'actors' => $actors,
        ]);
    }
}
