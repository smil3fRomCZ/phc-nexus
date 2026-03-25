# /pr

Vytvoř Pull Request podle projektových konvencí.

## Postup

1. **Ověř předpoklady:**
   - Nejsi na `main` branch
   - Všechny změny jsou commitnuté
   - Branch naming je správný (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`)

2. **Spusť testy** (logika z `/test`):
   - Backend testy
   - Frontend testy
   - Static analysis
   - Pokud testy padají → STOP, reportuj chyby

3. **Push branch:**
   ```bash
   git push -u origin <branch-name>
   ```

4. **Vytvoř PR** přes `gh pr create` s tímto formátem:

   **Title:** conventional commit styl — `type(scope): summary`

   **Body:**
   ```markdown
   ## Co se mění
   <shrnutí změn>

   ## Proč
   <business důvod / task reference>

   ## Impact
   - **Authorization:** <nějaké změny?>
   - **Audit:** <nějaké změny?>
   - **PHI:** <nějaký dopad?>
   - **Export/Download:** <nějaký dopad?>

   ## Testování
   <co bylo testováno a jak>

   ## Screenshots
   <pokud UI změny>

   ## Review checklist
   - [ ] V rámci MVP scope
   - [ ] Žádná předčasná abstrakce
   - [ ] Authorization neobejita
   - [ ] Audit/logging na správném místě
   - [ ] Testy úměrné riziku
   ```

5. **Target branch:** `main`
6. **Vypiš PR URL**
