# Run cmd/npm/npx without showing a console window (for gaming / background tasks).

function Invoke-HiddenCmd {
  param(
    [Parameter(Mandatory)][string]$Command,
    [string]$WorkingDirectory = (Get-Location).Path
  )

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "cmd.exe"
  $psi.Arguments = "/d /s /c $Command"
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
  $psi.CreateNoWindow = $true
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
  $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

  $p = [System.Diagnostics.Process]::Start($psi)
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  return [PSCustomObject]@{
    Output   = ($stdout + $stderr).TrimEnd()
    ExitCode = $p.ExitCode
  }
}

function Invoke-HiddenNpm {
  param(
    [Parameter(Mandatory)][string]$NpmArgs,
    [string]$WorkingDirectory = (Get-Location).Path
  )
  return Invoke-HiddenCmd -Command "npm $NpmArgs" -WorkingDirectory $WorkingDirectory
}

function Invoke-HiddenNpx {
  param(
    [Parameter(Mandatory)][string]$NpxArgs,
    [string]$WorkingDirectory = (Get-Location).Path
  )
  return Invoke-HiddenCmd -Command "npx $NpxArgs" -WorkingDirectory $WorkingDirectory
}
