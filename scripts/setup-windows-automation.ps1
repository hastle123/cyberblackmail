# One-time setup: scheduled RSS ingest + desktop shortcut to start site
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\task-common.ps1"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$IngestScript = Join-Path $ProjectRoot "scripts\auto-ingest.ps1"
$TranslateScript = Join-Path $ProjectRoot "scripts\auto-translate.ps1"
$StartScript = Join-Path $ProjectRoot "scripts\start-site.ps1"
$LogsDir = Join-Path $ProjectRoot "logs"

if (-not (Test-Path -LiteralPath $LogsDir)) {
  New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

Register-HiddenScheduledTask -TaskName "CyberBlackmail-Ingest" `
  -ScriptPath $IngestScript -WorkingDirectory $ProjectRoot -Schedule Hourly

Register-HiddenScheduledTask -TaskName "CyberBlackmail-Translate" `
  -ScriptPath $TranslateScript -WorkingDirectory $ProjectRoot -Schedule Hours4

$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut((Join-Path $Desktop "CyberBlackmail Site.lnk"))
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$StartScript`""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Description = "Start CyberBlackmail (localhost:3000)"
$Shortcut.Save()

Write-Host "OK: hourly ingest -> CyberBlackmail-Ingest"
Write-Host "OK: translate every 4h -> CyberBlackmail-Translate"
Write-Host "OK: desktop shortcut -> CyberBlackmail Site.lnk"
Write-Host "Project: $ProjectRoot"
