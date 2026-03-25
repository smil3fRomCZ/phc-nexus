# PHC Nexus

Interní produktivitní platforma pro Pears Health Care (50-200 uživatelů). Nahrazuje Jira, Asana a Confluence — spojuje projektové řízení, správu úkolů, schvalovací procesy a knowledge base v jednom systému.

## Aktuální stav

**Milestone 2 — Projects Core** (v průběhu) · 74 testů · [detailní stav](docs/status.md)

### Co už funguje

- **Autentizace** — Google SSO login, invite-only onboarding (pozvánka emailem, expirace 72h)
- **Organizační model** — oddělení (divisions) → týmy → uživatelé + tribes (cross-team skupiny)
- **5 systémových rolí** — Executive, Project Manager, Team Member, Service Desk Agent, Reader
- **Authorization matrix** — policies per role na Division, Team, User; team lead může spravovat svůj tým
- **PHI klasifikace** — PHI/Non-PHI/Unknown na entitách, access guard (Reader = no PHI), export guard
- **Audit trail** — append-only log, automatické sledování create/update/delete přes Auditable trait
- **Infrastruktura** — 8 Docker kontejnerů (app, worker/Horizon, scheduler, Caddy, PostgreSQL 17, 2× Redis, Mailpit)
- **CI/CD** — GitHub Actions pipeline (Pint + testy + Vite build)

### Co je rozpracované (M2)

- File attachment contract (upload/download s authorization)
- Comment thread model
- Projekty CRUD + Inertia pages

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
  Work/           — (M3)
  Approvals/      — (M4)
  Notifications/  — (M4)
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
