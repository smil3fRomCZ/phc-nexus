# Bezpečnostní audit PHC Nexus

**Datum auditu:** 2026-04-14
**Rozsah:** Kompletní — aplikační kód (Laravel 13, React 19/Inertia), infrastruktura (Docker, Caddy), závislosti (composer/npm), PHI/compliance, Auth/SSO.
**Metodologie:** Multi-agent analýza (5 paralelních agentů per oblast) + manuální verifikace.

## Výsledné skóre

| Severita | Počet | Vyřešeno | Poznámka |
|----------|-------|----------|----------|
| 🔴 Critical | 6 | 6 | 100 % |
| 🟠 High | 10 | 10 | 100 % |
| 🟡 Medium | 11 | 10 | 1 false positive (M1), 2 ověřeno jako hotové (M6, M7), 1 součást jiného fixu (M2) |
| **Celkem** | **27** | **26 + 1 nepoužitelný** | **Audit dořešen** |

## Implementace — chronologický přehled PR

| PR | Obsah | Severita |
|----|-------|----------|
| [#180](https://github.com/smil3fRomCZ/phc-nexus/pull/180) | Quick wins: CSP hardening, `.env` read-only v prod, E2E guard, npm audit fix | Critical C3/C4/C5/C6, High H10 |
| [#181](https://github.com/smil3fRomCZ/phc-nexus/pull/181) | DOMPurify whitelist, `router.visit()`, Mailpit version pin, SSO `remember=false` | High H4/H5/H6/H8 |
| [#182](https://github.com/smil3fRomCZ/phc-nexus/pull/182) | Google SSO `hd` claim validation, invite token entropy, uniformní error | Critical C1/C2 |
| [#183](https://github.com/smil3fRomCZ/phc-nexus/pull/183) | PHI export row-level filtr, audit detail (rows, excluded_count, fields) | High H1 |
| [#184](https://github.com/smil3fRomCZ/phc-nexus/pull/184) | SVG blacklist, upload UI accept/size, staging DB SSL | Medium M3/M4/M5 |
| [#185](https://github.com/smil3fRomCZ/phc-nexus/pull/185) | PHI attachment audit context, session idle timeout middleware | Medium M8/M9 |
| [#186](https://github.com/smil3fRomCZ/phc-nexus/pull/186) | Admin CRUD audit old/new values, per-entity audit log scope | High H2/H3 |
| [#187](https://github.com/smil3fRomCZ/phc-nexus/pull/187) | `whereRaw LOWER LIKE` → `CaseInsensitiveLike` helper (ILIKE pro Postgres) | High H9 |
| [#188](https://github.com/smil3fRomCZ/phc-nexus/pull/188) | Concurrent session logout (security_stamp + middleware + endpoint) | Medium M10 |

## Detail nálezů

### 🔴 Critical

#### C1 — Google SSO `hd` claim validation
`AuthenticateGoogleUser` validuje `hd` (hosted domain) z raw Google response proti allowlistu. Brání účtům bez hd (osobní gmail s firemní adresou) a mismatch scénářům (Workspace token s jinou doménou).
**Implementace:** `AuthenticateGoogleUser::assertHostedDomainMatches` + 2 testy.

#### C2 — Invite token hardening
- `bin2hex(random_bytes(32))` (256 bit) místo `Str::random(64)`.
- Uniformní error message pro invalid/expired/used pozvánku — brání enumeraci a timing rozlišení.
- Rate limit `throttle:invite-accept` (5/min/IP) byl už nasazen.

#### C3 — SESSION_ENCRYPT
Ověřeno že všechny production/staging env examples mají `SESSION_ENCRYPT=true`.

#### C4 — E2E login bypass guard
Route `/_e2e/login/{email}` má trojitý guard (environment + APP_DEBUG + hard `abort_if(production)`) s CI-friendly nastavením.

#### C5 — `.env` read-only mount v produkci
`docker-compose.prod.yml` — `./.env:/var/www/html/.env:ro` pro app/worker/scheduler (prevence runtime tamperingu při container breach).

#### C6 — CSP rozšíření
Přidáno `object-src 'none'`, `worker-src 'self'`, `manifest-src 'self'`, `media-src 'self'`, `upgrade-insecure-requests`.

### 🟠 High

#### H1 — PHI export row-level filtr
`TimeExportController` filtruje entries podle `task.isPhiRestricted()` a `epic.isPhiRestricted()` (Unknown = PHI strictness). Task/epic export přidává entity-level `canExport` check. Audit log obsahuje `rows`, `phi_filter`, `excluded_count`.

#### H2 — Admin CRUD audit trail
`UserController` a `OrganizationController` zapisují `old_values`/`new_values` + `payload.operation` klíč (`admin_user_update`, `admin_role_change`, `admin_deactivate`, `admin_activate`, `team_member_added`, …).

#### H3 — Per-entity audit log scope
Nová policy `AuditLogPolicy::viewAll` rozlišuje global (Executive) vs scoped pohled. PM vidí jen entries kde je actorem, svou User entity, nebo Project entries kterých je owner/member. `actor_id` filter pro ne-Executive omezen na `self` (jinak 403).

#### H4 — SSO bez remember cookie
`Auth::login($user)` bez `remember: true` — SSO re-login je rychlý, persistent cookie zbytečně zvětšoval okno pro theft.

#### H5 — `router.visit()` místo `window.location.href`
4 stránky refaktorovány; Gantt čistí container bez `innerHTML`.

#### H6 — DOMPurify whitelist
`RichTextDisplay` používá explicit `ALLOWED_TAGS`/`ALLOWED_ATTR` whitelist, `FORBID_TAGS` (iframe, script, style), `FORBID_ATTR` (style, onerror, onload, onclick), a URI regexp blokující `javascript:`.

#### H7 — PHP-FPM listen (N/A)
Audit navrhoval `127.0.0.1:9000`. Neproveditelné — FPM v Docker bridge networku musí být na `0.0.0.0`, jinak ho Caddy z jiného kontejneru nedosáhne. Network izolaci už zajišťuje docker bridge.

#### H8 — Mailpit version pin
`axllent/mailpit:v1.29.6` místo `:latest`.

#### H9 — `whereRaw` refactor
Centralizováno do `CaseInsensitiveLike` helperu. Postgres → `ILIKE`, SQLite → `LOWER()` fallback. Input v obou větvích parametrizovaný.

#### H10 — npm audit fix
Vyřešena `follow-redirects` GHSA-r4q5-vmmm-2653.

### 🟡 Medium

- **M1** — package.json verze (`eslint^10`, `typescript^6`, `vite^8`, …) **false positive** — všechny existují na npm.
- **M2** — timing attack na invitation → vyřešeno společně s C2 (uniformní error message).
- **M3** — `image/svg+xml` odstraněno z `allowed_mime_types`.
- **M4** — Upload UI: `accept` konkrétní formáty + 20 MB size check.
- **M5** — Staging `DB_SSLMODE=prefer` v env example.
- **M6** — STAGING_AUTH_HASH: `docs/staging-setup.md` už obsahuje `caddy hash-password` instrukce.
- **M7** — GitHub Actions SSH secret — GHA auto-masking + `set -x` neaktivní, žádný leak.
- **M8** — `DownloadAttachment` audit obsahuje `filename`, `mime_type`, `size`, `attachable_type`, `attachable_id`.
- **M9** — Idle session timeout (`EnforceIdleTimeout` middleware, 30 min default, `SESSION_IDLE_TIMEOUT` env).
- **M10** — Concurrent session logout přes `security_stamp` column + `EnforceSecurityStamp` middleware + endpoint `/profile/logout-everywhere` + UI tlačítko v profilu.

## Co do audit **ne**bylo zahrnuto

- **Rate limiting per feature endpoint** mimo auth flow — stávající `throttleWithRedis` pro default api rate limit.
- **Content Security Policy nonce** — aktuální CSP stále používá `style-src 'unsafe-inline'` (Tailwind). Nonce-based CSP je cesta ke zpřísnění, ale vyžaduje Laravel middleware + Inertia integrace.
- **SIEM integrace** — audit log je pouze v DB. Streaming do externího systému (ELK, Splunk) je mimo MVP scope.
- **Penetrační test** — tento audit byl statický/code review. Manuální pentest je komplementární.

## Architektonická doporučení (post-MVP)

1. **CSP nonce** — odstranit `unsafe-inline` pro style.
2. **PHI scope matrix rozšíření** — field-level klasifikace (ne jen entity-level), pro mixed PHI/non-PHI data v rámci jedné entity.
3. **Audit log partitioning** — při růstu objemu partition po měsících, export old partitions do cold storage.
4. **Session storage migration** — z Redis session na database session pokud vyžadováno "force logout all users" admin endpoint (Redis nemá user→session lookup).
5. **MFA/2FA pro Executive role** — Google Workspace už vyžaduje 2FA, ale defense-in-depth by mohlo přidat aplikační vrstvu.
