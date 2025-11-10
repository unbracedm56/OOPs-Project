# Supabase Migration Guide

This document shows how to migrate the database, functions and storage from the current Supabase (the "source" project used during development) to your own Supabase project (the "target").

High-level options

- Recommended (easiest if you have the Supabase CLI installed): use the Supabase CLI to dump and restore the DB.
- Reliable (standard): use `pg_dump`/`pg_restore` (or `psql`) to export/import schema+data.
- Use the `supabase/migrations` folder to apply schema-only migrations if you prefer applying migrations rather than a full dump.

What we added in this repo

- `supabase/scripts/migrate-supabase.ps1` — a PowerShell helper that orchestrates a migration via the Supabase CLI if you want an automated helper. It does not contain any secrets; you must provide the project refs or DB connection strings as environment variables.

Pre-requisites

- Supabase CLI installed and logged in (optional but recommended): https://supabase.com/docs/guides/cli
- PostgreSQL client tools installed (`pg_dump`, `pg_restore`, `psql`) if you plan to use them.
- Access to the source project's DB connection string or supabase project ref. The local repo has the source project id in `supabase/config.toml`.
- Access to the target Supabase project and its DB connection string (or project ref).

Important: This repository cannot and will not store passwords/keys. Keep your credentials secret.

A. Inspect the source project id (repo)

The repo contains the current linked Supabase project id:

- `supabase/config.toml` contains `project_id` for the source project.

B. Option 1 — Using Supabase CLI (recommended if available)

1. Login and link to source project

Open PowerShell and run:

```powershell
supabase login
# set SOURCE_PROJECT_REF to the project ref of the source project (found in config.toml or Supabase console)
$env:SOURCE_PROJECT_REF = "ruwdentfywlugqazouua"
supabase link --project-ref $env:SOURCE_PROJECT_REF
```

2. Dump the DB (schema + data)

```powershell
# create an output folder
New-Item -ItemType Directory -Force -Path .\supabase\dump > $null
$dumpFile = Join-Path -Path .\supabase\dump -ChildPath "supabase_dump.sql"
# Use the CLI's db dump when available
supabase db dump --file $dumpFile
```

If the CLI does not support `db dump` in your installed version, see the pg_dump method below.

3. Link to target project and restore

```powershell
# Set TARGET_PROJECT_REF to your new project's ref (found in the Supabase project's settings -> API -> Project ref)
$env:TARGET_PROJECT_REF = "<YOUR_TARGET_PROJECT_REF>"
supabase link --project-ref $env:TARGET_PROJECT_REF
supabase db restore --file $dumpFile
```

C. Option 2 — Using pg_dump / pg_restore (universal)

1. Get connection strings

- Source: From the Supabase console (Project -> Settings -> Database -> Connection string)
- Target: Same for your new project

2. Dump schema + data (recommended format: custom for pg_restore)

```powershell
# Example (replace placeholders):
$env:PGHOST = "db.source.supabase.co"
$env:PGPORT = "5432"
$env:PGUSER = "postgres"
$env:PGPASSWORD = "<SOURCE_PASSWORD>"
$dumpFile = ".\supabase\dump\export.dump"
pg_dump -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -Fc -f $dumpFile
```

3. Restore to target

```powershell
$env:PGHOST_T = "db.target.supabase.co"
$env:PGPORT_T = "5432"
$env:PGUSER_T = "postgres"
$env:PGPASSWORD_T = "<TARGET_PASSWORD>"
# Create the database if needed (Supabase uses 'postgres' by default); then restore
pg_restore --verbose --clean --no-acl --no-owner -h $env:PGHOST_T -p $env:PGPORT_T -U $env:PGUSER_T -d postgres $dumpFile
```

Notes:
- If large tables are a problem, consider per-table CSV export + import to avoid timeouts.
- Use `--schema-only` with `pg_dump` if you only want to copy schema and not data.

D. Applying repository migrations instead of a full dump

The repository includes `supabase/migrations/` with migration SQL files (timestamped). If you prefer to recreate schema via migrations:

1. Connect to your target DB and apply the migration SQL files in chronological order.
2. Example using `psql`:

```powershell
# Apply migrations in order
Get-ChildItem -Path .\supabase\migrations | Sort-Object Name | ForEach-Object {
  Write-Host "Applying $_"
  psql "postgresql://postgres:<TARGET_PASSWORD>@db.target.supabase.co:5432/postgres" -f $_.FullName
}
```

E. Deploy functions

The repo has serverless functions in `supabase/functions/`. Deploy them to your target project:

```powershell
# Link to target project first
supabase login
supabase link --project-ref <YOUR_TARGET_PROJECT_REF>
# From repo root
cd supabase\functions
# Deploy each function
supabase functions deploy import-products
# or deploy all if supported
# supabase functions deploy --all
```

F. Storage (files)

If you used Supabase Storage in the source project and you need to migrate assets, you'll need to download them and re-upload to the target bucket. Example approach:

1. Use the Supabase Storage API or `supabase-js` script to list and download objects.
2. Upload to the target bucket with the new project's keys.

G. Update your app to point at the new project

- Update environment variables used by the app (example keys in `.env` or hosting platform):
  - SUPABASE_URL -> https://<project-ref>.supabase.co
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (if used in server-side code)

H. Verification / smoke tests

- Run the app locally and perform common flows: signup, login, read/write data, upload/download storage, call functions used by the app.
- Check Supabase console to confirm tables, rows, functions and storage items exist.

I. Troubleshooting tips

- Permission errors: ensure you restored roles and policies if you used custom RLS policies.
- Extensions: ensure any Postgres extensions used in source are enabled in the target.
- Large tables/timeouts: import in chunks or use `pg_restore` with parallel workers (`-j`) if possible.

If you'd like, I can:

- Add more automation (scripts that prompt you for credentials and run dump/restore), or
- Attempt to run an automated migration from this environment if you provide the source and target connection strings or Supabase project refs and necessary credentials. (Note: you must supply secrets securely; do NOT paste them in chat if you prefer not to.)

Files added

- `supabase/scripts/migrate-supabase.ps1` (helper script)

