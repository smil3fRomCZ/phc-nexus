<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use App\Modules\Work\Models\Epic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression tests pro H4 z audit reportu 2026-04-17:
 *
 * Wiki stránky (projektové i epic) validovaly `parent_id` pouze přes
 * `exists:wiki_pages,id` — útočník s contribute právy na projekt A mohl
 * v create/update payloadu uvést parent_id z projektu B (nebo z epicu,
 * kde nemá přístup) a efektivně přesunout svoji stránku "pod" cizí strom,
 * což narušovalo izolaci projektů a potenciálně leakovalo strukturu.
 *
 * Fix: parent_id je scoped přes `Rule::exists(...)->where(project_id, ...)`
 * s nulovaným epic_id pro projektové stránky, resp. `where(epic_id, ...)`
 * pro epic stránky. Navíc controller ověří, že editovaná stránka sama
 * patří do projektu/epicu z URL (defense-in-depth proti route IDOR).
 */
final class WikiParentIdIdorTest extends TestCase
{
    use RefreshDatabase;

    // -- Project wiki: cross-project parent --

    public function test_cannot_create_wiki_page_with_parent_from_other_project(): void
    {
        $user = User::factory()->create();
        $ownProject = Project::factory()->create(['owner_id' => $user->id]);
        $otherProject = Project::factory()->create();
        $foreignParent = WikiPage::factory()->create([
            'project_id' => $otherProject->id,
            'author_id' => $otherProject->owner_id,
        ]);

        $response = $this->actingAs($user)
            ->post("/projects/{$ownProject->id}/wiki", [
                'title' => 'Pokus o přelomení',
                'parent_id' => $foreignParent->id,
            ]);

        $response->assertSessionHasErrors('parent_id');
        $this->assertDatabaseMissing('wiki_pages', [
            'project_id' => $ownProject->id,
            'title' => 'Pokus o přelomení',
        ]);
    }

    public function test_cannot_update_wiki_page_to_parent_from_other_project(): void
    {
        $user = User::factory()->create();
        $ownProject = Project::factory()->create(['owner_id' => $user->id]);
        $ownPage = WikiPage::factory()->create([
            'project_id' => $ownProject->id,
            'author_id' => $user->id,
        ]);
        $otherProject = Project::factory()->create();
        $foreignParent = WikiPage::factory()->create([
            'project_id' => $otherProject->id,
            'author_id' => $otherProject->owner_id,
        ]);

        $response = $this->actingAs($user)
            ->put("/projects/{$ownProject->id}/wiki/{$ownPage->id}", [
                'title' => $ownPage->title,
                'parent_id' => $foreignParent->id,
            ]);

        $response->assertSessionHasErrors('parent_id');
        $this->assertSame(null, $ownPage->fresh()->parent_id);
    }

    public function test_cannot_set_wiki_page_as_its_own_parent(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->put("/projects/{$project->id}/wiki/{$page->id}", [
                'title' => $page->title,
                'parent_id' => $page->id,
            ]);

        $response->assertSessionHasErrors('parent_id');
    }

    public function test_cannot_use_epic_wiki_page_as_project_wiki_parent(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $epicPage = WikiPage::factory()->create([
            'project_id' => $project->id,
            'epic_id' => $epic->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->post("/projects/{$project->id}/wiki", [
                'title' => 'Projektová stránka',
                'parent_id' => $epicPage->id,
            ]);

        $response->assertSessionHasErrors('parent_id');
    }

    // -- Epic wiki: cross-epic parent --

    public function test_cannot_create_epic_wiki_page_with_parent_from_other_epic(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $ownEpic = Epic::factory()->create(['project_id' => $project->id]);
        $otherEpic = Epic::factory()->create(['project_id' => $project->id]);
        $otherEpicPage = WikiPage::factory()->create([
            'project_id' => $project->id,
            'epic_id' => $otherEpic->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->post("/projects/{$project->id}/epics/{$ownEpic->id}/wiki", [
                'title' => 'Fake',
                'parent_id' => $otherEpicPage->id,
            ]);

        $response->assertSessionHasErrors('parent_id');
    }

    public function test_cannot_use_project_wiki_as_epic_wiki_parent(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $projectPage = WikiPage::factory()->create([
            'project_id' => $project->id,
            'epic_id' => null,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->post("/projects/{$project->id}/epics/{$epic->id}/wiki", [
                'title' => 'Fake',
                'parent_id' => $projectPage->id,
            ]);

        $response->assertSessionHasErrors('parent_id');
    }

    // -- Route-level IDOR: cross-project URL manipulation --

    public function test_cannot_view_wiki_page_via_wrong_project_url(): void
    {
        $user = User::factory()->create();
        $ownProject = Project::factory()->create(['owner_id' => $user->id]);
        $otherProject = Project::factory()->create();
        $foreignPage = WikiPage::factory()->create([
            'project_id' => $otherProject->id,
            'author_id' => $otherProject->owner_id,
        ]);

        $response = $this->actingAs($user)
            ->get("/projects/{$ownProject->id}/wiki/{$foreignPage->id}");

        $response->assertNotFound();
    }

    public function test_cannot_update_wiki_page_via_wrong_project_url(): void
    {
        $user = User::factory()->create();
        $ownProject = Project::factory()->create(['owner_id' => $user->id]);
        $otherProject = Project::factory()->create();
        $foreignPage = WikiPage::factory()->create([
            'project_id' => $otherProject->id,
            'author_id' => $otherProject->owner_id,
            'title' => 'Original',
        ]);

        $response = $this->actingAs($user)
            ->put("/projects/{$ownProject->id}/wiki/{$foreignPage->id}", [
                'title' => 'Hacked',
            ]);

        $response->assertNotFound();
        $this->assertSame('Original', $foreignPage->fresh()->title);
    }

    public function test_cannot_delete_wiki_page_via_wrong_project_url(): void
    {
        $user = User::factory()->create();
        $ownProject = Project::factory()->create(['owner_id' => $user->id]);
        $otherProject = Project::factory()->create();
        $foreignPage = WikiPage::factory()->create([
            'project_id' => $otherProject->id,
            'author_id' => $otherProject->owner_id,
        ]);

        $response = $this->actingAs($user)
            ->delete("/projects/{$ownProject->id}/wiki/{$foreignPage->id}");

        $response->assertNotFound();
        $this->assertNotSoftDeleted('wiki_pages', ['id' => $foreignPage->id]);
    }

    // -- Happy path: legitimate same-project parent still works --

    public function test_owner_can_still_create_subpage_with_same_project_parent(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $parent = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->post("/projects/{$project->id}/wiki", [
                'title' => 'Legitimní podstránka',
                'parent_id' => $parent->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('wiki_pages', [
            'project_id' => $project->id,
            'parent_id' => $parent->id,
            'title' => 'Legitimní podstránka',
        ]);
    }
}
