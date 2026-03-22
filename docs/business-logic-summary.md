# PHC Nexus — Kompletní Business Logic Summary

> Interní produktivitní platforma pro Pears Health Care group.
> Nahrazuje: Jira (Software, Service Management, Product Discovery), Asana, Confluence.
> Cílová skupina: 50–200 uživatelů, více týmů a oddělení.
> Vícejazyčné UI: CZ / EN / SK

---

## 1. HIERARCHIE PRÁCE

```
┌─────────────────────────────────────────────────────────┐
│                    COMPANY OKR (roční)                   │
│  Objective + Key Results                                │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐     ┌──────────────────┐
│ DIVISION OKR     │     │ DIVISION OKR     │
│ (Q / pololetí)   │     │ (Q / pololetí)   │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
    ┌────┴────┐              ┌────┴────┐
    ▼         ▼              ▼         ▼
┌────────┐ ┌────────┐  ┌────────┐ ┌────────┐
│TEAM OKR│ │TEAM OKR│  │TEAM OKR│ │TEAM OKR│
│(kvart.)│ │(kvart.)│  │(kvart.)│ │(kvart.)│
└───┬────┘ └───┬────┘  └───┬────┘ └───┬────┘
    │          │            │          │
    ▼          ▼            ▼          ▼
┌──────────────────────────────────────────┐
│              PORTFOLIO                    │
│  (kolekce projektů napříč týmy)          │
└──────────────────┬───────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌────────┐   ┌────────┐   ┌────────┐
│INICIAT.│   │INICIAT.│   │INICIAT.│   ← Impact scoring
└───┬────┘   └───┬────┘   └───┬────┘     (value vs. effort)
    │            │             │
    ▼            ▼             ▼
┌────────┐  ┌────────┐  ┌────────┐
│PROJEKT │  │PROJEKT │  │PROJEKT │     ← Metodika: Scrum/Kanban/Waterfall
└───┬────┘  └───┬────┘  └───┬────┘
    │           │            │
  ┌─┴──┐    ┌──┴─┐       ┌──┴─┐
  ▼    ▼    ▼    ▼       ▼    ▼
┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
│ÚKOL││ÚKOL││ÚKOL││ÚKOL││ÚKOL││ÚKOL│  ← Role: Assignee, Reporter, Viewer + custom
└─┬──┘└────┘└─┬──┘└────┘└────┘└────┘
  │           │
  ▼           ▼
┌──────┐  ┌──────┐
│PODÚK.│  │PODÚK.│
└──────┘  └──────┘
```

**Progress agregace:** zdola nahoru (Úkoly → Projekt → Iniciativa → OKR Key Result)

---

## 2. ORG STRUKTURA

```
┌─────────────────────────────────────────┐
│           PEARS HEALTH CARE             │
│              (Company)                  │
└──────────────────┬──────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ODDĚLENÍ │  │ODDĚLENÍ │  │ODDĚLENÍ │
│  IT     │  │  HR     │  │ Kliniky │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
  ┌──┴──┐     ┌──┴──┐     ┌──┴──┐
  ▼     ▼     ▼     ▼     ▼     ▼
┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
│Tým ││Tým ││Tým ││Tým ││Tým ││Tým │
│Back││Fro.││Recr││Payr││Oper││Mktg│
└────┘└────┘└────┘└────┘└────┘└────┘

TRIBES (průřezové):
┌──────────────────────────────────────┐
│ Tribe "Digital Transformation"       │
│  = Backend tým + Frontend tým + Oper │
│  (kombinace týmů/rolí napříč odděl.) │
└──────────────────────────────────────┘
```

---

## 3. ROLE & PŘÍSTUPOVÁ PRÁVA

### Systémové role

```
┌──────────────────┬────────────┬──────────┬──────────┬──────────┬──────────┐
│                  │ Portfolio  │ Projekty │  ITSM    │   KB     │ Reporty  │
│                  │ & Goals    │ & Úkoly  │          │          │          │
├──────────────────┼────────────┼──────────┼──────────┼──────────┼──────────┤
│ Executive        │ Full       │ Read     │ Read     │ Read     │ Full     │
│ Project/PM       │ Edit       │ Full     │ Read     │ Edit     │ Full     │
│ Team Member      │ Read       │ Edit own │ Create   │ Edit own │ Own      │
│ Service Desk Ag. │ —          │ Read     │ Full     │ Read     │ ITSM     │
│ Reader           │ Read       │ Read     │ Read     │ Read     │ Read     │
└──────────────────┴────────────┴──────────┴──────────┴──────────┴──────────┘
```

### Granularita práv

```
ROLE (kdo jsem)
  └─ MODUL (Portfolio / Projekty / ITSM / KB / Reporty)
       └─ ENTITA (konkrétní projekt, dokument, iniciativa)
            └─ AKCE (read / create / edit / delete / admin)
```

### Role na úkolech (single person per role)

```
Systémové (vždy):          Custom (per typ úkolu):
  • Assignee                 Dev task:     + Developer, + Code Reviewer
  • Reporter                 Design task:  + Designer, + Design Reviewer
  • Viewer                   QA task:      + Tester
```

---

## 4. MODULY

### 4.1 Goals, Portfolio & Initiatives

```
┌─ OKR CYKLUS ──────────────────────────────────────────────┐
│                                                            │
│  Planning          Execution           Closing             │
│  (začátek Q)       (průběh Q)          (konec Q)           │
│                                                            │
│  Company OKR       Týdenní/měsíční     Scoring 0–1.0      │
│  → Division        check-in            per KR              │
│  → Team            Auto-reminder       Retrospektiva       │
│  Approval:         Confidence:         Lessons learned     │
│  Head of Dept      On Track            → Knowledge Base    │
│                    At Risk                                 │
│                    Off Track                               │
└────────────────────────────────────────────────────────────┘

Portfolio = kolekce projektů
  • Konfigurovatelný dashboard (widgety, sloupce)
  • Views: tabulka, timeline, board
  • Filtry: tým, stav, priorita, deadline

Iniciativa = strategický záměr
  • Impact scoring: business value vs. effort
  • Konfigurovatelný workflow per typ
  • Víceúrovňové approvals (parallel/sequential, timeout, delegace)
```

### 4.2 Project & Work Management

```
┌─ METODIKY ────────────────────────────────────────────────┐
│                                                            │
│  Scrum:     Backlog → Sprint Planning → Active Sprint      │
│             → Review → Retro → opakuj                      │
│                                                            │
│  Kanban:    Continuous flow, WIP limity, no gates          │
│                                                            │
│  Waterfall: Initiation → Planning → Execution              │
│             → Testing → Closing                            │
└────────────────────────────────────────────────────────────┘

Workflow: konfigurovatelný per typ (stavy + přechody + podmínky)

Dev task workflow příklad:
  To Do → In Development → Code Review → Testing → Done
                              │
                   Reviewer notifikován
                   Approve → Testing
                   Request Changes → zpět In Dev

Time tracking: logování hodin přímo na úkolech
Workload: kapacita (h/týden) vs. alokace, 3 pohledy (já / tým / projekt)
```

### 4.3 Service Management

```
┌─ SERVICE DESK PORTÁL ─────────────────────────────────────┐
│                                                            │
│  Jednotný portál pro všechny service desky                 │
│  Konfigurovatelný design per desk:                         │
│    logo, barvy, banner, text, kategorie, custom CSS        │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ IT Helpdesk  │  │ HR Služby    │  │ Finance      │     │
│  │              │  │              │  │              │     │
│  │ • Incident   │  │ • Dovolená   │  │ • Fakturace  │     │
│  │ • HW request │  │ • Onboarding │  │ • Náklady    │     │
│  │ • Přístupy   │  │ • Osobní úd. │  │ • Karty      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                            │
│  Form builder: drag & drop (text, select, checkbox,        │
│    file upload, podmíněná pole, validace, required)         │
│                                                            │
│  Self-service: mé requesty, KB, oznámení, CSAT, LLM hledání│
│  Komunikace: komentáře na ticketu + email reply             │
└────────────────────────────────────────────────────────────┘

Incident workflow (ITIL):
  Submitted → Categorized → Assigned → In Progress
  → Pending → Resolved → Closed
  SLA: response time + resolution time
  Auto-eskalace po SLA breach

Change Management (CAB):
  RFC → Impact Assessment → CAB Review
  → Approved/Rejected/Deferred → Scheduled
  → Implementing → Post-Implementation Review → Closed
  Typy: Standard (pre-approved), Normal, Emergency
```

### 4.4 Knowledge Base

```
┌─ KNOWLEDGE BASE ──────────────────────────────────────────┐
│                                                            │
│  Wiki stránky (dlouhodobý obsah):                          │
│    • Dokumentace, procesy, návody                          │
│    • Hierarchická struktura (spaces / sekce / stránky)     │
│                                                            │
│  Šablonové dokumenty (opakující se):                       │
│    • Zápisy z porad                                        │
│    • RFC (Request for Comments)                            │
│    • Postmortem                                            │
│    • Decision Log                                          │
│                                                            │
│  Workflow: Draft → In Review → Approved → Published        │
│            → Archived                                      │
│  Verzování: každá editace = nová verze + diff              │
└────────────────────────────────────────────────────────────┘
```

### 4.5 Reporting & Integrations

```
┌─ REPORTING ───────────────────────────────────────────────┐
│                                                            │
│  Vestavěné dashboardy (konfigurovatelné widgety)           │
│  REST API pro Power BI                                     │
│  Konfigurovatelné reporty (building blocks):               │
│    grafy + tabulky + texty → Export PDF / PPTX             │
│                                                            │
│  LLM integrace:                                            │
│    1. Zápisy z porad (sumarizace, akční body)              │
│    2. Status reporty (generování z dat)                    │
│    3. Knowledge asistent (Q&A nad KB)                      │
│    4. Prioritizace (analýza + doporučení)                  │
│    Providery: OpenAI / Anthropic / Gemini                  │
└────────────────────────────────────────────────────────────┘
```

