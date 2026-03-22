# PHC Nexus — Analýza Tech Stacku

> Platforma: interní produktivitní systém (50–200 uživatelů)
> Firemní kompetence: PHP (Laravel, Symfony, Nette), Alpine.js, PostgreSQL, RabbitMQ
> Cíl: maximalizovat využití existujícího know-how, minimalizovat onboarding cost

---

## 1. ROZHODOVACÍ MATICE — PROČ TENHLE STACK

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    KLÍČOVÁ ROZHODNUTÍ                                     │
│                                                                           │
│  Q: Laravel vs. Symfony vs. Nette?                                        │
│  A: Laravel                                                               │
│     • Nejrychlejší vývoj (Eloquent, queues, broadcasting, scheduler)      │
│     • Největší ekosystém balíčků                                          │
│     • Nejlepší DX pro produktový vývoj                                    │
│     • Symfony komponenty pod kapotou (plynulý přechod pro Symfony devs)   │
│     • Laravel Reverb / Soketi pro real-time (KB co-authoring)             │
│                                                                           │
│  Q: SPA vs. Livewire vs. klasický server-rendered?                        │
│  A: Inertia.js + React 19 (SPA feeling, Laravel routing)                  │
│     • Největší frontend ekosystém (komponenty, knihovny, komunita)        │
│     • React Native pro budoucí mobilní appku                              │
│     • Inertia = žádné API duplikace, server-side routing                  │
│     • Full SPA UX (Kanban drag&drop, Gantt, real-time)                    │
│     • Alternativa: Livewire 3 pro admin panel (jednodušší CRUD)           │
│                                                                           │
│  Q: Proč React a ne Vue?                                                   │
│  A: React má objektivně větší ekosystém:                                   │
│     • Víc komponentových knihoven (shadcn/ui, Radix, dnd-kit...)          │
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
│  │  Runtime:        React 19 + TypeScript                               │    │
│  │  Routing/Glue:   Inertia.js (server-side routing, SPA UX)          │    │
│  │  Styling:        Tailwind CSS 4                                     │    │
│  │  Komponenty:     shadcn/ui (Radix primitives) + custom design sys. │    │
│  │  State:          Zustand (global state) + React hooks (local)      │    │
│  │  Build:          Vite 6                                             │    │
│  │                                                                     │    │
│  │  Specializované knihovny:                                           │    │
│  │    • Tiptap (rich text editor — KB, komentáře, meeting notes)      │    │
│  │    • Y.js (CRDT pro real-time co-authoring KB)                     │    │
│  │    • @dnd-kit (Kanban drag & drop)                                 │    │
│  │    • @tanstack/react-table (tabulkové views)                       │    │
│  │    • dhtmlxGantt nebo bryntum-gantt (Timeline/Gantt view)          │    │
│  │    • Recharts / Apache ECharts (grafy, burndown, CFD)              │    │
│  │    • react-i18next (lokalizace CZ/EN/SK)                           │    │
│  │    • Mermaid.js (diagramy v KB)                                    │    │
│  │    • React Native (budoucí mobilní appka — sdílení logiky)        │    │
│  │                                                                     │    │
│  │  Admin panel (jednodušší CRUD sekce):                              │    │
│  │    • Livewire 3 + Alpine.js (workflow konfigurace, org struktura)  │    │
│  │    • Filament PHP (admin scaffolding — CRUD, forms, tables)        │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─ BACKEND ──────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Framework:      Laravel 12 (PHP 8.4)                               │    │
│  │  API:            Inertia responses (hlavní UI)                      │    │
│  │                  + REST API (externí integrace, Power BI, webhooky) │    │
│  │  Auth:           Laravel Socialite (Google SSO)                     │    │
│  │                  + Laravel Sanctum (API tokens)                     │    │
│  │  Authorization:  Custom policy layer (role × modul × entita × akce)│    │
│  │  Queues:         Laravel Queue + RabbitMQ driver                    │    │
│  │  Scheduler:      Laravel Task Scheduling (CRON jobs)               │    │
│  │  Real-time:      Laravel Reverb (WebSocket server)                  │    │
│  │  Search:         Laravel Scout + PostgreSQL FTS (tsvector)          │    │
│  │                  Meilisearch jako alternativa pro lepší relevanci   │    │
│  │  File storage:   Laravel Filesystem (local / S3-compatible)        │    │
│  │  Email:          Laravel Mail + inbound processing                  │    │
│  │  PDF/PPTX:       Laravel Snappy / DomPDF + PhpPresentation         │    │
│  │  Performance:    Laravel Octane (Swoole/FrankenPHP)                 │    │
│  │                                                                     │    │
│  │  Domain moduly:                                                     │    │
│  │    app/Modules/                                                     │    │
│  │      ├── Auth/         (SSO, invite, onboarding, offboarding)      │    │
│  │      ├── Organization/ (oddělení, týmy, tribes, uživatelé)         │    │
│  │      ├── Goals/        (OKR cykly, objectives, key results)        │    │
│  │      ├── Portfolio/    (portfolia, iniciativy, impact scoring)      │    │
│  │      ├── Projects/     (projekty, metodiky, sprints, releases)     │    │
│  │      ├── Work/         (epics, úkoly, podúkoly, dependencies)      │    │
│  │      ├── ServiceDesk/  (portál, tickety, SLA, routing, CMDB)       │    │
│  │      ├── Knowledge/    (wiki, šablony, verzování, CRDT sync)       │    │
│  │      ├── Meetings/     (meeting notes, akční body)                 │    │
│  │      ├── Workflows/    (workflow engine, stavy, přechody)          │    │
│  │      ├── Rules/        (rule engine, triggery, akce)               │    │
│  │      ├── Reports/      (dashboardy, widgety, export)               │    │
│  │      ├── Notifications/(in-app, email, Slack, digest)              │    │
│  │      ├── Audit/        (audit trail, GDPR, PHI access log)         │    │
│  │      ├── Files/        (upload, verzování, storage management)     │    │
│  │      ├── Search/       (globální full-text, duplikáty)             │    │
│  │      ├── AI/           (LLM integrace, multi-provider)             │    │
│  │      └── Integrations/ (Google Workspace, Git, Sentry, webhooky)   │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─ DATABÁZE & STORAGE ───────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Primární DB:    PostgreSQL 17                                      │    │
│  │                    • Hlavní data store                              │    │
│  │                    • JSONB pro custom fields                        │    │
│  │                    • tsvector pro full-text search                  │    │
│  │                    • Row-level security pro PHI                     │    │
│  │                    • pg_trgm pro fuzzy matching (duplikáty)         │    │
│  │                                                                     │    │
│  │  Cache:          Redis 7                                            │    │
│  │                    • Session storage                                │    │
│  │                    • Cache (views, queries, permissions)            │    │
│  │                    • Real-time presence (kdo edituje KB)            │    │
│  │                    • Rate limiting                                  │    │
│  │                    • Broadcasting backend (Reverb)                  │    │
│  │                                                                     │    │
│  │  Queue broker:   RabbitMQ                                           │    │
│  │                    • Async jobs (notifikace, emaily, export)        │    │
│  │                    • SLA timer events                               │    │
│  │                    • Rule engine execution                          │    │
│  │                    • LLM API calls                                  │    │
│  │                    • Migrace/import dat (long-running)              │    │
│  │                    • Delayed messages (eskalace, reminders)         │    │
│  │                                                                     │    │
│  │  Full-text:      PostgreSQL FTS (v1)                                │    │
│  │                  → Meilisearch (v2, pokud PG FTS nestačí)          │    │
│  │                                                                     │    │
│  │  File storage:   MinIO (S3-compatible, self-hosted)                │    │
│  │                  nebo lokální filesystem (malé nasazení)            │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─ INFRASTRUKTURA & DEVOPS ──────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Kontejnerizace: Docker + Docker Compose (dev i prod)               │    │
│  │  Orchestrace:    Docker Compose (50–200 users stačí)                │    │
│  │                  K8s pouze pokud bude potřeba škálovat              │    │
│  │                                                                     │    │
│  │  CI/CD:          GitHub Actions                                     │    │
│  │                    • PHPStan (level 8) + Pint (code style)         │    │
│  │                    • PHPUnit + Pest (testy)                         │    │
│  │                    • ESLint + Prettier (frontend)                   │    │
│  │                    • Vitest + React Testing Library (FE testy)      │    │
│  │                    • Playwright (E2E testy)                         │    │
│  │                    • Build + deploy (zero-downtime)                 │    │
│  │                                                                     │    │
│  │  Monitoring:     Laravel Telescope (dev)                            │    │
│  │                  Laravel Pulse (prod monitoring)                    │    │
│  │                  Sentry (error tracking — i integrace s ITSM)      │    │
│  │                                                                     │    │
│  │  Backup:         pg_dump (automated daily)                          │    │
│  │                  WAL archiving (point-in-time recovery)             │    │
│  │                  File storage backup (MinIO mirroring)              │    │
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
│ 5-úrovňová hierarchie        │ PostgreSQL recursive CTE + closure table     │
│ Progress agregace            │ Async recalc přes RabbitMQ (bottom-up)       │
│ Cross-module vazby           │ Polymorfní relace (morphTo/morphMany)        │
│                              │                                              │
│ REAL-TIME FUNKCE             │                                              │
│ KB co-authoring              │ Y.js (CRDT) + Laravel Reverb (WebSocket)     │
│ Agent collision detection    │ Redis presence + Reverb broadcasting         │
│ Live notifikace              │ Reverb channels + React hook                 │
│ Kanban live updates          │ Reverb private channels per projekt          │
│                              │                                              │
│ WORKFLOW ENGINE              │                                              │
│ Konfigurovatelné workflows   │ State machine pattern (custom, DB-driven)    │
│ Approval řetězce             │ Workflow modul: parallel/sequential nodes    │
│ SLA tracking + eskalace      │ RabbitMQ delayed messages + scheduler        │
│ Rule engine                  │ Event-driven: Laravel Events + custom rules  │
│                              │                                              │
│ AUTENTIZACE & PRÁVA          │                                              │
│ Google SSO                   │ Laravel Socialite (Google provider)           │
│ Granulární práva             │ Custom Policy: role × modul × entita × akce  │
│ PHI row-level security       │ PostgreSQL RLS + application-level checks    │
│ Audit trail                  │ Append-only audit tabulka, DB triggers       │
│                              │                                              │
│ KNOWLEDGE BASE               │                                              │
│ Rich text editor             │ Tiptap (ProseMirror) + custom extensions     │
│ Verzování + diff             │ Verze v DB, diff computed (unified diff)     │
│ Inline komentáře             │ Tiptap marks + komentářová vrstva            │
│ Mermaid / PlantUML           │ Tiptap extension + Mermaid.js renderer       │
│ Synced content blocks        │ Referencované bloky s live subscription      │
│                              │                                              │
│ VIEWS & VIZUALIZACE          │                                              │
│ Kanban board                 │ @dnd-kit + custom React komponenty           │
│ Gantt / Timeline             │ dhtmlxGantt nebo custom (SVG + React)        │
│ Tabulka / List               │ @tanstack/react-table (virtualized rows)    │
│ Kalendář                     │ FullCalendar (React wrapper)                 │
│ Burndown / CFD / grafy       │ Recharts / ECharts (interaktivní, velká data)│
│ Workload heatmapa            │ Custom React + ECharts                       │
│ Dependency graph             │ D3.js nebo ECharts graph                     │
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
│ Meeting sumarizace           │ Async job → RabbitMQ → LLM API → result     │
│ KB Q&A asistent              │ RAG: pgvector embeddings + LLM              │
│                              │                                              │
│ INTEGRACE                    │                                              │
│ Google Workspace             │ Google API PHP Client + OAuth2               │
│ Git linking                  │ Webhook receiver (GitHub/GitLab/Bitbucket)   │
│ Sentry                       │ Sentry webhook → auto incident              │
│ Slack / Teams                │ Outgoing webhooks + bot API                  │
│ REST API (Power BI aj.)      │ Laravel API Resources + Sanctum tokens      │
│ Webhooky                     │ Outbound: async HTTP via RabbitMQ            │
│                              │                                              │
│ EXPORT & REPORTING           │                                              │
│ PDF export                   │ Laravel Snappy (wkhtmltopdf) / Browsershot  │
│ PPTX export                  │ PhpPresentation (PHPOffice)                  │
│ CSV/XLSX export              │ Laravel Excel (Maatwebsite)                  │
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
│                         DEPLOYMENT DIAGRAM                                  │
│                                                                             │
│  ┌─ Browser ───────────────────────────────────────────────────────────┐    │
│  │  React 19 SPA (Inertia.js)                                          │    │
│  │  WebSocket connection → Reverb                                      │    │
│  │  Y.js CRDT sync → WebSocket                                        │    │
│  └────────────┬────────────────────────────┬───────────────────────────┘    │
│               │ HTTP (Inertia + API)       │ WebSocket                      │
│               ▼                            ▼                                │
│  ┌──────────────────────────┐  ┌──────────────────────┐                    │
│  │   Nginx / Caddy          │  │  Laravel Reverb       │                    │
│  │   (reverse proxy + SSL)  │  │  (WebSocket server)   │                    │
│  └────────────┬─────────────┘  └──────────┬───────────┘                    │
│               │                           │                                 │
│               ▼                           │                                 │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                    Laravel Application                           │       │
│  │               (PHP 8.4 + Octane/FrankenPHP)                      │       │
│  │                                                                  │       │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │       │
│  │  │ Auth │ │ Org  │ │Goals │ │Proj. │ │ ITSM │ │  KB  │        │       │
│  │  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘        │       │
│  │     │        │        │        │        │        │              │       │
│  │  ┌──┴────────┴────────┴────────┴────────┴────────┴───────────┐  │       │
│  │  │              Shared Services Layer                         │  │       │
│  │  │  Workflow Engine │ Rule Engine │ Audit │ Notifications     │  │       │
│  │  │  Search │ Files │ AI/LLM │ Export │ Integrations          │  │       │
│  │  └──┬────────┬────────┬────────┬─────────────────────────────┘  │       │
│  │     │        │        │        │                                 │       │
│  └─────┼────────┼────────┼────────┼─────────────────────────────────┘       │
│        │        │        │        │                                          │
│        ▼        ▼        ▼        ▼                                          │
│  ┌──────────┐ ┌──────┐ ┌────────────┐ ┌───────────┐                        │
│  │PostgreSQL│ │Redis │ │  RabbitMQ  │ │   MinIO   │                        │
│  │  17      │ │  7   │ │            │ │ (files)   │                        │
│  │          │ │      │ │ Queues:    │ │           │                        │
│  │ • Data   │ │• Cache│ │ • default  │ │ • Uploads │                        │
│  │ • JSONB  │ │• Sess.│ │ • emails   │ │ • Verze   │                        │
│  │ • FTS    │ │• Pres.│ │ • exports  │ │ • Avatars │                        │
│  │ • pgvect.│ │• Rate │ │ • llm      │ │           │                        │
│  │ • Audit  │ │      │ │ • sla      │ │           │                        │
│  └──────────┘ └──────┘ │ • rules    │ └───────────┘                        │
│                         │ • webhooks │                                       │
│                         └────────────┘                                       │
│                                                                             │
│  ┌─ Queue Workers ──────────────────────────────────────────────────┐       │
│  │  worker-default:  obecné joby (notifikace, audit, recalc)       │       │
│  │  worker-email:    odesílání + příjem emailů                     │       │
│  │  worker-export:   PDF, PPTX, CSV, GDPR export                  │       │
│  │  worker-llm:      LLM API volání (sumarizace, RAG)             │       │
│  │  worker-sla:      SLA timery, eskalace, reminders              │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─ Scheduled Tasks (Laravel Scheduler) ────────────────────────────┐       │
│  │  • SLA breach check (každou minutu)                              │       │
│  │  • Recurring task creation (denně 00:00)                         │       │
│  │  • Digest notifikace (denně 08:00 / pondělí 08:00)              │       │
│  │  • Content expiry check (denně)                                  │       │
│  │  • Archivace starých entit (týdně)                               │       │
│  │  • DB backup (denně + hodinový WAL)                              │       │
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
│  Custom Fields (JSONB — ne EAV):                                            │
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
│  │  Výhody: jeden query, žádné JOINy, indexovatelné (GIN)       │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Hierarchie (Closure Table pro stromy):                                     │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  kb_pages                                                    │           │
│  │    id, title, content, space_id, ...                          │           │
│  │                                                              │           │
│  │  kb_page_tree (closure table)                                │           │
│  │    ancestor_id, descendant_id, depth                         │           │
│  │                                                              │           │
│  │  Použití: KB hierarchie, org struktura, OKR cascade          │           │
│  │  Alternativa: materialized path ("1.3.7.12") pro jednoduché │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Workflow State Machine (DB-driven):                                        │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  workflow_definitions                                        │           │
│  │    id, name, entity_type                                     │           │
│  │                                                              │           │
│  │  workflow_states                                              │           │
│  │    id, workflow_id, name, type (initial/active/done/closed)  │           │
│  │                                                              │           │
│  │  workflow_transitions                                        │           │
│  │    id, workflow_id, from_state_id, to_state_id               │           │
│  │    conditions JSONB, required_roles JSONB                    │           │
│  │                                                              │           │
│  │  Entity drží: current_state_id FK → workflow_states          │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Audit Trail (append-only):                                                 │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  audit_logs (partitioned by month)                           │           │
│  │    id, user_id, entity_type, entity_id                       │           │
│  │    action (create/update/delete/read)                        │           │
│  │    changes JSONB  ← {"status": ["To Do", "In Dev"]}         │           │
│  │    ip_address, user_agent, created_at                        │           │
│  │                                                              │           │
│  │  Partitioning: měsíční partitions (performance + retence)    │           │
│  │  PHI reads: logovány, běžné reads: ne                        │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Polymorfní vazby (cross-module):                                           │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  comments      → commentable_type + commentable_id           │           │
│  │  attachments   → attachable_type + attachable_id             │           │
│  │  tags          → taggable_type + taggable_id (pivot)         │           │
│  │  watchers      → watchable_type + watchable_id               │           │
│  │  activities    → subject_type + subject_id                   │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  Sémantický search (pgvector — pro AI features):                           │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  embeddings                                                  │           │
│  │    id, entity_type, entity_id                                │           │
│  │    embedding vector(1536)  ← OpenAI/Anthropic embedding      │           │
│  │    content_hash            ← re-embed jen při změně          │           │
│  │                                                              │           │
│  │  Použití: KB Q&A, duplikát detekce, smart search             │           │
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
│  ├── app.tsx                         (Inertia + React bootstrap)           │
│  ├── types/                          (TypeScript types, generated from BE) │
│  ├── hooks/                          (shared React hooks)                  │
│  │   ├── useRealtime.ts              (Reverb WebSocket)                    │
│  │   ├── usePermissions.ts           (auth checks)                         │
│  │   ├── usePagination.ts                                                  │
│  │   ├── useFilters.ts                                                     │
│  │   └── useDebouncedSearch.ts                                             │
│  ├── components/                     (reusable UI components)              │
│  │   ├── ui/                         (shadcn/ui: Button, Modal, Badge...)  │
│  │   ├── editor/                     (Tiptap wrapper + extensions)         │
│  │   ├── kanban/                     (KanbanBoard, KanbanColumn, Card)     │
│  │   ├── gantt/                      (GanttChart, GanttRow, Dependency)    │
│  │   ├── table/                      (DataTable, filters, sort)            │
│  │   ├── forms/                      (FormBuilder, DynamicField)           │
│  │   └── charts/                     (Burndown, CFD, Velocity, Pie)       │
│  ├── layouts/                        (AppLayout, AuthLayout, AdminLayout)  │
│  ├── pages/                          (Inertia pages = route endpoints)     │
│  │   ├── Dashboard/                                                        │
│  │   ├── Projects/                                                         │
│  │   ├── Tasks/                                                            │
│  │   ├── ServiceDesk/                                                      │
│  │   ├── Knowledge/                                                        │
│  │   ├── Goals/                                                            │
│  │   ├── Reports/                                                          │
│  │   └── Admin/                      (Livewire / Filament hybrid)         │
│  └── stores/                         (Zustand stores)                      │
│      ├── useAuthStore.ts                                                   │
│      ├── useNotificationStore.ts                                           │
│      └── usePresenceStore.ts                                               │
│                                                                             │
│  Inertia flow:                                                              │
│    1. User naviguje → Inertia request                                       │
│    2. Laravel controller → return Inertia::render('Projects/Show', $data)  │
│    3. React přijme props → renderuje SPA stránku                           │
│    4. Žádné API duplikace — server-side routing, client-side rendering     │
│                                                                             │
│  React Native (budoucí):                                                    │
│    • Sdílení TypeScript typů, hooks, Zustand stores, API vrstvy           │
│    • Pouze UI komponenty platform-specific                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. KLÍČOVÉ LARAVEL PACKAGES

