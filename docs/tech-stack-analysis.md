# PHC Nexus — Analýza Tech Stacku

> Platforma: interní produktivitní systém (50–200 uživatelů)
> Firemní kompetence: PHP (Laravel, Symfony, Nette), Alpine.js, PostgreSQL, RabbitMQ
> Cíl: maximalizovat využití existujícího know-how, minimalizovat onboarding cost
> Poslední aktualizace: březen 2026

---

## 1. ROZHODOVACÍ MATICE — PROČ TENHLE STACK

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    KLÍČOVÁ ROZHODNUTÍ                                     │
│                                                                           │
│  Q: Laravel vs. Symfony vs. Nette?                                        │
│  A: Laravel 13 (vyšel 17. března 2026)                                    │
│     • Nejrychlejší vývoj (Eloquent, queues, scheduler, auth flows)        │
│     • Největší ekosystém balíčků                                          │
│     • Nejlepší DX pro produktový vývoj                                    │
│     • Symfony komponenty pod kapotou (plynulý přechod pro Symfony devs)   │
│     • Reverb, Horizon a další capability jsou k dispozici, ale volitelné  │
│     • AI capability existují, ale nepatří do MVP baseline                │
│     • PHP atributy místo $fillable/$hidden (v13)                         │
│     • Dobrá podpora SSO a interních auth flows                            │
│                                                                           │
│  Q: SPA vs. Livewire vs. klasický server-rendered?                        │
│  A: Inertia.js v2 + React 19 (SPA feeling, Laravel routing)              │
│     • Největší frontend ekosystém (komponenty, knihovny, komunita)        │
│     • React Native pro budoucí mobilní appku                              │
│     • Inertia v2 = deferred props, prefetching, polling, WhenVisible     │
│     • History encryption pro citlivá data v browser history              │
│     • Full SPA UX pro Kanban, tabulky a formulářové workflow              │
│     • Alternativa: Livewire 4 pro admin panel (jednodušší CRUD)           │
│     • RSC (React Server Components) nerelevantní — Inertia model lepší  │
│                                                                           │
│  Q: Proč React a ne Vue?                                                   │
│  A: React má objektivně větší ekosystém:                                   │
│     • Víc komponentových knihoven (shadcn/ui, Radix, Pragmatic DnD...)   │
│     • Větší hiring pool                                                    │
│     • React Native = sdílení kódu s budoucí mobilní appkou               │
│     • Inertia.js má plnohodnotný React adapter — s Laravel bez problému  │
│     • Onboarding z Alpine: větší skok, ale investice se vrátí            │                │
│                                                                           │
│  Q: PostgreSQL vs. MySQL?                                                  │
│  A: PostgreSQL — už ho máte + lepší pro tento projekt:                     │
│     • JSONB pro custom fields (bez EAV anti-pattern)                      │
│     • Full-text search (tsvector) pro globální vyhledávání                │
│     • Row-level security pro PHI data                                     │
│     • Recursive CTE pro hierarchie (OKR, org struktura, KB)              │
│     • Advisory locks pro conflict detection                               │
│                                                                           │
│  Q: RabbitMQ vs. Redis queues?                                             │
│  A: Redis + Laravel Horizon (zjednodušení infrastruktury)                  │
│     • Redis už v stacku (cache, sessions, presence, broadcasting)        │
│     • Horizon = real-time dashboard, auto-balancing workerů              │
│     • Nativní Laravel integrace, žádná extra infrastruktura              │
│     • Dva Redis kontejnery: redis-cache (allkeys-lru) +                 │
│     •   redis-data (sessions + queues, noeviction)                      │
│     • RabbitMQ overkill pro 50–200 uživatelů v monolitu                  │
│                                                                           │
│  Q: Monorepo vs. microservices?                                            │
│  A: Monolitická Laravel aplikace (modulární)                               │
│     • 50–200 uživatelů = zbytečný overhead microservices                  │
│     • Modular monolith: Domain modules (OKR, Projects, ITSM, KB...)      │
│     • Jednoduchý deployment, jednoduchý debugging                         │
│     • Škálování: vertikální + horizontální (Laravel Octane + queue workers)│
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TECH STACK — PŘEHLED

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHC NEXUS TECH STACK                              │
│                                                                             │
│  ┌─ FRONTEND ─────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Runtime:        React 19 + TypeScript                              │    │
│  │  Routing/Glue:   Inertia.js v2 (hlavní produktové UI)               │    │
│  │  Styling:        Tailwind CSS 4 + shadcn/ui                         │    │
│  │  State:          Inertia props = primární server state               │    │
│  │                  Zustand jen pro lokální client state (UI toggles)  │    │
│  │  Async data:     TanStack Query výhradně pro widgety s nezávislým  │    │
│  │                  refresh cyklem (notification badge, dashboard)     │    │
│  │  Build:          Vite 6                                             │    │
│  │                                                                     │    │
│  │  MVP knihovny:                                                      │    │
│  │    • Pragmatic DnD (Kanban drag & drop)                            │    │
│  │    • @tanstack/react-table (tabulkové views)                       │    │
│  │    • react-i18next (lokalizace CZ/EN/SK)                           │    │
│  │                                                                     │    │
│  │  Fáze 2+:                                                           │    │
│  │    • SVAR React Gantt (timeline / dependencies)                    │    │
│  │    • Recharts (burndown, velocity, reporting)                      │    │
│  │                                                                     │    │
│  │  Fáze 4+:                                                           │    │
│  │    • Tiptap v3 (Knowledge Base, meeting notes)                     │    │
│  │    • Y.js + Hocuspocus až po PoC pro KB co-authoring               │    │
│  │    • Mermaid.js (diagramy v KB)                                    │    │
│  │                                                                     │    │
│  │  Admin panel:                                                       │    │
│  │    • Filament 5 / Livewire 4 pouze pro technickou administraci     │    │
│  │    • Ne pro core Projects / Work workflow                          │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─ BACKEND ──────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Framework:      Laravel 13 (PHP 8.4)                               │    │
│  │  UI delivery:     Inertia responses (hlavní UI)                     │    │
│  │  API:            Není baseline pro MVP; přidat až s prvním          │    │
│  │                  konkrétním integračním use-casem                   │    │
│  │  Auth:           Laravel Socialite (Google SSO pro interní MVP)     │    │
│  │                  Passkeys / Sanctum až pokud vznikne konkrétní      │    │
│  │                  požadavek mimo webové MVP                          │    │
│  │  Authorization:  Vlastní Policy třídy: role × modul × entita × akce │    │
│  │                  + membership + PHI classification jako access mod  │    │
│  │  Queues:         Laravel Queue + Redis driver + Horizon             │    │
│  │  Scheduler:      Laravel Task Scheduling (CRON jobs)               │    │
│  │  Real-time:      MVP baseline = DB-backed notifikace + polling      │    │
│  │                  Reverb až po ověření provozní potřeby              │    │
│  │  Search:         PostgreSQL FTS až pokud search vstoupí do core     │    │
│  │                  produktu; Meilisearch až pokud PG FTS nebude stačit│    │
│  │  File storage:   Laravel Filesystem (local / S3-compatible)         │    │
│  │  Email:          Laravel Mail + inbound processing                  │    │
│  │  Export:         Standard export + GDPR export; PDF/PPTX později    │    │
│  │  AI:             až ve Fázi 5                                       │    │
│  │  Performance:    PHP-FPM + Caddy (MVP baseline)                     │    │
│  │                  FrankenPHP / Octane až po měření bottleneck        │    │
│  │                                                                     │    │
│  │  MVP moduly:                                                        │    │
│  │    app/Modules/                                                     │    │
│  │      ├── Auth/         (SSO, invite, onboarding, offboarding)      │    │
│  │      ├── Organization/ (oddělení, týmy, tribes, uživatelé)         │    │
│  │      ├── Projects/     (projekty, milestone/epic kontext)          │    │
│  │      ├── Work/         (epics, tasks, approvals, dependencies)     │    │
│  │      ├── Notifications/(in-app, email)                             │    │
│  │      ├── Audit/        (audit trail, GDPR, PHI access log)         │    │
│  │      ├── Files/        (upload, verzování, storage management)     │    │
│  │      └── Approvals/    (requesty, votes, delegation, reminders)    │    │
│  │                                                                     │    │
│  │  Fáze 2+:                                                           │    │
│  │      ├── Goals/         (OKR cykly, objectives, key results)       │    │
│  │      ├── Portfolio/     (portfolia, iniciativy, impact scoring)    │    │
│  │      ├── Reports/       (dashboardy, widgety, export)              │    │
│  │      ├── Search/        (globální full-text)                       │    │
│  │                                                                     │    │
│  │  Fáze 3+:                                                           │    │
│  │      ├── ServiceDesk/   (portál, tickety, SLA, routing, CMDB)      │    │
│  │                                                                     │    │
│  │  Fáze 4+:                                                           │    │
│  │      ├── Knowledge/     (wiki, šablony, verzování, collaboration)  │    │
│  │      ├── Meetings/      (meeting notes)                            │    │
│  │                                                                     │    │
│  │  Fáze 5+:                                                           │    │
│  │      ├── Rules/         (rule engine, triggery, akce)              │    │
│  │      ├── AI/            (LLM integrace, multi-provider)            │    │
│  │      └── Integrations/ (Google Workspace, Git, Sentry, webhooky)   │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─ DATABÁZE & STORAGE ───────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Primární DB:    PostgreSQL 18                                      │    │
│  │                    • Hlavní data store                              │    │
│  │                    • uuidv7() pro timestamp-ordered PK              │    │
│  │                    • JSONB pro custom fields                        │    │
│  │                    • tsvector pro full-text search                  │    │
│  │                    • RLS jen pro vybrané PHI tabulky                │    │
│  │                    • pgAudit jako sekundární kontrola PHI operací   │    │
│  │                    • pgcrypto pro vybrané citlivé sloupce           │    │
│  │                    • pg_trgm pro fuzzy matching                     │    │
│  │                    • Virtual generated columns (v18)                │    │
│  │                                                                     │    │
│  │  Redis (dva kontejnery od startu):                                  │    │
│  │    redis-cache (allkeys-lru):                                       │    │
│  │                    • Cache                                          │    │
│  │                    • Rate limiting                                  │    │
│  │    redis-data (noeviction):                                         │    │
│  │                    • Session storage                                │    │
│  │                    • Async jobs (notifikace, emaily, exporty)       │    │
│  │                    • Delayed jobs (eskalace, reminders)             │    │
│  │                                                                     │    │
│  │  Full-text:      PostgreSQL FTS (v1)                                │    │
│  │                  → Meilisearch (v2, pokud PG FTS nestačí)          │    │
│  │                                                                     │    │
│  │  File storage:   Lokální filesystem nebo jednoduché S3-compatible   │    │
│  │                  řešení. SeaweedFS jen při prokázané potřebě        │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─ INFRASTRUKTURA & DEVOPS ──────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Kontejnerizace: Docker + Docker Compose                            │    │
│  │  Orchestrace:    Docker Compose (50–200 users stačí)                │    │
│  │                  K8s pouze pokud bude potřeba škálovat              │    │
│  │  Deployment model: jeden aplikační image, více kontejnerů podle role│    │
│  │                  (app / worker / scheduler / reverb)                │    │
│  │                  Dev: Docker Compose lokálně                        │    │
│  │                  Prod: stejný image nasadit na VPS přes Compose     │    │
│  │                                                                     │    │
│  │  CI/CD:          GitHub Actions                                     │    │
│  │                    • PHPStan (level 8) + Pint (code style)         │    │
│  │                    • PHPUnit + Pest (testy)                         │    │
│  │                    • ESLint + Prettier (frontend)                   │    │
│  │                    • Vitest + React Testing Library (FE testy)      │    │
│  │                    • Playwright (E2E testy)                         │    │
│  │                    • Build + deploy                                 │    │
│  │                                                                     │    │
│  │  Monitoring:     Laravel Telescope (dev)                            │    │
│  │                  Laravel Pulse (prod monitoring)                    │    │
│  │                  Laravel Horizon (queue dashboard)                  │    │
│  │                  Sentry (error tracking)                            │    │
│  │                                                                     │    │
│  │  Backup:         pg_dump (automated daily)                          │    │
│  │                  WAL archiving (point-in-time recovery)             │    │
│  │                  File storage backup podle zvoleného storage backend │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. MAPOVÁNÍ BUSINESS POŽADAVKŮ → TECHNOLOGIE