---

## 5. WORKFLOWS — KOMPLETNÍ MAPA

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW MAPA PHC NEXUS                          │
│                                                                          │
│  ┌─ OKR Cyklus ────────────────────────────────────────────────────┐    │
│  │ Planning → Check-iny → Scoring → Retro → Lessons Learned → KB  │    │
│  └──────────────────────────┬───────────────────────────────────────┘    │
│                             │ vazba                                      │
│  ┌─ Iniciativa ─────────────▼──────────────────────────────────────┐    │
│  │ [Konfigurovatelný per typ] + Víceúrovňové Approvals             │    │
│  │ Draft → Evaluation → Approved → Planning → In Progress → Closed │    │
│  └──────────────────────────┬───────────────────────────────────────┘    │
│                             │ rozpad                                     │
│  ┌─ Projekt ────────────────▼──────────────────────────────────────┐    │
│  │ [Per metodika: Scrum / Kanban / Waterfall]                      │    │
│  │ Scrum:  Backlog → Sprint Plan → Active → Review → Retro        │    │
│  │ Kanban: Continuous flow + WIP limity                            │    │
│  │ Water:  Init → Plan → Exec → Test → Close                      │    │
│  └──────────────────────────┬───────────────────────────────────────┘    │
│                             │ úkoly                                      │
│  ┌─ Úkol ──────────────────▼──────────────────────────────────────┐    │
│  │ [Konfigurovatelný workflow]                                     │    │
│  │ Dev: To Do → In Dev → Code Review → Testing → Done              │    │
│  │            ↑                   │                                 │    │
│  │            └── Request Changes ┘                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─ Meeting Notes ─────────────────────────────────────────────────┐    │
│  │ Agenda → Zápis (+ LLM) → Akční body → Auto Úkoly               │    │
│  │                                        → Follow-up na další mtg  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─ Incident (ITIL) ──────────────────────────────────────────────┐    │
│  │ Submitted → Categorized → Assigned → In Progress → Pending     │    │
│  │ → Resolved → Closed     [SLA tracking + auto-eskalace]         │    │
│  └──────────────┬──────────────────────────────────────────────────┘    │
│                 │ recurring?                                             │
│  ┌─ Problem ───▼───────────────────────────────────────────────────┐    │
│  │ Created → Root Cause Analysis → Solution → Iniciativa/Projekt   │    │
│  │ Vazby: Incident ↔ Problem ↔ Projekt (plná traceabilita)        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─ Change Management (CAB) ──────────────────────────────────────┐    │
│  │ RFC → Impact Assessment → CAB Review → Approved/Rejected        │    │
│  │ → Scheduled → Implementing → Post-Review → Closed               │    │
│  │ Typy: Standard (pre-approved) / Normal / Emergency              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─ Release Management ───────────────────────────────────────────┐    │
│  │ Release = kolekce features/bugfixes                             │    │
│  │ Planning → Go/No-Go checklist → Deploy → Release Notes          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─ KB Dokument ──────────────────────────────────────────────────┐    │
│  │ Draft → In Review → Changes Req. / Approved → Published        │    │
│  │ → Archived     [Verzování + diff]                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─ Retrospektiva ────────────────────────────────────────────────┐    │
│  │ Vyplnění (good/bad/akce) → Hlasování → Top akce → Auto Úkoly  │    │
│  │ Projekt retro: Lessons learned → KB                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─ Onboarding ──────────────────────────────────────────────────┐    │
│  │ Trigger: nový člen → Auto práva + úkoly + projekty + KB docs   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─ Eskalace (průřezová) ─────────────────────────────────────────┐    │
│  │ Auto: 3d overdue → PM, 7d → Head of, SLA breach → L2          │    │
│  │ Manuální: tlačítko Escalate + důvod                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. AUTENTIZACE & REGISTRACE

```
┌─ PŘIHLÁŠENÍ ──────────────────────────────────────────────┐
│                                                            │
│  Primární: Google SSO (Google Workspace účty)              │
│  Fallback: Lokální účet (email + heslo) pro externí        │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─ REGISTRACE ──────────────────────────────────────────────┐
│                                                            │
│  Pouze invite (žádná otevřená registrace):                 │
│                                                            │
│  Admin klikne "Invite"                                     │
│    → Zadá email + role + tým                               │
│      → Uživatel dostane email s odkazem                    │
│        → Klikne → Google SSO → účet vytvořen               │
│          → Auto: onboarding workflow se spustí              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 7. VIEWS & ZOBRAZENÍ

```
┌─ ZÁKLADNÍ VIEWS (na všech entitách) ─────────────────────┐
│                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ KANBAN   │ │ TIMELINE │ │ TABULKA  │ │ KALENDÁŘ │     │
│  │          │ │ / GANTT  │ │ / LIST   │ │          │     │
│  │ Sloupce  │ │ Časová   │ │ Řádky,   │ │ Měsíc /  │     │
│  │ Drag&drop│ │ osa,     │ │ sloupce, │ │ týden,   │     │
│  │ WIP limit│ │ dependen.│ │ inline   │ │ deadliny │     │
│  │ Swimlanes│ │ mileston.│ │ edit     │ │          │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                            │
│  ┌─ SPECIÁLNÍ VIEWS ────────────────────────────────┐     │
│  │ • Workload heatmapa (tým/člověk)                 │     │
│  │ • Dashboard / summary (konfig. widgety)          │     │
│  │ • Dependency graph (kritická cesta, blockery)    │     │
│  │ • Activity feed (chronologický proud)            │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  Konfigurace: sloupce, filtry, řazení, seskupení, barvy   │
│  Uložení: osobní nebo sdílený pohled s týmem              │
└────────────────────────────────────────────────────────────┘
```

---

## 8. PRŮŘEZOVÉ FUNKCE

### Automatické vazby mezi moduly

```
Akční bod z porady ──────────→ Auto Úkol
Incident (recurring) ────────→ Auto Problem record
Problem (needs fix) ─────────→ PM vytvoří Iniciativu/Projekt
Retro akce ──────────────────→ Auto Úkol do dalšího sprintu
Retro lessons learned ───────→ Auto KB dokument
Onboarding trigger ──────────→ Auto úkoly + práva + projekty
KR progress ←────────────────── Auto agregace z projektů/úkolů
```

### Custom Fields

```
Admin může přidat na jakýkoli typ entity:
  • Text (jednořádkový, víceřádkový)
  • Číslo
  • Datum
  • Select (dropdown)
  • Multi-select
```

### Rule Engine (automatizace)

```
WHEN: [událost nebo čas]
  AND: [podmínky]
  THEN: [akce]

Příklady:
  • Úkol 3d po deadline + stav != Done → priorita High + notif PM + label "overdue"
  • Incident přiřazen → SLA timer start
  • Projekt health = Red 14 dní → exec alert
```

### Audit Trail

```
Každá změna na každé entitě:
  • Kdo změnil
  • Co změnil (pole)
  • Kdy
  • Stará hodnota → Nová hodnota
  • Nepřepisovatelný log
```

### Notifikace

```
Kanály: In-app + Email + API (Slack / Teams / Mattermost)
Konfigurace: per uživatel (co chci dostávat, kam)
```

### File Management

```
Přílohy na entitách (drag & drop, preview)
Verzování: každý upload = nová verze (historie)
Limity (admin): max velikost, povolené typy, storage quota
```

### Google Workspace integrace

```
┌──────────────┬────────────────────────────────────────────┐
│ Calendar     │ Porada → auto událost, deadliny v Calendar │
│ Drive        │ Připojit soubor k úkolu, auto-folder       │
│ Gmail        │ Notifikace, reply-to-comment z emailu      │
│ Docs         │ Embed do KB, vytvořit Doc z úkolu          │
└──────────────┴────────────────────────────────────────────┘
```

### LLM integrace

```
┌──────────────┬────────────────────────────────────────────┐
│ Zápisy       │ Sumarizace, extrakce akčních bodů          │
│ Reporty      │ Generování status reportů z dat            │
│ KB Asistent  │ Q&A nad interní dokumentací                │
│ Prioritizace │ Analýza + doporučení na základě dat        │
│              │ Providery: OpenAI / Anthropic / Gemini     │
└──────────────┴────────────────────────────────────────────┘
```

---

## 9. ADMINISTRACE

```
┌─ ADMIN PANEL ─────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌─ Správa uživatelů ────────────────────────────────────────────┐    │
│  │ • Invite / deaktivace uživatelů                               │    │
│  │ • Přiřazení rolí (Executive, PM, Member, Agent, Reader)       │    │
│  │ • Přiřazení do týmů / oddělení / tribes                      │    │
│  │ • Kapacita (h/týden) per uživatel                             │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ Org struktura ───────────────────────────────────────────────┐    │
│  │ • CRUD oddělení, týmů, tribes                                 │    │
│  │ • Hierarchie: oddělení → týmy                                 │    │
│  │ • Tribes: cross-team skupiny                                  │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ Workflow konfigurace ────────────────────────────────────────┐    │
│  │ • Definice stavů + přechodů + podmínek per typ entity         │    │
│  │ • Approval řetězce (parallel/sequential, timeout, delegace)   │    │
│  │ • Mapování workflow na typy projektů/úkolů/incidentů          │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ Typy entit + Custom fields ──────────────────────────────────┐    │
│  │ • Definice typů úkolů (Dev task, Design task, Bug, Story...)  │    │
│  │ • Definice typů incidentů, requestů, změn                     │    │
│  │ • Custom fields per typ entity                                │    │
│  │ • Custom role na úkolech per typ                              │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ Service Desk konfigurace ────────────────────────────────────┐    │
│  │ • CRUD service desků (IT, HR, Finance...)                     │    │
│  │ • Portál design per desk (logo, barvy, banner, CSS)           │    │
│  │ • Katalog služeb per desk (kategorie, ikony, pořadí)          │    │
│  │ • Form builder (drag & drop formuláře)                        │    │
│  │ • SLA definice (response time, resolution time per priorita)  │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ Přístupová práva ────────────────────────────────────────────┐    │
│  │ • Nastavení práv: role × modul × entita                       │    │
│  │ • Default práva per role                                      │    │
│  │ • Override na úrovni konkrétní entity                         │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ Rule Engine ─────────────────────────────────────────────────┐    │
│  │ • CRUD automatizačních pravidel                               │    │
│  │ • Triggery: událost / čas / podmínka                          │    │
│  │ • Akce: změna stavu, notifikace, přiřazení, label, eskalace  │    │
│  │ • Logy spuštěných pravidel                                    │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ Integrace ───────────────────────────────────────────────────┐    │
│  │ • Google Workspace (Calendar, Drive, Gmail, Docs)             │    │
│  │ • LLM providery (API klíče, model selection)                  │    │
│  │ • Slack / Teams / Mattermost (webhook/API konfig)             │    │
│  │ • Power BI API (endpointy, tokeny)                            │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ File storage ────────────────────────────────────────────────┐    │
│  │ • Max velikost per soubor                                     │    │
│  │ • Povolené typy souborů (whitelist)                           │    │
│  │ • Storage quota per projekt / tým                             │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ Audit & monitoring ──────────────────────────────────────────┐    │
│  │ • Prohlížení audit logu (filtry: uživatel, entita, čas)      │    │
│  │ • Export audit logu                                           │    │
│  │ • Rule engine execution log                                   │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─ Vzhled & lokalizace ─────────────────────────────────────────┐    │
│  │ • Vícejazyčné UI (CZ / EN / SK)                              │    │
│  │ • Branding (logo, barvy platformy)                            │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 10. CHECKLIST — MÁ BUSINESS LOGIKA VŠE?

