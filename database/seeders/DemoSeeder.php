<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Approvals\Enums\ApprovalDecision;
use App\Modules\Approvals\Enums\ApprovalMode;
use App\Modules\Approvals\Enums\ApprovalStatus;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Comments\Models\Comment;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use App\Modules\Organization\Models\Tribe;
use App\Modules\Projects\Enums\BenefitType;
use App\Modules\Projects\Enums\ProjectStatus;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use App\Modules\Work\Enums\EpicStatus;
use App\Modules\Work\Enums\RecurrenceRule;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command->warn('DemoSeeder přeskočen — produkční prostředí.');

            return;
        }

        $this->seedOrganization();
    }

    // ──────────────────────────────────────────────
    // Organizační struktura + uživatelé
    // ──────────────────────────────────────────────

    private function seedOrganization(): void
    {
        // Divize
        $divEcom = Division::create(['name' => 'E-commerce', 'description' => 'Vývoj a provoz e-shopu']);
        $divMarketing = Division::create(['name' => 'Marketing & CX', 'description' => 'Marketing, zákaznický servis']);
        $divLogistika = Division::create(['name' => 'Logistika', 'description' => 'Sklad, expedice, doprava']);

        // Týmy
        $teamBackend = Team::create(['name' => 'Backend tým', 'division_id' => $divEcom->id]);
        $teamFrontend = Team::create(['name' => 'Frontend tým', 'division_id' => $divEcom->id]);
        $teamMarketing = Team::create(['name' => 'Marketing', 'division_id' => $divMarketing->id]);
        $teamSupport = Team::create(['name' => 'Zákaznický servis', 'division_id' => $divMarketing->id]);
        $teamSklad = Team::create(['name' => 'Sklad & Expedice', 'division_id' => $divLogistika->id]);
        $teamDoprava = Team::create(['name' => 'Doprava', 'division_id' => $divLogistika->id]);

        // Uživatelé (bez factory — Faker není dostupný na staging/prod)
        // Admin účet — reálný přístup přes Google SSO
        $admin = $this->createUser('Jan Melicherik', 'melicherikjan84@gmail.com', SystemRole::Executive);

        $exec = $this->createUser('Jiří Kratochvíl', 'jiri.kratochvil@example.cz', SystemRole::Executive);
        $pmTech = $this->createUser('Monika Fialová', 'monika.fialova@example.cz', SystemRole::ProjectManager, $teamBackend->id);
        $pmMkt = $this->createUser('David Šťastný', 'david.stastny@example.cz', SystemRole::ProjectManager, $teamMarketing->id);
        $devBack1 = $this->createUser('Ondřej Malý', 'ondrej.maly@example.cz', SystemRole::TeamMember, $teamBackend->id);
        $devBack2 = $this->createUser('Klára Veselá', 'klara.vesela@example.cz', SystemRole::TeamMember, $teamBackend->id);
        $devFront = $this->createUser('Simona Nová', 'simona.nova@example.cz', SystemRole::TeamMember, $teamFrontend->id);
        $logistik = $this->createUser('Radek Průcha', 'radek.prucha@example.cz', SystemRole::TeamMember, $teamSklad->id);
        $supportLead = $this->createUser('Jana Pokorná', 'jana.pokorna@example.cz', SystemRole::TeamMember, $teamSupport->id);
        $marketer = $this->createUser('Michal Hora', 'michal.hora@example.cz', SystemRole::TeamMember, $teamMarketing->id);
        $reader = $this->createUser('Barbora Tichá', 'barbora.ticha@example.cz', SystemRole::Reader, $teamDoprava->id);

        // Team leads
        $teamBackend->update(['team_lead_id' => $pmTech->id]);
        $teamFrontend->update(['team_lead_id' => $devFront->id]);
        $teamMarketing->update(['team_lead_id' => $pmMkt->id]);
        $teamSupport->update(['team_lead_id' => $supportLead->id]);
        $teamSklad->update(['team_lead_id' => $logistik->id]);
        $teamDoprava->update(['team_lead_id' => $reader->id]);

        // Tribe
        $tribe = Tribe::create(['name' => 'Replatform tribe', 'tribe_lead_id' => $pmTech->id]);
        $tribe->members()->attach([$devBack1->id, $devBack2->id, $devFront->id, $marketer->id]);

        // Kontext pro projekty
        $users = compact(
            'admin', 'exec', 'pmTech', 'pmMkt', 'devBack1', 'devBack2',
            'devFront', 'logistik', 'supportLead', 'marketer', 'reader',
        );

        $this->seedProjectEshop($users);
        $this->seedProjectSeo($users);
        $this->seedProjectLoyalty($users);
        $this->seedProjectWms($users);
    }

    // ──────────────────────────────────────────────
    // Projekt 1: Replatform E-shop (Active)
    // Workflow: Backlog → Todo → In Progress → Code Review → QA → Done | Zrušeno
    // ──────────────────────────────────────────────

    private function seedProjectEshop(array $u): void
    {
        $project = Project::create([
            'name' => 'Replatform E-shop',
            'key' => 'ESHOP',
            'description' => 'Kompletní přestavba e-shopu na novou platformu — nový katalog, checkout, platební brány a uživatelské účty.',
            'status' => ProjectStatus::Active,
            'data_classification' => 'non_phi',
            'owner_id' => $u['pmTech']->id,
            'team_id' => $u['pmTech']->team_id,
            'start_date' => '2026-01-15',
            'target_date' => '2026-07-31',
            'benefit_type' => BenefitType::Revenue,
            'benefit_amount' => 2500000,
            'benefit_note' => 'Očekávaný nárůst konverzního poměru o 25 % po přechodu na novou platformu.',
        ]);
        $project->members()->attach([
            $u['admin']->id => ['role' => 'member'],
            $u['devBack1']->id => ['role' => 'member'],
            $u['devBack2']->id => ['role' => 'member'],
            $u['devFront']->id => ['role' => 'member'],
            $u['marketer']->id => ['role' => 'member'],
        ]);

        $ws = $this->seedWorkflow($project, 'dev');
        $project->load('workflowStatuses');

        // === Epic 1: Produktový katalog (Done) ===
        $epicKatalog = Epic::create([
            'project_id' => $project->id,
            'title' => 'Produktový katalog',
            'description' => 'Nový produktový katalog s fasetovým filtrováním, full-text vyhledáváním a správou variant.',
            'status' => EpicStatus::Done,
            'priority' => TaskPriority::High,
            'owner_id' => $u['devBack1']->id,
            'pm_id' => $u['pmTech']->id,
            'lead_developer_id' => $u['devBack1']->id,
            'sort_order' => 1,
            'start_date' => '2026-01-15',
            'target_date' => '2026-03-01',
        ]);

        $katalogTasks = [
            ['DB schema pro produkty a varianty', TaskPriority::High, $u['devBack1']->id, 'done'],
            ['Import produktů z CSV/XML feedu', TaskPriority::High, $u['devBack2']->id, 'done'],
            ['Fasetové filtrování (kategorie, cena, barva)', TaskPriority::Medium, $u['devBack1']->id, 'done'],
            ['Full-text vyhledávání (PostgreSQL FTS)', TaskPriority::Medium, $u['devBack2']->id, 'done'],
            ['Produktový detail — frontend', TaskPriority::High, $u['devFront']->id, 'done'],
            ['Listing stránka s lazy loadem', TaskPriority::Medium, $u['devFront']->id, 'done'],
        ];

        foreach ($katalogTasks as $i => [$title, $priority, $assignee, $status]) {
            $task = Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicKatalog->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => $assignee,
                'reporter_id' => $u['pmTech']->id,
                'workflow_status_id' => $ws[$status],
                'sort_order' => $i + 1,
                'due_date' => '2026-02-'.str_pad((string) (10 + $i * 3), 2, '0', STR_PAD_LEFT),
            ]);

            // Time entries pro hotové tasky
            TimeEntry::create([
                'project_id' => $project->id,
                'task_id' => $task->id,
                'epic_id' => $epicKatalog->id,
                'user_id' => $assignee,
                'date' => '2026-02-'.str_pad((string) (8 + $i * 3), 2, '0', STR_PAD_LEFT),
                'hours' => round(rand(20, 60) / 10, 1),
                'note' => 'Implementace a code review',
            ]);
        }

        // === Epic 2: Košík a checkout (InProgress) ===
        $epicCheckout = Epic::create([
            'project_id' => $project->id,
            'title' => 'Košík a checkout',
            'description' => 'Kompletní flow nákupního košíku — přidání produktu, slevové kódy, doprava, shrnutí, objednávka.',
            'status' => EpicStatus::InProgress,
            'priority' => TaskPriority::Urgent,
            'owner_id' => $u['devFront']->id,
            'pm_id' => $u['pmTech']->id,
            'lead_developer_id' => $u['devBack2']->id,
            'sort_order' => 2,
            'start_date' => '2026-03-01',
            'target_date' => '2026-04-30',
        ]);

        $checkoutTasks = [
            ['Add-to-cart API endpoint', TaskPriority::High, $u['devBack2']->id, 'done', '2026-03-10'],
            ['Košík UI komponenta', TaskPriority::High, $u['devFront']->id, 'done', '2026-03-15'],
            ['Slevové kódy — backend validace', TaskPriority::Medium, $u['devBack1']->id, 'done', '2026-03-18'],
            ['Výběr dopravy (Zásilkovna, PPL, DPD)', TaskPriority::High, $u['devBack2']->id, 'code_review', '2026-03-25'],
            ['Checkout wizard — multi-step formulář', TaskPriority::Urgent, $u['devFront']->id, 'in_progress', '2026-04-05'],
            ['Rekapitulace objednávky', TaskPriority::Medium, $u['devFront']->id, 'in_progress', '2026-04-10'],
            ['Potvrzovací email po objednávce', TaskPriority::Medium, $u['devBack1']->id, 'todo', '2026-04-15'],
            ['Guest checkout (bez registrace)', TaskPriority::Low, $u['devBack2']->id, 'backlog', '2026-04-25'],
        ];

        foreach ($checkoutTasks as $i => [$title, $priority, $assignee, $status, $due]) {
            $task = Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicCheckout->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => $assignee,
                'reporter_id' => $u['pmTech']->id,
                'workflow_status_id' => $ws[$status],
                'sort_order' => $i + 1,
                'due_date' => $due,
            ]);

            if (in_array($status, ['done', 'code_review', 'in_progress'])) {
                TimeEntry::create([
                    'project_id' => $project->id,
                    'task_id' => $task->id,
                    'epic_id' => $epicCheckout->id,
                    'user_id' => $assignee,
                    'date' => $due,
                    'hours' => round(rand(15, 80) / 10, 1),
                    'note' => $status === 'done' ? 'Hotovo' : 'Rozpracováno',
                ]);
            }
        }

        Comment::create([
            'commentable_type' => Epic::class,
            'commentable_id' => $epicCheckout->id,
            'author_id' => $u['pmTech']->id,
            'body' => 'Checkout je priorita číslo 1 na duben. Prosím dodržte termíny, zákazník tlačí na spuštění před Velikonocemi.',
        ]);

        Comment::create([
            'commentable_type' => Task::class,
            'commentable_id' => Task::where('title', 'Checkout wizard — multi-step formulář')->first()->id,
            'author_id' => $u['devFront']->id,
            'body' => 'Mám hotový krok 1 (osobní údaje) a krok 2 (doprava). Zbývá platba a rekapitulace.',
        ]);

        // === Epic 3: Platební brány (InProgress) ===
        $epicPlatby = Epic::create([
            'project_id' => $project->id,
            'title' => 'Platební brány',
            'description' => 'Integrace platebních metod — kartové platby (GP Webpay), bankovní převod, Apple/Google Pay.',
            'status' => EpicStatus::InProgress,
            'priority' => TaskPriority::High,
            'owner_id' => $u['devBack1']->id,
            'pm_id' => $u['pmTech']->id,
            'lead_developer_id' => $u['devBack1']->id,
            'sort_order' => 3,
            'start_date' => '2026-03-15',
            'target_date' => '2026-05-15',
        ]);

        $taskGpWebpay = Task::create([
            'project_id' => $project->id,
            'epic_id' => $epicPlatby->id,
            'title' => 'GP Webpay integrace',
            'description' => 'Implementace kartových plateb přes GP Webpay — redirect flow, callback, webhook notifikace.',
            'priority' => TaskPriority::High,
            'assignee_id' => $u['devBack1']->id,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['qa'],
            'sort_order' => 1,
            'due_date' => '2026-04-01',
        ]);

        $taskBankTransfer = Task::create([
            'project_id' => $project->id,
            'epic_id' => $epicPlatby->id,
            'title' => 'Bankovní převod — generování VS a párování',
            'priority' => TaskPriority::Medium,
            'assignee_id' => $u['devBack2']->id,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['code_review'],
            'sort_order' => 2,
            'due_date' => '2026-04-08',
        ]);

        // Apple/Google Pay blokován GP Webpay integrací
        $taskApplePay = Task::create([
            'project_id' => $project->id,
            'epic_id' => $epicPlatby->id,
            'title' => 'Apple Pay / Google Pay',
            'description' => 'Nadstavba nad GP Webpay — vyžaduje dokončenou kartovou integraci.',
            'priority' => TaskPriority::Medium,
            'assignee_id' => $u['devBack1']->id,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['todo'],
            'sort_order' => 3,
            'due_date' => '2026-04-20',
        ]);
        $taskApplePay->blockers()->attach($taskGpWebpay->id);

        $taskPaymentAbstract = Task::create([
            'project_id' => $project->id,
            'epic_id' => $epicPlatby->id,
            'title' => 'Payment gateway abstrakce (strategy pattern)',
            'priority' => TaskPriority::High,
            'assignee_id' => $u['devBack1']->id,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['done'],
            'sort_order' => 4,
            'due_date' => '2026-03-25',
        ]);

        Task::create([
            'project_id' => $project->id,
            'epic_id' => $epicPlatby->id,
            'title' => 'Refundace a storna',
            'priority' => TaskPriority::Low,
            'assignee_id' => null,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['backlog'],
            'sort_order' => 5,
            'due_date' => '2026-05-10',
        ]);

        // Dependency: Bankovní převod blokuje nic, ale refundace blokována payment abstrakcí
        // (už done, takže jen pro demonstraci relace)

        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => $taskGpWebpay->id,
            'epic_id' => $epicPlatby->id,
            'user_id' => $u['devBack1']->id,
            'date' => '2026-03-28',
            'hours' => 6.0,
            'note' => 'Implementace redirect flow + callback',
        ]);

        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => $taskGpWebpay->id,
            'epic_id' => $epicPlatby->id,
            'user_id' => $u['devBack1']->id,
            'date' => '2026-03-30',
            'hours' => 4.5,
            'note' => 'Webhook handling + testy',
        ]);

        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => $taskPaymentAbstract->id,
            'epic_id' => $epicPlatby->id,
            'user_id' => $u['devBack1']->id,
            'date' => '2026-03-22',
            'hours' => 5.0,
            'note' => 'Strategy pattern pro platební brány',
        ]);

        // Approval na GP Webpay — schválený
        $approvalGp = ApprovalRequest::create([
            'approvable_type' => Task::class,
            'approvable_id' => $taskGpWebpay->id,
            'requester_id' => $u['devBack1']->id,
            'status' => ApprovalStatus::Approved,
            'mode' => ApprovalMode::AllApprove,
            'description' => 'Code review GP Webpay integrace — prosím ověřte security handling.',
            'decided_at' => '2026-03-31 14:00:00',
        ]);
        $approvalGp->votes()->create([
            'voter_id' => $u['pmTech']->id,
            'decision' => ApprovalDecision::Approved,
            'comment' => 'Vypadá dobře, security handling v pořádku.',
            'voted_at' => '2026-03-31 12:00:00',
        ]);
        $approvalGp->votes()->create([
            'voter_id' => $u['devBack2']->id,
            'decision' => ApprovalDecision::Approved,
            'comment' => 'LGTM, jen drobný nit v error handlingu — opraveno.',
            'voted_at' => '2026-03-31 14:00:00',
        ]);

        Comment::create([
            'commentable_type' => Task::class,
            'commentable_id' => $taskGpWebpay->id,
            'author_id' => $u['devBack1']->id,
            'body' => 'Přesunuto do QA. Testovací credentials jsou v .env.staging, prosím otestujte happy path i 3DS.',
        ]);

        Comment::create([
            'commentable_type' => Task::class,
            'commentable_id' => $taskBankTransfer->id,
            'author_id' => $u['devBack2']->id,
            'body' => 'Variabilní symbol generujeme z order ID + Luhn check digit. Párování přes FIO API.',
        ]);

        // === Epic 4: Uživatelský účet (Backlog) ===
        $epicAccount = Epic::create([
            'project_id' => $project->id,
            'title' => 'Uživatelský účet',
            'description' => 'Registrace, přihlášení, profil, historie objednávek, oblíbené produkty.',
            'status' => EpicStatus::Backlog,
            'priority' => TaskPriority::Medium,
            'owner_id' => $u['devFront']->id,
            'pm_id' => $u['pmTech']->id,
            'sort_order' => 4,
            'target_date' => '2026-06-15',
        ]);

        $accountTasks = [
            ['Registrace a přihlášení (email + heslo)', TaskPriority::High, null, 'backlog', '2026-05-01'],
            ['Profil — editace osobních údajů', TaskPriority::Medium, null, 'backlog', '2026-05-15'],
            ['Historie objednávek', TaskPriority::Medium, null, 'backlog', '2026-05-25'],
            ['Oblíbené produkty (wishlist)', TaskPriority::Low, null, 'backlog', '2026-06-10'],
        ];

        foreach ($accountTasks as $i => [$title, $priority, $assignee, $status, $due]) {
            Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicAccount->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => $assignee,
                'reporter_id' => $u['pmTech']->id,
                'workflow_status_id' => $ws[$status],
                'sort_order' => $i + 1,
                'due_date' => $due,
            ]);
        }

        // === Epic 5: Notifikace a emaily (Backlog) ===
        $epicNotif = Epic::create([
            'project_id' => $project->id,
            'title' => 'Notifikace a emaily',
            'description' => 'Transakční emaily, push notifikace, monitoring delivery rate.',
            'status' => EpicStatus::Backlog,
            'priority' => TaskPriority::Low,
            'owner_id' => $u['devBack2']->id,
            'pm_id' => $u['pmTech']->id,
            'sort_order' => 5,
            'target_date' => '2026-07-15',
        ]);

        Task::create([
            'project_id' => $project->id,
            'epic_id' => $epicNotif->id,
            'title' => 'Šablony transakčních emailů (objednávka, expedice, doručení)',
            'priority' => TaskPriority::Medium,
            'assignee_id' => null,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['backlog'],
            'sort_order' => 1,
            'due_date' => '2026-06-20',
        ]);

        Task::create([
            'project_id' => $project->id,
            'epic_id' => $epicNotif->id,
            'title' => 'Push notifikace — opuštěný košík',
            'priority' => TaskPriority::Low,
            'assignee_id' => null,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['backlog'],
            'sort_order' => 2,
        ]);

        // Recurrence task
        Task::create([
            'project_id' => $project->id,
            'epic_id' => $epicNotif->id,
            'title' => 'Kontrola email delivery rate',
            'description' => 'Týdenní kontrola bounce rate a spam score u transakčních emailů.',
            'priority' => TaskPriority::Medium,
            'assignee_id' => $u['devBack2']->id,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['todo'],
            'sort_order' => 3,
            'recurrence_rule' => RecurrenceRule::Weekly,
            'recurrence_next_at' => '2026-04-07',
        ]);

        // Standalone task (bez epiku)
        Task::create([
            'project_id' => $project->id,
            'epic_id' => null,
            'title' => 'Nastavení CI/CD pipeline pro staging',
            'priority' => TaskPriority::High,
            'assignee_id' => $u['devBack1']->id,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['done'],
            'sort_order' => 1,
            'due_date' => '2026-02-01',
        ]);

        Task::create([
            'project_id' => $project->id,
            'epic_id' => null,
            'title' => 'Monitoring a alerting (Sentry + UptimeRobot)',
            'priority' => TaskPriority::Medium,
            'assignee_id' => $u['devBack1']->id,
            'reporter_id' => $u['pmTech']->id,
            'workflow_status_id' => $ws['in_progress'],
            'sort_order' => 2,
            'due_date' => '2026-04-15',
        ]);

        // Approval — pending (checkout wizard)
        $checkoutWizardTask = Task::where('title', 'Checkout wizard — multi-step formulář')->first();
        $approvalCheckout = ApprovalRequest::create([
            'approvable_type' => Task::class,
            'approvable_id' => $checkoutWizardTask->id,
            'requester_id' => $u['devFront']->id,
            'status' => ApprovalStatus::Pending,
            'mode' => ApprovalMode::AllApprove,
            'description' => 'UX review checkout flow — prosím zkontrolujte multi-step formulář před dokončením.',
            'expires_at' => '2026-04-10 23:59:59',
        ]);
        $approvalCheckout->votes()->create(['voter_id' => $u['pmTech']->id]);
        $approvalCheckout->votes()->create(['voter_id' => $u['marketer']->id]);

        // Time entry na epic úrovni (plánování)
        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => null,
            'epic_id' => $epicCheckout->id,
            'user_id' => $u['pmTech']->id,
            'date' => '2026-03-01',
            'hours' => 3.0,
            'note' => 'Plánování checkout flow, wireframy',
        ]);

        // Wiki stránky
        $wikiArch = WikiPage::create([
            'project_id' => $project->id,
            'title' => 'Architektura e-shopu',
            'content' => "# Architektura e-shopu\n\n## Přehled\nMonolitická Laravel aplikace s Inertia.js frontend. Modularní struktura — každý bounded context (katalog, košík, platby, uživatelé) v separátním modulu.\n\n## Klíčové rozhodnutí\n- PostgreSQL JSONB pro produktové atributy (flexibilní schéma)\n- Redis pro session a cache košíku\n- Event-driven komunikace mezi moduly (Laravel Events)\n\n## Deployment\nDocker + Caddy, CI/CD přes GitHub Actions.",
            'author_id' => $u['devBack1']->id,
            'position' => 1,
        ]);

        WikiPage::create([
            'project_id' => $project->id,
            'parent_id' => $wikiArch->id,
            'title' => 'API dokumentace',
            'content' => "# API dokumentace\n\n## Produkty\n- `GET /api/products` — listing s filtry\n- `GET /api/products/{slug}` — detail produktu\n\n## Košík\n- `POST /api/cart/items` — přidání do košíku\n- `PATCH /api/cart/items/{id}` — změna množství\n- `DELETE /api/cart/items/{id}` — odebrání\n\n## Objednávky\n- `POST /api/orders` — vytvoření objednávky\n- `GET /api/orders/{id}` — detail objednávky",
            'author_id' => $u['devBack1']->id,
            'position' => 1,
        ]);

        WikiPage::create([
            'project_id' => $project->id,
            'parent_id' => $wikiArch->id,
            'title' => 'Deployment guide',
            'content' => "# Deployment guide\n\n## Staging\n```bash\ngit push origin main  # auto-deploy přes GitHub Actions\n```\n\n## Produkce\n1. Vytvořit release tag `v*`\n2. GitHub Actions spustí build + deploy\n3. Ověřit smoke testy\n\n## Rollback\n```bash\ndocker compose -f docker-compose.prod.yml up -d --force-recreate\n```",
            'author_id' => $u['pmTech']->id,
            'position' => 2,
        ]);
    }

    // ──────────────────────────────────────────────
    // Projekt 2: SEO & Performance (Active)
    // Workflow: Backlog → Todo → In Progress → Review → Done | Zrušeno
    // ──────────────────────────────────────────────

    private function seedProjectSeo(array $u): void
    {
        $project = Project::create([
            'name' => 'SEO & Performance optimalizace',
            'key' => 'SEO',
            'description' => 'Technické SEO, obsahová strategie a analytika pro zvýšení organického trafficu o 40 %.',
            'status' => ProjectStatus::Active,
            'data_classification' => 'non_phi',
            'owner_id' => $u['pmMkt']->id,
            'team_id' => $u['pmMkt']->team_id,
            'start_date' => '2026-02-10',
            'target_date' => '2026-05-31',
            'benefit_type' => BenefitType::Revenue,
            'benefit_amount' => 800000,
            'benefit_note' => 'Nárůst organického trafficu → vyšší tržby bez navýšení PPC rozpočtu.',
        ]);
        $project->members()->attach([
            $u['admin']->id => ['role' => 'member'],
            $u['devBack1']->id => ['role' => 'member'],
            $u['devFront']->id => ['role' => 'member'],
            $u['marketer']->id => ['role' => 'member'],
        ]);

        $ws = $this->seedWorkflow($project, 'marketing');
        $project->load('workflowStatuses');

        // === Epic 1: Technické SEO ===
        $epicTechSeo = Epic::create([
            'project_id' => $project->id,
            'title' => 'Technické SEO',
            'description' => 'Core Web Vitals, sitemap, canonical URLs, structured data, robots.txt.',
            'status' => EpicStatus::InProgress,
            'priority' => TaskPriority::High,
            'owner_id' => $u['devBack1']->id,
            'pm_id' => $u['pmMkt']->id,
            'sort_order' => 1,
            'start_date' => '2026-02-10',
            'target_date' => '2026-04-15',
        ]);

        $techSeoTasks = [
            ['Generování XML sitemap', TaskPriority::High, $u['devBack1']->id, 'done', '2026-03-01'],
            ['Canonical URLs na všech stránkách', TaskPriority::High, $u['devBack1']->id, 'done', '2026-03-10'],
            ['Structured data (JSON-LD) pro produkty', TaskPriority::Medium, $u['devBack1']->id, 'review', '2026-03-20'],
            ['Core Web Vitals optimalizace (LCP, CLS)', TaskPriority::Urgent, $u['devFront']->id, 'in_progress', '2026-04-01'],
            ['Audit robots.txt a meta robots', TaskPriority::Low, $u['marketer']->id, 'todo', '2026-04-10'],
        ];

        foreach ($techSeoTasks as $i => [$title, $priority, $assignee, $status, $due]) {
            $task = Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicTechSeo->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => $assignee,
                'reporter_id' => $u['pmMkt']->id,
                'workflow_status_id' => $ws[$status],
                'sort_order' => $i + 1,
                'due_date' => $due,
            ]);

            if (in_array($status, ['done', 'review'])) {
                TimeEntry::create([
                    'project_id' => $project->id,
                    'task_id' => $task->id,
                    'epic_id' => $epicTechSeo->id,
                    'user_id' => $assignee,
                    'date' => $due,
                    'hours' => round(rand(20, 50) / 10, 1),
                ]);
            }
        }

        Comment::create([
            'commentable_type' => Task::class,
            'commentable_id' => Task::where('title', 'Core Web Vitals optimalizace (LCP, CLS)')->first()->id,
            'author_id' => $u['devFront']->id,
            'body' => 'LCP je aktuálně 3.8s, cíl je pod 2.5s. Hlavní problém je hero image bez lazy loadu a neoptimalizované fonty.',
        ]);

        // === Epic 2: Obsahová strategie ===
        $epicObsah = Epic::create([
            'project_id' => $project->id,
            'title' => 'Obsahová strategie',
            'description' => 'Keyword research, product descriptions, blog plán, landing pages pro top kategorie.',
            'status' => EpicStatus::InProgress,
            'priority' => TaskPriority::Medium,
            'owner_id' => $u['marketer']->id,
            'pm_id' => $u['pmMkt']->id,
            'sort_order' => 2,
            'start_date' => '2026-03-01',
            'target_date' => '2026-05-15',
        ]);

        $obsahTasks = [
            ['Keyword research (top 50 kategorií)', TaskPriority::High, $u['marketer']->id, 'done', '2026-03-15'],
            ['Přepis product descriptions (top 100 produktů)', TaskPriority::Medium, $u['marketer']->id, 'in_progress', '2026-04-10'],
            ['Obsahový plán pro blog (12 článků)', TaskPriority::Medium, $u['marketer']->id, 'todo', '2026-04-20'],
            ['Landing pages pro top 5 kategorií', TaskPriority::High, $u['devFront']->id, 'backlog', '2026-05-01'],
        ];

        foreach ($obsahTasks as $i => [$title, $priority, $assignee, $status, $due]) {
            Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicObsah->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => $assignee,
                'reporter_id' => $u['pmMkt']->id,
                'workflow_status_id' => $ws[$status],
                'sort_order' => $i + 1,
                'due_date' => $due,
            ]);
        }

        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => Task::where('title', 'Keyword research (top 50 kategorií)')->first()->id,
            'epic_id' => $epicObsah->id,
            'user_id' => $u['marketer']->id,
            'date' => '2026-03-12',
            'hours' => 8.0,
            'note' => 'Ahrefs analýza + kompetitivní research',
        ]);

        // === Epic 3: Analytika a tracking ===
        $epicAnalytika = Epic::create([
            'project_id' => $project->id,
            'title' => 'Analytika a tracking',
            'description' => 'GA4 enhanced e-commerce, conversion tracking, A/B testing.',
            'status' => EpicStatus::Backlog,
            'priority' => TaskPriority::Medium,
            'owner_id' => $u['marketer']->id,
            'pm_id' => $u['pmMkt']->id,
            'sort_order' => 3,
            'target_date' => '2026-05-31',
        ]);

        $analytikaTasks = [
            ['GA4 enhanced e-commerce events', TaskPriority::High, $u['devFront']->id, 'backlog', '2026-04-25'],
            ['Conversion tracking (Facebook Pixel, Google Ads)', TaskPriority::Medium, $u['marketer']->id, 'backlog', '2026-05-10'],
            ['A/B testing framework (Google Optimize alternativa)', TaskPriority::Low, null, 'backlog', '2026-05-25'],
        ];

        foreach ($analytikaTasks as $i => [$title, $priority, $assignee, $status, $due]) {
            Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicAnalytika->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => $assignee,
                'reporter_id' => $u['pmMkt']->id,
                'workflow_status_id' => $ws[$status],
                'sort_order' => $i + 1,
                'due_date' => $due,
            ]);
        }

        Comment::create([
            'commentable_type' => Epic::class,
            'commentable_id' => $epicAnalytika->id,
            'author_id' => $u['pmMkt']->id,
            'body' => 'Analytiku odložíme až po spuštění nového eshopu, nemá smysl implementovat na staré platformě.',
        ]);

        // Wiki
        WikiPage::create([
            'project_id' => $project->id,
            'title' => 'SEO checklist',
            'content' => "# SEO checklist\n\n## Technické\n- [x] XML sitemap\n- [x] Canonical URLs\n- [ ] Structured data\n- [ ] Core Web Vitals < 2.5s LCP\n- [ ] robots.txt audit\n\n## Obsahové\n- [x] Keyword research\n- [ ] Product descriptions (0/100)\n- [ ] Blog plán\n- [ ] Category landing pages\n\n## Analytika\n- [ ] GA4 enhanced ecommerce\n- [ ] Conversion tracking\n- [ ] A/B testing",
            'author_id' => $u['pmMkt']->id,
            'position' => 1,
        ]);
    }

    // ──────────────────────────────────────────────
    // Projekt 3: Loyalty program (Draft)
    // Workflow: Backlog → Todo → In Progress → Done
    // ──────────────────────────────────────────────

    private function seedProjectLoyalty(array $u): void
    {
        $project = Project::create([
            'name' => 'Loyalty program',
            'key' => 'LOYAL',
            'description' => 'Věrnostní program pro zákazníky — sbírání bodů, odměny, integrace s CRM a zákaznickým portálem.',
            'status' => ProjectStatus::Draft,
            'data_classification' => 'non_phi',
            'owner_id' => $u['pmMkt']->id,
            'team_id' => $u['pmMkt']->team_id,
            'benefit_type' => BenefitType::Strategy,
            'benefit_note' => 'Zvýšení retence zákazníků a průměrné hodnoty objednávky.',
        ]);
        $project->members()->attach([
            $u['admin']->id => ['role' => 'member'],
            $u['marketer']->id => ['role' => 'member'],
            $u['devBack2']->id => ['role' => 'member'],
            $u['supportLead']->id => ['role' => 'member'],
        ]);

        $ws = $this->seedWorkflow($project, 'simple');
        $project->load('workflowStatuses');

        // === Epic 1: Bodový systém ===
        $epicBody = Epic::create([
            'project_id' => $project->id,
            'title' => 'Bodový systém',
            'description' => 'Pravidla pro získávání a uplatňování bodů, expirace, úrovně (Bronze/Silver/Gold).',
            'status' => EpicStatus::Backlog,
            'priority' => TaskPriority::High,
            'owner_id' => $u['pmMkt']->id,
            'sort_order' => 1,
        ]);

        $bodyTasks = [
            ['Definice pravidel — body za nákup, registraci, recenzi', TaskPriority::High],
            ['Expirace bodů po 12 měsících', TaskPriority::Medium],
            ['Úrovně zákazníků (Bronze / Silver / Gold)', TaskPriority::Medium],
        ];

        foreach ($bodyTasks as $i => [$title, $priority]) {
            Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicBody->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => null,
                'reporter_id' => $u['pmMkt']->id,
                'workflow_status_id' => $ws['backlog'],
                'sort_order' => $i + 1,
            ]);
        }

        // === Epic 2: Integrace s CRM ===
        Epic::create([
            'project_id' => $project->id,
            'title' => 'Integrace s CRM',
            'description' => 'Synchronizace zákaznických dat a bodového stavu s Raynet CRM.',
            'status' => EpicStatus::Backlog,
            'priority' => TaskPriority::Medium,
            'owner_id' => $u['devBack2']->id,
            'sort_order' => 2,
        ]);

        $crmEpic = Epic::where('title', 'Integrace s CRM')
            ->where('project_id', $project->id)->first();

        $crmTasks = [
            ['Raynet API konektor', TaskPriority::High],
            ['Synchronizace zákazníků (bi-directional)', TaskPriority::Medium],
        ];

        foreach ($crmTasks as $i => [$title, $priority]) {
            Task::create([
                'project_id' => $project->id,
                'epic_id' => $crmEpic->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => null,
                'reporter_id' => $u['pmMkt']->id,
                'workflow_status_id' => $ws['backlog'],
                'sort_order' => $i + 1,
            ]);
        }

        // === Epic 3: Zákaznický portál ===
        $epicPortal = Epic::create([
            'project_id' => $project->id,
            'title' => 'Zákaznický portál',
            'description' => 'Self-service portál pro správu bodů, historii transakcí a výběr odměn.',
            'status' => EpicStatus::Backlog,
            'priority' => TaskPriority::Low,
            'owner_id' => $u['marketer']->id,
            'sort_order' => 3,
        ]);

        $portalTasks = [
            ['Dashboard s bodovým stavem', TaskPriority::Medium],
            ['Historie transakcí (získání a uplatnění bodů)', TaskPriority::Medium],
            ['Katalog odměn', TaskPriority::Low],
        ];

        foreach ($portalTasks as $i => [$title, $priority]) {
            Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicPortal->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => null,
                'reporter_id' => $u['pmMkt']->id,
                'workflow_status_id' => $ws['backlog'],
                'sort_order' => $i + 1,
            ]);
        }

        Comment::create([
            'commentable_type' => Epic::class,
            'commentable_id' => $epicBody->id,
            'author_id' => $u['pmMkt']->id,
            'body' => 'Ještě nemáme finální business model od vedení. Zatím jen sbíráme požadavky.',
        ]);

        // Wiki — draft koncept
        WikiPage::create([
            'project_id' => $project->id,
            'title' => 'Koncept loyalty programu',
            'content' => "# Koncept loyalty programu\n\n## Cíl\nZvýšit retenci zákazníků o 15 % a průměrnou hodnotu objednávky o 10 %.\n\n## Mechanika\n- 1 Kč = 1 bod\n- Registrace = 500 bodů\n- Recenze = 100 bodů\n- Expirace: 12 měsíců od posledního nákupu\n\n## Úrovně\n| Úroveň | Podmínka | Výhoda |\n|--------|----------|--------|\n| Bronze | 0+ bodů | Základní slevy |\n| Silver | 5 000+ bodů | 5% sleva + přednostní podpora |\n| Gold | 20 000+ bodů | 10% sleva + doprava zdarma |\n\n## Otevřené otázky\n- Napojení na e-shop vs. standalone systém?\n- Partnerské programy?",
            'author_id' => $u['pmMkt']->id,
            'position' => 1,
        ]);
    }

    // ──────────────────────────────────────────────
    // Projekt 4: Migrace skladu na WMS (OnHold)
    // Workflow: Backlog → Todo → In Progress → Testing → Approval → Done | Zrušeno
    // ──────────────────────────────────────────────

    private function seedProjectWms(array $u): void
    {
        $project = Project::create([
            'name' => 'Migrace skladu na WMS',
            'key' => 'WMS',
            'description' => 'Napojení skladového systému na WMS (Warehouse Management System) od externího dodavatele.',
            'status' => ProjectStatus::OnHold,
            'data_classification' => 'non_phi',
            'owner_id' => $u['exec']->id,
            'team_id' => $u['logistik']->team_id,
            'start_date' => '2026-03-01',
            'target_date' => '2026-09-30',
            'benefit_type' => BenefitType::Costsave,
            'benefit_amount' => 400000,
            'benefit_note' => 'Automatizace skladových procesů — úspora 2 FTE na manuální práci.',
        ]);
        $project->members()->attach([
            $u['admin']->id => ['role' => 'member'],
            $u['logistik']->id => ['role' => 'member'],
            $u['devBack1']->id => ['role' => 'member'],
            $u['devBack2']->id => ['role' => 'member'],
        ]);

        $ws = $this->seedWorkflow($project, 'logistics');
        $project->load('workflowStatuses');

        // === Epic 1: API napojení na WMS ===
        $epicApi = Epic::create([
            'project_id' => $project->id,
            'title' => 'API napojení na WMS',
            'description' => 'REST API integrace s WMS systémem dodavatele — autentizace, CRUD operace, webhooky.',
            'status' => EpicStatus::InProgress,
            'priority' => TaskPriority::High,
            'owner_id' => $u['devBack1']->id,
            'pm_id' => $u['exec']->id,
            'sort_order' => 1,
            'start_date' => '2026-03-01',
            'target_date' => '2026-06-30',
        ]);

        $apiTasks = [
            ['WMS API klient (autentizace + base requests)', TaskPriority::High, $u['devBack1']->id, 'testing', '2026-03-25'],
            ['Mapping interních SKU na WMS kódy', TaskPriority::High, $u['devBack2']->id, 'in_progress', '2026-04-05'],
            ['Webhook receiver pro statusové změny', TaskPriority::Medium, $u['devBack1']->id, 'todo', '2026-04-15'],
            ['Error handling a retry logika', TaskPriority::Medium, null, 'backlog', '2026-04-30'],
        ];

        foreach ($apiTasks as $i => [$title, $priority, $assignee, $status, $due]) {
            $task = Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicApi->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => $assignee,
                'reporter_id' => $u['exec']->id,
                'workflow_status_id' => $ws[$status],
                'sort_order' => $i + 1,
                'due_date' => $due,
            ]);

            if (in_array($status, ['testing', 'in_progress'])) {
                TimeEntry::create([
                    'project_id' => $project->id,
                    'task_id' => $task->id,
                    'epic_id' => $epicApi->id,
                    'user_id' => $assignee,
                    'date' => $due,
                    'hours' => round(rand(30, 60) / 10, 1),
                ]);
            }
        }

        // === Epic 2: Synchronizace skladových zásob ===
        $epicSync = Epic::create([
            'project_id' => $project->id,
            'title' => 'Synchronizace skladových zásob',
            'description' => 'Real-time synchronizace stavu zásob mezi e-shopem a WMS — příjem, výdej, inventura.',
            'status' => EpicStatus::Backlog,
            'priority' => TaskPriority::Medium,
            'owner_id' => $u['logistik']->id,
            'sort_order' => 2,
            'target_date' => '2026-08-31',
        ]);

        $syncTasks = [
            ['Příjem zboží — sync z WMS do e-shopu', TaskPriority::High, null, 'backlog'],
            ['Výdej / expedice — update stavu objednávky', TaskPriority::High, null, 'backlog'],
            ['Inventurní rozdíly — alert a reconciliace', TaskPriority::Medium, null, 'backlog'],
        ];

        foreach ($syncTasks as $i => [$title, $priority, $assignee, $status]) {
            Task::create([
                'project_id' => $project->id,
                'epic_id' => $epicSync->id,
                'title' => $title,
                'priority' => $priority,
                'assignee_id' => $assignee,
                'reporter_id' => $u['exec']->id,
                'workflow_status_id' => $ws[$status],
                'sort_order' => $i + 1,
            ]);
        }

        // Komentář vysvětlující pozastavení
        Comment::create([
            'commentable_type' => Project::class,
            'commentable_id' => $project->id,
            'author_id' => $u['exec']->id,
            'body' => 'Projekt pozastaven k 25. 3. 2026. Dodavatel WMS oznámil zpoždění nové verze API (v3) o 2 měsíce. Nemá smysl integrovat na v2, která bude deprecated. Obnovíme po dodání v3 (očekáváno červen 2026).',
        ]);

        Comment::create([
            'commentable_type' => Epic::class,
            'commentable_id' => $epicApi->id,
            'author_id' => $u['devBack1']->id,
            'body' => 'Mám rozpracovaný API klient na v2. Až přijde v3, bude potřeba přepsat auth vrstvu (OAuth2 místo API key).',
        ]);

        // Approval — pending na obnovení projektu
        $approval = ApprovalRequest::create([
            'approvable_type' => Project::class,
            'approvable_id' => $project->id,
            'requester_id' => $u['logistik']->id,
            'status' => ApprovalStatus::Pending,
            'mode' => ApprovalMode::AllApprove,
            'description' => 'Žádost o obnovení projektu po dodání WMS API v3.',
        ]);
        $approval->votes()->create(['voter_id' => $u['exec']->id]);
        $approval->votes()->create(['voter_id' => $u['pmTech']->id]);
    }

    // ──────────────────────────────────────────────
    // Workflow helper — vytvoří vlastní workflow per typ projektu
    // ──────────────────────────────────────────────

    /**
     * @return array<string, string> slug → workflow_status_id
     */
    private function seedWorkflow(Project $project, string $type): array
    {
        $definitions = match ($type) {
            'dev' => [
                ['name' => 'Backlog', 'slug' => 'backlog', 'color' => '#97a0af', 'is_initial' => true],
                ['name' => 'K zpracování', 'slug' => 'todo', 'color' => '#4c9aff'],
                ['name' => 'V průběhu', 'slug' => 'in_progress', 'color' => '#0065ff'],
                ['name' => 'Code Review', 'slug' => 'code_review', 'color' => '#8777d9'],
                ['name' => 'QA', 'slug' => 'qa', 'color' => '#ff8b00'],
                ['name' => 'Hotovo', 'slug' => 'done', 'color' => '#36b37e', 'is_done' => true],
                ['name' => 'Zrušeno', 'slug' => 'cancelled', 'color' => '#6b778c', 'is_cancelled' => true, 'allow_transition_from_any' => true],
            ],
            'marketing' => [
                ['name' => 'Backlog', 'slug' => 'backlog', 'color' => '#97a0af', 'is_initial' => true],
                ['name' => 'K zpracování', 'slug' => 'todo', 'color' => '#4c9aff'],
                ['name' => 'V průběhu', 'slug' => 'in_progress', 'color' => '#0065ff'],
                ['name' => 'Review', 'slug' => 'review', 'color' => '#8777d9'],
                ['name' => 'Hotovo', 'slug' => 'done', 'color' => '#36b37e', 'is_done' => true],
                ['name' => 'Zrušeno', 'slug' => 'cancelled', 'color' => '#6b778c', 'is_cancelled' => true, 'allow_transition_from_any' => true],
            ],
            'simple' => [
                ['name' => 'Backlog', 'slug' => 'backlog', 'color' => '#97a0af', 'is_initial' => true],
                ['name' => 'K zpracování', 'slug' => 'todo', 'color' => '#4c9aff'],
                ['name' => 'V průběhu', 'slug' => 'in_progress', 'color' => '#0065ff'],
                ['name' => 'Hotovo', 'slug' => 'done', 'color' => '#36b37e', 'is_done' => true],
            ],
            'logistics' => [
                ['name' => 'Backlog', 'slug' => 'backlog', 'color' => '#97a0af', 'is_initial' => true],
                ['name' => 'K zpracování', 'slug' => 'todo', 'color' => '#4c9aff'],
                ['name' => 'V průběhu', 'slug' => 'in_progress', 'color' => '#0065ff'],
                ['name' => 'Testování', 'slug' => 'testing', 'color' => '#ff8b00'],
                ['name' => 'Ke schválení', 'slug' => 'approval', 'color' => '#8777d9'],
                ['name' => 'Hotovo', 'slug' => 'done', 'color' => '#36b37e', 'is_done' => true],
                ['name' => 'Zrušeno', 'slug' => 'cancelled', 'color' => '#6b778c', 'is_cancelled' => true, 'allow_transition_from_any' => true],
            ],
        };

        $created = [];
        foreach ($definitions as $position => $def) {
            $status = $project->workflowStatuses()->create([
                'name' => $def['name'],
                'slug' => $def['slug'],
                'color' => $def['color'],
                'position' => $position,
                'is_initial' => $def['is_initial'] ?? false,
                'is_done' => $def['is_done'] ?? false,
                'is_cancelled' => $def['is_cancelled'] ?? false,
                'allow_transition_from_any' => $def['allow_transition_from_any'] ?? false,
            ]);
            $created[$def['slug']] = $status->getAttribute('id');
        }

        // Přechody: lineární řetězec + zpětné kroky
        $slugs = array_keys($created);
        $nonCancelled = array_filter($slugs, fn ($s) => $s !== 'cancelled');
        $nonCancelled = array_values($nonCancelled);

        for ($i = 0; $i < count($nonCancelled) - 1; $i++) {
            // Vpřed
            $project->workflowTransitions()->create([
                'from_status_id' => $created[$nonCancelled[$i]],
                'to_status_id' => $created[$nonCancelled[$i + 1]],
            ]);
            // Zpět o 1
            $project->workflowTransitions()->create([
                'from_status_id' => $created[$nonCancelled[$i + 1]],
                'to_status_id' => $created[$nonCancelled[$i]],
            ]);
        }

        // Done → zpět na první ne-initial stav
        if (count($nonCancelled) > 2) {
            $project->workflowTransitions()->create([
                'from_status_id' => $created[$nonCancelled[count($nonCancelled) - 1]],
                'to_status_id' => $created[$nonCancelled[1]],
            ]);
        }

        // Cancelled → backlog
        if (isset($created['cancelled'])) {
            $project->workflowTransitions()->create([
                'from_status_id' => $created['cancelled'],
                'to_status_id' => $created['backlog'],
            ]);
        }

        return $created;
    }

    private function createUser(string $name, string $email, SystemRole $role, ?string $teamId = null): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'system_role' => $role,
            'status' => UserStatus::Active,
            'team_id' => $teamId,
        ]);
    }
}
