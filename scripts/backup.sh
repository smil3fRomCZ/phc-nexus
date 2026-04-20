#!/usr/bin/env bash
#
# backup.sh — GPG-šifrovaný off-site backup PHC Nexus.
#
# Co dělá:
#   1. pg_dump PostgreSQL (custom format) → GPG encrypt → $BACKUP_DIR/db_<ts>.dump.gpg
#   2. tar storage volume (přílohy, avatary, wiki soubory) → GPG → storage_<ts>.tar.gpg
#   3. Manifest se SHA256 checksumy → manifest_<ts>.txt
#   4. rclone upload všech 3 souborů do B2 (off-site)
#   5. Cleanup lokálních artefaktů starších než $BACKUP_LOCAL_RETENTION_DAYS dní
#
# Usage (na VPS, z /opt/phc-nexus nebo přes cron):
#   ./scripts/backup.sh [production|staging]
#
# Env (z .env nebo exportováno do shellu):
#   BACKUP_DIR                      — lokální staging dir (default /opt/backups)
#   BACKUP_GPG_RECIPIENT            — email v GPG keyring (required)
#   BACKUP_LOCAL_RETENTION_DAYS     — lokální retence (default 7)
#   BACKUP_B2_REMOTE                — rclone remote name (default phc-b2)
#   BACKUP_B2_BUCKET                — B2 bucket (required, pokud není SKIP_UPLOAD)
#   BACKUP_SKIP_UPLOAD              — "1" → jen lokální (pro test bez B2)
#   POSTGRES_USER / POSTGRES_DB     — default phc_nexus (čte z .env přes docker compose)
#
# Cron (viz docs/runbooks/backup-restore.md):
#   0 2 * * * /opt/phc-nexus/scripts/backup.sh production >> /var/log/phc-backup.log 2>&1
#
# Privátní GPG klíč NIKDY na VPS — držet offline (password manager). Dešifrování
# backupu je možné jen na stroji, kde je privátní klíč importovaný. Viz
# scripts/restore-drill.sh pro restore test.

set -euo pipefail

ENV_NAME="${1:-production}"

case "$ENV_NAME" in
    production)
        PROJECT_DIR="${PROJECT_DIR:-/opt/phc-nexus}"
        COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-phc-nexus}"
        COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)
        ENV_FILE=".env"
        B2_PREFIX="${ENV_NAME}"
        ;;
    staging)
        PROJECT_DIR="${PROJECT_DIR:-/opt/phc-nexus-staging}"
        COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-phc-nexus-staging}"
        COMPOSE_FILES=(-f docker-compose.staging.yml)
        ENV_FILE=".env.staging"
        B2_PREFIX="${ENV_NAME}"
        ;;
    *)
        echo "Usage: $0 [production|staging]" >&2
        exit 64
        ;;
esac

cd "$PROJECT_DIR"

# .env obsahuje BACKUP_* a POSTGRES_* proměnné — zdrojujeme bez override
# shell env (pokud volající nastavil proměnné ručně, mají přednost).
if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    . <(grep -E '^(BACKUP_|POSTGRES_)' "$ENV_FILE" || true)
    set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
BACKUP_GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:?BACKUP_GPG_RECIPIENT musí být nastaven (email v GPG keyring)}"
BACKUP_LOCAL_RETENTION_DAYS="${BACKUP_LOCAL_RETENTION_DAYS:-7}"
BACKUP_B2_REMOTE="${BACKUP_B2_REMOTE:-phc-b2}"
BACKUP_B2_BUCKET="${BACKUP_B2_BUCKET:-}"
BACKUP_SKIP_UPLOAD="${BACKUP_SKIP_UPLOAD:-0}"
POSTGRES_USER="${POSTGRES_USER:-phc_nexus}"
POSTGRES_DB="${POSTGRES_DB:-phc_nexus}"

command -v gpg    >/dev/null || { echo "FATAL: gpg není nainstalovaný (apt install gnupg)" >&2; exit 1; }
command -v docker >/dev/null || { echo "FATAL: docker není k dispozici" >&2; exit 1; }