| Oblast | Stav | Detaily |
|--------|------|---------|
| Hierarchie práce | ✅ | 4 úrovně: Iniciativa → Projekt → Úkol → Podúkol |
| OKR / Goals | ✅ | Company → Division → Team, plný cyklus |
| Portfolia | ✅ | Kolekce projektů, konfig. dashboard |
| Initiatives | ✅ | Impact scoring, konfig. workflow, approvals |
| Projekty | ✅ | Flexibilní metodiky, konfig. workflow |
| Úkoly | ✅ | Role (systémové + custom), delivery flow |
| Workload | ✅ | Kapacita vs. alokace, 3 pohledy |
| Time tracking | ✅ | Vestavěný, logování na úkolech |
| Service Management | ✅ | Multi-tým, ITIL, SLA, katalogy |
| Service Desk Portál | ✅ | Konfig. design, form builder, self-service |
| Change Management | ✅ | CAB proces, 3 typy změn |
| Knowledge Base | ✅ | Wiki + šablony, verzování, review flow |
| Meeting Notes | ✅ | Plný cyklus s LLM + auto akční body |
| Release Management | ✅ | Kolekce features, Go/No-Go checklist |
| Retrospektivy | ✅ | Vestavěné, hlasování, auto úkoly |
| Onboarding | ✅ | Auto workflow při přidání člena |
| Views | ✅ | 4 základní + 4 speciální, konfigurovatelné |
| Org struktura | ✅ | Oddělení → Týmy + Tribes |
| Role & práva | ✅ | 5 rolí, granulární (role × modul × entita) |
| Autentizace | ✅ | Google SSO + lokální účty |
| Registrace | ✅ | Invite-only |
| Custom fields | ✅ | Plně konfig. na všech entitách |
| Rule Engine | ✅ | Trigger + podmínka + akce |
| Eskalace | ✅ | Auto (rule engine) + manuální |
| Audit trail | ✅ | Plný log, nepřepisovatelný |
| Notifikace | ✅ | In-app, email, Slack/Teams/Mattermost |
| File management | ✅ | Přílohy, verzování, limity |
| Google Workspace | ✅ | Calendar, Drive, Gmail, Docs |
| LLM integrace | ✅ | 4 use cases, multi-provider |
| Reporting | ✅ | Dashboardy, Power BI API, PDF/PPTX |
| Cross-module vazby | ✅ | Automatické propojení mezi moduly |
| Administrace | ✅ | Kompletní admin panel |
| Lokalizace | ✅ | CZ / EN / SK |

---

## 11. DOPLNĚNÉ OBLASTI

### Mobilní přístup & Offline

```
Pouze desktop web (mobilní přístup není priorita)
Offline režim: ne (interní nástroj, vždy online)
```

### Globální vyhledávání

```
Full-text search napříč všemi moduly + filtry:
  • Hledá v: úkolech, projektech, incidentech, KB, meeting notes
  • Filtry: modul, stav, tým, datum, autor
  • Výsledky seskupené dle typu entity
```

### Komentáře & diskuze

```
Na všech entitách:
  • Komentáře s vláknovými odpověďmi (threads)
  • @mentions uživatelů i týmů → notifikace
  • Emoji reactions
```

### Tagy & labely

```
Globální systém tagů napříč moduly:
  Předdefinované (admin): critical, blocked, quick-win, security, compliance
  Uživatelské: #payment, #onboarding, #Q2-2026
  Barevné kódování
  Filtrovat a seskupovat dle tagů napříč celým systémem
```

### Šablony projektů

```
Plné šablony zahrnující:
  • Metodika (Scrum/Kanban/Waterfall)
  • Workflow
  • Předdefinované úkoly + milestones
  • Role (PM, Tech Lead, QA Lead...)
  Klik → nový projekt ze šablony
```

### Auto-detekce duplikátů

```
Při vytváření entity systém navrhne podobné existující:
  ⚠ "Podobné incidenty: #1201, #1195"
  [Spojit s existujícím]  [Přesto vytvořit]
Agent může mergovat duplikáty
```

### Archivace & retence

```
Konfigurovatelné retence (admin):
  • Uzavřené úkoly: archiv po X měsících
  • Uzavřené projekty: archiv po X letech
  • Audit log: nikdy nemazat
Archivovaná data: read-only, hledatelná, možnost obnovit
```

### Migrace dat

```
Plná migrace z Jira / Asana / Confluence:
  • Projekty, úkoly, KB stránky, incidenty
  • Včetně historie a příloh
```

### API

```
API-first (plné REST API):
  • Každá funkce dostupná přes API
  • Autentizace: API key / OAuth2
  • Rate limiting per klíč
  • Webhooky: POST na externí URL při událostech
  • Dokumentace: OpenAPI / Swagger
```

### Backup & Disaster Recovery

```
Automatické zálohy (denní / hodinové)
Point-in-time recovery
Dokumentovaný DR plán
```

---

## 12. DOPLNĚNO PO HLOUBKOVÉ ANALÝZE

### Osobní dashboard / Home screen
```
Home — uživatel:
  📌 Přiřazené mně          ⏳ Čeká na můj approval
  ⚠ Overdue úkoly          📅 Dnešní deadliny
  🔔 Nové notifikace        📊 Můj workload
  ⭐ Oblíbené               🕑 Nedávno otevřené
```

### Dependencies (závislosti)
```
4 typy: Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish
Blokace, auto-posun dat, kritická cesta, vizualizace v Gantt (šipky)
```

### Budget tracking
```
Per projekt/iniciativa: plán, čerpání, forecast
Rozpad: interní (hodiny × sazba) + externí (manuální)
Alert při >90% čerpání
```

### Recurring tasks
```
Opakování: denně, týdně, měsíčně, custom
Auto-vytvoření nové instance (standupy, reporty, údržba...)
```

### Bulk operace
```
Vybrat více entit → hromadně: stav, přiřazení, priorita, tag, přesun, smazání
```

### CSV/Excel import & export
```
Export: jakýkoli view → CSV/XLSX
Import: CSV s mapováním sloupců → hromadné vytvoření
```

### Risk register
```
Per projekt: riziko, pravděpodobnost, dopad, mitigace, vlastník
Risk score = probability × impact
```

### Favorites & recent
```
⭐ Hvězdička na jakoukoli entitu = oblíbené
🕑 Auto seznam nedávno otevřených
Rychlý přístup z navigace a home
```

### Watchers / follow
```
👁 Watch na jakékoli entitě → notifikace o změnách
Nezávislé na přiřazení/roli
```

### GDPR / data governance
```
Export osobních dat, anonymizace při smazání účtu, data processing log
```

### Prioritní systém
```
Konfigurovatelné úrovně (admin): Critical, High, Medium, Low + custom
Barevné kódování, vazba na SLA timery
```

### Notifikační předvolby & digest
```
Granulární: událost × kanál (in-app / email / Slack)
Digest: denní souhrn + týdenní přehled
```

### Asset register (základní CMDB)
```
Evidence IT aktiv (servery, PC, licence, SW)
Vazba na incidenty a changes. Plný CMDB = fáze 2
```

### Deep links & embedding
```
Každá entita = unikátní URL (kopírovatelný odkaz)
Embed live widgety do KB stránek (task karta, graf)
```

### Email inbound
```
Dedikovaná adresa per service desk → auto ticket
Forward email → nový úkol
Reply na notifikaci → komentář
```

### Auto-routing (service desk)
```
Routing pravidla: kategorie + priorita → agent/tým
Load balancing: round-robin, least-busy
Business hours aware
```

### Business hours
```
Konfigurovatelná pracovní doba per service desk
SLA počítá jen v pracovních hodinách
Kalendář svátků (ČR)
```

### Šablony entit (rozšířené)
```
Šablony pro: úkoly, incidenty, KB stránky, meeting notes, RFC
Předdefinovaná pole, popisy, checklisty
```

