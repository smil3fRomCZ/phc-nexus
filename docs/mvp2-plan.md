# PHC Nexus — MVP2 Implementační Plán

> **Cíl:** Dotáhnout aplikaci do plně použitelného stavu — opravit broken flows, dodělat chybějící CRUD, přidat globální pohledy, admin sekci a UX polish.
>
> **Kontext:** MVP1 (M0–M5 + dashboard/search/task detail) je hotový. Backend má rozsáhlé capabilities, které frontend neexponuje. MVP2 je o propojení.
>
> **Datum zahájení:** 2026-03-27

---

## AS-IS Shrnutí (stav po MVP1)

### Funguje end-to-end
- Dashboard (stat tiles, my work, pending approvals)
- Projekty CRUD (create, view, edit)
- Tasks: quick-add, kanban drag&drop, table sort/filter, status transitions
- Task detail: threaded komentáře, přílohy, status transitions
- Approvals: zobrazení, hlasování, cancel
- Notifikace: zobrazení, mark as read
- Globální search (Cmd+K)

### Broken / Placeholder
- 5 sidebar linků → `#` (Task Board, My Tasks, Approvals, Users, Documents)
- Dashboard "Review" tlačítko — špatný URL
- Delete operace — backend existuje, frontend nemá tlačítka
- Full task/epic edit — backend existuje, UI chybí
- Create approval — backend existuje, UI chybí
- TaskAssigned/TaskStatusChanged notifikace se neodesílají

### Backend existuje, frontend neexponuje
- Organization management (divisions, teams, tribes)
- User management (list, role, status)
- Audit log (kompletní trail)
- Comments/attachments na Projects a Epics

---

## Iterace

### Iterace 1 — Opravit broken + dodělat CRUD
**Branch prefix:** `feat/mvp2-i1-*`
**Scope:** Opravit co je rozbité, dodělat chybějící CRUD operace

| # | Úkol | Typ | Effort |
|---|------|-----|--------|
| 1.1 | Fix dashboard approval links (špatný URL na Review tlačítku) | Fix | S |
| 1.2 | Full task edit form (description, assignee, priority, due date) | Feature | M |
| 1.3 | Epic edit form (title, description, status, owner) | Feature | M |
| 1.4 | Delete tlačítka — project, task, epic (s potvrzením) | Feature | S |
| 1.5 | Create approval UI (formulář pro request approval na tasku) | Feature | M |
| 1.6 | Trigger TaskAssigned notifikace při přiřazení | Fix | S |
| 1.7 | Trigger TaskStatusChanged notifikace při změně statusu | Fix | S |

**Výstup:** Všechny existující stránky plně funkční, žádné orphaned backend endpointy.

---

### Iterace 2 — Globální pohledy + sidebar
**Branch prefix:** `feat/mvp2-i2-*`
**Scope:** Nové stránky pro globální přehledy, oprava sidebar navigace

| # | Úkol | Typ | Effort |
|---|------|-----|--------|
| 2.1 | My Tasks stránka — globální přehled úkolů přiřazených uživateli | Feature | M |
| 2.2 | Global Approvals stránka — všechny pending approvals across projects | Feature | M |
| 2.3 | Comments + attachments na Projects (routes + UI) | Feature | M |
| 2.4 | Comments + attachments na Epics (routes + UI) | Feature | S |
| 2.5 | Opravit sidebar linky (My Tasks, Approvals → nové stránky) | Fix | S |
| 2.6 | Notification deep links (klik → relevantní stránka) | Feature | S |

**Výstup:** Sidebar plně funkční, uživatel vidí svoje úkoly a approvals globálně.

---

### Iterace 3 — Admin & Organization
**Branch prefix:** `feat/mvp2-i3-*`
**Scope:** Administrační sekce — uživatelé, organizace, audit

| # | Úkol | Typ | Effort |
|---|------|-----|--------|
| 3.1 | User management stránka — seznam, role, status, search | Feature | L |
| 3.2 | Invite user UI (formulář pro pozvání nového uživatele) | Feature | M |
| 3.3 | Organization structure view (divisions → teams → users) | Feature | L |
| 3.4 | Audit log viewer (admin only, filtrování podle entity/akce/uživatele) | Feature | L |
| 3.5 | PHI access report (kdo přistupoval k PHI datům) | Feature | M |
| 3.6 | Opravit sidebar linky (Users, Documents → nové stránky) | Fix | S |

**Výstup:** Admin sekce funkční, compliance reporting.

---

### Iterace 4 — UX Polish
**Branch prefix:** `feat/mvp2-i4-*`
**Scope:** Kvalita interakcí, feedback, performance

| # | Úkol | Typ | Effort |
|---|------|-----|--------|
| 4.1 | Toast notifikace po akcích (uloženo, smazáno, chyba) | Feature | M |
| 4.2 | Inline editace na task detail (assignee, priority, due date) | Feature | M |
| 4.3 | Pagination na všech seznamech (tasks, epics, approvals, notifications) | Feature | M |
| 4.4 | Bulk operace — multi-select status change na tabulce | Feature | L |
| 4.5 | Loading states a error handling na formulářích | Feature | S |
| 4.6 | Responsive layout (mobilní sidebar, tabulky) | Feature | M |

**Výstup:** Aplikace cítí "dokončeně" — feedback na akce, plynulé interakce.

---

### Iterace 5 — Advanced Features (před AI)
**Branch prefix:** `feat/mvp2-i5-*`
**Scope:** Pokročilé funkce přidávající hodnotu pro PM workflow

| # | Úkol | Typ | Effort |
|---|------|-----|--------|
| 5.1 | Activity timeline na tasks (audit log vizualizace) | Feature | L |
| 5.2 | Export funkce (CSV/PDF pro projekty, úkoly) | Feature | L |
| 5.3 | Calendar/timeline view pro úkoly s due dates | Feature | L |
| 5.4 | Approval analytics (historie, průměrný čas schválení) | Feature | M |
| 5.5 | Task dependencies (blocker/blocked by) | Feature | L |
| 5.6 | Recurring tasks | Feature | L |

**Výstup:** Platforma s pokročilými PM funkcemi, připravená pro AI rozšíření.

---

## Effort Legenda

| Symbol | Význam | Orientační čas |
|--------|--------|----------------|
| S | Small | < 1h |
| M | Medium | 1–3h |
| L | Large | 3–6h |

---

## Pravidla pro MVP2

1. **Branch naming:** `feat/mvp2-i{N}-{popis}` (např. `feat/mvp2-i1-task-edit`)
2. **PR scope:** max 1–3 úkoly per PR, ideálně tematicky seskupené
3. **Před push:** vždy Pint + PHPStan + ESLint + Prettier lokálně
4. **Testy:** každý nový endpoint/stránka musí mít minimálně feature test
5. **Dokumentace:** aktualizovat `docs/status.md` po každé iteraci
6. **Conventional commits:** `feat(mvp2):`, `fix(mvp2):` prefix
