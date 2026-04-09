<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Modules\Work\Models\TimeEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class MyTimesheetController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $query = TimeEntry::query()
            ->with(['project:id,name,key', 'task:id,title,number', 'epic:id,title'])
            ->where('user_id', $user->id);

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->input('project_id'));
        }

        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->input('date_to'));
        }

        $entries = $query
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->paginate(30)
            ->withQueryString();

        $totalHours = TimeEntry::where('user_id', $user->id)->sum('hours');

        $projects = TimeEntry::where('user_id', $user->id)
            ->select('project_id')
            ->distinct()
            ->with('project:id,name')
            ->get()
            ->pluck('project')
            ->filter()
            ->map(fn ($p) => ['value' => $p->id, 'label' => $p->name])
            ->values();

        return Inertia::render('MyTime/Index', [
            'entries' => $entries,
            'totalHours' => round((float) $totalHours, 2),
            'projects' => $projects,
            'filters' => $request->only(['project_id', 'date_from', 'date_to']),
        ]);
    }
}