### Sprint & velocity metriky
```
Burndown / burnup charty per sprint
Velocity tracking (SP/sprint historicky)
Sprint analytics: committed vs. completed, carry-over
```

---

## 13. FINÁLNÍ CHECKLIST (93 oblastí)

| # | Oblast | Stav | Detaily |
|---|--------|------|---------|
| | **HIERARCHIE & STRATEGIE** | | |
| 1 | Hierarchie práce | ✅ | 4 úrovně: Iniciativa → Projekt → Úkol → Podúkol |
| 2 | OKR / Goals | ✅ | Company → Division → Team, plný cyklus |
| 3 | Portfolia | ✅ | Kolekce projektů, konfig. dashboard |
| 4 | Initiatives | ✅ | Impact scoring, konfig. workflow, approvals |
| | **PROJECT & WORK MANAGEMENT** | | |
| 5 | Projekty | ✅ | Flexibilní metodiky, konfig. workflow, šablony |
| 6 | Úkoly | ✅ | Role (systémové + custom), delivery flow |
| 7 | Dependencies | ✅ | 4 typy (FS/SS/FF/SF), blokace, auto-posun, kritická cesta |
| 8 | Recurring tasks | ✅ | Denně/týdně/měsíčně/custom, auto-vytvoření |
| 9 | Workload | ✅ | Kapacita vs. alokace, 3 pohledy |
| 10 | Time tracking | ✅ | Vestavěný, logování na úkolech |
| 11 | Budget tracking | ✅ | Plán/čerpání/forecast, interní + externí náklady |
| 12 | Risk register | ✅ | Pravděpodobnost × dopad, mitigace, vlastník |
| 13 | Sprint metriky | ✅ | Burndown/up, velocity, committed vs. completed |
| | **SERVICE MANAGEMENT** | | |
| 14 | Service Management | ✅ | Multi-tým, ITIL, SLA, katalogy |
| 15 | Service Desk Portál | ✅ | Konfig. design, form builder, self-service |
| 16 | Change Management | ✅ | CAB proces, 3 typy změn |
| 17 | Asset register | ✅ | Základní CMDB, vazba na incidenty/changes |
| 18 | Auto-routing | ✅ | Pravidla + round-robin + least-busy |
| 19 | Business hours | ✅ | Pracovní doba per desk, svátky, SLA výpočet |
| 20 | Prioritní systém | ✅ | Konfig. úrovně, barvy, vazba na SLA |
| | **KNOWLEDGE & COLLABORATION** | | |
| 21 | Knowledge Base | ✅ | Wiki + šablony, verzování, review flow |
| 22 | Meeting Notes | ✅ | Plný cyklus s LLM + auto akční body |
| 23 | Komentáře & diskuze | ✅ | Vlákna, @mentions, reactions |
| 24 | Deep links & embed | ✅ | Unikátní URL, live widgety v KB |
| | **WORKFLOWS** | | |
| 25 | Release Management | ✅ | Kolekce features, Go/No-Go checklist |
| 26 | Retrospektivy | ✅ | Vestavěné, hlasování, auto úkoly |
| 27 | Onboarding | ✅ | Auto workflow při přidání člena |
| 28 | Eskalace | ✅ | Auto (rule engine) + manuální |
| 29 | Cross-module vazby | ✅ | Automatické propojení mezi moduly |
| | **VIEWS & UX** | | |
| 30 | Views | ✅ | 4 základní + 4 speciální, konfigurovatelné |
| 31 | Osobní dashboard | ✅ | Home: úkoly, approvals, overdue, workload, oblíbené |
| 32 | Favorites & recent | ✅ | Hvězdička + nedávné + rychlý přístup |
| 33 | Watchers / follow | ✅ | Watch na entitě → notifikace |
| 34 | Bulk operace | ✅ | Hromadné akce nad více entitami |
| | **ORG & PŘÍSTUPY** | | |
| 35 | Org struktura | ✅ | Oddělení → Týmy + Tribes |
| 36 | Role & práva | ✅ | 5 rolí, granulární (role × modul × entita) |
| 37 | Autentizace | ✅ | Google SSO + lokální účty |
| 38 | Registrace | ✅ | Invite-only + onboarding workflow |
| 39 | GDPR / governance | ✅ | Export dat, anonymizace, processing log |
| | **KONFIGURACE & ADMIN** | | |
| 40 | Custom fields | ✅ | Plně konfig. na všech entitách |
| 41 | Šablony (vše) | ✅ | Projekty, úkoly, incidenty, KB, meeting notes |
| 42 | Rule Engine | ✅ | Trigger + podmínka + akce |
| 43 | Tagy & labely | ✅ | Globální, barevné, admin + uživatelské |
| 44 | Administrace | ✅ | Kompletní admin panel |
| | **PRŮŘEZOVÉ FUNKCE** | | |
| 45 | Audit trail | ✅ | Plný log, nepřepisovatelný |
| 46 | Notifikace | ✅ | In-app, email, Slack/Teams/Mattermost API |
| 47 | Notif. předvolby | ✅ | Granulární per událost × kanál + digest |
| 48 | Globální search | ✅ | Full-text + filtry napříč moduly |
| 49 | File management | ✅ | Přílohy, verzování, limity |
| 50 | Detekce duplikátů | ✅ | Auto-detekce + merge |
| 51 | Email inbound | ✅ | Auto ticket z emailu, reply → komentář |
| | **INTEGRACE** | | |
| 52 | Google Workspace | ✅ | Calendar, Drive, Gmail, Docs |
| 53 | LLM integrace | ✅ | 4 use cases, multi-provider |
| 54 | REST API | ✅ | API-first, OAuth2, webhooky, OpenAPI docs |
| 55 | CSV/Excel I/O | ✅ | Import + export |
| 56 | Reporting | ✅ | Dashboardy, Power BI API, PDF/PPTX |
| | **INFRASTRUKTURA** | | |
| 57 | Lokalizace | ✅ | CZ / EN / SK |
| 58 | Archivace & retence | ✅ | Konfigurovatelné, read-only archiv |
| 59 | Migrace dat | ✅ | Plná migrace z Jira/Asana/Confluence |
| 60 | Backup & DR | ✅ | Auto zálohy, point-in-time recovery |
| 61 | Mobilní přístup | ✅ | Desktop only |
| 62 | Offline | ✅ | Ne (vždy online) |
| | **DOPLNĚNO PO ANALÝZE v2** | | |
| 63 | Git linking (základní) | ✅ | Commit/PR → auto-link na entitu, GitHub/GitLab/Bitbucket |
| 64 | Real-time co-authoring KB | ✅ | Simultánní editace, presence indikátory, CRDT |
| 65 | Incident vs. Service Request | ✅ | Dva oddělené typy s vlastním workflow a SLA |
| 66 | Inline text komentáře KB | ✅ | Highlight → comment přímo v textu dokumentu |
| 67 | SLA pre-breach warning | ✅ | Upozornění při 50/75/90% spotřeby SLA |
| 68 | SLA pause conditions | ✅ | Pause při Pending, konfigurovatelná pravidla |
| 69 | Canned responses / Macros | ✅ | Předdefinované odpovědi + akce pro agenty |
| 70 | Private notes | ✅ | Interní poznámky viditelné jen agentům |
| 71 | Definition of Ready (DoR) | ✅ | Checklist kritérií před sprintem |
| 72 | Cycle time / CFD metriky | ✅ | Lead time, cycle time, throughput, CFD, flow efficiency |
| 73 | Baseline management (EVM) | ✅ | Schedule/cost/scope baseline, CPI, SPI, EAC |
| 74 | Quick peek / Side peek | ✅ | Detail entity v pravém panelu bez ztráty kontextu |
| 75 | Page analytics KB | ✅ | Zobrazení, čtenáři, search analytics, content health |
| 76 | Content expiry dates | ✅ | Datum platnosti KB stránek, auto-review |
| 77 | Known Error Database (KEDB) | ✅ | Workaround záznamy linkované na Problem records |
| 78 | Sentry integrace | ✅ | Alert → auto incident, deduplikace, auto-resolve |
| 79 | Backlinks panel KB | ✅ | Seznam odkazujících stránek/entit |
| 80 | Synced content blocks | ✅ | Reusable bloky s live propagací změn |
| 81 | Agent collision detection | ✅ | Varování při souběžné práci na ticketu |
| 82 | Ticket merge / split | ✅ | Spojení a rozdělení ticketů |
| 83 | Diagramy nativně | ✅ | Mermaid / PlantUML v rich text editoru |
| 84 | KB import Confluence/Notion | ✅ | Import wizard pro migraci KB obsahu |
| 85 | Guest / external collaborator | ✅ | Omezený přístup pro dodavatele/klienty |
| 86 | AI rozšíření (8 use cases) | ✅ | +Sprint planning AI, decomposition, semantic search, predictive delivery |
| 87 | Conflict resolution | ✅ | CRDT pro KB, merge dialog pro entity |
| 88 | Circular dependency detection | ✅ | Validace cyklických závislostí |
| 89 | Projekt lifecycle | ✅ | Draft → Active → On Hold → Completed → Archived |
| 90 | Offboarding flow | ✅ | Re-assign, odebrání práv, anonymizace |
| 91 | Podúkoly při zavření parentu | ✅ | Warning / auto-close / block (konfigurovatelné) |
| 92 | HIPAA / PHI handling | ✅ | Označení, omezený přístup, šifrování, audit |
| 93 | PII masking | ✅ | Auto-detekce a maskování osobních údajů |

---

## 14. DOPLNĚNO PO HLOUBKOVÉ ANALÝZE (v2)

