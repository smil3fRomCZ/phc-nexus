# Rollback Runbook — PHC Nexus

Rychlý návrat na předchozí image tag bez rebuild. Průměrná doba: **30 sekund**.

---

## Předpoklad

Image v GHCR (`ghcr.io/smil3fromcz/phc-nexus:<tag>`) obsahuje historii všech deployů. Tag formátu `sha-abc1234` = immutable, `latest` = vždy nejnovější.

Seznam dostupných tagů:
```bash
# Přes gh CLI
gh api /users/smil3fRomCZ/packages/container/phc-nexus/versions | jq '.[] | {tag: .metadata.container.tags, created: .created_at}'
```

Nebo GitHub UI: https://github.com/smil3fRomCZ/phc-nexus/pkgs/container/phc-nexus

---

## Postup — Production

```bash
# SSH na VPS
ssh deploy@phc-nexus.eu

# 1. Identifikuj cílový tag — předchozí úspěšný deploy (před tím, který rozbil prod)
ls -la /opt/phc-nexus/.env  # zkontroluj aktuální IMAGE_TAG
# nebo v git history: co bylo mergnuté předtím

# 2. Spusť rollback
cd /opt/phc-nexus
./scripts/rollback.sh sha-abc1234 production

# 3. Skript udělá:
#    - Zapíše IMAGE_TAG=sha-abc1234 do .env
#    - docker compose pull (pulne starý image z GHCR)
#    - docker compose up -d (restartne se starým image)
#    - Health check curl /up
```

## Postup — Staging

```bash
cd /opt/phc-nexus-staging
./scripts/rollback.sh sha-abc1234 staging
```

---

## DB migrace — POZOR

Rollback skript **nevrací DB migrace**. Pokud target tag vyžaduje jiné schema (např. odstraňovaný sloupec nebo nově přidaný NOT NULL), musíš **předtím** udělat:

```bash
# Kolik migrací rollbacknout?
docker compose exec app php artisan migrate:status | tail -20

# Rollback N migrací
docker compose exec app php artisan migrate:rollback --step=N --force
```

**Doporučení:** všechny migrace psát **backward-compatible** (add column nullable, nedropovat sloupec v jednom PR se změnou kódu). Pak je rollback bezpečný bez DB změn.

---

## Verifikace po rollbacku

```bash
# Health check
curl -sI https://phc-nexus.eu/up
# Očekáváno: HTTP/2 200

# Image tag aktivní
docker compose ps --format json | jq '.[] | {name: .Name, image: .Image}'

# Horizon reset (nové Jobs s novým code)
docker compose exec app php artisan horizon:terminate

# Logy bez errorů
docker compose logs --tail=50 app worker
```

---

## Kdy rollbacknout vs. forward-fix

**Rollback** (rychlé řešení, ~30s):
- Kritická chyba (500 errors, auth broken, data corruption)
- Neexistuje rychlý forward fix
- Rollback target tag je znám a otestován

**Forward fix** (hot fix PR):
- Drobná regrese (UI glitch, non-critical flow)
- DB migrace by musela být rollback-ed (risky)
- Forward fix je rychlý (≤15 min)

---

## Troubleshooting

**"Image not found in registry"**
- Ověř tag: `docker manifest inspect ghcr.io/smil3fromcz/phc-nexus:sha-xxxxx`
- GHCR retention: starší imagy (>100 versions) mohou být GC-něné → zvažni ztvrdit retention v GH settings

**"Health check failed"**
- Image se pullnul, ale app neodpovídá. Logy: `docker compose logs --tail=200 app`
- Typická příčina: migrace nejsou v souladu s kódem (viz DB migrace sekce)

**"IMAGE_TAG=latest after rollback"**
- Nový deploy by rollback přepsal. Pro setrvání na starém tagu: PR revert commit → nový deploy build s původním kódem (tag bude nový sha, ale kód stejný).
