$ErrorActionPreference = "Stop"
. "$PSScriptRoot\task-common.ps1"

$launcherDir = Join-Path $env:LOCALAPPDATA "CyberBlackmail"
$projectRoot = Split-Path $PSScriptRoot -Parent
$runnerDst = Join-Path $launcherDir "hourly.ps1"
$configPath = Join-Path $launcherDir "config.txt"
$logPath = Join-Path $projectRoot "logs\process-hourly.log"

if (-not (Test-Path $launcherDir)) {
  New-Item -ItemType Directory -Path $launcherDir | Out-Null
}

[System.IO.File]::WriteAllText($configPath, $projectRoot, [System.Text.UTF8Encoding]::new($false))
Copy-Item (Join-Path $PSScriptRoot "hourly-runner.ps1") $runnerDst -Force
Copy-Item (Join-Path $PSScriptRoot "hidden-exec.ps1") (Join-Path $launcherDir "hidden-exec.ps1") -Force
$startLtSrc = Join-Path $PSScriptRoot "start-libretranslate.ps1"
if (Test-Path $startLtSrc) {
  Copy-Item $startLtSrc (Join-Path $launcherDir "start-libretranslate.ps1") -Force
}

Register-HiddenScheduledTask -TaskName "CyberBlackmail-ProcessArticles" `
  -ScriptPath $runnerDst `
  -WorkingDirectory $launcherDir -Schedule Hourly

Write-Host "OK: CyberBlackmail-ProcessArticles runs every hour (hidden)."
Write-Host "Log: $logPath"
