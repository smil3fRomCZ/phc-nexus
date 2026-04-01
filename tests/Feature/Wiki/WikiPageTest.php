<?php

declare(strict_types=1);

namespace Tests\Feature\Wiki;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use App\Modules\Work\Models\Epic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WikiPageTest extends TestCase
{
    use RefreshDatabase;

    // -- Project Wiki --

    public function test_owner_can_view_wiki_index(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/wiki");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Wiki/Index'));
    }

    public function test_non_member_cannot_view_wiki(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $response = $this->actingAs($user)->get("/projects/{$project->id}/wiki");

        $response->assertForbidden();
    }

    public function test_owner_can_create_wiki_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->post("/projects/{$project->id}/wiki", [
            'title' => 'Architektura',
            'content' => '<p>Popis architektury</p>',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('wiki_pages', [
            'project_id' => $project->id,
            'title' => 'Architektura',
            'author_id' => $user->id,
        ]);
    }

    public function test_owner_can_create_subpage(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $parent = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->post("/projects/{$project->id}/wiki", [
            'title' => 'Podstránka',
            'parent_id' => $parent->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('wiki_pages', [
            'project_id' => $project->id,
            'parent_id' => $parent->id,
            'title' => 'Podstránka',
        ]);
    }

    public function test_owner_can_view_wiki_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/wiki/{$page->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($p) => $p->component('Wiki/Show'));
    }

    public function test_owner_can_update_wiki_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
            'title' => 'Staré',
        ]);

        $response = $this->actingAs($user)->put("/projects/{$project->id}/wiki/{$page->id}", [
            'title' => 'Nové',
            'content' => '<p>Nový obsah</p>',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('wiki_pages', [
            'id' => $page->id,
            'title' => 'Nové',
        ]);
    }

    public function test_owner_can_delete_wiki_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->delete("/projects/{$project->id}/wiki/{$page->id}");

        $response->assertRedirect();
        $this->assertSoftDeleted('wiki_pages', ['id' => $page->id]);
    }

    public function test_owner_can_comment_on_wiki_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->post("/projects/{$project->id}/wiki/{$page->id}/comments", [
            'body' => 'Skvělá stránka!',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('comments', [
            'commentable_type' => WikiPage::class,
            'commentable_id' => $page->id,
            'body' => 'Skvělá stránka!',
            'author_id' => $user->id,
        ]);
    }

    public function test_owner_can_reply_to_wiki_comment(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
        ]);

        // Create parent comment
        $this->actingAs($user)->post("/projects/{$project->id}/wiki/{$page->id}/comments", [
            'body' => 'Původní komentář',
        ]);
        $parentComment = $page->comments()->first();

        $response = $this->actingAs($user)->post("/projects/{$project->id}/wiki/{$page->id}/comments", [
            'body' => 'Odpověď',
            'parent_id' => $parentComment->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('comments', [
            'parent_id' => $parentComment->id,
            'body' => 'Odpověď',
        ]);
    }

    // -- Epic Wiki --

    public function test_owner_can_view_epic_wiki_index(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/epics/{$epic->id}/wiki");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Wiki/EpicIndex'));
    }

    public function test_owner_can_create_epic_wiki_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->post("/projects/{$project->id}/epics/{$epic->id}/wiki", [
            'title' => 'Epic dokumentace',
            'content' => '<p>Popis</p>',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('wiki_pages', [
            'project_id' => $project->id,
            'epic_id' => $epic->id,
            'title' => 'Epic dokumentace',
        ]);
    }

    public function test_owner_can_view_epic_wiki_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'epic_id' => $epic->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/epics/{$epic->id}/wiki/{$page->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($p) => $p->component('Wiki/EpicShow'));
    }

    public function test_owner_can_update_epic_wiki_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'epic_id' => $epic->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->put("/projects/{$project->id}/epics/{$epic->id}/wiki/{$page->id}", [
            'title' => 'Aktualizováno',
            'content' => '<p>Nový obsah</p>',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('wiki_pages', ['id' => $page->id, 'title' => 'Aktualizováno']);
    }

    public function test_owner_can_delete_epic_wiki_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'epic_id' => $epic->id,
            'author_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->delete("/projects/{$project->id}/epics/{$epic->id}/wiki/{$page->id}");

        $response->assertRedirect();
        $this->assertSoftDeleted('wiki_pages', ['id' => $page->id]);
    }

    public function test_non_member_cannot_access_epic_wiki(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/epics/{$epic->id}/wiki");

        $response->assertForbidden();
    }
}
