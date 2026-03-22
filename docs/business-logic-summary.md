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
│EPIC││EPIC││EPIC││EPIC││EPIC││EPIC│  ← Seskupuje související úkoly/stories
└─┬──┘└─┬──┘└─┬──┘└─┬──┘└────┘└────┘
  │      │     │     │
  ▼      ▼     ▼     ▼
┌────┐┌────┐┌────┐┌────┐
│ÚKOL││ÚKOL││ÚKOL││ÚKOL│  ← Role: Assignee, Reporter, Viewer + custom
└─┬──┘└────┘└─┬──┘└────┘    Typy: Story, Task, Bug, Design Task...
  │           │
  ▼           ▼
┌──────┐  ┌──────┐
│PODÚK.│  │PODÚK.│
└──────┘  └──────┘
```

**Progress agregace:** zdola nahoru (Podúkoly → Úkoly → Epic → Projekt → Iniciativa → OKR Key Result)

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
│ Guest            │ —          │ Invited  │ —        │ Invited  │ —        │
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
│                                                            │
│  Mid-cycle změny KR:                                       │
│    • KR lze přidat/odebrat/editovat kdykoli během cyklu   │
│    • Každá změna: audit log + notifikace stakeholderům     │
│    • Progress tracking: zachová historii (před/po změně)   │
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
│    • Hierarchická struktura (spaces / sekce / stránky, max 5 úrovní)│
│                                                            │
│  Šablonové dokumenty (opakující se):                       │
│    • Zápisy z porad                                        │
│    • RFC (Request for Comments)                            │
│    • Postmortem                                            │
│    • Decision Log                                          │
│                                                            │
│  Workflow: Draft → In Review → Changes Req. / Approved     │
│            → Published → Archived                          │
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
│  │ Přístup: všichni s Read oprávněním na projekt                   │    │
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

Rozšířený scope:
  • PHI entity: READ akce logovány (kdo zobrazil PHI data, kdy)
  • Běžné entity: READ akce NElogovány (performance)
  • Failed login pokusy: vždy logovány (IP, email, timestamp)
  • Permission check failures: logovány (kdo, na co, kdy)
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
| Hierarchie práce | ✅ | 5 úrovní: Iniciativa → Projekt → Epic → Úkol → Podúkol |
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
| Role & práva | ✅ | 6 rolí (vč. Guest), granulární (role × modul × entita × akce) |
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
Responzivní web (mobile-friendly):
  • Hlavní UI: optimalizováno pro desktop, responzivní layout pro všechny moduly
  • Na mobilu: plná funkčnost, přizpůsobený layout
  • Ne nativní appka, ne PWA (v MVP)
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
  • Komentáře s vláknovými odpověďmi (threads, max 3 úrovně vnoření)
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
Import — plná migrace z Jira / Asana / Confluence:
  • Projekty, úkoly, KB stránky, incidenty
  • Včetně historie a příloh

Export — plný export dat z Nexusu (anti vendor lock-in):
  • Admin může exportovat VŠECHNA data: projekty, úkoly, KB, tickety, historie, přílohy
  • Formát: JSON (strukturovaný) + CSV (tabulkový) + přílohy (ZIP)
  • Scope: celá organizace nebo per modul/projekt
  • Async zpracování s notifikací po dokončení
  • GDPR export (per uživatel): viz GDPR sekce
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

Workflow: Open → Mitigating → Mitigated → Closed
  • Přechody: PM nebo risk vlastník
  • Notifikace PM: při risk score > konfigurovatelný threshold (default: High)
  • Notifikace Executive: při risk score = Critical
  • Pravidelný review: PM hodnotí rizika per sprint/milestone (soft reminder)
  • Vazba: Risk → Incident (pokud se riziko materializuje)
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

Ochrana:
  • Spam filtr: základní heuristika + SPF/DKIM/DMARC validace
  • Whitelist/blacklist odesílatelů: admin per service desk
  • Neznámý odesílatel (ne v systému): email zařazen do fronty ke schválení agentem
  • Max velikost přílohy: dle file storage limitu (admin konfiguruje)
  • Nebezpečné přílohy (.exe, .bat, .scr...): automaticky odmítnuty
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
Kalendář svátků (ČR, SK)
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
| 1 | Hierarchie práce | ✅ | 5 úrovní: Iniciativa → Projekt → Epic → Úkol → Podúkol |
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
| 36 | Role & práva | ✅ | 6 rolí (vč. Guest), granulární (role × modul × entita × akce) |
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
| 61 | Mobilní přístup | ✅ | Responzivní web (desktop-first, mobile-friendly) |
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
| 92 | Zdravotnická data / PHI (GDPR + CZ) | ✅ | Označení, omezený přístup, šifrování, audit (GDPR + zákon o zdravotních službách) |
| 93 | PII masking (opt-in per pole) | ✅ | Maskování na admin-označených sensitive polích, bez blanket auto-detekce |

---

## 14. DOPLNĚNO PO HLOUBKOVÉ ANALÝZE (v2)

### Git integrace (základní linking)
```
Commit/PR obsahující ID entity (NEXUS-123) → auto-link na entitu
Na kartě úkolu: záložka "Code" se seznamem linkovaných commitů/PR
Podporované platformy: GitHub, GitLab, Bitbucket
Default: pouze linking. Auto status change z PR: volitelné (viz CI/CD integrace v5)
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
  • Auto-resolve: jen pokud incident je ve stavu Assigned (viz Sentry ↔ Incident integrace v3)
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

Změna metodiky projektu:
  • Metodiku (Scrum/Kanban/Waterfall) NELZE měnit po vytvoření projektu
  • Pokud tým potřebuje změnit metodiku: vytvořit nový projekt, přesunout úkoly
  • Důvod: změna metodiky mid-flight ruší metriky, velocity historii a sprint kontext
```

### Offboarding flow
```
Trigger: deaktivace uživatele
Auto akce (viz rozšířený offboarding flow v3):
  • Invalidace VŠECH sessions + API tokenů + OAuth2 tokenů
  • Odebrání přístupových práv
  • Úkoly: auto přiřazení team leadovi + notifikace PM
  • KB stránky: vlastnictví přeřazeno na team lead
  • GDPR: pseudonymizace (viz GDPR sekce)
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

### Zdravotnická data / PHI handling (GDPR + zákon o zdravotních službách ČR)
```
Pro tickety obsahující citlivé zdravotnické údaje (dle GDPR čl. 9 — zvláštní kategorie osobních údajů):
  • Označení ticketu jako "Contains PHI" (manuální nebo auto-detekce)
  • Omezený přístup: pouze přiřazení agenti + admin
  • Šifrování citlivých polí at rest
  • Audit log: kdo přistoupil k PHI datům (zákon č. 372/2011 Sb.)
  • Retence: specifická pravidla pro PHI data (dle zákona o zdravotních službách)
  • Export: PHI data vyloučena z běžných exportů
  • Compliance: GDPR + zákon o zdravotních službách ČR (ne HIPAA — US legislativa neaplikovatelná)
```