```
┌──────────────────────────────┬──────────────────────────────────────────────┐
│ BUSINESS POŽADAVEK           │ TECHNOLOGICKÉ ŘEŠENÍ                         │
├──────────────────────────────┼──────────────────────────────────────────────┤
│                              │                                              │
│ HIERARCHIE & NAVIGACE        │                                              │
│ 5-úrovňová hierarchie        │ MVP: parent_id + recursive CTE; closure F4+  │
│ Progress agregace            │ Async recalc přes Redis queue (bottom-up)    │
│ Cross-module vazby           │ Polymorfní relace (morphTo/morphMany)        │
│                              │                                              │
│ REAL-TIME FUNKCE             │                                              │
│ KB co-authoring              │ Y.js (CRDT) + oddělený realtime layer ve F4  │
│ Agent collision detection    │ Reverb/presence až pokud vznikne potřeba     │
│ Live notifikace              │ MVP: DB notifications + polling; Reverb později│
│ Kanban live updates          │ MVP: optimistic UI + refresh; realtime později│
│                              │                                              │
│ WORKFLOW ENGINE              │                                              │
│ Konfigurovatelné workflows   │ Hardcoded state machine v MVP; DB-driven později│
│ Approval řetězce             │ MVP: jeden regulovaný režim, další až F2+    │
│ SLA tracking + eskalace      │ Redis delayed jobs + Horizon + scheduler     │
│ Rule engine                  │ Až Fáze 5; v MVP hardcoded core policies     │
│                              │                                              │
│ AUTENTIZACE & PRÁVA          │                                              │
│ Google SSO                   │ Laravel Socialite (Google provider)           │
│ Granulární práva             │ Custom Policy: role × modul × entita × akce  │
│ PHI row-level security       │ PostgreSQL RLS + application-level checks    │
│ Audit trail                  │ Vlastní append-only audit model (partitioned)│
│                              │                                              │
│ KNOWLEDGE BASE               │                                              │
│ Rich text editor             │ Tiptap v3 (ProseMirror) + custom extensions  │
│ Verzování + diff             │ Verze v DB, diff computed (unified diff)     │
│ Inline komentáře             │ Tiptap marks + komentářová vrstva            │
│ Mermaid / PlantUML           │ Tiptap extension + Mermaid.js renderer       │
│ Synced content blocks        │ Referencované bloky s live subscription      │
│                              │                                              │
│ VIEWS & VIZUALIZACE          │                                              │
│ Kanban board                 │ Pragmatic DnD (Atlassian) + React komponenty │
│ Gantt / Timeline             │ SVAR React Gantt ve Fázi 2+                  │
│ Tabulka / List               │ @tanstack/react-table (virtualized rows)    │
│ Kalendář                     │ FullCalendar ve Fázi 2+                      │
│ Burndown / CFD / grafy       │ Recharts ve Fázi 2+                          │
│ Workload heatmapa            │ Custom React + Recharts ve Fázi 2+           │
│ Dependency graph             │ D3.js/ECharts ve Fázi 2+                     │
│                              │                                              │
│ SERVICE MANAGEMENT           │                                              │
│ Form builder (drag & drop)   │ Custom React builder + JSON schema uložení  │
│ SLA timery                   │ PostgreSQL timestamps + business hours calc  │
│ Email inbound                │ Laravel Mailbox (webhook / IMAP polling)     │
│ Canned responses             │ Šablony v DB s placeholder substitucí        │
│ Auto-routing                 │ Rule-based: kategorie × priorita → agent     │
│                              │                                              │
│ SEARCH                       │                                              │
│ Globální full-text           │ PostgreSQL tsvector + ts_rank (v1)           │
│ Duplikát detekce             │ pg_trgm similarity + cosine distance         │
│ Sémantický search (AI)       │ Embeddings (pgvector) + LLM                 │
│                              │                                              │
│ LLM INTEGRACE                │                                              │
│ Multi-provider               │ Abstraktní LLM service (strategy pattern)   │
│ Meeting sumarizace           │ Async job → Redis queue → LLM API → result  │
│ KB Q&A asistent              │ RAG: pgvector embeddings + LLM              │
│                              │                                              │
│ INTEGRACE                    │                                              │
│ Google Workspace             │ Fáze 5+ podle konkrétního use-casu           │
│ Git linking                  │ Fáze 2+                                      │
│ Sentry                       │ Error tracking baseline; webhook flows později│
│ Slack / Teams                │ Fáze 2+                                      │
│ REST API (Power BI aj.)      │ Až s prvním reálným integrátorem             │
│ Webhooky                     │ Až s konkrétní integrační potřebou           │
│                              │                                              │
│ EXPORT & REPORTING           │                                              │
│ PDF export                   │ Fáze 5+                                      │
│ PPTX export                  │ Fáze 5+                                      │
│ CSV/XLSX export              │ Standard export, pokud export vstoupí do MVP │
│ GDPR export                  │ Custom async job → ZIP → notifikace          │
│                              │                                              │
│ LOKALIZACE                   │                                              │
│ CZ / EN / SK                 │ Backend: Laravel trans() + JSON lang files   │
│                              │ Frontend: react-i18next + JSON lang files   │
│                              │                                              │
└──────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 4. ARCHITEKTURA — MODULÁRNÍ MONOLIT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CÍLOVÁ ARCHITEKTURA MODULÁRNÍHO MONOLITU                 │
│                                                                             │
│  Směr: jeden deployable Laravel monolit s jasnými hranicemi modulů.        │
│  Cíl: minimální provozní overhead, žádná předčasná platformizace.          │
│                                                                             │
│  ┌─ Prezentační vrstva ─────────────────────────────────────────────┐       │
│  │  Hlavní produktové UI: Inertia.js v2 + React 19 + TypeScript     │       │
│  │  Technická administrace: Filament / Livewire pouze pro admin     │       │
│  │  REST API: integrace a exporty, ne paralelní backend pro main UI │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─ Aplikační vrstva ────────────────────────────────────────────────┐       │
│  │  MVP moduly: Auth, Organization, Projects, Work, Approvals,      │       │
│  │  Notifications, Audit, Files                                     │       │
│  │  Pozdější moduly: Goals, ITSM, Knowledge, Reports, AI            │       │
│  │                                                                   │       │
│  │  Závislosti:                                                      │       │
│  │    UI → Application services → Domain model → Persistence         │       │
│  │  Pravidlo: modul nesmí sahat do interních tabulek jiného modulu. │       │
│  │  Cross-module komunikace přes explicitní kontrakty a události.   │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─ Sdílené capability moduly ───────────────────────────────────────┐      │
│  │  Audit, Files, Notifications, Search, Integrations               │       │
│  │  Jsou to platform capabilities, ne místo pro business logiku.    │       │
│  │  Workflow v MVP = hardcoded per typ entity.                      │       │
│  │  Rule engine až po stabilizaci domény.                           │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─ Realtime hranice ────────────────────────────────────────────────┐       │
│  │  MVP baseline: DB-backed notifikace + polling refresh              │       │
│  │  Reverb: volitelný upgrade pro lightweight realtime events         │       │
│  │  Y.js/Hocuspocus: pouze pro KB co-authoring ve Fázi 4 po PoC      │       │
│  │  Není součást MVP deploymentu ani obecného realtime layeru.       │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─ Datová a provozní vrstva ────────────────────────────────────────┐       │
│  │  PostgreSQL = source of truth                                     │       │
│  │  Redis: dva kontejnery od startu                                  │       │
│  │    redis-cache: cache + rate limiting (allkeys-lru)               │       │
│  │    redis-data: sessions + queues + Horizon (noeviction)           │       │
│  │  File storage: local nebo jednoduché S3-compatible řešení         │       │
│  │  SeaweedFS nasadit až při prokázané provozní potřebě.             │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─ Deployment baseline ─────────────────────────────────────────────┐       │
│  │  Reverse proxy (Nginx/Caddy)                                      │       │
│  │  Jeden build aplikace → jeden image                               │       │
│  │  Z téhož image běží role: app, worker, scheduler                 │       │
│  │  Reverb přidat až pokud bude realtime skutečně potřeba           │       │
│  │  PostgreSQL + redis-cache + redis-data                             │       │
│  │  PHP-FPM + Caddy (MVP baseline); FrankenPHP/Octane po měření      │       │
│  │  Nepoužívat jeden all-in-one kontejner pro web + queue + cron + DB│       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. DATABÁZOVÝ DESIGN — KLÍČOVÉ PATTERNY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATABÁZOVÉ PATTERNY                                   │
│                                                                             │
│  Vlastnictví dat podle modulu:                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Každá entita má jasného vlastníka (modul).                  │           │
│  │  Přímé FK preferovat uvnitř modulu.                          │           │
│  │  Cross-module reference jen pokud je business vazba stabilní.│           │
│  │  Jinak explicitní link tabulka nebo ID + aplikační lookup.   │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Custom Fields (JSONB — ne EAV, ale pod kontrolou):                         │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  tasks                                                       │           │
│  │    id, title, status, ...                                    │           │
│  │    custom_fields JSONB  ← {"dev_branch": "feat/123",         │           │
│  │                             "story_points": 5,               │           │
│  │                             "due_review": "2026-03-25"}      │           │
│  │                                                              │           │
│  │  custom_field_definitions                                    │           │
│  │    id, entity_type, name, field_type, options, required      │           │
│  │                                                              │           │
│  │  Pravidla: whitelist definic, validace v aplikaci,            │           │
│  │  indexovat jen opravdu používané klíče                        │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Hierarchie:                                                               │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  MVP (Project > Epic > Task > Subtask):                      │           │
│  │    parent_id FK + recursive CTE pro dotazy                   │           │
│  │    Jednoduché, dostatečné pro mělké stromy v MVP             │           │
│  │                                                              │           │
│  │  Fáze 4+ (KB hierarchie, deep OKR cascade):                  │           │
│  │    Closure table (ancestor_id, descendant_id, depth)         │           │
│  │    Zavést až s KB modulem nebo hlubokými stromy              │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Workflow v MVP (ne generický engine):                                      │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  task.status / approval.status / project.status               │           │
│  │  Přechody definované v kódu per typ entity                    │           │
│  │  transition_logs: kdo, kdy, z jakého stavu, do jakého, proč   │           │
│  │  Generic workflow_definitions až ve Fázi 2+, ne v MVP         │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Primární klíče (UUIDv7 — PostgreSQL 18):                                  │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Všechny tabulky používají uuidv7() jako PK:                 │           │
│  │    • Timestamp-ordered → lepší B-tree indexovatelnost        │           │
│  │    • Globálně unikátní → bezpečné pro cross-module vazby    │           │
│  │    • Nativní v PostgreSQL 18 (žádná PHP knihovna)            │           │
│  │    id UUID PRIMARY KEY DEFAULT uuidv7()                      │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Audit Trail (append-only, aplikačně řízený):                               │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  audit_logs (partitioned by month)                           │           │
│  │    id, user_id, entity_type, entity_id                       │           │
│  │    action (create/update/delete/read)                        │           │
│  │    changes JSONB  ← {"status": ["To Do", "In Dev"]}         │           │
│  │    ip_address, user_agent, created_at                        │           │
│  │                                                              │           │
│  │  Partitioning: měsíční partitions (performance + retence)    │           │
│  │  Aplikační audit = obchodní kontext                          │           │
│  │  pgAudit = sekundární kontrola pro PHI read/write            │           │
│  │  Retence: 6 let pro regulované záznamy                       │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Polymorfní vazby (omezit na infrastrukturní concerns):                     │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  comments      → commentable_type + commentable_id           │           │
│  │  attachments   → attachable_type + attachable_id             │           │
│  │  watchers      → watchable_type + watchable_id               │           │
│  │                                                              │           │
│  │  Nepoužívat morph relace jako hlavní pattern mezi moduly.    │           │
│  │  Pro business vazby preferovat explicitní kontrakty.         │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Přístupová kontrola a PHI:                                                │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Primární enforcement: aplikační authorization/policies      │           │
│  │  RLS: vybrané PHI tabulky jako druhá obranná linie           │           │
│  │  Oddělený DB user pro runtime vs migrace                     │           │
│  │  Šifrovat jen sloupce, které to skutečně vyžadují            │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Sémantický search (až po core produktu):                                  │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  embeddings                                                  │           │
│  │    id, entity_type, entity_id                                │           │
│  │    embedding vector(1536)  ← OpenAI/Anthropic embedding      │           │
│  │    content_hash            ← re-embed jen při změně          │           │
│  │                                                              │           │
│  │  Fáze 5: KB Q&A, duplikát detekce, smart search              │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. FRONTEND ARCHITEKTURA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND STRUCTURE                                     │
│                                                                             │
│  resources/js/                                                              │
│  ├── app.tsx                         (Inertia v2 + React bootstrap)       │
│  ├── types/                          (TypeScript types, generated from BE) │
│  ├── hooks/                          (shared React hooks)                  │
│  │   ├── usePollingRefresh.ts        (MVP refresh / invalidation)          │
│  │   ├── usePermissions.ts           (auth checks)                         │
│  │   ├── usePagination.ts                                                  │
│  │   ├── useFilters.ts                                                     │
│  │   └── useDebouncedSearch.ts                                             │
│  ├── components/                     (reusable UI components)              │
│  │   ├── ui/                         (shadcn/ui v4: Button, Modal, Badge) │
│  │   ├── kanban/                     (Pragmatic DnD — Board, Column, Card)│
│  │   ├── table/                      (DataTable, filters, sort)            │
│  │   ├── forms/                      (FormBuilder, DynamicField)           │
│  │   └── notifications/              (badge, inbox, toasts)               │
│  ├── layouts/                        (AppLayout, AuthLayout, AdminLayout)  │
│  ├── pages/                          (Inertia pages = route endpoints)     │
│  │   ├── Dashboard/                                                        │
│  │   ├── Projects/                                                         │
│  │   ├── Tasks/                                                            │
│  │   └── Admin/                      (Livewire 4 / Filament 5)           │
│  ├── stores/                         (Zustand stores — client state)      │
│  │   ├── useAuthStore.ts                                                   │
│  │   ├── useNotificationStore.ts                                           │
│  │   └── useUiStore.ts                                                     │
│  └── queries/                        (TanStack Query — jen nezávislé widgety) │
│      └── useNotificationsQuery.ts    (notification badge, dashboard polls)   │
│                                                                             │
│  Inertia v2 flow:                                                           │
│    1. User naviguje → Inertia request (async, non-blocking)                │
│    2. Laravel controller → return Inertia::render('Projects/Show', $data)  │
│    3. React přijme props → renderuje SPA stránku                           │
│    4. Deferred props se donačtou na pozadí (těžká data)                    │
│    5. Prefetching přednahraje data pro viditelné linky                     │
│    6. WhenVisible lazy-loaduje data při scrollu (infinite scroll)          │
│    7. Žádné API duplikace — server-side routing, client-side rendering     │
│                                                                             │
│  React Native (budoucí):                                                    │
│    • Sdílení TypeScript typů, hooks, Zustand stores, API vrstvy           │
│    • Pouze UI komponenty platform-specific                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. KLÍČOVÉ LARAVEL PACKAGES

MVP baseline:

```
┌────────────────────────────┬────────────────────────────────────────────────┐
│ Package                    │ Účel                                           │
├────────────────────────────┼────────────────────────────────────────────────┤
│ inertiajs/inertia-laravel  │ Server-side adapter pro Inertia.js v2         │
│ laravel/socialite          │ Google SSO                                     │
│ laravel/horizon            │ Queue monitoring + auto-balancing (Redis)     │
│ laravel/pulse              │ Prod monitoring dashboard                     │
│ laravel/telescope          │ Dev debugging dashboard                       │
│ spatie/laravel-translatable│ Vícejazyčné modely                           │
│ tightenco/ziggy            │ Laravel routes v JS (pro Inertia)             │
│ spatie/laravel-data        │ DTO / data objects                            │
│ filament/filament          │ Admin panel scaffolding (v5 — Livewire 4)    │
└────────────────────────────┴────────────────────────────────────────────────┘
```

Phase-gated / optional:
  • laravel/sanctum — až s prvním API/integration use-casem
  • laravel/reverb — až po potvrzení potřeby realtime layeru
  • laravel/scout — až pokud search přeroste čisté PostgreSQL FTS
  • laravel/octane — až po měření bottleneck (FrankenPHP worker mode = Octane)
  • spatie/laravel-permission — až pokud vlastní Policy třídy nebudou stačit
  • spatie/laravel-activitylog — nahrazeno vlastním audit modelem
  • spatie/laravel-medialibrary — jen pokud jednoduchý attachment model nebude stačit
  • maatwebsite/excel — pokud CSV/XLSX export vstoupí do aktivního scope
  • barryvdh/laravel-snappy — Fáze 5+
  • phpoffice/phppresentation — Fáze 5+
  • pgvector/pgvector — Fáze 5+

---

## 8. DOCKER COMPOSE — SLUŽBY

```yaml
# Princip:
#   • 1 Dockerfile / 1 aplikační image
#   • z téhož image se spouští více služeb podle commandu/role
#   • databáze, Redis a proxy nejsou uvnitř app kontejneru
#
# Lokální vývoj:
#   • docker compose up
#   • stejný image nebo stejný build context jako produkce
#
# Produkce na VPS:
#   • build image v CI nebo na serveru
#   • nasadit stejný image přes docker compose pull/up -d
#
# Produkční služby:
services:
  app:          # Web runtime (PHP-FPM)
  worker:       # Queue worker / Horizon ze stejného image jako app
  scheduler:    # php artisan schedule:work ze stejného image
  reverb:       # volitelné; přidat až pokud se potvrdí realtime potřeba
  postgres:     # PostgreSQL 18
  redis-cache:  # Redis — cache + rate limiting (allkeys-lru)
  redis-data:   # Redis — sessions + queues + Horizon (noeviction)
  caddy:        # Reverse proxy + TLS terminace (frontend pro PHP-FPM)
  storage:      # volitelně S3-compatible storage; jinak host volume/external
  mailpit:      # Dev only: email testing
