# ADR-004 — Auth Scope MVP

Status: Accepted
Date: 2026-03-24
Owners: Product/Domain Owner, Tech Lead

## Context

Projekt má v roadmapě interní i externí identity scénáře, ale MVP/Fáze 1 je zúžené na
`Projects + Work + basic approvals + notifications` s minimální provozní a bezpečnostní
složitostí.

Předchozí verze dokumentace míchaly tyto varianty:

- interní uživatelé přes Google Workspace SSO
- externí/Guest uživatelé přes lokální účet
- volitelné rozšíření o další auth mechanismy

To otevíralo scope creep v invite flow, session pravidlech, MFA, authorization testech a
PHI enforcementu.

## Decision

Pro MVP/Fázi 1 platí:

1. Jediný podporovaný identity model pro produktové UI je `Google SSO` pro interní
   uživatele z Google Workspace.
2. Registrace je `invite-only`.
3. Interní zaměstnanec nemůže být v MVP vytvořen jako lokální účet.
4. `Guest` / external collaborator není součást MVP/Fáze 1.
5. Lokální účet, alternativní login flow, passkeys a API token auth nejsou součást MVP
   baseline.
6. MFA pro interní uživatele je v MVP delegováno na Google Workspace / IdP politiku.

## MVP Rules

- Supported login:
  - Google SSO pouze pro interní uživatele
- Supported onboarding:
  - admin vytvoří invite
  - uživatel přijme invite přes Google SSO
  - účet vznikne až po úspěšné federované autentizaci
- Unsupported in MVP:
  - email + password login
  - Guest/external role s vlastním login flow
  - passkeys jako produktový login mechanismus
  - veřejná registrace
  - více IdP providerů
  - API-first auth baseline

## Consequences

Pozitivní:

- menší auth surface area
- jednodušší session a MFA model
- menší test matrix
- nižší riziko u PHI a export guardů
- méně provozních edge casů v offboardingu

Negativní:

- MVP nepokrývá dodavatele, klienty ani externí schvalovatele
- budoucí external/Guest flow bude vyžadovat samostatný návrh

## Follow-up For Phase 2+

Před přidáním Guest/external flow musí vzniknout nový ADR, který uzavře alespoň:

- identity source: lokální účet vs federovaný external IdP
- MFA pravidla
- session timeout a lifecycle
- invite expiry a revoke flow
- authorization ceiling pro external role
- PHI hard blocks
- audit a export dopady

## References

- [implementation-plan.md](/C:/Users/janme/Documents/Projekty/Claude/phc-nexus/docs/implementation-plan.md)
- [business-logic-summary.md](/C:/Users/janme/Documents/Projekty/Claude/phc-nexus/docs/business-logic-summary.md)
- [tech-stack-analysis.md](/C:/Users/janme/Documents/Projekty/Claude/phc-nexus/docs/tech-stack-analysis.md)
