<?php

declare(strict_types=1);

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Organization\Models\Division;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class OrganizationController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $divisions = Division::query()
            ->with([
                'teams.members:id,name,email,team_id,system_role,status',
                'teams.teamLead:id,name',
            ])
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Organization/Index', [
            'divisions' => $divisions,
        ]);
    }
}
