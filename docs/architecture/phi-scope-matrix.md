# PHI Scope Matrix

Status: Accepted for MVP baseline
Date: 2026-03-24
Owners: Product/Domain Owner, Tech Lead

## Purpose

Tento dokument převádí obecná PHI pravidla do konkrétní implementační matice pro MVP/Fázi 1.

Použití:

- návrh entit a polí
- authorization rules
- masking a rendering
- audit log
- export a download guard
- test matrix

## Global Rules

1. Primární enforcement je v aplikaci.
2. `PHI` a `Unknown` se v MVP chovají stejně přísně.
3. `Guest` uživatel nesmí mít přístup k PHI entitě.
4. PHI data jsou vyloučena z běžných exportů.
5. Přístup k PHI musí mít auditní stopu pro `read` i změny.
6. Volný text se v MVP automaticky neklasifikuje; odpovědnost nese autor a explicitní
   klasifikace entity/pole.
7. RLS a pgAudit jsou druhá vrstva jen pro vybrané PHI tabulky, ne náhrada aplikačních
   policy checks.

## Classification Values

- `PHI`
- `Non-PHI`
- `Unknown`

Interpretace:

- `PHI`: restricted access, audit read, export blocked, LLM blocked
- `Unknown`: stejné chování jako `PHI`, dokud není překlasifikováno
- `Non-PHI`: standardní access pravidla daná rolí a členstvím

## Entity Matrix

| Entity | MVP | Classification rule | Access baseline | Audit requirement | Export rule |
|---|---|---|---|---|---|
| Project | Yes | Může nést `Contains PHI` flag; povinná klasifikace jen tam, kde to business typ vyžaduje | Role + membership; PHI override zpřísní přístup | create/update/read when PHI | standard export only if non-PHI |
| Epic | Yes | Dědí kontext projektu; může být explicitně označen PHI/Unknown | Role + membership + PHI rules | create/update/read when PHI | blocked in standard export if PHI/Unknown |
| Task | Yes | Na regulovaných typech povinné `Data Classification` | Role + membership + explicit entity access if PHI | create/update/read when PHI | blocked in standard export if PHI/Unknown |
| Approval Request | Yes | Dědí klasifikaci cílové entity | Jen oprávnění schvalovatelé a žadatel dle policy | create/vote/read when tied to PHI | blocked in standard export if PHI/Unknown |
| Comment | Yes | Dědí klasifikaci parent entity | Stejné jako parent entity | create/update/read when parent is PHI | blocked in standard export if parent is PHI/Unknown |
| Attachment | Yes | Dědí klasifikaci parent entity | Download jen pokud user smí parent a attachment | upload/download/delete when parent is PHI | blocked in standard export if parent is PHI/Unknown |
| Notification | Yes | Nese jen minimum dat; nesmí obsahovat PHI payload | Recipient-only | delivery log for critical events | not part of standard business export by default |
| Audit Log | Yes | Může referencovat PHI access event, ale nesmí duplikovat PHI obsah | Restricted admin/compliance access | immutable | never part of standard export |
| Search Index | Optional after core | Indexace pouze s respektováním classification rules | Search result filtered by auth + PHI | access log on PHI result open | PHI excluded from broad export |

## Field Matrix

| Field category | Example | Sensitive | Masking | Encryption | Notes |
|---|---|---|---|---|---|
| Classification field | `data_classification` | No | No | No | Řídicí pole pro access rules |
| PHI structured value | patient identifier, diagnosis-like field | Yes | Yes | Yes where needed | vždy auditovat přístup |
| Standard metadata | title, status, due date | No by default | No | No | může být omezeno, pokud celá entita je PHI |
| Free text | description, comment body | Conditionally | render by parent access | not blanket by default | bez auto-detekce v MVP |
| Attachment binary | uploaded file | Yes if parent is PHI | n/a | storage/backend protection | download audit required |

## Export Matrix

| Export type | Allowed in MVP | PHI handling | Audit |
|---|---|---|---|
| Standard export | Yes | only non-PHI data | who exported, what scope, when |
| GDPR self-service export | Yes | pouze data subjektu a dle compliance flow | who requested, who delivered, when |
| Regulated/admin export | Not baseline; explicit process only | může zahrnout PHI jen se zvláštním oprávněním | mandatory full audit trail |
| Attachment bulk export | Not baseline for PHI | PHI attachments blocked in standard flow | mandatory |

## Download Rules

- Attachment download musí kontrolovat:
  - entity access
  - PHI classification
  - guest hard block
  - audit event creation for PHI
- Inline preview PHI attachmentu se chová jako download/read access.

## Test Requirements

Minimální test coverage pro MVP:

- non-PHI member can read allowed entity
- non-member cannot read entity
- PHI entity denies Guest always
- PHI/Unknown entity requires stricter access than non-PHI
- PHI attachment download creates audit event
- standard export excludes PHI content
- GDPR export follows separate path
- approval entity inherits PHI restrictions from target entity

## Open Follow-ups

- přesný seznam tabulek, kde zapnout RLS
- přesný seznam polí, kde použít column encryption
- retention detail per entity class
- compliance/admin role naming pro regulated export

## References

- [implementation-plan.md](/C:/Users/janme/Documents/Projekty/Claude/phc-nexus/docs/implementation-plan.md)
- [business-logic-summary.md](/C:/Users/janme/Documents/Projekty/Claude/phc-nexus/docs/business-logic-summary.md)
- [tech-stack-analysis.md](/C:/Users/janme/Documents/Projekty/Claude/phc-nexus/docs/tech-stack-analysis.md)
