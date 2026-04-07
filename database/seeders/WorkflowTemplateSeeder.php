<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Projects\Actions\SeedDefaultWorkflow;
use App\Modules\Projects\Models\WorkflowTemplate;
use App\Modules\Projects\Models\WorkflowTemplateStatus;
use App\Modules\Projects\Models\WorkflowTemplateTransition;
use Illuminate\Database\Seeder;

class WorkflowTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            [
                'name' => 'Software Development',
                'slug' => 'software',
                'description' => 'Workflow pro vývoj softwaru s code review a QA fází.',
                'category' => 'software',
            ],
            [
                'name' => 'Správa úkolů',
                'slug' => 'task-management',
                'description' => 'Jednoduchý workflow pro běžné řízení úkolů.',
                'category' => 'task_management',
            ],
            [
                'name' => 'Schvalování',
                'slug' => 'approval',
                'description' => 'Workflow pro schvalovací a nákupní procesy.',
                'category' => 'approval',
            ],
            [
                'name' => 'Vlastní',
                'slug' => 'custom',
                'description' => 'Univerzální workflow s revizní fází.',
                'category' => 'custom',
            ],
        ];

        // Reuse existing SeedDefaultWorkflow configs
        $typeConfigs = [
            'software' => 'softwareConfig',
            'task-management' => 'taskManagementConfig',
            'approval' => 'approvalConfig',
            'custom' => 'customConfig',
        ];

        // Use reflection to access private methods
        $reflection = new \ReflectionClass(SeedDefaultWorkflow::class);

        foreach ($configs as $config) {
            if (WorkflowTemplate::where('slug', $config['slug'])->exists()) {
                continue;
            }

            $template = WorkflowTemplate::create([
                'name' => $config['name'],
                'slug' => $config['slug'],
                'description' => $config['description'],
                'category' => $config['category'],
                'is_system' => true,
                'published_at' => now(),
            ]);

            $method = $reflection->getMethod($typeConfigs[$config['slug']]);
            [$statuses, $transitions] = $method->invoke(null);

            $created = [];
            foreach ($statuses as $s) {
                $created[$s['slug']] = WorkflowTemplateStatus::create([
                    'template_id' => $template->id,
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
                WorkflowTemplateTransition::create([
                    'template_id' => $template->id,
                    'from_status_id' => $created[$from]->id,
                    'to_status_id' => $created[$to]->id,
                ]);
            }
        }
    }
}
