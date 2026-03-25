<?php

declare(strict_types=1);

namespace Tests\Unit\Audit;

use App\Modules\Audit\Enums\PhiClassification;
use PHPUnit\Framework\TestCase;

class PhiClassificationTest extends TestCase
{
    public function test_phi_is_restricted(): void
    {
        $this->assertTrue(PhiClassification::Phi->isRestricted());
    }

    public function test_unknown_is_restricted(): void
    {
        $this->assertTrue(PhiClassification::Unknown->isRestricted());
    }

    public function test_non_phi_is_not_restricted(): void
    {
        $this->assertFalse(PhiClassification::NonPhi->isRestricted());
    }

    public function test_all_classifications_have_labels(): void
    {
        foreach (PhiClassification::cases() as $classification) {
            $this->assertNotEmpty($classification->label());
        }
    }
}
