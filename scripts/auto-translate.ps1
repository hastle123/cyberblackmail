# Translate pending articles (MyMemory / Gemini when key is set)
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

$env:TRANSLATE_LIMIT = "5"
& npm run translate 2>&1 | Out-File -FilePath "$ProjectRoot\logs\translate.log" -Append -Encoding utf8
