# PHC Nexus Page Patterns

Status: Draft v0.1
Date: 2026-03-24
Owners: Product/Domain Owner, Frontend Lead

## Purpose

Tento dokument převádí design systém do opakovatelných page-level vzorů pro MVP/Fázi 1.

Použití:

- návrh wireframů
- UI review
- implementace obrazovek
- konzistence mezi moduly

## Global Page Anatomy

Každá hlavní obrazovka by měla používat tento základ:

1. breadcrumbs
2. page title
3. krátký kontext nebo popis
4. primary page actions
5. metadata / filters / summary podle typu obrazovky
6. hlavní pracovní plocha
7. secondary panels jen pokud mají jasnou roli

## Pattern 1: Workspace Index

Použití:

- dashboard
- projects index
- approvals inbox
- notifications inbox

Struktura:

- page header
- summary stat tiles
- toolbar s filtry a search
- hlavní table nebo board
- optional secondary widgets pod hlavní plochou

Pravidla:

- pouze jeden dominantní primary content block
- widgety nesmí přebít hlavní pracovní plochu
- pokud stránka řeší operativu, default view je table nebo board, ne přehled metrik

## Pattern 2: Entity List

Použití:

- seznam projektů
- seznam tasků
- seznam approval requestů

Struktura:

- page header
- filter bar
- bulk actions bar po výběru
- dense data table
- pagination nebo infinite list podle use-casu

Pravidla:

- filtry jsou nad tabulkou, ne v pravém panelu
- status, owner, priority a updated at jsou skenovatelné bez otevření detailu
- row click vede do detailu; row actions jsou sekundární

## Pattern 3: Board Workspace

Použití:

- task board
- approval board jen pokud bude skutečně potřeba

Struktura:

- page header
- board controls
- swimlane/status columns
- optional side drawer pro quick detail

Pravidla:

- board je workspace, ne dashboard
- sticky board controls
- card density musí být vysoká, ale čitelná
- detail entity se má otevírat bez ztráty kontextu boardu

## Pattern 4: Entity Detail

Použití:

- project detail
- task detail
- approval detail

Struktura:

- page header
- metadata strip
- primary summary panel
- main content split:
  - left/main column: content, comments, subtasks, activity
  - right/supporting column: state, owners, dates, approvals, links

Pravidla:

- detail musí ukazovat, co je to za entitu, v jakém je stavu a co s ní lze dělat
- nejdůležitější akce musí být nad foldem
- pravý panel je podpůrný, ne hlavní

## Pattern 5: Approval Detail

Použití:

- approval request
- regulated decision flow

Struktura:

- status summary
- target entity summary
- approver matrix
- decision timeline
- approve/reject action group
- audit snippet

Pravidla:

- approve/reject CTA jsou vždy viditelné, pokud je uživatel může použít
- kdo ještě chybí a co blokuje rozhodnutí musí být vidět bez scrollu
- timeout/reminder informace patří do summary části

## Pattern 6: Audit & Activity View

Použití:

- entity activity log
- system audit list

Struktura:

- compact header
- filters
- dense event list nebo table
- timestamp-first rows

Pravidla:

- žádné vizuálně těžké cards na každou auditní položku
- data mají být skenovatelná a filtrovatelná
- technické identifikátory v monospace jen tam, kde pomáhají

## Pattern 7: Document/Reference Page

Použití:

- runbook
- SOP
- governance document
- policy detail

Struktura:

- breadcrumbs
- title + status + version
- metadata strip
- info banner pokud je draft nebo review state
- obsah členěný na section headers
- optional side outline navigation

Pravidla:

- čitelnost má přednost před hustotou
- status a version musí být nahoře
- dokumentové stránky mohou být vzdušnější než operativní views

## Pattern 8: Form Page

Použití:

- create/edit project
- create/edit task
- submit approval request

Struktura:

- header s jasným účelem
- form po logických sekcích
- sticky action footer nebo stabilní submit area

Pravidla:

- ne víc než jedna primární akce
- povinná pole a classification musí být zřejmé
- validace inline
- destructive secondary akce držet mimo hlavní flow

## Pattern 9: PHI-Sensitive Detail

Použití:

- entity s `PHI` nebo `Unknown`

Struktura:

- standard entity detail pattern
- classification lozenge v horní summary
- warning banner
- masked nebo gated fields
- guarded download/export controls

Pravidla:

- PHI signalizace vždy kombinací barvy a textu
- download/export akce mají mít jasný guard state
- audit-sensitive operace musí být zřetelné

## Pattern 10: Empty / Not Yet Enabled

Použití:

- budoucí modul
- page bez dat
- feature gated area

Struktura:

- krátké vysvětlení
- next step nebo CTA
- bez dekorativního odpadu

Pravidla:

- prázdný stav nesmí působit jako chyba, pokud jde o očekávaný stav
- pokud je feature mimo MVP, copy to má říct jasně

## MVP Core Screens

Pro Fázi 1 doporučuji prioritně sjednotit tyto obrazovky:

1. Dashboard / My Work
2. Projects Index
3. Project Detail
4. Tasks Index
5. Task Board
6. Task Detail
7. Approvals Inbox
8. Approval Detail
9. Notifications Inbox
10. Create/Edit Task Form

## Screen-Specific Notes

### Dashboard / My Work

- jeden hlavní actionable list
- sekundární metriky nahoře
- approvals, overdue a assigned work na jedné stránce

### Projects Index

- default table
- filters na status, owner, team, updated at
- kanban/timeline až mimo MVP baseline

### Project Detail

- summary nahoře
- členství, metadata a progress v pravém panelu
- task list nebo related work jako hlavní obsah

### Task Detail

- status a next action nad foldem
- description, comments, attachments, activity v hlavní ose
- approvals viditelné jen pokud jsou relevantní

### Approvals Inbox

- dense actionable list
- default sorting podle urgency/deadline
- quick decision entry point pokud je to bezpečné

### Notifications Inbox

- chronological feed
- read/unread jasně rozlišeno
- nepůsobit jako chat; je to pracovní event stream

## Review Checklist

Každá nová stránka by měla projít těmito otázkami:

- Jaký je dominantní úkol uživatele na této stránce?
- Je nad foldem vidět stav, kontext a další možná akce?
- Je page pattern už existující, nebo se zbytečně vytváří nový?
- Odpovídá hustota dat typu obrazovky?
- Jsou PHI/export/download guardy tam, kde mají být?
- Nejsou sekundární widgety silnější než hlavní pracovní plocha?

## Next Step

Po schválení dokumentu dává smysl vytvořit:

- low-fidelity wireframes pro MVP core screens
- komponentové mapování obrazovek na React komponenty
- implementační backlog pro shell, table, detail a form patterns
