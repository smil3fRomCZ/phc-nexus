<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use RuntimeException;

final class DomainNotAllowedException extends RuntimeException
{
    public function __construct(public readonly string $email)
    {
        parent::__construct("Email domain not allowed: {$email}");
    }
}
