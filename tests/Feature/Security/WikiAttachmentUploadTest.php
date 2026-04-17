<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\User;
use App\Modules\Projects\Enums\ProjectRole;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Regression tests pro finding C3 — SVG upload přes wiki inline image
 * endpoint vedl k stored XSS. Pouhé otevření `/attachments/{uuid}/download`
 * s SVG obsahem vykonalo inline <script> v same-origin kontextu.
 */
final class WikiAttachmentUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_svg_upload_is_rejected_by_wiki_store_image(): void
    {
        [$user, $project, $page] = $this->wikiContext();
        $svg = UploadedFile::fake()->createWithContent(
            'evil.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        );

        $response = $this->actingAs($user)
            ->post(route('projects.wiki.images.store', [$project, $page]), [
                'file' => $svg,
            ]);

        $response->assertSessionHasErrors('file');
        $this->assertDatabaseCount('attachments', 0);
    }

    public function test_png_upload_is_accepted_by_wiki_store_image(): void
    {
        [$user, $project, $page] = $this->wikiContext();
        // Minimal valid 1x1 PNG (bez potřeby GD extension).
        $pngBytes = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=',
            true,
        );
        $png = UploadedFile::fake()->createWithContent('ok.png', $pngBytes);

        $response = $this->actingAs($user)
            ->post(route('projects.wiki.images.store', [$project, $page]), [
                'file' => $png,
            ]);

        $response->assertOk();
        $response->assertJsonStructure(['url']);
        $this->assertDatabaseCount('attachments', 1);
    }

    public function test_oversized_image_is_rejected(): void
    {
        [$user, $project, $page] = $this->wikiContext();
        // Limit z config/attachments.php:max_image_size_kb (10 MB). 15 MB file.
        $pngBytes = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=',
            true,
        );
        // Padding až na 15 MB při zachování PNG magic bytů na začátku.
        $oversized = $pngBytes.str_repeat("\x00", 15 * 1024 * 1024);
        $big = UploadedFile::fake()->createWithContent('huge.png', $oversized);

        $response = $this->actingAs($user)
            ->post(route('projects.wiki.images.store', [$project, $page]), [
                'file' => $big,
            ]);

        $response->assertSessionHasErrors('file');
    }

    /**
     * @return array{0: User, 1: Project, 2: WikiPage}
     */
    private function wikiContext(): array
    {
        $user = User::factory()->projectManager()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $project->members()->attach($user->id, ['role' => ProjectRole::Admin->value]);
        $page = WikiPage::factory()->create([
            'project_id' => $project->id,
            'author_id' => $user->id,
        ]);

        return [$user, $project, $page];
    }
}
