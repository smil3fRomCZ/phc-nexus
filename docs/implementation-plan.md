# PHC Nexus — Implementační Plán

> Cíl: dodat kvalitní MVP pro `Projects + Work + basic approvals + notifications`
> Kontext: Laravel monolit, Inertia + React, Docker lokálně, stejný image na VPS
> Tento dokument navazuje na `docs/tech-stack-analysis.md` a `docs/business-logic-summary.md`

---

## 1. PRINCIPY REALIZACE

```
1. Scope lock:
   MVP = Projects + Work + základní approvals + notifications + audit + files

2. Jedna hlavní aplikační osa:
   Laravel + Inertia + React
   Filament/Livewire jen pro technickou administraci

3. Žádná předčasná platformizace:
   žádný rule engine v MVP
   žádné KB co-authoring v MVP
   žádné AI v MVP

4. Jedna codebase, jeden aplikační image:
   více runtime rolí (app / worker / scheduler / reverb)

5. Hardcoded core policies v MVP:
   jednodušší implementace, testování, debugging

6. Domain-first delivery:
   nejdřív kvalitní Projects + Work
   až potom rozšiřovat modulový záběr
```

---

## 2. MVP SCOPE

### In scope

- Organizace, uživatelé, role, přístupová práva
- Projekty
- Epiky a úkoly
- Stavové přechody per typ entity
- Základní approval flow
- Kanban + tabulka
- Komentáře
- Přílohy
- Audit trail
- Notifikace in-app + email
- PHI klasifikace na regulovaných typech

### Out of scope

- OKR / Goals
- Sprint velocity / workload
- Service Desk / ITSM
- Knowledge Base
- Rule engine
- AI / LLM funkce
- Pokročilé approval režimy
- Gantt jako povinná součást MVP

---

## 3. IMPLEMENTAČNÍ STRATEGIE

### Doporučené pořadí delivery

1. Platform setup
2. Identity a authorization
3. Organization model
4. Projects modul
5. Work modul
6. Approvals
7. Audit + files + comments
8. Notifications
9. Polishing, hardening, E2E
10. Produkční rollout na VPS

### Proč toto pořadí

- Bez identity, rolí a authorization nelze správně stavět Work ani Approvals.
- Projects a Work nesou hlavní business hodnotu MVP.
- Approvals mají být nad stabilním modelem entit, ne obráceně.
- Audit, files a notifications jsou průřezové capability, které je lepší připojit na ustálené use-casy.

---

## 4. MILESTONY

### Milestone 0 — Foundation

### Cíl

Založit projekt, pipeline a běhové prostředí bez business komplexity.

### Deliverables

