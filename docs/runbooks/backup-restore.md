# Backup & Restore Runbook — PHC Nexus

GPG-šifrovaný off-site backup PostgreSQL databáze a storage volume (přílohy,
avatary, wiki soubory) do Backblaze B2. GDPR Art. 32 požadavek: šifrování
at-rest + in-transit, ověřená restore procedura.

Automatizace: `scripts/backup.sh` (cron 02:00 denně) + `scripts/restore-drill.sh`
(kvartální ruční ověření).

---

## Přehled

| Komponenta | Typ | Kritičnost |
|------------|-----|------------|
| PostgreSQL | Všechna business data (včetně PHI) | **Kritická** |
| Storage volume (`app-storage`) | Přílohy, avatary, wiki | **Kritická** |
| Redis (data) | Sessions, queues | Nízká — regenerovatelné |
| Redis (cache) | Cache | Nízká — regenerovatelné |
| `.env` | Konfigurace, SSO secrets, GPG recipient | **Kritická** — zálohovat mimo repo (password manager) |

---

## Architektura

```
┌──────────────┐      pg_dump              ┌──────────────┐
│  PostgreSQL  │ ────────────────────┐     │              │
└──────────────┘                     │     │              │
                                     ├──►  │ gpg encrypt  │ ──► /opt/backups/*.gpg ──► rclone ──► Backblaze B2
┌──────────────┐      tar            │     │ (public key) │                                       (off-site)
│ app-storage  │ ────────────────────┘     │              │
└──────────────┘                           └──────────────┘

Private GPG key: NIKDY na VPS — v password manageru (1Password/Bitwarden).
Dešifrování je možné jen na stroji s importovaným private klíčem.
```

---

## Setup — one-time

### 1. Backblaze B2 účet a bucket

**Uživatelská akce — vytvořit účet a credentials:**

1. Jdi na https://www.backblaze.com/b2/cloud-storage.html → **Sign Up** (free tier: 10 GB storage, 1 GB/den download, stačí na PHC Nexus).
2. **Create Bucket**:
   - Name: `phc-nexus-backups`
   - Files: **Private**
   - Default Encryption: **Disable** (máme GPG client-side)
   - Object Lock: **Disabled** (soft delete přes lifecycle)
3. **Lifecycle Rules** pro bucket:
   - "Keep only the last version of the file" + "Hide files older than 90 days" + "Delete hidden files older than 30 days"
   - → efektivní retence: 90 dní aktivní + 30 dní hidden, pak permanent delete
4. **Application Keys** → **Add a New Application Key**:
   - Name: `phc-nexus-backup-rw`
   - Allow access to Bucket: `phc-nexus-backups`
   - Type: **Read and Write** (potřebuje i list/delete pro restore-drill)
   - Duration: none (permanent)
5. Zkopíruj si **keyID** a **applicationKey** — applicationKey vidíš jen jednou, ulož do password manageru.

### 2. GPG keypair (na bezpečném stroji, NE na VPS)

```bash
# Lokální Mac/Linux
gpg --batch --gen-key <<EOF
%no-protection
Key-Type: RSA
Key-Length: 4096
Name-Real: PHC Nexus Backup
Name-Email: backup@phc-nexus.eu
Expire-Date: 0
EOF

# Export public (commit do repa jako docker/backup/phc-nexus-backup-pub.asc)
gpg --export --armor backup@phc-nexus.eu > docker/backup/phc-nexus-backup-pub.asc

# Export private (ULOŽIT DO PASSWORD MANAGERU, smazat ze stroje)
gpg --export-secret-keys --armor backup@phc-nexus.eu > phc-nexus-backup-priv.asc
# Vložit obsah do 1Password / Bitwarden → Secure Note "PHC Nexus GPG Backup Private Key"
shred -u phc-nexus-backup-priv.asc

# Fingerprint (pro audit):
gpg --fingerprint backup@phc-nexus.eu
```

> **`%no-protection`** vyrábí klíč bez passphrase, což je žádoucí: cron musí
> šifrovat bez interakce. Ochrana je na úrovni *privátního* klíče (není na VPS).

Commitni public key:

```bash
mv docker/backup/phc-nexus-backup-pub.asc.example docker/backup/phc-nexus-backup-pub.asc.old  # pokud existuje
# (první setup: stačí prostě přidat phc-nexus-backup-pub.asc)
git add docker/backup/phc-nexus-backup-pub.asc
git commit -m "chore(backup): add GPG public key for off-site backup"
```

