<?php

declare(strict_types=1);

namespace Tests\Feature\Audit;

use App\Models\Concerns\HasPhiClassification;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Audit\Enums\PhiClassification;
use App\Modules\Audit\PhiAccessGuard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PhiAccessGuardTest extends TestCase
{
    use RefreshDatabase;

    private PhiAccessGuard $guard;

    protected function setUp(): void
    {
        parent::setUp();

        $this->guard = new PhiAccessGuard;

        Schema::create('test_entities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('data_classification')->default('unknown');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('test_entities');
        parent::tearDown();
    }

    public function test_anyone_can_access_non_phi_entity(): void
    {
        $reader = User::factory()->reader()->create();
        $entity = $this->createTestEntity(PhiClassification::NonPhi);

        $this->assertTrue($this->guard->canAccess($reader, $entity));
    }

    public function test_reader_cannot_access_phi_entity(): void
    {
        $reader = User::factory()->reader()->create();
        $entity = $this->createTestEntity(PhiClassification::Phi);

        $this->assertFalse($this->guard->canAccess($reader, $entity));
    }

    public function test_reader_cannot_access_unknown_entity(): void
    {
        $reader = User::factory()->reader()->create();
        $entity = $this->createTestEntity(PhiClassification::Unknown);

        $this->assertFalse($this->guard->canAccess($reader, $entity));
    }

    public function test_executive_can_access_phi_entity(): void
    {
        $executive = User::factory()->executive()->create();
        $entity = $this->createTestEntity(PhiClassification::Phi);

        $this->assertTrue($this->guard->canAccess($executive, $entity));
    }

    public function test_team_member_can_access_phi_entity(): void
    {
        $member = User::factory()->create();
        $entity = $this->createTestEntity(PhiClassification::Phi);

        $this->assertTrue($this->guard->canAccess($member, $entity));
    }

    public function test_phi_entity_cannot_be_exported(): void
    {
        $executive = User::factory()->executive()->create();
        $entity = $this->createTestEntity(PhiClassification::Phi);

        $this->assertFalse($this->guard->canExport($executive, $entity));
    }

    public function test_unknown_entity_cannot_be_exported(): void
    {
        $executive = User::factory()->executive()->create();
        $entity = $this->createTestEntity(PhiClassification::Unknown);

        $this->assertFalse($this->guard->canExport($executive, $entity));
    }

    public function test_non_phi_entity_can_be_exported(): void
    {
        $member = User::factory()->create();
        $entity = $this->createTestEntity(PhiClassification::NonPhi);

        $this->assertTrue($this->guard->canExport($member, $entity));
    }

    public function test_entity_without_phi_trait_always_accessible(): void
    {
        $reader = User::factory()->reader()->create();
        $user = User::factory()->create();

        $this->assertTrue($this->guard->canAccess($reader, $user));
    }

    public function test_non_phi_scope(): void
    {
        $this->createTestEntity(PhiClassification::Phi, 'PHI entity');
        $this->createTestEntity(PhiClassification::NonPhi, 'Safe entity');
        $this->createTestEntity(PhiClassification::Unknown, 'Unknown entity');

        $results = TestEntity::nonPhi()->get();

        $this->assertCount(1, $results);
        $this->assertEquals('Safe entity', $results->first()->title);
    }

    public function test_exportable_scope_excludes_phi(): void
    {
        $this->createTestEntity(PhiClassification::Phi, 'PHI');
        $this->createTestEntity(PhiClassification::NonPhi, 'Safe');
        $this->createTestEntity(PhiClassification::Unknown, 'Unknown');

        $results = TestEntity::exportable()->get();

        $this->assertCount(1, $results);
        $this->assertEquals('Safe', $results->first()->title);
    }

    private function createTestEntity(PhiClassification $classification, string $title = 'Test'): TestEntity
    {
        $entity = new TestEntity;
        $entity->title = $title;
        $entity->data_classification = $classification;
        $entity->save();

        return $entity;
    }
}

class TestEntity extends Model
{
    use HasPhiClassification, HasUuidV7;

    protected $table = 'test_entities';

    protected $fillable = ['title', 'data_classification'];
}
