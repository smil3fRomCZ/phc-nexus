<?php

declare(strict_types=1);

namespace Tests\Feature\Audit;

use App\Models\User;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\PhiClassification;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Projects\Models\Project;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class AuditPhiMaskingTest extends TestCase
{
    use DatabaseMigrations;

    public function test_payload_masked_for_phi_entity(): void
    {
        $actor = User::factory()->create();
        $this->actingAs($actor);

        $project = Project::factory()->create([
            'data_classification' => PhiClassification::Phi,
            'name' => 'Pacientský registr — citlivé',
        ]);

        app(AuditService::class)->log(
            AuditAction::Viewed,
            $project,
            payload: ['name' => 'Pacientský registr', 'ssn' => '123-45-6789'],
            newValues: ['field' => 'value'],
        );

        $entry = AuditEntry::latest('id')->first();
        $this->assertSame(['_masked' => true, 'reason' => 'PHI/unknown classification'], $entry->payload);
        $this->assertSame(['_masked' => true, 'reason' => 'PHI/unknown classification'], $entry->new_values);
    }

    public function test_payload_masked_for_unknown_classification(): void
    {
        $actor = User::factory()->create();
        $this->actingAs($actor);

        $project = Project::factory()->create([
            'data_classification' => PhiClassification::Unknown,
        ]);

        app(AuditService::class)->log(
            AuditAction::Viewed,
            $project,
            payload: ['leak' => 'xxx'],
        );

        $entry = AuditEntry::latest('id')->first();
        $this->assertSame(['_masked' => true, 'reason' => 'PHI/unknown classification'], $entry->payload);
    }

    public function test_payload_not_masked_for_non_phi(): void
    {
        $actor = User::factory()->create();
        $this->actingAs($actor);

        $project = Project::factory()->create([
            'data_classification' => PhiClassification::NonPhi,
            'name' => 'Veřejný katalog',
        ]);

        app(AuditService::class)->log(
            AuditAction::Viewed,
            $project,
            payload: ['name' => 'Veřejný katalog'],
        );

        $entry = AuditEntry::latest('id')->first();
        $this->assertSame(['name' => 'Veřejný katalog'], $entry->payload);
    }
}
