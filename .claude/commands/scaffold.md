# /scaffold

Vygeneruj strukturu nového Laravel modulu podle projektových konvencí.

## Input

$ARGUMENTS — název modulu (PascalCase, např. "ServiceDesk", "Goals")

## Struktura k vytvoření

```
app/Modules/<Name>/
  Models/
  Actions/              (use-case třídy)
  Controllers/
  Policies/
  Resources/            (Inertia resources / data transfer)
  Events/
  Listeners/
  Jobs/
  Enums/
  Exceptions/
  Routes/
    web.php
  Providers/
    <Name>ServiceProvider.php

database/migrations/    (module-prefixed tabulky)

resources/js/Pages/<Name>/
resources/js/Components/<Name>/

tests/Feature/<Name>/
tests/Unit/<Name>/
```

## Postup

1. Ověř, že název modulu je validní a nekoliduje s existujícími
2. Vytvoř adresářovou strukturu
3. Vytvoř base Model s UUIDv7 trait a `declare(strict_types=1)`
4. Vytvoř skeleton Policy
5. Vytvoř route soubor s module prefixem
6. Vytvoř ServiceProvider a registruj ho
7. Vytvoř skeleton feature test
8. Vytvoř placeholder Inertia page
9. Commit: `feat(<module>): scaffold <Name> module`

## Konvence

- UUIDv7 jako PK na všech modelech
- `declare(strict_types=1)` na každém PHP souboru
- Route prefix: kebab-case název modulu
- Tabulky: snake_case s module prefixem kde vhodné
