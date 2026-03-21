---
name: PHC Nexus - Business Logic Definition
description: Kompletní business logika platformy PHC Nexus — moduly, hierarchie, role, pravidla, integrace
type: project
---

## PHC Nexus — Business Logic

**Why:** Pears Health Care trpí fragmentací dat napříč Jira, Asana, Confluence. PHC Nexus je interní platforma, která je nahradí jedním unifikovaným systémem.
**How to apply:** Veškerý návrh architektury, datového modelu a UI musí respektovat tuto business logiku.

### Cílová skupina
- 50–200 uživatelů
- Více týmů a oddělení v rámci Pears Health Care group
- Vícejazyčné UI (CZ/EN/SK)

---

### Hierarchie práce (4 úrovně)
```
Iniciativa → Projekt → Úkol → Podúkol
```

---

### 5 hlavních modulů

#### 1. Goals, Portfolio & Initiatives

**Goals / OKR systém:**
- Kombinace OKR framework + hierarchický rozpad: Company → Division → Team
- Company OKR (roční) → Division OKR (Q/pololetí) → Team OKR (kvartální)
- Každý level: Objectives + Key Results
- Progress: hybrid — auto agregace z napojených projektů/úkolů + manuální update pro externí metriky
- Vazba dolů: Team OKR → Iniciativa → Projekt → Úkol

**Portfolia:**
- Portfolio = kolekce projektů napříč týmy
- Filtry: by tým, stav, priorita, deadline
- Views: tabulka, timeline, board
- Dashboard plně konfigurovatelný — uživatel si volí sloupce a widgety (health, timeline, budget, metriky...)

**Initiatives:**
- Strategické iniciativy s vazbou na OKR/KPI
- Impact scoring (business value vs. effort)
- Kaskáda: iniciativa → projekty → úkoly

#### 2. Project & Work Management
- Flexibilní metodiky per projekt (Scrum, Kanban, Waterfall)
- Konfigurovatelné workflow (stavy + přechody + podmínky)
- Sprinty, kanban boardy, milestones, timeline
- Time tracking vestavěný (logování času na úkolech)

**Role na úkolech (single person per role):**
- Systémové (vždy): Assignee (zodpovědný), Reporter (kdo založil), Viewer (sleduje, notifikace)
- Custom per typ úkolu: admin přidá role dle potřeby
  - Typ "Dev task": + Developer, + Code Reviewer
  - Typ "Design task": + Designer, + Design Reviewer

**Delivery / Code Review workflow:**
- Review jako workflow krok: developer dokončí → úkol se posune do "Code Review" → reviewer notifikován
- Approve → posun do Testing, Request Changes → zpět do In Development

**Workload management:**
- Kapacita vs. alokace — každý člen má definovanou kapacitu (h/týden), systém ukazuje alokováno vs. dostupné
- 3 úrovně pohledu: jedinec, tým, projekt
  - Osobní: můj workload tento týden
  - Tým: kdo má prostor, kdo je přetížený (heatmapa)
  - Projekt: kdo kolik dělá na daném projektu
- Alerty při přetížení (>100% kapacity)

#### 3. Service Management (klíčový od začátku)
- Multi-týmový service desk (IT, HR, Finance, Facilities...)
- Každý tým má vlastní katalog služeb
- Incidenty, requesty, SLA, eskalace

**Service Desk Portál:**
- Jednotný portál pro všechny service desky — uživatel vybere tým/kategorii, pak vyplní formulář
- Plně konfigurovatelný design per service desk: logo, barvy, banner, uvítací text, kategorie (pořadí, ikony), footer, custom CSS
- Drag & drop form builder: admin sestaví formuláře z komponent (text, select, checkbox, file upload, podmíněná pole, validace, required)
- Self-service pro koncové uživatele:
  - Vytvořit požadavek
  - Mé požadavky (stav, historie)
  - Knowledge Base články, FAQ, návody
  - Oznámení (plánované údržby, výpadky)
  - CSAT hodnocení vyřešených ticketů
  - Hledat v KB (LLM asistent)
- Komunikace: konverzace přímo na ticketu (komentáře agent ↔ uživatel), email notifikace, reply z emailu = nový komentář