```

---

## 9. PERFORMANCE ODHADY (50–200 UŽIVATELŮ)

```
┌──────────────────────────────────────────────────────────────────┐
│  S touto architekturou a počtem uživatelů:                       │
│                                                                  │
│  • Jeden server (8 CPU, 32 GB RAM) je realistický baseline      │
│    pro MVP bez nutnosti předčasné distribuce služeb            │
│  • PHP-FPM + Caddy je MVP baseline runtime                      │
│  • PostgreSQL 18 + Redis + Horizon mají dostatečnou rezervu     │
│    pro 50–200 uživatelů v monolitu                              │
│  • Reverb ani Octane nejsou potřeba, dokud měření neukáže opak  │
│                                                                  │
│  Škálování (pokud bude potřeba):                                │
│    1. Vertikální: víc CPU/RAM                                   │
│    2. Read repliky PostgreSQL                                   │
│    3. Víc queue workers                                         │
│    4. CDN pro statické assety                                   │
│    5. Oddělený DB server                                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. SKILL GAP ANALÝZA

```
┌────────────────────────────┬──────────┬──────────────────────────────────────┐
│ Technologie                │ Gap      │ Přechod                              │
├────────────────────────────┼──────────┼──────────────────────────────────────┤
│ Laravel (z Symfony/Nette)  │ Nízký    │ Symfony devs: Laravel používá        │
│                            │          │ Symfony komponenty pod kapotou       │
│                            │          │ Nette devs: podobný DI, routing     │
│                            │          │ Onboarding: 1-2 týdny               │
│                            │          │                                      │
│ React 19 (z Alpine.js)     │ Střední  │ Jiný paradigm (JSX vs. HTML-first)  │
│                            │          │ ale větší ekosystém a komunita.     │
│                            │          │ Hooks = moderní React je přímočarý │
│                            │          │ Onboarding: 3-5 týdnů              │
│                            │          │                                      │
│ TypeScript                 │ Střední  │ Postupné zavádění (strict: false →  │
│                            │          │ true). PHP devs znají typy.         │
│                            │          │ Onboarding: 2-3 týdny              │
│                            │          │                                      │
│ Inertia.js                 │ Nízký    │ Velmi tenká vrstva, naučí se za den │
│                            │          │                                      │
│ PostgreSQL                 │ Žádný    │ Už používáte                        │
│                            │          │                                      │
│ Redis queues + Horizon     │ Nízký    │ Redis už používáte. Horizon =      │
│                            │          │ dashboard + auto-balancing.        │
│                            │          │ Onboarding: 1-2 dny               │
│                            │          │                                      │
│ Redis                      │ Nízký    │ Standard v Laravel ekosystému       │
│                            │          │                                      │
│ Docker                     │ Nízký    │ Standard tooling, Laravel Sail      │
│                            │          │ pro dev environment                  │
│                            │          │                                      │
│ Y.js / CRDT                │ Vysoký   │ Specializovaná oblast, ale Tiptap  │
│                            │          │ v3 + Y.js + Hocuspocus mají dobrou │
│                            │          │ dokumentaci. Doporučení: PoC nejdřív│
│                            │          │                                      │
│ Tiptap v3 editor           │ Střední  │ ProseMirror-based, React + JSX     │
│                            │          │ support. Dobrá docs. Onboarding:   │
│                            │          │ 1-2 týdny                           │
│                            │          │                                      │
│ TanStack Query             │ Nízký    │ Jednoduchý API, React hooks.       │
│                            │          │ Onboarding: 2-3 dny                │
└────────────────────────────┴──────────┴──────────────────────────────────────┘
```