### PII masking (opt-in per pole)
```
Maskování osobních údajů — OPT-IN per pole (ne blanket auto-detekce):
  • Admin označí konkrétní pole jako "sensitive" (custom fields, systémová pole)
  • Typy detekce na sensitive polích: rodná čísla, čísla karet, telefonní čísla, email adresy (konfigurovatelné)
  • Maskování: zobrazení jako "***" pro neoprávněné uživatele
  • Oprávnění "View PII" pro agenty, kteří potřebují vidět plná data
  • Audit log: kdo odhalil maskovaná data
  • Volný text (komentáře, popisy úkolů): BEZ auto-detekce (prevence false positives)
  • PHI pole: automaticky sensitive (vždy maskováno)
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
- Jira migrace: Epic → Epic, Story → Úkol (typ Story), Task → Úkol (typ Task), Sub-task → Podúkol
- Progress agregace: Podúkoly → Úkoly → Epic → Projekt → Iniciativa → OKR KR

### OKR vazba na projekty

```
OKR Key Result → Iniciativa → Projekt (doporučená cesta)
OKR Key Result → Projekt (přímá vazba — volitelná pro menší projekty)
```

- Projekt se může vázat přímo na KR NEBO přes Iniciativu
- Iniciativa je DOPORUČENÁ ale NE povinná mezistupeň
- Pro strategické projekty (multi-team, dlouhodobé): vždy přes Iniciativu
- Pro malé projekty (single-team, krátké): přímá vazba na KR povolena
- Progress: Úkoly → Projekt → (Iniciativa →) KR (jednosměrná agregace)

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
  • Idle timeout: per role (default — všechny interní role: 60min, Guest: 15min)
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

  LEGAL HOLD (výjimka z pseudonymizace):
  • Admin může aktivovat legal hold per uživatel (soudní spor, regulatorní vyšetřování)
  • Při aktivním legal holdu: pseudonymizace se ODLOŽÍ (klíč zachován)
  • Atributy: důvod, datum aktivace, expirační datum (povinné), aktivoval kdo
  • Po expiraci / deaktivaci legal holdu: pseudonymizace proběhne standardně
  • Audit log: záznam o aktivaci/deaktivaci legal holdu
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
3 vrstvy oprávnění — ENTITY OVERRIDE VÍTĚZÍ:

  1. Systémová role (Executive, PM, Team Member, Agent, Reader, Guest)
     = baseline oprávnění per modul
  2. Entity-level override (admin nastaví per konkrétní projekt/entitu)
     = PŘEPISUJE systémovou roli pro danou entitu (může rozšířit i omezit)
     = pokud existuje override, ten má přednost před systémovou rolí
  3. Task-level role (Assignee, Reporter, Viewer, custom)
     = oprávnění v rámci entity

  Priorita: Entity override > Systémová role (ne "nejrestriktivnější vítězí")

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
  • Přechod Closed → Reopened: možný do X dní po Closed (admin konfiguruje, default 14 dní)
  • Konfigurovatelné per prioritu (doporučené: Critical: 30d, High: 14d, Medium: 14d, Low: 7d)
  • Po uplynutí limitu: pouze nový incident s vazbou "related to"
  • Kdo může reopen: reporter, agent, auto (Sentry trigger)
  • SLA POKRAČUJE od původní hodnoty při reopen (kumulativní čas)
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
  • Pokud i nadřízený nereaguje (2. timeout): eskalace na fallback pool
  • Fallback pool: konfigurovatelná skupina (default: jakýkoliv Executive)
  • Request NIKDY není auto-rejected kvůli timeoutu — vždy se najde schvalovatel
  • Timeout konfigurovatelný per workflow krok (default: 3 pracovní dny)

Parallel approval: KONFIGUROVATELNÉ per workflow krok
  • Režimy: unanimita / majorita / minimálně N z M / vážené hlasování
  • Default: majorita (nadpoloviční většina)
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
Hard freeze + sprint PAUSE:
  • Aktivní sprint se POZASTAVÍ (časovač stojí, stav zachován, úkoly zůstávají ve sprintu)
  • Při obnovení projektu (On Hold → Active): sprint pokračuje od místa pozastavení
  • PM může během holdu rozhodnout o manuálním ukončení sprintu (Early Close)
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

Workflow úpravy s in-flight entitami:
  • Odstranění stavu: migrační wizard — "Kam přesunout X entit ze stavu 'Testing'?"
    - Admin vybere cílový stav, entity se hromadně přesunou
    - Audit log: bulk přesun s důvodem "workflow migration"
  • Přidání stavu: bez dopadu na existující entity
  • Změna přechodů: entity v nekompatibilním stavu zůstávají, admin warning s výpisem
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
Dva režimy editace (konfigurovatelné per space):

  Major edit (default):
  • Každá editace Published stránky vytvoří Draft verzi
  • Published verze zůstává viditelná uživatelům během review procesu
  • Draft prochází standardním review (Draft → In Review → Approved → Published)
  • Po schválení: Published verze se nahradí novou

  Minor edit (bypass review):
  • Autor při uložení zaškrtne "Minor edit" (překlepy, formátování, aktualizace odkazů)
  • Změna se publikuje okamžitě BEZ review workflow
  • Verzování: nová verze s tagem "minor edit" (plně auditovatelné)
  • Admin per space konfiguruje: minor edit povoleny / zakázány
    - Doporučené: HR policies, compliance docs = minor edit ZAKÁZÁN
    - Doporučené: team wiki, technická dokumentace = minor edit POVOLEN

  Společné:
  • Verzování: každý přechod do Published = nová verze s diff
  • Inline komentáře z Published verze: zachovány, přeneseny na novou verzi (pokud relevantní text existuje)
```

---

### Notifikace — kategorizace událostí
```
3 úrovně:
  URGENT (vždy okamžitě, nelze vypnout — KONTEXTOVÉ dle role na entitě):
    • SLA breach / pre-breach (90%) → URGENT jen pro: assignee/agent
    • Eskalace → URGENT jen pro: cílová osoba eskalace
    • Blocker / critical incident → URGENT jen pro: assignee, PM projektu
    • Approval request (timeout blízko) → URGENT jen pro: schvalovatele
    • Watchers dostávají tyto události jako NORMAL (dle preference, ne force)

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
  • Svátky (ČR, SK): předdefinovaný kalendář, auto snížení kapacity
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
    — POUZE na admin-označených sensitive polích (ne na volném textu, viz v6)
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

Kaskádové mazání — doplnění chybějících entit:
  • Smazání OKR / Key Result: linkované Iniciativy/Projekty zůstávají (osamostatněné, vazba na KR odstraněna)
  • Smazání Portfolia: projekty v portfoliu zůstávají (bez portfolia)
  • Smazání Týmu: BLOKOVÁNO pokud tým vlastní projekty nebo service desk. Nejdřív přeřadit.
  • Smazání Oddělení: BLOKOVÁNO pokud obsahuje aktivní týmy. Nejdřív přeřadit nebo smazat týmy.
  • Smazání Service Desku: BLOKOVÁNO pokud existují otevřené tickety. Nejdřív uzavřít/přesunout.
  • Smazání Epicu: podřízené úkoly zůstávají (bez epicu, viditelné v projektu i My Work)
  • Smazání Komponenty: tagy na entitách odstraněny, auto-routing pravidla referující komponentu deaktivována + admin warning
  • Smazání Milestonu: vazby na úkoly odstraněny, dependency vazby odstraněny
  • Smazání Release: vazby na Change Requesty zachovány (jako reference), úkoly/features odpojeny od release
  • Smazání Saved Filtru: sdílení s týmem zrušeno, ostatní uživatelé dostanou notifikaci
  • Smazání Synced Content Blocku: embedované stránky zobrazí statickou kopii posledního stavu + warning "Synced block smazán"
  • Smazání KEDB článku: vazby na Problem records zachovány jako reference, auto-suggest přestane nabízet

  Osiřelé entity (bez parenta):
  • Vizuální indikátor "Bez projektu/epicu" v UI (badge)
  • Filtr "Osiřelé entity" v My Work a admin panelu
  • Admin dashboard: počet osiřelých entit per typ
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
Vytvoření nové instance s ochranou proti hromadění:
  • Nová instance se vytvoří v pevný čas (cron schedule)
  • Max otevřených instancí: konfigurovatelné per série (admin, default 5)
  • Při dosažení maxima: skip vytvoření + notifikace assignee + PM
  • Backup assignee: konfigurovatelná náhradní osoba (při nedostupnosti primárního assignee)
  • Šablona (master) změna: ovlivní jen BUDOUCÍ instance (existující nezměněny)
  • Zrušení recurring serie: budoucí instance se nevytváří, existující zůstanou
  • End date: volitelný (nekonečná série pokud nenastaveno)
  • Workload: počítá se jen aktuální instance (ne budoucí)
  • Offboarding: při deaktivaci assignee → série se auto-přiřadí backup osobě.
    Pokud backup není nastaven → přiřadí se team leadovi + notifikace PM
```

---