### Git integrace (základní linking)
```
Commit/PR obsahující ID entity (NEXUS-123) → auto-link na entitu
Na kartě úkolu: záložka "Code" se seznamem linkovaných commitů/PR
Podporované platformy: GitHub, GitLab, Bitbucket
Pouze linking — bez auto status change z PR
```

### Real-time simultánní editace KB
```
Live co-authoring: více uživatelů edituje stejnou KB stránku současně
Presence indikátory: kurzory + avatary editujících uživatelů
Conflict resolution: CRDT / operational transform pro bezkonfliktní merge
```

### Incident vs. Service Request (oddělení)
```
Dva samostatné typy s vlastními workflow a SLA:

Incident (přerušení služby):
  Submitted → Categorized → Assigned → In Progress → Pending → Resolved → Closed
  SLA: response time + resolution time

Service Request (standardní požadavek):
  Submitted → Approval (pokud vyžadován) → Fulfillment → Closed
  SLA: fulfillment time
```

### Inline text komentáře v KB
```
Highlight text v dokumentu → přidat komentář přímo k označenému místu
Vedle existujících vláknových komentářů pod dokumentem
Vizuální zvýraznění komentovaných pasáží
Resolve / unresolve per inline komentář
```

### SLA pre-breach warning
```
Upozornění při spotřebě SLA:
  50 % → informační notifikace agentovi
  75 % → warning agentovi + team leadovi
  90 % → critical alert + auto-eskalace
Vizuální indikátor na ticketu (progress bar SLA)
```

### SLA pause conditions
```
SLA timer se pozastaví při:
  • Stav Pending — čekáme na odpověď uživatele
  • Čekáme na třetí stranu
SLA timer se znovu spustí při:
  • Uživatel odpoví (komentář / email reply)
  • Agent manuálně změní stav zpět na In Progress
Přesná pravidla konfigurovatelná per service desk
```

### Canned responses / Macros (service desk)
```
Předdefinované odpovědi pro agenty:
  • Šablony textu s proměnnými ({ticket.reporter}, {ticket.id}...)
  • Jedním klikem: vložit text + provést akce (změna stavu, tagu, priority)
  • Kategorizace maker (Incident / Request / General)
  • Admin spravuje globální makra, agent si může vytvořit osobní
```

### Private notes na ticketech
```
Interní poznámky viditelné pouze agentům (ne koncovému uživateli)
Vizuálně odlišené od veřejných komentářů (žlutý pozadí / ikona zámku)
Použití: interní diskuze, eskalační poznámky, workaround notes
```

### Definition of Ready (DoR)
```
Checklist kritérií, než se item vezme do sprintu:
  • Konfigurovatelná per projekt/tým (popis jasný, AC definovány, design ready, dependencies identifikovány...)
  • Systém kontroluje splnění před přesunem do sprintu
  • Warning pokud nesplněno (soft block, ne hard block)
Protějšek Definition of Done (DoD)
```

### Cycle time / CFD metriky (Kanban)
```
Doplněk k existujícím burndown/velocity metrikám:
  • Lead time: čas od vytvoření po dokončení
  • Cycle time: čas od začátku práce po dokončení
  • Throughput: počet dokončených položek za období
  • Cumulative Flow Diagram (CFD): vizualizace toku práce přes stavy
  • WIP age: jak dlouho položky sedí v aktuálním stavu
  • Flow efficiency: aktivní čas vs. čekací čas
```

### Baseline management (EVM)
```
Uložení původního plánu projektu (baseline):
  • Schedule baseline: původní timeline
  • Cost baseline: původní rozpočet
  • Scope baseline: původní rozsah (story points / počet úkolů)
Sledování odchylek:
  • CPI (Cost Performance Index)
  • SPI (Schedule Performance Index)
  • EAC (Estimate at Completion)
  • Variance report: plán vs. skutečnost
Re-baseline při schválené změně scope
```

### Quick peek / Side peek
```
Otevření detailu entity v pravém panelu (split view):
  • Klik na úkol v listu/kanbanu → detail se otevře vpravo
  • Seznam/board zůstává viditelný vlevo
  • Šipky nahoru/dolů pro navigaci mezi entitami
  • Escape pro zavření panelu
```

### Page analytics pro KB
```
Per stránka:
  • Počet zobrazení, unikátní čtenáři
  • Průměrný čas na stránce
  • Trend zobrazení (graf)
Search analytics:
  • Co uživatelé hledají a nenajdou (zero-result queries)
  • Nejhledanější termíny
Content health dashboard:
  • Stale pages (neaktualizované X měsíců)
  • Nepřečtené stránky
  • Broken links
```

### Content expiry dates
```
KB stránka má volitelné datum platnosti (expiry date)
Po vypršení:
  • Stránka automaticky označena k revizi
  • Notifikace vlastníkovi obsahu
  • Vizuální indikátor "Expired — needs review"
  • Stránka zůstává přístupná (ne archivovaná) do dokončení revize
Konfigurovatelné per space (např. HR policies = 12 měsíců)
```

### Known Error Database (KEDB)
```
Dedikovaný záznam pro known errors:
  • Linkovaný na Problem record(s)
  • Workaround instrukce pro agenty
  • Status: Active / Resolved / Retired
  • Agent při řešení ticketu → "solved by KEDB article" → usage tracking
  • Auto-suggest KEDB článků při vytváření incidentu
```

### Sentry integrace
```
Alert ze Sentry → auto-vytvoření incidentu v PHC Nexus:
  • Deduplikace: stejný Sentry issue = update existujícího incidentu (ne nový)
  • Auto-resolve: pokud Sentry alert zmizí, incident se auto-resolve
  • Metadata: stack trace, environment, affected users z Sentry na incidentu
  • Vazba: incident ↔ Sentry issue (obousměrný link)
```

### Backlinks panel v KB
```
Na každé KB stránce záložka / sidebar sekce "Odkazující stránky":
  • Seznam všech stránek, které na aktuální odkazují
  • Včetně entit z jiných modulů (úkoly, incidenty, meeting notes)
  • Počet backlinks viditelný ve stránkovém stromě
```

### Synced / reusable content blocks
```
Blok obsahu definovaný jednou, vložitelný na N stránek:
  • Změna originálu se propaguje na všechna místa
  • Vizuálně odlišený (rámec / ikona "synced")
  • Klik → navigace na originál
  • Use cases: společné hlavičky, právní texty, kontaktní info, procedury
```

### Agent collision detection
```
Service desk: varování při souběžné práci na ticketu:
  • "Jan právě prohlíží tento ticket" (avatar + jméno)
  • Real-time indikátor (presence)
  • Volitelný soft lock: "Jan právě edituje — chcete pokračovat?"
```

### Ticket merge / split
```
Merge: spojit 2+ tickety do jednoho
  • Vybrání master ticketu, ostatní se zavřou s vazbou "merged into"
  • Komentáře a přílohy se přenesou
Split: rozdělit 1 ticket na N
  • Původní ticket zůstává, nové se vytvoří s vazbou "split from"
  • Výběr co kopírovat (popis, přílohy, metadata)
```

### Diagramy nativně v editoru
```
Rich text editor podporuje:
  • Mermaid diagramy (flowchart, sequence, gantt, ER)
  • PlantUML
  • Renderování přímo v editoru (ne jen code block)
  • Export diagramu jako PNG/SVG
```

### KB import z Confluence / Notion
```
Import wizard pro migraci KB obsahu:
  • Confluence: XML / HTML export → stránky, hierarchie, přílohy, komentáře
  • Notion: HTML / Markdown export → stránky, hierarchie
  • Mapování spaces, tagů, autorů
  • Preview před importem, výběr co importovat
Rozšíření existující migrace (Jira/Asana/Confluence pro projekty/úkoly)
```

### Guest / external collaborator role
```
Nová role: Guest
  • Přístup jen ke konkrétním projektům/entitám (explicitně pozvaný)
  • Oprávnění: read + komentáře (konfigurovatelné per pozvání)
  • Bez přístupu k admin, reportům, org struktuře
  • Vizuálně odlišený (badge "External")
  • Autentizace: lokální účet (email + heslo) nebo Google SSO
  • Invite s expirací (volitelný datum konce přístupu)
```

### AI rozšíření (nad rámec 4 základních use cases)
```
Nové AI use cases:
  5. Sprint planning AI — na základě velocity, kapacity a backlogu navrhne obsah sprintu
  6. Auto-decomposition — z epiku/user story vygeneruje podúkoly s odhadem
  7. Semantic search — vektorizovaný fulltext přes všechny entity (přesnější než keyword search)
  8. Predictive delivery date — ML odhad dokončení projektu na základě historických dat
```

### Conflict resolution
```
KB stránky: CRDT / operational transform (viz real-time editace)
Úkoly a ostatní entity:
  • Optimistic UI s detekci konfliktu
  • Pokud 2 uživatelé editují stejné pole: dialog "Jan změnil toto pole — přepsat / zachovat jeho změnu / merge?"
  • Activity log zachytí obě verze
```

### Circular dependency detection
```
Systém odmítne vytvořit závislost, která by vytvořila cyklus:
  A → B → C → A = error "Circular dependency detected"
Validace při:
  • Vytvoření nové dependency
  • Bulk operacích
  • Importu dat
Vizuální zvýraznění problematických vazeb v dependency graphu
```

### Projekt lifecycle
```
Explicitní stavy projektu:
  Draft → Active → On Hold → Completed → Archived
Pravidla:
  • Draft: příprava, nelze vytvářet sprinty
  • Active: plný provoz
  • On Hold: zmrazený, úkoly read-only (kromě admin)
  • Completed: všechny úkoly Done, read-only
  • Archived: přesun do archivu, vyhledatelný, read-only, obnovitelný
Přechody konfigurovatelné (admin)
```

