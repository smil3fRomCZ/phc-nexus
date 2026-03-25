<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Approvals\Enums\ApprovalMode;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Comments\Models\Comment;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use App\Modules\Organization\Models\Tribe;
use App\Modules\Projects\Enums\ProjectStatus;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\EpicStatus;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Enums\TaskStatus;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // === Organizační struktura ===

        $divTech = Division::create(['name' => 'Technologie', 'description' => 'Vývoj a infrastruktura']);
        $divOps = Division::create(['name' => 'Provoz', 'description' => 'Provoz a podpora']);

        $teamDev = Team::create(['name' => 'Development', 'division_id' => $divTech->id]);
        $teamQa = Team::create(['name' => 'QA & Testing', 'division_id' => $divTech->id]);
        $teamInfra = Team::create(['name' => 'Infrastruktura', 'division_id' => $divOps->id]);
        $teamSupport = Team::create(['name' => 'Podpora', 'division_id' => $divOps->id]);

        // === Uživatelé ===

        $exec = User::factory()->executive()->create([
            'name' => 'Jan Novák',
            'email' => 'jan.novak@pearshealthcare.cz',
            'team_id' => null,
        ]);

        $pm = User::factory()->projectManager()->create([
            'name' => 'Eva Svobodová',
            'email' => 'eva.svobodova@pearshealthcare.cz',
            'team_id' => $teamDev->id,
        ]);

        $dev1 = User::factory()->create([
            'name' => 'Martin Dvořák',
            'email' => 'martin.dvorak@pearshealthcare.cz',
            'team_id' => $teamDev->id,
        ]);

        $dev2 = User::factory()->create([
            'name' => 'Petra Černá',
            'email' => 'petra.cerna@pearshealthcare.cz',
            'team_id' => $teamDev->id,
        ]);

        $qa = User::factory()->create([
            'name' => 'Tomáš Procházka',
            'email' => 'tomas.prochazka@pearshealthcare.cz',
            'team_id' => $teamQa->id,
        ]);

        $infra = User::factory()->create([
            'name' => 'Lukáš Veselý',
            'email' => 'lukas.vesely@pearshealthcare.cz',
            'team_id' => $teamInfra->id,
        ]);

        $support1 = User::factory()->create([
            'name' => 'Anna Králová',
            'email' => 'anna.kralova@pearshealthcare.cz',
            'team_id' => $teamSupport->id,
        ]);

        $reader = User::factory()->reader()->create([
            'name' => 'Karel Horák',
            'email' => 'karel.horak@pearshealthcare.cz',
            'team_id' => $teamSupport->id,
        ]);

        // Team leads
        $teamDev->update(['team_lead_id' => $pm->id]);
        $teamQa->update(['team_lead_id' => $qa->id]);
        $teamInfra->update(['team_lead_id' => $infra->id]);
        $teamSupport->update(['team_lead_id' => $support1->id]);

        // Tribe
        $tribe = Tribe::create(['name' => 'Platform tribe', 'tribe_lead_id' => $pm->id]);
        $tribe->members()->attach([$dev1->id, $dev2->id, $infra->id, $qa->id]);

        // === Projekt 1: PHC Nexus (aktivní) ===

        $projNexus = Project::create([
            'name' => 'PHC Nexus',
            'key' => 'NEXUS',
            'description' => 'Interní produktivitní platforma — nahrazuje Jira, Asana a Confluence.',
            'status' => ProjectStatus::Active,
            'data_classification' => 'non_phi',
            'owner_id' => $pm->id,
            'team_id' => $teamDev->id,
            'start_date' => '2026-01-15',
            'target_date' => '2026-06-30',
        ]);
        $projNexus->members()->attach([$dev1->id, $dev2->id, $qa->id, $infra->id], ['role' => 'member']);

        $epicAuth = Epic::create([
            'project_id' => $projNexus->id,
            'title' => 'Autentizace a onboarding',
            'description' => 'Google SSO, invite flow, role matrix',
            'status' => EpicStatus::Done,
            'owner_id' => $dev1->id,
            'sort_order' => 1,
        ]);

        $epicWork = Epic::create([
            'project_id' => $projNexus->id,
            'title' => 'Work Management',
            'description' => 'Epiky, úkoly, kanban board, tabulka, stavové přechody',
            'status' => EpicStatus::InProgress,
            'owner_id' => $dev2->id,
            'sort_order' => 2,
        ]);

        $epicApprovals = Epic::create([
            'project_id' => $projNexus->id,
            'title' => 'Approvals & Notifications',
            'description' => 'Approval flow, in-app + email notifikace',
            'status' => EpicStatus::InProgress,
            'owner_id' => $pm->id,
            'sort_order' => 3,
        ]);

        // Úkoly v epiku Auth (done)
        foreach (['Google SSO redirect', 'Callback handler', 'Invite flow', 'Login stránka'] as $i => $title) {
            Task::create([
                'project_id' => $projNexus->id,
                'epic_id' => $epicAuth->id,
                'title' => $title,
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
                'assignee_id' => $dev1->id,
                'reporter_id' => $pm->id,
                'sort_order' => $i + 1,
            ]);
        }

        // Úkoly v epiku Work (různé stavy)
        $workTasks = [
            ['Kanban board drag&drop', TaskStatus::Done, $dev2->id],
            ['Tabulkový view s filtry', TaskStatus::Done, $dev2->id],
            ['Stavové přechody validace', TaskStatus::InReview, $dev1->id],
            ['Inline editace v tabulce', TaskStatus::InProgress, $dev2->id],
            ['Bulk akce na úkolech', TaskStatus::Todo, null],
            ['Export úkolů do CSV', TaskStatus::Backlog, null],
        ];

        foreach ($workTasks as $i => [$title, $status, $assignee]) {
            Task::create([
                'project_id' => $projNexus->id,
                'epic_id' => $epicWork->id,
                'title' => $title,
                'status' => $status,
                'priority' => $i < 2 ? TaskPriority::High : TaskPriority::Medium,
                'assignee_id' => $assignee,
                'reporter_id' => $pm->id,
                'sort_order' => $i + 1,
            ]);
        }

        // Úkoly v epiku Approvals
        $approvalTask = Task::create([
            'project_id' => $projNexus->id,
            'epic_id' => $epicApprovals->id,
            'title' => 'Approval flow implementace',
            'status' => TaskStatus::InReview,
            'priority' => TaskPriority::High,
            'assignee_id' => $dev1->id,
            'reporter_id' => $pm->id,
            'sort_order' => 1,
        ]);

        Task::create([
            'project_id' => $projNexus->id,
            'epic_id' => $epicApprovals->id,
            'title' => 'Email notifikace',
            'status' => TaskStatus::InProgress,
            'priority' => TaskPriority::Medium,
            'assignee_id' => $dev2->id,
            'reporter_id' => $pm->id,
            'sort_order' => 2,
        ]);

        // Standalone úkol (bez epiku)
        Task::create([
            'project_id' => $projNexus->id,
            'epic_id' => null,
            'title' => 'Aktualizovat README',
            'status' => TaskStatus::Todo,
            'priority' => TaskPriority::Low,
            'assignee_id' => $dev1->id,
            'reporter_id' => $pm->id,
            'sort_order' => 1,
        ]);

        // Approval request na úkol
        $approval = ApprovalRequest::create([
            'approvable_type' => Task::class,
            'approvable_id' => $approvalTask->id,
            'requester_id' => $dev1->id,
            'mode' => ApprovalMode::AllApprove,
            'description' => 'Prosím o review approval flow implementace',
        ]);
        $approval->votes()->create(['voter_id' => $pm->id]);
        $approval->votes()->create(['voter_id' => $qa->id]);

        // Komentáře
        Comment::create([
            'commentable_type' => Task::class,
            'commentable_id' => $approvalTask->id,
            'author_id' => $dev1->id,
            'body' => 'Implementace hotová, prosím o code review.',
        ]);

        Comment::create([
            'commentable_type' => Epic::class,
            'commentable_id' => $epicWork->id,
            'author_id' => $pm->id,
            'body' => 'Kanban board vypadá skvěle, přidáme ještě WIP limity ve Fázi 2.',
        ]);

        // === Projekt 2: Interní portál (draft) ===

        $projPortal = Project::create([
            'name' => 'Interní portál',
            'key' => 'PORTAL',
            'description' => 'Zaměstnanecký portál s knowledge base a onboarding workflow.',
            'status' => ProjectStatus::Draft,
            'data_classification' => 'non_phi',
            'owner_id' => $pm->id,
            'team_id' => $teamDev->id,
        ]);
        $projPortal->members()->attach([$dev1->id, $support1->id], ['role' => 'member']);

        Epic::create([
            'project_id' => $projPortal->id,
            'title' => 'Knowledge Base MVP',
            'status' => EpicStatus::Backlog,
            'owner_id' => $pm->id,
            'sort_order' => 1,
        ]);

        // === Projekt 3: Pacientský registr (PHI) ===

        $projPhi = Project::create([
            'name' => 'Pacientský registr',
            'key' => 'PACREG',
            'description' => 'Registr pacientů — obsahuje PHI data.',
            'status' => ProjectStatus::Active,
            'data_classification' => 'phi',
            'owner_id' => $exec->id,
            'team_id' => $teamDev->id,
            'start_date' => '2026-02-01',
        ]);
        $projPhi->members()->attach([$dev1->id, $dev2->id], ['role' => 'member']);

        $epicPatient = Epic::create([
            'project_id' => $projPhi->id,
            'title' => 'CRUD pacientů',
            'description' => 'Základní CRUD operace nad pacientskými záznamy',
            'status' => EpicStatus::InProgress,
            'data_classification' => 'phi',
            'owner_id' => $dev1->id,
            'sort_order' => 1,
        ]);

        Task::create([
            'project_id' => $projPhi->id,
            'epic_id' => $epicPatient->id,
            'title' => 'Formulář pro registraci pacienta',
            'status' => TaskStatus::InProgress,
            'priority' => TaskPriority::Urgent,
            'data_classification' => 'phi',
            'assignee_id' => $dev1->id,
            'reporter_id' => $exec->id,
            'sort_order' => 1,
        ]);

        Task::create([
            'project_id' => $projPhi->id,
            'epic_id' => $epicPatient->id,
            'title' => 'Audit log pro přístupy k PHI datům',
            'status' => TaskStatus::Todo,
            'priority' => TaskPriority::High,
            'data_classification' => 'phi',
            'assignee_id' => $dev2->id,
            'reporter_id' => $exec->id,
            'sort_order' => 2,
        ]);
    }
}
