$ErrorActionPreference = "Stop"
. "$PSScriptRoot\hidden-exec.ps1"
$configPath = Join-Path $PSScriptRoot "config.txt"
if (-not (Test-Path $configPath)) {
  throw "Missing config: $configPath (run scripts/install-hourly-task.ps1)"
}

$projectRoot = (Get-Content $configPath -Encoding UTF8 -TotalCount 1).Trim()
$logDir = Join-Path $projectRoot "logs"
$logFile = Join-Path $logDir "process-hourly.log"

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

function Write-Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Add-Content -Path $logFile -Value $line -Encoding UTF8
}

try {
  Write-Log "START process:local"

  $startLt = Join-Path $PSScriptRoot "start-libretranslate.ps1"
  if (Test-Path $startLt) {
    Start-Process -WindowStyle Hidden -FilePath "powershell.exe" `
      -ArgumentList "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startLt`"" `
      -WorkingDirectory $PSScriptRoot | Out-Null
    Write-Log "LibreTranslate docker check done"
  }

  if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Log "SKIP: ollama not in PATH"
    exit 0
  }

  Set-Location $projectRoot

  $scamOut = (Invoke-HiddenNpm -NpmArgs "run scams:ingest" -WorkingDirectory $projectRoot).Output
  Write-Log "scams:ingest`n$($scamOut.Trim())"

  $output = (Invoke-HiddenNpm -NpmArgs "run process:local" -WorkingDirectory $projectRoot).Output
  Write-Log $output.Trim()
  Write-Log "DONE"
} catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
