<?php

declare(strict_types=1);

namespace Tests\Feature\Organization;

use App\Models\User;
use App\Modules\Organization\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_own_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/profile');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Profile/Index'));
    }

    public function test_profile_contains_user_data(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/profile');

        $response->assertInertia(fn ($page) => $page
            ->has('user')
            ->has('directReports'));
    }

    public function test_user_can_update_own_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patch('/profile', [
            'job_title' => 'Senior Developer',
            'phone' => '+420 777 000 111',
            'bio' => 'Test bio.',
        ]);

        $response->assertRedirect();
        $this->assertEquals('Senior Developer', $user->fresh()->job_title);
        $this->assertEquals('+420 777 000 111', $user->fresh()->phone);
        $this->assertEquals('Test bio.', $user->fresh()->bio);
    }

    public function test_profile_update_validates_max_lengths(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patch('/profile', [
            'bio' => str_repeat('x', 2001),
        ]);

        $response->assertSessionHasErrors('bio');
    }

    public function test_profile_update_ignores_protected_fields(): void
    {
        $user = User::factory()->create(['system_role' => 'team_member']);

        $this->actingAs($user)->patch('/profile', [
            'job_title' => 'Hacker',
            'system_role' => 'executive',
        ]);

        $this->assertEquals('team_member', $user->fresh()->system_role->value);
        $this->assertEquals('Hacker', $user->fresh()->job_title);
    }

    public function test_direct_reports_shown_for_team_lead(): void
    {
        $team = Team::factory()->create();
        $lead = User::factory()->create(['team_id' => $team->id]);
        $team->update(['team_lead_id' => $lead->id]);
        User::factory()->create(['team_id' => $team->id, 'name' => 'Report One']);

        $response = $this->actingAs($lead)->get('/profile');

        $response->assertInertia(fn ($page) => $page
            ->has('directReports', 1));
    }

    public function test_no_direct_reports_for_regular_member(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/profile');

        $response->assertInertia(fn ($page) => $page
            ->has('directReports', 0));
    }
}