### Release Management
```
Rozšířený model — 5 stavů + hotfix workflow:
  Planned → In Progress → Staging → Released → Archived
  + Cancelled (z libovolného stavu)

  • Planned: kolekce úkolů/features přiřazených k release verzi
  • In Progress: vývoj a testování probíhá
  • Staging: nasazeno na staging/pre-prod prostředí, finální testy
  • Released: deploy na produkci proběhl, release notes generovány
  • Archived: starší release, read-only
  • Cancelled: No-Go nebo failed deploy → nový release pro další pokus

  Hotfix release workflow:
  • Typ release: Standard / Hotfix
  • Hotfix: zkrácený workflow (Planned → Staging → Released), expedited staging
    - Staging je ZKRÁCENÝ (auto-proceed po 30min pokud není block), ne přeskočený
    - PM může manuálně přeskočit staging pouze s potvrzením + audit log
  • Hotfix vyžaduje Emergency Change Request (vazba na Change Management)
  • Auto-vytvoření Change Request při vytvoření hotfix release

  Vazba na Change Management:
  • Každý release automaticky vytvoří Change Request (Standard Change pro Standard release, Emergency pro Hotfix)
  • Go/No-Go checklist: všechny položky musí být zaškrtnuty (hard block)
  • Release notes: auto-generovány z fix version úkolů
  • Failed deploy: Cancelled + auto-vytvoření incidentu
  • Kdo rozhoduje Go/No-Go: PM + QA Lead (konfigurovatelné per projekt)
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
  • Použití: nové features, postupné nasazování, migrace
  • NENÍ určeno pro A/B experimenty (50-200 uživatelů = statisticky nesměrodatné)
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
  • Jira → Nexus mapping: Epic → Epic, Story → Úkol (typ Story), Task → Úkol (typ Task), Sub-task → Podúkol, Component → Komponenta
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
Sazba per uživatel, skrytá:
  • Admin definuje hodinovou sazbu per uživatel
  • Systémová role = default sazba (fallback pokud per-user sazba není nastavena)
  • Sazba je skrytá pro samotného uživatele (Team Member nevidí svou sazbu)
  • Budget vidí: PM (svůj projekt), Executive (vše)
  • Team Member vidí: jen své hodiny, NE Kč/EUR částky
  • Měna: CZK + EUR (admin konfiguruje směnný kurz, vše přepočteno do primární měny)
  • Automatický výpočet: hodiny × sazba uživatele = náklady
  • Variance report: odhad vs. skutečnost (z time trackingu)
  • Změna sazby: platí od data změny. Staré time logy zůstávají s původní sazbou (ne retroaktivně).
  • Audit log: každá změna sazby zaznamenaná (kdo, kdy, stará/nová hodnota)
```

---

## DOPLNĚNÍ PO HLOUBKOVÉ ANALÝZE (v4 — 2026-03-22)

> Výsledky systematického review kompletnosti business logiky.
> Všechna rozhodnutí projednána a schválena.

---

### Milestones

```
Milestone = vlastní entita na projektu:
  • Atributy: název, datum, popis, stav (Upcoming / Reached / Missed)
  • Vazba na úkoly/epicy (které úkoly musí být Done pro dosažení milestone)
  • Zobrazení: diamant v Gantt/Timeline view
  • Auto-stav: Reached když všechny navázané úkoly Done, Missed po datu bez splnění
  • Dependencies: milestone může být dependency target (Finish-to-Start)
  • Notifikace: upozornění PM X dní před datem (konfigurovatelné)
```

---

### Sprint Goal

```
Každý sprint má povinný Sprint Goal:
  • Textové pole (povinné při vytváření sprintu)
  • Zobrazuje se na sprint boardu (header)
  • Viditelné v sprint review a retrospektivě
  • Sprint analytics: goal achieved / not achieved (PM hodnotí při uzavření sprintu)
```

---

### Backlog ordering

```
Hybridní řazení:
  • Default: automatické řazení dle priority (Critical → High → Medium → Low)
  • V rámci stejné priority: dle data vytvoření (nejstarší nahoře)
  • PM může manuálně přeřadit drag & drop → custom rank
  • Custom rank přebíjí auto řazení (položka zůstane na pozici)
  • Reset rank: PM může vrátit na auto řazení
  • Rank je per backlog (projekt), ne globální
```

---

### CSAT (Customer Satisfaction)

```
Po uzavření ticketu:
  • Automatický CSAT dotazník (email + in-app notifikace)
  • Hodnocení: 1-5 hvězd + volitelný textový komentář
  • Timing: odesláno X hodin po Closed (admin konfiguruje per typ entity):
    - Incident: default 24h (uživatel potřebuje ověřit, že fix funguje)
    - Service Request: default 2h (jednodušší akce, rychlá zpětná vazba)
  • Reminder: pokud neodpověděno, 1 reminder po 48h
  • Metriky v ITSM dashboardu:
    - CSAT score per agent / tým / service desk
    - Trend (měsíční/čtvrtletní graf)
    - Response rate
  • Negativní hodnocení (1-2 hvězdy): auto-notifikace team leadovi
  • CSAT data dostupná v reportech a exportech
```

---

### Problem Management (plný ITIL workflow)

```
Workflow:
  Created → Categorized → Assigned → Root Cause Analysis
  → Known Error (KEDB záznam) → Solution Proposed
  → Solution Implemented → Closed

  • Priorita: Critical / High / Medium / Low (jako incidenty)
  • Vazby: Problem ↔ Incident(y) (1:N), Problem → KEDB (1:1), Problem → Iniciativa/Projekt
  • Assignee: Problem Manager (systémová role PM nebo Agent)
  • Timeline: RCA deadline (konfigurovatelný per priorita)
  • Eskalace: auto-eskalace pokud RCA deadline překročen
  • Metriky: MTTR (Mean Time to Resolve), počet linked incidentů, recurrence rate
  • Reporting: Problem trends, top recurring problems, RCA completion rate
```

---

### Time tracking (bez schvalování)

```
Přímé logování bez approval workflow:
  • Team Member zaloguje hodiny → okamžitě se počítají do budgetů a reportů
  • Žádné Pending/Approve/Reject stavy — jednoduchý workflow
  • PM a Executive vidí zalogované hodiny v reportech
  • Team Member může editovat své time logy (do X dní po zalogování, admin konfiguruje, default 14)
  • Po uplynutí edit window: zamčeno (pouze admin může editovat)
  • Audit log: každá změna time logu zaznamenaná
```

---

### Cross-project dependencies

```
Závislosti mezi úkoly z různých projektů:
  • Úkol z projektu A může blokovat úkol z projektu B (všechny 4 typy: FS/SS/FF/SF)
  • Dependency graph zobrazuje cross-project vazby (barevně odlišené per projekt)
  • Oprávnění: uživatel musí mít alespoň Read na oba projekty
  • Notifikace: při blokaci cross-project → notifikace PM obou projektů
  • Kritická cesta: počítá se i přes hranice projektů
  • Portfolio view: zobrazuje cross-project dependencies
  • Circular dependency detection: funguje i cross-project
```

---

### Epic scope

```
Epic patří vždy do jednoho projektu:
  • Epic = 1 projekt (striktní vazba)
  • Cross-cutting práce se řeší přes Iniciativu (nadřazená úroveň)
  • Přesun epicu do jiného projektu: možný (PM obou projektů musí souhlasit)
  • Při přesunu: úkoly v epicu se přesunou s ním
```

---

### Webhook retry policy

```
Outbound webhooky — retry s exponenciálním backoff:
  • 5 pokusů s exponenciálním backoff:
    1. okamžitě, 2. po 1 minutě, 3. po 5 minutách, 4. po 1 hodině, 5. po 24 hodinách
  • Timeout per request: 10s
  • Očekávaná odpověď: HTTP 2xx = success
  • Po selhání všech 5 pokusů:
    - Webhook auto-disabled
    - Admin notifikace: "Webhook XY disabled po opakovaném selhání"
    - Admin může: opravit URL, re-enable, smazat
  • Webhook log: všechny pokusy (request, response, status) v admin panelu
  • Podpis: HMAC-SHA256 signature v headeru (X-Nexus-Signature) pro ověření
```

---

### Command palette & keyboard shortcuts

```
Command palette (Ctrl+K / Cmd+K):
  • Vyhledávání: entity (úkoly, projekty, KB...), akce, navigace
  • Fuzzy search s ranking (nedávné, oblíbené nahoře)
  • Akce: "Vytvořit úkol", "Přejít na projekt X", "Moje úkoly"
  • Kontextové: akce relevantní pro aktuální stránku

Globální klávesové zkratky:
  • Ctrl+K: Command palette
  • C: Vytvořit novou entitu (kontextové)
  • G+P: Go to Projects
  • G+M: Go to My Work
  • G+H: Go to Home
  • /: Fokus na search
  • ?: Zobrazit přehled zkratek
  • Konfigurovatelné: ne (fixní sada)
  • Deaktivovatelné: ano (per uživatel v nastavení profilu)
```

---

### Dashboard widgety (rozšířená sada)

