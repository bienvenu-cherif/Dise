param(
  [switch]$StructureOnly
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$checks = New-Object System.Collections.Generic.List[object]

function Add-Check($Name, $Status, $Detail) {
  $script:checks.Add([pscustomobject]@{
    Controle = $Name
    Statut = $Status
    Detail = $Detail
  })
}

function Test-PlaceholderUrl($Value) {
  return [string]::IsNullOrWhiteSpace($Value) -or
    $Value -match "example\.com|DOMAINE|localhost|127\.0\.0\.1"
}

function Test-PublicUrl($Name, $Value) {
  if (Test-PlaceholderUrl $Value) {
    $status = if ($StructureOnly) { "AVERTISSEMENT" } else { "ECHEC" }
    Add-Check $Name $status "URL publique definitive requise: $Value"
  } elseif ($Value -notmatch "^https://") {
    Add-Check $Name "ECHEC" "HTTPS obligatoire: $Value"
  } else {
    Add-Check $Name "OK" $Value
  }
}

$appPath = Join-Path $root "cotadise-mobile\app.json"
$easPath = Join-Path $root "cotadise-mobile\eas.json"
$renderPath = Join-Path $root "render.yaml"
$privacyPath = Join-Path $root "cotadise-frontend\public\privacy.html"
$termsPath = Join-Path $root "cotadise-frontend\public\terms.html"

foreach ($requiredPath in @($appPath, $easPath, $renderPath, $privacyPath, $termsPath)) {
  if (-not (Test-Path -LiteralPath $requiredPath)) {
    Add-Check "Fichier $([IO.Path]::GetFileName($requiredPath))" "ECHEC" "Fichier introuvable"
  }
}

if (-not (Test-Path -LiteralPath $appPath) -or -not (Test-Path -LiteralPath $easPath)) {
  $checks | Format-Table -AutoSize
  exit 1
}

$app = Get-Content -LiteralPath $appPath -Raw | ConvertFrom-Json
$eas = Get-Content -LiteralPath $easPath -Raw | ConvertFrom-Json

if ($app.expo.name -eq "CotaDISE" -and $app.expo.slug) {
  Add-Check "Identite Expo" "OK" "$($app.expo.name) / $($app.expo.slug)"
} else {
  Add-Check "Identite Expo" "ECHEC" "Nom ou slug Expo manquant"
}

if ($app.expo.android.package -match "^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$") {
  Add-Check "Package Android" "OK" $app.expo.android.package
} else {
  Add-Check "Package Android" "ECHEC" "Identifiant Android invalide"
}

if ($app.expo.ios.bundleIdentifier -match "^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z][a-zA-Z0-9-]*)+$") {
  Add-Check "Bundle iOS" "OK" $app.expo.ios.bundleIdentifier
} else {
  Add-Check "Bundle iOS" "ECHEC" "Identifiant iOS invalide"
}

foreach ($asset in @($app.expo.icon, $app.expo.splash.image, $app.expo.android.adaptiveIcon.foregroundImage)) {
  $assetPath = Join-Path (Join-Path $root "cotadise-mobile") $asset
  if (Test-Path -LiteralPath $assetPath) {
    Add-Check "Asset mobile $asset" "OK" "Present"
  } else {
    Add-Check "Asset mobile $asset" "ECHEC" "Introuvable"
  }
}

foreach ($profileName in @("preview", "production")) {
  $profile = $eas.build.$profileName
  if (-not $profile) {
    Add-Check "Profil EAS $profileName" "ECHEC" "Profil absent"
    continue
  }
  Test-PublicUrl "EAS $profileName API" $profile.env.EXPO_PUBLIC_API_BASE
  Test-PublicUrl "EAS $profileName confidentialite" $profile.env.EXPO_PUBLIC_PRIVACY_URL
  Test-PublicUrl "EAS $profileName conditions" $profile.env.EXPO_PUBLIC_TERMS_URL
}

if (Test-Path -LiteralPath $renderPath) {
  $render = Get-Content -LiteralPath $renderPath -Raw
  foreach ($needle in @("cotadise-postgresql", "cotadise-api", "cotadise-admin", "/api/health", "generateValue: true")) {
    if ($render.Contains($needle)) {
      Add-Check "Render $needle" "OK" "Configure"
    } else {
      Add-Check "Render $needle" "ECHEC" "Configuration absente"
    }
  }
}

foreach ($legal in @($privacyPath, $termsPath)) {
  if (Test-Path -LiteralPath $legal) {
    $content = Get-Content -LiteralPath $legal -Raw
    if ($content -match "CotaDISE" -and $content -match "Contact") {
      Add-Check "Page legale $([IO.Path]::GetFileName($legal))" "OK" "Contenu present"
    } else {
      Add-Check "Page legale $([IO.Path]::GetFileName($legal))" "ECHEC" "Marque ou contact manquant"
    }
  }
}

$checks | Format-Table -AutoSize
$failures = @($checks | Where-Object { $_.Statut -eq "ECHEC" })
if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Publication bloquee: $($failures.Count) erreur(s)." -ForegroundColor Red
  exit 1
}

Write-Host ""
if ($StructureOnly) {
  Write-Host "Structure de publication valide. Les avertissements restent a traiter avant la sortie." -ForegroundColor Green
} else {
  Write-Host "Configuration prete pour la publication." -ForegroundColor Green
}
