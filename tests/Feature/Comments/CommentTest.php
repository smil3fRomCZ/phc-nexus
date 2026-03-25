<?php

declare(strict_types=1);

namespace Tests\Feature\Comments;

use App\Models\Concerns\HasComments;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Comments\Actions\AddComment;
use App\Modules\Comments\Actions\EditComment;
use App\Modules\Comments\Models\Comment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('commentable_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('commentable_items');
        parent::tearDown();
    }

    public function test_add_comment_to_entity(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = CommentableItem::create(['title' => 'Test']);

        $comment = app(AddComment::class)->execute($item, $user, 'First comment');

        $this->assertEquals('First comment', $comment->body);
        $this->assertEquals($user->id, $comment->author_id);
        $this->assertCount(1, $item->comments);
    }

    public function test_reply_to_comment(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = CommentableItem::create(['title' => 'Test']);
        $parent = app(AddComment::class)->execute($item, $user, 'Parent');
        $reply = app(AddComment::class)->execute($item, $user, 'Reply', $parent->id);

        $this->assertTrue($reply->isReply());
        $this->assertFalse($parent->isReply());
        $this->assertEquals($parent->id, $reply->parent_id);
        $this->assertCount(1, $parent->replies);
    }

    public function test_edit_comment_marks_as_edited(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = CommentableItem::create(['title' => 'Test']);
        $comment = app(AddComment::class)->execute($item, $user, 'Original');

        $this->assertFalse($comment->isEdited());

        app(EditComment::class)->execute($comment, 'Updated');

        $this->assertTrue($comment->fresh()->isEdited());
        $this->assertEquals('Updated', $comment->fresh()->body);
    }

    public function test_soft_delete_comment(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = CommentableItem::create(['title' => 'Test']);
        $comment = app(AddComment::class)->execute($item, $user, 'To delete');

        $comment->delete();

        $this->assertSoftDeleted($comment);
        $this->assertCount(0, $item->comments);
        $this->assertCount(1, Comment::withTrashed()->where('commentable_id', $item->id)->get());
    }

    public function test_root_comments_excludes_replies(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = CommentableItem::create(['title' => 'Test']);
        $root1 = app(AddComment::class)->execute($item, $user, 'Root 1');
        $root2 = app(AddComment::class)->execute($item, $user, 'Root 2');
        app(AddComment::class)->execute($item, $user, 'Reply', $root1->id);

        $this->assertCount(3, $item->comments);
        $this->assertCount(2, $item->rootComments);
    }

    public function test_comment_author_relationship(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = CommentableItem::create(['title' => 'Test']);
        $comment = app(AddComment::class)->execute($item, $user, 'Test');

        $this->assertEquals($user->id, $comment->author->id);
    }

    public function test_comment_is_audited(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = CommentableItem::create(['title' => 'Test']);
        $comment = app(AddComment::class)->execute($item, $user, 'Audited comment');

        $entry = AuditEntry::where('entity_type', Comment::class)
            ->where('entity_id', $comment->id)
            ->where('action', AuditAction::Created->value)
            ->first();

        $this->assertNotNull($entry);
    }

    public function test_comment_edit_is_audited(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = CommentableItem::create(['title' => 'Test']);
        $comment = app(AddComment::class)->execute($item, $user, 'Original');
        app(EditComment::class)->execute($comment, 'Edited');

        $entry = AuditEntry::where('entity_type', Comment::class)
            ->where('entity_id', $comment->id)
            ->where('action', AuditAction::Updated->value)
            ->first();

        $this->assertNotNull($entry);
        $this->assertEquals('Original', $entry->old_values['body']);
        $this->assertEquals('Edited', $entry->new_values['body']);
    }
}

class CommentableItem extends Model
{
    use HasComments, HasUuidV7;

    protected $fillable = ['title'];
}
