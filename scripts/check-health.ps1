param(
  [string]$HealthUrl = "http://localhost:3000/api/health",
  [int]$TimeoutSeconds = 15
)

$ErrorActionPreference = "Stop"

try {
  $response = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec $TimeoutSeconds
  if ($response.status -ne "ok" -or $response.database -ne "up") {
    throw "Etat inattendu: status=$($response.status), database=$($response.database)"
  }
  Write-Host "CotaDISE operationnel" -ForegroundColor Green
  Write-Host "Base: $($response.database) | Latence: $($response.databaseLatencyMs) ms | Uptime: $($response.uptimeSeconds) s"
  exit 0
} catch {
  Write-Host "CotaDISE indisponible: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
