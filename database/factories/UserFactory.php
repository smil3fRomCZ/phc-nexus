<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'system_role' => SystemRole::TeamMember,
            'status' => UserStatus::Active,
        ];
    }

    public function executive(): static
    {
        return $this->state(fn () => ['system_role' => SystemRole::Executive]);
    }

    public function projectManager(): static
    {
        return $this->state(fn () => ['system_role' => SystemRole::ProjectManager]);
    }

    public function reader(): static
    {
        return $this->state(fn () => ['system_role' => SystemRole::Reader]);
    }

    public function invited(): static
    {
        return $this->state(fn () => ['status' => UserStatus::Invited]);
    }

    public function deactivated(): static
    {
        return $this->state(fn () => ['status' => UserStatus::Deactivated]);
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }
}