```
Základní widgety:
  • Číselné KPI karty (single metric s trendem)
  • Pie / donut chart
  • Bar chart (horizontální / vertikální)
  • Line / area chart (časové řady)
  • Tabulka (sortovatelná, stránkovaná)
  • Burndown / burnup chart
  • Velocity chart
  • SLA přehled (per desk/priorita)
  • Cumulative Flow Diagram
  • CSAT score widget

Custom query builder:
  • Uživatel definuje:
    - Zdroj dat (modul: Projekty, ITSM, OKR, Time tracking...)
    - Filtry (stav, tým, priorita, datum, custom fields...)
    - Agregace (count, sum, avg, min, max)
    - Seskupení (per stav, assignee, priorita, tým, měsíc...)
    - Vizualizace (typ grafu)
  • Uložení jako šablona widgetu (sdílitelná)
  • Auto-refresh: konfigurovatelný interval (5min / 15min / 30min / manuální)
```

---

### Google Calendar sync

```
Obousměrná sync pro porady + jednosměrná pro deadliny:

Porady (Meeting Notes):
  • Vytvoření Meeting Notes v Nexus → auto Calendar event (datum, čas, účastníci)
  • Editace v Nexus → sync do Calendar
  • Editace v Calendar → sync do Nexus (čas, účastníci)
  • Smazání v Nexus → smazání Calendar event
  • Odkaz na Meeting Notes v popisu Calendar eventu

Deadliny (jednosměrně Nexus → Calendar):
  • Úkoly a milestones s deadline → celodenní Calendar event
  • Konfigurovatelné per uživatel: které deadliny (mé úkoly / mé projekty / vše)
  • Automatická aktualizace při změně deadline
  • Vizuálně odlišené od běžných Calendar events (barva / prefix [Nexus])

Čtení z Calendar (Calendar → Nexus):
  • Kapacita/workload: automatické odečtení z Calendar events (viz Workload sekce)
```

---

### Activity feed (3 úrovně)

```
1. Per entita (záložka na detailu):
  • Všechny změny na entitě: stav, assignee, priorita, custom fields
  • Komentáře, přílohy, time logy
  • Workflow přechody, approval rozhodnutí
  • Chronologicky (nejnovější nahoře)

2. Per projekt (view v projektu):
  • Všechny změny na entitách v projektu
  • Sprint events (start, close, cancel)
  • Release events
  • Filtry: typ entity, typ události, autor, datum

3. Globální / My Feed (v Home):
  • Změny na entitách kde jsem: assignee, reporter, watcher, team member
  • @mentions
  • Approval requesty
  • Filtry: modul, projekt, typ události
  • Konfigurovatelné: co zobrazovat (per uživatel)
  • Deduplikace: hromadné změny (bulk) jako jedna položka
```

---

### Email šablony (admin customization)

```
Plně editovatelné email šablony:
  • WYSIWYG editor pro HTML šablony
  • Branding: logo, barvy, zápatí, header image
  • Texty: editovatelné per typ notifikace (subject i body)
  • Proměnné: {user.name}, {entity.title}, {entity.url}, {project.name}...
  • Preview: náhled emailu před uložením
  • Šablony per typ:
    - Task assigned, Status changed, Comment added
    - SLA warning, Escalation, Approval request
    - CSAT survey, Invite, Password reset
    - Digest (denní/týdenní)
  • Reset: možnost vrátit na výchozí systémovou šablonu
  • Testovací email: odeslat test na vlastní adresu
```

---

### API verzování

```
URL prefix:
  • Formát: /api/v1/tasks, /api/v1/projects...
  • Aktuální verze: v1
  • Při breaking changes: nová verze (v2) + stará verze podporována min 6 měsíců
  • Deprecation: header X-Nexus-Deprecated: true + sunset date
  • Dokumentace: OpenAPI/Swagger per verze
```

---

### Undo / Redo

```
Univerzální undo pro všechny změny:
  • Každá změna (stav, přiřazení, priorita, pole, tag...): toast s "Undo" tlačítkem
  • Undo window: 30 sekund
  • Stacked: více po sobě jdoucích změn = více undo toastů (max 5 viditelných)
  • Undo reverts celou akci (audit log: záznam původní změny + undo)
  • Výjimky (bez undo):
    - Odeslané notifikace / emaily (nelze vzít zpět)
    - Approval rozhodnutí (Approve/Reject)
    - Workflow přechody s side effects (SLA start, auto-routing)
  • Redo: ne (po undo lze akci provést znovu manuálně)
```

---

### Aktualizovaný finální checklist (109 oblastí)

| # | Oblast | Stav | Detaily |
|---|--------|------|---------|
| 94 | Milestones | ✅ | Vlastní entita, diamant v Gantt, auto-stav, vazba na úkoly |
| 95 | Sprint Goal | ✅ | Povinné textové pole, viditelné na boardu |
| 96 | Backlog ordering | ✅ | Hybridní: auto dle priority + manuální drag & drop rank |
| 97 | CSAT | ✅ | Po uzavření ticketu, 1-5 hvězd, metriky per agent/tým |
| 98 | Problem Management (plný) | ✅ | ITIL workflow 8 stavů, RCA deadline, eskalace, metriky |
| 99 | Time tracking (bez approval) | ✅ | Přímé logování, okamžité započítání, edit window X dní |
| 100 | Cross-project dependencies | ✅ | Všechny 4 typy přes hranice projektů, cross-project kritická cesta |
| 101 | Epic scope | ✅ | Vždy 1 projekt, cross-cutting přes Iniciativu |
| 102 | Webhook retry | ✅ | 5 pokusů s exponenciálním backoff, auto-disable, HMAC podpis, log |
| 103 | Command palette | ✅ | Ctrl+K, fuzzy search, globální klávesové zkratky |
| 104 | Dashboard widgety | ✅ | Základní sada + custom query builder, auto-refresh |
| 105 | Google Calendar sync | ✅ | Obousměrná porady, jednosměrná deadliny, čtení kapacity |
| 106 | Activity feed | ✅ | 3 úrovně: entita, projekt, globální/My Feed |
| 107 | Email šablony | ✅ | WYSIWYG editor, branding, proměnné, per typ notifikace |
| 108 | API verzování | ✅ | URL prefix /api/v1/, deprecation policy 6 měsíců |
| 109 | Undo | ✅ | Univerzální undo 30s toast, stacked, výjimky pro side effects |

---

## DOPLNĚNÍ PO HLOUBKOVÉ ANALÝZE (v5 — 2026-03-22)

> Výsledky systematického review kompletnosti business logiky.
> Doplnění chybějících oblastí: Product Discovery, Field Configuration, eskalační matice,
> cross-level dependencies, CI/CD integrace, SLA matice, a další.

---

### Product Discovery (kompletní modul)

```
┌─ PRODUCT DISCOVERY ──────────────────────────────────────────┐
│                                                                │
│  Ideas Backlog:                                                │
│    • Kdokoli může vytvořit Idea (nový typ entity)             │
│    • Atributy: název, popis, autor, customer segment,         │
│      evidence/insights, stav, scoring                          │
│    • Workflow: New → Under Review → Accepted → Planned         │
│      → In Progress → Shipped → Rejected / Parked              │
│                                                                │
│  Scoring model (konfigurovatelný per portfolio):               │
│    • RICE: Reach × Impact × Confidence / Effort               │
│    • ICE: Impact × Confidence × Ease                          │
│    • WSJF: (Biz Value + Time Criticality + Risk Red.) / Size  │
│    • Custom: admin definuje vlastní váhy a kritéria            │
│    • Scoring vizualizace: 2D bubble chart (value vs. effort)  │
│    • Re-scoring: PM může aktualizovat, historický tracking     │
│                                                                │
│  Voting:                                                       │
│    • Interní hlasování: upvote/downvote na ideas              │
│    • Customer feedback linking:                                │
│      - Link externích feedbacků (email, support ticket, call) │
│      - Evidence počet: kolik zákazníků/požadavků je za ideou  │
│      - Customer segment tagging na evidence                    │
│    • Celkové skóre: scoring model + vote count + evidence     │
│                                                                │
│  Roadmap views:                                                │
│    • Now / Next / Later view:                                  │
│      - 3 sloupce s drag & drop přesuny                        │
│      - Filtry: tým, segment, scoring, stav                    │
│      - Per portfolio / per produkt                             │
│    • Timeline view:                                            │
│      - Gantt-like timeline s iniciativami/projekty             │
│      - Časová osa (kvartály, měsíce)                          │
│      - Filtry per tým/portfolio                                │
│    • Oba režimy jako přepínatelné views                        │
│                                                                │
│  Vazba na ostatní moduly:                                      │
│    • Idea → Accepted → vytvoření Iniciativy (automaticky):    │
│      - Vlastník Iniciativy: PM portfolia (který Accepted)     │
│      - Přenos dat: název, popis, evidence, scoring            │
│      - Vazba: Iniciativa ↔ původní Idea (traceabilita)       │
│      - Autor Idey: přidán jako stakeholder na Iniciativě     │
│    • Iniciativa → Projekt(y) → Úkoly (existující flow)        │
│    • Zpětná vazba: Shipped idea → CSAT / feedback collection  │
│    • Reporting: idea-to-delivery time, conversion rate         │
│                                                                │
│  Oprávnění:                                                    │
│    • Executive: plný přístup, schvalování                     │
│    • PM: full CRUD, scoring, roadmap management               │
│    • Team Member: vytvořit idea, hlasovat, komentovat         │
│    • Guest: bez přístupu k Product Discovery                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Field Configuration (plná konfigurace)

```
Viditelnost a povinnost polí — konfigurovatelné na 3 úrovních:

1. Per typ entity (globální default):
  • Admin definuje, která pole jsou viditelná / skrytá / povinná / read-only
  • Platí pro všechny entity daného typu (např. všechny Bug úkoly)

2. Per workflow stav:
  • Pole mohou být povinná jen v určitých stavech
  • Příklad: "Resolution" povinné pouze při přechodu do Resolved
  • Příklad: "Root Cause" povinné v RCA stavu incidentu
  • Podmíněná povinnost: "Pokud priorita = Critical, pak Impact Assessment povinný"

3. Per role:
  • Viditelnost polí per systémová role
  • Příklad: "Budget" pole viditelné jen pro PM a Executive
  • Příklad: "Internal Notes" skryté pro Guest

Custom fields — rozšířené typy:
  • Text (jednořádkový, víceřádkový)
  • Číslo (min/max validace)
  • Datum / Datum+čas
  • Select (dropdown) / Multi-select
  • Checkbox (boolean)
  • URL (s validací formátu)
  • User picker (výběr uživatele)
  • Formula / Computed field (výpočet z jiných polí)

Validace:
  • Min/max pro čísla
  • Regex pro text (admin definuje vzor)
  • Required / optional per typ entity a workflow stav
  • Default hodnoty (statické nebo dynamické: např. "aktuální uživatel")

Odebrání Select/Multi-select možnosti:
  • Existující entity si hodnotu ponechají (read-only, zobrazena šedě jako "deprecated")
  • Nové entity ji nemohou vybrat (odstraněna z dropdownu)
  • Admin vidí report: kolik entit má deprecated hodnotu

Smazání custom field definice:
  • Soft delete: pole skryto z UI, data zachována v DB
  • Hard delete: povinný potvrzovací dialog, data nenávratně smazána
  • Export dat pole před smazáním: nabídnuto automaticky
```

---

### WIP limity na Kanban boardu

```
Soft warning (ne hard block):
  • PM konfiguruje WIP limit per sloupec boardu
  • Při dosažení limitu: vizuální upozornění (červený sloupec, warning ikona)
  • Přesun úkolu do plného sloupce: POVOLENO, ale s warning dialogem
    "Sloupec 'In Progress' má WIP limit 5 a aktuálně obsahuje 5 položek. Pokračovat?"
  • Metrika: počet WIP limit porušení per sprint (v sprint analytics)
  • WIP limit = 0 znamená bez limitu (default)
```

---

### Epic workflow (automatický z úkolů)

```
Stav Epicu se počítá automaticky z podřízených úkolů:
  • Všechny úkoly To Do (nebo žádné úkoly) → Epic: To Do
  • Alespoň 1 úkol In Progress / Code Review / Testing → Epic: In Progress
  • Všechny úkoly Done / Cancelled / Won't Do → Epic: Done
  • Progress bar: % dokončených úkolů (dle počtu nebo Story Points)

  • Epic NEMÁ vlastní konfigurovatelný workflow
  • PM NEMŮŽE ručně změnit stav Epicu (auto only)
  • Výjimka: PM může Epic označit jako Cancelled (ručně, i s otevřenými úkoly)
  • Cancelled Epic: podřízené úkoly zůstávají v aktuálním stavu (ne auto-close)
```

---

### Eskalační matice (formální)

```
┌─ ESKALAČNÍ MATICE (Service Management) ──────────────────────┐
│                                                                │
│  3 úrovně eskalace:                                           │
│                                                                │
│  L1 — Service Desk Agent (první kontakt):                     │
│    • Řeší: standardní incidenty, service requesty, FAQ        │
│    • SLA: dle priority (konfigurováno v SLA matici)            │
│    • Warning agentovi + team leadovi: při SLA 75% spotřeby    │
│    • Auto-eskalace na L2: při SLA 90% spotřeby               │
│                                                                │
│  L2 — Senior Agent / Specialist:                              │
│    • Řeší: komplexní incidenty, eskalované z L1               │
│    • Přiřazení: auto-routing dle kategorie/komponenty         │
│    • Auto-eskalace na L3: při SLA breach nebo po X hodinách   │
│                                                                │
│  L3 — Team Lead / Management:                                 │
│    • Řeší: kritické incidenty, opakované problémy             │
│    • Notifikace: Head of Department + Executive               │
│    • Pravomoci: přiřazení zdrojů, priority override           │
│                                                                │
│  Konfigurace (admin per service desk):                        │
│    • Časové limity per úroveň a priorita                      │
│    • Osoby na každé úrovni (round-robin nebo jmenované)       │
│    • Podmínky auto-eskalace (SLA %, čas, priorita)            │
│    • Notifikační řetězec per úroveň                           │
│                                                                │
│  Manuální eskalace:                                           │
│    • Tlačítko "Eskalovat" na ticketu                          │
│    • Povinný důvod eskalace                                   │
│    • Audit log: kdo eskaloval, kdy, proč                      │
│                                                                │
│  Major Incident (základní):                                   │
│    • Flag "Major Incident" na ticketu (L2+ může nastavit)     │
│    • Auto-eskalace na L3 + notifikace managementu             │
│    • Prioritní řazení ve frontě agentů                        │
│    • Post-incident: povinný Problem record + základní review  │
│    • Bez formálního war room a komunikačního plánu (v MVP)    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Dependencies na všech úrovních

```
Závislosti rozšířeny na VŠECHNY hierarchické úrovně:

Úkol ↔ Úkol (existující):
  • 4 typy: FS, SS, FF, SF
  • Cross-project podporováno (viz Cross-project dependencies)

Epic ↔ Epic:
  • Závislosti mezi Epicy (i cross-project)
  • Vizualizace v Gantt na úrovni Epicu

Projekt ↔ Projekt:
  • "Projekt A závisí na deliverable z Projektu B"
  • Typ: Finish-to-Start (projekt B musí být Completed před projektem A)
  • Vizualizace v Portfolio timeline view
  • Notifikace PM obou projektů při blokaci

Iniciativa ↔ Iniciativa:
  • Strategické závislosti
  • Vizualizace v Portfolio / Roadmap view
  • Notifikace Executive při blokaci

Dopadová analýza:
  • Při zpoždění entity: systém ukáže všechny downstream závislé entity
  • "Zpoždění Epic X ovlivní: Epic Y (projekt B), Milestone Z, Release 2.1"
  • Kritická cesta počítána přes všechny úrovně
  • Circular dependency detection na všech úrovních
```

---

### CI/CD integrace (auto status change)

```
PR merge → automatická změna stavu úkolu (konfigurovatelné per projekt):

  Nastavení (PM per projekt):
  • Zapnuto / Vypnuto (default: vypnuto)
  • Mapování:
    - PR created → úkol přechází do: [konfigurovatelný stav, default: Code Review]
    - PR merged → úkol přechází do: [konfigurovatelný stav, default: Testing]
    - PR closed (bez merge) → žádná změna stavu

  Podmínky:
  • Auto status change jen pokud je úkol v kompatibilním stavu
    (např. In Development → Code Review, ale ne Done → Code Review)
  • Pokud nekompatibilní: metadata se uloží, stav se NEZMĚNÍ, notifikace PM

  Deployment tracking:
  • Release entity: deploy info (environment, timestamp, deployment ID)
  • Vazba: Release → Change Request (automaticky při deploy)
  • Webhook z CI/CD systému: POST /api/v1/releases/{id}/deploy

  Git linking (rozšíření):
  • Commit/PR obsahující ID entity (NEXUS-123) → auto-link
  • Na kartě úkolu: záložka "Code" se seznamem commitů/PR
  • PR status (open/merged/closed) viditelný na kartě úkolu
  • Podporované platformy: GitHub, GitLab, Bitbucket
```

