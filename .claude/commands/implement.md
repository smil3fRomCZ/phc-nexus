# /implement

Implementuj task end-to-end podle projektových konvencí.

## Input

$ARGUMENTS — popis toho, co implementovat

## Postup

1. **Přečti CLAUDE.md** pro aktuální konvence a MVP scope
2. **Identifikuj modul(y)** — která `app/Modules/*` složka je dotčená
3. **Vytvoř feature branch**: `feat/<modul>-<krátký-popis>`
4. **Backend implementace:**
   - Action class (use-case) v příslušném modulu
   - Model + migrace pokud potřeba (UUIDv7 PK, strict types)
   - Policy pro autorizaci
   - Controller + Inertia resource
   - Events/Listeners pro audit trail
   - Queue jobs pro side effects
5. **Frontend implementace:**
   - Inertia page v `resources/js/Pages/<Module>/`
   - shadcn/ui komponenty, design tokeny z `docs/design/design-tokens.md`
   - TypeScript interfaces pro props
   - Sleduj page patterns z `docs/design/page-patterns.md`
6. **Testy:**
   - Feature test pro HTTP flow
   - Authorization test (role-based, PHI pokud relevantní)
   - Unit test pro komplexní business logiku
7. **Spusť testy a static analysis:**
   - `docker compose exec app php artisan test`
   - `docker compose exec app ./vendor/bin/phpstan analyse`
   - `docker compose exec app ./vendor/bin/pint --test`
   - `docker compose exec app npx tsc --noEmit`
8. **Commit**: `type(modul): popis změny`

## Checklist před commitem

- [ ] MVP scope dodržen? (žádný scope creep)
- [ ] Authorization na každém endpointu?
- [ ] Audit trail pro business akce?
- [ ] PHI klasifikace ošetřena (pokud data modul)?
- [ ] Export/download guardy (pokud file-related)?
- [ ] Testy úměrné riziku?
- [ ] Žádné secrets v kódu?
