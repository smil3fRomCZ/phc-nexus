<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class ProjectHistoryController extends Controller
{
    public function index(Project $project): Response
    {
        Gate::authorize('view', $project);

        $events = [];

        // Status updates
        $updates = DB::table('project_updates')
            ->leftJoin('users', 'project_updates.author_id', '=', 'users.id')
            ->where('project_updates.project_id', $project->id)
            ->orderByDesc('project_updates.created_at')
            ->get([
                'project_updates.id',
                'project_updates.health',
                'project_updates.body',
                'project_updates.created_at',
                'users.id as user_id',
                'users.name as user_name',
            ]);

        foreach ($updates as $row) {
            $events[] = [
                'type' => 'update',
                'id' => 'update-'.$row->id,
                'created_at' => $this->iso($row->created_at),
                'actor' => $row->user_id ? ['id' => (string) $row->user_id, 'name' => $row->user_name] : null,
                'data' => [
                    'health' => $row->health,
                    'body' => $row->body,
                ],
            ];
        }

        // Audit entries (project itself)
        $audits = DB::table('audit_entries')
            ->leftJoin('users', 'audit_entries.actor_id', '=', 'users.id')
            ->where('audit_entries.entity_type', Project::class)
            ->where('audit_entries.entity_id', $project->id)
            ->orderByDesc('audit_entries.created_at')
            ->get([
                'audit_entries.id',
                'audit_entries.action',
                'audit_entries.old_values',
                'audit_entries.new_values',
                'audit_entries.created_at',
                'users.id as user_id',
                'users.name as user_name',
            ]);

        foreach ($audits as $row) {
            $events[] = [
                'type' => 'audit',
                'id' => 'audit-'.$row->id,
                'created_at' => $this->iso($row->created_at),
                'actor' => $row->user_id ? ['id' => (string) $row->user_id, 'name' => $row->user_name] : null,
                'data' => [
                    'action' => $row->action,
                    'old_values' => $this->decodeJson($row->old_values),
                    'new_values' => $this->decodeJson($row->new_values),
                ],
            ];
        }

        // Comments on the project
        $comments = DB::table('comments')
            ->leftJoin('users', 'comments.author_id', '=', 'users.id')
            ->where('comments.commentable_type', Project::class)
            ->where('comments.commentable_id', $project->id)
            ->orderByDesc('comments.created_at')
            ->get([
                'comments.id',
                'comments.body',
                'comments.created_at',
                'users.id as user_id',
                'users.name as user_name',
            ]);

        foreach ($comments as $row) {
            $events[] = [
                'type' => 'comment',
                'id' => 'comment-'.$row->id,
                'created_at' => $this->iso($row->created_at),
                'actor' => $row->user_id ? ['id' => (string) $row->user_id, 'name' => $row->user_name] : null,
                'data' => [
                    'body' => $row->body,
                ],
            ];
        }

        // Time entries — aggregated per (date, user) to avoid feed pollution
        $times = DB::table('time_entries')
            ->leftJoin('users', 'time_entries.user_id', '=', 'users.id')
            ->where('time_entries.project_id', $project->id)
            ->groupBy('time_entries.user_id', 'time_entries.date', 'users.id', 'users.name')
            ->orderByDesc(DB::raw('max(time_entries.created_at)'))
            ->get([
                'time_entries.user_id',
                'time_entries.date',
                DB::raw('sum(time_entries.hours) as total_hours'),
                DB::raw('count(*) as entries_count'),
                DB::raw('max(time_entries.created_at) as max_created'),
                'users.id as uid',
                'users.name as user_name',
            ]);

        foreach ($times as $row) {
            $events[] = [
                'type' => 'time',
                'id' => 'time-'.$row->user_id.'-'.$row->date,
                'created_at' => $this->iso($row->max_created),
                'actor' => $row->uid ? ['id' => (string) $row->uid, 'name' => $row->user_name] : null,
                'data' => [
                    'date' => $row->date,
                    'hours' => (float) $row->total_hours,
                    'entries_count' => (int) $row->entries_count,
                ],
            ];
        }

        usort($events, fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return Inertia::render('Projects/History', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'key' => $project->key,
                'status' => $project->status,
            ],
            'events' => $events,
            'lastUpdate' => $this->latestUpdate($project),
        ]);
    }

    /**
     * @return array{health: string, created_at: string|null}|null
     */
    private function latestUpdate(Project $project): ?array
    {
        $row = DB::table('project_updates')
            ->where('project_id', $project->id)
            ->orderByDesc('created_at')
            ->first(['health', 'created_at']);

        if ($row === null) {
            return null;
        }

        return [
            'health' => (string) $row->health,
            'created_at' => $this->iso($row->created_at),
        ];
    }

    private function iso(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return Carbon::parse((string) $value)->toIso8601String();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeJson(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value)) {
            /** @var array<string, mixed> $value */
            return $value;
        }

        $decoded = json_decode((string) $value, true);

        return is_array($decoded) ? $decoded : null;
    }
}
