$ErrorActionPreference = "Stop"
. "$PSScriptRoot\task-common.ps1"

$launcherDir = Join-Path $env:LOCALAPPDATA "CyberBlackmail"
$projectRoot = Split-Path $PSScriptRoot -Parent
$runnerDst = Join-Path $launcherDir "scams-ingest.ps1"
$configPath = Join-Path $launcherDir "config.txt"
$logPath = Join-Path $projectRoot "logs\scams-ingest.log"

if (-not (Test-Path $launcherDir)) {
  New-Item -ItemType Directory -Path $launcherDir | Out-Null
}

[System.IO.File]::WriteAllText($configPath, $projectRoot, [System.Text.UTF8Encoding]::new($false))
Copy-Item (Join-Path $PSScriptRoot "scams-ingest-runner.ps1") $runnerDst -Force
Copy-Item (Join-Path $PSScriptRoot "hidden-exec.ps1") (Join-Path $launcherDir "hidden-exec.ps1") -Force

Register-HiddenScheduledTask -TaskName "CyberBlackmail-ScamsIngest15m" `
  -ScriptPath $runnerDst `
  -WorkingDirectory $launcherDir -Schedule Minutes15

Write-Host "OK: CyberBlackmail-ScamsIngest15m runs every 15 minutes (hidden)."
Write-Host "Log: $logPath"
