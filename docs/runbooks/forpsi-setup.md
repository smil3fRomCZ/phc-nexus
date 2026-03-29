# PHC Nexus — FORPSI VPS Setup Guide

Krok-za-krokem průvodce nasazením na FORPSI Standard VPS (4 vCPU, 8 GB RAM, 80 GB NVMe).

---

## 1. Objednávka VPS

1. Objednat na [forpsi.com/virtual](https://www.forpsi.com/virtual/)
2. Tarif: **Standard** (4 vCPU, 8 GB RAM, 80 GB NVMe, 50 TB traffic)
3. OS: **Ubuntu 24.04 LTS**
4. Fakturace: měsíční (295 Kč bez DPH)

Po aktivaci obdržíš IP adresu a root přihlašovací údaje.

---

## 2. Přístup a zabezpečení SSH

```bash
# Přihlášení jako root
ssh root@<IP_ADRESA>

# Vytvořit deploy uživatele
adduser deploy
usermod -aG sudo deploy

# Nastavit SSH klíč (ze svého počítače)
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@<IP_ADRESA>

# Zakázat password auth
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd
```

> **Ověření:** `ssh deploy@<IP_ADRESA>` musí fungovat bez hesla.

---

## 3. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt + redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

Ostatní porty (5432, 6379, 6380) zůstávají uzavřeny — přístupné pouze mezi kontejnery.

---

## 4. Docker + Docker Compose

```bash
# Docker (oficiální repozitář)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy

# Odhlásit a přihlásit znovu (pro novou skupinu)
exit
ssh deploy@<IP_ADRESA>

# Ověření
docker --version
docker compose version
```

Požadavky: Docker 24+, Docker Compose v2.

---

## 5. Klonování repozitáře

```bash
sudo mkdir -p /opt/phc-nexus
sudo chown deploy:deploy /opt/phc-nexus

# SSH deploy klíč pro GitHub (read-only)
ssh-keygen -t ed25519 -C "deploy@phc-nexus" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub
# → Přidat jako Deploy Key v GitHub repozitáři (Settings → Deploy keys)

# Klonování
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_deploy" git clone git@github.com:smil3fRomCZ/phc-nexus.git /opt/phc-nexus
cd /opt/phc-nexus
```

---

## 6. Konfigurace .env

```bash
cp .env.production.example .env
nano .env
```

Povinné změny:

| Proměnná | Co nastavit |
|----------|-------------|
| `APP_KEY` | Vygeneruje se v kroku 8 |
| `APP_URL` | `https://phc-nexus.eu` |
| `DB_PASSWORD` | Silné heslo (32+ znaků) |
| `REDIS_CACHE_PASSWORD` | Silné heslo |
| `REDIS_DATA_PASSWORD` | Silné heslo |
| `GOOGLE_CLIENT_ID` | Z Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Z Google Cloud Console |
| `MAIL_HOST` | SMTP server (SendGrid, O365, vlastní) |
| `MAIL_USERNAME` | SMTP uživatel |
| `MAIL_PASSWORD` | SMTP heslo |
| `DOMAIN` | `phc-nexus.eu` |

---

## 7. Google OAuth

1. Otevřít [Google Cloud Console](https://console.cloud.google.com/)
2. Vytvořit projekt nebo vybrat existující
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized redirect URIs: `https://phc-nexus.eu/auth/google/callback`
6. Zkopírovat Client ID a Client Secret do `.env`

---

## 8. DNS

Přidat A záznam u registrátora domény:

```
phc-nexus.eu.  A  <IP_ADRESA>
```

> **Důležité:** DNS musí být nastaveno **před** prvním startem — Caddy potřebuje ověřit doménu pro Let's Encrypt certifikát.

Ověření: `dig phc-nexus.eu +short` → musí vrátit IP adresu serveru.

---

## 9. Build a první start

```bash
cd /opt/phc-nexus

# Build
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Počkat na healthy PostgreSQL (~10s)
docker compose ps

# Vygenerovat app key
docker compose exec app php artisan key:generate --force

# Migrace
docker compose exec app php artisan migrate --force

# Seed data (demo uživatelé, projekty)
docker compose exec app php artisan db:seed --force

# Cache
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
```

---

## 10. Verifikace

```bash
# Všechny kontejnery běží
docker compose ps
# Očekáváno: 7 kontejnerů (app, worker, scheduler, caddy, postgres, redis-cache, redis-data)

# Health check
curl -sf https://phc-nexus.eu/up && echo " OK"

# Horizon
docker compose exec app php artisan horizon:status

# Certifikát (TLS)
echo | openssl s_client -connect phc-nexus.eu:443 2>/dev/null | head -5

# Logy bez chyb
docker compose logs --tail=20 app
```

Otevřít v prohlížeči: **https://phc-nexus.eu** → login přes Google SSO.

---

## 11. GitHub Actions CD

Pro automatický deploy po merge do master:

1. V GitHub repozitáři: **Settings → Secrets and variables → Actions**
2. Přidat secrets:

| Secret | Hodnota |
|--------|---------|
| `VPS_HOST` | IP adresa serveru |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Obsah `~/.ssh/github_deploy` (privátní klíč) |
| `DOMAIN` | `phc-nexus.eu` |

3. V **Settings → Environments** vytvořit environment `production`

---

## 12. Zálohy

Nastavit dle `docs/runbooks/backup-restore.md`:

```bash
# Cron pro denní zálohy (jako deploy uživatel)
crontab -e

# PostgreSQL dump — denně 2:00
0 2 * * * docker compose -C /opt/phc-nexus exec -T postgres pg_dump -U phc_nexus phc_nexus | gzip > /opt/backups/db/phc_nexus_$(date +\%Y\%m\%d).sql.gz

# Cleanup starších než 30 dní
0 3 * * * find /opt/backups/db -name "*.sql.gz" -mtime +30 -delete
```

```bash
# Vytvořit backup adresář
sudo mkdir -p /opt/backups/db
sudo chown deploy:deploy /opt/backups
```

---

## Troubleshooting

| Problém | Řešení |
|---------|--------|
| Caddy nemůže získat certifikát | DNS A záznam nesměřuje na server, port 80/443 blokován |
| `502 Bad Gateway` | `docker compose logs app` — PHP-FPM neběží |
| Migrace padá | `docker compose logs postgres` — DB není healthy |
| Horizon nezpracovává | `docker compose logs worker` — Redis nedostupný |
| Google login nefunguje | Ověřit callback URL v Google Console, CLIENT_ID/SECRET v .env |
| Health check fails | `docker compose exec app php artisan up` — app je v maintenance mode |

---

## Údržba

```bash
# Logy
docker compose logs -f app
docker compose logs -f worker

# Restart služby
docker compose restart app

# Aktualizace Docker images
docker compose pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Disk usage
df -h
docker system df
docker system prune -f  # smazat nepoužívané images/volumes
```
