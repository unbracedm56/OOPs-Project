<#
Helper PowerShell script to orchestrate a supabase CLI-based migration.
This script intentionally does not store secrets. You must provide one of these modes:

Mode A (Supabase CLI mode):
  - Set env vars: SOURCE_PROJECT_REF, TARGET_PROJECT_REF
  - Ensure `supabase` CLI is installed and logged in.
  - The script will run supabase db dump/restore if the CLI supports it.

Mode B (Manual mode):
  - Use pg_dump/pg_restore manually (see README_MIGRATE.md).

Usage examples (PowerShell):
$env:SOURCE_PROJECT_REF = "ruwdentfywlugqazouua"
$env:TARGET_PROJECT_REF = "your-target-ref"
.\supabase\scripts\migrate-supabase.ps1
# Or set USE_SUPABASE_CLI=0 to print manual steps instead
# $env:USE_SUPABASE_CLI = '0'

#> 

param()

function Fail([string]$msg) { Write-Host $msg -ForegroundColor Red; exit 1 }

# Paths
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$dumpDir = Join-Path $root "..\dump" | Resolve-Path -Relative
$dumpDirFull = Join-Path $root "..\dump"
if (-not (Test-Path $dumpDirFull)) { New-Item -ItemType Directory -Force -Path $dumpDirFull | Out-Null }
$dumpFile = Join-Path $dumpDirFull "supabase_dump.sql"

$useCli = $true
if ($env:USE_SUPABASE_CLI -and $env:USE_SUPABASE_CLI -eq '0') { $useCli = $false }

if ($useCli) {
    if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
        Fail "Supabase CLI not found in PATH. Install it or set USE_SUPABASE_CLI=0 to use manual pg_dump/pg_restore steps."
    }
    if (-not $env:SOURCE_PROJECT_REF) { Fail "Please set environment var SOURCE_PROJECT_REF to the source project ref." }
    if (-not $env:TARGET_PROJECT_REF) { Fail "Please set environment var TARGET_PROJECT_REF to the target project ref." }

    Write-Host "Linking to source project: $($env:SOURCE_PROJECT_REF)"
    & supabase link --project-ref $env:SOURCE_PROJECT_REF
    if ($LASTEXITCODE -ne 0) { Fail "supabase link to source failed" }

    Write-Host "Dumping DB (source) to $dumpFile"
    & supabase db dump --file $dumpFile
    if ($LASTEXITCODE -ne 0) { Write-Host "Warning: supabase db dump failed or is not supported by this CLI version." -ForegroundColor Yellow; Write-Host "Please follow the manual pg_dump steps in README_MIGRATE.md"; exit 1 }

    Write-Host "Linking to target project: $($env:TARGET_PROJECT_REF)"
    & supabase link --project-ref $env:TARGET_PROJECT_REF
    if ($LASTEXITCODE -ne 0) { Fail "supabase link to target failed" }

    Write-Host "Restoring DB to target from $dumpFile"
    & supabase db restore --file $dumpFile
    if ($LASTEXITCODE -ne 0) { Fail "supabase db restore failed" }

    Write-Host "Done. Check the target project in the Supabase console and run verification tests." -ForegroundColor Green
    exit 0
}

# If we get here, user requested manual mode
Write-Host 'Manual mode: please follow README_MIGRATE.md for pg_dump/pg_restore instructions.' -ForegroundColor Yellow
Write-Host 'Supabase migrations are in ../migrations - you can apply them in order if you prefer schema-only migration.' -ForegroundColor Cyan

exit 0