#### 4. Knowledge Base
- Wiki-style stránky pro dlouhodobý obsah (dokumentace, procesy)
- Šablonové dokumenty pro opakující se formáty (zápisy z porad, RFC, postmortem, decision log)
- Obojí paralelně

#### 5. Reporting & Integrations
- Vestavěné dashboardy + REST API pro Power BI
- Konfigurovatelné reporty z building blocks (grafy, tabulky, texty)
- Export do PDF/PPTX
- LLM integrace (všechny 4 use cases)

---

### Propojení mezi moduly
- **Automatické vazby:** akční bod z porady → auto úkol, incident → auto projekt při eskalaci
- Systém aktivně navrhuje a vytváří vazby

---

### Autentizace a registrace
- **Autentizace:** Google SSO (primární) + lokální účty (email + heslo) pro externí spolupracovníky
- **Registrace:** pouze invite — admin/PM pozve emailem, přiřadí roli + tým → uživatel klikne odkaz → Google SSO → onboarding workflow se spustí
- Žádná otevřená registrace

### Role a přístupová práva
- **Role:** Executive, Project/Product Manager, Team Member, Service Desk Agent, Reader
- **Práva:** Role + modul + entita (granulární přístup na úrovni konkrétních projektů, dokumentů, iniciativ)

---

### Org struktura
- Týmy + oddělení + **Tribes** (kombinace týmů a rolí napříč oddělením)
- Projekty a service desky vázány na týmy

---

### Custom fields
- Plně konfigurovatelná custom pole na jakémkoli typu entity
- Typy: text, číslo, datum, select, multi-select

---

### Automatizace (Rule Engine)
- Konfigurovatelná pravidla: trigger (událost/čas) + podmínky + akce
- Příklad: úkol 3 dny po deadline + stav != Done → nastav prioritu High, notifikuj PM, přidej label

---

### Audit trail
- Plný audit log — každá změna na každé entitě (kdo, co, kdy, stará/nová hodnota)
- Nepřepisovatelný log

---

### Views & zobrazení (napříč celým systémem)

**Základní views (dostupné na všech entitách):**
- Kanban board — sloupce dle stavu, drag & drop, WIP limity, swimlanes
- Timeline / Gantt — časová osa, dependencies, milestones, drag pro změnu dat
- Tabulka / List — řádkový pohled, sortování, filtrování, inline edit, Excel-like
- Kalendář — měsíční/týdenní pohled s úkoly a deadliny

**Speciální views:**
- Workload heatmapa — vizuální přehled vytížení per tým/člověk
- Dashboard / summary — konfigurovatelné widgety (grafy, čísla, průběhy)
- Dependency graph — vizuální graf závislostí, kritická cesta, blockery
- Activity feed — chronologický proud aktivit (per entita nebo globální)

**Konfigurace views:**
- Plně konfigurovatelné — uživatel upraví sloupce, filtry, řazení, seskupení, barevné kódování
- Uložení jako vlastní pohled (osobní nebo sdílený s týmem)
- Příklady: "Mé úkoly tento sprint", "Backend tým — Kanban", "Executive portfolio"

---

### File management
- Přílohy na entitách (úkoly, projekty, incidenty, KB stránky) — drag & drop, preview
- Verzování souborů: každý upload = nová verze, historie zachována
- Konfigurovatelné limity adminem: max velikost per soubor, povolené typy (whitelist), storage quota per projekt/tým

### Google Workspace integrace (plná)
- **Google Calendar:** porada v Nexus → auto událost v Calendar, deadliny projektů viditelné v Calendar
- **Google Drive:** připojit Drive soubor k úkolu, auto-folder per projekt v Drive
- **Gmail:** notifikace + reply-to-comment přímo z emailu
- **Google Docs:** embed Google Doc do KB stránky, vytvořit Doc přímo z úkolu

### Notifikace
- In-app + email + API pro Slack/Teams/Mattermost
- Konfigurovatelné per uživatel

---

