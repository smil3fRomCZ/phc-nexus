# Deploy Runbook — PHC Nexus

Krok-za-krokem nasazení na VPS (Ubuntu 22.04+). Stejný Docker image pro všechna prostředí.

---

## Prerequisites na serveru

- Docker Engine 24+ a Docker Compose v2
- Git přístup k repozitáři (deploy key nebo token)
- Doména nasměrovaná na server (DNS A záznam)
- Porty 80 a 443 otevřené

---

## 1. Příprava serveru (jednorázově)

```bash
# Nainstalovat Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Vytvořit adresář aplikace
sudo mkdir -p /opt/phc-nexus
sudo chown $USER:$USER /opt/phc-nexus

# Klonovat repozitář
cd /opt/phc-nexus
git clone git@github.com:smil3fRomCZ/phc-nexus.git .
```

---

## 2. Konfigurace prostředí

```bash
cp .env.example .env
```

Upravit `.env` — minimálně:

```env
APP_NAME="PHC Nexus"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://phc-nexus.eu

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=phc_nexus
DB_USERNAME=phc_nexus
DB_PASSWORD=<silné-heslo>

REDIS_HOST=redis-data
REDIS_CACHE_HOST=redis-cache

MAIL_MAILER=smtp
MAIL_HOST=<smtp-server>
MAIL_PORT=587
MAIL_USERNAME=<smtp-user>
MAIL_PASSWORD=<smtp-password>
MAIL_FROM_ADDRESS=nexus@phc-nexus.eu

GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
GOOGLE_REDIRECT_URI=https://phc-nexus.eu/auth/google/callback
```

---

## 3. Produkční Caddyfile

Soubor `docker/caddy/Caddyfile.prod` je součástí repozitáře. Doména je konfigurovatelná přes env var `DOMAIN` (default: `phc-nexus.eu`).

Pro změnu domény stačí nastavit v `.env`:
```env
DOMAIN=moje-domena.cz
```

Caddy automaticky zajistí TLS přes Let's Encrypt. Používá `php_fastcgi` (FastCGI protokol pro PHP-FPM), ne `reverse_proxy`.

> **Pozor:** DNS A záznam musí směřovat na IP serveru **před** prvním startem — Caddy potřebuje ověřit doménu pro Let's Encrypt.

---

## 4. Build a start

```bash
# Build image
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start služeb
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Počkat na healthy postgres
docker compose exec app php artisan migrate --force

# Seed (pouze první deploy)
docker compose exec app php artisan db:seed --force

# Vygenerovat app key (pouze první deploy)
docker compose exec app php artisan key:generate --force
```

---

## 5. Verifikace po deployi

```bash
# Zdraví kontejnerů
docker compose ps

# Aplikace odpovídá
curl -s -o /dev/null -w "%{http_code}" https://phc-nexus.eu/up

# Migrace proběhly
docker compose exec app php artisan migrate:status

# Horizon běží
docker compose exec app php artisan horizon:status

# Queue zpracovává joby
docker compose exec app php artisan queue:monitor default

# Logs bez errorů
docker compose logs --tail=50 app
```

---

## 6. Automatický deploy (GitHub Actions CD)

Po merge PR do `master` se automaticky spustí deploy workflow (`.github/workflows/deploy.yml`):

1. CI validace (testy, lint, build)
2. SSH na VPS → git pull → docker build → up -d
3. Migrace + cache clear + Horizon restart
4. Health check (`/up`)

### Potřebné GitHub Secrets

Nastavit v **Settings → Secrets and variables → Actions**:

| Secret | Popis | Příklad |
|--------|-------|---------|
| `VPS_HOST` | IP adresa nebo hostname serveru | `123.45.67.89` |
| `VPS_USER` | SSH uživatel | `deploy` |
| `VPS_SSH_KEY` | Privátní SSH klíč (Ed25519) | obsah `~/.ssh/id_ed25519` |
| `DOMAIN` | Produkční doména | `phc-nexus.eu` |

### Manuální spuštění

Deploy lze spustit i manuálně z GitHub UI: **Actions → Deploy → Run workflow**.

### Fallback (manuální deploy)

Pokud CD nefunguje, použij manuální postup níže.

---

## 7. Manuální update (fallback)

```bash
cd /opt/phc-nexus

# Stáhnout změny
git pull origin master

# Rebuild image
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Rolling restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Migrace
docker compose exec app php artisan migrate --force

# Vyčistit cache
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache

# Restartovat Horizon (nový kód)
docker compose exec app php artisan horizon:terminate
```

---

## 8. Rollback

```bash
# Vrátit na předchozí verzi
git checkout <předchozí-commit>

# Rebuild a restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rollback migrací (pokud potřeba — POZOR, destruktivní)
docker compose exec app php artisan migrate:rollback --step=1 --force
```

---

## Troubleshooting

| Problém | Řešení |
|---------|--------|
| 502 Bad Gateway | `docker compose logs app` — PHP-FPM neběží nebo padá |
| Migrace selhávají | `docker compose exec app php artisan migrate:status` — zkontrolovat stav |
| Horizon neběží | `docker compose restart worker` |
| TLS nefunguje | `docker compose logs caddy` — ověřit DNS a porty 80/443 |
| Queue joby se nehýbou | `docker compose exec app php artisan queue:retry all` |
