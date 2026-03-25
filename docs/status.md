# PHC Nexus — Status implementace

Živý dokument mapující co je **reálně implementováno** vs. plánováno. Aktualizuje se po každém milestone a významné změně.

> Poslední aktualizace: 2026-03-25

---

## Přehled milestones

| # | Milestone | Status | Poznámka |
|---|-----------|--------|----------|
| 0 | Foundation | **DONE** | Docker stack, Laravel + Inertia + React, CI |
| 1 | Identity & Access | **DONE** | Google SSO, invite flow, org model, role matrix, PHI klasifikace |
| 2 | Projects Core | Not started | CRUD, členství, audit, files |
| 3 | Work Core | Not started | Epiky, úkoly, kanban, tabulka |
| 4 | Approvals & Notifications | Not started | Approval flow, email, in-app |
| 5 | Hardening & Release | Not started | E2E, seed data, runbooks |

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
| Auth | **Aktivní** | Google SSO (redirect + callback), login stránka, logout, HandleInertiaRequests middleware |
| Organization | **Aktivní** | Division, Team, Tribe modely + migrace, SystemRole + UserStatus enumy, User rozšířen o role/status/team |
| Projects | Skeleton | Prázdná adresářová struktura |
| Work | Skeleton | Prázdná adresářová struktura |
| Approvals | Skeleton | Prázdná adresářová struktura |
| Notifications | Skeleton | Prázdná adresářová struktura |
| Audit | **Aktivní** | PhiClassification enum, HasPhiClassification trait, PhiAccessGuard (access + export) |
| Files | Skeleton | Prázdná adresářová struktura |

---

## Kontejnerový stav (dev)

| Kontejner | Image | Port | Status |
|-----------|-------|------|--------|
| app | phc-nexus-app (PHP 8.4-FPM) | 9000 (internal) | Running |
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
2. **Vite HMR v Dockeru** — Aktuálně je třeba `npm run build` lokálně. Vite dev server proxy přes Caddy je připraven, ale nebyl end-to-end ověřen.
3. **Testy běží na SQLite in-memory** — phpunit.xml používá SQLite, ne PostgreSQL. Pro MVP feature testy to stačí, pro database-specific testy (JSONB, FTS) bude potřeba PostgreSQL test connection.
4. **Žádné seed data** — migrace běží, ale seed je prázdný.
5. **Design tokeny částečně** — v CSS jsou brand, text, surface, border, status tokeny. Chybí component-level tokeny (shell dimensions, button variants atd.).

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
