<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\User;
use App\Modules\Projects\Enums\ProjectRole;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Regression tests pro findings H1 + H2 z audit reportu 2026-04-17:
 * - H1: Wiki CRUD (store/update/destroy) byl autorizován přes `view`,
 *   takže Viewer role mohl mazat a editovat cizí stránky.
 * - H2: Komentáře (Task/Epic/Project/Wiki) + wiki attachments také jen `view`.
 *
 * Všechny write endpointy nyní vyžadují `contribute` ability projektu
 * → Viewer dostane 403, Contributor / Admin / PM / Executive projdou.
 */
final class WikiCommentContributeAuthzTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_viewer_cannot_create_wiki_page(): void
    {
        [$viewer, $project] = $this->memberContext(ProjectRole::Viewer);

        $response = $this->actingAs($viewer)
            ->post(route('projects.wiki.store', $project), [
                'title' => 'Hacked',
                'content' => 'nope',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('wiki_pages', ['title' => 'Hacked']);
    }

    public function test_viewer_cannot_update_wiki_page(): void
    {
        [$viewer, $project] = $this->memberContext(ProjectRole::Viewer);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $project->owner_id,
            'title' => 'Original',
        ]);

        $response = $this->actingAs($viewer)
            ->put(route('projects.wiki.update', [$project, $page]), [
                'title' => 'Tampered',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('wiki_pages', ['id' => $page->id, 'title' => 'Original']);
    }

    public function test_viewer_cannot_delete_wiki_page(): void
    {
        [$viewer, $project] = $this->memberContext(ProjectRole::Viewer);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $project->owner_id,
        ]);

        $response = $this->actingAs($viewer)
            ->delete(route('projects.wiki.destroy', [$project, $page]));

        $response->assertForbidden();
        $this->assertDatabaseHas('wiki_pages', ['id' => $page->id, 'deleted_at' => null]);
    }

    public function test_viewer_cannot_upload_wiki_attachment(): void
    {
        [$viewer, $project] = $this->memberContext(ProjectRole::Viewer);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $project->owner_id,
        ]);

        $response = $this->actingAs($viewer)
            ->post(route('projects.wiki.attachments.store', [$project, $page]), [
                'file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
            ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('attachments', 0);
    }

    public function test_viewer_cannot_comment_on_task(): void
    {
        [$viewer, $project] = $this->memberContext(ProjectRole::Viewer);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($viewer)
            ->post(route('projects.tasks.comments.store', [$project, $task]), [
                'body' => 'Unauthorized',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('comments', 0);
    }

    public function test_viewer_cannot_comment_on_epic(): void
    {
        [$viewer, $project] = $this->memberContext(ProjectRole::Viewer);
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($viewer)
            ->post(route('projects.epics.comments.store', [$project, $epic]), [
                'body' => 'Unauthorized',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('comments', 0);
    }

    public function test_viewer_cannot_comment_on_project(): void
    {
        [$viewer, $project] = $this->memberContext(ProjectRole::Viewer);

        $response = $this->actingAs($viewer)
            ->post(route('projects.comments.store', $project), [
                'body' => 'Unauthorized',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('comments', 0);
    }

    public function test_contributor_can_create_wiki_page(): void
    {
        [$contributor, $project] = $this->memberContext(ProjectRole::Contributor);

        $response = $this->actingAs($contributor)
            ->post(route('projects.wiki.store', $project), [
                'title' => 'Legit page',
                'content' => 'content',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('wiki_pages', ['title' => 'Legit page']);
    }

    public function test_contributor_can_comment_on_task(): void
    {
        [$contributor, $project] = $this->memberContext(ProjectRole::Contributor);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($contributor)
            ->post(route('projects.tasks.comments.store', [$project, $task]), [
                'body' => 'hello',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseCount('comments', 1);
    }

    /**
     * @return array{0: User, 1: Project}
     */
    private function memberContext(ProjectRole $role): array
    {
        $owner = User::factory()->projectManager()->create();
        $member = User::factory()->create(); // default TeamMember
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => ProjectRole::Admin->value]);
        $project->members()->attach($member->id, ['role' => $role->value]);

        return [$member, $project];
    }
}
