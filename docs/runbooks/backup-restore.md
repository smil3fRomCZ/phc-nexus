# Backup & Restore Runbook — PHC Nexus

Postupy pro zálohu a obnovu databáze, Redis dat a souborových příloh.

---

## Co zálohovat

| Komponenta | Typ | Kritičnost |
|------------|-----|------------|
| PostgreSQL | Všechna business data | **Kritická** |
| Redis (data) | Sessions, queues | Střední — regenerovatelné |
| Redis (cache) | Cache | Nízká — regenerovatelné |
| File storage | Přílohy (`storage/app`) | **Kritická** |
| `.env` | Konfigurace | **Kritická** — zálohovat mimo repo |

---

## 1. PostgreSQL Backup

### Manuální záloha

```bash
# Full dump (custom format — komprimovaný, umožňuje selektivní restore)
docker compose exec postgres pg_dump \
  -U phc_nexus \
  -d phc_nexus \
  -Fc \
  -f /tmp/phc_nexus_$(date +%Y%m%d_%H%M%S).dump

# Zkopírovat z kontejneru
docker compose cp postgres:/tmp/phc_nexus_*.dump ./backups/
```

### SQL formát (čitelný, pomalejší restore)

```bash
docker compose exec postgres pg_dump \
  -U phc_nexus \
  -d phc_nexus \
  --clean \
  > ./backups/phc_nexus_$(date +%Y%m%d_%H%M%S).sql
```

### Automatická záloha (cron)

Přidat do crontab na serveru (`crontab -e`):

```cron
# Denní backup v 2:00 AM, retence 30 dní
0 2 * * * cd /opt/phc-nexus && docker compose exec -T postgres pg_dump -U phc_nexus -d phc_nexus -Fc > /opt/backups/phc_nexus_$(date +\%Y\%m\%d).dump && find /opt/backups -name "phc_nexus_*.dump" -mtime +30 -delete
```

### Šifrovaná záloha (GPG) — doporučené pro off-site

Zálohy obsahují business data (potenciálně PHI). Před přesunem off-site (S3, NAS) je **povinné** je šifrovat.

**Setup jednou** (na bezpečném stroji, NE na VPS):

```bash
gpg --batch --gen-key <<EOF
%no-protection
Key-Type: RSA
Key-Length: 4096
Name-Real: PHC Nexus Backup
Name-Email: backup@phc-nexus.eu
Expire-Date: 0
EOF

gpg --export --armor backup@phc-nexus.eu > backup-pub.asc
scp backup-pub.asc root@vps:/opt/phc-nexus/
```

Na VPS importovat **jen public**:

```bash
gpg --import /opt/phc-nexus/backup-pub.asc
gpg --edit-key backup@phc-nexus.eu trust quit   # vybrat 5 (ultimate)
```

> **Privátní klíč NIKDY na VPS** — držet v password manažeru / offline.

**Šifrovaný cron:**

```cron
0 2 * * * cd /opt/phc-nexus && docker compose exec -T postgres pg_dump -U phc_nexus -d phc_nexus -Fc | gpg --encrypt --recipient backup@phc-nexus.eu --trust-model always > /opt/backups/phc_nexus_$(date +\%Y\%m\%d).dump.gpg && find /opt/backups -name "phc_nexus_*.dump.gpg" -mtime +30 -delete
```

**Restore** (na stroji s privátním klíčem):

```bash
gpg --decrypt phc_nexus_20260601.dump.gpg > phc_nexus_20260601.dump
# pak standardní pg_restore
```

---

## 2. File Storage Backup

```bash
# Přílohy
tar -czf ./backups/storage_$(date +%Y%m%d_%H%M%S).tar.gz storage/app/

# Pokud se používá S3-compatible storage, záloha je na straně providera
```

---

## 3. Redis Data Backup

```bash
# Redis data (sessions + queues) — RDB snapshot
docker compose exec redis-data redis-cli BGSAVE
docker compose cp redis-data:/data/dump.rdb ./backups/redis_data_$(date +%Y%m%d_%H%M%S).rdb

# Redis cache — NEMUSÍ se zálohovat (allkeys-lru, regenerovatelné)
```

---

## 4. PostgreSQL Restore

### Z custom formátu (.dump)

```bash
# POZOR: Smaže existující data!

# 1. Stop aplikačních kontejnerů
docker compose stop app worker scheduler

# 2. Drop a recreate databáze
docker compose exec postgres dropdb -U phc_nexus phc_nexus
docker compose exec postgres createdb -U phc_nexus phc_nexus

# 3. Restore
docker compose cp ./backups/phc_nexus_20260325.dump postgres:/tmp/restore.dump
docker compose exec postgres pg_restore \
  -U phc_nexus \
  -d phc_nexus \
  --no-owner \
  /tmp/restore.dump

# 4. Start aplikace
docker compose start app worker scheduler

# 5. Verifikace
docker compose exec app php artisan migrate:status
```

### Z SQL formátu

```bash
docker compose stop app worker scheduler
docker compose exec -T postgres psql -U phc_nexus -d phc_nexus < ./backups/phc_nexus_20260325.sql
docker compose start app worker scheduler
```

---

## 5. File Storage Restore

```bash
# Rozbalit přílohy
tar -xzf ./backups/storage_20260325.tar.gz -C /opt/phc-nexus/

# Ověřit oprávnění
docker compose exec app chown -R www-data:www-data /var/www/html/storage/app
```

---

## 6. Redis Restore

```bash
# 1. Stop redis-data
docker compose stop redis-data

# 2. Nahradit RDB soubor
docker compose cp ./backups/redis_data_20260325.rdb redis-data:/data/dump.rdb

# 3. Start
docker compose start redis-data
```

---

## 7. Disaster Recovery — plný restore

Kompletní obnova na čistém serveru:

```bash
# 1. Příprava serveru (viz deploy.md kroky 1-3)
# 2. Start infrastruktury
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres redis-cache redis-data

# 3. Počkat na healthy postgres
sleep 10

# 4. Restore databáze
docker compose cp ./backups/phc_nexus_latest.dump postgres:/tmp/restore.dump
docker compose exec postgres pg_restore -U phc_nexus -d phc_nexus --no-owner /tmp/restore.dump

# 5. Restore souborů
tar -xzf ./backups/storage_latest.tar.gz -C /opt/phc-nexus/

# 6. Start aplikace
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 7. Verifikace
docker compose exec app php artisan migrate:status
curl -s https://phc-nexus.eu/up
```

---

## Retence záloh

| Typ | Frekvence | Retence |
|-----|-----------|---------|
| PostgreSQL dump | Denně 2:00 | 30 dní |
| File storage | Denně 3:00 | 30 dní |
| Redis data | Týdně | 7 dní |
| Off-site kopie | Týdně | 90 dní |
