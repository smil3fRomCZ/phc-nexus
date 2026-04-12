<?php

declare(strict_types=1);

namespace App\Modules\Projects\Enums;

/**
 * Role člena projektu (v pivot tabulce project_members).
 *
 * - Admin: plný přístup v rámci projektu + správa členů
 * - Contributor: CRUD na úkolech/epicích/time, komentáře, přílohy
 * - Viewer: read-only přístup
 *
 * Vlastník projektu (projects.owner_id) je implicitně Admin.
 * Systémové role Executive a ProjectManager mají globální override.
 */
enum ProjectRole: string
{
    case Admin = 'admin';
    case Contributor = 'contributor';
    case Viewer = 'viewer';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Contributor => 'Contributor',
            self::Viewer => 'Viewer',
        };
    }

    /**
     * Může člen vytvářet/editovat úkoly a epiky?
     */
    public function canContribute(): bool
    {
        return $this === self::Admin || $this === self::Contributor;
    }

    /**
     * Může člen spravovat nastavení projektu (a členy)?
     */
    public function canAdminister(): bool
    {
        return $this === self::Admin;
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $r) => ['value' => $r->value, 'label' => $r->label()],
            self::cases(),
        );
    }
}