### Offboarding flow
```
Trigger: deaktivace uživatele
Auto akce:
  • Seznam přiřazených úkolů → notifikace PM/team lead k re-assignu
  • Odebrání přístupových práv
  • Přeřazení vlastnictví KB stránek na náhradníka
  • GDPR: anonymizace osobních dat (na vyžádání)
  • Audit log: záznam o deaktivaci + všech změnách
```

### Podúkoly při zavření parentu
```
Při přesunu parent úkolu do Done:
  • Pokud existují otevřené podúkoly → warning dialog:
    "Úkol má X otevřených podúkolů. Co chcete udělat?"
    [Zavřít všechny] [Nechat otevřené] [Zrušit]
  • Konfigurovatelné per projekt: auto-close / warning / block
```

### HIPAA / PHI handling
```
Pro tickety obsahující citlivé zdravotnické údaje:
  • Označení ticketu jako "Contains PHI" (manuální nebo auto-detekce)
  • Omezený přístup: pouze přiřazení agenti + admin
  • Šifrování citlivých polí at rest
  • Audit log: kdo přistoupil k PHI datům
  • Retence: specifická pravidla pro PHI data
  • Export: PHI data vyloučena z běžných exportů
```

### PII masking
```
Automatická detekce a maskování osobních údajů:
  • Typy: rodná čísla, čísla karet, telefonní čísla, email adresy (konfigurovatelné)
  • Auto-detekce v textu ticketů, komentářů, KB stránek
  • Maskování: zobrazení jako "***" pro neoprávněné uživatele
  • Oprávnění "View PII" pro agenty, kteří potřebují vidět plná data
  • Audit log: kdo odhalil maskovaná data
```

---

## DOPLNĚNÍ PO HLOUBKOVÉ ANALÝZE (v3 — 2026-03-22)

> Výsledky systematické analýzy nesrovnalostí, chybějících scénářů a edge cases.
> Všechna rozhodnutí projednána a schválena.

---

### Aktualizovaná pracovní hierarchie (5 úrovní)

```
Iniciativa → Projekt → Epic → Úkol (typy: Story, Task, Bug, Design Task...) → Podúkol
```

- **Epic** = nová úroveň mezi Projektem a Úkolem, seskupuje související úkoly/stories
- **Story** = typ Úkolu (ne samostatná hierarchická úroveň)
- Jira migrace: Epic → Epic, Story → Úkol (typ Story), Task → Podúkol
- Progress agregace: Podúkoly → Úkoly → Epic → Projekt → Iniciativa → OKR KR

### OKR vazba na projekty

```
OKR Key Result → Iniciativa → Projekt (vždy přes Iniciativu)
```

- Projekt se NIKDY neváže přímo na KR — vždy přes Iniciativu
- Každý projekt patřící do OKR systému musí mít nadřazenou Iniciativu
- Progress: Úkoly → Projekt → Iniciativa → KR (jednosměrná agregace)

---

### Autentizace & bezpečnost

#### MFA
```
Google SSO uživatelé: MFA řešeno na straně Google (Workspace admin vynucuje)
Lokální účty (Guest/external): MFA povinné
  • Metody: TOTP (Google Authenticator, Authy) + recovery kódy (jednorázové, 10 kusů)
  • Setup: povinný při prvním přihlášení
  • Ztráta MFA zařízení: admin reset + nový setup
```

#### Session management
```
Konfigurovatelné per role (admin nastavuje):
  • Idle timeout: per role (default — Executive: 15min, Agent: 30min, Team Member: 60min, Guest: 15min)
  • Max session: per role (default — Executive: 8h, ostatní: 12h, Guest: 4h)
  • Multi-device: povoleno (max 3 souběžné sessions)
  • Offboarding: okamžitá invalidace VŠECH sessions + API tokenů + OAuth2 tokenů
  • PHI přístup: automaticky přísnější (idle 15min bez ohledu na roli)
```

#### Politika hesel (lokální účty — NIST 800-63B)
```
  • Min 12 znaků, bez požadavku na speciální znaky
  • Bez rotace (rotace snižuje bezpečnost dle NIST)
  • Breach password check (haveibeenpwned API při nastavení)
  • Zámek po 5 neúspěšných pokusech + CAPTCHA + progressive delay
  • IP-level rate limiting na /login (100 req/min per IP)
  • Reset hesla: token s expirací 1h, jednorázové použití, email notifikace
```

#### Invite flow (dva oddělené toky)
```
Google SSO invite:
  Admin → Invite (email + role + tým) → Email s odkazem → Klik → Google SSO → Účet vytvořen → Onboarding

Lokální účet invite:
  Admin → Invite (email + role + tým, typ: lokální) → Email s odkazem → Klik → Nastavení hesla → MFA setup → Účet vytvořen → Onboarding

Invite link: expiruje 72h, jednorázový token, kryptograficky podepsaný
Admin vidí stav pozvánky: Pending / Accepted / Expired (možnost znovu zaslat)
Interní zaměstnanci: výhradně Google SSO (admin nemůže vytvořit lokální účet pro interního)
Lokální účet: pouze pro Guest/external role
```

---

### GDPR & audit log

```
Řešení rozporu "nikdy nemazat" vs. GDPR právo na výmaz:

  PSEUDONYMIZACE:
  • Při výmazu/deaktivaci uživatele se v audit logu nahradí PII anonymním ID
    ("Deleted User #42", "deleted-42@anonymized.local")
  • Klíč pseudonymizace se permanentně smaže — nelze zpětně identifikovat
  • Audit log zůstává nepřepisovatelný a kompletní (akce, timestampy, entity)
  • Pouze PII se nahradí — struktura logu zachována

  GDPR export (čl. 20):
  • Uživatel může spustit export vlastních dat (self-service)
  • Formát: JSON
  • Scope: profil, přiřazené entity, komentáře, time logy, audit záznamy
  • Lhůta: do 30 dní (automaticky, obvykle okamžitě)
  • Dostupné i po deaktivaci (admin spustí na žádost)

  Retence:
  • Admin konfiguruje retenci per typ entity
  • Audit log: pseudonymizovaný navždy (bez PII)
  • Archivovaná data: anonymizace PII při GDPR žádosti
```

### LLM integrace & PHI

```
PHI data jsou ZCELA VYLOUČENA z LLM zpracování:
  • Entity označené PHI se nikdy neposílají do externích LLM providerů
  • LLM funkce (sumarizace, Q&A, prioritizace) na PHI entitách: nedostupné (tlačítko disabled)
  • Ostatní data: DPA (Data Processing Agreement) s každým LLM providerem povinné
  • Geografická lokalizace: pouze EU endpointy
  • Uživatel vidí disclaimer: "Tato data budou zpracována externím AI modelem"
  • Admin konfiguruje: které LLM funkce jsou povoleny per modul

LLM fallback:
  • Auto-switch na záložního providera při nedostupnosti
  • Priorita providerů konfigurovatelná adminem
  • Health check každých 60s
  • Pokud všichni nedostupní: AI funkce disabled s info "AI dočasně nedostupné"
```

---

### Hierarchie oprávnění

```
3 vrstvy oprávnění — NEJRESTRIKTIVNĚJŠÍ VÍTĚZÍ:

  1. Systémová role (Executive, PM, Team Member, Agent, Reader, Guest)
     = baseline oprávnění per modul
  2. Entity-level override (admin nastaví per konkrétní projekt/entitu)
     = může jen OMEZIT, nikdy ROZŠÍŘIT systémovou roli
  3. Task-level role (Assignee, Reporter, Viewer, custom)
     = oprávnění v rámci entity

  PHI override: PHI označení VŽDY přebíjí vše
  • I Executive musí být explicitně přidán na PHI entitu
  • Guest NIKDY nemá přístup k PHI (hard block, admin nemůže override)

  "Edit own" definice (Team Member):
  • = entity, kde je uživatel Assignee NEBO Reporter
  • NE entity, kde je pouze Viewer nebo @mentioned
```

### Izolace dat mezi týmy

```
Per tým konfigurace:
  • Každý tým má default visibility: private / internal
  • Nový projekt v týmu dědí default visibility týmu
  • PM může přepsat visibility na konkrétním projektu
  • Private: vidí jen členové týmu + explicitně pozvaní
  • Internal: vidí všichni interní uživatelé (ne Guests)
  • Doporučené defaults: HR/Finance = private, Engineering/Marketing = internal
```

---

### Workflow doplnění

#### Sprint cancellation
```
Sprint cancel = PM/admin volba per úkol:
  • PM rozhodne u každého úkolu: vrátit do backlogu / přesunout do dalšího sprintu / uzavřít (Won't Do)
  • Dialog při cancelu zobrazí seznam úkolů s volbami
  • Time logy zachovány (vázány na úkol, ne sprint)
  • Burndown ukončen, sprint metrics zachovány v historii
  • Retrospektiva: volitelná (PM rozhodne)
  • Oprávnění: PM + admin
```

#### Incident reopen
```
Reopen s časovým limitem:
  • Přechod Closed → Reopened: možný do X dní po Closed (admin konfiguruje, default 7 dní)
  • Po uplynutí limitu: pouze nový incident s vazbou "related to"
  • Kdo může reopen: reporter, agent, auto (Sentry trigger)
  • SLA se RESTARTUJE od nuly při reopen
  • Reopen důvod: povinné pole
  • Sentry: nový alert po Closed → nový incident (pokud mimo limit)
```

#### Parent-child konzistence stavů
```
HARD BLOCK na parent:
  • Projekt nemůže být Completed dokud všechny Epicy/Úkoly nejsou Done/Closed/Cancelled
  • Iniciativa nemůže být Closed dokud všechny Projekty nejsou Completed/Archived/Cancelled
  • OKR Key Result: scoring nezávislý na stavu children (manuální + auto agregace)
  • Systém zobrazí seznam blockerů (otevřené children) při pokusu o uzavření
  • Stav "Cancelled" a "Won't Do" na child = splňuje podmínku pro uzavření parentu
```

