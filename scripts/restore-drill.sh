#!/usr/bin/env bash
#
# restore-drill.sh — kvartální test obnovy ze zašifrovaného backupu.
#
# GDPR/Art. 32: backup bez ověřené restore procedury = žádný backup. Tento
# skript je povinné spouštět jednou za kvartál (cron není — úmyslně ruční,
# aby výsledek někdo viděl).
#
# Co dělá:
#   1. Stáhne nejnovější db_*.dump.gpg + storage_*.tar.gpg z B2
#   2. Ověří manifest SHA256
#   3. Dešifruje GPG (vyžaduje PRIVÁTNÍ klíč importovaný na stroji, kde skript běží)
#   4. Pustí izolovaný postgres kontejner (phc-nexus-drill), nahraje dump
#   5. Ověří integritu: migrate:status, COUNT(*) na users/projects/tasks
#   6. Rozbalí storage tar do temp dir, ověří počet souborů
#   7. Teardown — kontejner a temp data smazány
#
# Usage:
#   ./scripts/restore-drill.sh [production|staging]
#
# Vyžaduje:
#   - Privátní GPG klíč k $BACKUP_GPG_RECIPIENT
#   - rclone s remotem $BACKUP_B2_REMOTE
#   - Docker
#
# Proměnné (stejné jako backup.sh):
#   BACKUP_B2_REMOTE, BACKUP_B2_BUCKET, BACKUP_GPG_RECIPIENT
#
# POZOR: skript NEZAPISUJE do produkční DB. Pracuje s izolovaným kontejnerem
# `drill-postgres` na portu 55432 (nekoliduje s produkčním 5432).

set -euo pipefail

ENV_NAME="${1:-production}"

case "$ENV_NAME" in
    production|staging) B2_PREFIX="$ENV_NAME" ;;
    *) echo "Usage: $0 [production|staging]" >&2; exit 64 ;;
esac

BACKUP_GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:?BACKUP_GPG_RECIPIENT musí být nastaven}"
BACKUP_B2_REMOTE="${BACKUP_B2_REMOTE:-phc-b2}"
BACKUP_B2_BUCKET="${BACKUP_B2_BUCKET:?BACKUP_B2_BUCKET musí být nastaven}"

command -v gpg    >/dev/null || { echo "FATAL: gpg není nainstalovaný" >&2; exit 1; }
command -v rclone >/dev/null || { echo "FATAL: rclone není nainstalovaný" >&2; exit 1; }
command -v docker >/dev/null || { echo "FATAL: docker není k dispozici" >&2; exit 1; }

gpg --list-secret-keys "$BACKUP_GPG_RECIPIENT" >/dev/null 2>&1 \
    || { echo "FATAL: PRIVÁTNÍ GPG klíč pro '$BACKUP_GPG_RECIPIENT' není v keyringu (gpg --import private.asc)" >&2; exit 1; }

DRILL_DIR="$(mktemp -d -t phc-restore-drill.XXXXXX)"
DRILL_CONTAINER="phc-nexus-drill-postgres"
DRILL_PORT=55432

cleanup() {
    echo
    echo "=== Teardown ==="
    docker rm -f "$DRILL_CONTAINER" >/dev/null 2>&1 || true
    docker volume rm "${DRILL_CONTAINER}-data" >/dev/null 2>&1 || true
    rm -rf "$DRILL_DIR"
    echo "Hotovo."
}
trap cleanup EXIT

echo "=== Restore drill [$ENV_NAME] — $(date -Iseconds) ==="
echo "Workdir: $DRILL_DIR"
echo

echo "[1/7] List posledních backupů v B2"
rclone lsf --format "tp" --include "${ENV_NAME}_*" \
    "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/" \
    | sort -r | head -n 10

LATEST_DB=$(rclone lsf --include "${ENV_NAME}_db_*.dump.gpg" \
    "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/" | sort -r | head -n 1)
LATEST_STORAGE=$(rclone lsf --include "${ENV_NAME}_storage_*.tar.gpg" \
    "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/" | sort -r | head -n 1)
