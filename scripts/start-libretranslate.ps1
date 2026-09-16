# Start LibreTranslate on :5000 (Docker preferred, pip fallback)
$ErrorActionPreference = "SilentlyContinue"
$docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

function Test-LibreTranslate {
  try {
    Invoke-RestMethod -Uri "http://127.0.0.1:5000/languages" -TimeoutSec 3 | Out-Null
    return $true
  } catch { return $false }
}

if (Test-LibreTranslate) { exit 0 }

if (Test-Path $docker) {
  & $docker info 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $existing = & $docker ps -a --filter "name=cyberblackmail-libretranslate" --format "{{.Names}}"
    if ($existing -eq "cyberblackmail-libretranslate") {
      & $docker start cyberblackmail-libretranslate | Out-Null
    } else {
      & $docker run -d --name cyberblackmail-libretranslate -p 5000:5000 --restart unless-stopped libretranslate/libretranslate:latest --load-only en,ru | Out-Null
    }
    Start-Sleep 5
    if (Test-LibreTranslate) { exit 0 }
  }
}

$libre = Get-Command libretranslate -ErrorAction SilentlyContinue
if ($libre) {
  $env:PYTHONIOENCODING = "utf-8"
  $env:PYTHONUTF8 = "1"
  Start-Process -WindowStyle Hidden -FilePath $libre.Source -ArgumentList @(
    "--host", "127.0.0.1", "--port", "5000", "--load-only", "en,ru", "--disable-web-ui"
  )
}
