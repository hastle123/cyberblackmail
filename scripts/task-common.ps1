function Register-HiddenScheduledTask {
  param(
    [Parameter(Mandatory)][string]$TaskName,
    [Parameter(Mandatory)][string]$ScriptPath,
    [Parameter(Mandatory)][string]$WorkingDirectory,
    [ValidateSet("Hourly", "Minutes15", "Hours4")]
    [string]$Schedule = "Hourly"
  )

  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

  $action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`"" `
    -WorkingDirectory $WorkingDirectory

  $trigger = switch ($Schedule) {
    "Hourly" {
      New-ScheduledTaskTrigger `
        -Once `
        -At (Get-Date).AddMinutes(1) `
        -RepetitionInterval (New-TimeSpan -Hours 1) `
        -RepetitionDuration (New-TimeSpan -Days 3650)
    }
    "Minutes15" {
      New-ScheduledTaskTrigger `
        -Once `
        -At (Get-Date).AddMinutes(1) `
        -RepetitionInterval (New-TimeSpan -Minutes 15) `
        -RepetitionDuration (New-TimeSpan -Days 3650)
    }
    "Hours4" {
      New-ScheduledTaskTrigger `
        -Once `
        -At (Get-Date).AddMinutes(1) `
        -RepetitionInterval (New-TimeSpan -Hours 4) `
        -RepetitionDuration (New-TimeSpan -Days 3650)
    }
  }

  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings (New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable) `
    -Force | Out-Null
}
