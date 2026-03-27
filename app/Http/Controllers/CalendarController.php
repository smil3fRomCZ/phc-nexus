<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Modules\Work\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CalendarController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $month = $request->input('month', now()->format('Y-m'));
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $tasks = Task::query()
            ->with(['project:id,name,key'])
            ->where('assignee_id', $user->id)
            ->whereNotNull('due_date')
            ->whereNotIn('status', ['cancelled'])
            ->whereBetween('due_date', [$start, $end])
            ->orderBy('due_date')
            ->get(['id', 'title', 'status', 'priority', 'due_date', 'project_id']);

        return Inertia::render('Calendar/Index', [
            'tasks' => $tasks,
            'month' => $month,
        ]);
    }
}
