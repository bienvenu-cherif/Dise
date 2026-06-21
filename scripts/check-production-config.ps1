param(
  [string]$EnvPath = ".\cotadise-backend\.env",
  [switch]$AllowDemo
)

$ErrorActionPreference = "Stop"

function Read-EnvFile($Path) {
  if (-not (Test-Path $Path)) {
    throw "Fichier env introuvable: $Path"
  }

  $values = @{}
  Get-Content -Path $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -le 0) {
      return
    }

    $key = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1).Trim()
    $values[$key] = $value
  }
  return $values
}

function Is-Missing($Env, $Key) {
  return -not $Env.ContainsKey($Key) -or [string]::IsNullOrWhiteSpace($Env[$Key])
}

function Is-Placeholder($Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $true
  }
  return $Value -match "change-me|example\.com|changeme|postgres$"
}

$envValues = Read-EnvFile $EnvPath
$checks = New-Object System.Collections.Generic.List[object]

function Add-Check($Name, $Status, $Detail) {
  $script:checks.Add([pscustomobject]@{
    Controle = $Name
    Statut = $Status
    Detail = $Detail
  })
}

$nodeEnv = $envValues["NODE_ENV"]
if ($nodeEnv -eq "production") {
  Add-Check "NODE_ENV" "OK" "production"
} else {
  Add-Check "NODE_ENV" "AVERTISSEMENT" "Mettre NODE_ENV=production pour le deploiement"
}

$hasDatabaseUrl = -not (Is-Missing $envValues "DATABASE_URL")
$hasDatabaseParts = -not (Is-Missing $envValues "DATABASE_HOST") -and -not (Is-Missing $envValues "DATABASE_USER") -and -not (Is-Missing $envValues "DATABASE_PASSWORD") -and -not (Is-Missing $envValues "DATABASE_NAME")
if ($hasDatabaseUrl -or $hasDatabaseParts) {
  Add-Check "PostgreSQL" "OK" "Configuration base de donnees presente"
} else {
  Add-Check "PostgreSQL" "ECHEC" "Renseigner DATABASE_URL ou DATABASE_HOST/USER/PASSWORD/NAME"
}

foreach ($secretKey in @("JWT_SECRET", "APP_SECRET", "WAVE_CONFIG_ENCRYPTION_KEY")) {
  if (Is-Missing $envValues $secretKey) {
    Add-Check $secretKey "ECHEC" "Variable manquante"
  } elseif ($envValues[$secretKey].Length -lt 32 -or (Is-Placeholder $envValues[$secretKey])) {
    Add-Check $secretKey "ECHEC" "Secret trop court ou valeur de demonstration"
  } else {
    Add-Check $secretKey "OK" "Secret configure"
  }
}

if (Is-Missing $envValues "ADMIN_EMAIL") {
  Add-Check "ADMIN_EMAIL" "ECHEC" "Adresse du premier administrateur manquante"
} else {
  Add-Check "ADMIN_EMAIL" "OK" $envValues["ADMIN_EMAIL"]
}
if ((Is-Missing $envValues "ADMIN_PASSWORD") -or $envValues["ADMIN_PASSWORD"].Length -lt 12 -or (Is-Placeholder $envValues["ADMIN_PASSWORD"])) {
  Add-Check "ADMIN_PASSWORD" "ECHEC" "Mot de passe administrateur absent, trop court ou de demonstration"
} else {
  Add-Check "ADMIN_PASSWORD" "OK" "Mot de passe administrateur configure"
}

if ($envValues["DEMO_SEED_ENABLED"] -eq "true" -and -not $AllowDemo) {
  Add-Check "DEMO_SEED_ENABLED" "ECHEC" "Desactiver les donnees demo en production"
} else {
  Add-Check "DEMO_SEED_ENABLED" "OK" "Demo desactivee ou explicitement autorisee"
}

$emailEnabled = $envValues["EMAIL_DISPATCH_ENABLED"] -eq "true"
$smtpComplete = -not (Is-Missing $envValues "SMTP_HOST") -and -not (Is-Missing $envValues "SMTP_USER") -and -not (Is-Missing $envValues "SMTP_PASSWORD") -and -not (Is-Missing $envValues "SMTP_FROM")
if ($emailEnabled -and $smtpComplete) {
  Add-Check "Email SMTP" "OK" "Envoi email active et configure"
} elseif ($emailEnabled) {
  Add-Check "Email SMTP" "ECHEC" "EMAIL_DISPATCH_ENABLED=true mais SMTP_HOST/USER/PASSWORD/FROM incomplet"
} else {
  Add-Check "Email SMTP" "AVERTISSEMENT" "Envoi email reel desactive"
}

$waveFallbackComplete = -not (Is-Missing $envValues "WAVE_API_KEY") -and -not (Is-Missing $envValues "WAVE_CHECKOUT_URL") -and -not (Is-Missing $envValues "WAVE_WEBHOOK_SECRET")
if ($waveFallbackComplete) {
  Add-Check "Wave fallback" "OK" "Configuration Wave .env presente"
} else {
  Add-Check "Wave fallback" "AVERTISSEMENT" "Wave peut rester gere par configuration annuelle; sinon renseigner WAVE_API_KEY/CHECKOUT_URL/WEBHOOK_SECRET"
}

foreach ($urlKey in @("PUBLIC_BACKEND_URL", "WAVE_SUCCESS_URL", "WAVE_ERROR_URL")) {
  if (Is-Missing $envValues $urlKey) {
    Add-Check $urlKey "AVERTISSEMENT" "URL manquante"
  } elseif (Is-Placeholder $envValues[$urlKey]) {
    Add-Check $urlKey "ECHEC" "Remplacer l'URL de demonstration"
  } else {
    Add-Check $urlKey "OK" $envValues[$urlKey]
  }
}

if (Is-Missing $envValues "CORS_ORIGINS") {
  Add-Check "CORS_ORIGINS" "ECHEC" "Renseigner le domaine HTTPS du frontend tresorier"
} elseif (Is-Placeholder $envValues["CORS_ORIGINS"]) {
  Add-Check "CORS_ORIGINS" "ECHEC" "Remplacer le domaine de demonstration"
} else {
  Add-Check "CORS_ORIGINS" "OK" $envValues["CORS_ORIGINS"]
}

$checks | Format-Table -AutoSize

$failures = @($checks | Where-Object { $_.Statut -eq "ECHEC" })
if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Configuration production incomplete: $($failures.Count) erreur(s)." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Configuration production sans erreur bloquante." -ForegroundColor Green
