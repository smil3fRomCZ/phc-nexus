<?php

declare(strict_types=1);

namespace Tests\Feature\Projects;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTabConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_save_custom_tab_order(): void
    {
        $owner = User::factory()->executive()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        $response = $this->actingAs($owner)->put("/projects/{$project->id}/tab-config", [
            'order' => ['board', 'approvals', 'table', 'epics'],
            'hidden' => ['estimation', 'gantt'],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $project->refresh();
        $this->assertNotNull($project->tab_config);
        $this->assertSame(
            ['overview', 'board', 'approvals', 'table', 'epics'],
            $project->tab_config['order'],
        );
        $this->assertSame(['estimation', 'gantt'], $project->tab_config['hidden']);
    }

    public function test_overview_is_forced_first_even_if_omitted_or_moved(): void
    {
        $owner = User::factory()->executive()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        $this->actingAs($owner)->put("/projects/{$project->id}/tab-config", [
            'order' => ['board', 'table', 'overview', 'epics'],
            'hidden' => [],
        ]);

        $project->refresh();
        $this->assertSame('overview', $project->tab_config['order'][0]);
        $this->assertSame(['overview', 'board', 'table', 'epics'], $project->tab_config['order']);
    }

    public function test_overview_cannot_be_hidden(): void
    {
        $owner = User::factory()->executive()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        $this->actingAs($owner)->put("/projects/{$project->id}/tab-config", [
            'order' => ['overview', 'board'],
            'hidden' => ['overview', 'estimation'],
        ]);

        $project->refresh();
        $this->assertSame(['estimation'], $project->tab_config['hidden']);
    }

    public function test_reset_removes_tab_config(): void
    {
        $owner = User::factory()->executive()->create();
        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'tab_config' => ['order' => ['overview', 'board'], 'hidden' => []],
        ]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        $response = $this->actingAs($owner)->delete("/projects/{$project->id}/tab-config");

        $response->assertRedirect();
        $project->refresh();
        $this->assertNull($project->tab_config);
    }

    public function test_non_manager_member_cannot_update_tab_config(): void
    {
        $owner = User::factory()->executive()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);
        $project->members()->attach($member->id, ['role' => 'member']);

        $response = $this->actingAs($member)->put("/projects/{$project->id}/tab-config", [
            'order' => ['overview', 'board'],
            'hidden' => [],
        ]);

        $response->assertForbidden();
        $project->refresh();
        $this->assertNull($project->tab_config);
    }

    public function test_unknown_tab_keys_are_rejected(): void
    {
        $owner = User::factory()->executive()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        $response = $this->actingAs($owner)->put("/projects/{$project->id}/tab-config", [
            'order' => ['overview', 'fake_tab'],
            'hidden' => [],
        ]);

        $response->assertSessionHasErrors('order.1');
    }

    public function test_empty_order_is_rejected(): void
    {
        $owner = User::factory()->executive()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        $response = $this->actingAs($owner)->put("/projects/{$project->id}/tab-config", [
            'order' => [],
            'hidden' => [],
        ]);

        $response->assertSessionHasErrors('order');
    }

    public function test_project_manager_member_can_update_tab_config(): void
    {
        $owner = User::factory()->executive()->create();
        $manager = User::factory()->projectManager()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);
        $project->members()->attach($manager->id, ['role' => 'manager']);

        $response = $this->actingAs($manager)->put("/projects/{$project->id}/tab-config", [
            'order' => ['overview', 'board', 'table'],
            'hidden' => ['estimation'],
        ]);

        $response->assertRedirect();
        $project->refresh();
        $this->assertSame(['overview', 'board', 'table'], $project->tab_config['order']);
        $this->assertSame(['estimation'], $project->tab_config['hidden']);
    }

    public function test_non_member_project_manager_cannot_update_tab_config(): void
    {
        $owner = User::factory()->executive()->create();
        $outsider = User::factory()->projectManager()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        $response = $this->actingAs($outsider)->put("/projects/{$project->id}/tab-config", [
            'order' => ['overview', 'board'],
            'hidden' => [],
        ]);

        $response->assertForbidden();
        $project->refresh();
        $this->assertNull($project->tab_config);
    }

    public function test_unknown_key_in_hidden_is_rejected(): void
    {
        $owner = User::factory()->executive()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        $response = $this->actingAs($owner)->put("/projects/{$project->id}/tab-config", [
            'order' => ['overview', 'board'],
            'hidden' => ['fake_tab'],
        ]);

        $response->assertSessionHasErrors('hidden.0');
    }

    public function test_duplicate_keys_in_order_are_deduped(): void
    {
        $owner = User::factory()->executive()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        $this->actingAs($owner)->put("/projects/{$project->id}/tab-config", [
            'order' => ['board', 'table', 'board', 'epics', 'table'],
            'hidden' => ['gantt', 'gantt'],
        ]);

        $project->refresh();
        $this->assertSame(
            ['overview', 'board', 'table', 'epics'],
            $project->tab_config['order'],
        );
        $this->assertSame(['gantt'], $project->tab_config['hidden']);
    }

    public function test_non_manager_member_cannot_reset_tab_config(): void
    {
        $owner = User::factory()->executive()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $owner->id,
            'tab_config' => ['order' => ['overview', 'board'], 'hidden' => []],
        ]);
        $project->members()->attach($owner->id, ['role' => 'owner']);
        $project->members()->attach($member->id, ['role' => 'member']);

        $response = $this->actingAs($member)->delete("/projects/{$project->id}/tab-config");

        $response->assertForbidden();
        $project->refresh();
        $this->assertNotNull($project->tab_config);
    }
}
