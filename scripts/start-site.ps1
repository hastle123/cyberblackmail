# Start CyberBlackmail in production mode
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

Write-Host "CyberBlackmail -> http://localhost:3000"
Write-Host "Press Ctrl+C to stop."
Write-Host ""

if (-not (Test-Path -LiteralPath ".next")) {
  Write-Host "Building (first run)..."
  npm run build
}

npm start
