# PHC Nexus Design System

Status: Draft v0.1
Date: 2026-03-24
Owners: Product/Domain Owner, Frontend Lead, Tech Lead

## Purpose

Tento dokument definuje první verzi design systému pro PHC Nexus.

Slouží jako společný základ pro:

- vizuální směr produktu
- návrh obrazovek a komponent
- frontend implementaci v `Inertia + React + Tailwind`
- konzistentní práci s workflow, tabulkami, approvals, auditem a dokumenty

## Design Direction

Výchozí inspirace:

- [phc-governance-hub.html](C:/Users/janme/Downloads/phc-governance-hub.html)

Co z reference přebíráme:

- klidný enterprise charakter
- silnou informační hierarchii
- datově husté, ale čitelné rozhraní
- bílá surface + světle šedé canvas pozadí
- teplý oranžový akcent
- kompaktní metadata, badge, tabulky, expand/collapse vzory

Co nepřebíráme doslova:

- Confluence branding
- Atlassian-specific navigační vzory jako produktovou identitu
- emoji jako systém ikon
- mechanické kopírování layoutu bez ohledu na doménu PHC Nexus

## Brand Character

PHC Nexus má působit:

- důvěryhodně
- organizovaně
- věcně
- systematicky
- profesionálně, ne sterilně

Produkt nemá vypadat jako marketing microsite ani jako generický admin boilerplate.

## Design Principles

1. Content-first
   UI musí sloužit workflow, datům a rozhodování, ne dekoraci.

2. Calm density
   Rozhraní může být informačně bohaté, ale nesmí být vizuálně hlučné.

3. One accent, many neutrals
   Oranžová je akcent a navigační signál, ne výplň celé aplikace.

4. Structure through spacing and borders
   Hierarchii mají nést hlavně spacing, typography a border system.

5. States must be obvious
   Stav entity, approvalu, draftu nebo warningu musí být čitelný na první pohled.

6. Operational clarity over novelty
   Workflow, audit a governance plochy mají být přesné a stabilní.

## Foundations

### Color Tokens

```css
:root {
  --color-brand-primary: #f5a623;
  --color-brand-primary-hover: #e09000;
  --color-brand-primary-soft: #fff8eb;
  --color-brand-primary-muted: #ffd080;

  --color-text-strong: #172b4d;
  --color-text-default: #42526e;
  --color-text-muted: #6b778c;
  --color-text-subtle: #97a0af;
  --color-text-on-brand: #ffffff;

  --color-surface-canvas: #f4f5f7;
  --color-surface-panel: #ffffff;
  --color-surface-panel-subtle: #fafbfc;
  --color-surface-panel-muted: #f7f8fa;

  --color-border-subtle: #ebecf0;
  --color-border-default: #dfe1e6;
  --color-border-strong: #c1c7d0;

  --color-status-success-bg: #e3fcef;
  --color-status-success-fg: #006644;
  --color-status-warning-bg: #fff0b3;
  --color-status-warning-fg: #974f0c;
  --color-status-danger-bg: #ffebe6;
  --color-status-danger-fg: #bf2600;
  --color-status-info-bg: #deebff;
  --color-status-info-fg: #0747a6;
  --color-status-neutral-bg: #dfe1e6;
  --color-status-neutral-fg: #42526e;
  --color-status-review-bg: #eae6ff;
  --color-status-review-fg: #5243aa;
}
```

### Semantic Usage

- `brand-primary`: selected navigation, primary CTA, key metrics, section accent
- `brand-primary-soft`: selected row, active nav background, soft emphasis
- `text-strong`: page titles, key labels, entity names
- `text-default`: body text, table content
- `text-muted`: helper text, metadata, empty hints
- `surface-canvas`: app background
- `surface-panel`: cards, tables, sidebars, drawers
- `border-default`: panel separation, table lines, inputs

### Typography

První verze používá:

- `Inter`

Fallback:

- `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`

Typografická stupnice (rem, base 16px):

- `xs`: 0.6875rem (11px)
- `sm`: 0.75rem (12px)
- `base`: 0.875rem (14px)
- `md`: 1rem (16px)
- `lg`: 1.125rem (18px)
- `xl`: 1.375rem (22px)
- `2xl`: 1.75rem (28px)

Pravidla:

- body text default `0.875rem` (14px)
- metadata a micro-labels `0.625–0.75rem` (10–12px)
- page title `1.75rem` (28px)
- section title `1.125rem` (18px)
- table headers uppercase only tam, kde pomáhají scanování