### 3. Instalace nástrojů na VPS

```bash
ssh root@<vps>
apt update
apt install -y gnupg rclone
```

### 4. Import GPG public key na VPS

```bash
cd /opt/phc-nexus
gpg --import docker/backup/phc-nexus-backup-pub.asc

# Nastavit ultimate trust (jinak gpg řeká "no assurance this key belongs...")
echo "$(gpg --list-keys --with-colons backup@phc-nexus.eu | awk -F: '/^fpr/{print $10; exit}'):6:" \
    | gpg --import-ownertrust

# Ověř:
gpg --list-keys backup@phc-nexus.eu
```

### 5. rclone config na VPS

```bash
mkdir -p /root/.config/rclone
cp /opt/phc-nexus/docker/backup/rclone.conf.example /root/.config/rclone/rclone.conf
chmod 600 /root/.config/rclone/rclone.conf
# Vyplň account (keyID) a key (applicationKey) — editorem
vi /root/.config/rclone/rclone.conf

# Ověř:
rclone lsd phc-b2:
# → vypíše bucket phc-nexus-backups
```

### 6. Přidat backup env vars do `.env`

```bash
# /opt/phc-nexus/.env
BACKUP_DIR=/opt/backups
BACKUP_GPG_RECIPIENT=backup@phc-nexus.eu
BACKUP_LOCAL_RETENTION_DAYS=7
BACKUP_B2_REMOTE=phc-b2
BACKUP_B2_BUCKET=phc-nexus-backups
BACKUP_SKIP_UPLOAD=0
```

### 7. První ruční běh

```bash
mkdir -p /opt/backups
cd /opt/phc-nexus
./scripts/backup.sh production

# Ověř, že soubory jsou v B2:
rclone ls phc-b2:phc-nexus-backups/production/
```

### 8. Cron

```bash
crontab -e
```

Přidat:

```cron
# PHC Nexus — denní backup (02:00) + týdenní staging backup (03:00 neděle)
0 2 * * * /opt/phc-nexus/scripts/backup.sh production >> /var/log/phc-backup.log 2>&1
0 3 * * 0 /opt/phc-nexus-staging/scripts/backup.sh staging >> /var/log/phc-backup.log 2>&1
```

Log rotace:

```bash
cat > /etc/logrotate.d/phc-backup <<'EOF'
/var/log/phc-backup.log {
    weekly
    rotate 8
    compress
    missingok
    notifempty
}
EOF
```

---

## Ruční backup

```bash
cd /opt/phc-nexus
./scripts/backup.sh production   # nebo: staging

# Bez B2 uploadu (test GPG flow):
BACKUP_SKIP_UPLOAD=1 ./scripts/backup.sh production
```

Skript vyprodukuje v `$BACKUP_DIR`:

- `production_db_<ts>.dump.gpg` — PostgreSQL custom-format dump, zašifrovaný
- `production_storage_<ts>.tar.gpg` — tar archiv storage volume, zašifrovaný
- `production_manifest_<ts>.txt` — SHA256 checksumy (pro ověření integrity)

---

## Restore drill (kvartální ověření)

GDPR Art. 32: backup bez ověřené restore procedury = žádný backup. Drill spouštět
**minimálně jednou za kvartál**, zapsat datum do tabulky níže.

### Předpoklady

- **Privátní GPG klíč** importovaný na stroji, kde drill běží:
  ```bash
  # Z password manageru zkopíruj private key do souboru
  gpg --import /path/to/phc-nexus-backup-priv.asc
  # Po drillu:
  gpg --delete-secret-keys backup@phc-nexus.eu   # nebo nech, pokud je stroj bezpečný
  ```
- `rclone` s nakonfigurovaným `phc-b2` remotem
- Docker (drill spouští izolovaný postgres kontejner na portu 55432)

### Spuštění

```bash
cd /opt/phc-nexus
./scripts/restore-drill.sh production
```

Skript:
1. Stáhne nejnovější `db_*.dump.gpg` + `storage_*.tar.gpg` + `manifest_*.txt` z B2
2. Ověří SHA256 proti manifestu
3. GPG decrypt
4. Spustí throwaway kontejner `phc-nexus-drill-postgres` (port 55432)
5. `pg_restore` + `SELECT COUNT(*)` na users/projects/tasks/audit_entries
6. `tar -tf` na storage archivu — počet souborů
7. Teardown (kontejner + volume smazán)

