param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [string]$EnvPath = ".\cotadise-backend\.env",
  [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmRestore) {
  throw "Restauration bloquee. Relancer avec -ConfirmRestore apres verification du fichier et de la base cible."
}
if (-not (Test-Path -LiteralPath $BackupPath)) {
  throw "Sauvegarde introuvable: $BackupPath"
}
if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
  throw "pg_restore est introuvable. Installer les outils client PostgreSQL et ajouter leur dossier bin au PATH."
}

$values = @{}
Get-Content -LiteralPath $EnvPath | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $index = $line.IndexOf("=")
  if ($index -gt 0) { $values[$line.Substring(0, $index).Trim()] = $line.Substring($index + 1).Trim() }
}

if ($values["DATABASE_URL"]) {
  $uri = [Uri]$values["DATABASE_URL"]
  $credentials = $uri.UserInfo.Split(":", 2)
  $env:PGHOST = $uri.Host
  $env:PGPORT = if ($uri.Port -gt 0) { [string]$uri.Port } else { "5432" }
  $env:PGUSER = [Uri]::UnescapeDataString($credentials[0])
  $env:PGPASSWORD = if ($credentials.Count -gt 1) { [Uri]::UnescapeDataString($credentials[1]) } else { "" }
  $env:PGDATABASE = $uri.AbsolutePath.TrimStart("/")
  if ($uri.Query -match "sslmode=([^&]+)") { $env:PGSSLMODE = $Matches[1] }
} else {
  $env:PGHOST = $values["DATABASE_HOST"]
  $env:PGPORT = $values["DATABASE_PORT"]
  $env:PGUSER = $values["DATABASE_USER"]
  $env:PGPASSWORD = $values["DATABASE_PASSWORD"]
  $env:PGDATABASE = $values["DATABASE_NAME"]
}

Write-Host "Restauration vers la base $($env:PGDATABASE) sur $($env:PGHOST)..." -ForegroundColor Yellow
& pg_restore --clean --if-exists --no-owner --dbname=$env:PGDATABASE --host=$env:PGHOST --port=$env:PGPORT --username=$env:PGUSER $BackupPath
if ($LASTEXITCODE -ne 0) { throw "La restauration PostgreSQL a echoue." }
Write-Host "Restauration terminee." -ForegroundColor Green