### LLM integrace (OpenAI / Anthropic / Gemini) — 8 use cases
1. Zápisy z porad — sumarizace, extrakce akčních bodů
2. Status reporty — generování z dat v systému
3. Knowledge asistent — Q&A nad interní dokumentací
4. Prioritizace — analýza a doporučení na základě dat
5. Sprint planning AI — návrh obsahu sprintu z velocity/kapacity/backlogu
6. Auto-decomposition — z epiku/story generuje podúkoly s odhadem
7. Semantic search — vektorizovaný fulltext přes všechny entity
8. Predictive delivery date — ML odhad dokončení projektu

---

### Globální vyhledávání
- Full-text search napříč všemi moduly + filtry (modul, stav, tým, datum, autor)
- Výsledky seskupené dle typu entity

### Komentáře & diskuze
- Na všech entitách: komentáře s vláknovými odpověďmi, @mentions (uživatelů i týmů → notifikace), emoji reactions

### Tagy & labely
- Globální systém tagů: předdefinované (admin) + uživatelské
- Barevné kódování, filtrování a seskupování napříč moduly

### Šablony projektů
- Plné šablony: metodika, workflow, předdefinované úkoly, milestones, role
- Klik → nový projekt ze šablony

### Detekce duplikátů
- Auto-detekce podobných entit při vytváření (zejména incidenty)
- Agent může mergovat duplikáty

### Archivace & retence
- Konfigurovatelné retence per typ entity (admin)
- Archivovaná data: read-only, hledatelná, možnost obnovit
- Audit log: nikdy nemazat

### Migrace dat
- Plná migrace z Jira / Asana / Confluence (projekty, úkoly, KB, incidenty + historie + přílohy)

### REST API
- API-first: každá funkce dostupná přes API
- Autentizace: API key / OAuth2, rate limiting, webhooky
- Dokumentace: OpenAPI / Swagger

### Backup & DR
- Automatické zálohy (denní/hodinové), point-in-time recovery, dokumentovaný DR plán

### Mobilní přístup
- Pouze desktop web (mobilní přístup není priorita)
- Offline režim: ne (interní nástroj, vždy online)

### Osobní dashboard / Home screen
- Každý uživatel má osobní home: mé úkoly, projekty, approvals, overdue, dnešní deadliny, notifikace, workload, oblíbené, nedávné

### Dependencies (závislosti mezi úkoly)
- 4 typy: Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish
- Blokace, auto-posun dat, kritická cesta, vizualizace v Gantt

### Budget tracking
- Plný budget per projekt/iniciativa: plán, čerpání, forecast
- Rozpad: interní práce (hodiny × sazba z time trackingu) + externí (manuální)
- Alert při >90% čerpání

### Recurring tasks
- Opakující se úkoly: denně, týdně, měsíčně, custom
- Auto-vytvoření nové instance

### Bulk operace
- Hromadné akce: změnit stav, přiřadit, priorita, tag, přesun, smazání

### CSV/Excel import & export
- Export jakéhokoli list/tabulka view do CSV/XLSX
- Import z CSV s mapováním sloupců

### Univerzální export vrstva
- **Formáty:** PDF, PPTX, DOCX, HTML, CSV/XLSX, PNG (vizuální views)
- **Exportovatelné entity:**
  - Úkol / incident / change → PDF
  - Projekt summary → PDF, PPTX
  - Portfolio overview → PDF, PPTX
  - KB stránka → PDF, HTML, DOCX
  - Zápis z porady → PDF, DOCX
  - OKR report → PDF, PPTX
  - Sprint report → PDF
  - Jakýkoli list/tabulka → CSV, XLSX
  - Dashboard → PDF, PNG
  - Gantt / timeline → PDF, PNG
  - Audit log → CSV
- **Export šablony + branding:** admin definuje šablony (logo, barvy, záhlaví/zápatí, font). Více šablon (interní, externí, management)

### Risk management
- Risk register per projekt: identifikace, pravděpodobnost, dopad, mitigační plán, vlastník
- Risk score = probability × impact

### Favorites & recent
- Hvězdička na jakoukoli entitu = oblíbené
- Automatický seznam nedávno otevřených
- Rychlý přístup z navigace a home

### Watchers / follow
- Kdokoli může kliknout Watch na jakékoli entitě → notifikace o změnách
- Nezávislé na přiřazení/roli

### GDPR / data governance
- Export osobních dat uživatele
- Anonymizace při smazání účtu
- Data processing log