if [[ "$BACKUP_SKIP_UPLOAD" != "1" ]]; then
    command -v rclone >/dev/null || { echo "FATAL: rclone není nainstalovaný (apt install rclone)" >&2; exit 1; }
    [[ -n "$BACKUP_B2_BUCKET" ]] || { echo "FATAL: BACKUP_B2_BUCKET musí být nastaven (nebo BACKUP_SKIP_UPLOAD=1)" >&2; exit 1; }
fi

gpg --list-keys "$BACKUP_GPG_RECIPIENT" >/dev/null 2>&1 \
    || { echo "FATAL: GPG public key pro '$BACKUP_GPG_RECIPIENT' není v keyringu (gpg --import ...)" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
TS="$(date +%Y%m%d_%H%M%S)"
DB_FILE="$BACKUP_DIR/${ENV_NAME}_db_${TS}.dump.gpg"
STORAGE_FILE="$BACKUP_DIR/${ENV_NAME}_storage_${TS}.tar.gpg"
MANIFEST="$BACKUP_DIR/${ENV_NAME}_manifest_${TS}.txt"

echo "=== PHC Nexus backup [$ENV_NAME] $TS ==="
echo "Project dir: $PROJECT_DIR"
echo "Backup dir:  $BACKUP_DIR"
echo "Recipient:   $BACKUP_GPG_RECIPIENT"
echo "B2:          ${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/ $([[ "$BACKUP_SKIP_UPLOAD" == "1" ]] && echo '(SKIP)')"
echo

if ! COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" \
    docker compose "${COMPOSE_FILES[@]}" ps --status=running --services 2>/dev/null | grep -q '^postgres$'; then
    echo "FATAL: postgres kontejner neběží v projektu $COMPOSE_PROJECT_NAME" >&2
    exit 1
fi

echo "[1/4] pg_dump → GPG → $(basename "$DB_FILE")"
COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" \
    docker compose "${COMPOSE_FILES[@]}" exec -T postgres \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
    | gpg --batch --yes --encrypt \
          --recipient "$BACKUP_GPG_RECIPIENT" \
          --trust-model always \
          --output "$DB_FILE"

echo "[2/4] tar storage → GPG → $(basename "$STORAGE_FILE")"
VOLUME_NAME="${COMPOSE_PROJECT_NAME}_app-storage"
if ! docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
    echo "FATAL: Docker volume $VOLUME_NAME neexistuje" >&2
    exit 1
fi
docker run --rm -v "$VOLUME_NAME:/storage:ro" alpine:3 \
    tar -cf - -C /storage . \
    | gpg --batch --yes --encrypt \
          --recipient "$BACKUP_GPG_RECIPIENT" \
          --trust-model always \
          --output "$STORAGE_FILE"

echo "[3/4] manifest → $(basename "$MANIFEST")"
{
    echo "# PHC Nexus backup manifest"
    echo "# env:       $ENV_NAME"
    echo "# timestamp: $TS"
    echo "# host:      $(hostname)"
    echo "# recipient: $BACKUP_GPG_RECIPIENT"
    echo "# files:"
    (cd "$BACKUP_DIR" && sha256sum "$(basename "$DB_FILE")" "$(basename "$STORAGE_FILE")")
} > "$MANIFEST"
cat "$MANIFEST"
echo

if [[ "$BACKUP_SKIP_UPLOAD" == "1" ]]; then
    echo "[4/4] Upload přeskočen (BACKUP_SKIP_UPLOAD=1)"
else
    echo "[4/4] rclone → ${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/"
    rclone copy "$DB_FILE"      "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/" --stats-one-line
    rclone copy "$STORAGE_FILE" "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/" --stats-one-line
    rclone copy "$MANIFEST"     "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/" --stats-one-line
fi

echo
echo "=== Cleanup lokálních souborů starších než $BACKUP_LOCAL_RETENTION_DAYS dní ==="
find "$BACKUP_DIR" -maxdepth 1 -type f \
    \( -name "${ENV_NAME}_db_*.dump.gpg" \
    -o -name "${ENV_NAME}_storage_*.tar.gpg" \
    -o -name "${ENV_NAME}_manifest_*.txt" \) \
    -mtime +"$BACKUP_LOCAL_RETENTION_DAYS" -print -delete

echo
echo "=== Backup [$ENV_NAME] $TS hotov ==="