#### Emergency Change Management
```
ECAB (Emergency CAB):
  • Emergency Change schvaluje ECAB = 2-3 předdefinované osoby (admin konfiguruje, např. IT Director + Security Lead)
  • Přeskočen: čekání na plánovanou CAB schůzku
  • Impact Assessment: povinný ale zkrácený formulář
  • Implementace: okamžitě po ECAB schválení
  • Post-Implementation Review: povinné do 48h
  • Rollback plán: povinný před schválením
  • Zpětné zamítnutí při Post-Review: možné → rollback + incident
```

#### Approval timeout & delegace
```
Approval timeout:
  • Timeout → eskalace na nadřízeného schvalovatele
  • Pokud i nadřízený nereaguje (2. timeout): auto-reject s důvodem "timeout"
  • Max 2 úrovně eskalace, pak auto-reject
  • Timeout konfigurovatelný per workflow krok (default: 3 pracovní dny)

Parallel approval: UNANIMITA
  • Všichni paralelní schvalovatelé musí souhlasit
  • Jeden reject = Rejected (celý krok)
  • Jeden timeout = eskalace na nadřízeného daného schvalovatele

Delegace:
  • Schvalovatel může delegovat POUZE na osobu se stejnou nebo vyšší systémovou rolí
  • Řetězová delegace zakázána (max 1 úroveň)
  • Delegace má expiraci (admin konfiguruje, default: 14 dní)
  • Původní schvalovatel může odvolat delegaci
  • Audit log: kdo delegoval, na koho, kdy
```

#### Offboarding flow (rozšířený)
```
Trigger: deaktivace uživatele
Auto akce (okamžité):
  • Invalidace VŠECH sessions + API tokenů + OAuth2 tokenů
  • Odebrání přístupových práv
  • Audit log: záznam o deaktivaci

Auto-reassign:
  • Úkoly: auto přiřazení team leadovi + notifikace PM
  • Approvals čekající na schválení: auto delegace na nadřízeného (eskalace)
  • SLA: pause na 24h pro re-assign incidentů
  • Incidenty: auto-routing pravidla (round-robin na dostupné agenty)
  • KB stránky: vlastnictví přeřazeno na team lead
  • Recurring tasks: přeřazeny na team lead

GDPR: pseudonymizace (viz GDPR sekce)
```

---

### SLA doplnění

#### SLA pause ochrana (anti-gaming)
```
  • SLA se pauzne max N-krát per ticket (admin konfiguruje, default 3)
  • Celková doba pauzy max M hodin per ticket (admin konfiguruje, default 72h)
  • Po překročení: SLA běží i ve stavu Pending
  • Auto-close: ticket v Pending bez odpovědi se auto-close po X pracovních dnech (admin, default 5)
  • Reporting: metrika "Pending ratio per agent" v SLA dashboardu
```

#### Sentry ↔ Incident integrace
```
  • Auto-resolve: jen pokud incident je ve stavu Assigned (agent ještě nezačal)
  • Pokud In Progress / Pending: Sentry status se zobrazí jako metadata, stav NEMĚNIT, notifikace agenta
  • Nový alert po Closed: VŽDY nový incident s vazbou "related to" (ne reopen)
  • Nový alert po Resolved (v reopen limitu): reopen existujícího
  • Deduplikace: dle Sentry issue ID (fingerprint)
  • Stack trace z Sentry: PII masking aplikováno automaticky
```

---

### Projekt On Hold (rozšířený)
```
Hard freeze + sprint close:
  • Aktivní sprint se automaticky ukončí (Early Close) — PM rozhodne per úkol (backlog/další sprint/Won't Do)
  • Úkoly: read-only (kromě admin)
  • Rule engine: pravidla pozastavena pro tento projekt
  • SLA na linkovaných incidentech: POKRAČUJE (incidenty žijí nezávisle na projektu)
  • Nové úkoly: nelze vytvářet (kromě admin)
  • Přechod z On Hold: PM nebo admin → zpět do Active
```

---

### Rule Engine (rozšířený)
```
Ochrana proti cirkulárním pravidlům:
  • Max 5 řetězených provedení (rule triggers rule)
  • Po překročení: zastavení + error log + notifikace admina
  • Pravidla s chybou: automatická deaktivace po 3 selhání za 24h
  • Error log: důvod selhání, dotčené entity, timestamp

Chybové stavy:
  • THEN akce selže (např. přiřazení deaktivovanému uživateli): skip akce + error log + notifikace admina
  • Workflow stav odstraněn, pravidlo ho referuje: pravidlo auto-deaktivováno + admin warning
```

---

### Concurrent state transitions
```
First-write-wins + idempotence:
  • První operace projde, druhá je idempotentní
  • Pokud stav už je Resolved → druhý "Resolve" = OK (žádná chyba)
  • Audit log: záznam jen první změny
  • Agent collision detection (service desk): presence indikátory (kdo prohlíží ticket)
```

---

### KB stránky — editace Published
```
Vždy přes review:
  • Každá editace Published stránky vytvoří Draft verzi
  • Published verze zůstává viditelná uživatelům během review procesu
  • Draft prochází standardním review (Draft → In Review → Approved → Published)
  • Po schválení: Published verze se nahradí novou
  • Verzování: každý přechod do Published = nová verze s diff
  • Inline komentáře z Published verze: zachovány, přeneseny na novou verzi (pokud relevantní text existuje)
```

---

### Notifikace — kategorizace událostí
```
3 úrovně:
  URGENT (vždy okamžitě, nelze vypnout):
    • SLA breach / pre-breach (90%)
    • Eskalace
    • Blocker / critical incident
    • Approval request (timeout blízko)

  NORMAL (dle uživatelské preference: okamžitě / digest):
    • @mention
    • Přiřazení úkolu/incidentu
    • Změna stavu na sledované entitě
    • Komentář na přiřazené entitě
    • Review request

  LOW (default: digest, uživatel může přepnout na okamžitě):
    • Watch update (změna na sledované entitě bez přiřazení)
    • Komentář od jiného watche
    • Sprint/milestone blížící se deadline
    • Nový článek v KB space

  Digest NIKDY neduplikuje okamžité notifikace
  Admin může vynutit "vždy okamžitě" pro specifické typy (notification scheme)
  Notifikace pro archivované entity: Watch subscriptions se automaticky odstraní
```

---

### Workload
```
Jednotky: hodiny primárně, SP sekundárně
  • Workload heatmapa: hodiny (kapacita h/týden vs. alokace z time trackingu)
  • Sprint board: Story Points (pro velocity, burndown)
  • Cross-projekt view: hodiny (společný jmenovatel)

Nepřítomnost / dovolená:
  • Google Calendar integrace: Calendar události automaticky snižují dostupnou kapacitu
  • HR service request (dovolená/nemocenská) → Calendar event → auto snížení kapacity
  • Svátky (ČR): předdefinovaný kalendář, auto snížení kapacity
  • Uživatel nemusí nic ručně logovat — systém odečte z Calendar

Non-project čas:
  • Porady: automaticky z Calendar (délka events)
  • Ostatní non-project čas: nesleduje se systémově (odečteno z Calendar events)
```

---

### My Work
```
Dedikovaná sekce "My Work" v hlavní navigaci:
  • Všechny mé úkoly, incidenty, approvals, reviews z VŠECH projektů
  • Filtry: stav, projekt, priorita, deadline, typ entity
  • Řazení: priorita, deadline, datum vytvoření
  • Views: kanban (per stav) / list (řádky)
  • Actionable: změna stavu, komentář, approve/reject přímo z My Work
  • Quick filters: "Overdue", "Due today", "Blockers", "Needs review"
```

---

### Saved Filters
```
Uložené filtry jako vlastní funkce:
  • Uživatel uloží kombinaci podmínek (projekt, stav, assignee, priorita, tagy, custom fields...) jako pojmenovaný filtr
  • Osobní nebo sdílený s týmem
  • Aplikovatelný na různé views (list, kanban, timeline)
  • Rychlý přístup z navigace + command palette
  • Odlišné od Views: filtr = podmínky, view = filtr + typ zobrazení + konfigurace sloupců
```

---

### Komponenty
```
Komponenta = vlastní entita (Jira model):
  • Atributy: název, popis, vlastník (tým), lead (osoba)
  • Úkoly, projekty i incidenty se tagují komponentou
  • Auto-routing: incident označený komponentou → auto-přiřazení na vlastníka týmu + notifikace leada
  • Filtrování a reporting per komponenta: "Vše co se týká Payment Module"
  • Impact analýza: které komponenty jsou dotčeny incidentem, vazby mezi komponentami
```

---

### Tagy — scope
```
Globální + per-projekt tagy:
  • Admin vytváří globální tagy (sdílené celou organizací): #critical, #blocked, #quick-win
  • Uživatelé vytváří per-projekt tagy (viditelné jen v projektu): #sprint-5, #migration-batch-2
  • Kolize řešena scope: globální tag #migration vs. per-projekt tag #migration v projektu HR
  • Admin může: přejmenovat, mergovat, smazat globální tagy
  • PM může: spravovat per-projekt tagy svého projektu
  • Barevné kódování, filtrování a seskupování zachováno
```

---

### Vícejazyčnost
```
Jen UI:
  • Překlad rozhraní (tlačítka, menu, systémové hlášky, formuláře): CZ / EN / SK
  • Obsah (KB stránky, úkoly, komentáře): v jazyce, v jakém ho autor napíše
  • Žádné vícejazyčné verze obsahu — jde o interní nástroj jedné firmy
  • PII/PHI auto-detekce: regex vzory pro CZ, SK i EN formáty (rodné číslo CZ/SK, phone, email)
```

---