### Prioritní systém
- Konfigurovatelné prioritní úrovně per typ entity (admin)
- Default: Critical, High, Medium, Low
- Barevné kódování, vazba na SLA timery

### Notifikační předvolby
- Granulární nastavení per uživatel: která událost × který kanál (in-app / email / Slack)
- Denní a týdenní email digest souhrn

### Asset register (základní CMDB)
- Evidence IT aktiv (servery, PC, licence, SW)
- Vazba na incidenty a change management
- Bez plného CMDB — full CMDB je fáze 2

### Deep links & embedding
- Každá entita a uložený view má unikátní URL
- Kopírovatelné odkazy
- Embed live widgety do KB stránek (task karta, dashboard graf)

### Email inbound
- Dedikovaná emailová adresa per service desk → auto ticket
- Forward email → nový úkol (subject = název, body = popis, přílohy)
- Reply na notifikaci → komentář na entitě

### Auto-routing (service desk)
- Routing pravidla: kategorie + priorita + klíčová slova → auto přiřazení agentovi/týmu
- Load balancing: round-robin, least-busy agent
- Business hours aware

### Business hours
- Konfigurovatelná pracovní doba per service desk (např. Po–Pá 8–17)
- SLA se počítá jen v pracovních hodinách
- Kalendář svátků (ČR)

### Komponenty
- Komponenta = logická část systému/produktu (např. Payment Module, Auth, Checkout)
- Každá komponenta má: vlastník (tým), lead (osoba), popis
- Úkoly, projekty i incidenty se tagují komponentou
- Filtrování a reporting per komponenta: "Vše co se týká Payment Module"
- **ITSM integrace:** incident označený komponentou → auto-routing na vlastníka + notifikace leada
- **Impact analýza:** které komponenty jsou dotčeny incidentem, vazby mezi komponentami

### Šablony entit (nejen projekty)
- Šablony pro: úkoly, incidenty, KB stránky, meeting notes, RFC
- Předdefinovaná pole, popisy, checklisty

### Sprint & velocity metriky
- Burndown / burnup charty per sprint
- Velocity tracking (SP/sprint historicky)
- Sprint analytics: committed vs. completed, carry-over

### Multi-sprint plánování
- Vytvořit X sprintů dopředu, přiřazovat úkoly do budoucích sprintů
- Kapacita per sprint (SP), vizualizace naplnění
- Drag & drop úkoly mezi sprinty
- Auto-warning při přetížení sprintu

### Carry-over tracking
- Systém sleduje v kolika sprintech úkol byl (carry-over count)
- Sprint report: committed vs. completed vs. carry-over (SP i počet úkolů)
- Carry-over rate metrika
- Alert pro opakovaně přenášené úkoly (např. 3+ sprinty → eskalace)

### Planning Poker (vestavěný)
- Real-time estimation session: PM vybere úkoly, tým hlasuje (skryté karty)
- Reveal, diskuze, finální odhad se automaticky uloží na úkol
- Sekvence: Fibonacci (1,2,3,5,8,13,21) nebo T-shirt (XS,S,M,L,XL) — konfigurovatelné

### Checklisty na úkolech
- Lehké todo položky uvnitř úkolu (odlišné od podúkolů)
- Progress bar dle zaškrtnutých, možnost přiřadit assignee per item

### Entity linking (typované vazby)
- Kromě dependencies i obecné vazby: relates to, duplicates, cloned from, caused by
- Vazby napříč moduly: Úkol ↔ Incident ↔ Problem ↔ Change ↔ KB

### Klonování entit
- Klonovat jakoukoliv entitu (úkol, projekt, incident, KB stránku)
- Volba co kopírovat (název, popis, custom fields, checklist, přílohy...)
- Auto-vazba "cloned from" na originál

### Rich text editor (block-based)
- Block-based WYSIWYG editor (jako Notion/Confluence): nadpisy, tabulky, code blocky, obrázky inline, callouts, embed live widgety
- Použití: úkoly, KB stránky, zápisy, incidenty, komentáře

### Knowledge Base spaces
- KB organizována do Spaces (Engineering, HR, Product, Meeting Notes...)
- Každý space: vlastní stránkový strom, práva, admin, sidebar navigace

