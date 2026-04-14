<?php

declare(strict_types=1);

namespace Tests\Feature\Files;

use App\Models\User;
use App\Modules\Files\Actions\UploadAttachment;
use App\Modules\Projects\Enums\ProjectRole;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttachmentUploadSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_disallowed_mime_type_is_rejected(): void
    {
        Storage::fake('local');
        [$user, $project, $task] = $this->taskContext();

        $file = UploadedFile::fake()->createWithContent('malicious.php', '<?php echo 1;');

        $response = $this->actingAs($user)
            ->post(route('projects.tasks.attachments.store', [$project, $task]), [
                'file' => $file,
            ]);

        $response->assertSessionHasErrors('file');
        $this->assertDatabaseCount('attachments', 0);
    }

    public function test_oversized_file_is_rejected(): void
    {
        Storage::fake('local');
        [$user, $project, $task] = $this->taskContext();

        // Limit je 20 MB (20480 KB); 25 MB = 25600 KB.
        $file = UploadedFile::fake()->create('big.pdf', 25600, 'application/pdf');

        $response = $this->actingAs($user)
            ->post(route('projects.tasks.attachments.store', [$project, $task]), [
                'file' => $file,
            ]);

        $response->assertSessionHasErrors('file');
    }

    public function test_allowed_pdf_is_accepted(): void
    {
        Storage::fake('local');
        [$user, $project, $task] = $this->taskContext();

        $file = UploadedFile::fake()->create('design.pdf', 100, 'application/pdf');

        $response = $this->actingAs($user)
            ->post(route('projects.tasks.attachments.store', [$project, $task]), [
                'file' => $file,
            ]);

        $response->assertSessionDoesntHaveErrors('file');
        $this->assertDatabaseCount('attachments', 1);
    }

    public function test_path_traversal_in_filename_is_sanitized(): void
    {
        Storage::fake('local');
        [$user, $project, $task] = $this->taskContext();

        $action = app(UploadAttachment::class);
        $file = UploadedFile::fake()->create('../../../etc/passwd.pdf', 10, 'application/pdf');

        $attachment = $action->execute(file: $file, attachable: $task, uploader: $user);

        $this->assertStringNotContainsString('..', $attachment->original_filename);
        $this->assertStringNotContainsString('/', $attachment->original_filename);
        $this->assertStringNotContainsString('\\', $attachment->original_filename);
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
}
