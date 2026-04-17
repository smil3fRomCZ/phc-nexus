<?php

declare(strict_types=1);

namespace Tests\Feature\Files;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasAttachments;
use App\Models\Concerns\HasPhiClassification;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\PhiClassification;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Files\Actions\DownloadAttachment;
use App\Modules\Files\Actions\UploadAttachment;
use App\Modules\Files\Models\Attachment;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttachmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        Schema::create('attachable_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('data_classification')->default('non_phi');
            $table->timestamps();
        });

        // Test-only model bez Policy — DownloadAttachment vyžaduje `view` ability.
        Gate::before(function ($user, $ability, $arguments) {
            if ($ability === 'view' && ($arguments[0] ?? null) instanceof AttachableItem) {
                return true;
            }

            return null;
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('attachable_items');
        parent::tearDown();
    }

    public function test_upload_creates_attachment(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = AttachableItem::create(['title' => 'Test']);
        $file = UploadedFile::fake()->create('document.pdf', 1024, 'application/pdf');

        $attachment = app(UploadAttachment::class)->execute($file, $item, $user);

        $this->assertInstanceOf(Attachment::class, $attachment);
        $this->assertEquals('document.pdf', $attachment->original_filename);
        $this->assertEquals('application/pdf', $attachment->mime_type);
        $this->assertEquals(1024 * 1024, $attachment->size);
        $this->assertEquals($user->id, $attachment->uploaded_by);
        Storage::disk('local')->assertExists($attachment->path);
    }

    public function test_attachment_belongs_to_attachable(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = AttachableItem::create(['title' => 'Test']);
        $file = UploadedFile::fake()->create('doc.pdf', 100);

        $attachment = app(UploadAttachment::class)->execute($file, $item, $user);

        $this->assertEquals($item->id, $attachment->attachable->id);
        $this->assertCount(1, $item->attachments);
    }

    public function test_download_audits_access(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = AttachableItem::create(['title' => 'Test']);
        $file = UploadedFile::fake()->create('doc.pdf', 100);

        $attachment = app(UploadAttachment::class)->execute($file, $item, $user);

        app(DownloadAttachment::class)->execute($attachment, $user);

        $auditEntry = AuditEntry::where('action', AuditAction::Downloaded->value)
            ->where('entity_id', $attachment->id)
            ->first();

        $this->assertNotNull($auditEntry);
    }

    public function test_download_blocked_for_phi_entity_with_reader(): void
    {
        $reader = User::factory()->reader()->create();
        $this->actingAs($reader);

        $item = AttachableItem::create(['title' => 'PHI Doc']);
        $item->data_classification = PhiClassification::Phi;
        $item->save();

        $uploader = User::factory()->create();
        $file = UploadedFile::fake()->create('phi-doc.pdf', 100);
        $attachment = app(UploadAttachment::class)->execute($file, $item, $uploader);

        $this->expectException(AuthorizationException::class);
        app(DownloadAttachment::class)->execute($attachment, $reader);
    }

    public function test_download_allowed_for_phi_entity_with_member(): void
    {
        $member = User::factory()->create();
        $this->actingAs($member);

        $item = AttachableItem::create(['title' => 'PHI Doc']);
        $item->data_classification = PhiClassification::Phi;
        $item->save();

        $file = UploadedFile::fake()->create('phi-doc.pdf', 100);
        $attachment = app(UploadAttachment::class)->execute($file, $item, $member);

        $response = app(DownloadAttachment::class)->execute($attachment, $member);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_download_allowed_for_non_phi_entity(): void
    {
        $reader = User::factory()->reader()->create();
        $this->actingAs($reader);

        $item = AttachableItem::create(['title' => 'Safe Doc']);
        $file = UploadedFile::fake()->create('safe.pdf', 100);
        $attachment = app(UploadAttachment::class)->execute($file, $item, $reader);

        $response = app(DownloadAttachment::class)->execute($attachment, $reader);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_attachment_size_for_humans(): void
    {
        $attachment = new Attachment;
        $attachment->size = 1536;
        $this->assertEquals('1.5 KB', $attachment->sizeForHumans());

        $attachment->size = 2 * 1024 * 1024;
        $this->assertEquals('2 MB', $attachment->sizeForHumans());
    }

    public function test_multiple_attachments_on_entity(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = AttachableItem::create(['title' => 'Test']);

        app(UploadAttachment::class)->execute(
            UploadedFile::fake()->create('a.pdf', 100),
            $item,
            $user,
        );
        app(UploadAttachment::class)->execute(
            UploadedFile::fake()->create('b.png', 200),
            $item,
            $user,
        );

        $this->assertCount(2, $item->fresh()->attachments);
    }
}

class AttachableItem extends Model
{
    use Auditable, HasAttachments, HasPhiClassification, HasUuidV7;

    protected $fillable = ['title', 'data_classification'];
}
