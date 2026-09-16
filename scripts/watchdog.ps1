# Авто-надзор: ingest, перевод, сайт. По умолчанию 10 часов, цикл каждые 15 мин.
param(
  [int]$Hours = 10,
  [int]$IntervalMinutes = 15
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
. "$PSScriptRoot\hidden-exec.ps1"
$LogDir = Join-Path $ProjectRoot "logs"
$LogFile = Join-Path $LogDir "watchdog.log"
$Deadline = (Get-Date).AddHours($Hours)

if (-not (Test-Path $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir | Out-Null
}

function Write-Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Write-Host $line
  for ($i = 0; $i -lt 5; $i++) {
    try {
      Add-Content -Path $LogFile -Value $line -Encoding UTF8 -ErrorAction Stop
      return
    } catch {
      Start-Sleep -Milliseconds (200 * ($i + 1))
    }
  }
  # Log file may be open in editor — don't crash the watchdog
  Write-Host "(log write skipped: file locked)"
}

Write-Log "WATCHDOG START - do $Deadline, interval ${IntervalMinutes} min"

Set-Location $ProjectRoot

while ((Get-Date) -lt $Deadline) {
  Write-Log "=== cycle ==="

  # 1. RSS + scams
  foreach ($cmd in @("ingest", "scams:ingest")) {
    try {
      $out = (Invoke-HiddenNpm -NpmArgs "run $cmd" -WorkingDirectory $ProjectRoot).Output
      if ($out -match '"created":\s*(\d+)') {
        Write-Log "$cmd created: $($Matches[1])"
      } else {
        Write-Log "$cmd ok"
      }
      if ($out -match '"created":\s*[1-9]\d*') {
        Write-Log "NEW articles - running translation"
        $env:TRANSLATE_MODE = "quality"
        $env:PROCESS_LIMIT = "20"
        $tr = (Invoke-HiddenNpm -NpmArgs "run process:local" -WorkingDirectory $ProjectRoot).Output
        $tail = ($tr.Trim().Split([Environment]::NewLine) | Select-Object -Last 3) -join [Environment]::NewLine
        Write-Log $tail
      }
    } catch {
      Write-Log "$cmd ERROR: $($_.Exception.Message)"
    }
  }

  # 2. Статистика БД
  try {
    $stats = (Invoke-HiddenNpx -NpxArgs "tsx --env-file=.env.local scripts/ru-stats.ts" -WorkingDirectory $ProjectRoot).Output
    Write-Log ($stats.Trim())
  } catch {
    Write-Log "ru-stats ERROR: $($_.Exception.Message)"
  }

  # 3. Локальный сайт
  try {
    $site = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 8 -UseBasicParsing -ErrorAction Stop
    Write-Log "localhost:3000 HTTP $($site.StatusCode)"
  } catch {
    Write-Log "localhost:3000 OFF - starting npm run dev"
    Start-Process -WindowStyle Hidden -WorkingDirectory $ProjectRoot -FilePath "cmd.exe" -ArgumentList "/c npm run dev"
    Start-Sleep -Seconds 15
  }

  # 4. Ollama (для перевода)
  try {
    Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5 | Out-Null
    Write-Log "Ollama OK"
  } catch {
    Write-Log "Ollama OFF - translation unavailable"
  }

  $left = [math]::Round(($Deadline - (Get-Date)).TotalMinutes)
  Write-Log "Next check in $IntervalMinutes min (~$left min left)"
  Start-Sleep -Seconds ($IntervalMinutes * 60)
}

Write-Log "WATCHDOG FINISHED"
