# Backup tooling — deploy artefakty

Tento adresář obsahuje **template** soubory pro off-site backup. Skutečné klíče
a credentials nejsou v repu — viz `docs/runbooks/backup-restore.md` pro postup
generování a bezpečné distribuce.

## Soubory

| Soubor | Účel |
|--------|------|
| `rclone.conf.example` | Template pro Backblaze B2 rclone remote |
| `phc-nexus-backup-pub.asc.example` | Placeholder — skutečný public key přidat po vygenerování keypair |

## Workflow

1. **Jednou**: vygeneruj GPG keypair na bezpečném stroji (ne VPS)
2. Export public → commit jako `phc-nexus-backup-pub.asc` (nahradí `.example`)
3. Private zůstává v password manageru (1Password/Bitwarden)
4. Na VPS: `gpg --import phc-nexus-backup-pub.asc` + trust
5. `rclone.conf` vyplnit na VPS, NIKDY necommit

Viz runbook pro kompletní postup.
