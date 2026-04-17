#!/usr/bin/env bash
#
# rollback.sh — rychlý rollback na konkrétní image tag v GHCR.
#
# Usage (na VPS):
#   ./scripts/rollback.sh <image-tag> [staging|production]
#
# Image tag = ten, který vidíš na https://github.com/smil3fRomCZ/phc-nexus/pkgs/container/phc-nexus
# (např. sha-abc1234, latest).
#
# Skript:
#   1. Zapíše IMAGE_TAG=<tag> do .env / .env.staging
#   2. `docker compose pull` z GHCR
#   3. `docker compose up -d` — restart se starým tagem
#   4. Health check
#
# Nedělá migration rollback — pokud target tag vyžaduje jiné DB schema,
# musíš předtím ručně `php artisan migrate:rollback --step=N`.

set -euo pipefail

TAG="${1:-}"
ENV="${2:-production}"

if [[ -z "$TAG" ]]; then
    echo "Usage: $0 <image-tag> [staging|production]"
    echo "Example: $0 sha-abc1234 production"
    exit 64
fi

case "$ENV" in
    staging)
        cd /opt/phc-nexus-staging
        ENV_FILE=".env.staging"
        COMPOSE_FILES=(-f docker-compose.staging.yml)
        PROJECT_NAME="phc-nexus-staging"
        APP_URL_FILE=".env.staging"
        ;;
    production)
        cd /opt/phc-nexus
        ENV_FILE=".env"
        COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)
        PROJECT_NAME="phc-nexus"
        APP_URL_FILE=".env"
        ;;
    *)
        echo "Unknown environment: $ENV (use 'staging' or 'production')"
        exit 64
        ;;
esac

echo "=== Rollback $ENV → tag: $TAG ==="
echo "Working dir: $(pwd)"
echo

echo "[1/4] Updating $ENV_FILE"
if grep -q '^IMAGE_TAG=' "$ENV_FILE"; then
    sed -i.bak "s|^IMAGE_TAG=.*|IMAGE_TAG=$TAG|" "$ENV_FILE"
else
    echo "IMAGE_TAG=$TAG" >> "$ENV_FILE"
fi
grep '^IMAGE_TAG=' "$ENV_FILE"
echo

echo "[2/4] Pulling image z GHCR"
COMPOSE_PROJECT_NAME="$PROJECT_NAME" \
    docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" pull app worker scheduler
echo

echo "[3/4] Restart kontejnerů se starým tagem"
COMPOSE_PROJECT_NAME="$PROJECT_NAME" \
    docker compose --env-file "$ENV_FILE" "${COMPOSE_FILES[@]}" up -d
echo

echo "[4/4] Health check"
APP_URL=$(grep -oP '(?<=^APP_URL=).*' "$APP_URL_FILE")
if curl -sf --max-time 10 "$APP_URL/up" > /dev/null; then
    echo "OK — $APP_URL/up returned 200"
else
    echo "FAILED — $APP_URL/up neodpovídá!"
    echo "Zkontroluj logy: docker compose ${COMPOSE_FILES[*]} logs --tail=100 app"
    exit 1
fi
echo

echo "=== Rollback hotov. Tag $TAG je aktivní. ==="
echo "Horizon resetuj: docker compose exec app php artisan horizon:terminate"
