<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('security_stamp', 64)->nullable()->after('remember_token');
        });

        // Backfill: každý existující user dostane vlastní stamp, aby staré
        // sessions (pokud nějaké existují) byly po deployi označeny jako cizí.
        DB::table('users')->whereNull('security_stamp')->orderBy('id')->each(function ($user): void {
            DB::table('users')
                ->where('id', $user->id)
                ->update(['security_stamp' => bin2hex(random_bytes(16))]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('security_stamp');
        });
    }
};
