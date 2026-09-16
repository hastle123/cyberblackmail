$ErrorActionPreference = "Stop"
. "$PSScriptRoot\hidden-exec.ps1"
$configPath = Join-Path $PSScriptRoot "config.txt"

$projectRoot = (Get-Content $configPath -Encoding UTF8 -TotalCount 1).Trim()
$logDir = Join-Path $projectRoot "logs"
$logFile = Join-Path $logDir "scams-ingest.log"

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

function Write-Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Add-Content -Path $logFile -Value $line -Encoding UTF8
}

try {
  Write-Log "START scams:ingest"
  Set-Location $projectRoot
  $out = (Invoke-HiddenNpm -NpmArgs "run scams:ingest" -WorkingDirectory $projectRoot).Output
  Write-Log $out.Trim()
  Write-Log "DONE"
} catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