### Kanban metriky
- Lead time, cycle time, throughput
- Cumulative flow diagram (CFD)
- WIP age (jak dlouho položky sedí v sloupci)

### Verze & environment
- Projekt má definované verze (v2.3, v2.4...) a environmenty (Dev, Staging, Prod)
- Na úkolu/bugu: Found in version, Fix version, Environment
- Release notes auto-generovány z fix version

### Koš / Trash (soft delete)
- Smazané entity jdou do koše, obnovitelné po X dní (konfigurovatelné adminem: 30/60/90)
- Po uplynutí trvalé smazání

### Sprint goal & Sprint review
- Každý sprint má textový cíl (sprint goal)
- Sprint review = demo session pro stakeholdery s feedbackem, vazba na Meeting Notes workflow

### Uživatelský profil & osobní nastavení
- Avatar/foto, jméno, pozice, tým, časová zóna
- Jazyk UI, téma (light/dark mode), notifikační předvolby
- Klávesové zkratky, kapacita (h/týden)

### Keyboard shortcuts
- Globální klávesové zkratky: rychlé vytvoření, hledání, navigace, změna stavu
- Konfigurovatelné

### Command palette (Ctrl+K)
- Fuzzy search + akce + navigace z klávesnice
- Hledat entity, navigovat do modulů, vytvářet, měnit stav — vše z jednoho místa

### Definition of Done (DoD)
- Konfigurovatelná kritéria per projekt/tým (code review, testy, dokumentace, QA sign-off...)
- Systém kontroluje splnění před přechodem do Done, warning pokud nesplněno

### Backlog refinement session
- Speciální typ schůzky: výběr úkolů z backu, diskuze, odhad (poker), přiřazení do sprintu
- Vazba na meeting notes workflow

### KB page restrictions
- Autor může omezit přístup ke konkrétní stránce: kdo smí číst / editovat
- Nezávisle na space právech

### Project health status
- Manuální: PM nastaví On Track / At Risk / Off Track + důvod
- Auto-indikátory: timeline, budget, velocity, overdue úkoly
- Historie změn health statusu

### Issue keys / projektový prefix
- Každý projekt má krátký kód (BOOK, PAY, HR). Úkoly: BOOK-123, PAY-45
- Incidenty: INC-301, Changes: CHG-42, Problems: PRB-15
- Unikátní, hledatelné, čitelné

### Auto-linking v textu
- ID entity (BOOK-123, INC-301) v komentáři/popisu se automaticky stává klikatelným odkazem s tooltip preview

### Notification schemes
- Admin definuje notification scheme per typ projektu (kdo co dostane)
- Mapování na typy projektů, uživatel může override

### Permission schemes
- Admin definuje permission scheme (sadu práv), namapuje na typ projektu
- Nový projekt automaticky zdědí práva ze schématu

### Board konfigurace
- Mapování stavů na sloupce boardu
- Quick filtry na boardu (Jen mé, Blockers, Priorita High+)
- Swimlanes dle: assignee / priorita / typ / komponenta

### Story map view
- Vizuální story mapping: epics/features na ose X, uživatelské kroky na ose Y
- Pro product discovery a plánování release scope

### Actionable inbox
- Centrální inbox: approvals, @mentions, přiřazení, review requesty
- Možnost reagovat přímo z inboxu (approve, reply, změnit stav)
- Filtry: Vše / Approvals / Mentions / Assigned

### Print view
- Optimalizovaný tisk přímo z prohlížeče pro úkoly, KB stránky, reporty

### Batch email digest
- Seskupení notifikací za posledních X minut do 1 emailu (místo 10 zvláštních)

### Konfigurovatelná sidebar navigace
- Uživatel si přizpůsobí sidebar: pořadí modulů, pinned projekty, skrytí nepoužívaných sekcí

### Activity log per entita
- Každá entita má záložku 'Activity' s chronologickým přehledem všech změn, komentářů, stavových změn

### Due date reminders
- Auto připomínka X dní před deadline (konfigurovatelné: 7d, 3d, 1d, v den)
- Per uživatel nebo per projekt

