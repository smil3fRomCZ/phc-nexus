<?php

declare(strict_types=1);

namespace App\Modules\Projects\Actions;

use App\Models\User;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\PhiClassification;
use App\Modules\Projects\Models\Project;
use Illuminate\Support\Facades\DB;

final readonly class ReclassifyProject
{
    public function __construct(
        private AuditService $audit,
    ) {}

    public function execute(
        Project $project,
        PhiClassification $newClassification,
        string $reason,
        User $actor,
    ): Project {
        return DB::transaction(function () use ($project, $newClassification, $reason, $actor) {
            $from = $project->data_classification instanceof PhiClassification
                ? $project->data_classification->value
                : (string) $project->data_classification;
            $to = $newClassification->value;

            if ($from === $to) {
                return $project;
            }

            $project->data_classification = $newClassification;
            $project->saveQuietly();

            $this->audit->log(
                action: AuditAction::PhiClassificationChanged,
                entity: $project,
                payload: [
                    'from' => $from,
                    'to' => $to,
                    'reason' => $reason,
                    'actor_id' => $actor->id,
                ],
                oldValues: ['data_classification' => $from],
                newValues: ['data_classification' => $to],
            );

            return $project->fresh();
        });
    }
}
