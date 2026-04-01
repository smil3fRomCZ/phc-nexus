# PHC Nexus

Interní produktivitní platforma pro **Pears Health Care**. Nahrazuje Jira, Asana a Confluence — spojuje projektové řízení, správu úkolů, schvalovací procesy a týmovou organizaci v jednom systému.

Navrženo pro 50–200 uživatelů. Invite-only přístup přes Google SSO.

## Co PHC Nexus umí

### Projektové řízení

- **Projekty** — CRUD, členství, projektové klíče, export do CSV/Excel/HTML/Markdown
- **Epiky a úkoly** — hierarchie, přiřazení, priority, due dates, benefit type, popis (rich text)
- **Kanban board** — drag & drop sloupce podle workflow statusu, per-user nastavení polí na kartách, filtry (řešitel, epic)
- **Tabulkový view** — řazení, filtrování, inline změna statusu, bulk operace
- **Workflow engine** — vlastní stavy a přechody per projekt, vizuální editor (React Flow), dynamický StatusBadge
- **Task dependencies** — blocker/blocked by vazby mezi úkoly
- **Recurring tasks** — denní, týdenní, dvoutýdenní, měsíční opakování
- **Calendar** — měsíční pohled úkolů podle due date
- **Time logging** — záznamy odpracovaného času na úkolech a epicích

### Dokumentace

- **Projektová dokumentace** — stromová struktura stránek pod projektem, rich text editor (TipTap)
- **Epic dokumentace** — vlastní stránky pod epikem, oddělené od projektové dokumentace
- **Komentáře a přílohy** — na každé stránce dokumentace

### Schvalovací procesy

- **Approval flow** — request → hlasování → schválení/zamítnutí
- **Režim all approve / any reject** — flexibilní schvalovací pravidla
- **Approval blocking** — pending approval blokuje změnu statusu
- **Approval analytics** — statistiky, historie, průměrný čas schválení

### Spolupráce

- **Komentáře** — threaded diskuze na projektech, epicích, úkolech a dokumentaci
- **Přílohy** — upload/download s PHI guardem a auditem
- **Notifikace** — in-app + email, deep links, živý unread count v notifikačním zvonečku
- **Toast zprávy** — okamžitá zpětná vazba po akcích

### Administrace & compliance

- **User management** — seznam, role, status, vyhledávání, pozvánky
- **Organizační struktura** — oddělení → týmy → uživatelé
- **Audit log** — kompletní trail všech akcí, filtrování
- **PHI access report** — kdo přistupoval k chráněným zdravotním údajům
- **PHI klasifikace** — PHI/Non-PHI/Unknown na entitách, export guard

### UX

- **Project dashboard** — metriky na detailu projektu (tasks/completed/overdue, epics, members)
- **Empty states** — ikony a CTA na prázdných stránkách
- **Loading stavy** — spinner v submit buttonech, skeleton loader komponenta
- **Frontend validace** — client-side validace na formulářích (blur + submit)
- **Globální vyhledávání** — Cmd+K přes projekty a úkoly, dynamický StatusBadge
- **My Tasks** — globální přehled přiřazených úkolů s filtry
- **Responsive layout** — mobilní sidebar, responsive tabulky
- **Activity timeline** — vizualizace historie změn na úkolech
- **Inline editace** — assignee, priorita, due date přímo v sidebaru
- **Pagination** — na všech seznamech
- **Error handling** — globální error modal pro HTTP chyby (404/500), zavíratelný křížkem/klikem mimo/Escape

## Quick Start

```bash
git clone git@github.com:smil3fRomCZ/phc-nexus.git
cd phc-nexus
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
npm run build
```

| Služba                    | URL                       |
| ------------------------- | ------------------------- |
| Aplikace                  | https://localhost         |
| Horizon (queue dashboard) | https://localhost/horizon |
| Mailpit (email testing)   | http://localhost:8025     |

## Autentizace

Google SSO (invite-only). Nové uživatele zvou Executive nebo Project Manager z admin sekce. Pozvánka platí 72 hodin.

**5 systémových rolí:** Executive · Project Manager · Team Member · Service Desk Agent · Reader

---

## Technický popis

### Tech Stack

