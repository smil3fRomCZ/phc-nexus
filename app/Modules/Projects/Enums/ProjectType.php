<?php

declare(strict_types=1);

namespace App\Modules\Projects\Enums;

enum ProjectType: string
{
    case Software = 'software';
    case TaskManagement = 'task_management';
    case Approval = 'approval';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::Software => 'Softwarový projekt',
            self::TaskManagement => 'Řízení úkolů',
            self::Approval => 'Schvalovací proces',
            self::Custom => 'Vlastní',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Software => 'Vývoj software s code review, QA a rolemi PM/Lead Developer',
            self::TaskManagement => 'Jednoduchá správa úkolů pro týmy bez IT specifik',
            self::Approval => 'Zaměřeno na schvalovací workflow (nákupy, smlouvy, politiky)',
            self::Custom => 'Prázdný projekt — vše nastavíte ručně',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Software => 'code',
            self::TaskManagement => 'check-square',
            self::Approval => 'shield-check',
            self::Custom => 'settings',
        };
    }

    /** Whether this project type shows the Lead Developer field. */
    public function hasLeadDeveloper(): bool
    {
        return $this === self::Software;
    }
}
