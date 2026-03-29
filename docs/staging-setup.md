# Staging Environment — Setup Guide

Jednorázový průvodce nastavením staging prostředí na FORPSI VPS.

## Předpoklady

- Produkce (`/opt/phc-nexus`) už běží
- DNS A záznam: `dev.phc-nexus.eu` → `194.182.78.7`
- SSH přístup na VPS

## 1. Klonování staging repozitáře

```bash
cd /opt
git clone <repo-url> phc-nexus-staging
cd phc-nexus-staging
```

## 2. Staging environment

```bash
cp .env.staging.example .env.staging
# Vyplnit: DB_PASSWORD, REDIS_PASSWORD, GOOGLE_CLIENT_ID/SECRET, APP_KEY
# APP_KEY vygenerovat po prvním spuštění (krok 5)
```

## 3. Sdílený Caddy adresář

```bash
mkdir -p /opt/phc-nexus-shared

# Zkopírovat Caddyfile
cp /opt/phc-nexus/docker/caddy/Caddyfile.shared /opt/phc-nexus-shared/Caddyfile

# Vytvořit docker-compose.caddy.yml
cat > /opt/phc-nexus-shared/docker-compose.caddy.yml <<'EOF'
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
      - prod-public:/var/www/html/public:ro
      - staging-public:/var/www/html/public-staging:ro
    environment:
      DOMAIN: ${DOMAIN:-phc-nexus.eu}
      STAGING_AUTH_USER: ${STAGING_AUTH_USER:-staging}
      STAGING_AUTH_HASH: ${STAGING_AUTH_HASH}
    networks:
      - prod-network
      - staging-network
    restart: unless-stopped

volumes:
  caddy-data:
  caddy-config:
  prod-public:
    external: true
    name: phc-nexus_app-public
  staging-public:
    external: true
    name: phc-nexus-staging_app-public

networks:
  prod-network:
    external: true
    name: phc-nexus_app-network
  staging-network:
    external: true
    name: phc-nexus-staging_app-network
EOF

# Vytvořit .env pro Caddy
cat > /opt/phc-nexus-shared/.env <<'EOF'
DOMAIN=phc-nexus.eu
STAGING_AUTH_USER=staging
STAGING_AUTH_HASH=CHANGE_ME
EOF
```

## 4. Vygenerovat basic auth hash pro staging

```bash
docker run --rm caddy:2-alpine caddy hash-password --plaintext 'vase-heslo'
# Výstup zkopírovat do /opt/phc-nexus-shared/.env jako STAGING_AUTH_HASH
```

## 5. Spuštění služeb (správné pořadí)

```bash
# 1. Zastavit stávající produkční Caddy (přesouváme do sdíleného)
cd /opt/phc-nexus
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# 2. Spustit produkci (bez Caddy — ten je teď sdílený)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. Spustit staging
cd /opt/phc-nexus-staging
COMPOSE_PROJECT_NAME=phc-nexus-staging docker compose -f docker-compose.staging.yml up -d

# 4. Vygenerovat APP_KEY pro staging
COMPOSE_PROJECT_NAME=phc-nexus-staging docker compose -f docker-compose.staging.yml exec app php artisan key:generate --force

# 5. Spustit migrace na stagingu
COMPOSE_PROJECT_NAME=phc-nexus-staging docker compose -f docker-compose.staging.yml exec app php artisan migrate --force

# 6. Spustit sdílený Caddy (po obou sítích existují)
cd /opt/phc-nexus-shared
docker compose -f docker-compose.caddy.yml up -d
```

## 6. Google OAuth pro staging

V Google Cloud Console přidat redirect URI:
```
https://dev.phc-nexus.eu/auth/google/callback
```

## 7. Ověření

```bash
# Staging
curl -sf https://dev.phc-nexus.eu/up
# → HTTP 200 (po basic auth)

# Produkce
curl -sf https://phc-nexus.eu/up
# → HTTP 200
```

## Synchronizace dat z produkce

```bash
cd /opt/phc-nexus-shared
/opt/phc-nexus/scripts/sync-db.sh
```

Skript automaticky:
1. Přepne staging do maintenance mode
2. Dumpne produkční DB
3. Obnoví do staging DB
4. Anonymizuje PHI data (jména, emaily, hesla)
5. Vyčistí sessions a cache
6. Zapne staging zpět

## Správa staging služeb

```bash
# Spustit s worker/scheduler (testování front)
cd /opt/phc-nexus-staging
COMPOSE_PROJECT_NAME=phc-nexus-staging docker compose -f docker-compose.staging.yml --profile full up -d

# Logy
COMPOSE_PROJECT_NAME=phc-nexus-staging docker compose -f docker-compose.staging.yml logs -f app

# Restart
COMPOSE_PROJECT_NAME=phc-nexus-staging docker compose -f docker-compose.staging.yml restart app

# Mailpit (zachycené emaily)
# http://<VPS-IP>:8026
```

## Troubleshooting

### Caddy nevidí staging kontejner
Ověřit, že staging síť existuje a Caddy je k ní připojen:
```bash
docker network ls | grep staging
docker inspect phc-nexus-shared-caddy-1 | grep Networks -A 20
```

### Staging app nenaběhne
Zkontrolovat logy a .env.staging:
```bash
COMPOSE_PROJECT_NAME=phc-nexus-staging docker compose -f docker-compose.staging.yml logs app
```

### TLS certifikát se nevystaví
Ověřit DNS: `dig dev.phc-nexus.eu` musí ukazovat na VPS IP. Let's Encrypt potřebuje přístup na port 80.