---

### Bulk operace — notifikace a oprávnění

```
Notifikace při bulk operacích:
  • AGREGACE: všechny změny seskupeny do jedné souhrnné notifikace
  • Formát: "Jan změnil 50 úkolů: stav → In Progress"
  • Jeden email/in-app notifikace per dotčený uživatel (ne 50 separátních)
  • Activity feed: bulk operace jako jedna položka s batch ID (expandovatelná)

Oprávnění při bulk operacích:
  • ALL-OR-NOTHING: pokud uživatel nemá oprávnění na VŠECHNY vybrané entity,
    celá operace SELŽE
  • Chybová hláška: "Nemáte oprávnění na X z Y vybraných entit. Operace zrušena."
  • Seznam entit bez oprávnění zobrazen v chybovém dialogu
  • Uživatel může: opravit výběr a zkusit znovu
```

---

### SLA konfigurace (plná matice)

```
SLA policy = matice: service desk × priorita × kategorie

  Definice (admin per service desk):
  ┌──────────────┬───────────┬────────────┬──────────────┬───────────┐
  │ Priorita     │ 1st Resp. │ Resolution │ Update Freq. │ Kategorie │
  ├──────────────┼───────────┼────────────┼──────────────┼───────────┤
  │ Critical     │ 15 min    │ 4h         │ 1h           │ Incident  │
  │ Critical     │ 30 min    │ 8h         │ 2h           │ Request   │
  │ High         │ 1h        │ 8h         │ 4h           │ Incident  │
  │ High         │ 2h        │ 16h        │ 8h           │ Request   │
  │ Medium       │ 4h        │ 24h        │ 8h           │ Incident  │
  │ Low          │ 8h        │ 48h        │ 24h          │ Incident  │
  └──────────────┴───────────┴────────────┴──────────────┴───────────┘
  (příklad — plně konfigurovatelné adminem)

  SLA metriky (3 typy):
  • First Response Time: čas do první veřejné odpovědi agenta
  • Resolution Time: čas do přechodu do Resolved
  • Update Frequency: max čas mezi aktualizacemi (komentář, stav změna)

  Business hours:
  • SLA počítá jen v pracovních hodinách (per service desk konfigurace)
  • Kalendář svátků (ČR, SK)
  • Override: Critical incidenty = 24/7 SLA (konfigurovatelné)

  SLA při merge/split ticketů:
  • Merge: master ticket přebírá NEJSTARŠÍ (nejpřísnější) SLA timer
  • Split: nové tickety DĚDÍ SLA z rodičovského ticketu (pokračují v čase)

  SLA při reopen:
  • SLA timer POKRAČUJE od původní hodnoty (kumulativní)
  • Reporting: celkový čas od prvního otevření do finálního vyřešení

  SLA při změně politiky:
  • Otevřené tickety: dokončí se s PŮVODNÍ SLA (snapshot při vytvoření ticketu)
  • Nové tickety: dostanou novou SLA politiku
  • Admin vidí v dashboardu: kolik ticketů běží pod starou vs. novou politikou
```

---

### Sentry integrace — flood protection

```
Ochrana proti incident storm (stovky alertů najednou):

  Deduplikace:
  • Dle Sentry issue ID (fingerprint) — stejný error = update existujícího incidentu
  • Metadata se přidávají (nové affected users, environments)

  Rate limiting:
  • Max X nových incidentů za Y minut (admin konfiguruje, default: 20 za 5 min)
  • Po překročení: nové alerty se řadí do fronty (max velikost fronty: 100)
  • Nad limit fronty: jeden souhrnný "flood summary" incident s počtem alertů, vzorky chyb a affected environments
  • Notifikace admina: "Sentry flood detected — X alertů za Y minut, Z ve frontě / sumarizováno"

  Severity mapping:
  • Sentry level → incident priorita:
    - fatal → Critical
    - error → High
    - warning → Medium
    - info → Low (volitelně: ignorovat)
  • Konfigurovatelné per Sentry projekt

  Grouping:
  • Alerty ze stejného Sentry projektu v krátkém časovém okně:
    seskupeny pod jeden "umbrella" incident s child incidenty
  • Umbrella incident: souhrnný popis, počet sub-alertů, affected environments
```

---

### Change freeze / Deployment windows

```
Change Management rozšíření:

  Change Freeze období:
  • Admin definuje: datum od, datum do, důvod, dotčené service desky
  • Během freeze: Standard a Normal changes BLOKOVÁNY (nelze schválit)
  • Emergency changes: POVOLENY i během freeze (přes ECAB)
  • Vizualizace: kalendářový pohled s freeze obdobími
  • Notifikace: upozornění PM/agentům X dní před freeze

  Maintenance windows:
  • Plánované okno pro deployment/údržbu
  • Atributy: datum, čas od-do, popis, dotčené systémy/komponenty
  • Vazba na Change Request (povinná)
  • Kalendářový pohled: maintenance windows + releases + milestones
  • Notifikace dotčeným uživatelům/týmům

  Deployment calendar:
  • Centrální kalendář: všechny releases, maintenance windows, change freezes
  • Přístup: PM + Executive
  • Konflik detection: warning při plánování release do freeze období
```

---

### Data retention (konfigurovatelná per typ)

```
Admin konfiguruje retenci per typ dat:

  ┌─────────────────────────┬────────────────────────┬──────────────┐
  │ Typ dat                 │ Default retence         │ Rozsah       │
  ├─────────────────────────┼────────────────────────┼──────────────┤
  │ Archivované projekty    │ Soubory: 12 měsíců     │ 6-36 měsíců  │
  │ Notifikace (in-app)     │ 90 dní                 │ 30-365 dní   │
  │ Audit log               │ Navždy (pseudonymiz.)  │ Neměnitelné  │
  │ Webhook logy            │ 30 dní                 │ 7-90 dní     │
  │ Session logy            │ 30 dní                 │ 7-90 dní     │
  │ Search analytics        │ 90 dní                 │ 30-365 dní   │
  │ Koš (smazané entity)    │ 60 dní                 │ 30-90 dní    │
  │ Export download links   │ 24 hodin               │ Neměnitelné  │
  │ Time logy               │ Navždy                 │ Neměnitelné  │
  │ CSAT odpovědi           │ Navždy                 │ Neměnitelné  │
  └─────────────────────────┴────────────────────────┴──────────────┘

  Automatické čištění:
  • Scheduled job: denně v noci (konfigurovat čas)
  • Před smazáním: sumarizace (agregované statistiky zachovány)
  • Monitoring: dashboard s aktuální velikostí storage per typ
  • Alert: upozornění admin při překročení storage thresholdu
```

---

### Board konfigurace (Kanban/Scrum)

```
Konfigurace boardu per projekt:

  Sloupce:
  • Mapování workflow stavů na sloupce boardu
  • Více stavů může sdílet jeden sloupec (např. "Code Review" + "Testing" → "Review")
  • Pořadí sloupců: drag & drop
  • Skrytí sloupců (stav existuje, ale na boardu se nezobrazuje)

  Swimlanes:
  • Seskupení karet: per assignee, priorita, typ entity, epic, komponenta, tag
  • Žádné swimlanes (default) / 1 aktivní swimlane

  Quick filters:
  • Předdefinované filtrační tlačítka na boardu
  • Příklady: "Moje úkoly", "Blockers", "Due this week"
  • PM konfiguruje per board

  Karty:
  • Konfigurace viditelných polí na kartě (ikony, labels, SP, assignee avatar)
  • Barevné kódování: per priorita / per typ / per tag (konfigurovatelné)
```

---

### Notifikační schéma per projekt

```
Per-projekt override notifikací (PM konfiguruje):

  • PM může nastavit defaultní notifikační pravidla pro svůj projekt:
    - "Každý v projektu dostane notifikaci při změně priority na Critical"
    - "Všichni watchers dostávají notifikace na všechny změny stavu"
  • Uživatel může override per-projekt pravidla ve svém nastavení (osobní > projekt)
  • Service desk: notifikační schéma per desk (kdo dostane jakou notifikaci per událost)

  Schéma definice:
  ┌──────────────────┬──────────────────┬─────────────┐
  │ Událost          │ Příjemce         │ Kanál       │
  ├──────────────────┼──────────────────┼─────────────┤
  │ Priority → Crit. │ Celý tým        │ Okamžitě    │
  │ Status changed   │ Reporter+Assign. │ Dle preference│
  │ Comment added    │ Watchers         │ Dle preference│
  │ Sprint started   │ Celý tým        │ Okamžitě    │
  └──────────────────┴──────────────────┴─────────────┘
```