### Cost estimation / nacenění
- Odhadované hodiny per úkol → agregace na projekt
- Sazby per role/člověk (konfigurovatelné adminem)
- Automatický výpočet: hodiny × sazba = náklady
- Porovnání odhad vs. skutečnost (z time trackingu)
- Variance report: pod/nad budget

---

### Non-IT / Business týmy

**Modulární viditelnost per tým/typ projektu:**
- Admin nastaví které funkce/moduly jsou viditelné per tým nebo typ projektu
- IT tým: sprinty, code review, verze, poker, velocity, components
- Non-IT tým (marketing, HR, finance...): projekty s milestones, úkoly + deadliny + checklisty, kanban/timeline/tabulka, schvalovací workflow — BEZ dev-specifických funkcí

**Non-IT typy projektů:**
- Marketing: kampaně (Brief → Creative → Review → Approval → Launch → Analysis)
- HR: nábor (Screening → Interview → Offer → Onboarding)
- Events: organizace konferencí/akcí s milestones
- Finance: budget planning se schvalovacím řetězcem
- Obecný business projekt s úkoly a deadliny

**Přednastavené non-IT šablony:**
- Marketing Campaign, Recruitment Pipeline, Event Planning, Budget Review, General Business
- Každá s workflow, předdefinovanými úkoly, milestones, views

**Guided onboarding + clean UI:**
- Průvodce při prvním přihlášení (tým, projekty, úkoly, tipy)
- Čisté UI: základní funkce viditelné, pokročilé skryté pod "Více"
- Kontextuové nápovědy

---

### Workflows napříč ekosystémem

#### Iniciativa workflow
- Konfigurovatelný per typ iniciativy (strategická má víc gates než interní zlepšovák)
- Víceúrovňové approvals: konfigurovatelné schvalovací řetězce (PM → Head of → Executive)
  - Parallel vs. sequential approvals
  - Timeout s auto-eskalací po X dnech
  - Delegace při nepřítomnosti

#### Projekt workflow
- Konfigurovatelný per metodiku:
  - Scrum: Backlog → Sprint Planning → Active Sprint → Review → Retro → opakuj
  - Kanban: Continuous flow, WIP limity, no gates
  - Waterfall: Initiation → Planning → Execution → Testing → Closing
- Každý s vlastními přechody a podmínkami

#### Incident / Service Request workflow (ITIL-inspired)
- Submitted → Categorized + Priority → Assigned → In Progress → Pending → Resolved → Closed
- SLA: response time + resolution time
- Auto-eskalace po SLA breach

#### Change Management workflow (formální CAB)
- RFC Submitted → Impact Assessment (risk, scope, rollback) → CAB Review → Approved/Rejected/Deferred → Scheduled → Implementing → Post-Implementation Review → Closed
- Typy: Standard (pre-approved), Normal, Emergency

#### Knowledge Base dokument workflow
- Draft → In Review → Changes Requested / Approved → Published → Archived
- Verzování: každá editace = nová verze, porovnání verzí (diff)

#### Meeting Notes workflow (plný cyklus)
1. Před poradou: agenda vytvořena, účastníci pozváni
2. Během/po poradě: zápis + LLM sumarizace, akční body označeny
3. Po publikování: akční bod → auto Úkol (assignee, deadline), vazba úkol ↔ zápis
4. Následující porada: auto-přehled stavu akčních bodů z minula

#### OKR cyklus workflow
1. Planning (začátek Q): Company OKR → Division → Team, approval Head of Dept
2. Execution (průběh Q): týdenní/měsíční check-in, auto-reminder, confidence level (On Track / At Risk / Off Track)
3. Closing (konec Q): scoring 0–1.0 per KR, retrospektiva, lessons learned → Knowledge Base

#### Release Management workflow
- Release = kolekce dokončených úkolů/features
- Plánování release, release notes, Go/No-Go checklist (QA sign-off, security review, stakeholder approval)
- Vazba: release ↔ projekty ↔ úkoly

#### Onboarding workflow
- Trigger: nový člen přidán do týmu
- Auto: přiřazení přístupových práv, generování onboarding úkolů, přiřazení do projektů, sdílení KB dokumentů

