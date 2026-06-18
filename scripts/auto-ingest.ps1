# Hourly RSS ingest — run from Task Scheduler
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Error "npm not found in PATH"
}

& npm run ingest 2>&1 | Out-File -FilePath "$ProjectRoot\logs\ingest.log" -Append -Encoding utf8
