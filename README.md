# PHC Nexus

Interní produktivitní platforma pro Pears Health Care (50-200 uživatelů). Nahrazuje Jira, Asana a Confluence — spojuje projektové řízení, správu úkolů, schvalovací procesy a knowledge base v jednom systému.

## Aktuální stav

**Milestone 4 — Approvals & Notifications** (**DONE**) · 165 testů · [detailní stav](docs/status.md)

### Co už funguje

- **Projekty** — CRUD s Inertia pages (index, create, show, edit), projektové klíče, membership, soft deletes
- **Epiky** — CRUD v rámci projektu, quick-add formulář, EpicPolicy, Inertia pages
- **Úkoly** — CRUD (v epiku i bez), TaskStatus (6 stavů), TaskPriority (4 úrovně), quick-add, assignee/reporter, TaskPolicy, Inertia pages
- **Kanban board** — drag&drop sloupce podle statusu, optimistický update, validace stavových přechodů
- **Tabulkový view** — řazení, filtrování (status, priorita), inline změna statusu
- **Stavové přechody** — hardcoded allowed transitions na TaskStatus i EpicStatus, PATCH endpoint pro rychlou změnu
- **Approval flow** — polymorfní approval requesty, režim all approve / any reject, hlasování, cancel, expirace, reminder job, audit, 2 Inertia pages
- **Notifikace** — in-app (DB-backed) + email, 4 typy (approval requested, vote cast, task assigned, task status changed), mark as read, unread count endpoint, Inertia page
- **Autentizace** — Google SSO login, invite-only onboarding (pozvánka emailem, expirace 72h)
- **Organizační model** — oddělení (divisions) → týmy → uživatelé + tribes (cross-team skupiny)
- **5 systémových rolí** — Executive, Project Manager, Team Member, Service Desk Agent, Reader
- **Authorization matrix** — policies per role na Division, Team, User, Project; PHI access guard
- **PHI klasifikace** — PHI/Non-PHI/Unknown na entitách, access guard (Reader = no PHI), export guard
- **Audit trail** — append-only log, automatické sledování create/update/delete přes Auditable trait
- **Přílohy** — polymorfní attachments na jakémkoli modelu, upload/download s PHI guardem a auditem
- **Komentáře** — polymorfní threaded komentáře, editace s časovým razítkem, soft deletes, audit
- **Infrastruktura** — 8 Docker kontejnerů (app, worker/Horizon, scheduler, Caddy, PostgreSQL 17, 2× Redis, Mailpit)
- **CI/CD** — GitHub Actions pipeline (Pint + testy + Vite build)

### Co je další (M5 — Hardening & Release)

- Seed/demo data, E2E scénáře, backup/restore runbook, deploy runbook, monitoring

## Quick Start

```bash
git clone git@github.com:smil3fRomCZ/phc-nexus.git
cd phc-nexus
cp .env.example .env
docker compose up -d
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
npm run build
```

| Služba | URL |
|--------|-----|
| Aplikace | https://localhost |
| Horizon (queue dashboard) | https://localhost/horizon |
| Mailpit (email testing) | http://localhost:8025 |

## Tech Stack

| Vrstva | Technologie |
|--------|-------------|
| Backend | Laravel 13 (PHP 8.4), Inertia.js v2 |
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite 6+ |
| DB | PostgreSQL 17 (UUIDv7 PK, JSONB) |
| Cache/Queues | Redis dual (cache allkeys-lru + data noeviction), Horizon |
| Infra | Docker Compose, Caddy (TLS), PHP-FPM |
| CI | GitHub Actions |

## Architektura

```
app/Modules/
  Auth/           — Google SSO, invite flow, login/logout
  Organization/   — Division, Team, Tribe modely, SystemRole/UserStatus enumy
  Audit/          — AuditEntry, AuditService, Auditable trait, PHI klasifikace
  Projects/       — (M2 — rozpracované)
  Work/           — Epic + Task modely, CRUD, enumy, policies
  Approvals/      — ApprovalRequest, ApprovalVote, CastVote action, policies
  Notifications/  — 4 notification třídy (DB + email), controller, Inertia page
  Files/          — (M2 — rozpracované)
```

## Dokumentace

| Dokument | Obsah |
|----------|-------|
| [`docs/status.md`](docs/status.md) | Aktuální stav implementace (živý dokument) |
| [`docs/implementation-plan.md`](docs/implementation-plan.md) | Milestony a delivery plán |
| [`docs/dev-workflow.md`](docs/dev-workflow.md) | Průvodce lokálním vývojem |
| [`docs/tech-stack-analysis.md`](docs/tech-stack-analysis.md) | Tech rozhodnutí |
| [`docs/business-logic-summary.md`](docs/business-logic-summary.md) | Business logika |
| [`docs/architecture/phi-scope-matrix.md`](docs/architecture/phi-scope-matrix.md) | PHI access pravidla |
| [`docs/design/`](docs/design/) | Design systém, tokeny, page patterns |
| [`CLAUDE.md`](CLAUDE.md) | Instrukce pro Claude Code agenty |

## MVP Scope

**In:** Projekty, Epiky/Úkoly, Kanban + Tabulka, Approvals, Notifikace, Audit, Komentáře, Přílohy, Google SSO, PHI klasifikace

**Out:** OKR, Service Desk, Knowledge Base, Rule Engine, AI, Externí uživatelé

## License

MIT - Jan Melicherik 2026