| Vrstva       | Technologie                                                              |
| ------------ | ------------------------------------------------------------------------ |
| Backend      | Laravel 13 (PHP 8.4), Inertia.js v2                                      |
| Frontend     | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vite 6                  |
| DB           | PostgreSQL 17 (UUIDv7 PK, JSONB)                                         |
| Cache/Queues | Redis dual (cache allkeys-lru + data noeviction), Horizon                |
| Auth         | Laravel Socialite (Google SSO)                                           |
| Infra        | Docker Compose (8 kontejnerů), Caddy (reverse proxy + TLS), PHP-FPM      |
| CI           | GitHub Actions (Pint + PHPStan + ESLint + Prettier + testy + Vite build) |

### Architektura

Modulární monolit s 10 doménovými moduly:

```
app/Modules/
  Auth/           — Google SSO, invite flow, login/logout
  Organization/   — Division, Team, Tribe, User management
  Projects/       — Projekty CRUD, membership, export
  Work/           — Epiky, úkoly, kanban, tabulka, dependencies, recurrence, time logging, workflow engine
  Approvals/      — Approval requesty, hlasování, analytics
  Notifications/  — In-app (DB) + email notifikace
  Audit/          — Append-only audit trail, PHI klasifikace a access guard
  Comments/       — Polymorfní threaded komentáře
  Files/          — Polymorfní přílohy, upload/download, PHI guard
  Wiki/           — Projektová a epic dokumentace, stromová struktura stránek
```

### Infrastruktura (Docker)

| Kontejner   | Image                | Účel                                                                |
| ----------- | -------------------- | ------------------------------------------------------------------- |
| app         | PHP 8.4-FPM Alpine   | Hlavní aplikace (entrypoint sync public assets do sdíleného volume) |
| worker      | Horizon              | Queue processing                                                    |
| scheduler   | Laravel Scheduler    | Cron úlohy (recurring tasks)                                        |
| caddy       | Caddy 2 Alpine       | Reverse proxy, auto-TLS (Let's Encrypt v produkci)                  |
| postgres    | PostgreSQL 17 Alpine | Databáze                                                            |
| redis-cache | Redis 7 Alpine       | Cache (allkeys-lru)                                                 |
| redis-data  | Redis 7 Alpine       | Sessions + queues (noeviction)                                      |
| mailpit     | Mailpit              | Email testing (dev)                                                 |

**Dev:** `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` (bind mounts, Vite HMR)
**Staging:** `COMPOSE_PROJECT_NAME=phc-nexus-staging docker compose -f docker-compose.staging.yml up -d` (lehčí FPM, 1× Redis)
**Produkce:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` (named volumes, Let's Encrypt)

### Production Deployment

Běží na **FORPSI Standard VPS** (4 vCPU, 8 GB RAM, 80 GB NVMe, ~295 Kč/měs).

- **Produkce:** https://phc-nexus.eu
- **Staging:** https://dev.phc-nexus.eu (basic auth chráněný)
- Deploy workflow: push na master → CI → build image → **staging auto** → **produkce po approve**
- Sdílený Caddy obsluhuje obě domény s auto-TLS (Let's Encrypt)
- DB sync skript: jednosměrná kopie produkčních dat do stagingu s PHI anonymizací
- Průvodce: [`docs/runbooks/forpsi-setup.md`](docs/runbooks/forpsi-setup.md), [`docs/staging-setup.md`](docs/staging-setup.md)

### Dokumentace

| Dokument                                                                         | Obsah                                 |
| -------------------------------------------------------------------------------- | ------------------------------------- |
| [`docs/status.md`](docs/status.md)                                               | Aktuální stav implementace            |
| [`docs/dev-workflow.md`](docs/dev-workflow.md)                                   | Průvodce lokálním vývojem             |
| [`docs/runbooks/forpsi-setup.md`](docs/runbooks/forpsi-setup.md)                 | FORPSI VPS setup (12 kroků)           |
| [`docs/staging-setup.md`](docs/staging-setup.md)                                 | Staging prostředí — jednorázový setup |
| [`docs/runbooks/deploy.md`](docs/runbooks/deploy.md)                             | Deploy, CD pipeline, rollback         |
| [`docs/runbooks/backup-restore.md`](docs/runbooks/backup-restore.md)             | Zálohy a obnova                       |
| [`docs/architecture/phi-scope-matrix.md`](docs/architecture/phi-scope-matrix.md) | PHI access pravidla                   |
| [`docs/design/`](docs/design/)                                                   | Design systém, tokeny, page patterns  |
| [`CLAUDE.md`](CLAUDE.md)                                                         | Instrukce pro Claude Code agenty      |

## License

MIT — Jan Melicherik 2026
