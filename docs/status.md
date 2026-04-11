# PHC Nexus — Status implementace

Živý dokument mapující co je **reálně implementováno** vs. plánováno. Aktualizuje se po každém milestone a významné změně.

> Poslední aktualizace: 2026-04-11

---

## Přehled milestones

| # | Milestone | Status | Poznámka |
|---|-----------|--------|----------|
| 0 | Foundation | **DONE** | Docker stack, Laravel + Inertia + React, CI |
| 1 | Identity & Access | **DONE** | Google SSO, invite flow, org model, role matrix, PHI klasifikace |
| 2 | Projects Core | **DONE** | Audit envelope, file contract, comment model, projekty CRUD |
| 3 | Work Core | **DONE** | Epiky, úkoly, kanban board, tabulka, stavové přechody |
| 4 | Approvals & Notifications | **DONE** | Approval flow, in-app + email notifikace |
| 5 | Hardening & Release | **DONE** | Seed data, runbooky, E2E testy (Playwright) |
| MVP2 | Production Polish | **DONE** | 5 iterací — broken flows, globální pohledy, admin, UX polish, advanced features |
| MVP3-I1 | Project Dashboard + Empty States | **DONE** | Project metriky (tasks/epics/members count), rozšířená EmptyState komponenta (ikony, CTA) |
| MVP3-I2a | Loading + Validation | **DONE** | Skeleton/Spinner komponenty, loading stavy na formulářích, frontend validace, CSS tokeny |
| MVP3-I2b | Notification Bell | **DONE** | Funkční zvoneček s polling 60s, Inertia shared prop, reálný unread count |
| MVP3-I3a | Docker Vite HMR | **DONE** | Separátní vite kontejner, Caddy WebSocket proxy, dokumentace |
| MVP3-I3b | PgSQL Tests + Tokens | **DONE** | PostgreSQL test connection (opt-in), design-tokens.md v1.0 |
| MVP4-I1 | Production Caddy + Security | **DONE** | Caddyfile.prod, security headers, Redis hesla, vite vyřazení z prod |
| MVP4-I2 | CD Pipeline | **DONE** | GitHub Actions deploy.yml (SSH), health check, deploy.md CD sekce |
| MVP4-I3 | FORPSI Setup Guide | **DONE** | forpsi-setup.md, .env.production.example, finální dokumentace |
| MVP4 | Production Deploy | **DONE** | FORPSI Standard VPS, Docker prod fixes, Google SSO, live na https://phc-nexus.eu |
| — | Staging Environment | **DONE** | Staging na dev.phc-nexus.eu, sdílený Caddy, DB sync s anonymizací, deploy workflow (staging auto + prod approve) |
| — | Workflow & Wiki Sprint | **DONE** | Workflow engine, dynamický StatusBadge, wiki → dokumentace, epic dokumentace, error modal, RichTextEditor fix |
| — | E-commerce Demo Seed | **DONE** | Nový DemoSeeder s e-commerce daty, 4 vlastní workflow, staging auto-seed |
| — | UI Polish Sprint | **DONE** | 9 kol UI polishingu — reusable komponenty, profil, avatar, tooltips, icon buttony, klávesové zkratky, projektové typy |
| — | Story Points & Estimation | **DONE** | Story points na úkolech, Planning Poker modul (multi-round hlasování) |
| — | Workflow Templates & Reports | **DONE** | Globální workflow šablony, záložka Reporty, workflow editor sidebar |
| — | Planning UX | **DONE** | Start date úkolů, drag&drop validace, editace worklogu, epic linking, backlog UX |

---

## MVP2 — Production Polish (DONE)

