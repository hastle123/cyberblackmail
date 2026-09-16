# LibreTranslate local server (unlimited, backup for Ollama)
# Requires Docker Desktop: https://www.docker.com/products/docker-desktop/

$ErrorActionPreference = "Stop"

Write-Host "Checking Docker..."
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker is not running. Install Docker Desktop and retry."
  exit 1
}

$existing = docker ps -a --filter "name=cyberblackmail-libretranslate" --format "{{.Names}}"
if ($existing -eq "cyberblackmail-libretranslate") {
  Write-Host "Container exists - starting..."
  docker start cyberblackmail-libretranslate | Out-Null
} else {
  Write-Host "Starting LibreTranslate at http://127.0.0.1:5000 ..."
  docker run -d `
    --name cyberblackmail-libretranslate `
    -p 5000:5000 `
    --restart unless-stopped `
    libretranslate/libretranslate:latest
}

Write-Host ""
Write-Host "Done. Add to .env.local:"
Write-Host "  LIBRETRANSLATE_URL=http://127.0.0.1:5000"
Write-Host "  TRANSLATE_MODE=dual"
Write-Host ""
Write-Host "Test: npm run translate:test"
