# Re-register all CyberBlackmail tasks to run hidden (no cmd/PowerShell popups).
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\task-common.ps1"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LauncherDir = Join-Path $env:LOCALAPPDATA "CyberBlackmail"

if (-not (Test-Path $LauncherDir)) {
  New-Item -ItemType Directory -Path $LauncherDir | Out-Null
}

[System.IO.File]::WriteAllText(
  (Join-Path $LauncherDir "config.txt"),
  $ProjectRoot,
  [System.Text.UTF8Encoding]::new($false)
)

$hourlyDst = Join-Path $LauncherDir "hourly.ps1"
$scamsDst = Join-Path $LauncherDir "scams-ingest.ps1"
$hiddenExecDst = Join-Path $LauncherDir "hidden-exec.ps1"
$startLtDst = Join-Path $LauncherDir "start-libretranslate.ps1"
Copy-Item (Join-Path $PSScriptRoot "hourly-runner.ps1") $hourlyDst -Force
Copy-Item (Join-Path $PSScriptRoot "scams-ingest-runner.ps1") $scamsDst -Force
Copy-Item (Join-Path $PSScriptRoot "hidden-exec.ps1") $hiddenExecDst -Force
$startLtSrc = Join-Path $PSScriptRoot "start-libretranslate.ps1"
if (Test-Path $startLtSrc) {
  Copy-Item $startLtSrc $startLtDst -Force
}

Register-HiddenScheduledTask -TaskName "CyberBlackmail-Ingest" `
  -ScriptPath (Join-Path $PSScriptRoot "auto-ingest.ps1") `
  -WorkingDirectory $ProjectRoot -Schedule Hourly

Register-HiddenScheduledTask -TaskName "CyberBlackmail-Translate" `
  -ScriptPath (Join-Path $PSScriptRoot "auto-translate.ps1") `
  -WorkingDirectory $ProjectRoot -Schedule Hours4

Register-HiddenScheduledTask -TaskName "CyberBlackmail-ProcessArticles" `
  -ScriptPath $hourlyDst `
  -WorkingDirectory $LauncherDir -Schedule Hourly

Register-HiddenScheduledTask -TaskName "CyberBlackmail-ScamsIngest15m" `
  -ScriptPath $scamsDst `
  -WorkingDirectory $LauncherDir -Schedule Minutes15

Write-Host "OK: all 4 tasks now run hidden (no console windows)."
Write-Host "  CyberBlackmail-Ingest          — every 1h"
Write-Host "  CyberBlackmail-Translate       — every 4h"
Write-Host "  CyberBlackmail-ProcessArticles — every 1h"
Write-Host "  CyberBlackmail-ScamsIngest15m  — every 15m"
Write-Host "Watchdog: double-click WATCHDOG-10H.bat (also hidden now)."
