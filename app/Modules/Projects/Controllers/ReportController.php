<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Project $project): Response
    {
        Gate::authorize('view', $project);

        $taskStats = $this->taskStats($project);
        $timeStats = $this->timeStats($project);
        $epicProgress = $this->epicProgress($project);
        $memberActivity = $this->memberActivity($project);
        $approvalStats = $this->approvalStats($project);

        return Inertia::render('Projects/Reports', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'taskStats' => $taskStats,
            'timeStats' => $timeStats,
            'epicProgress' => $epicProgress,
            'memberActivity' => $memberActivity,
            'approvalStats' => $approvalStats,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function taskStats(Project $project): array
    {
        $total = $project->tasks()->count();
        /** @var \Illuminate\Database\Eloquent\Collection<int, WorkflowStatus> $wsCollection */
        $wsCollection = $project->workflowStatuses()
            ->withCount(['tasks' => fn ($q) => $q->where('project_id', $project->id)])
            ->get();
        $statuses = $wsCollection->map(fn (WorkflowStatus $ws) => [
            'name' => $ws->name,
            'color' => $ws->color,
            'count' => $ws->tasks_count,
            'is_done' => $ws->is_done,
            'is_cancelled' => $ws->is_cancelled,
        ]);

        $completed = $statuses->where('is_done', true)->sum('count');
        $overdue = $project->tasks()
            ->whereHas('workflowStatus', fn ($q) => $q->where('is_done', false)->where('is_cancelled', false))
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->count();

        $totalSp = (int) $project->tasks()->sum('story_points');
        $completedSp = (int) $project->tasks()
            ->whereHas('workflowStatus', fn ($q) => $q->where('is_done', true))
            ->sum('story_points');

        $priorities = $project->tasks()
            ->select('priority', DB::raw('count(*) as count'))
            ->groupBy('priority')
            ->pluck('count', 'priority');

        return [
            'total' => $total,
            'completed' => $completed,
            'overdue' => $overdue,
            'completedPercent' => $total > 0 ? round($completed / $total * 100) : 0,
            'totalSp' => $totalSp,
            'completedSp' => $completedSp,
            'byStatus' => $statuses->values(),
            'byPriority' => $priorities,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function timeStats(Project $project): array
    {
        $totalHours = (float) $project->timeEntries()->sum('hours');

        $byMember = TimeEntry::where('project_id', $project->id)
            ->join('users', 'users.id', '=', 'time_entries.user_id')
            ->select('users.name', DB::raw('SUM(hours) as total_hours'), DB::raw('COUNT(*) as entries_count'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_hours')
            ->get();

        $byWeek = TimeEntry::where('project_id', $project->id)
            ->select(
                DB::raw("to_char(date, 'IYYY-IW') as week"),
                DB::raw('SUM(hours) as total_hours'),
            )
            ->groupBy('week')
            ->orderBy('week')
            ->limit(12)
            ->get();

        $estimatedHours = (float) $project->tasks()->sum(DB::raw('COALESCE(estimated_hours, story_points * 4, 0)'));

        return [
            'totalHours' => round($totalHours, 1),
            'estimatedHours' => round($estimatedHours, 1),
            'byMember' => $byMember,
            'byWeek' => $byWeek,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function epicProgress(Project $project): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Epic> $epics */
        $epics = $project->epics()
            ->withCount([
                'tasks',
                'tasks as tasks_done_count' => fn ($q) => $q->whereHas('workflowStatus', fn ($ws) => $ws->where('is_done', true)),
            ])
            ->withSum('tasks', 'story_points')
            ->withSum(['tasks as tasks_done_sp_sum' => fn ($q) => $q->whereHas('workflowStatus', fn ($ws) => $ws->where('is_done', true))], 'story_points')
            ->orderBy('title')
            ->get();

        return $epics->map(fn (Epic $epic) => [
            'id' => $epic->id,
            'title' => $epic->title,
            'tasks_count' => $epic->tasks_count,
            'tasks_done_count' => $epic->tasks_done_count,
            'total_sp' => (int) $epic->tasks_sum_story_points,
            'done_sp' => (int) $epic->tasks_done_sp_sum,
            'percent' => $epic->tasks_count > 0
                ? round($epic->tasks_done_count / $epic->tasks_count * 100)
                : 0,
        ])->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function memberActivity(Project $project): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, User> $members */
        $members = $project->members()->select('users.id', 'users.name')->get();

        return $members->map(function (User $member) use ($project) {
            $assigned = $project->tasks()->where('assignee_id', $member->id)->count();
            $completed = $project->tasks()
                ->where('assignee_id', $member->id)
                ->whereHas('workflowStatus', fn ($q) => $q->where('is_done', true))
                ->count();
            $hours = (float) TimeEntry::where('project_id', $project->id)
                ->where('user_id', $member->id)
                ->sum('hours');

            return [
                'id' => $member->id,
                'name' => $member->name,
                'assigned' => $assigned,
                'completed' => $completed,
                'hours' => round($hours, 1),
            ];
        })->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function approvalStats(Project $project): array
    {
        $approvals = DB::table('approval_requests')
            ->where('approvable_type', 'App\\Modules\\Work\\Models\\Task')
            ->whereIn('approvable_id', $project->tasks()->select('id'))
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'pending' => $approvals['pending'] ?? 0,
            'approved' => $approvals['approved'] ?? 0,
            'rejected' => $approvals['rejected'] ?? 0,
            'total' => $approvals->sum(),
        ];
    }
}
