# One-time setup: scheduled RSS ingest + desktop shortcut to start site
$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$IngestScript = Join-Path $ProjectRoot "scripts\auto-ingest.ps1"
$TranslateScript = Join-Path $ProjectRoot "scripts\auto-translate.ps1"
$StartScript = Join-Path $ProjectRoot "scripts\start-site.ps1"
$LogsDir = Join-Path $ProjectRoot "logs"

if (-not (Test-Path -LiteralPath $LogsDir)) {
  New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

function Register-HourlyTask {
  param(
    [string]$Name,
    [string]$ScriptPath,
    [int]$HoursInterval = 1
  )

  Unregister-ScheduledTask -TaskName $Name -Confirm:$false -ErrorAction SilentlyContinue

  $action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`"" `
    -WorkingDirectory $ProjectRoot

  $trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Hours $HoursInterval) `
    -RepetitionDuration (New-TimeSpan -Days 3650)

  Register-ScheduledTask `
    -TaskName $Name `
    -Action $action `
    -Trigger $trigger `
    -Settings (New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries) `
    -Force | Out-Null
}

Register-HourlyTask -Name "CyberBlackmail-Ingest" -ScriptPath $IngestScript -HoursInterval 1
Register-HourlyTask -Name "CyberBlackmail-Translate" -ScriptPath $TranslateScript -HoursInterval 4

$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut((Join-Path $Desktop "CyberBlackmail Site.lnk"))
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$StartScript`""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Description = "Start CyberBlackmail (localhost:3000)"
$Shortcut.Save()

Write-Host "OK: hourly ingest -> CyberBlackmail-Ingest"
Write-Host "OK: translate every 4h -> CyberBlackmail-Translate"
Write-Host "OK: desktop shortcut -> CyberBlackmail Site.lnk"
Write-Host "Project: $ProjectRoot"