---

### Definition of Done (DoD)

```
Checklist kritérií pro dokončení úkolu (protějšek DoR):
  • Konfigurovatelná per projekt/tým (jako DoR)
  • Příklady kritérií: kód otestován, code review provedeno, dokumentace aktualizována,
    acceptance criteria splněna, QA testy prošly
  • Systém kontroluje splnění při přechodu do Done
  • Soft block: warning pokud nesplněno (PM může override)
  • Viditelné na kartě úkolu: progress indikátor DoD
  • Per typ entity: různé DoD pro Bug vs. Story vs. Design Task
```

---

### KB review cyklus

```
Pravidelný review obsahu Knowledge Base:
  • Automatický review cyklus per space (admin konfiguruje: kvartálně / pololetně / ročně)
  • Na začátku cyklu: systém vygeneruje seznam stránek k revizi
  • Notifikace vlastníkům stránek: "Vaše stránka XY je připravena k revizi"
  • Stav revize: Pending Review → Reviewed (OK) / Needs Update
  • Dashboard: content health per space (% reviewed, % outdated, % updated)
  • Kombinace s Content Expiry: expiry dates + review cyklus = dvojitá ochrana proti zastaralému obsahu
```

---

### Aktualizovaný finální checklist (v5 — 129 oblastí)

| # | Oblast | Stav | Detaily |
|---|--------|------|---------|
| 110 | Product Discovery | ✅ | Ideas backlog, scoring (RICE/ICE/WSJF/custom), voting + customer feedback, roadmap Now/Next/Later + Timeline |
| 111 | Field Configuration | ✅ | Plná konfigurace: viditelnost + povinnost per typ entity, per workflow stav, per role |
| 112 | WIP limity | ✅ | Soft warning (vizuální upozornění, přesun povolený s dialogem) |
| 113 | Epic workflow | ✅ | Automatický stav z podřízených úkolů, PM může jen Cancelled |
| 114 | Eskalační matice | ✅ | Formální L1→L2→L3, časové limity, auto-eskalace, Major Incident flag |
| 115 | Dependencies (všechny úrovně) | ✅ | Úkol, Epic, Projekt, Iniciativa — cross-project, dopadová analýza |
| 116 | CI/CD auto status | ✅ | PR merge → auto status change (konfigurovatelné per projekt) |
| 117 | Bulk notifikace | ✅ | Agregace do jedné souhrnné notifikace per dotčený uživatel |
| 118 | Bulk oprávnění | ✅ | All-or-nothing (celá operace selže pokud chybí oprávnění na jakoukoli entitu) |
| 119 | SLA matice | ✅ | Per desk × priorita × kategorie, 3 metriky, merge/split pravidla |
| 120 | Release Management (rozšířený) | ✅ | 5 stavů + hotfix workflow + vazba na Change Management |
| 121 | Sentry flood protection | ✅ | Deduplikace, rate limiting, severity mapping, grouping |
| 122 | Change freeze | ✅ | Freeze období, maintenance windows, deployment calendar |
| 123 | Data retention | ✅ | Konfigurovatelná per typ dat, auto čištění, storage monitoring |
| 124 | Board konfigurace | ✅ | Sloupce (stav→sloupec mapování), swimlanes, quick filters, karty |
| 125 | Notifikační schéma | ✅ | Per-projekt override, schéma definice (událost × příjemce × kanál) |
| 126 | Definition of Done | ✅ | Checklist per projekt/tým, soft block, per typ entity |
| 127 | KB review cyklus | ✅ | Automatický review per space, content health dashboard |
| 128 | Entity override (obousměrný) | ✅ | Entity override PŘEPISUJE systémovou roli (může rozšířit i omezit) |
| 129 | SLA pokračování při reopen | ✅ | SLA timer pokračuje kumulativně (ne restart) |

---

## DOPLNĚNÍ PO HLOUBKOVÉ ANALÝZE (v6 — 2026-03-22)

> Výsledky systematické analýzy business logic mezer identifikovaných při review kompletnosti dokumentu.
> 10 klíčových rozhodnutí na edge cases a nesrovnalosti. Všechna rozhodnutí projednána a schválena.

---

### SLA při změně priority mid-ticket

```
Pravidlo: PŮVODNÍ SLA ZŮSTÁVÁ

  • Změna priority ticketu po vytvoření NEOVLIVNÍ běžící SLA timer
  • Ticket doběhne s SLA odpovídajícím prioritě v momentě vytvoření (snapshot)
  • Změna priority ovlivní:
    - Routing a eskalace (nová priorita se použije pro eskalační matici)
    - Řazení ve frontě agentů (vyšší priorita = výš ve frontě)
    - Reporting: ticket se reportuje pod AKTUÁLNÍ prioritou, SLA pod PŮVODNÍ
  • Důvod: ochrana proti gaming (agent sníží prioritu pro uvolnění SLA)
    a zároveň férovost (upgrade priority nezpůsobí okamžitý breach)
  • Admin vidí v dashboardu: počet priority změn per agent (monitoring gaming)
```

---

### First Response definice (SLA metrika)

```
First Response = první VEŘEJNÝ komentář agenta NEBO přiřazení agentovi

  Co SE počítá:
  • Veřejný komentář agenta (viditelný pro reportera)
  • Přiřazení ticketu agentovi (přechod do stavu Assigned)
  • Cokoliv nastane DŘÍVE = first response

  Co se NEPOČÍTÁ:
  • Automatická systémová odpověď (potvrzení přijetí ticketu)
  • Kategorizace bez přiřazení (Submitted → Categorized)
  • Private note (interní poznámka viditelná jen agentům)
  • Změna priority, tagu nebo custom fieldu

  Důvod: first response musí znamenat, že se někdo reálně ujal ticketu.
  Pouhá kategorizace bez přiřazení neznamená, že zákazník dostal odpověď.
```

---

### Parallel approval — rejection logika

```
Pravidlo: JEDEN REJECT = BLOKUJE (veto právo)

  Platí pro VŠECHNY parallel approval režimy:
  • Unanimita: 1 Reject → okamžitě Rejected, ostatní hlasování zastaveno
  • Majorita: 1 Reject → okamžitě Rejected, ostatní hlasování zastaveno
  • N z M: 1 Reject → okamžitě Rejected, ostatní hlasování zastaveno
  • Vážené hlasování: 1 Reject → okamžitě Rejected

  Chování po Reject:
  • Notifikace žadateli + všem schvalovatelům: "Zamítnuto uživatelem X"
  • Povinný důvod zamítnutí (textové pole)
  • Žadatel může: opravit a znovu podat (nové approval kolo) nebo eskalovat
  • Audit log: kdo zamítl, kdy, důvod

  Důvod: v healthcare prostředí je bezpečnější blokovat při jakémkoli nesouhlasu.
  Pokud schvalovatel vidí problém, proces se zastaví a řeší se.
```

---

### OKR progress agregace

```
Pravidlo: DVA PARALELNÍ POHLEDY (auto-agregace + manuální scoring)

  Auto-agregace (systémová):
  • Progress KR = průměr progress všech navázaných Projektů/Iniciativ
  • Počítá se automaticky, real-time
  • Zobrazení: progress bar na KR kartě (label "Auto")
  • Vzorec: prostý průměr (všechny vazby mají stejnou váhu)

  Manuální scoring (vlastníkem KR):
  • Vlastník KR nastavuje scoring 0–1.0 dle vlastního úsudku
  • Aktualizace: při check-inech (týdenní/měsíční reminder)
  • Zobrazení: číselná hodnota na KR kartě (label "Manual")

  Dashboard zobrazuje OBĚ hodnoty vedle sebe:
  • PM/Executive si volí, kterou hodnotu použije pro reporting
  • Výchozí pro reporting: manuální scoring (auto-agregace jako reference)
  • Při Closing OKR cyklu: finální scoring je VŽDY manuální (0–1.0)

  Důvod: auto-agregace nepostihuje kvalitativní aspekty (KR může být
  "50% hotovo" dle úkolů, ale klíčový deliverable stále chybí).
  Manuální scoring dává vlastníkovi kontrolu.
```

---

### Sprint close (normální uzavření) — nedokončené úkoly