```
┌────────────────────────────┬────────────────────────────────────────────────┐
│ Package                    │ Účel                                           │
├────────────────────────────┼────────────────────────────────────────────────┤
│ inertiajs/inertia-laravel  │ Server-side adapter pro Inertia.js            │
│ laravel/socialite          │ Google SSO                                     │
│ laravel/sanctum            │ API token auth                                │
│ laravel/reverb             │ WebSocket server (real-time)                   │
│ laravel/scout              │ Full-text search abstrakce                    │
│ laravel/octane             │ High-performance server (Swoole/FrankenPHP)   │
│ laravel/pulse              │ Prod monitoring dashboard                     │
│ laravel/telescope          │ Dev debugging dashboard                       │
│ laravel/horizon            │ Queue monitoring (Redis) / custom RabbitMQ UI │
│ spatie/laravel-permission  │ Role + permission management (základ)         │
│ spatie/laravel-activitylog │ Audit trail (základ, rozšíříme)               │
│ spatie/laravel-medialibrary│ File management + conversions                 │
│ spatie/laravel-translatable│ Vícejazyčné modely                           │
│ maatwebsite/excel          │ CSV/XLSX import/export                        │
│ barryvdh/laravel-snappy    │ PDF generování                                │
│ phpoffice/phppresentation  │ PPTX export                                   │
│ vladimir-yuldashev/        │                                               │
│   laravel-queue-rabbitmq   │ RabbitMQ queue driver                         │
│ pgvector/pgvector          │ Vector embeddings pro AI search               │
│ tightenco/ziggy            │ Laravel routes v JS (pro Inertia)             │
│ spatie/laravel-data        │ DTO / data objects                            │
│ filament/filament          │ Admin panel scaffolding                       │
└────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 8. DOCKER COMPOSE — SLUŽBY

```yaml
# Produkční služby:
services:
  app:          # Laravel + Octane (FrankenPHP)
  reverb:       # Laravel Reverb (WebSocket)
  worker:       # Queue worker (default)
  worker-email: # Queue worker (email)
  worker-llm:   # Queue worker (LLM calls)
  scheduler:    # Laravel scheduler (cron)
  postgres:     # PostgreSQL 17
  redis:        # Redis 7
  rabbitmq:     # RabbitMQ 3.13 (management plugin)
  minio:        # MinIO (S3-compatible storage)
  mailpit:      # Dev only: email testing
