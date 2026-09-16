$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$LogDir = Join-Path $ProjectRoot "logs"
$LogFile = Join-Path $LogDir "process-hourly.log"

if (-not (Test-Path $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir | Out-Null
}

function Write-Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Add-Content -Path $LogFile -Value $line
}

try {
  Write-Log "START process:local"

  if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Log "SKIP: ollama not in PATH"
    exit 0
  }

  Set-Location $ProjectRoot
  $output = npm run process:local 2>&1 | Out-String
  Write-Log $output.Trim()
  Write-Log "DONE"
} catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