```
Pravidlo: PM ROZHODNE PER ÚKOL (stejně jako při cancellation)

  Při uzavření sprintu (Sprint Review → Close):
  • Systém zobrazí dialog se seznamem nedokončených úkolů
  • PM u každého úkolu zvolí:
    [Přesunout do dalšího sprintu] [Vrátit do backlogu] [Won't Do]
  • Default volba: "Přesunout do dalšího sprintu" (pre-selected)
  • Pokud další sprint neexistuje: jen [Vrátit do backlogu] a [Won't Do]

  Sprint Review jako součást procesu:
  • Sprint Review NENÍ samostatná entita — je součástí sprint close procesu
  • PM při uzavření vyhodnotí Sprint Goal: Achieved / Not Achieved
  • Sprint metrics se uzamknou: committed, completed, carry-over, velocity
  • Carry-over úkoly: započítají se do velocity sprintu, kde byly DOKONČENY (ne committed)

  Time logy: zachovány na úkolech (vázány na úkol, ne sprint)
  Burndown: ukončen, zachován v historii
  Retrospektiva: volitelná (PM rozhodne, doporučená)
```

---

### On-call rotace pro 24/7 SLA

```
On-call schedule per service desk:

  Konfigurace (admin per service desk):
  • On-call zapnuto/vypnuto per service desk
  • On-call schedule: týdenní rotace (konfigurovatelné)
  • On-call osoby: výběr z agentů service desku (min 2 pro rotaci)
  • Pokrytí: mimo business hours (automaticky dle business hours konfigurace)

  Routing mimo business hours:
  • Critical incident mimo business hours → auto-přiřazení on-call agentovi
  • High incident mimo business hours → dle konfigurace (on-call nebo čeká na business hours)
  • Medium/Low mimo business hours → čeká na business hours

  Notifikace on-call agenta:
  • Kanály: email + push notifikace (Slack/Teams/Mattermost API)
  • Eskalace: pokud on-call agent nereaguje do X minut (admin, default 15min)
    → notifikace záložnímu on-call agentovi
  • Pokud ani záložník nereaguje → eskalace na L3 (Team Lead/Management)

  Kalendář:
  • On-call schedule viditelný v admin panelu
  • Integrace s Google Calendar: on-call směny jako Calendar events
  • Výměna směn: agent může požádat o swap (schvaluje team lead)

  Reporting:
  • On-call metriky: počet incidentů mimo business hours, response time, eskalace
  • Per agent: počet on-call směn, incidentů za směnu
```

---

### Service Request — stav Rejected

```
Rozšířený Service Request workflow:

  Submitted → Approval (pokud vyžadován) → Fulfillment → Closed
                    ↓
                Rejected

  Stav Rejected:
  • Přechod: z Approval → Rejected (schvalovatel zamítne)
  • Povinné pole: důvod zamítnutí (textové pole)
  • Notifikace reporterovi: "Váš požadavek byl zamítnut: [důvod]"
  • Reporter může: podat nový request (s úpravami) nebo eskalovat

  Odlišení od Closed:
  • Closed = request úspěšně splněn (Fulfilled)
  • Rejected = request zamítnut při schvalování
  • Cancelled = request zrušen reporterem nebo agentem (před splněním)

  CSAT:
  • Fulfilled (Closed): CSAT dotazník odeslán (default 2h po Closed)
  • Rejected: CSAT dotazník NEODESLÁN (request nebyl splněn)
  • Cancelled: CSAT dotazník NEODESLÁN

  Reporting:
  • Metriky: fulfillment rate (Closed / (Closed + Rejected + Cancelled))
  • Rejection rate per kategorie, per schvalovatel
  • SLA: Rejected request = SLA STOPPED v momentě zamítnutí (ne breach)
```

---

### Entity override — bez ceiling (potvrzení)

```
Pravidlo: ENTITY OVERRIDE BEZ CEILING (beze změny)

  Potvrzení stávajícího designu:
  • Entity override PŘEPISUJE systémovou roli (může rozšířit i omezit)
  • Neexistuje ceiling (strop) per systémovou roli
  • Reader MŮŽE být povýšen na Full přístup na konkrétní entitě
  • Admin je plně odpovědný za správnost overridů

  Ochranná opatření (stávající):
  • PHI override: PHI označení VŽDY přebíjí vše (i entity override)
  • Guest + PHI: hard block, admin NEMŮŽE override
  • Audit log: každý entity override zaznamenaný (kdo, komu, jaký přístup)

  Doplněná ochranná opatření:
  • Admin dashboard: přehled všech entity overridů (filtr: per role, per entita)
  • Warning při přidělení Full přístupu uživateli s rolí Reader/Guest:
    "Přidělujete Full přístup uživateli s rolí Reader. Pokračovat?" (potvrzovací dialog)
  • Pravidelný review: admin dostane kvartální reminder k revizi overridů
    (seznam overridů, které rozšiřují přístup nad rámec systémové role)
```

---

### PHI auto-detekce — upřesnění rozsahu

```
Pravidlo: BEZ AUTO-DETEKCE VE VOLNÉM TEXTU

  Oprava rozporu (sekce PII masking vs. Vícejazyčnost):

  Auto-detekce (regex vzory CZ/SK/EN) se aplikuje POUZE na:
  • Admin-označená sensitive pole (custom fields, systémová pole)
  • PHI pole (automaticky sensitive)
  • Typy detekce: rodná čísla, čísla karet, telefonní čísla, email adresy

  BEZ auto-detekce na:
  • Komentáře (veřejné i private notes)
  • Popisy úkolů, incidentů, KB stránek
  • Jakýkoli volný text (rich text editor obsah)

  Důvod: prevence false positives ve volném textu. Číslo v popisu úkolu
  může být ID objednávky, číslo verze, telefonní číslo v kontextu návodu.
  Blanket auto-detekce by generovala desítky falešných varování denně.

  Odpovědnost: autor obsahu je odpovědný za neuvádění PII/PHI do volného textu.
  PHI data patří do označených PHI polí, ne do komentářů.

  Sekce Vícejazyčnost se aktualizuje:
  • PŮVODNĚ: "PII/PHI auto-detekce: regex vzory pro CZ, SK i EN formáty"
  • NOVĚ: "PII/PHI auto-detekce: regex vzory pro CZ, SK i EN formáty —
    POUZE na admin-označených sensitive polích (ne na volném textu)"
```

---

### Webhook retry policy — oprava

```
Pravidlo: 5 POKUSŮ (oprava checklistu)

  Potvrzení detailní sekce (5 pokusů s exponenciálním backoff):
  1. Okamžitě
  2. Po 1 minutě
  3. Po 5 minutách
  4. Po 1 hodině
  5. Po 24 hodinách

  Timeout per request: 10s
  Očekávaná odpověď: HTTP 2xx = success
  Po selhání všech 5 pokusů: webhook auto-disabled + admin notifikace
  Podpis: HMAC-SHA256 (X-Nexus-Signature)

  OPRAVA checklistu #102:
  • PŮVODNĚ: "3 pokusy s backoff, auto-disable, HMAC podpis, log"
  • NOVĚ: "5 pokusů s exponenciálním backoff, auto-disable, HMAC podpis, log"
```

---

### Aktualizovaný finální checklist (v6 — 139 oblastí)

| # | Oblast | Stav | Detaily |
|---|--------|------|---------|
| 130 | SLA při změně priority | ✅ | Původní SLA zůstává, změna priority ovlivní jen routing/eskalace |
| 131 | First Response definice | ✅ | Veřejný komentář NEBO přiřazení agentovi (cokoliv dříve) |
| 132 | Parallel approval rejection | ✅ | Jeden Reject = veto, okamžité zastavení hlasování |
| 133 | OKR dva pohledy | ✅ | Auto-agregace + manuální scoring paralelně, manuální pro reporting |
| 134 | Sprint close flow | ✅ | PM rozhodne per úkol (backlog / další sprint / Won't Do) |
| 135 | On-call rotace | ✅ | Schedule per desk, auto-routing mimo business hours, eskalace |
| 136 | Service Request Rejected | ✅ | Nový stav Rejected s povinným důvodem, bez CSAT |
| 137 | Entity override bez ceiling | ✅ | Beze změny + warning dialog + kvartální review overridů |
| 138 | PHI auto-detekce scope | ✅ | Pouze na sensitive polích, BEZ auto-detekce ve volném textu |
| 139 | Webhook retry (oprava) | ✅ | 5 pokusů (oprava checklistu #102 z 3 na 5) |
