# /test

Spusť a vyhodnoť testy pro aktuální změny.

## Postup

1. **Identifikuj změněné soubory:**
   ```bash
   git diff --name-only
   git diff --cached --name-only
   ```

2. **Urči dotčené moduly** z cest souborů

3. **Spusť backend testy:**
   ```bash
   # Cílené na modul
   docker compose exec app php artisan test --filter=<Module>
   # Nebo všechny
   docker compose exec app php artisan test
   ```

4. **Spusť frontend testy:**
   ```bash
   docker compose exec app npx vitest run --reporter=verbose
   ```

5. **Spusť static analysis:**
   ```bash
   docker compose exec app ./vendor/bin/phpstan analyse
   docker compose exec app ./vendor/bin/pint --test
   docker compose exec app npx eslint .
   docker compose exec app npx tsc --noEmit
   ```

6. **E2E testy** (pokud relevantní — UI změny, kritické flows):
   ```bash
   docker compose exec app npx playwright test
   ```

7. **Report:**
   - Celkový výsledek: PASS / FAIL
   - Počet: passed / failed / skipped
   - Při selhání: zobraz relevantní chybový výstup a navrhni opravu
