# Translate pending articles via Ollama (process:local)
$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\hidden-exec.ps1"
$LogDir = Join-Path $ProjectRoot "logs"
$LogFile = Join-Path $LogDir "translate.log"

if (-not (Test-Path -LiteralPath $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir | Out-Null
}

function Write-Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Add-Content -Path $LogFile -Value $line -Encoding utf8
}

try {
  Write-Log "START translate (process:local)"
  Set-Location -LiteralPath $ProjectRoot

  $ollamaOk = $false
  try {
    $null = & ollama list 2>$null
    if ($LASTEXITCODE -eq 0) { $ollamaOk = $true }
  } catch {
    $ollamaOk = $false
  }

  if (-not $ollamaOk) {
    Write-Log "SKIP: Ollama not running"
    exit 0
  }

  $env:TRANSLATE_MODE = "quality"
  $env:PROCESS_LIMIT = "10"

  $result = Invoke-HiddenNpm -NpmArgs "run process:local" -WorkingDirectory $ProjectRoot
  Write-Log $result.Output.Trim()

  if ($result.ExitCode -ne 0) {
    Write-Log "FAIL: npm exit code $($result.ExitCode)"
    exit $result.ExitCode
  }

  Write-Log "DONE"
  exit 0
} catch {
  Write-Log ("ERROR: " + $_.Exception.Message)
  exit 1
}
