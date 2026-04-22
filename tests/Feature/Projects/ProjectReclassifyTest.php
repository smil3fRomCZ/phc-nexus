<?php

declare(strict_types=1);

namespace Tests\Feature\Projects;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\PhiClassification;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Projects\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectReclassifyTest extends TestCase
{
    use RefreshDatabase;

    public function test_executive_can_reclassify_project(): void
    {
        $exec = User::factory()->executive()->create();
        $project = Project::factory()->create([
            'data_classification' => PhiClassification::NonPhi->value,
        ]);

        $response = $this->actingAs($exec)->patch("/projects/{$project->id}/classification", [
            'data_classification' => PhiClassification::Phi->value,
            'reason' => 'Legal požaduje reklasifikaci po incident review.',
        ]);

        $response->assertRedirect("/projects/{$project->id}");
        $this->assertSame(PhiClassification::Phi->value, $project->fresh()->data_classification->value);
    }

    public function test_project_manager_cannot_reclassify(): void
    {
        $pm = User::factory()->projectManager()->create();
        $project = Project::factory()->create([
            'data_classification' => PhiClassification::NonPhi->value,
        ]);
        $project->members()->attach($pm->id, ['role' => 'owner']);

        $response = $this->actingAs($pm)->patch("/projects/{$project->id}/classification", [
            'data_classification' => PhiClassification::Phi->value,
            'reason' => 'Pokus o reklasifikaci mimo pravomoc.',
        ]);

        $response->assertForbidden();
        $this->assertSame(PhiClassification::NonPhi->value, $project->fresh()->data_classification->value);
    }

    public function test_team_member_cannot_reclassify(): void
    {
        $member = User::factory()->create();
        $project = Project::factory()->create([
            'data_classification' => PhiClassification::NonPhi->value,
        ]);
        $project->members()->attach($member->id, ['role' => 'contributor']);

        $response = $this->actingAs($member)->patch("/projects/{$project->id}/classification", [
            'data_classification' => PhiClassification::Phi->value,
            'reason' => 'Neautorizovaný pokus.',
        ]);

        $response->assertForbidden();
    }

    public function test_project_admin_role_cannot_reclassify(): void
    {
        // Projektový Admin (pivot role) ≠ system Executive — nesmí reclassifikovat.
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'data_classification' => PhiClassification::NonPhi->value,
        ]);
        $project->members()->attach($user->id, ['role' => 'admin']);

        $response = $this->actingAs($user)->patch("/projects/{$project->id}/classification", [
            'data_classification' => PhiClassification::Phi->value,
            'reason' => 'Projektový admin nemá právo na reclassifikaci.',
        ]);

        $response->assertForbidden();
    }

    public function test_reason_is_required(): void
    {
        $exec = User::factory()->executive()->create();
        $project = Project::factory()->create([
            'data_classification' => PhiClassification::NonPhi->value,
        ]);

        $response = $this->actingAs($exec)->patch("/projects/{$project->id}/classification", [
            'data_classification' => PhiClassification::Phi->value,
        ]);

        $response->assertSessionHasErrors('reason');
        $this->assertSame(PhiClassification::NonPhi->value, $project->fresh()->data_classification->value);
    }

    public function test_reason_has_minimum_length(): void
    {
        $exec = User::factory()->executive()->create();
        $project = Project::factory()->create([
            'data_classification' => PhiClassification::NonPhi->value,
        ]);

        $response = $this->actingAs($exec)->patch("/projects/{$project->id}/classification", [
            'data_classification' => PhiClassification::Phi->value,
            'reason' => 'krátký',
        ]);

        $response->assertSessionHasErrors('reason');
    }

    public function test_reclassification_creates_audit_entry_with_phi_classification_changed_action(): void
    {
        $exec = User::factory()->executive()->create();
        $project = Project::factory()->create([
            'data_classification' => PhiClassification::NonPhi->value,
        ]);

        $this->actingAs($exec)->patch("/projects/{$project->id}/classification", [
            'data_classification' => PhiClassification::Phi->value,
            'reason' => 'Legal požaduje přeřazení po PII incidentu.',
        ]);

        $entry = AuditEntry::query()
            ->where('entity_type', $project->getMorphClass())
            ->where('entity_id', $project->id)
            ->where('action', AuditAction::PhiClassificationChanged->value)
            ->latest()
            ->first();

        $this->assertNotNull($entry, 'PhiClassificationChanged audit entry musí existovat');
        $this->assertSame($exec->id, $entry->actor_id);
        $this->assertSame('non_phi', $entry->payload['from']);
        $this->assertSame('phi', $entry->payload['to']);
        $this->assertSame('Legal požaduje přeřazení po PII incidentu.', $entry->payload['reason']);
        $this->assertSame('non_phi', $entry->old_values['data_classification']);
        $this->assertSame('phi', $entry->new_values['data_classification']);
    }

    public function test_standard_update_cannot_change_classification(): void
    {
        // Regrese: defense in depth — i Executive, pokud zkusí změnit klasifikaci
        // přes běžný PUT /projects/{id}, se klasifikace nezmění (není ve validaci).
        $exec = User::factory()->executive()->create();
        $project = Project::factory()->create([
            'data_classification' => PhiClassification::NonPhi->value,
            'name' => 'Original',
        ]);

        $response = $this->actingAs($exec)->put("/projects/{$project->id}", [
            'name' => 'Updated',
            'status' => 'active',
            'data_classification' => PhiClassification::Phi->value,
        ]);

        $response->assertRedirect();
        $fresh = $project->fresh();
        $this->assertSame('Updated', $fresh->name, 'Běžný update musí projít pro povolená pole');
        $this->assertSame(
            PhiClassification::NonPhi->value,
            $fresh->data_classification->value,
            'data_classification se nesmí změnit přes běžný update endpoint',
        );
    }
}
