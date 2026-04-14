<?php

declare(strict_types=1);

namespace Tests\Feature\Policies;

use App\Models\User;
use App\Modules\Comments\Models\Comment;
use App\Modules\Files\Models\Attachment;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PolicyMatrixTest extends TestCase
{
    use RefreshDatabase;

    private function comment(string $authorId): Comment
    {
        return (new Comment)->forceFill(['author_id' => $authorId]);
    }

    private function timeEntry(string $ownerId): TimeEntry
    {
        return (new TimeEntry)->forceFill(['user_id' => $ownerId]);
    }

    private function attachment(string $uploaderId): Attachment
    {
        return (new Attachment)->forceFill(['uploaded_by' => $uploaderId]);
    }

    // --- CommentPolicy ---

    public function test_comment_policy_matrix(): void
    {
        $author = User::factory()->create();
        $other = User::factory()->create(['system_role' => SystemRole::TeamMember]);
        $executive = User::factory()->create(['system_role' => SystemRole::Executive]);
        $comment = $this->comment($author->id);

        $this->assertTrue($author->can('update', $comment));
        $this->assertTrue($author->can('delete', $comment));
        $this->assertFalse($other->can('update', $comment));
        $this->assertFalse($other->can('delete', $comment));
        $this->assertTrue($executive->can('update', $comment));
        $this->assertTrue($executive->can('delete', $comment));
    }

    // --- TimeEntryPolicy ---

    public function test_time_entry_policy_matrix(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create(['system_role' => SystemRole::TeamMember]);
        $executive = User::factory()->create(['system_role' => SystemRole::Executive]);
        $entry = $this->timeEntry($owner->id);

        $this->assertTrue($owner->can('update', $entry));
        $this->assertTrue($owner->can('delete', $entry));
        $this->assertFalse($other->can('update', $entry));
        $this->assertFalse($other->can('delete', $entry));
        $this->assertTrue($executive->can('update', $entry));
    }

    // --- AttachmentPolicy ---

    public function test_attachment_policy_matrix(): void
    {
        $uploader = User::factory()->create();
        $other = User::factory()->create(['system_role' => SystemRole::TeamMember]);
        $pm = User::factory()->create(['system_role' => SystemRole::ProjectManager]);
        $executive = User::factory()->create(['system_role' => SystemRole::Executive]);
        $attachment = $this->attachment($uploader->id);

        $this->assertTrue($uploader->can('delete', $attachment));
        $this->assertFalse($other->can('delete', $attachment));
        $this->assertTrue($pm->can('delete', $attachment));
        $this->assertTrue($executive->can('delete', $attachment));
    }
}
