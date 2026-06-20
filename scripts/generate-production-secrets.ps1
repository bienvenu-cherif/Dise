param(
  [int]$Bytes = 48
)

$ErrorActionPreference = "Stop"

if ($Bytes -lt 32) {
  throw "Utiliser au moins 32 octets pour les secrets de production."
}

function New-Secret([int]$Size) {
  $bytes = New-Object byte[] $Size
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  return [Convert]::ToBase64String($bytes)
}

$jwtSecret = New-Secret $Bytes
$appSecret = New-Secret $Bytes
$waveEncryptionKey = New-Secret $Bytes

Write-Host "Secrets CotaDISE generes localement. Ne pas les partager." -ForegroundColor Green
Write-Host ""
Write-Host "JWT_SECRET=$jwtSecret"
Write-Host "APP_SECRET=$appSecret"
Write-Host "WAVE_CONFIG_ENCRYPTION_KEY=$waveEncryptionKey"
Write-Host ""
Write-Host "Copier ces valeurs dans cotadise-backend\\.env ou dans les variables secretes de l'hebergeur."
