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
use App\Modules\Projects\Models\ProjectUpdate;
use App\Modules\Wiki\Models\WikiPage;
use App\Modules\Work\Enums\EpicStatus;
use App\Modules\Work\Enums\RecurrenceRule;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Database\Seeder;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Hash;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use Illuminate\Support\Str;

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
        $admin = $this->createUser('Jan Melicherik', 'melicherikjan84@gmail.com', SystemRole::Executive, null, [
            'job_title' => 'CTO',
            'phone' => '+420 777 111 222',
            'bio' => 'Zodpovědný za technickou strategii a architekturu platformy PHC Nexus.',
            'capacity_h_week' => 40,
        ]);

        $exec = $this->createUser('Jiří Kratochvíl', 'jiri.kratochvil@example.cz', SystemRole::Executive, null, [
            'job_title' => 'CEO',
            'phone' => '+420 777 333 444',
            'bio' => 'Řízení společnosti a strategické plánování.',
            'capacity_h_week' => 40,
        ]);
        $pmTech = $this->createUser('Monika Fialová', 'monika.fialova@example.cz', SystemRole::ProjectManager, $teamBackend->id, [
            'job_title' => 'Lead Backend Engineer',
            'phone' => '+420 602 111 333',
            'capacity_h_week' => 40,
        ]);
        $pmMkt = $this->createUser('David Šťastný', 'david.stastny@example.cz', SystemRole::ProjectManager, $teamMarketing->id, [
            'job_title' => 'Marketing Manager',
            'phone' => '+420 603 222 444',
            'capacity_h_week' => 40,
        ]);
        $devBack1 = $this->createUser('Ondřej Malý', 'ondrej.maly@example.cz', SystemRole::TeamMember, $teamBackend->id, [
            'job_title' => 'Senior PHP Developer',
            'capacity_h_week' => 40,
        ]);
        $devBack2 = $this->createUser('Klára Veselá', 'klara.vesela@example.cz', SystemRole::TeamMember, $teamBackend->id, [
            'job_title' => 'PHP Developer',
            'capacity_h_week' => 32,
        ]);
        $devFront = $this->createUser('Simona Nová', 'simona.nova@example.cz', SystemRole::TeamMember, $teamFrontend->id, [
            'job_title' => 'Frontend Developer',
            'capacity_h_week' => 40,
        ]);
        $logistik = $this->createUser('Radek Průcha', 'radek.prucha@example.cz', SystemRole::TeamMember, $teamSklad->id, [
            'job_title' => 'Warehouse Lead',
            'capacity_h_week' => 40,
        ]);
        $supportLead = $this->createUser('Jana Pokorná', 'jana.pokorna@example.cz', SystemRole::TeamMember, $teamSupport->id, [
            'job_title' => 'Support Team Lead',
            'phone' => '+420 604 555 666',
            'capacity_h_week' => 40,
        ]);
        $marketer = $this->createUser('Michal Hora', 'michal.hora@example.cz', SystemRole::TeamMember, $teamMarketing->id, [
            'job_title' => 'Digital Marketing Specialist',
            'capacity_h_week' => 32,
        ]);
        $reader = $this->createUser('Barbora Tichá', 'barbora.ticha@example.cz', SystemRole::Reader, $teamDoprava->id, [
            'job_title' => 'Logistics Coordinator',
            'capacity_h_week' => 20,
        ]);

        // Invited user — pro testování invite flow
        $this->createUser('Tomáš Novotný', 'tomas.novotny@example.cz', SystemRole::TeamMember, null, [
            'job_title' => 'QA Engineer',
            'status' => UserStatus::Invited,
        ]);

        // Deactivated user — pro testování filtrů
        $this->createUser('Petra Černá', 'petra.cerna@example.cz', SystemRole::TeamMember, null, [
            'job_title' => 'Former Analyst',
            'status' => UserStatus::Deactivated,
        ]);

        // Uživatel bez týmu — pro testování filtru "neobsazení"
        $this->createUser('Lukáš Svoboda', 'lukas.svoboda@example.cz', SystemRole::TeamMember, null, [
            'job_title' => 'Data Analyst',
            'capacity_h_week' => 40,
            'bio' => 'Nový zaměstnanec, zatím nepřiřazen k týmu.',
        ]);

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
        $this->seedProjectUpdates($users);
        $this->seedNotifications($users);
        $this->seedTaskDependencies();
        $this->seedAuditEntries($users);
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

        // Approval na bankovní převod — zamítnuto (pro analytics)
        $approvalBank = ApprovalRequest::create([
            'approvable_type' => Task::class,
            'approvable_id' => $taskBankTransfer->id,
            'requester_id' => $u['devBack2']->id,
            'status' => ApprovalStatus::Rejected,
            'mode' => ApprovalMode::AllApprove,
            'description' => 'Review implementace bankovních převodů — prosím zkontrolujte Luhn validaci.',
            'decided_at' => '2026-03-28 10:30:00',
        ]);
        $approvalBank->votes()->create([
            'voter_id' => $u['pmTech']->id,
            'decision' => ApprovalDecision::Rejected,
            'comment' => 'Luhn check digit je špatně implementovaný — viz issue #42. Opravte a pošlete znovu.',
            'voted_at' => '2026-03-28 10:30:00',
        ]);

        // Approval — zrušený
        $approvalCancelled = ApprovalRequest::create([
            'approvable_type' => Task::class,
            'approvable_id' => $taskGpWebpay->id,
            'requester_id' => $u['devBack1']->id,
            'status' => ApprovalStatus::Cancelled,
            'mode' => ApprovalMode::AllApprove,
            'description' => 'Starý request — nahrazen novým po refaktoru.',
            'decided_at' => '2026-03-25 09:00:00',
        ]);

        // Další time entries pro projekt
        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => $taskGpWebpay->id,
            'user_id' => $u['devBack1']->id,
            'date' => '2026-04-01',
            'hours' => 6.0,
            'note' => 'GP Webpay integrace — implementace 3DS flow',
        ]);
        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => $taskBankTransfer->id,
            'user_id' => $u['devBack2']->id,
            'date' => '2026-04-01',
            'hours' => 4.5,
            'note' => 'FIO API klient + Luhn validace',
        ]);
        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => $taskGpWebpay->id,
            'user_id' => $u['devBack1']->id,
            'date' => '2026-04-02',
            'hours' => 3.0,
            'note' => 'GP Webpay — testování sandbox environment',
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
            'content' => '<h2>Přehled</h2><p>Monolitická Laravel aplikace s Inertia.js frontend. Modularní struktura — každý bounded context (katalog, košík, platby, uživatelé) v separátním modulu.</p><h2>Klíčové rozhodnutí</h2><ul><li>PostgreSQL JSONB pro produktové atributy (flexibilní schéma)</li><li>Redis pro session a cache košíku</li><li>Event-driven komunikace mezi moduly (Laravel Events)</li></ul><h2>Deployment</h2><p>Docker + Caddy, CI/CD přes GitHub Actions.</p>',
            'author_id' => $u['devBack1']->id,
            'position' => 1,
        ]);

        WikiPage::create([
            'project_id' => $project->id,
            'parent_id' => $wikiArch->id,
            'title' => 'API dokumentace',
            'content' => '<h2>Produkty</h2><ul><li><code>GET /api/products</code> — listing s filtry</li><li><code>GET /api/products/{slug}</code> — detail produktu</li></ul><h2>Košík</h2><ul><li><code>POST /api/cart/items</code> — přidání do košíku</li><li><code>PATCH /api/cart/items/{id}</code> — změna množství</li><li><code>DELETE /api/cart/items/{id}</code> — odebrání</li></ul><h2>Objednávky</h2><ul><li><code>POST /api/orders</code> — vytvoření objednávky</li><li><code>GET /api/orders/{id}</code> — detail objednávky</li></ul>',
            'author_id' => $u['devBack1']->id,
            'position' => 1,
        ]);

        WikiPage::create([
            'project_id' => $project->id,
            'parent_id' => $wikiArch->id,
            'title' => 'Deployment guide',
            'content' => '<h2>Staging</h2><pre><code>git push origin main  # auto-deploy přes GitHub Actions</code></pre><h2>Produkce</h2><ol><li>Vytvořit release tag <code>v*</code></li><li>GitHub Actions spustí build + deploy</li><li>Ověřit smoke testy</li></ol><h2>Rollback</h2><pre><code>docker compose -f docker-compose.prod.yml up -d --force-recreate</code></pre>',
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
            'content' => '<h2>Technické</h2><ul><li>XML sitemap ✓</li><li>Canonical URLs ✓</li><li>Structured data</li><li>Core Web Vitals &lt; 2.5s LCP</li><li>robots.txt audit</li></ul><h2>Obsahové</h2><ul><li>Keyword research ✓</li><li>Product descriptions (0/100)</li><li>Blog plán</li><li>Category landing pages</li></ul><h2>Analytika</h2><ul><li>GA4 enhanced ecommerce</li><li>Conversion tracking</li><li>A/B testing</li></ul>',
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
            'content' => '<h2>Cíl</h2><p>Zvýšit retenci zákazníků o 15 % a průměrnou hodnotu objednávky o 10 %.</p><h2>Mechanika</h2><ul><li>1 Kč = 1 bod</li><li>Registrace = 500 bodů</li><li>Recenze = 100 bodů</li><li>Expirace: 12 měsíců od posledního nákupu</li></ul><h2>Úrovně</h2><ul><li><strong>Bronze</strong> (0+ bodů) — Základní slevy</li><li><strong>Silver</strong> (5 000+ bodů) — 5% sleva + přednostní podpora</li><li><strong>Gold</strong> (20 000+ bodů) — 10% sleva + doprava zdarma</li></ul><h2>Otevřené otázky</h2><ul><li>Napojení na e-shop vs. standalone systém?</li><li>Partnerské programy?</li></ul>',
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

    /**
     * @param  array{job_title?: string, phone?: string, bio?: string, capacity_h_week?: float, status?: UserStatus}  $extra
     */
    private function createUser(string $name, string $email, SystemRole $role, ?string $teamId = null, array $extra = []): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'system_role' => $role,
            'status' => $extra['status'] ?? UserStatus::Active,
            'team_id' => $teamId,
            'job_title' => $extra['job_title'] ?? null,
            'phone' => $extra['phone'] ?? null,
            'bio' => $extra['bio'] ?? null,
            'capacity_h_week' => $extra['capacity_h_week'] ?? null,
        ]);
    }

    // ──────────────────────────────────────────────
    // Project Updates — status health updates
    // ──────────────────────────────────────────────

    private function seedProjectUpdates(array $u): void
    {
        $eshop = Project::where('key', 'ESHOP')->first();
        $seo = Project::where('key', 'SEO')->first();
        $wms = Project::where('key', 'WMS')->first();
        $loyal = Project::where('key', 'LOYAL')->first();

        if ($eshop) {
            ProjectUpdate::create([
                'project_id' => $eshop->id,
                'author_id' => $u['pmTech']->id,
                'health' => 'on_track',
                'body' => 'Checkout flow dokončen a v QA. GP Webpay integrace schválena. Zbývá bankovní převod — blokováno na FIO API credentials.',
                'created_at' => '2026-04-01 09:00:00',
            ]);
            ProjectUpdate::create([
                'project_id' => $eshop->id,
                'author_id' => $u['pmTech']->id,
                'health' => 'on_track',
                'body' => 'Epic Katalog a Košík dokončeny. Sprint 4 zahájen — focus na platby a checkout.',
                'created_at' => '2026-03-25 14:00:00',
            ]);
        }

        if ($seo) {
            ProjectUpdate::create([
                'project_id' => $seo->id,
                'author_id' => $u['pmMkt']->id,
                'health' => 'at_risk',
                'body' => 'Core Web Vitals stále nad limitem — LCP 3.2s, cíl <2.5s. Potřeba optimalizace obrázků a lazy loading.',
                'created_at' => '2026-03-30 11:00:00',
            ]);
        }

        if ($wms) {
            ProjectUpdate::create([
                'project_id' => $wms->id,
                'author_id' => $u['logistik']->id,
                'health' => 'blocked',
                'body' => 'Projekt pozastaven — dodavatel WMS nedodal API v3 dokumentaci. Eskalováno na vedení. Čeká se na obnovení.',
                'created_at' => '2026-03-20 16:00:00',
            ]);
        }

        if ($loyal) {
            ProjectUpdate::create([
                'project_id' => $loyal->id,
                'author_id' => $u['pmMkt']->id,
                'health' => 'on_track',
                'body' => 'Koncept loyalty programu schválen vedením. Specifikace bodového systému a úrovní hotova. Čeká se na technickou analýzu.',
                'created_at' => '2026-03-28 10:00:00',
            ]);
        }
    }

    // ──────────────────────────────────────────────
    // Notifikace — demo notifikace pro uživatele
    // ──────────────────────────────────────────────

    private function seedNotifications(array $u): void
    {
        $eshop = Project::where('key', 'ESHOP')->first();
        if (! $eshop) {
            return;
        }

        $task = Task::where('title', 'GP Webpay integrace')->first();
        $approval = ApprovalRequest::where('status', ApprovalStatus::Pending)->first();

        // Task assigned notification
        if ($task) {
            DatabaseNotification::create([
                'id' => Str::uuid()->toString(),
                'type' => 'App\\Modules\\Notifications\\Notifications\\TaskAssignedNotification',
                'notifiable_type' => User::class,
                'notifiable_id' => $u['devBack1']->id,
                'data' => json_encode([
                    'title' => 'Úkol přiřazen',
                    'body' => 'Byl vám přiřazen úkol: GP Webpay integrace',
                    'task_id' => $task->id,
                    'project_id' => $eshop->id,
                    'assigned_by_name' => $u['pmTech']->name,
                    'type' => 'task_assigned',
                ]),
                'created_at' => '2026-03-30 09:00:00',
            ]);

            // Task status changed
            DatabaseNotification::create([
                'id' => Str::uuid()->toString(),
                'type' => 'App\\Modules\\Notifications\\Notifications\\TaskStatusChangedNotification',
                'notifiable_type' => User::class,
                'notifiable_id' => $u['pmTech']->id,
                'data' => json_encode([
                    'title' => 'Stav úkolu změněn',
                    'body' => 'GP Webpay integrace: In Progress → Code Review',
                    'task_id' => $task->id,
                    'project_id' => $eshop->id,
                    'old_status' => 'in_progress',
                    'new_status' => 'code_review',
                    'type' => 'task_status_changed',
                ]),
                'created_at' => '2026-03-31 11:00:00',
            ]);
        }

        // Approval requested notification
        if ($approval) {
            DatabaseNotification::create([
                'id' => Str::uuid()->toString(),
                'type' => 'App\\Modules\\Notifications\\Notifications\\ApprovalRequestedNotification',
                'notifiable_type' => User::class,
                'notifiable_id' => $u['pmTech']->id,
                'data' => json_encode([
                    'title' => 'Žádost o schválení',
                    'body' => 'Nová žádost o schválení: UX review checkout flow',
                    'approval_request_id' => $approval->id,
                    'requester_name' => $u['devFront']->name,
                    'type' => 'approval_requested',
                ]),
                'created_at' => '2026-03-29 14:00:00',
            ]);
        }

        // Read notification (older)
        DatabaseNotification::create([
            'id' => Str::uuid()->toString(),
            'type' => 'App\\Modules\\Notifications\\Notifications\\TaskAssignedNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $u['admin']->id,
            'data' => json_encode([
                'title' => 'Úkol přiřazen',
                'body' => 'Byli jste přidáni jako člen projektu Replatform E-shop.',
                'type' => 'task_assigned',
            ]),
            'read_at' => '2026-03-25 10:00:00',
            'created_at' => '2026-03-25 08:00:00',
        ]);

        // Notification for admin (unread)
        DatabaseNotification::create([
            'id' => Str::uuid()->toString(),
            'type' => 'App\\Modules\\Notifications\\Notifications\\ApprovalVoteCastNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $u['admin']->id,
            'data' => json_encode([
                'title' => 'Hlasování o schválení',
                'body' => 'Code review GP Webpay integrace bylo schváleno.',
                'approval_request_id' => $approval?->id,
                'voter_name' => $u['pmTech']->name,
                'decision' => 'approved',
                'type' => 'approval_vote_cast',
            ]),
            'created_at' => '2026-03-31 14:30:00',
        ]);
    }

    // ──────────────────────────────────────────────
    // Task dependencies — blokovací závislosti
    // ──────────────────────────────────────────────

    private function seedTaskDependencies(): void
    {
        $gpWebpay = Task::where('title', 'GP Webpay integrace')->first();
        $bankTransfer = Task::where('title', 'Bankovní převod — generování VS, párování')->first();
        $applePay = Task::where('title', 'Apple Pay / Google Pay')->first();
        $checkoutWizard = Task::where('title', 'Checkout wizard — multi-step formulář')->first();

        if ($gpWebpay && $applePay) {
            // Apple Pay závisí na GP Webpay (sdílí payment gateway)
            $applePay->blockers()->syncWithoutDetaching([$gpWebpay->id]);
        }

        if ($checkoutWizard && $gpWebpay && $bankTransfer) {
            // Checkout wizard závisí na obou platebních metodách
            $checkoutWizard->blockers()->syncWithoutDetaching([$gpWebpay->id, $bankTransfer->id]);
        }
    }

    // ──────────────────────────────────────────────
    // Audit log — testovací záznamy rozptýlené přes 14 dní
    // ──────────────────────────────────────────────

    private function seedAuditEntries(array $u): void
    {
        $projectId = Project::where('key', 'ESHOP')->value('id') ?? Str::uuid7()->toString();
        $taskId = Task::value('id') ?? Str::uuid7()->toString();

        $entries = [
            // Auth events
            ['action' => AuditAction::LoggedIn, 'entity_type' => User::class, 'entity_id' => $u['admin']->id, 'actor_id' => $u['admin']->id, 'days_ago' => 0, 'ip' => '10.0.1.5'],
            ['action' => AuditAction::LoggedIn, 'entity_type' => User::class, 'entity_id' => $u['pmTech']->id, 'actor_id' => $u['pmTech']->id, 'days_ago' => 0, 'ip' => '10.0.1.12'],
            ['action' => AuditAction::LoggedIn, 'entity_type' => User::class, 'entity_id' => $u['exec']->id, 'actor_id' => $u['exec']->id, 'days_ago' => 1, 'ip' => '10.0.1.3'],
            ['action' => AuditAction::LoggedOut, 'entity_type' => User::class, 'entity_id' => $u['exec']->id, 'actor_id' => $u['exec']->id, 'days_ago' => 1, 'ip' => '10.0.1.3'],
            ['action' => AuditAction::InviteSent, 'entity_type' => User::class, 'entity_id' => $u['devBack1']->id, 'actor_id' => $u['admin']->id, 'days_ago' => 13, 'ip' => '10.0.1.5'],
            ['action' => AuditAction::InviteAccepted, 'entity_type' => User::class, 'entity_id' => $u['devBack1']->id, 'actor_id' => $u['devBack1']->id, 'days_ago' => 12, 'ip' => '10.0.1.20'],

            // Entity lifecycle
            ['action' => AuditAction::Created, 'entity_type' => Project::class, 'entity_id' => $projectId, 'actor_id' => $u['pmTech']->id, 'days_ago' => 13, 'ip' => '10.0.1.12', 'new_values' => ['name' => 'Replatform E-shop', 'status' => 'draft']],
            ['action' => AuditAction::Updated, 'entity_type' => Project::class, 'entity_id' => $projectId, 'actor_id' => $u['pmTech']->id, 'days_ago' => 10, 'ip' => '10.0.1.12', 'old_values' => ['status' => 'draft'], 'new_values' => ['status' => 'active']],
            ['action' => AuditAction::Created, 'entity_type' => Task::class, 'entity_id' => $taskId, 'actor_id' => $u['devBack1']->id, 'days_ago' => 11, 'ip' => '10.0.1.20'],
            ['action' => AuditAction::Updated, 'entity_type' => Task::class, 'entity_id' => $taskId, 'actor_id' => $u['devBack2']->id, 'days_ago' => 9, 'ip' => '10.0.1.21', 'old_values' => ['priority' => 'medium'], 'new_values' => ['priority' => 'high']],
            ['action' => AuditAction::Viewed, 'entity_type' => Task::class, 'entity_id' => $taskId, 'actor_id' => $u['marketer']->id, 'days_ago' => 8, 'ip' => '10.0.1.30'],

            // Status changes
            ['action' => AuditAction::StatusChanged, 'entity_type' => Task::class, 'entity_id' => $taskId, 'actor_id' => $u['devBack1']->id, 'days_ago' => 7, 'ip' => '10.0.1.20', 'old_values' => ['status' => 'backlog'], 'new_values' => ['status' => 'in_progress']],
            ['action' => AuditAction::StatusChanged, 'entity_type' => Task::class, 'entity_id' => $taskId, 'actor_id' => $u['devBack1']->id, 'days_ago' => 5, 'ip' => '10.0.1.20', 'old_values' => ['status' => 'in_progress'], 'new_values' => ['status' => 'code_review']],
            ['action' => AuditAction::RoleChanged, 'entity_type' => User::class, 'entity_id' => $u['devFront']->id, 'actor_id' => $u['admin']->id, 'days_ago' => 6, 'ip' => '10.0.1.5', 'old_values' => ['role' => 'team_member'], 'new_values' => ['role' => 'project_manager']],
            ['action' => AuditAction::RoleChanged, 'entity_type' => User::class, 'entity_id' => $u['devFront']->id, 'actor_id' => $u['admin']->id, 'days_ago' => 6, 'ip' => '10.0.1.5', 'old_values' => ['role' => 'project_manager'], 'new_values' => ['role' => 'team_member']],

            // Approval events
            ['action' => AuditAction::ApprovalRequested, 'entity_type' => Task::class, 'entity_id' => $taskId, 'actor_id' => $u['pmTech']->id, 'days_ago' => 4, 'ip' => '10.0.1.12'],
            ['action' => AuditAction::ApprovalApproved, 'entity_type' => Task::class, 'entity_id' => $taskId, 'actor_id' => $u['exec']->id, 'days_ago' => 3, 'ip' => '10.0.1.3'],

            // PHI events
            ['action' => AuditAction::PhiAccessed, 'entity_type' => Task::class, 'entity_id' => $taskId, 'actor_id' => $u['admin']->id, 'days_ago' => 2, 'ip' => '10.0.1.5'],
            ['action' => AuditAction::PhiClassificationChanged, 'entity_type' => Project::class, 'entity_id' => $projectId, 'actor_id' => $u['admin']->id, 'days_ago' => 11, 'ip' => '10.0.1.5', 'old_values' => ['classification' => 'unknown'], 'new_values' => ['classification' => 'non_phi']],

            // File events
            ['action' => AuditAction::Downloaded, 'entity_type' => Task::class, 'entity_id' => $taskId, 'actor_id' => $u['devBack2']->id, 'days_ago' => 3, 'ip' => '10.0.1.21'],
            ['action' => AuditAction::Exported, 'entity_type' => Project::class, 'entity_id' => $projectId, 'actor_id' => $u['pmTech']->id, 'days_ago' => 1, 'ip' => '10.0.1.12'],

            // More logins spread over time
            ['action' => AuditAction::LoggedIn, 'entity_type' => User::class, 'entity_id' => $u['admin']->id, 'actor_id' => $u['admin']->id, 'days_ago' => 4, 'ip' => '10.0.1.5'],
            ['action' => AuditAction::LoggedIn, 'entity_type' => User::class, 'entity_id' => $u['admin']->id, 'actor_id' => $u['admin']->id, 'days_ago' => 7, 'ip' => '10.0.1.5'],
            ['action' => AuditAction::LoggedIn, 'entity_type' => User::class, 'entity_id' => $u['devBack1']->id, 'actor_id' => $u['devBack1']->id, 'days_ago' => 3, 'ip' => '10.0.1.20'],
            ['action' => AuditAction::LoggedIn, 'entity_type' => User::class, 'entity_id' => $u['pmMkt']->id, 'actor_id' => $u['pmMkt']->id, 'days_ago' => 9, 'ip' => '10.0.1.15'],

            // Deactivation event
            ['action' => AuditAction::Deactivated, 'entity_type' => User::class, 'entity_id' => $u['reader']->id, 'actor_id' => $u['admin']->id, 'days_ago' => 2, 'ip' => '10.0.1.5'],
        ];

        foreach ($entries as $entry) {
            AuditEntry::forceCreate([
                'id' => Str::uuid7()->toString(),
                'action' => $entry['action'],
                'entity_type' => $entry['entity_type'],
                'entity_id' => $entry['entity_id'],
                'actor_id' => $entry['actor_id'],
                'payload' => $entry['payload'] ?? null,
                'old_values' => $entry['old_values'] ?? null,
                'new_values' => $entry['new_values'] ?? null,
                'ip_address' => $entry['ip'] ?? null,
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'created_at' => now()->subDays($entry['days_ago'])->subHours(random_int(0, 12))->subMinutes(random_int(0, 59)),
            ]);
        }
    }
}
