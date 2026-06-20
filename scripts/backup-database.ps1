param(
  [string]$EnvPath = ".\cotadise-backend\.env",
  [string]$BackupDirectory = ".\backups",
  [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

function Read-EnvFile($Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Fichier env introuvable: $Path"
  }
  $values = @{}
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $index = $line.IndexOf("=")
    if ($index -le 0) { return }
    $values[$line.Substring(0, $index).Trim()] = $line.Substring($index + 1).Trim()
  }
  return $values
}

function Set-PostgresEnvironment($Values) {
  if ($Values["DATABASE_URL"]) {
    $uri = [Uri]$Values["DATABASE_URL"]
    $credentials = $uri.UserInfo.Split(":", 2)
    $env:PGHOST = $uri.Host
    $env:PGPORT = if ($uri.Port -gt 0) { [string]$uri.Port } else { "5432" }
    $env:PGUSER = [Uri]::UnescapeDataString($credentials[0])
    $env:PGPASSWORD = if ($credentials.Count -gt 1) { [Uri]::UnescapeDataString($credentials[1]) } else { "" }
    $env:PGDATABASE = $uri.AbsolutePath.TrimStart("/")
    if ($uri.Query -match "sslmode=([^&]+)") { $env:PGSSLMODE = $Matches[1] }
    return
  }
  $env:PGHOST = $Values["DATABASE_HOST"]
  $env:PGPORT = $Values["DATABASE_PORT"]
  $env:PGUSER = $Values["DATABASE_USER"]
  $env:PGPASSWORD = $Values["DATABASE_PASSWORD"]
  $env:PGDATABASE = $Values["DATABASE_NAME"]
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump est introuvable. Installer les outils client PostgreSQL et ajouter leur dossier bin au PATH."
}

$envValues = Read-EnvFile $EnvPath
Set-PostgresEnvironment $envValues
if (-not $env:PGHOST -or -not $env:PGUSER -or -not $env:PGDATABASE) {
  throw "Configuration PostgreSQL incomplete dans $EnvPath"
}

$backupRoot = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $BackupDirectory))
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $backupRoot "cotadise-$timestamp.dump"

& pg_dump --format=custom --no-owner --file=$backupPath
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $backupPath)) {
  throw "La sauvegarde PostgreSQL a echoue."
}

if ($RetentionDays -gt 0) {
  $limit = (Get-Date).AddDays(-$RetentionDays)
  Get-ChildItem -LiteralPath $backupRoot -Filter "cotadise-*.dump" -File |
    Where-Object { $_.LastWriteTime -lt $limit } |
    Remove-Item -Force
}

Write-Host "Sauvegarde creee: $backupPath" -ForegroundColor Green
Write-Host "Taille: $([Math]::Round((Get-Item -LiteralPath $backupPath).Length / 1MB, 2)) Mo"