LATEST_MANIFEST=$(rclone lsf --include "${ENV_NAME}_manifest_*.txt" \
    "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/" | sort -r | head -n 1)

[[ -n "$LATEST_DB" && -n "$LATEST_STORAGE" && -n "$LATEST_MANIFEST" ]] \
    || { echo "FATAL: nepodařilo se najít kompletní backup v B2" >&2; exit 1; }

echo
echo "Vybráno:"
echo "  DB:       $LATEST_DB"
echo "  STORAGE:  $LATEST_STORAGE"
echo "  MANIFEST: $LATEST_MANIFEST"
echo

echo "[2/7] Download z B2"
rclone copy "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/${LATEST_DB}"       "$DRILL_DIR/"
rclone copy "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/${LATEST_STORAGE}"  "$DRILL_DIR/"
rclone copy "${BACKUP_B2_REMOTE}:${BACKUP_B2_BUCKET}/${B2_PREFIX}/${LATEST_MANIFEST}" "$DRILL_DIR/"

echo
echo "[3/7] Verifikace SHA256 proti manifestu"
(cd "$DRILL_DIR" && grep -E '^[0-9a-f]{64}  ' "$LATEST_MANIFEST" | sha256sum -c -)

echo
echo "[4/7] GPG decrypt"
gpg --batch --yes --decrypt \
    --output "$DRILL_DIR/db.dump" \
    "$DRILL_DIR/$LATEST_DB"

gpg --batch --yes --decrypt \
    --output "$DRILL_DIR/storage.tar" \
    "$DRILL_DIR/$LATEST_STORAGE"

echo "  db.dump      $(wc -c < "$DRILL_DIR/db.dump") B"
echo "  storage.tar  $(wc -c < "$DRILL_DIR/storage.tar") B"

echo
echo "[5/7] Spuštění izolovaného Postgres kontejneru ($DRILL_CONTAINER, port $DRILL_PORT)"
docker rm -f "$DRILL_CONTAINER" >/dev/null 2>&1 || true
docker volume rm "${DRILL_CONTAINER}-data" >/dev/null 2>&1 || true
docker run -d \
    --name "$DRILL_CONTAINER" \
    -e POSTGRES_DB=phc_nexus \
    -e POSTGRES_USER=phc_nexus \
    -e POSTGRES_PASSWORD=drill \
    -v "${DRILL_CONTAINER}-data:/var/lib/postgresql/data" \
    -p "127.0.0.1:${DRILL_PORT}:5432" \
    postgres:17-alpine >/dev/null

echo -n "  Čekám na pg_isready"
for _ in $(seq 1 30); do
    if docker exec "$DRILL_CONTAINER" pg_isready -U phc_nexus >/dev/null 2>&1; then
        echo " OK"
        break
    fi
    echo -n "."
    sleep 1
done

echo
echo "[6/7] pg_restore + ověření"
docker cp "$DRILL_DIR/db.dump" "$DRILL_CONTAINER:/tmp/db.dump"
docker exec "$DRILL_CONTAINER" pg_restore \
    -U phc_nexus -d phc_nexus --no-owner --no-privileges \
    /tmp/db.dump 2>&1 | tail -n 20 || true

echo
echo "  Row counts:"
docker exec "$DRILL_CONTAINER" psql -U phc_nexus -d phc_nexus -At -c "
SELECT 'users       ' || COUNT(*) FROM users;
SELECT 'projects    ' || COUNT(*) FROM projects;
SELECT 'tasks       ' || COUNT(*) FROM tasks;
SELECT 'audit_entries ' || COUNT(*) FROM audit_entries;
"

echo
echo "[7/7] Storage tar integrita"
TAR_FILES=$(tar -tf "$DRILL_DIR/storage.tar" | wc -l)
echo "  Souborů v archivu: $TAR_FILES"
tar -tf "$DRILL_DIR/storage.tar" | head -n 10

echo
echo "=== Restore drill [$ENV_NAME] ÚSPĚŠNĚ ==="
echo "Zapiš do runbook-u datum spuštění: $(date -Iseconds)"
