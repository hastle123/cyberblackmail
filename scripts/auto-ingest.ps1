# Hourly RSS ingest — run from Task Scheduler (hidden window)
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\hidden-exec.ps1"
Set-Location -LiteralPath $ProjectRoot

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Error "npm not found in PATH"
}

(Invoke-HiddenNpm -NpmArgs "run ingest" -WorkingDirectory $ProjectRoot).Output |
  Out-File -FilePath "$ProjectRoot\logs\ingest.log" -Append -Encoding utf8
