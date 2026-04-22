# CLAUDE.md

Tento soubor je hlavní instrukční sada pro Claude Code agenty pracující na PHC Nexus.

## Project Overview

**PHC Nexus** — interní produktivitní platforma pro Pears Health Care (50–200 uživatelů). Nahrazuje Jira, Asana a Confluence. Spojuje projektové řízení, správu úkolů, schvalovací procesy a dokumentaci. MIT License, Jan Melicherik 2026.

**Stav:** živá produkce na [`https://phc-nexus.eu`](https://phc-nexus.eu), staging na [`https://dev.phc-nexus.eu`](https://dev.phc-nexus.eu). MVP + MVP2–4 a řada post-MVP iterací (workflow engine, wiki, story points, Planning Poker, security audit Sprint 1–7) jsou hotové a nasazené. Živý rozsah implementace je vedený v [`docs/status.md`](docs/status.md).

## Rozsah aplikace

**Implementováno (IN):** Organizace, uživatelé, role, přístupová práva · Google SSO (invite-only, 24h TTL pozvánky) · Projekty CRUD, členství, workflow engine, šablony, reporty, export · Epiky a úkoly (kanban, tabulka, dependencies, recurrence, time logging, story points) · Planning Poker (multi-round hlasování) · Approval flow (all approve / any reject, blocking, analytics) · Komentáře + přílohy polymorfně · Projektová a epic dokumentace (Wiki, TipTap editor) · Audit trail (append-only na DB úrovni) · Notifikace (in-app + email přes Horizon) · PHI klasifikace + reclassification audit · Admin sekce (users, organization, audit log, PHI report)

**Záměrně mimo scope (OUT):** OKR/Goals · Service Desk/ITSM · Rule engine · AI/LLM · Pokročilé approval režimy (weighted voting) · Gantt (jen MVP verze, ne full) · Sprint velocity · Externí/guest identity (vyžaduje samostatný ADR)

## Tech Stack

| Vrstva       | Technologie                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Backend      | Laravel 13 (PHP 8.4), Inertia.js v3                                                                  |
| Frontend     | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vite 6                                              |
| State        | Inertia props (primární), Zustand (lokální UI), TanStack Query (nezávislé widgety)                   |
| DB           | PostgreSQL 17 (JSONB, FTS, UUIDv7 PK)                                                                |
| Cache/Queues | Redis — dva kontejnery: `redis-cache` (allkeys-lru), `redis-data` (noeviction, sessions + queues)    |
| Queues       | Laravel Queue + Redis + Horizon (named queues: `mail`, `notifications`, `default`)                   |
| Auth         | Laravel Socialite (Google SSO)                                                                       |
| Files        | Laravel Filesystem (local / S3-compatible)                                                           |
| Infra        | Docker + Docker Compose, Caddy (reverse proxy + TLS), PHP-FPM                                        |
| Image build  | GitHub Actions → GHCR (`ghcr.io/smil3fromcz/phc-nexus:sha-<short>`), VPS jen `docker compose pull`   |
| Admin        | Custom React/Inertia admin stránky (users, org, audit, PHI report, approval analytics)               |
| CI           | GitHub Actions (Pint + PHPStan + ESLint + Prettier + PHPUnit + Vitest + Playwright E2E + Vite build) |

## Module Structure

11 doménových modulů (modulární monolit):

```
app/Modules/
  Auth/           — Google SSO, invite flow (24h TTL), SHA256 token storage, login/logout
  Organization/   — Division, Team, Tribe, User management, user:promote CLI command
  Projects/       — projekty CRUD, členství, workflow engine, šablony, reporty, export,
                    PHI reclassification (Executive-only, reason required)
  Work/           — epiky, úkoly (kanban, tabulka, dependencies, recurrence, time logging,
                    story points, start date), Actions: CreateTask/UpdateTask/ChangeTaskStatus/DuplicateTask
  Approvals/      — requesty, votes, reminders, analytics, approval blocking (pending blokuje status change)
  Notifications/  — in-app (DB) + queued email přes Horizon, 4 notification classes
  Audit/          — append-only audit trail (Postgres RULE ON UPDATE/DELETE DO INSTEAD NOTHING),
                    PHI masking, afterCommit guard, `PhiClassificationChanged` dedicated action
  Comments/       — polymorfní threaded komentáře, CommentPolicy
  Estimation/     — Planning Poker, multi-round hlasování, story point odhady
  Files/          — polymorfní přílohy, upload/download, MIME whitelist, PHI guard, AttachmentPolicy
  Wiki/           — projektová a epic dokumentace, stromová struktura, TipTap editor
```

Každý aktivní modul obsahuje: `Models/`, `Actions/` (use-cases), `Controllers/`, `Policies/`, `Resources/` (Inertia), `Events/`, `Listeners/`, `Jobs/`, `Enums/`, `Routes/`, `Tests/`. Events/Listeners jsou prázdné — notifikace se dispatchují přímo z Actions.

## Git Workflow

- **Trunk-based development** na `main` (vždy releasable, protected)
- Krátké feature branche (1–3 dny): `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`
- Příklad: `feat/auth-google-sso`, `fix/approval-deadlock`
- **Conventional Commits**: `type(scope): summary`
- **Squash merge** do `main`, minimálně 1 review, CI zelená
- PR velikost: 300–600 řádků diffu
- **HTML Previews:** Po dokončení a mergnutí branche přesunout všechny nové HTML preview soubory z `docs/previews/` do `docs/previews/archive/`. Aktivní previews v `docs/previews/` jsou pouze ty z aktuální rozpracované branche.

## Docker Development

- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` spustí dev prostředí — žádné lokální PHP/Node instalace
- Kontejnery: `app` (PHP-FPM), `worker` (Horizon), `scheduler`, `vite` (dev HMR), `postgres`, `redis-cache`, `redis-data`, `caddy`, `mailpit`
- Jeden Dockerfile, jeden image, více runtime rolí (CMD override)
- Stejný image pro local / staging / production
- Detaily: `docs/dev-workflow.md`

## Production & Staging

- **Produkce:** [`https://phc-nexus.eu`](https://phc-nexus.eu) — FORPSI Standard VPS (4 vCPU, 8 GB RAM). Compose: `docker-compose.yml` + `docker-compose.prod.yml`.
- **Staging:** [`https://dev.phc-nexus.eu`](https://dev.phc-nexus.eu) — stejný VPS, Basic Auth + IP whitelist (`STAGING_TRUSTED_IPS`), `X-Robots-Tag: noindex, noarchive`. Compose: `docker-compose.staging.yml`.
- **Sdílený Caddy** obsluhuje obě domény s Let's Encrypt auto-TLS. Deploy workflow syncuje `Caddyfile.shared` → `/opt/phc-nexus-shared/Caddyfile` a force-recreatuje Caddy.
- **CD pipeline:** push na `master` → CI → build v GH Actions → push do GHCR → staging auto-deploy (migrate + seed) → produkce po manual approve (migrate only). Deploy runner používá `git reset --hard origin/master` (idempotentní) + health-check retry loop 6×10s.
- **Rollback:** `scripts/rollback.sh <tag> <env>` — okamžitý návrat na předchozí SHA (~30 s).
- **Off-site backup:** `scripts/backup.sh` pg_dump + tar storage → GPG → Backblaze B2 (kód ready, B2 účet čeká na user setup).
- Runbooky: [`docs/runbooks/forpsi-setup.md`](docs/runbooks/forpsi-setup.md), [`docs/runbooks/deploy.md`](docs/runbooks/deploy.md), [`docs/runbooks/backup-restore.md`](docs/runbooks/backup-restore.md), [`docs/runbooks/rollback.md`](docs/runbooks/rollback.md), [`docs/staging-setup.md`](docs/staging-setup.md)

## Testing

- **Backend:** PHPUnit/Pest — unit (business logika), feature (HTTP flows), auth testy, queue job testy
- **Frontend:** Vitest (komponenty/logika), Playwright (kritické E2E flows)
- **Static analysis:** PHPStan level 8, Pint, ESLint, Prettier
- **Povinné E2E:** login, projekt CRUD, úkol CRUD, stav změna, approval flow, komentář + příloha, notifikace, PHI access, export guard
- Každý PR musí obsahovat testy úměrné riziku

### Pravidla pro testy

1. **Nová funkcionalita** — každá nová feature vyžaduje odpovídající unit/feature test
2. **Skupina souvisejících funkcí** — pokud PR přidává ucelenou skupinu funkcionalit (např. celý modul, nový workflow), vyžaduje E2E test pokrývající hlavní scénář
3. **Refaktoring** — při refaktoringu existující funkcionality musí být aktualizovány všechny dotčené testy; pokud refaktoring mění chování, testy musí reflektovat nové chování
4. **Bug fix** — každý opravený bug vyžaduje regresní test, který reprodukuje původní chybu

## Documentation Rules

Po dokončení každého tasku nebo milestone:

1. **Aktualizuj `README.md`** — vždy v každém pushi/PR, aby odrážel aktuální stav projektu
2. **Aktualizuj `docs/status.md`** — zapiš co bylo reálně implementováno (ne co bylo plánováno)
3. **Module docs** — jakmile modul obsahuje business logiku, vytvoř/aktualizuj `app/Modules/<Name>/README.md`
4. **Známé limitace** — zapiš technický dluh a workaroundy do status.md sekce "Známé limitace"
5. **Historie změn** — přidej řádek do tabulky "Historie změn" v status.md

Účel: debugging, onboarding nových agentů/devs, základ pro uživatelské manuály.

## Definition of Done

Než je task hotový, ověř:

- [ ] Implementovaný end-to-end
- [ ] Acceptance criteria splněna
- [ ] MVP scope dodržen (žádný scope creep)
- [ ] Code review proběhl
- [ ] Testy napsány (auth, audit, export impact pokryty)
- [ ] Při refaktoringu aktualizovány dotčené testy
- [ ] Authorization na každém endpointu/page/download
- [ ] Audit trail pro business akce
- [ ] PHI/export/download impact vyřešen
- [ ] Dokumentace aktualizována (`docs/status.md`, module README pokud relevantní)
- [ ] Dokumentováno, pokud mění workflow nebo provoz

## PHI / Security

- Klasifikace: `PHI`, `Non-PHI`, `Unknown` (Unknown = PHI strictness). Default pro nové Project/Task/Epic je `non_phi`.
- PHI entity: omezený přístup (`PhiAccessGuard`), audit na čtení (`phi_accessed`), export blokován, download `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff`.
- **Reclassification** (`data_classification` change) je možná **jen přes dedikovaný endpoint `PATCH /projects/{project}/classification`** — Executive-only (`ProjectPolicy::reclassify`), povinný `reason` (min 10, max 500 znaků). Běžný `PUT /projects/{id}` pole nepřijímá. Každá reclassifikace generuje dedikovanou audit entry s akcí `AuditAction::PhiClassificationChanged` a payloadem `{from, to, reason, actor_id}` — payload není maskován (meta-audit musí zůstat čitelný).
- Audit trail je append-only na DB úrovni — Postgres RULE `ON UPDATE/DELETE DO INSTEAD NOTHING` (ani admin s `psql` nemůže audit přepsat).
- Guest uživatelé: nikdy přístup k PHI (guest identity není součástí MVP).
- Download/export guardy na všechny file operace.
- SVG uploady blokovány (XSS přes inline SVG).
- Žádné secrets v kódu nebo commitech — `.env` v `.gitignore`, Dependabot na composer/npm/docker/actions.
- Detail: [`docs/architecture/phi-scope-matrix.md`](docs/architecture/phi-scope-matrix.md)

## Code Conventions

- **PHP:** `declare(strict_types=1)`, PHP 8.4 atributy (ne `$fillable`/`$hidden`), Actions pro use-cases, Policy třídy pro autorizaci
- **TypeScript:** strict mode, interfaces pro doménové objekty, shadcn/ui komponenty
- **DB:** UUIDv7 jako PK, timestamp sloupce, soft deletes kde vhodné
- **Styling:** Design tokens z `docs/design/design-tokens.md`, žádné ad-hoc hex barvy
- **Naming:** Angličtina v kódu, čeština v dokumentech, PR popisech, commit messages a veškeré komunikaci
- **Princip:** Žádná předčasná abstrakce, žádné generické helpery, žádný rule engine v MVP

## Key References

| Dokument                                | Obsah                                                |
| --------------------------------------- | ---------------------------------------------------- |
| `docs/status.md`                        | Aktuální stav implementace (živý dokument)           |
| `docs/implementation-plan.md`           | Milestony, delivery pořadí, git/PR/release strategie |
| `docs/tech-stack-analysis.md`           | Kompletní tech rozhodnutí                            |
| `docs/business-logic-summary.md`        | Business logika (číst jen MVP sekce)                 |
| `docs/dev-workflow.md`                  | Praktický průvodce lokálním vývojem                  |
| `docs/architecture/phi-scope-matrix.md` | PHI access pravidla                                  |
| `docs/adr/ADR-004-auth-scope-mvp.md`    | Auth rozhodnutí                                      |
| `docs/design/design-system.md`          | Vizuální směr a komponenty                           |
| `docs/design/design-tokens.md`          | CSS tokeny                                           |
| `docs/design/page-patterns.md`          | Šablony stránek                                      |
