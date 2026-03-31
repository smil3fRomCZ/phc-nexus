<?php

declare(strict_types=1);

namespace App\Modules\Projects\Actions;

use App\Modules\Projects\Models\Project;

final class SeedDefaultWorkflow
{
    public static function execute(Project $project): void
    {
        $statuses = [
            ['name' => 'Backlog', 'slug' => 'backlog', 'color' => '#97a0af', 'position' => 0, 'is_initial' => true],
            ['name' => 'K zpracování', 'slug' => 'todo', 'color' => '#4c9aff', 'position' => 1],
            ['name' => 'V průběhu', 'slug' => 'in_progress', 'color' => '#0065ff', 'position' => 2],
            ['name' => 'V revizi', 'slug' => 'in_review', 'color' => '#8777d9', 'position' => 3],
            ['name' => 'Hotovo', 'slug' => 'done', 'color' => '#36b37e', 'position' => 4, 'is_done' => true],
            ['name' => 'Zrušeno', 'slug' => 'cancelled', 'color' => '#6b778c', 'position' => 5, 'is_cancelled' => true, 'allow_transition_from_any' => true],
        ];

        $created = [];
        foreach ($statuses as $s) {
            $created[$s['slug']] = $project->workflowStatuses()->create([
                'name' => $s['name'],
                'slug' => $s['slug'],
                'color' => $s['color'] ?? null,
                'position' => $s['position'],
                'is_initial' => $s['is_initial'] ?? false,
                'is_done' => $s['is_done'] ?? false,
                'is_cancelled' => $s['is_cancelled'] ?? false,
                'allow_transition_from_any' => $s['allow_transition_from_any'] ?? false,
            ]);
        }

        $transitions = [
            ['backlog', 'todo'],
            ['todo', 'in_progress'],
            ['todo', 'backlog'],
            ['in_progress', 'in_review'],
            ['in_progress', 'todo'],
            ['in_review', 'done'],
            ['in_review', 'in_progress'],
            ['done', 'in_progress'],
            ['cancelled', 'backlog'],
        ];

        foreach ($transitions as [$from, $to]) {
            $project->workflowTransitions()->create([
                'from_status_id' => $created[$from]->id,
                'to_status_id' => $created[$to]->id,
            ]);
        }
    }
}
