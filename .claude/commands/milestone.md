# /milestone

Zkontroluj progress aktuálního milestone proti deliverables.

## Input

$ARGUMENTS — číslo milestone (0–5), nebo prázdné pro autodetekci z aktuálního stavu

## Milestony

| # | Název | Klíčové deliverables |
|---|-------|---------------------|
| 0 | Foundation | Laravel skeleton, Dockerfile, Docker Compose, Inertia+React+Tailwind, CI, observability |
| 1 | Identity & Access | Google SSO, invite flow, role matrix, PHI klasifikace, auth testy |
| 2 | Projects Core | Audit envelope, file contract, comment model, projekty CRUD, členství |
| 3 | Work Core | Epiky, úkoly, stavový model, komentáře, přílohy, kanban, tabulka |
| 4 | Approvals & Notifications | Approval flow, email notifikace, in-app notifikace, reminders |
| 5 | Hardening & Release | Seed/demo data, E2E scénáře, backup/restore runbook, deploy runbook |

## Postup

1. **Přečti `docs/implementation-plan.md`** — sekce 4 (milestony)
2. Pro cílový milestone vypiš všechny deliverables
3. **Zkontroluj codebase** pro důkazy každého deliverable:
   - `app/Modules/` — implementované moduly
   - `database/migrations/` — schéma
   - `tests/` — pokrytí
   - `docker-compose*.yml` — infrastruktura
   - `.github/workflows/` — CI
   - `resources/js/Pages/` — frontend stránky
4. Pro každý deliverable reportuj: **DONE** / **IN PROGRESS** / **NOT STARTED**
5. Zkontroluj exit criteria
6. **Shrnutí:** X/Y deliverables hotovo, blokery pokud existují