### Sémantické vyhledávání & RBAC
```
Post-filter přístup:
  • Indexuj VŠECHNY entity do vektorové DB (embeddings)
  • Při vyhledávání: najdi top N×2 výsledků, pak odfiltruj entity bez oprávnění
  • Vrať top N výsledků po filtraci
  • Private notes (jen agenti): indexovány, ale filtrované pro ne-agenty
  • PHI entity: indexovány, ale filtrované dle PHI přístupu
  • Změna oprávnění: re-indexace není nutná (filtr je runtime)
```

---

### Kaskádové mazání
```
Soft delete VŽDY (Koš):
  • Každé smazání = přesun do Koše (soft delete)
  • Koš: entity read-only, obnovitelné X dní (admin konfiguruje: 30/60/90)
  • Children zůstávají živé (osamostatněné) — NEKASKÁDUJE se
    • Smazání projektu: úkoly/epicy zůstanou (bez projektu, viditelné v My Work)
    • Smazání úkolu: time logy zachovány, podúkoly zůstanou (bez parentu)
    • Smazání iniciativy: projekty zůstanou (bez iniciativy)
  • Po uplynutí koše: trvalé smazání + anonymizace PII v audit logu
  • Přílohy/soubory: smazány s entitou (v koši), fyzicky odstraněny po expiraci koše
  • Time logy: NIKDY nemazat (účetní/reportingové účely) — anonymizace PII při GDPR
```

---

### Custom fields scope
```
Custom fields na VŠECH uživatelských entitách (kromě systémových):
  ANO: Úkol, Podúkol, Epic, Projekt, Iniciativa, Incident, Service Request, Change,
       KB stránka, Meeting Notes, Time Log, Asset, Release, Risk, Retrospektiva
  NE:  Komentáře, Notifikace, Audit log záznamy, Tagy, Session

  Custom fields jsou:
  • Indexovány pro full-text i sémantický search
  • Dostupné v Rule Engine jako podmínky
  • Dostupné v reportech jako sloupce/filtry
  • Dostupné v Saved Filters
  • Exportovatelné (CSV, PDF)
```

---

### Guest + PHI
```
Hard block:
  • Systém NEDOVOLÍ přidat Guest na entitu označenou PHI
  • Chybová hláška: "Guest uživatelé nemají přístup k PHI entitám"
  • Admin NEMŮŽE override — žádné výjimky
  • Guest na projektu s PHI entitami: vidí jen ne-PHI entity v projektu
```

---

### Export — velké datové sady
```
Async export + notifikace:
  • Malé exporty (<100 záznamů): synchronní download
  • Velké exporty: async zpracování na pozadí
    • Progress bar v UI
    • Notifikace po dokončení (in-app + email)
    • Download link v notifikacích (expiruje 24h)
  • Export šablony + branding: zachováno (admin definuje logo, barvy, záhlaví)
```

---

### CSV import
```
Preview + partial import:
  • Krok 1: Upload CSV + mapování sloupců na pole entity
  • Krok 2: Preview s validací — seznam chyb per řádek (typ, důvod)
  • Krok 3: Uživatel může opravit mapování nebo přeskočit chybné řádky
  • Krok 4: Import jen platných řádků
  • Krok 5: Report: co se importovalo (počet), co se přeskočilo (downloadovatelný error CSV)
  • Velké importy (>500 řádků): async s progress barem + notifikace
```

---

### Recurring tasks
```
Vždy vytvořit novou instanci:
  • Nová instance se vytvoří v pevný čas (cron schedule) bez ohledu na stav předchozí
  • Alert při hromadění otevřených instancí: 3+ otevřených → notifikace assignee + PM
  • Šablona (master) změna: ovlivní jen BUDOUCÍ instance (existující nezměněny)
  • Zrušení recurring serie: budoucí instance se nevytváří, existující zůstanou
  • End date: volitelný (nekonečná série pokud nenastaveno)
  • Workload: počítá se jen aktuální instance (ne budoucí)
```

---

### Release Management
```
Jednoduchý model — 3 stavy:
  Planned → Released / Cancelled

  • Planned: kolekce úkolů/features přiřazených k release verzi
  • Released: deploy proběhl, release notes generovány
  • Cancelled: No-Go nebo failed deploy → nový release pro další pokus
  • Failed deploy: Cancelled + auto-vytvoření incidentu
  • Kdo rozhoduje Go/No-Go: PM + QA Lead (konfigurovatelné per projekt)
  • Go/No-Go checklist: všechny položky musí být zaškrtnuty (hard block)
  • Release notes: auto-generovány z fix version úkolů
```

---

### Bulk operace
```
Undo 30s + audit:
  • Po bulk operaci: toast s "Undo" tlačítkem (30s window)
  • Bulk delete: povinný potvrzovací dialog s počtem dotčených entit
  • Audit trail: každá změna jako samostatný záznam, sřetězené společným batch ID
  • Batch ID umožňuje: zobrazit celou bulk operaci v audit logu, undo celé operace
```

---

### Performance SLA
```
Definované cíle:
  • Page load: <2s (P95)
  • Globální search: <500ms (P95)
  • API response: <200ms (P95)
  • Real-time notifikace: <1s latence
  • KB co-authoring: <100ms latence
  • Max souběžných uživatelů: 200
  • Export: async nad 10s zpracování
  • Monitoring: od začátku (APM, error tracking, latence metriky)
```

---

### Přístupnost (WCAG)
```
WCAG 2.1 AA:
  • Keyboard navigace: všechny akce dostupné z klávesnice
  • Screen reader kompatibilita: ARIA labely, semantic HTML
  • Kontrast: min 4.5:1 (text), 3:1 (velký text, UI komponenty)
  • Focus indikátory: viditelné na všech interaktivních elementech
  • Skip links, landmark roles, formulářové labely
  • Testování: automatizované (axe-core) + manuální screen reader testy
```

---

### Feature flags
```
Vestavěný feature flag mechanismus:
  • Admin zapne/vypne funkce per tým / role / uživatel
  • Gradual rollout: 10% → 50% → 100% (per tým)
  • Dashboard: přehled aktivních flagů, kdo má co zapnuto
  • Kombinovatelné s modulární viditelností (existující funkce)
  • Použití: nové features, A/B experimenty, postupná migrace
```

---

### Migrace dat
```
Paralelní provoz + inkrementální migrace:
  • Migrace po modulech: KB → Projekty/Úkoly → ITSM (v tomto pořadí)
  • Každý modul: import → validace (automatická + manuální) → paralelní provoz 2 týdny → switch
  • Rollback: návrat na původní systém (data zachována, Nexus data se zahazují)
  • Starý systém: read-only po switch (archiv 6 měsíců)
  • Validace: automatický report shody (počty entit, vazby, přílohy)
  • Jira → Nexus mapping: Epic → Epic, Story → Úkol (typ Story), Task → Podúkol, Component → Komponenta
```

---

### Mobilní přístup
```
Responzivní web (mobile-friendly):
  • Hlavní UI: optimalizováno pro desktop
  • Service desk portál + tickety + notifikace: responzivní web layout
  • Agent na mobilu: komentář, změna stavu, přiřazení — základní akce
  • Ne nativní appka, ne PWA (v MVP)
  • Email reply → komentář: funguje z jakéhokoli zařízení
```

---

### Tribes (upřesnění)
```
Tribes = virtuální group:
  • Tribe je seskupení lidí z různých týmů (bez vlastních projektů, OKR, service desku)
  • Slouží pro: @mention (@tribe-digital-transformation), filtraci, komunikaci
  • Tribe Lead: koordinátor bez speciálních systémových oprávnění
  • Uživatel může být v Týmu i Tribe současně
  • Tribe NEPŘIDÁVÁ žádná oprávnění — přístup je určen Týmem a systémovou rolí
```

---

### Scrum Master
```
PM = Scrum Master:
  • Neexistuje oddělená Scrum Master systémová role
  • PM (Project/Product Manager) má všechny Scrum Master pravomoci:
    sprint management, backlog refinement, retro facilitace, velocity tracking
  • Pokud tým potřebuje odlišit PM od SM: custom role na projektu (informativní, bez speciálních oprávnění)
```

---

### Planning Poker (vestavěný)
```
Real-time estimation session:
  • PM vybere úkoly z backlogu pro estimation
  • Tým hlasuje: skryté karty, reveal po hlasování všech
  • Sekvence: Fibonacci (1,2,3,5,8,13,21) nebo T-shirt (XS,S,M,L,XL) — konfigurovatelné per projekt
  • Timeout per kolo: admin konfiguruje (default 3 min)
  • Pokud ne všichni hlasují do timeoutu: reveal s hlasy, kteří přišli. Chybějící = "–"
  • Diskuze po revealu, nové kolo (volitelné)
  • Finální odhad se automaticky uloží na úkol (PM potvrdí)
  • Integrace: z backlog refinement session nebo sprint planning
```

---

### Dark mode
```
Light + Dark + System auto:
  • Uživatel volí v profilu: Light / Dark / System (dle OS nastavení)
  • Exporty (PDF/PPTX/PNG): VŽDY v light mode (print-friendly)
  • Email notifikace: VŽDY light mode
  • Service desk portál: respektuje desk branding (ne user dark mode)
  • Design tokeny / CSS variables od začátku pro podporu theming
```

---

### Budget tracking — sazby
```
Sazba per role, skrytá:
  • Admin definuje hodinovou sazbu per systémovou roli (Developer: X Kč/h, PM: Y Kč/h)
  • Sazba je skrytá pro samotného uživatele (Team Member nevidí svou sazbu)
  • Budget vidí: PM (svůj projekt), Executive (vše)
  • Team Member vidí: jen své hodiny, NE Kč částky
  • Měna: jedna (Kč), bez multi-currency v MVP
  • Automatický výpočet: hodiny × sazba role = náklady
  • Variance report: odhad vs. skutečnost (z time trackingu)
```
