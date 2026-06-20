param(
  [switch]$WithSmokeTest
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Invoke-Checked($Label, $WorkingDirectory, [string[]]$Arguments) {
  Write-Host "`n[$Label]" -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    & npm.cmd @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Label a echoue avec le code $LASTEXITCODE" }
  } finally {
    Pop-Location
  }
}

Invoke-Checked "Tests backend" (Join-Path $root "cotadise-backend") @("test", "--", "--runInBand")
Invoke-Checked "Build backend" (Join-Path $root "cotadise-backend") @("run", "build")
Invoke-Checked "Build frontend" (Join-Path $root "cotadise-frontend") @("run", "build")
Invoke-Checked "Typecheck mobile" (Join-Path $root "cotadise-mobile") @("run", "typecheck")

$scriptFiles = Get-ChildItem -LiteralPath (Join-Path $root "scripts") -Filter "*.ps1" -File
foreach ($file in $scriptFiles) {
  $tokens = $null
  $errors = $null
  [System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$errors) | Out-Null
  if ($errors.Count) { throw "Erreur PowerShell dans $($file.Name): $($errors -join '; ')" }
}
Write-Host "`n[Scripts PowerShell] syntaxe OK" -ForegroundColor Green

& powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\check-release-readiness.ps1") -StructureOnly
if ($LASTEXITCODE -ne 0) { throw "Structure de publication incomplete" }

if ($WithSmokeTest) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\smoke-test.ps1")
  if ($LASTEXITCODE -ne 0) { throw "Smoke test en echec" }
}

Write-Host "`nValidation MVP CotaDISE reussie." -ForegroundColor Green
