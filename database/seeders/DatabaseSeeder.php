<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Spustí všechny seedery — systémové (idempotentní) + demo data.
     * Používá se při migrate:fresh --seed (lokální vývoj, CI).
     */
    public function run(): void
    {
        $this->call([
            SystemSeeder::class,
            DemoSeeder::class,
        ]);
    }
}