- Laravel 13 skeleton
- Dockerfile
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`
- PostgreSQL + Redis + Caddy
- Inertia + React + TypeScript + Tailwind
- CI: lint + test + build
- základní observability a error handling

### Exit criteria

- aplikace běží lokálně přes Compose
- image lze buildnout bez manuálních kroků
- test pipeline běží v CI

---

### Milestone 1 — Identity & Access

### Cíl

Zprovoznit autentizaci a primární authorization model.

### Deliverables

- login přes Google SSO
- invite flow
- uživatel, tým, oddělení
- role matrix
- policy enforcement
- PHI klasifikace a základní access pravidla

### Exit criteria

- každý endpoint a každá Inertia page má autorizační pravidla
- existují testy pro critical auth flows

---

### Milestone 2 — Projects Core

### Cíl

Dodat základní projektový kontext.

### Deliverables

- projekty CRUD
- základní metadata projektu
- projektové členství
- projektové role
- seznam a detail projektu

### Exit criteria

- projekt lze založit, upravit, archivovat
- přístup je řízený podle rolí a členství

---

### Milestone 3 — Work Core

### Cíl

Dodat hlavní operativní práci v systému.

### Deliverables

- epiky
- úkoly
- vztahy parent/child
- stavový model per typ entity
- komentáře
- přílohy
- tabulka
- kanban

### Exit criteria

- tým zvládne řídit běžný delivery flow pouze v PHC Nexus
- všechny hlavní přechody jsou auditované

---

### Milestone 4 — Approvals & Notifications

### Cíl

Dodat regulovaný approval model a základní notifikace.

### Deliverables

- approval request
- required approvers
- režim `all approve / any reject blocks`
- email notifikace
- in-app notifikace
- reminder jobs

### Exit criteria

- approval flow funguje end-to-end
- notifikace jsou idempotentní

---

### Milestone 5 — Hardening & Release

### Cíl

Připravit MVP na nasazení a první provoz.

### Deliverables

- seed/demo data
- E2E scénáře
- backup/restore runbook
- deploy runbook
- monitoring checklist
- výkonové sanity testy

### Exit criteria

- provozní tým umí aplikaci nasadit na VPS bez autora feature
- restore DB a files je odzkoušený

---

## 5. WORKSTREAMY

### A. Platform

- Docker
- CI/CD
- env management
- deploy script
- backupy
- logging

### B. Backend

- moduly
- use-cases
- policies
- queue jobs
- audit

### C. Frontend

- layouts
- page shells
- forms
- kanban
- table views

### D. Quality

- unit testy
- feature testy
- E2E
- static analysis
- smoke checklist

### E. Product/Data

- naming
- workflow map pro MVP
- seed scénáře
- acceptance criteria

---

## 6. DOPORUČENÁ STRUKTURA BACKLOGU

Každý task v backlogu má mít:

- business cíl
- scope hranice
- acceptance criteria
- affected module
- data impact
- security/privacy impact
- test scope

### Epics pro MVP

1. Foundation & Tooling
2. Authentication & Authorization
3. Organization
4. Projects
5. Work
6. Approvals
7. Comments / Files / Audit
8. Notifications
9. Production Readiness

---

## 7. GIT STRATEGIE

### Doporučený model

**Trunk-based development** s krátkodobými branchemi.

### Branches

- `main`
  - vždy releasable
  - protected branch
- krátkodobé feature branche
  - `feat/...`
  - `fix/...`
  - `chore/...`
  - `docs/...`
  - `refactor/...`

### Proč ne `develop`

- tým je relativně malý
- MVP scope je záměrně úzký
- chceme co nejméně merge overheadu
- dual-track `main/develop` by přidal proces bez reálného přínosu

### Branch naming

Příklad:

- `feat/auth-google-sso`
- `feat/work-task-board`
- `fix/approval-deadlock`
- `docs/implementation-plan`

### Pravidla

- branch žije ideálně 1–3 dny
- branch má řešit jednu logickou změnu
- velké feature rozdělit za feature flag nebo po vertikálních slicech
- žádné dlouho žijící integrační branche

---

## 8. COMMIT STRATEGIE

### Doporučení

Používat **Conventional Commits**.

### Formát

`type(scope): summary`

### Příklady

- `feat(auth): add Google SSO login flow`
- `feat(work): add task status transition service`
- `fix(approvals): prevent duplicate approval vote`
- `refactor(projects): extract project membership policy`
- `docs(architecture): add implementation plan`

### Pravidla

- commit message musí vysvětlit záměr změny
- necommitovat rozbitý stav
- squash merge je default

---

## 9. PR STRATEGIE

### Velikost PR

- preferovaně do `300–600` řádků diffu
- větší změny dělit po vrstvách nebo use-case slices

### Každý PR musí obsahovat

- co se mění
- proč se to mění
- jaké jsou dopady
- jak se to testovalo
- screenshot/video u UI změn

### Review checklist

- sedí změna do MVP scope?
- nevzniká generická abstrakce předčasně?
- neobchází se authorization?
- je audit/logging na správném místě?
- jsou testy úměrné riziku?

### Merge pravidla

- squash merge do `main`
- minimálně 1 review
- CI musí být zelená

---

## 10. RELEASE STRATEGIE

### Prostředí

- `local`
- `staging`
- `production`

### Release model

- merge do `main`
- CI buildne image
- image dostane immutable tag:
  - `git-sha`
  - volitelně semver tag
- staging deploy ze stejného image
- production deploy stejného image po schválení

### Tagging

- `v0.1.0`
- `v0.2.0`
- `v1.0.0-mvp`

### Hotfix flow

- branch z `main`: `fix/...`
- expedited review
- deploy přes stejný pipeline
- tag např. `v1.0.1`

---

## 11. DEPLOYMENT STRATEGIE

### Docker model

- jeden `Dockerfile`
- jeden aplikační image
- více služeb ze stejného image:
  - `app`
  - `worker`
  - `scheduler`
  - `reverb`

### Na VPS běží samostatně

- reverse proxy (`Caddy` nebo `Nginx`)
- `app`
- `worker`
- `scheduler`
- `reverb` pokud je potřeba
- `postgres`
- `redis`

### Důležité pravidlo

Nedávat do jednoho kontejneru zároveň:

- web runtime
- queue worker
- scheduler
- PostgreSQL
- Redis

To komplikuje restart policy, scaling, observability i debugging.

---

## 12. FEATURE FLAGS

Použít pro:

- nedokončené UI části
- rollout rizikových změn
- interní admin-only funkce
- pozdější moduly mimo MVP

### Nepoužívat pro

- obcházení nedokončené architektury
- dlouhodobé paralelní implementace bez plánu odstranění

---

## 13. TEST STRATEGIE

### Backend

- unit testy pro čistou business logiku
- feature testy pro HTTP/use-case flows
- authorization testy pro kritické endpointy
- queue job testy pro side effects

### Frontend

- Vitest pro menší logiku a komponenty
- Playwright pro kritické user flows

### Povinné E2E scénáře pro MVP

1. login a přístup podle role
2. založení projektu
3. založení úkolu
4. změna stavu úkolu
5. approval flow
6. komentář + příloha
7. notifikace po důležité akci

---

## 14. DEFINITION OF DONE

Task je hotový pouze pokud:

- je implementovaný end-to-end
- má vyjasněná acceptance criteria
- respektuje MVP scope
- prošel code review
- má odpovídající testy
- má vyřešený authorization impact
- má vyřešený audit/security impact
- je zdokumentovaný, pokud mění workflow nebo provoz

---

## 15. ROLE V TÝMU

### Tech Lead

- drží architektonické hranice
- schvaluje větší refactory
- hlídá scope a sequencing

### Backend Developer

- use-cases
- policies
- jobs
- persistence

### Frontend Developer

- Inertia pages
- forms
- tables
- kanban interactions

### Product/Domain Owner

- acceptance criteria
- workflow pravidla
- prioritizace backlogu

---

## 16. RIZIKA REALIZACE

- Scope creep z business dokumentu
- Předčasný rule engine
- Příliš mnoho „shared“ helperů místo doménových služeb
- Slabé authorization testy
- Velké PR bez jasné hranice odpovědnosti
- Produkční deploy bez odzkoušeného restore

### Mitigace

- držet MVP scope lock
- weekly scope review
- trunk-based branch discipline
- release checklist
- restore drills

---

## 17. DOPORUČENÝ PRAKTICKÝ REŽIM TÝMU

### Týdenní rytmus

- Pondělí: planning + scope lock
- Denně: krátký sync nad blockers
- Průběžně: malé PR do `main`
- Pátek: staging demo + risk review

### Cadence release

- staging deploy průběžně
- production 1x týdně nebo podle potřeby
- hotfix mimo cadence jen pro kritické chyby

---

## 18. PRVNÍ 3 TÝDNY — KONKRÉTNÍ PLÁN

### Týden 1

- založení projektu
- Docker dev/prod setup
- CI pipeline
- auth skeleton
- Inertia shell + layout

### Týden 2

- organization model
- user roles
- authorization matrix
- project CRUD

### Týden 3

- task model
- task CRUD
- status transitions
- základ tabulky a boardu

---

## 19. DOPORUČENÉ DALŠÍ ARTEFAKTY

Po tomto dokumentu dává smysl vytvořit:

- `docs/adr/ADR-001-mvp-scope.md`
- `docs/adr/ADR-002-git-strategy.md`
- `docs/adr/ADR-003-docker-deployment-model.md`
- `docs/runbooks/deploy.md`
- `docs/runbooks/backup-restore.md`
- `docs/testing-strategy.md`
