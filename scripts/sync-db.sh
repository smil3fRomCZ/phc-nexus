#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# sync-db.sh — Jednosměrná synchronizace produkční DB do stagingu
# Spouštět na VPS: cd /opt/phc-nexus-shared && ./scripts/sync-db.sh
#
# Co dělá:
#   1. pg_dump z produkční DB
#   2. Restore do staging DB
#   3. Anonymizace PHI dat (jména, emaily, hesla)
#   4. Vyčištění sessions a cache
# =============================================================================

PROD_PROJECT="phc-nexus"
STAGING_PROJECT="phc-nexus-staging"
PROD_DB="phc_nexus"
PROD_USER="phc_nexus"
STAGING_DB="phc_nexus_staging"
STAGING_USER="phc_nexus_staging"
DUMP_FILE="/tmp/phc_nexus_prod_dump.sql"

echo "=== [1/6] Přepnutí stagingu do maintenance mode ==="
docker compose -p "$STAGING_PROJECT" exec -T app php artisan down --retry=60 || true

echo "=== [2/6] Dump produkční databáze ==="
docker compose -p "$PROD_PROJECT" exec -T postgres \
  pg_dump -U "$PROD_USER" -d "$PROD_DB" --no-owner --no-acl > "$DUMP_FILE"
echo "    Velikost dumpu: $(du -h "$DUMP_FILE" | cut -f1)"

echo "=== [3/6] Drop a recreate staging databáze ==="
docker compose -p "$STAGING_PROJECT" exec -T postgres \
  psql -U "$STAGING_USER" -d postgres -c "DROP DATABASE IF EXISTS $STAGING_DB;"
docker compose -p "$STAGING_PROJECT" exec -T postgres \
  psql -U "$STAGING_USER" -d postgres -c "CREATE DATABASE $STAGING_DB OWNER $STAGING_USER;"

echo "=== [4/6] Restore dumpu do stagingu ==="
docker compose -p "$STAGING_PROJECT" exec -T postgres \
  psql -U "$STAGING_USER" -d "$STAGING_DB" < "$DUMP_FILE"

echo "=== [5/6] Anonymizace PHI dat ==="
docker compose -p "$STAGING_PROJECT" exec -T postgres \
  psql -U "$STAGING_USER" -d "$STAGING_DB" <<'SQL'
-- Anonymizace uživatelských údajů
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM users
)
UPDATE users SET
  name = 'Uživatel ' || numbered.rn,
  email = 'user' || numbered.rn || '@staging.test',
  password = '$2y$12$000000000000000000000000000000000000000000000000000000',
  remember_token = NULL
FROM numbered WHERE users.id = numbered.id;

-- Vyčištění sessions a cache tabulek (pokud existují)
TRUNCATE TABLE sessions CASCADE;
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cache') THEN
    TRUNCATE TABLE cache CASCADE;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cache_locks') THEN
    TRUNCATE TABLE cache_locks CASCADE;
  END IF;
END $$;
SQL

echo "=== [6/6] Vyčištění cache a zapnutí stagingu ==="
rm -f "$DUMP_FILE"
docker compose -p "$STAGING_PROJECT" exec -T app php artisan cache:clear
docker compose -p "$STAGING_PROJECT" exec -T app php artisan config:cache
docker compose -p "$STAGING_PROJECT" exec -T app php artisan up

echo ""
echo "=== Synchronizace dokončena ==="
echo "    Staging DB obsahuje anonymizovaná data z produkce."
echo "    Všichni uživatelé: user<N>@staging.test (hesla invalidována, nutný nový login přes Google SSO)"