---

## 11. ALTERNATIVY (ZVAŽOVANÉ A ZAMÍTNUTÉ)

```
┌────────────────────────────┬─────────────┬──────────────────────────────────┐
│ Alternativa                │ Verdikt     │ Důvod                            │
├────────────────────────────┼─────────────┼──────────────────────────────────┤
│ Symfony (místo Laravel)    │ ❌ Zamítnuto │ Pomalejší vývoj, více boilerplate│
│                            │             │ Pro enterprise API ideální, ale  │
│                            │             │ pro produktový vývoj je Laravel  │
│                            │             │ efektivnější                     │
│                            │             │                                  │
│ Nette (místo Laravel)      │ ❌ Zamítnuto │ Menší ekosystém, méně balíčků   │
│                            │             │ Chybí: Octane, Reverb, Horizon   │
│                            │             │ Skvělé pro menší projekty        │
│                            │             │                                  │
│ Livewire only (bez React)  │ ❌ Zamítnuto │ Nedostatečné pro Gantt, Kanban  │
│                            │             │ drag&drop, CRDT editor, complex  │
│                            │             │ interaktivní views               │
│                            │             │                                  │
│ Vue 3 (místo React)        │ ❌ Zamítnuto │ Menší ekosystém než React       │
│                            │             │ Žádná cesta k mobilní appce     │
│                            │             │ (Vue Native neexistuje reálně)   │
│                            │             │                                  │
│ Next.js / Nuxt (full JS)   │ ❌ Zamítnuto │ Tým je PHP-first. JS backend    │
│                            │             │ by znamenal kompletní reskilling │
│                            │             │                                  │
│ Elasticsearch (search)     │ ❌ Zamítnuto │ Overhead pro 50-200 users       │
│                            │             │ PG FTS + Meilisearch stačí       │
│                            │             │                                  │
│ MongoDB (custom fields)    │ ❌ Zamítnuto │ PG JSONB řeší totéž, jeden DB   │
│                            │             │                                  │
│ RabbitMQ (místo Redis Q)   │ ❌ Zamítnuto │ Zbytečný overhead pro monolit   │
│                            │             │ Redis + Horizon = jednodušší,    │
│                            │             │ méně infrastruktury              │
│                            │             │                                  │
│ Kafka (message broker)     │ ❌ Zamítnuto │ Overkill pro 50-200 uživatelů   │
│                            │             │                                  │
│ MinIO (object storage)     │ ❌ Zamítnuto │ V maintenance mode od 12/2025   │
│                            │             │ Nepřijímá PR, žádné nové Docker  │
│                            │             │ images → SeaweedFS jako náhrada  │
│                            │             │                                  │
│ @dnd-kit (drag & drop)     │ ❌ Zamítnuto │ Zpomalená údržba, pomalé bugy   │
│                            │             │ → Pragmatic DnD (Atlassian)      │
│                            │             │                                  │
│ dhtmlxGantt / Bryntum      │ ❌ Zamítnuto │ Komerční licence                │
│                            │             │ → SVAR React Gantt (MIT, zdarma) │
│                            │             │                                  │
│ Meilisearch (search)       │ ⏳ Fáze 2   │ Pokud PG FTS nebude stačit      │
│                            │             │ (typo tolerance, faceting)       │
│                            │             │                                  │
│ Filament (celý admin)      │ ✅ Použito   │ Pro admin panel CRUD — ideální  │
│                            │             │ Ušetří týdny vývoje              │
└────────────────────────────┴─────────────┴──────────────────────────────────┘
```

