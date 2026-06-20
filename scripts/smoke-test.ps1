param(
  [string]$ApiBase = "http://localhost:3000/api",
  [string]$TresorierEmail = "tresorier@cotadise.test",
  [string]$TresorierPassword = "Tresorier123!",
  [string]$EtudiantEmail = "ise1.alpha@cotadise.test",
  [string]$EtudiantPassword = "Etudiant123!"
)

$ErrorActionPreference = "Stop"
$results = New-Object System.Collections.Generic.List[object]
$adminToken = $null
$studentToken = $null
$yearId = $null
$friendId = $null

function Add-Result($Step, $Ok, $Detail) {
  $script:results.Add([pscustomobject]@{
    Etape = $Step
    OK = $Ok
    Detail = $Detail
  })
}

function Invoke-Step($Step, [scriptblock]$Block) {
  try {
    $detail = & $Block
    Add-Result $Step "OK" $detail
  } catch {
    Add-Result $Step "ECHEC" $_.Exception.Message
  }
}

function Invoke-Json($Method, $Path, $Token, $Body = $null) {
  $headers = @{}
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $options = @{
    Uri = "$ApiBase$Path"
    Method = $Method
    Headers = $headers
  }

  if ($null -ne $Body) {
    $options.ContentType = "application/json"
    $options.Body = ($Body | ConvertTo-Json -Depth 10)
  }

  Invoke-RestMethod @options
}

Invoke-Step "Sante backend et PostgreSQL" {
  $health = Invoke-Json "Get" "/health" $null
  "status=$($health.status), database=$($health.database), latence=$($health.databaseLatencyMs)ms"
}

Invoke-Step "Connexion tresorier" {
  $login = Invoke-Json "Post" "/auth/login" $null @{
    identifier = $TresorierEmail
    password = $TresorierPassword
  }
  $script:adminToken = $login.accessToken
  "role=$($login.user.role)"
}

Invoke-Step "Annees et previsualisation" {
  $years = Invoke-Json "Get" "/annees-academiques" $adminToken
  $script:yearId = @($years)[0].id
  $preview = Invoke-Json "Get" "/cotisations/generation-annuelle/previsualiser/$yearId" $adminToken
  "annees=$(@($years).Count), total=$($preview.total), manquants=$($preview.montantsManquants)"
}

Invoke-Step "Listes admin" {
  $users = Invoke-Json "Get" "/users" $adminToken
  $payments = Invoke-Json "Get" "/paiements" $adminToken
  $defis = Invoke-Json "Get" "/defis" $adminToken
  "users=$(@($users).Count), paiements=$(@($payments).Count), defis=$(@($defis).Count)"
}

Invoke-Step "Statut email" {
  $emailStatus = Invoke-Json "Get" "/emails/statut" $adminToken
  $pendingEmails = Invoke-Json "Get" "/emails/en-attente?limit=5" $adminToken
  "active=$($emailStatus.enabled), configure=$($emailStatus.configured), attente=$(@($pendingEmails).Count)"
}

Invoke-Step "Connexion etudiant" {
  $login = Invoke-Json "Post" "/auth/login" $null @{
    identifier = $EtudiantEmail
    password = $EtudiantPassword
  }
  $script:studentToken = $login.accessToken
  "role=$($login.user.role), niveau=$($login.user.level.name), wave=$($login.user.wavePhone)"
}

Invoke-Step "Espace etudiant" {
  $summary = Invoke-Json "Get" "/dashboard/me" $studentToken
  $cotisations = Invoke-Json "Get" "/cotisations/me" $studentToken
  $paiements = Invoke-Json "Get" "/paiements/me" $studentToken
  $notifications = Invoke-Json "Get" "/notifications/me" $studentToken
  "progression=$($summary.progress)%, cotisations=$(@($cotisations).Count), paiements=$(@($paiements).Count), alertes=$(@($notifications).Count)"
}

Invoke-Step "Recherche camarade et beneficiaire" {
  $friends = Invoke-Json "Get" "/users/camarades/recherche?q=ise1&levelId=ISE1" $studentToken
  $script:friendId = @($friends)[0].id
  $beneficiaryCotisations = Invoke-Json "Get" "/cotisations/beneficiaire/$friendId" $studentToken
  "camarades=$(@($friends).Count), cotisationsBeneficiaire=$(@($beneficiaryCotisations).Count)"
}

Invoke-Step "Defis etudiant" {
  $defis = Invoke-Json "Get" "/defis/me" $studentToken
  "defis=$(@($defis).Count)"
}

$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.OK -ne "OK" })
if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Smoke test echoue: $($failed.Count) etape(s) en erreur." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Smoke test CotaDISE reussi." -ForegroundColor Green
