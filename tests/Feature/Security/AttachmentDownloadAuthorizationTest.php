<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\User;
use App\Modules\Files\Actions\DownloadAttachment;
use App\Modules\Files\Actions\UploadAttachment;
use App\Modules\Files\Models\Attachment;
use App\Modules\Projects\Enums\ProjectRole;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Regression tests pro finding C1 — attachment download bez autorizace.
 *
 * Před fixem: TaskAttachmentController::download pouze streamoval soubor
 * bez jakékoli Gate::authorize kontroly. Útočník mohl enumerovat UUID
 * `/attachments/{uuid}/download` a stahovat cizí přílohy.
 */
final class AttachmentDownloadAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_task_attachment_download_blocked_for_non_member(): void
    {
        [$owner, $project, $task] = $this->taskContext();
        $attachment = $this->upload($task, $owner);

        $outsider = User::factory()->create();

        $this->expectException(AuthorizationException::class);
        app(DownloadAttachment::class)->execute($attachment, $outsider);
    }

    public function test_task_attachment_download_allowed_for_project_member(): void
    {
        [$owner, , $task] = $this->taskContext();
        $attachment = $this->upload($task, $owner);

        $response = app(DownloadAttachment::class)->execute($attachment, $owner);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_epic_attachment_download_blocked_for_non_member(): void
    {
        [$owner, $project] = $this->taskContext();
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $attachment = $this->upload($epic, $owner);

        $outsider = User::factory()->create();

        $this->expectException(AuthorizationException::class);
        app(DownloadAttachment::class)->execute($attachment, $outsider);
    }

    public function test_project_attachment_download_blocked_for_non_member(): void
    {
        [$owner, $project] = $this->taskContext();
        $attachment = $this->upload($project, $owner);

        $outsider = User::factory()->create();

        $this->expectException(AuthorizationException::class);
        app(DownloadAttachment::class)->execute($attachment, $outsider);
    }

    public function test_wiki_attachment_download_blocked_for_non_member(): void
    {
        [$owner, $project] = $this->taskContext();
        $wikiPage = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $owner->id,
        ]);
        $attachment = $this->upload($wikiPage, $owner);

        $outsider = User::factory()->create();

        $this->expectException(AuthorizationException::class);
        app(DownloadAttachment::class)->execute($attachment, $outsider);
    }

    public function test_wiki_attachment_download_allowed_for_project_member(): void
    {
        [$owner, $project] = $this->taskContext();
        $wikiPage = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $owner->id,
        ]);
        $attachment = $this->upload($wikiPage, $owner);

        $response = app(DownloadAttachment::class)->execute($attachment, $owner);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_http_endpoint_blocks_non_member(): void
    {
        [$owner, , $task] = $this->taskContext();
        $attachment = $this->upload($task, $owner);

        $outsider = User::factory()->create();

        $response = $this->actingAs($outsider)
            ->get(route('attachments.download', $attachment));

        $response->assertForbidden();
    }

    public function test_http_endpoint_allows_project_member(): void
    {
        [$owner, , $task] = $this->taskContext();
        $attachment = $this->upload($task, $owner);

        $response = $this->actingAs($owner)
            ->get(route('attachments.download', $attachment));

        $response->assertOk();
    }

    /**
     * @return array{0: User, 1: Project, 2: Task}
     */
    private function taskContext(): array
    {
        $user = User::factory()->projectManager()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $project->members()->attach($user->id, ['role' => ProjectRole::Admin->value]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        return [$user, $project, $task];
    }

    private function upload(object $attachable, User $uploader): Attachment
    {
        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        return app(UploadAttachment::class)->execute(
            file: $file,
            attachable: $attachable,
            uploader: $uploader,
        );
    }
}
