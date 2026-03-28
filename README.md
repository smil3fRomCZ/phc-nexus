# PHC Nexus

Interní produktivitní platforma pro **Pears Health Care**. Nahrazuje Jira, Asana a Confluence — spojuje projektové řízení, správu úkolů, schvalovací procesy a týmovou organizaci v jednom systému.

Navrženo pro 50–200 uživatelů. Invite-only přístup přes Google SSO.

## Co PHC Nexus umí

### Projektové řízení
- **Projekty** — CRUD, členství, projektové klíče, export do CSV/Excel/HTML/Markdown
- **Epiky a úkoly** — hierarchie, přiřazení, priority, due dates, popis
- **Kanban board** — drag & drop sloupce podle statusu
- **Tabulkový view** — řazení, filtrování, inline změna statusu, bulk operace
- **Task dependencies** — blocker/blocked by vazby mezi úkoly
- **Recurring tasks** — denní, týdenní, dvoutýdenní, měsíční opakování
- **Calendar** — měsíční pohled úkolů podle due date

### Schvalovací procesy
- **Approval flow** — request → hlasování → schválení/zamítnutí
- **Režim all approve / any reject** — flexibilní schvalovací pravidla
- **Approval analytics** — statistiky, historie, průměrný čas schválení

### Spolupráce
- **Komentáře** — threaded diskuze na projektech, epicích a úkolech
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
- **Globální vyhledávání** — Cmd+K přes projekty a úkoly
- **My Tasks** — globální přehled přiřazených úkolů s filtry
- **Responsive layout** — mobilní sidebar, responsive tabulky
- **Activity timeline** — vizualizace historie změn na úkolech
- **Inline editace** — assignee, priorita, due date přímo v sidebaru
- **Pagination** — na všech seznamech

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

## Autentizace

Google SSO (invite-only). Nové uživatele zvou Executive nebo Project Manager z admin sekce. Pozvánka platí 72 hodin.

**5 systémových rolí:** Executive · Project Manager · Team Member · Service Desk Agent · Reader

---

## Technický popis

### Tech Stack

| Vrstva | Technologie |
|--------|-------------|
| Backend | Laravel 13 (PHP 8.4), Inertia.js v2 |
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vite 6 |
| DB | PostgreSQL 17 (UUIDv7 PK, JSONB) |
| Cache/Queues | Redis dual (cache allkeys-lru + data noeviction), Horizon |
| Auth | Laravel Socialite (Google SSO) |
| Infra | Docker Compose (8 kontejnerů), Caddy (reverse proxy + TLS), PHP-FPM |
| CI | GitHub Actions (Pint + PHPStan + ESLint + Prettier + testy + Vite build) |

### Architektura

Modulární monolit s 9 doménovými moduly:

```
app/Modules/
  Auth/           — Google SSO, invite flow, login/logout
  Organization/   — Division, Team, Tribe, User management
  Projects/       — Projekty CRUD, membership, export
  Work/           — Epiky, úkoly, kanban, tabulka, dependencies, recurrence
  Approvals/      — Approval requesty, hlasování, analytics
  Notifications/  — In-app (DB) + email notifikace
  Audit/          — Append-only audit trail, PHI klasifikace a access guard
  Comments/       — Polymorfní threaded komentáře
  Files/          — Polymorfní přílohy, upload/download, PHI guard
```

### Infrastruktura (Docker)

| Kontejner | Image | Účel |
|-----------|-------|------|
| app | PHP 8.4-FPM Alpine | Hlavní aplikace |
| worker | Horizon | Queue processing |
| scheduler | Laravel Scheduler | Cron úlohy (recurring tasks) |
| caddy | Caddy 2 Alpine | Reverse proxy, TLS |
| postgres | PostgreSQL 17 Alpine | Databáze |
| redis-cache | Redis 7 Alpine | Cache (allkeys-lru) |
| redis-data | Redis 7 Alpine | Sessions + queues (noeviction) |
| mailpit | Mailpit | Email testing (dev) |

### Production Deployment

Běží na **FORPSI Standard VPS** (4 vCPU, 8 GB RAM, 80 GB NVMe, ~295 Kč/měs).

- **Live:** http://194-182-78-7.nip.io (testovací, bez TLS)
- Automatický deploy přes GitHub Actions po merge do master
- Caddy reverse proxy se security headers (HSTS po nastavení domény)
- Google SSO autentizace
- Průvodce: [`docs/runbooks/forpsi-setup.md`](docs/runbooks/forpsi-setup.md)

### Dokumentace

| Dokument | Obsah |
|----------|-------|
| [`docs/status.md`](docs/status.md) | Aktuální stav implementace |
| [`docs/dev-workflow.md`](docs/dev-workflow.md) | Průvodce lokálním vývojem |
| [`docs/runbooks/forpsi-setup.md`](docs/runbooks/forpsi-setup.md) | FORPSI VPS setup (12 kroků) |
| [`docs/runbooks/deploy.md`](docs/runbooks/deploy.md) | Deploy, CD pipeline, rollback |
| [`docs/runbooks/backup-restore.md`](docs/runbooks/backup-restore.md) | Zálohy a obnova |
| [`docs/architecture/phi-scope-matrix.md`](docs/architecture/phi-scope-matrix.md) | PHI access pravidla |
| [`docs/design/`](docs/design/) | Design systém, tokeny, page patterns |
| [`CLAUDE.md`](CLAUDE.md) | Instrukce pro Claude Code agenty |

## License

MIT — Jan Melicherik 2026