### Spacing

```text
space-1  = 0.25rem   (4px)
space-2  = 0.5rem    (8px)
space-3  = 0.75rem   (12px)
space-4  = 1rem      (16px)
space-5  = 1.25rem   (20px)
space-6  = 1.5rem    (24px)
space-8  = 2rem      (32px)
space-10 = 2.5rem    (40px)
space-12 = 3rem      (48px)
```

### Radius

```text
radius-sm = 0.25rem  (4px)
radius-md = 0.5rem   (8px)
radius-lg = 0.75rem  (12px)
radius-xl = 1rem     (16px)
```

### Shadow

```text
shadow-sm = 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.05)
shadow-md = 0 0.25rem 0.375rem rgba(0, 0, 0, 0.07)
shadow-lg = 0 0.5rem 1.5rem rgba(23, 43, 77, 0.12)
```

Použití:

- default cards bez výrazného stínu
- shadow jen na hover, dropdown, modal nebo raised panel

### Motion

Motion má být střídmý.

Pravidla:

- duration `120–180ms` pro běžný hover/expand
- easing `ease-out`
- entrance animace jen u page-level nebo dashboard reveal
- žádný dekorativní motion na každém prvku

## App Shell

### Layout Model

Výchozí produktový shell:

- top navigation
- levý sidebar
- hlavní content area

Pravidla:

- top bar je kompaktní a stabilní
- sidebar je primární orientační struktura
- page content sedí na bílém surface panelu nad šedým canvasem
- page header a content body používají konzistentní horizontální padding

### Navigation

Top nav:

- produktová identita
- globální search nebo quick access
- user/account menu

Sidebar:

- tree navigation
- více úrovní zanoření
- aktivní položka = `brand-primary-soft` background + `brand-primary` edge
- hover jen jemný, ne agresivní

## Core Components

### 0. Action Bar (Header Actions)

Použití:

- header entity stránek (detail projektu, epiku, úkolu)
- page-level akce (edit, export, delete)

Typy akcí:

| Typ | Rozměr | Obsah | Příklad |
|-----|--------|-------|---------|
| `ActionIconButton` | 36×36px (`p-2`) | Pouze ikona 16×16, tooltip na hover | Upravit, Export, Smazat |
| Textový action button | `h-9` (36px), auto-width | Ikona + text (max 2 slova) | Status update |

Pravidla:

- všechny akce v jednom baru musí mít shodnou výšku (36px / `h-9`)
- `ActionIconButton`: `border border-border-default p-2 rounded-md`, hover = `surface-hover`
- akce s popoverem/dropdown (Export): ikona = trigger, dropdown otevírá na klik
- destruktivní akce: `variant="danger"` (červený border + barva)
- pořadí v baru: primární akce vlevo → sekundární → destruktivní vpravo
- na mobilu: akce sbaleny do overflow menu (`ProjectOptionsMenu`)

Komponenta: `resources/js/Components/ActionIconButton.tsx`

### 1. Page Header

Obsah:

- breadcrumbs
- page title
- krátký popis
- page-level actions

Pravidla:

- title vždy v `text-strong`
- popis v `text-muted`
- actions zarovnat vpravo na širších viewports

### 2. Metadata Strip

Použití:

- detail projektu
- detail tasku
- dokument detail
- approval summary

Obsah:

- owner
- status
- version
- classification
- updated at
- source / scope / team

Vizuál:

- subtilní panel
- malé uppercase labely
- hodnoty v silnějším textu

### 3. Status Lozenge

Typy:

- neutral
- info
- success
- warning
- danger
- review

Pravidla:

- malé, kompaktní, dobře skenovatelné
- použít v tabulkách, kartách, metadata stripu
- barva vždy nese sémantiku, ne dekoraci

### 4. Section Header

Obsah:

- icon container
- section title
- optional badge
- optional description

Použití:

- velké bloky stránky
- dashboard sekce
- audit a governance přehledy

### 5. Data Table

Toto je jeden z hlavních komponentů produktu.

Pravidla:

- silný header row
- čitelné zebra rows jen jemně
- hover row zvýraznění soft brand backgroundem
- dense default layout
- sticky header, pokud to kontext vyžaduje
- bulk actions a filters patří nad tabulku, ne do náhodných toolbarů

Tabulka musí podporovat:

- sorting
- filtering
- status cell
- owner/member avatar cell
- actions cell
- empty state

