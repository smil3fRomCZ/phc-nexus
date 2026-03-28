# PHC Nexus — Status implementace

Živý dokument mapující co je **reálně implementováno** vs. plánováno. Aktualizuje se po každém milestone a významné změně.

> Poslední aktualizace: 2026-03-27

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
| Dockerfile | Done | Multi-stage: composer → node → PHP 8.4-FPM Alpine |
| docker-compose.yml (dev) | Done | 8 služeb: app, worker, scheduler, caddy, postgres, redis-cache, redis-data, mailpit |
| docker-compose.prod.yml | Done | Override bez volume mounts, restart policies |
| Caddyfile | Done | Reverse proxy, self-signed TLS, Vite HMR proxy, security headers |
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
| Projects | **Aktivní** | Project CRUD, membership, comments, attachments, CSV/Excel/HTML/MD export, ProjectPolicy |
| Work | **Aktivní** | Epic CRUD + edit dialog, Task CRUD + full edit dialog, kanban board (drag&drop), tabulkový view (bulk status change), stavové přechody, task dependencies (blocker/blocked by), recurring tasks, calendar view, activity timeline, inline editace |
| Approvals | **Aktivní** | Approval request/vote flow, create approval UI, global approvals stránka, approval analytics (statistiky, avg resolution), cancel, expirace |
| Notifications | **Aktivní** | 4 notification třídy, DB + email kanály, deep links, toast zprávy, TaskAssigned/TaskStatusChanged triggery |
| Audit | **Aktivní** | AuditEntry (append-only), AuditService, Auditable trait, PHI klasifikace/guard, audit log viewer, PHI access report |
| Comments | **Aktivní** | Polymorfní threaded komentáře na tasks, projects, epics, sdílená CommentsSection komponenta |
| Files | **Aktivní** | Polymorfní přílohy na tasks, projects, epics, sdílená AttachmentsSection komponenta, PHI download guard |

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

## Známé limitace a technický dluh

1. ~~**Worker nefunguje**~~ — Vyřešeno: Horizon nainstalován, worker běží. Dashboard na `/horizon`.
2. ~~**Vite HMR v Dockeru**~~ — Vyřešeno: separátní `vite` kontejner (node:22-alpine), Caddy proxy na `vite:5173` včetně WebSocket.
3. ~~**Testy běží na SQLite in-memory**~~ — Vyřešeno: `phpunit.pgsql.xml` pro opt-in PostgreSQL testy (`composer test:pgsql`). SQLite zůstává default pro rychlý feedback.
4. ~~**Žádné seed data**~~ — Vyřešeno: DemoSeeder s realistickou org strukturou, uživateli, projekty, epiky, úkoly, approvals a komentáři.
5. ~~**Design tokeny částečně**~~ — Vyřešeno: kompletní token set včetně form states, skeleton, transitions. `docs/design/design-tokens.md` v1.0.

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
