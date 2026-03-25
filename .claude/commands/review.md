# /review

Review aktuálních změn proti projektovým standardům a Definition of Done.

## Postup

1. **Zjisti stav změn:**
   - `git diff` — unstaged změny
   - `git diff --cached` — staged změny
   - `git log main..HEAD --oneline` — commity na branch

2. **Definition of Done check:**
   - [ ] Implementace end-to-end?
   - [ ] Acceptance criteria splněna?
   - [ ] V rámci MVP scope? (viz `docs/implementation-plan.md` sekce 2)
   - [ ] Authorization na každém novém endpointu/page/download?
   - [ ] Audit logging pro business akce?
   - [ ] PHI impact posouzen? (viz `docs/architecture/phi-scope-matrix.md`)
   - [ ] Export/download guardy kde potřeba?
   - [ ] Testy přítomny a úměrné riziku?
   - [ ] Žádné secrets/credentials v kódu?

3. **Code conventions check:**
   - PHP: `declare(strict_types=1)`, Actions pattern, Policy třídy
   - TypeScript: strict mode, správné typování
   - Žádné ad-hoc hex barvy (použít design tokeny)
   - Žádná předčasná abstrakce nebo generické helpery
   - UUIDv7 pro nové PK

4. **Git hygiene check:**
   - Conventional Commit formát?
   - Branch naming správný? (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`)
   - PR velikost rozumná? (300–600 řádků)

5. **Report** — každý nález ohodnoť:
   - **BLOCKER** — musí se opravit před merge
   - **WARNING** — mělo by se opravit
   - **SUGGESTION** — nice to have