**Úspěšný výstup:** `=== Restore drill [production] ÚSPĚŠNĚ ===`

### Historie drillů

| Datum | Prostředí | Výsledek | Poznámka |
|-------|-----------|----------|----------|
| _YYYY-MM-DD_ | production | ✅/❌ | _první drill po setup_ |

**Kadence:** Q1/Q2/Q3/Q4 každého roku. Přidat řádek po každém spuštění.

---

## Manuální restore (disaster recovery)

Pokud je produkce v troskách a potřebuješ obnovit z backupu:

### 1. Připrav privátní GPG klíč

```bash
# Na stroji, kde budeš restorovat
gpg --import /path/to/phc-nexus-backup-priv.asc
```

### 2. Stáhni poslední backup

```bash
rclone lsf phc-b2:phc-nexus-backups/production/ | sort -r | head -n 5
rclone copy phc-b2:phc-nexus-backups/production/production_db_20260420_020000.dump.gpg       /opt/restore/
rclone copy phc-b2:phc-nexus-backups/production/production_storage_20260420_020000.tar.gpg  /opt/restore/
rclone copy phc-b2:phc-nexus-backups/production/production_manifest_20260420_020000.txt     /opt/restore/

cd /opt/restore
sha256sum -c production_manifest_20260420_020000.txt
```

### 3. Dešifruj

```bash
gpg --decrypt --output db.dump       production_db_20260420_020000.dump.gpg
gpg --decrypt --output storage.tar   production_storage_20260420_020000.tar.gpg
```

### 4. Restore PostgreSQL

```bash
cd /opt/phc-nexus

# Stop aplikace
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop app worker scheduler

# Drop & recreate DB
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
    dropdb -U phc_nexus phc_nexus
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
    createdb -U phc_nexus phc_nexus

# Restore
docker cp /opt/restore/db.dump phc-nexus-postgres-1:/tmp/db.dump
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
    pg_restore -U phc_nexus -d phc_nexus --no-owner --no-privileges /tmp/db.dump
```

### 5. Restore storage volume

```bash
# Rozbal tar do storage volume
docker run --rm \
    -v phc-nexus_app-storage:/storage \
    -v /opt/restore:/restore:ro \
    alpine:3 \
    sh -c "cd /storage && tar -xf /restore/storage.tar"
```

### 6. Start aplikace

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verifikace
docker compose exec app php artisan migrate:status
curl -sf https://phc-nexus.eu/up && echo OK
```

---

## Redis restore (pokud je nutný)

Redis data (sessions, queues) jsou regenerovatelné, ale pokud potřebuješ
obnovit aktivní sessions:

```bash
docker compose stop redis-data
docker cp ./backups/redis_data_20260420.rdb phc-nexus-redis-data-1:/data/dump.rdb
docker compose start redis-data
```

Redis cache se **neobnovuje** — allkeys-lru, aplikace znovu zahřeje cache.

---

## Rotace GPG klíčů

Doporučená rotace: **každé 2 roky** nebo při podezření na kompromitaci.

1. Vygeneruj nový keypair (`backup-v2@phc-nexus.eu`)
2. Commitni nový public → `docker/backup/phc-nexus-backup-pub-v2.asc`
3. Import na VPS + trust
4. Updatuj `.env` → `BACKUP_GPG_RECIPIENT=backup-v2@phc-nexus.eu`
5. Staré backupy zůstávají čitelné starým privátním klíčem (drž v password manageru navždy)
6. Po 90 dnech (lifecycle) staré backupy z B2 zmizí → starý klíč můžeš archivovat offline

---

## Bezpečnostní poznámky

- **GPG private key je jediný dešifrovací nástroj.** Ztráta = nečitelné backupy.
- **B2 Application Key** má R+W na bucket. Kompromitace umožňuje útočníkovi
  **smazat** (soft-delete) zašifrované backupy, ale ne je dešifrovat.
- **Object Lock** v B2 lze dodatečně zapnout pro immutabilitu (ransomware protection).
- **rclone.conf** má `chmod 600`, obsahuje B2 credentials — nikdy necommit.
- **`.env`** na VPS obsahuje `BACKUP_GPG_RECIPIENT` (není tajemství) — veřejná informace.
- Log `/var/log/phc-backup.log` obsahuje jen metadata (timestampy, filenames, SHA256) — není citlivý.
