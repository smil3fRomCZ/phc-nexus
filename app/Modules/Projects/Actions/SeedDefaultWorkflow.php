<?php

declare(strict_types=1);

namespace App\Modules\Projects\Actions;

use App\Modules\Projects\Enums\ProjectType;
use App\Modules\Projects\Models\Project;

final class SeedDefaultWorkflow
{
    public static function execute(Project $project): void
    {
        $type = $project->project_type ?? ProjectType::Custom;
        [$statuses, $transitions] = self::configFor($type);

        $created = [];
        foreach ($statuses as $s) {
            $created[$s['slug']] = $project->workflowStatuses()->create([
                'name' => $s['name'],
                'slug' => $s['slug'],
                'color' => $s['color'],
                'position' => $s['position'],
                'is_initial' => $s['is_initial'] ?? false,
                'is_done' => $s['is_done'] ?? false,
                'is_cancelled' => $s['is_cancelled'] ?? false,
                'allow_transition_from_any' => $s['allow_transition_from_any'] ?? false,
            ]);
        }

        foreach ($transitions as [$from, $to]) {
            $project->workflowTransitions()->create([
                'from_status_id' => $created[$from]->getAttribute('id'),
                'to_status_id' => $created[$to]->getAttribute('id'),
            ]);
        }
    }

    /**
     * @return array{0: list<array<string,mixed>>, 1: list<array{0:string,1:string}>}
     */
    private static function configFor(ProjectType $type): array
    {
        return match ($type) {
            ProjectType::Software => self::softwareConfig(),
            ProjectType::TaskManagement => self::taskManagementConfig(),
            ProjectType::Approval => self::approvalConfig(),
            ProjectType::Custom => self::customConfig(),
        };
    }

    /** @return array{0: list<array<string,mixed>>, 1: list<array{0:string,1:string}>} */
    private static function softwareConfig(): array
    {
        $statuses = [
            ['name' => 'Backlog', 'slug' => 'backlog', 'color' => '#97a0af', 'position' => 0, 'is_initial' => true],
            ['name' => 'K zpracování', 'slug' => 'todo', 'color' => '#4c9aff', 'position' => 1],
            ['name' => 'V průběhu', 'slug' => 'in_progress', 'color' => '#0065ff', 'position' => 2],
            ['name' => 'Code Review', 'slug' => 'code_review', 'color' => '#8777d9', 'position' => 3],
            ['name' => 'QA', 'slug' => 'qa', 'color' => '#ff8b00', 'position' => 4],
            ['name' => 'Hotovo', 'slug' => 'done', 'color' => '#36b37e', 'position' => 5, 'is_done' => true],
            ['name' => 'Zrušeno', 'slug' => 'cancelled', 'color' => '#6b778c', 'position' => 6, 'is_cancelled' => true, 'allow_transition_from_any' => true],
        ];

        $transitions = [
            ['backlog', 'todo'],
            ['todo', 'in_progress'],
            ['todo', 'backlog'],
            ['in_progress', 'code_review'],
            ['in_progress', 'todo'],
            ['code_review', 'qa'],
            ['code_review', 'in_progress'],
            ['qa', 'done'],
            ['qa', 'in_progress'],
            ['done', 'in_progress'],
            ['cancelled', 'backlog'],
        ];

        return [$statuses, $transitions];
    }

    /** @return array{0: list<array<string,mixed>>, 1: list<array{0:string,1:string}>} */
    private static function taskManagementConfig(): array
    {
        $statuses = [
            ['name' => 'K zpracování', 'slug' => 'todo', 'color' => '#4c9aff', 'position' => 0, 'is_initial' => true],
            ['name' => 'V průběhu', 'slug' => 'in_progress', 'color' => '#0065ff', 'position' => 1],
            ['name' => 'Hotovo', 'slug' => 'done', 'color' => '#36b37e', 'position' => 2, 'is_done' => true],
            ['name' => 'Zrušeno', 'slug' => 'cancelled', 'color' => '#6b778c', 'position' => 3, 'is_cancelled' => true, 'allow_transition_from_any' => true],
        ];

        $transitions = [
            ['todo', 'in_progress'],
            ['in_progress', 'done'],
            ['in_progress', 'todo'],
            ['done', 'todo'],
            ['cancelled', 'todo'],
        ];

        return [$statuses, $transitions];
    }

    /** @return array{0: list<array<string,mixed>>, 1: list<array{0:string,1:string}>} */
    private static function approvalConfig(): array
    {
        $statuses = [
            ['name' => 'Návrh', 'slug' => 'draft', 'color' => '#97a0af', 'position' => 0, 'is_initial' => true],
            ['name' => 'Ke schválení', 'slug' => 'pending_approval', 'color' => '#ff8b00', 'position' => 1],
            ['name' => 'Schváleno', 'slug' => 'approved', 'color' => '#36b37e', 'position' => 2, 'is_done' => true],
            ['name' => 'Zamítnuto', 'slug' => 'rejected', 'color' => '#ff5630', 'position' => 3],
            ['name' => 'Zrušeno', 'slug' => 'cancelled', 'color' => '#6b778c', 'position' => 4, 'is_cancelled' => true, 'allow_transition_from_any' => true],
        ];

        $transitions = [
            ['draft', 'pending_approval'],
            ['pending_approval', 'approved'],
            ['pending_approval', 'rejected'],
            ['pending_approval', 'draft'],
            ['rejected', 'draft'],
            ['cancelled', 'draft'],
        ];

        return [$statuses, $transitions];
    }

    /** @return array{0: list<array<string,mixed>>, 1: list<array{0:string,1:string}>} */
    private static function customConfig(): array
    {
        $statuses = [
            ['name' => 'Backlog', 'slug' => 'backlog', 'color' => '#97a0af', 'position' => 0, 'is_initial' => true],
            ['name' => 'K zpracování', 'slug' => 'todo', 'color' => '#4c9aff', 'position' => 1],
            ['name' => 'V průběhu', 'slug' => 'in_progress', 'color' => '#0065ff', 'position' => 2],
            ['name' => 'V revizi', 'slug' => 'in_review', 'color' => '#8777d9', 'position' => 3],
            ['name' => 'Hotovo', 'slug' => 'done', 'color' => '#36b37e', 'position' => 4, 'is_done' => true],
            ['name' => 'Zrušeno', 'slug' => 'cancelled', 'color' => '#6b778c', 'position' => 5, 'is_cancelled' => true, 'allow_transition_from_any' => true],
        ];

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

        return [$statuses, $transitions];
    }
}