#### Retrospektiva workflow
- **Založení:** ze sprintu → tlačítko "Založit retro" → vytvoří Confluence-like stránku s přednstavenými sekcemi (Co fungovalo / Co zlepšit / Akční body)
- **Formát:** Confluence-like stránka s kolonkami, komentáře, hlasování (každý má X hlasů), emoji reactions
- **Fáze:**
  1. PM založí retro → tým notifikován
  2. Asynchronní sběr (2–3 dny před): každý přidá body (volitelně anonymně), komentáře a reakce
  3. Live session: review, seskupení podobných, hlasování, diskuze top položek, definice akčních bodů
  4. Po retru: auto-souhrn + akční body → auto Úkoly do dalšího sprintu
- **Sprint data:** automaticky přiložena velocity, carry-over, committed vs. completed
- **Projekt retro:** lessons learned → auto do Knowledge Base
- **Dashboard:** historie retro items + stav akčních bodů

#### Eskalace (průřezová)
- Automatická (rule engine): úkol 3d overdue → PM, 7d → Head of, SLA breach → L2, projekt Red 2 týdny → exec
- Manuální: tlačítko "Escalate" s výběrem důvodu a vyšší úrovně

#### Cross-module flow (Incident → Projekt)
1. Incident nahlášen → agent vyřeší workaround → uzavře
2. Označí jako "recurring" → auto Problem record
3. Root cause analýza → potřeba nového řešení
4. PM vytvoří Iniciativu/Projekt
5. Plné vazby: Incident ↔ Problem ↔ Projekt (traceabilita)

---

### Doplněno po hloubkové analýze (v2 — 2026-03-22)

#### Git integrace (základní linking)
- Commit/PR obsahující ID entity → auto-link, záložka "Code" na kartě úkolu
- GitHub, GitLab, Bitbucket — pouze linking, bez auto status change

#### Real-time simultánní editace KB
- Live co-authoring, presence indikátory (kurzory + avatary), CRDT

#### Incident vs. Service Request (oddělení)
- Dva samostatné typy s vlastním workflow a SLA
- Incident: přerušení služby; Service Request: standardní požadavek s approval

#### Inline text komentáře v KB
- Highlight → comment přímo v textu, resolve/unresolve

#### SLA vylepšení
- Pre-breach warning: 50/75/90% spotřeby → notifikace + eskalace
- Pause conditions: Pending = pause, konfigurovatelné per desk

#### Service desk vylepšení
- Canned responses / Macros: šablony s proměnnými + akce
- Private notes: interní poznámky jen pro agenty
- Agent collision detection: varování při souběžné práci
- Ticket merge / split
- Known Error Database (KEDB): workaround záznamy linkované na Problems
- Sentry integrace: alert → auto incident, deduplikace, auto-resolve

#### Agile vylepšení
- Definition of Ready (DoR): checklist před sprintem
- Cycle time / CFD metriky: lead time, cycle time, throughput, CFD, flow efficiency
- Baseline management (EVM): schedule/cost/scope baseline, CPI, SPI, EAC

#### KB vylepšení
- Page analytics: zobrazení, čtenáři, search analytics, content health
- Content expiry dates: datum platnosti, auto-review
- Backlinks panel: seznam odkazujících stránek/entit
- Synced / reusable content blocks: live propagace změn
- Diagramy nativně: Mermaid / PlantUML v editoru
- KB import z Confluence / Notion: import wizard

#### UX
- Quick peek / Side peek: detail entity v pravém panelu

#### Bezpečnost a compliance
- HIPAA / PHI handling: označení, omezený přístup, šifrování, audit
- PII masking: auto-detekce a maskování osobních údajů

#### Systémové
- Conflict resolution: CRDT pro KB, merge dialog pro entity
- Circular dependency detection: validace cyklických závislostí
- Projekt lifecycle: Draft → Active → On Hold → Completed → Archived
- Offboarding flow: re-assign, odebrání práv, anonymizace
- Podúkoly při zavření parentu: warning / auto-close / block
- Guest / external collaborator role: omezený přístup pro dodavatele/klienty

#### Role (aktualizace)
- **Role:** Executive, Project/Product Manager, Team Member, Service Desk Agent, Reader, **Guest**
