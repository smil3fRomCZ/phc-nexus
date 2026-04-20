<?php

declare(strict_types=1);

namespace App\Modules\Organization\Commands;

use App\Models\User;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
use Illuminate\Console\Command;

/**
 * CLI promotion/demotion uživatele — pro bootstrap prvního Executive,
 * incident response nebo rollback oprávnění.
 *
 * Vyžaduje --reason; zapíše do audit logu s `source=cli`.
 */
final class PromoteUserCommand extends Command
{
    protected $signature = 'user:promote
        {email : E-mail uživatele}
        {--role=executive : Systémová role (executive, project_manager, team_member, service_desk_agent, reader)}
        {--status=active : Status (active, invited, deactivated)}
        {--reason= : Důvod (povinný pro audit stopu, viz GDPR)}
        {--dry-run : Jen vypíše co by udělalo}';

    protected $description = 'Změní system_role a status uživatele s audit stopou (CLI).';

    public function handle(AuditService $audit): int
    {
        $email = (string) $this->argument('email');
        $roleStr = (string) $this->option('role');
        $statusStr = (string) $this->option('status');
        $reason = trim((string) $this->option('reason'));
        $dryRun = (bool) $this->option('dry-run');

        $role = SystemRole::tryFrom($roleStr);
        if ($role === null) {
            $allowed = implode(', ', array_column(SystemRole::cases(), 'value'));
            $this->error("Neznámá role `{$roleStr}`. Dostupné: {$allowed}");

            return self::INVALID;
        }

        $status = UserStatus::tryFrom($statusStr);
        if ($status === null) {
            $allowed = implode(', ', array_column(UserStatus::cases(), 'value'));
            $this->error("Neznámý status `{$statusStr}`. Dostupné: {$allowed}");

            return self::INVALID;
        }

        if (! $dryRun && $reason === '') {
            $this->error("--reason je povinný (audit stopa). Příklad: --reason='Initial Executive bootstrap'");

            return self::INVALID;
        }

        $user = User::query()->where('email', $email)->first();
        if ($user === null) {
            $this->error("User `{$email}` neexistuje.");

            return self::FAILURE;
        }

        $before = [
            'system_role' => $user->system_role->value,
            'status' => $user->status->value,
        ];
        $after = [
            'system_role' => $role->value,
            'status' => $status->value,
        ];

        if ($before === $after) {
            $this->info("User `{$email}` už má požadovanou konfiguraci — nic ke změně.");

            return self::SUCCESS;
        }

        $this->table(
            ['Pole', 'Před', 'Po'],
            [
                ['email', $user->email, $user->email],
                ['system_role', $before['system_role'], $after['system_role']],
                ['status', $before['status'], $after['status']],
            ],
        );

        if ($dryRun) {
            $this->warn('DRY RUN — žádná změna neproběhla.');

            return self::SUCCESS;
        }

        $user->system_role = $role;
        $user->status = $status;
        $user->save();

        $audit->log(
            action: AuditAction::Updated,
            entity: $user,
            payload: [
                'source' => 'cli',
                'command' => 'user:promote',
                'reason' => $reason,
            ],
            oldValues: $before,
            newValues: $after,
        );

        $this->info("✓ Hotovo: {$email} → role={$role->value}, status={$status->value}");

        return self::SUCCESS;
    }
}
