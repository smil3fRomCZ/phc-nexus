# PHC Nexus

Interní produktivitní platforma pro Pears Health Care (50-200 uživatelů). Nahrazuje Jira, Asana a Confluence — spojuje projektové řízení, správu úkolů, schvalovací procesy a knowledge base v jednom systému.

## Aktuální stav

**Milestone 1 — Identity & Access** (v průběhu)

Docker stack běží (Laravel 13, Inertia.js v2, React 19, TypeScript, Tailwind CSS 4, PostgreSQL 17, Redis dual, Caddy). Google SSO login funguje. Organizační model (oddělení, týmy, tribes, role) a authorization matrix (policies per role) implementovány. Detailní stav viz [`docs/status.md`](docs/status.md).

## Quick Start

```bash
# Klonování
git clone git@github.com:smil3fRomCZ/phc-nexus.git
cd phc-nexus

# Environment
cp .env.example .env

# Spuštění (vše v kontejnerech, žádné lokální PHP/Node)
docker compose up -d

# První setup
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed

# Frontend build (pro dev bez HMR)
npm run build
```

Po startu:

| Služba | URL |
|--------|-----|
| Aplikace | https://localhost |
| Mailpit (email testing) | http://localhost:8025 |

## Tech Stack

| Vrstva | Technologie |
|--------|-------------|
| Backend | Laravel 13 (PHP 8.4), Inertia.js v2 |
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vite 6+ |
| DB | PostgreSQL 17 (UUIDv7 PK, JSONB, FTS) |
| Cache/Queues | Redis (dual: cache + data) |
| Infra | Docker Compose, Caddy, PHP-FPM |

## Struktura

```
app/Modules/          — doménové moduly (Auth, Organization, Projects, Work, ...)
docs/                 — dokumentace (plán, tech stack, design systém, status)
docker/               — Docker konfigurace (PHP, Caddy)
resources/js/         — React frontend (Pages, Layouts, Components)
resources/css/        — Tailwind CSS s design tokeny
preview/              — HTML mockupy MVP obrazovek
.claude/commands/     — slash commands pro Claude Code agenty
```

## Dokumentace

| Dokument | Obsah |
|----------|-------|
| [`docs/status.md`](docs/status.md) | Aktuální stav implementace |
| [`docs/implementation-plan.md`](docs/implementation-plan.md) | Milestony a delivery plán |
| [`docs/dev-workflow.md`](docs/dev-workflow.md) | Průvodce lokálním vývojem |
| [`docs/tech-stack-analysis.md`](docs/tech-stack-analysis.md) | Tech rozhodnutí |
| [`docs/business-logic-summary.md`](docs/business-logic-summary.md) | Business logika |
| [`docs/design/`](docs/design/) | Design systém, tokeny, page patterns |
| [`CLAUDE.md`](CLAUDE.md) | Instrukce pro Claude Code agenty |

## MVP Scope

**In:** Projekty, Epiky/Úkoly, Kanban + Tabulka, Approvals, Notifikace, Audit, Komentáře, Přílohy, Google SSO, PHI klasifikace

**Out:** OKR, Service Desk, Knowledge Base, Rule Engine, AI, Externí uživatelé

## License

MIT - Jan Melicherik 2026
