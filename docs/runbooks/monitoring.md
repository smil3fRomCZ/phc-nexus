# Monitoring Checklist — PHC Nexus

Co sledovat, jaké hodnoty jsou normální a kdy eskalovat.

---

## Zdraví kontejnerů

```bash
# Všechny kontejnery running/healthy
docker compose ps

# Quick health check
curl -s -o /dev/null -w "%{http_code}" https://phc-nexus.eu/up
# Očekáváno: 200
```

| Kontejner | Healthy signál | Akce při výpadku |
|-----------|---------------|------------------|
| app | HTTP 200 na `/up` | `docker compose restart app` |
| worker | Horizon status active | `docker compose restart worker` |
| scheduler | Cron běží (logs) | `docker compose restart scheduler` |
| postgres | `pg_isready` | Zkontrolovat disk space, logs |
| redis-cache | `redis-cli ping` | Restart, cache se regeneruje |
| redis-data | `redis-cli ping` | Restart, sessions se obnoví po login |
| caddy | HTTPS odpovídá | Zkontrolovat TLS cert, DNS |

---

## Queue / Horizon

```bash
# Horizon status
docker compose exec app php artisan horizon:status
# Očekáváno: "Horizon is running."

# Pending joby
docker compose exec app php artisan queue:monitor default
# Normální: 0-10 pending, alarm: >100

# Failed joby
docker compose exec app php artisan queue:failed
# Normální: 0, jakýkoli failed job → investigovat
```

**Horizon dashboard:** `https://phc-nexus.eu/horizon`

| Metrika | Normální | Varování | Kritické |
|---------|----------|----------|----------|
| Pending jobs | 0–10 | 10–100 | >100 |
| Failed jobs | 0 | 1–5 | >5 |
| Wait time | <5s | 5–30s | >30s |
| Throughput | Stabilní | -50% | -90% |

---

## PostgreSQL

```bash
# Velikost databáze
docker compose exec postgres psql -U phc_nexus -c "SELECT pg_size_pretty(pg_database_size('phc_nexus'));"

# Aktivní connections
docker compose exec postgres psql -U phc_nexus -c "SELECT count(*) FROM pg_stat_activity WHERE datname='phc_nexus';"
# Normální: <20, alarm: >80 (max_connections default = 100)

# Pomalé dotazy (>1s)
docker compose exec postgres psql -U phc_nexus -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query
  FROM pg_stat_activity
  WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '1 second'
  ORDER BY duration DESC;"

# Dead tuples (potřeba VACUUM)
docker compose exec postgres psql -U phc_nexus -c "
  SELECT relname, n_dead_tup, last_autovacuum
  FROM pg_stat_user_tables
  WHERE n_dead_tup > 1000
  ORDER BY n_dead_tup DESC;"
```

| Metrika | Normální | Akce |
|---------|----------|------|
| DB size | <5 GB | Monitorovat růst |
| Connections | <20 | Zkontrolovat connection pooling |
| Slow queries | 0 | Analyzovat, přidat indexy |
| Dead tuples >10k | Vzácně | `VACUUM ANALYZE` |

---

## Redis

```bash
# Memory usage
docker compose exec redis-data redis-cli INFO memory | grep used_memory_human
docker compose exec redis-cache redis-cli INFO memory | grep used_memory_human

# Connected clients
docker compose exec redis-data redis-cli INFO clients | grep connected_clients
```

| Instance | Max memory | Eviction |
|----------|-----------|----------|
| redis-cache | Konfigurovatelné | allkeys-lru (auto) |
| redis-data | Konfigurovatelné | noeviction (nesmí evict!) |

**redis-data alarm:** Pokud se blíží max memory a noeviction → rozšířit nebo vyčistit expired sessions.

---

## Disk

```bash
# Celkové využití
df -h /opt/phc-nexus

# Největší adresáře
du -sh /opt/phc-nexus/storage/app/*
du -sh /opt/backups/*
```

| Cesta | Očekávaná velikost | Akce při plném disku |
|-------|--------------------|---------------------|
| `/opt/phc-nexus/storage/app` | <10 GB | Archivovat staré přílohy |
| `/opt/backups` | <20 GB | Zkontrolovat retenci |
| Docker volumes | <5 GB | `docker system prune` |

---

## Aplikační logy

```bash
# Laravel logy (posledních 50 řádků)
docker compose logs --tail=50 app

# Hledat errory
docker compose logs app 2>&1 | grep -i "error\|exception\|fatal" | tail -20

# Horizon worker logy
docker compose logs --tail=50 worker
```

**Soubor:** `storage/logs/laravel.log` (uvnitř kontejneru)

---

## Denní kontrola (checklist)

- [ ] Všechny kontejnery running (`docker compose ps`)
- [ ] HTTP 200 na `/up`
- [ ] Horizon active
- [ ] 0 failed jobs
- [ ] Backup proběhl (soubor v `/opt/backups` z dnešního dne)
- [ ] Disk <80% utilized
- [ ] Žádné ERROR v logu za posledních 24h

---

## Eskalace

| Severity | Příklad | Reakce |
|----------|---------|--------|
| P1 — Kritická | App neodpovídá, DB down | Okamžitě — restart, rollback, restore |
| P2 — Vysoká | Failed jobs >5, Horizon down | Do 1h — investigovat, restart worker |
| P3 — Střední | Slow queries, disk >80% | Do 24h — optimalizovat, cleanup |
| P4 — Nízká | Warning v logu | Další sprint — technický dluh |