> 11 PR (#28–#38), 2026-03-27

### Iterace 1 — Fix broken + CRUD (#28)
- Fix dashboard approval Review linky (správný URL s project_id)
- Full task edit dialog (title, description, status, priority, assignee, reporter, due date)
- Epic edit dialog (title, description, status, owner)
- Delete tlačítka na project, task, epic s potvrzením
- Create approval UI dialog na task detail
- TaskAssigned + TaskStatusChanged notifikace se triggerují

### Iterace 2 — Globální pohledy + sidebar (#29)
- My Tasks stránka (`/my-tasks`) s filtrováním
- Global Approvals stránka (`/approvals`)
- Comments + attachments na Projects a Epics (routes, controllery, sdílené komponenty)
- Sidebar: opraveny linky My Tasks, Approvals
- Notification deep links (klik → task/approval)

### Iterace 3 — Admin & Organization (#30)
- User management (`/admin/users`) — seznam, search, role/status filtry
- Invite user dialog (email, role)
- Organization structure view (`/admin/organization`) — divisions → teams → users
- Audit log viewer (`/admin/audit-log`) — filtrování podle akce/entity/uživatele
- PHI access report (`/admin/phi-report`) — filtrování podle uživatele a datumu
- Sidebar: admin sekce s 4 linky

### Iterace 4 — UX Polish (#31)
- Toast notifikace (flash.success/error)
- Inline editace v task sidebaru (assignee, priority, due date)
- Pagination na MyTasks, Notifications, Audit Log
- Bulk status change na task table (multi-select + hromadná změna)
- Globální navigation progress bar
- Responsive layout (mobilní sidebar toggle, responsive padding)

### Iterace 5 — Advanced Features (#32–#38)
- Activity timeline na task detail (audit log vizualizace)
- CSV/Excel/HTML/Markdown export pro projekty a úkoly
- Calendar view (`/calendar`) — měsíční pohled úkolů podle due date
- Approval analytics (`/admin/approval-analytics`) — statistiky, historie, avg resolution time
- Task dependencies (blocker/blocked by) — pivot tabulka, sidebar UI
- Recurring tasks — recurrence rule, scheduler command, inline nastavení

---

## MVP3 — Iterace 1: Project Dashboard + Empty States (DONE)

> 2026-03-28

### Project Dashboard Metriky
- Backend: `ProjectController::show` vrací `tasks_count`, `tasks_completed_count`, `tasks_overdue_count`, `epics_count`, `members_count`
- Frontend: `ProjectMetrics` strip na project detail — 4 stat tiles (tasks s progress barem, overdue, epics, members)
- Feature testy: 2 testy ověřující metriky v Inertia props

### Empty States
- `EmptyState` komponenta rozšířena o optional props: `icon` (LucideIcon), `action` (href/onClick CTA), `compact`
- Zpětně kompatibilní — 14 existujících usage beze změny
- Ikony na 5 stránkách: Dashboard pending approvals, Notifications, Tasks, Epics
- 6 Vitest unit testů

---

## MVP3 — Iterace 2a: Loading + Validation (DONE)

> 2026-03-28

### Skeleton & Spinner komponenty
- `Skeleton.tsx` — animate-pulse, varianty text/circular/rectangular, CSS token `--skeleton-bg`
- `Spinner.tsx` — SVG spinner, 3 velikosti (sm/md/lg)

### Loading stavy na formulářích
- Spinner v submit buttonech: Projects Create, Projects Edit, CommentsSection
- Pattern: `{processing && <Spinner size="sm" />}` v buttonu

### Frontend validace
- `utils/validate.ts` — lightweight utility (required, maxLength, pattern)
- Aplikováno na Project Create form (name + key validace na blur i submit)
- Server-side zůstává autoritativní fallback
- 12 Vitest unit testů

### CSS tokeny
- Form field states: `--input-border-error`, `--input-bg-disabled`, `--input-fg-disabled`, `--input-border-disabled`
- Skeleton: `--skeleton-bg`, `--skeleton-radius`
- Transitions: `--transition-fast/normal/slow`

---

## MVP3 — Iterace 2b: Notification Bell (DONE)

> 2026-03-28

### Funkční notifikační zvoneček
- `useNotificationCount` hook — polling 60s na `GET /notifications/unread-count`
- Inertia shared prop `notificationCount` v `HandleInertiaRequests` — initial count bez flashe "0"
- AppLayout: reálný unread count, badge skrytý při 0, `99+` cap, onClick navigace na `/notifications`
- `aria-label` pro accessibility
- 5 Vitest testů (initial count, polling, error handling, cleanup)

---

## Milestone 0 — Foundation (DONE)

### Infrastruktura

| Položka | Status | Detail |
|---------|--------|--------|
| Dockerfile | Done | Multi-stage: composer → node → PHP 8.4-FPM Alpine, entrypoint sync public assets |
| docker-compose.yml (dev) | Done | 8 služeb: app, worker, scheduler, caddy, postgres, redis-cache, redis-data, mailpit |
| docker-compose.dev.yml | Done | Dev override: bind mounts, dev PHP config |
| docker-compose.prod.yml | Done | Prod override: named volumes (app-public, app-storage), restart policies, Redis hesla |
| Caddyfile | Done | Dev: reverse proxy, self-signed TLS, Vite HMR proxy |
| Caddyfile.prod | Done | Prod: doména phc-nexus.eu, auto-TLS (Let's Encrypt), HSTS, security headers |
| PHP config (dev/prod) | Done | OPcache, JIT, timezone Europe/Prague |
| .dockerignore | Done | Optimalizovaný pro build context |
| GitHub Actions CI | Done | PHP 8.4, Node 22, PostgreSQL 17, Redis — lint + test + build |

### Backend

| Položka | Status | Detail |
|---------|--------|--------|
| Laravel 13 skeleton | Done | PHP 8.4 requirement |
| PostgreSQL jako default DB | Done | config/database.php, .env.example |
| Redis dual instance | Done | `cache` (allkeys-lru) + `data` (noeviction) connections |
| UUIDv7 trait | Done | `app/Models/Concerns/HasUuidV7.php`, User model používá |
| Migrace (UUID PK) | Done | Users, sessions, cache, jobs — uuid místo auto-increment |
| Inertia.js v2 (server) | Done | Middleware registrován, Blade template `app.blade.php` |
| Modulová struktura | Done | 8 prázdných modulů v `app/Modules/` s adresářovou strukturou |

### Frontend

| Položka | Status | Detail |
|---------|--------|--------|
| React 19 + TypeScript | Done | strict mode, `tsconfig.json` |
| Inertia.js v2 (client) | Done | `app.tsx` entry point, page resolver |
| Tailwind CSS 4 | Done | Design tokeny z design-system.md integrované |
| Vite 6+ | Done | `vite.config.ts` s React + Tailwind pluginy |
| App shell layout | Done | `AppLayout.tsx` — sidebar + topbar + main content |
| Dashboard smoke page | Done | `Pages/Dashboard/Index.tsx` — placeholder |
| TypeScript typy | Done | `types/index.ts`, `inertia.d.ts`, `vite-env.d.ts` |
| Path aliases | Done | `@/*` → `resources/js/*` |

### Kvalita

| Položka | Status | Detail |
|---------|--------|--------|
| PHPUnit testy | Done | 2/2 pass (unit + feature) |
| TypeScript check | Done | `tsc --noEmit` bez chyb |
| Vite build | Done | Production build úspěšný |
| Laravel Pint | Configured | V CI pipeline |

### Co NENÍ v M0 (záměrně)

- Horizon (worker padá — Horizon se nainstaluje v M1+)
- Telescope (dev observability — přijde s prvním reálným debuggingem)
- Sentry (error tracking — přijde s produkčním deployem)
- PHPStan (přijde s prvním business kódem)
- ESLint + Prettier (přijde s prvními React komponentami)
- shadcn/ui init (přijde v M1 s prvními formuláři)

---

## Modulový stav

| Modul | Status | Implementováno |
|-------|--------|---------------|
| Auth | **Aktivní** | Google SSO, login/logout, invite flow (72h expirace), HandleInertiaRequests middleware |
| Organization | **Aktivní** | Division, Team, Tribe modely, SystemRole + UserStatus enumy, User management stránka, invite UI, org structure view |
| Projects | **Aktivní** | Project CRUD, membership, projektové typy, comments, attachments, CSV/Excel/HTML/MD export, workflow engine (custom stavy/přechody, vizuální editor, sidebar), workflow templates (globální šablony), reporty, ProjectPolicy |
| Work | **Aktivní** | Epic CRUD + edit dialog, Task CRUD + full edit dialog, kanban board (drag&drop validace, per-user card settings, filtry), tabulkový view (bulk status change), dynamický StatusBadge, task dependencies, recurring tasks, calendar view, activity timeline, inline editace, time logging (CRUD + export), story points, start date, benefit type, epic linking |
| Approvals | **Aktivní** | Approval request/vote flow, create approval UI, global approvals stránka, approval analytics (statistiky, avg resolution), cancel, expirace, approval blocking (blokuje status change) |
| Notifications | **Aktivní** | 4 notification třídy, DB + email kanály, deep links, toast zprávy, TaskAssigned/TaskStatusChanged triggery |
| Audit | **Aktivní** | AuditEntry (append-only), AuditService, Auditable trait, PHI klasifikace/guard, audit log viewer, PHI access report |
| Comments | **Aktivní** | Polymorfní threaded komentáře na tasks, projects, epics, wiki stránky, sdílená CommentsSection komponenta |
| Files | **Aktivní** | Polymorfní přílohy na tasks, projects, epics, wiki stránky, sdílená AttachmentsSection komponenta, PHI download guard |
| Estimation | **Aktivní** | Planning Poker sessions, multi-round hlasování (vote/reveal/confirm/revote), vazba na story points úkolů |
| Wiki | **Aktivní** | Projektová dokumentace (stromová struktura), epic dokumentace (vlastní stránky), komentáře + přílohy na stránkách, rich text editor (TipTap) |

---

## Kontejnerový stav (dev)

| Kontejner | Image | Port | Status |
|-----------|-------|------|--------|
| app | phc-nexus-app (PHP 8.4-FPM) | 9000 (internal) | Running |
| vite | node:22-alpine | 5173 | Running (HMR) |
| caddy | caddy:2-alpine | 80, 443 | Running |
| scheduler | phc-nexus-scheduler | — | Running |
| worker | phc-nexus-worker | — | Running (Horizon) |
| postgres | postgres:17-alpine | 5432 | Healthy |
| redis-cache | redis:7-alpine | 6379 | Healthy |
| redis-data | redis:7-alpine | 6380 | Healthy |
| mailpit | axllent/mailpit | 1025, 8025 | Healthy |

---

## Workflow & Wiki Sprint (DONE)

> 2026-03-31 – 2026-04-01, PR #71–#88

### Workflow Engine
- `workflow_statuses` + `workflow_transitions` tabulky s CRUD
- Vizuální workflow editor (React Flow / @xyflow/react) s persistovanými pozicemi uzlů
- `updateStatus()` validuje přechody přes workflow transitions
- Dynamický StatusBadge (label + color z workflow) s fallbackem na enum — na Dashboard, MyTasks, Board kartách, GlobalSearch, Epic Show, Task Show
- Per-user board card settings (`board_settings` JSON na users tabulce)
- Kanban sloupce řízené workflow statusy (board_columns tabulka dropnuta)

### Dokumentace (Wiki)
- `wiki_pages` tabulka se stromovou strukturou (parent_id self-reference)
- Projektová dokumentace: CRUD stránek, podstránek, sidebar navigace
- Epic dokumentace: vlastní stránky pod epikem (`epic_id` FK), záložka na Epic Show
- Komentáře + přílohy na wiki stránkách (WikiCommentController, WikiAttachmentController)
- Rich text editor (TipTap) — fix selekce textu při formátování (preventDefault na toolbar mousedown)
- Přejmenování Wiki → Dokumentace v celém UI

### Ostatní vylepšení
- Benefit type (Revenue/Costsave/Legal/Platform/Strategy) na projektech + úkolech
- Epic: priority, PM, Lead Developer role
- Time logging: time_entries tabulka, záložka Čas na task/epic/projekt
- Approval blocking: pending approval blokuje status change
- Globální ErrorModal pro HTTP chyby (404/422/500) — Inertia `router.on('invalid')`
- Tiptap rich text editor pro description + komentáře

---

## UI Polish Sprint (DONE)

> 2026-04-02 – 2026-04-04, PR #106–#119

### Reusable komponenty a architektura
- MetadataGrid, FilterBar, TabBar, PersonChip, StatusBadge — sdílené komponenty napříč celou aplikací
- Sjednocení filtrů a řazení (useSortable hook)
- Modaly vyextrahované do sdílených komponent

### Profil a avatar
- Editovatelný uživatelský profil (bio, titul, telefon)
- Upload avataru, avatar v headeru aplikace
- Profilové stránky s avatarem

### UX vylepšení
- Editace komentářů inline
- Icon-only action buttony s tooltips
- Shift+Enter pro odeslání komentářů, Cmd+Enter pro formuláře
- Inline description editace
- Projektové typy (typ projektu na Create/Edit)
- Správa členů projektu s role managementem
- DateRangePicker sjednocení
- Export času (TimeExportController + TimeEntryExporter)
- Organizace redesign (admin stránky)
- Lucide ikony v notifikacích
- Kalendář fix, závislosti v main content

### Seed a previews
- Testerské účty s executive rolí v DemoSeederu
- HTML previews přesunuty do docs/previews/

---

## Story Points & Estimation (DONE)

> 2026-04-07, PR #121–#122

### Story points
- `story_points` sloupec na tasks tabulce
- Odhady hodin na úkolech
- Zobrazení na kartách kanbanu a v tabulce

### Planning Poker (nový modul: Estimation)
- `EstimationSession`, `EstimationRound`, `EstimationVote` modely
- EstimationController s CRUD sessions + round operacemi
- Multi-round hlasování: vote → reveal → confirm/revote
- Session completion s finálním story points
- React stránky: Estimation/Index.tsx, Estimation/Show.tsx
- Routes: `/projects/{project}/estimation/`

---

## Workflow Templates & Reports (DONE)

> 2026-04-07, PR #120, #123–#124

### Workflow templates
- `WorkflowTemplate`, `WorkflowTemplateStatus`, `WorkflowTemplateTransition` modely
- Globální šablony nezávislé na projektu
- CRUD šablon + aplikace na projekt (applyToProject)
- React stránky: WorkflowTemplates.tsx, WorkflowTemplateEdit.tsx

### Workflow editor UX
- Vždy viditelný sidebar s placeholder stavem (místo skrytého panelu)

### Project Reports
- ReportController s přehledem projektu
- React stránka: Projects/Reports.tsx
- Záložka Reporty na project detail

---

## Planning UX (DONE)

> 2026-04-07 – 2026-04-08, PR #125–#128

### Vylepšení plánování
- `start_date` sloupec na tasks tabulce
- Drag&drop validace na kanbanu (reset při neplatném přesunu)
- Přejmenování backlogu v UI
- Quick-add proporce a backlog inline-add

### Worklog a vazby
- Editace worklogu (time entries CRUD)
- Epic linking v úkolu (přiřazení úkolu k epiku)
- Quick-add z projektu (rychlé vytvoření úkolu)

### Opravy
- Stale state fix v time log, boardu a backlogu
- Estimation 500 error fix
- Staging deploy zachová existující data (místo migrate:fresh)

---

## Známé limitace a technický dluh

_Všechny původní limitace (worker, Vite HMR, testy, seed data, design tokeny, public assets) byly vyřešeny._

Aktuální stav:
1. **Module READMEs neexistují** — `app/Modules/*/README.md` zatím nevytvořeny (CLAUDE.md je vyžaduje)
2. **Events/Listeners prázdné** — adresáře existují, ale event-driven architektura zatím nevyužita (notifikace dispatchují přímo)
3. **Filament nepoužíván** — admin sekce je custom React/Inertia, Filament nikdy nebyl integrován

---

## Historie změn

| Datum | Milestone | Co se stalo |
|-------|-----------|-------------|
| 2026-03-25 | M0 | Foundation bootstrap: Laravel 13 + Inertia + React + Docker stack, CI pipeline, modulová struktura |
| 2026-03-25 | M1 | Horizon setup: queue worker běží, dashboard na /horizon, dual Redis konfigurace |
| 2026-03-25 | M1 | Google SSO: login/logout flow, Auth modul (controller, action, routes), login stránka, 8 testů |
| 2026-03-25 | M1 | Org model: Division, Team, Tribe modely, SystemRole/UserStatus enumy, User rozšíření, 12 testů |
| 2026-03-25 | M1 | Role matrix: DivisionPolicy, TeamPolicy, UserPolicy, EnsureUserIsActive middleware, 17 testů |
| 2026-03-25 | M1 | Invite flow: Invitation model, InviteUser action, email (Mailable), accept → Google SSO, expirace 72h, 10 testů |
| 2026-03-25 | M1 | PHI klasifikace: PhiClassification enum, HasPhiClassification trait, PhiAccessGuard, scopes (nonPhi/exportable), 15 testů |
| 2026-03-25 | M2 | Audit envelope: AuditEntry model (append-only), AuditService, Auditable trait (auto create/update/delete), AuditAction enum, 10 testů |
| 2026-03-25 | M2 | File contract: Attachment model (polymorfní), Upload/Download actions, HasAttachments trait, PHI download guard + audit, 8 testů |
| 2026-03-25 | M2 | Comment model: Comment (polymorfní, threaded, soft deletes), AddComment/EditComment actions, HasComments trait, audited, 8 testů |
| 2026-03-25 | M2 | Projects CRUD: Project model (PHI+audit+comments+attachments), controller, policy, membership, 4 Inertia pages, factory, 13 testů |
| 2026-03-25 | M3 | Epic model: CRUD v rámci projektu, EpicStatus enum, EpicPolicy, factory, quick-add, 2 Inertia pages, Task stub, 9 testů |
| 2026-03-25 | M3 | Task model: CRUD (v epiku i standalone), TaskStatus (6 stavů) + TaskPriority (4 úrovně) enumy, TaskPolicy, TaskFactory, TaskController, 2 Inertia pages, quick-add, assignee/reporter, 11 testů |
| 2026-03-25 | M3 | Kanban board + tabulka + stavové přechody: drag&drop board (5 sloupců), tabulkový view (filtry status/priorita, řazení), PATCH status endpoint s validací přechodů, hardcoded transitions na TaskStatus i EpicStatus, 21 testů (11 unit + 10 feature) |
| 2026-03-25 | M4 | Approval flow: ApprovalRequest + ApprovalVote (polymorfní), RequestApproval + CastVote actions, režim all approve / any reject blocks, ApprovalPolicy (view/create/vote/cancel), controller + routes, reminder job, HasApprovals trait, factory, 2 Inertia pages, 12 feature testů |
| 2026-03-25 | M4 | Notifikace: 4 notification třídy (ApprovalRequested, VoteCast, TaskAssigned, TaskStatusChanged), DB + email kanály, NotificationController (index/markAsRead/markAllAsRead/unreadCount), dispatch z approval flow, Inertia page, 9 feature testů |
| 2026-03-25 | M5 | Seed data: DemoSeeder s realistickou strukturou — 2 divize, 4 týmy, tribe, 8 uživatelů (exec/PM/dev/QA/infra/support/reader), 3 projekty (aktivní/draft/PHI), 5 epiků, 15 úkolů, approval request, komentáře |
| 2026-03-25 | M5 | Runbooky: deploy (VPS setup, build, update, rollback), backup/restore (PostgreSQL, Redis, file storage, disaster recovery, retence), monitoring (kontejnery, Horizon, DB, Redis, disk, logy, eskalace) |
| 2026-03-25 | M5 | E2E testy: Playwright setup (Chromium), 15 scénářů — smoke (health, login, redirect, 404), auth (redirect, login page), authenticated (dashboard, projekty, kanban board, tabulka, approvals, notifikace, logout), E2E login bypass route |
| 2026-03-27 | MVP2 | Iterace 1–5: fix broken flows, CRUD dokončení, globální pohledy (My Tasks, Approvals, Calendar), admin sekce (users, org, audit log, PHI report, approval analytics), UX polish (toast, inline edit, pagination, bulk ops, responsive), advanced features (activity timeline, export 4 formáty, dependencies, recurring tasks) — 11 PR (#28–#38) |
| 2026-03-28 | MVP3-I1 | Project dashboard metriky (tasks count, completed, overdue, epics, members) na project detail, rozšířená EmptyState komponenta (icon, action CTA, compact), ikony na 5 stránkách (Dashboard, Notifications, Tasks, Epics), 6 Vitest testů + 2 PHP feature testy |
| 2026-03-28 | MVP3-I2a | Skeleton + Spinner komponenty, loading stavy na formulářích (Create/Edit/Comments), frontend validace (validate.ts + Project Create), CSS tokeny (form states, skeleton, transitions), 12 Vitest testů |
| 2026-03-28 | MVP3-I2b | Funkční notifikační zvoneček — useNotificationCount hook (polling 60s), Inertia shared prop, reálný unread count v AppLayout, badge skrytý při 0, 5 Vitest testů |
| 2026-03-28 | MVP3-I3a | Docker Vite HMR — separátní `vite` kontejner (node:22-alpine), Caddy proxy na vite:5173 s WebSocket, .env.example + dev-workflow.md dokumentace |
| 2026-03-28 | MVP3-I3b | PostgreSQL test connection (phpunit.pgsql.xml, init-test-db.sql, composer test:pgsql), design-tokens.md aktualizován na v1.0 (form states, skeleton, transition tokeny) |
| 2026-03-28 | MVP4-I1 | Production Caddyfile.prod (php_fastcgi, HSTS, security headers, domain env var), vite vyřazení z prod compose, Redis hesla v produkci, deploy.md oprava |
| 2026-03-28 | MVP4-I2 | GitHub Actions CD pipeline (SSH deploy, health check, concurrency lock), deploy.md sekce o CD + GitHub Secrets |
| 2026-03-28 | MVP4-I3 | FORPSI setup guide (12 kroků od objednávky po zálohy), .env.production.example, finální MVP4 dokumentace |
| 2026-03-28 | MVP4 | Production deploy na FORPSI Standard VPS — Docker prod fixes (volumes, package discovery, public assets sharing), Google SSO live, aplikace běží na http://194-182-78-7.nip.io |
| 2026-03-29 | MVP4 | Změna produkční domény na phc-nexus.eu, DNS nastaveno na FORPSI, aktualizace Caddyfile.prod, .env šablon a runbooků |
| 2026-03-29 | MVP4 | Docker production fix: sdílený `app-public` named volume (app↔Caddy), entrypoint sync skript, PHP-FPM root master (privilege drop přes pool config), sjednocení češtiny v UI, fallback classifications prop |
| 2026-03-29 | Staging | Staging prostředí na stejném VPS (dev.phc-nexus.eu) — docker-compose.staging.yml, sdílený Caddy (Caddyfile.shared), lehčí FPM pool (5 children), jeden Redis, DB sync skript s PHI anonymizací, deploy workflow přepracován na 3 joby (build → staging auto → prod approve) |
| 2026-03-31 | Workflow | Workflow engine: workflow_statuses + workflow_transitions tabulky, vizuální editor (React Flow), pozice uzlů, updateStatus() validace přechodů, board_columns dropnuta — 16 PR (#71–#86) |
| 2026-04-01 | Workflow | Dynamický StatusBadge na všech stránkách (Dashboard, MyTasks, Board karty, GlobalSearch, Epic Show) s fallbackem na enum — PR #87 |
| 2026-04-01 | Wiki | Wiki → Dokumentace přejmenování, wiki komentáře + přílohy fix (404), epic dokumentace (epic_id FK, CRUD, EpicIndex/EpicShow stránky, záložka na Epic Show), RichTextEditor fix selekce, globální ErrorModal (404/500) — PR #88 |
| 2026-04-01 | Seed | E-commerce DemoSeeder: 4 projekty (ESHOP/SEO/LOYAL/WMS), 4 vlastní workflow (dev/marketing/simple/logistics), 53 tasků, 13 epiků, 11 uživatelů, wiki hierarchie, time entries, approvals, dependencies, recurrence. Production guard. Staging deploy změněn na migrate:fresh --seed — PR #97–#99 |
| 2026-04-02 | UI Polish | 9 kol UI polishingu (PR #106–#117): reusable komponenty (MetadataGrid, FilterBar, TabBar, PersonChip, StatusBadge), editovatelný profil s avatarem, avatar v headeru, editace komentářů, sjednocení filtrů, tooltips, icon buttony, Shift+Enter komentáře, Cmd+Enter formuláře, kalendář fix, inline description, projektové typy, správa členů projektu, DateRangePicker, export času, organizace redesign, lucide ikony v notifikacích |
| 2026-04-03 | Seed | Testerské účty s executive rolí v DemoSeederu — PR #118 |
| 2026-04-04 | Previews | HTML previews přesunuty do docs/previews/, bugfix kanban nastavení — PR #119 |
| 2026-04-04 | Workflow | Workflow editor sidebar vždy viditelný s placeholder stavem — PR #120 |
| 2026-04-07 | Work | Story points a odhady hodin na úkolech — PR #121 |
| 2026-04-07 | Estimation | Nový modul: Planning Poker — EstimationSession, EstimationRound, EstimationVote, multi-round hlasování (vote/reveal/confirm/revote), vazba na story points — PR #122 |
| 2026-04-07 | Workflow | Globální workflow šablony nezávislé na projektu (WorkflowTemplate CRUD, aplikace na projekt) — PR #123 |
| 2026-04-07 | Reports | Záložka Reporty s přehledem projektu (metriky, statistiky) — PR #124 |
| 2026-04-07 | Fix | Oprava stale state a chybějícího error handlingu v time log, boardu a backlogu — PR #125 |
| 2026-04-07 | Work | Editace worklogu, epic linking v úkolu, quick-add z projektu — PR #126 |
| 2026-04-08 | Planning | Start date úkolů, drag&drop validace na kanbanu, přejmenování backlogu — PR #127 |
| 2026-04-08 | Fix | Kanban drag reset, estimation 500 fix, quick-add proporce, backlog inline-add — PR #128 |
| 2026-04-08 | Deploy | Staging deploy zachová existující data místo migrate:fresh |
| 2026-04-11 | Gantt | IPA-16 click na úkol/epic v Ganttu (router.visit) + tooltip pozice (přepočet z bounding rectu místo offsetX/Y), IPA-11 odstraněna umělá min-height vnitřního containeru, IPA-12 default start_date/due_date = today při vytvoření úkolu bez termínu (úkol ihned viditelný v Ganttu i v listovém výpisu) |