```

---

## 9. PERFORMANCE ODHADY (50–200 UŽIVATELŮ)

```
┌──────────────────────────────────────────────────────────────────┐
│  S touto architekturou a počtem uživatelů:                       │
│                                                                  │
│  • Jeden server (8 CPU, 32 GB RAM) zvládne celý stack           │
│  • Octane/FrankenPHP: tisíce req/s (vs. stovky s PHP-FPM)      │
│  • PostgreSQL: miliony řádků bez problémů                       │
│  • RabbitMQ: tisíce msg/s (queue nikdy nebude bottleneck)       │
│  • Redis cache: sub-ms response na opakované queries            │
│  • Reverb: stovky concurrent WebSocket connections              │
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
│ RabbitMQ                   │ Žádný    │ Už používáte                        │
│                            │          │                                      │
│ Redis                      │ Nízký    │ Standard v Laravel ekosystému       │
│                            │          │                                      │
│ Docker                     │ Nízký    │ Standard tooling, Laravel Sail      │
│                            │          │ pro dev environment                  │
│                            │          │                                      │
│ Y.js / CRDT                │ Vysoký   │ Specializovaná oblast, ale Tiptap  │
│                            │          │ + Y.js mají dobrou dokumentaci.     │
│                            │          │ Doporučení: PoC nejdřív             │
│                            │          │                                      │
│ Tiptap editor              │ Střední  │ ProseMirror-based, React support.   │
│                            │          │ Dobrá docs. Onboarding: 1-2 týdny  │
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
│ Kafka (místo RabbitMQ)     │ ❌ Zamítnuto │ Overkill, už máte RabbitMQ      │
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
│ CRDT (Y.js) komplexita        │ Izolovaný PoC nejdřív. Fallback:           │
│                                │ pesimistický locking (jen 1 editor)        │
│                                │                                             │
│ Gantt chart performance        │ Virtualizace, lazy loading, canvas/SVG     │
│ (velké projekty)               │ rendering místo DOM                        │
│                                │                                             │
│ Monolith scaling               │ Octane + queue workers škálují vertikálně. │
│                                │ Modular structure umožní pozdější split    │
│                                │                                             │
│ React learning curve           │ Alpine → React onboarding plán, pair coding│
│ (z Alpine)                     │ Větší skok, ale investice do React se vrátí│
│                                │ (ekosystém, hiring, React Native)          │
│                                │                                             │
│ Vendor lock-in (Laravel)       │ Nízké riziko: Laravel je OSS, PHP standard│
│                                │ Modulární architektura umožní migraci      │
│                                │                                             │
│ RabbitMQ message loss          │ Durable queues, publisher confirms,        │
│                                │ dead-letter exchange, monitoring           │
└────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 13. DOPORUČENÝ VÝVOJOVÝ PLÁN

```
Fáze 0 — Setup (1-2 týdny):
  • Laravel projekt + Docker Compose
  • PostgreSQL + Redis + RabbitMQ
  • Inertia + Vue + Tailwind + Vite
  • CI/CD pipeline (GitHub Actions)
  • Auth (Google SSO)

Fáze 1 — Core (MVP):
  • Org struktura + uživatelé + práva
  • Projekty + úkoly + workflow engine
  • Kanban + tabulka view
  • Komentáře, přílohy, audit trail
  • Notifikace (in-app + email)

Fáze 2 — Extended PM:
  • OKR / Goals
  • Epics, dependencies, Gantt
  • Sprint management, velocity
  • Workload, time tracking

Fáze 3 — ITSM:
  • Service Desk portál + form builder
  • Incident/Request workflow + SLA
  • Email inbound, routing, canned responses

Fáze 4 — Knowledge Base:
  • Tiptap editor + verzování
  • Spaces / hierarchie
  • Real-time co-authoring (Y.js)
  • Meeting notes + LLM sumarizace

Fáze 5 — Polish:
  • Reporting + dashboardy
  • Rule engine
  • Google Workspace integrace
  • Migrace z Jira/Asana/Confluence
  • PDF/PPTX export
```