### 6. Record Card

Použití:

- dashboard bloky
- summary cards
- collapsible domain sections
- team/process/document overview

Pravidla:

- card head
- optional stats row
- expandable body
- hover border upgrade, ne tvrdý shadow

### 7. Stat Tile

Použití:

- dashboard summary
- governance counts
- task/approval metrics

Pravidla:

- velké číslo
- malý label
- případně doplňkový semantic tone
- nepoužívat více než 4–6 tiles v jedné řadě

### 8. Info Banner

Použití:

- contextual notice
- rollout info
- compliance warning
- process reminder

Pravidla:

- levý accent border
- jemný tinted background
- stručný obsah
- max jedna primární akce

### 9. Empty State

Použití:

- žádná data
- budoucí modul
- filtrovaný výsledek bez shody

Pravidla:

- jednoduchý outline nebo dashed container
- krátký text
- jasná next step
- bez ilustrací, pokud nepřinášejí orientaci

### 10. Forms

Form styl:

- čistý, kompaktní, lineární
- labels nad fieldy
- helper text pod fieldem
- validation jasně, ale ne agresivně

Field pravidla:

- default white input on white panel only pokud je jasný border
- focus state přes border + ring v soft brand tónu
- destructive akce oddělit od primárního submitu

## Domain-Specific Patterns

### Workflow UI

Workflow entity musí vždy vizuálně ukázat:

- aktuální stav
- kdo je owner
- co blokuje další krok
- jaká akce je teď možná

Preferované vzory:

- sticky summary bar
- transition action panel
- timeline/event log pod detailem

### Approval UI

Approval screen má obsahovat:

- status summary
- required approvers
- decision history
- deadline/reminder info
- jasné approve/reject CTA

Approve/reject akce nesmí být ukryté v overflow menu.

### Audit UI

Audit views musí být:

- textově kompaktní
- timestamp-first
- filter-heavy
- bez zbytečné dekorace

Použít:

- monospace jen pro ID, verze, system values
- dense list/table pattern

### PHI UI

PHI/Unknown stavy musí mít zvláštní signalizaci:

- classification lozenge
- zvýšené restrikce u download/export akcí
- masked fields pro neoprávněné
- warning banner tam, kde je potřeba

PHI nesmí být signalizováno jen barvou; vždy i textovým štítkem.

## Iconography

První verze:

- používat jednotnou SVG icon set knihovnu
- outline styl
- vizuálně střídmá sada

Pravidla:

- emoji jen v exploraci nebo interních prototypech
- v produkčním UI výhradně standardní ikony

## Accessibility

Minimální pravidla:

- contrast min. WCAG AA
- focus state na všech interaktivních prvcích
- stav nesmí být vyjádřen jen barvou
- klikací plochy min. 36x36 px tam, kde je to možné
- tabulka musí být použitelná klávesnicí

## Responsive Behavior

Desktop-first, mobile-safe.

Pravidla:

- sidebar se na menších viewports může kolabovat
- metadata strip wrapuje
- stat tiles padají do více řad
- tabulky přechází na horizontal scroll nebo stacked summary pattern
- page padding se redukuje, nehroutí

## Tailwind Implementation Guidance

Preferovaný přístup:

- design tokens přes CSS custom properties
- Tailwind utilities nad těmito tokeny
- žádné ad hoc hex kódy v komponentách

Pravidlo:

- každá nová barva, radius nebo shadow musí nejdřív vzniknout jako token

## Initial Component Set For MVP

Pro Fázi 1 musí být připravené:

- `AppShell`
- `SidebarTree`
- `PageHeader`
- `MetadataStrip`
- `StatusLozenge`
- `Banner`
- `Button`
- `Input`
- `Select`
- `Textarea`
- `Table`
- `StatTile`
- `RecordCard`
- `EmptyState`
- `NotificationInbox`

## Anti-Patterns

Nepoužívat:

- výrazné gradienty jako primární surface styl
- velké glassmorphism efekty
- dashboard cards bez jasné informační role
- náhodné odstíny oranžové mimo tokeny
- příliš mnoho různých badge stylů
- shadow-heavy UI
- designové odchylky mezi workflow obrazovkami

## Next Steps

Po schválení této verze dává smysl vytvořit:

- `docs/design-tokens.md`
- `docs/ui-component-inventory.md`
- `docs/page-patterns.md`
- frontend token layer v aplikaci
- první sada základních React komponent podle MVP seznamu
