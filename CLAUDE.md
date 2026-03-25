# CLAUDE.md

Tento soubor je hlavní instrukční sada pro Claude Code agenty pracující na PHC Nexus.

## Project Overview

**PHC Nexus** — interní produktivitní platforma pro Pears Health Care (50–200 uživatelů). Nahrazuje Jira, Asana a Confluence. Spojuje projektové řízení, správu úkolů, schvalovací procesy a knowledge base. MIT License, Jan Melicherik 2026.

## MVP Scope

**IN:** Organizace, uživatelé, role, přístupová práva · Google SSO (interní, invite-only) · Projekty CRUD · Epiky a úkoly · Stavové přechody per typ entity · Základní approval flow (all approve / any reject) · Kanban + tabulka · Komentáře · Přílohy · Audit trail · Notifikace (in-app + email) · PHI klasifikace

**OUT:** OKR/Goals · Service Desk/ITSM · Knowledge Base · Rule engine · AI/LLM · Pokročilé approval režimy · Gantt · Sprint velocity · Externí/guest identity (vyžaduje samostatný ADR)

## Tech Stack

| Vrstva | Technologie |
|--------|-------------|
| Backend | Laravel 13 (PHP 8.4), Inertia.js v2 |
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vite 6 |
| State | Inertia props (primární), Zustand (lokální UI), TanStack Query (nezávislé widgety) |
| DB | PostgreSQL 17 (JSONB, FTS, UUIDv7 PK) |
| Cache/Queues | Redis — dva kontejnery: `redis-cache` (allkeys-lru), `redis-data` (noeviction, sessions + queues) |
| Queues | Laravel Queue + Redis + Horizon |
| Auth | Laravel Socialite (Google SSO) |
| Files | Laravel Filesystem (local / S3-compatible) |
| Infra | Docker + Docker Compose, Caddy (reverse proxy + TLS), PHP-FPM |
| Admin | Filament 5 / Livewire 4 (pouze technická administrace, ne core UI) |
| CI | GitHub Actions (lint + test + build) |

## Module Structure

```
app/Modules/
  Auth/           — Google SSO, invite flow, onboarding
  Organization/   — oddělení, týmy, tribes, uživatelé
  Projects/       — projekty CRUD, členství, role
  Work/           — epiky, úkoly, stavové přechody, kanban, tabulka
  Approvals/      — requesty, votes, delegace, reminders
  Notifications/  — in-app (DB-backed), email
  Audit/          — append-only audit trail, PHI access log
  Files/          — upload, verzování, storage contract
```

Každý modul obsahuje: `Models/`, `Actions/` (use-cases), `Controllers/`, `Policies/`, `Resources/` (Inertia), `Events/`, `Listeners/`, `Jobs/`, `Enums/`, `Routes/`, `Tests/`

## Git Workflow

- **Trunk-based development** na `main` (vždy releasable, protected)
- Krátké feature branche (1–3 dny): `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`
- Příklad: `feat/auth-google-sso`, `fix/approval-deadlock`
- **Conventional Commits**: `type(scope): summary`
- **Squash merge** do `main`, minimálně 1 review, CI zelená
- PR velikost: 300–600 řádků diffu

## Docker Development

- `docker compose up` spustí vše — žádné lokální PHP/Node instalace
- Kontejnery: `app` (PHP-FPM), `worker`, `scheduler`, `postgres`, `redis-cache`, `redis-data`, `caddy`
- Jeden Dockerfile, jeden image, více runtime rolí (CMD override)
- Stejný image pro local / staging / production
- Detaily: `docs/dev-workflow.md`

## Testing

- **Backend:** PHPUnit/Pest — unit (business logika), feature (HTTP flows), auth testy, queue job testy
- **Frontend:** Vitest (komponenty/logika), Playwright (kritické E2E flows)
- **Static analysis:** PHPStan level 8, Pint, ESLint, Prettier
- **Povinné E2E:** login, projekt CRUD, úkol CRUD, stav změna, approval flow, komentář + příloha, notifikace, PHI access, export guard
- Každý PR musí obsahovat testy úměrné riziku

## Documentation Rules

Po dokončení každého tasku nebo milestone:
1. **Aktualizuj `docs/status.md`** — zapiš co bylo reálně implementováno (ne co bylo plánováno)
2. **Module docs** — jakmile modul obsahuje business logiku, vytvoř/aktualizuj `app/Modules/<Name>/README.md`
3. **Známé limitace** — zapiš technický dluh a workaroundy do status.md sekce "Známé limitace"
4. **Historie změn** — přidej řádek do tabulky "Historie změn" v status.md

Účel: debugging, onboarding nových agentů/devs, základ pro uživatelské manuály.

## Definition of Done

Než je task hotový, ověř:
- [ ] Implementovaný end-to-end
- [ ] Acceptance criteria splněna
- [ ] MVP scope dodržen (žádný scope creep)
- [ ] Code review proběhl
- [ ] Testy napsány (auth, audit, export impact pokryty)
- [ ] Authorization na každém endpointu/page/download
- [ ] Audit trail pro business akce
- [ ] PHI/export/download impact vyřešen
- [ ] Dokumentace aktualizována (`docs/status.md`, module README pokud relevantní)
- [ ] Dokumentováno, pokud mění workflow nebo provoz

## PHI / Security

- Klasifikace: `PHI`, `Non-PHI`, `Unknown` (Unknown = PHI strictness)
- PHI entity: omezený přístup, audit na čtení, export blokován
- Guest uživatelé: nikdy přístup k PHI
- Download/export guardy na všechny file operace
- Žádné secrets v kódu nebo commitech
- Detail: `docs/architecture/phi-scope-matrix.md`

## Code Conventions

- **PHP:** `declare(strict_types=1)`, PHP 8.4 atributy (ne `$fillable`/`$hidden`), Actions pro use-cases, Policy třídy pro autorizaci
- **TypeScript:** strict mode, interfaces pro doménové objekty, shadcn/ui komponenty
- **DB:** UUIDv7 jako PK, timestamp sloupce, soft deletes kde vhodné
- **Styling:** Design tokens z `docs/design/design-tokens.md`, žádné ad-hoc hex barvy
- **Naming:** Angličtina v kódu, čeština v business dokumentech
- **Princip:** Žádná předčasná abstrakce, žádné generické helpery, žádný rule engine v MVP

## Key References

| Dokument | Obsah |
|----------|-------|
| `docs/status.md` | Aktuální stav implementace (živý dokument) |
| `docs/implementation-plan.md` | Milestony, delivery pořadí, git/PR/release strategie |
| `docs/tech-stack-analysis.md` | Kompletní tech rozhodnutí |
| `docs/business-logic-summary.md` | Business logika (číst jen MVP sekce) |
| `docs/dev-workflow.md` | Praktický průvodce lokálním vývojem |
| `docs/architecture/phi-scope-matrix.md` | PHI access pravidla |
| `docs/adr/ADR-004-auth-scope-mvp.md` | Auth rozhodnutí |
| `docs/design/design-system.md` | Vizuální směr a komponenty |
| `docs/design/design-tokens.md` | CSS tokeny |
| `docs/design/page-patterns.md` | Šablony stránek |