---

## 12. RIZIKA & MITIGACE

```
┌────────────────────────────────┬─────────────────────────────────────────────┐
│ Riziko                         │ Mitigace                                    │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ Příliš široké MVP              │ Scope lock: Projects + Work + approvals +  │
│                                │ notifications. Ostatní moduly až po        │
│                                │ validaci core value                         │
│                                │                                             │
│ Míchání UI paradigmat          │ Jeden hlavní model pro produkt: Inertia +  │
│ (Inertia/React + Livewire/API) │ React. Filament jen pro technický admin    │
│                                │                                             │
│ Shared services bloat          │ Každý shared modul musí mít jasný kontrakt │
│                                │ a odpovědnost. Business logika patří do     │
│                                │ doménových modulů                           │
│                                │                                             │
│ Předčasná generalizace         │ Workflow hardcoded v MVP. Rule engine až   │
│ (workflow/rule engine)         │ po ověření několika odlišných use case sad │
│                                │                                             │
│ Realtime/collaboration         │ Reverb jen pro aplikační events. Y.js +    │
│ nejasné hranice                │ Hocuspocus oddělit do KB fáze a udělat PoC │
│                                │                                             │
│ Redis contention               │ Vyřešeno: dva kontejnery od startu          │
│                                │ redis-cache (lru) + redis-data (noeviction)│
│                                │                                             │
│ PHI enforcement split-brain    │ Authorization primárně v aplikaci. DB      │
│ (app vs DB)                    │ mechanizmy použít jako druhou vrstvu       │
│                                │                                             │
│ Provozní komplexita            │ Octane, SeaweedFS, AI workers a další      │
│                                │ infrastrukturu zavádět až po měření potřeb │
└────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 13. PHI BEZPEČNOST (HEALTHCARE COMPLIANCE)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BEZPEČNOSTNÍ VRSTVY PRO PHI DATA                         │
│                                                                             │
│  Šifrování:                                                                 │
│    • At rest: AES-256 pro DB soubory a backupy                             │
│    • In transit: TLS 1.3 pro všechna spojení (app↔DB, app↔Redis, klient)  │
│    • Column-level: pgcrypto (PGP_SYM_ENCRYPT) pro citlivé sloupce         │
│    • Key management: rotace klíčů, uložení v KMS (ne v kódu)              │
│                                                                             │
│  Audit logging:                                                             │
│    • Aplikační audit trail = primární zdroj obchodního kontextu            │
│    • pgAudit: sekundární kontrola SELECT/INSERT/UPDATE/DELETE na PHI       │
│    • Konfigurace: pgaudit.log = 'read, write, role' pro PHI               │
│    • Centralizované, immutable úložiště logů                              │
│    • Retence: 6 let (healthcare compliance)                                │
│                                                                             │
│  Přístupová kontrola:                                                      │
│    • Primární authorization v aplikaci (policy/role matrix)                │
│    • PostgreSQL RLS — druhá obranná linie pro vybrané PHI tabulky         │
│    • Princip nejmenšího oprávnění — app DB user bez DROP/CREATE           │
│    • Oddělený DB user pro migrace vs. runtime                              │
│    • MFA pro administrátorské účty řešené přes IdP nebo admin auth vrstvu │
│    • Passkeys nejsou součást MVP baseline                                 │
│                                                                             │
│  Backup bezpečnost:                                                        │
│    • Šifrované backupy (pg_dump + GPG)                                     │
│    • WAL archiving na šifrované úložiště                                  │
│    • Pravidelné restore drills                                             │
│    • Offsite kopie                                                         │
│                                                                             │
│  Infrastruktura:                                                            │
│    • Network segmentace — DB a Redis nepřístupné z internetu              │
│    • Firewall — pouze app server přistupuje k DB                          │
│    • Docker secrets místo environment variables pro credentials            │
│                                                                             │
│  Aplikační vrstva:                                                         │
│    • Data masking v logách (Laravel nesmí logovat PHI)                     │
│    • Session timeout a automatické odhlášení                              │
│    • RBAC s audit trailem kdo co viděl/změnil                             │
│    • Inertia v2 History Encryption pro citlivá data v browser history     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. DOPORUČENÝ VÝVOJOVÝ PLÁN

```
Fáze 0 — Setup (1-2 týdny):
  • Laravel 13 projekt + Docker Compose
  • PostgreSQL 18 + Redis 7 (dva kontejnery: cache + data)
  • Inertia v2 + React 19 + TypeScript + Tailwind CSS 4 + Vite 6
  • shadcn/ui CLI v4 + design system preset
  • CI/CD pipeline (GitHub Actions)
  • Auth (Google SSO pro interní MVP)
  • Laravel Horizon + Scheduler
  • File storage: local nebo jednoduché S3-compatible řešení
  • Filament 5 pouze pro technickou administraci

