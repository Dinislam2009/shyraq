$ErrorActionPreference = "Stop"

Write-Host "=== SHYRAQ SETUP ===" -ForegroundColor Cyan

npm install

if (!(Test-Path ".\supabase\config.toml")) {
  npx supabase@2.117.0 init
}

$existing = Get-ChildItem ".\supabase\migrations" -Filter "*_shyraq_initial.sql" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (!$existing) {
  npx supabase@2.117.0 migration new shyraq_initial
  $existing = Get-ChildItem ".\supabase\migrations" -Filter "*_shyraq_initial.sql" |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

Copy-Item ".\supabase\schema.sql" $existing.FullName -Force

npx supabase@2.117.0 projects list *> $null
if ($LASTEXITCODE -ne 0) {
  npx supabase@2.117.0 login
}

npx supabase@2.117.0 link --project-ref dkhkwxhudslmshitfaws
npx supabase@2.117.0 db push --dry-run
npx supabase@2.117.0 db push
npx supabase@2.117.0 gen types typescript --linked | Out-File ".\src\types\database.generated.ts" -Encoding utf8

npm run lint
npm run build

Write-Host "SHYRAQ FOUNDATION READY" -ForegroundColor Green
