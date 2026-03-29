# PHC Nexus — Development Workflow

Praktický průvodce lokálním vývojem. Vše běží v kontejnerech — žádné lokální PHP, Node ani Postgres instalace.

---

## Prerequisites

- **Docker Desktop** (nebo OrbStack na macOS)
- **Git**
- **GitHub CLI** (`gh`) — pro PR workflow
- Editor (VS Code / Cursor doporučen)

---

## Quick Start

```bash
# 1. Klonování
git clone git@github.com:<org>/phc-nexus.git
cd phc-nexus

# 2. Environment
cp .env.example .env

# 3. Start (dev mode — s hot reload a dev volumes)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 4. První setup (migrace + seed)
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan key:generate
```

Po startu:

| Služba | URL |
|--------|-----|
| Aplikace | https://localhost |
| Horizon (queue dashboard) | https://localhost/horizon |
| Telescope (debug, dev only) | https://localhost/telescope |
| Mailpit (email testing) | http://localhost:8025 |

---

## Architektura kontejnerů

```
┌─────────────────────────────────────────────────┐
│                    caddy                         │
│           (reverse proxy + TLS)                  │
│              :443 / :80                          │
└──────────┬──────────────────────────────────────┘
           │
┌──────────▼──────────┐  ┌──────────────────────┐
│        app           │  │       worker          │
│     (PHP-FPM)        │  │   (queue:work via     │
│    Inertia pages     │  │    Horizon)           │
│      :9000           │  │                       │
└──────────────────────┘  └───────────────────────┘
                          ┌───────────────────────┐
                          │      scheduler         │
                          │  (schedule:run loop)   │
                          └───────────────────────┘

┌──────────────────────┐
│        vite           │
│   (Vite dev server)   │
│   HMR :5173           │
└──────────────────────┘

┌──────────────────────┐  ┌──────────┐  ┌──────────┐
│      postgres         │  │redis-cache│  │redis-data│
│   PostgreSQL 17       │  │allkeys-lru│  │noeviction│
│      :5432            │  │   :6379   │  │   :6380  │
└──────────────────────┘  └──────────┘  └──────────┘
```

Všechny `app`/`worker`/`scheduler` používají **stejný Docker image** — liší se jen `CMD`.

---

## Environment

- `.env.example` — šablona (commitovaná)
- `.env` — lokální konfigurace (gitignored)
- Klíčové proměnné: `DB_*`, `REDIS_*`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_KEY`

---

## Denní příkazy

### Backend

```bash
# Artisan
docker compose exec app php artisan <command>
docker compose exec app php artisan migrate
docker compose exec app php artisan migrate:rollback
docker compose exec app php artisan tinker
docker compose exec app php artisan make:model <Name> -mf

# Testy
docker compose exec app php artisan test
docker compose exec app php artisan test --filter=<Module>

# Static analysis
docker compose exec app ./vendor/bin/phpstan analyse
docker compose exec app ./vendor/bin/pint
docker compose exec app ./vendor/bin/pint --test   # dry-run
```

### Frontend

```bash
# Vite HMR — běží automaticky v kontejneru `vite`
# Logy Vite dev serveru:
docker compose logs -f vite

# Pokud potřebuješ reinstall node_modules v kontejneru:
docker compose exec vite npm install

# Production build (mimo Docker)
npm run build

# Testy
npx vitest run
npx vitest run --reporter=verbose