Fáze 1 — Core (MVP):
  • Org struktura + uživatelé + práva
  • Projekty + epiky + úkoly
  • Workflow hardcoded per typ entity
  • Základní approvals (all approve / any reject blocks)
  • Kanban + tabulka view
  • Komentáře, přílohy, audit trail
  • Notifikace (in-app + email)
  • PHI klasifikace na regulovaných typech
  • Reverb, Sanctum a integrations pouze pokud vznikne prokázaná potřeba

Fáze 2 — Extended PM:
  • OKR / Goals
  • Epics, dependencies, Gantt
  • Sprint management, velocity
  • Workload, time tracking
  • Reverb pro vybrané live use-casy, pokud dá smysl
  • Teprve pokud bude potřeba: konfigurovatelnější workflow

Fáze 3 — ITSM:
  • Service Desk portál + form builder
  • Incident/Request workflow + SLA
  • Email inbound, routing, canned responses

Fáze 4 — Knowledge Base:
  • Tiptap editor + verzování
  • Spaces / hierarchie
  • Real-time co-authoring až po PoC (Y.js + Hocuspocus)
  • Meeting notes
  • Reuse stávající realtime vrstvy jen kde to dává smysl

Fáze 5 — Polish:
  • Reporting + dashboardy
  • Rule engine
  • LLM/AI funkce
  • Google Workspace integrace
  • Migrace z Jira/Asana/Confluence
  • PDF/PPTX export
  • pgvector / semantic search
  • FrankenPHP/Octane, SeaweedFS a další infra optimalizace jen při prokázané potřebě
```
