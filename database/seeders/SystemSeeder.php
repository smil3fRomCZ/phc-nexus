<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Idempotentní seeder pro systémová data.
 * Bezpečné spouštět opakovaně — používá se při každém staging/prod deployi.
 */
class SystemSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            WorkflowTemplateSeeder::class,
        ]);
    }
}