# Lint & typecheck
npx eslint .
npx tsc --noEmit
```

> **Vite HMR v Dockeru:** Kontejner `vite` automaticky spouští `npm run dev` na portu 5173. Caddy proxyuje Vite requesty (`/@vite/*`, `/@id/*` atd.) na `vite:5173` včetně WebSocket pro HMR. Při změně `.tsx`/`.css` souborů se stránka automaticky aktualizuje bez reloadu.

### Logy & debugging

```bash
docker compose logs -f app
docker compose logs -f worker
docker compose logs -f scheduler
docker compose exec app php artisan telescope:clear
```

---

## Migrace

```bash
# Vytvořit migraci
docker compose exec app php artisan make:migration create_<table>_table

# Spustit
docker compose exec app php artisan migrate

# Rollback
docker compose exec app php artisan migrate:rollback

# Fresh reset (jen dev!)
docker compose exec app php artisan migrate:fresh --seed
```

Konvence: UUIDv7 jako PK, timestamp sloupce, soft deletes kde vhodné.

---

## Jak přidat nový modul

1. Vytvořit strukturu v `app/Modules/<Name>/` (nebo použít `/scaffold`)
2. Přidat `ServiceProvider` a registrovat v `config/app.php`
3. Vytvořit routes v `app/Modules/<Name>/Routes/web.php`
4. Přidat migrace s prefixem modulu
5. Vytvořit Inertia pages v `resources/js/Pages/<Name>/`
6. Přidat Policy a registrovat v `AuthServiceProvider`
7. Napsat feature testy v `tests/Feature/<Name>/`

---

## Jak přidat Inertia stránku

1. Controller action vracející `Inertia::render('<Module>/<Page>', $props)`
2. React komponenta v `resources/js/Pages/<Module>/<Page>.tsx`
3. TypeScript interface pro props
4. Route v module routes souboru
5. Autorizace přes middleware nebo Policy
6. Sledovat vzory z `docs/design/page-patterns.md`

---

## Git workflow

```bash
# Nová feature
git checkout -b feat/<module>-<popis>
# ... práce ...
git add <soubory>
git commit -m "feat(<module>): popis změny"
git push -u origin feat/<module>-<popis>
gh pr create

# Po merge
git checkout main
git pull
git branch -d feat/<module>-<popis>
```

- Branch žije 1–3 dny
- Conventional Commits: `feat|fix|chore|docs|refactor(scope): summary`
- Squash merge do `main`
- PR: 300–600 řádků diffu

---

## Deployment flow

```
local (dev)                              production (VPS)
docker compose                           docker compose
  -f docker-compose.yml                    -f docker-compose.yml
  -f docker-compose.dev.yml                -f docker-compose.prod.yml
  up -d                                    up -d
```

### Lokální dev
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`
- Bind mounts (živé soubory), Vite HMR, self-signed TLS na `localhost`

### Produkce (FORPSI VPS)
```bash
cd /opt/phc-nexus
git checkout master && git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker volume rm phc-nexus_app-public 2>/dev/null   # vynutí čerstvý sync assets
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

- Named volume `app-public` sdílí Vite build assets mezi `app` a `caddy`
- Entrypoint (`docker/entrypoint.sh`) synchronizuje `public/` z image do volume při každém startu
- PHP-FPM master běží jako root (privilege drop přes `user/group` v pool configu)
- Caddy: auto-TLS (Let's Encrypt) pro `phc-nexus.eu`
- CI (GitHub Actions) spouští deploy automaticky po merge do `master`
- Hotfix: branch z `master` → `fix/...` → expedited review → merge → auto deploy

---

## Troubleshooting

| Problém | Řešení |
|---------|--------|
| Kontejner nenaběhne | `docker compose logs <service>`, ověřit `.env`, volné porty |
| Migrace selhává | Ověřit že `postgres` container je healthy: `docker compose ps` |
| Vite HMR nefunguje | `docker compose logs vite`, ověřit port 5173, `docker compose restart vite` |
| Queue nezpracovává | Zkontrolovat worker logy, ověřit `redis-data` je up |
| Testy padají na DB | `docker compose exec app php artisan migrate:fresh --env=testing` |
| Pomalý build | Ověřit `.dockerignore`, zvážit OrbStack místo Docker Desktop |
| Produkce má staré CSS/JS | `docker volume rm phc-nexus_app-public` a rebuild — entrypoint sync nakopíruje čerstvé assets |
| FPM Permission denied | Ověřit že `USER appuser` není v Dockerfile — FPM master musí běžet jako root |
| ERR_SSL_PROTOCOL_ERROR | Ověřit že produkce používá `-f docker-compose.prod.yml` (Caddyfile.prod, ne dev) |
