' Launch watchdog with no visible window (style 0 = hidden).
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
root = fso.GetParentFolderName(WScript.ScriptFullName)
If fso.GetFileName(root) = "scripts" Then
  root = fso.GetParentFolderName(root)
End If
ps1 = root & "\scripts\watchdog.ps1"
cmd = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & ps1 & """ -Hours 10 -IntervalMinutes 15"
shell.Run cmd, 0, False
