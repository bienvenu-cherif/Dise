param(
  [string]$ApiBase = "https://cotadise-api.onrender.com/api",
  [string]$AdminBase = "https://cotadise-admin.onrender.com",
  [int]$TimeoutSeconds = 30,
  [switch]$SkipHttp
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

function Normalize-BaseUrl($Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }
  return $Value.Trim().TrimEnd("/")
}

function Test-HttpsUrl($Name, $Value) {
  $normalized = Normalize-BaseUrl $Value
  if (-not $normalized) {
    Add-Check $Name "ECHEC" "URL vide"
  } elseif ($normalized -notmatch "^https://") {
    Add-Check $Name "ECHEC" "HTTPS obligatoire: $normalized"
  } elseif ($normalized -match "localhost|127\.0\.0\.1|example\.com") {
    Add-Check $Name "ECHEC" "URL de demonstration: $normalized"
  } else {
    Add-Check $Name "OK" $normalized
  }
  return $normalized
}

function Invoke-PublicGet($Name, $Url, $ExpectJson) {
  if ($SkipHttp) {
    Add-Check $Name "AVERTISSEMENT" "Verification HTTP ignoree"
    return
  }

  try {
    if ($ExpectJson) {
      $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds
      if ($response.status -eq "ok" -and $response.database -eq "up") {
        Add-Check $Name "OK" "status=$($response.status), database=$($response.database), latence=$($response.databaseLatencyMs)ms"
      } else {
        Add-Check $Name "ECHEC" "Reponse inattendue: status=$($response.status), database=$($response.database)"
      }
    } else {
      $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
        Add-Check $Name "OK" "HTTP $($response.StatusCode)"
      } else {
        Add-Check $Name "ECHEC" "HTTP $($response.StatusCode)"
      }
    }
  } catch {
    Add-Check $Name "ECHEC" $_.Exception.Message
  }
}

function Read-JsonFile($Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Fichier introuvable: $Path"
  }
  return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
}

$api = Test-HttpsUrl "URL API publique" $ApiBase
$admin = Test-HttpsUrl "URL admin publique" $AdminBase

$easPath = Join-Path $root "cotadise-mobile\eas.json"
$appPath = Join-Path $root "cotadise-mobile\app.json"
$eas = Read-JsonFile $easPath
$app = Read-JsonFile $appPath

foreach ($profileName in @("preview", "production")) {
  $profile = $eas.build.$profileName
  if (-not $profile) {
    Add-Check "EAS $profileName" "ECHEC" "Profil absent"
    continue
  }

  $expectedPrivacyUrl = "$admin/privacy.html"
  $expectedTermsUrl = "$admin/terms.html"

  if ((Normalize-BaseUrl $profile.env.EXPO_PUBLIC_API_BASE) -eq $api) {
    Add-Check "EAS $profileName API" "OK" $profile.env.EXPO_PUBLIC_API_BASE
  } else {
    Add-Check "EAS $profileName API" "ECHEC" "Attendu $api, trouve $($profile.env.EXPO_PUBLIC_API_BASE)"
  }

  if ((Normalize-BaseUrl $profile.env.EXPO_PUBLIC_PRIVACY_URL) -eq $expectedPrivacyUrl) {
    Add-Check "EAS $profileName confidentialite" "OK" $profile.env.EXPO_PUBLIC_PRIVACY_URL
  } else {
    Add-Check "EAS $profileName confidentialite" "ECHEC" "Attendu $expectedPrivacyUrl"
  }

  if ((Normalize-BaseUrl $profile.env.EXPO_PUBLIC_TERMS_URL) -eq $expectedTermsUrl) {
    Add-Check "EAS $profileName conditions" "OK" $profile.env.EXPO_PUBLIC_TERMS_URL
  } else {
    Add-Check "EAS $profileName conditions" "ECHEC" "Attendu $expectedTermsUrl"
  }
}

if ($app.expo.android.package -and $app.expo.ios.bundleIdentifier) {
  Add-Check "Identifiants stores" "OK" "Android=$($app.expo.android.package), iOS=$($app.expo.ios.bundleIdentifier)"
} else {
  Add-Check "Identifiants stores" "ECHEC" "Package Android ou bundle iOS manquant"
}

Invoke-PublicGet "API /health" "$api/health" $true
Invoke-PublicGet "Admin web" "$admin/" $false
Invoke-PublicGet "Politique de confidentialite" "$admin/privacy.html" $false
Invoke-PublicGet "Conditions d'utilisation" "$admin/terms.html" $false

$checks | Format-Table -AutoSize

$failures = @($checks | Where-Object { $_.Statut -eq "ECHEC" })
if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Recette publique bloquee: $($failures.Count) erreur(s)." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Recette publique CotaDISE validee." -ForegroundColor Green
