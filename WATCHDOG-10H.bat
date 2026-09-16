@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  CyberBlackmail — автонадзор 10 часов (фон, без окон)
echo  Лог: logs\watchdog.log
echo.
wscript.exe "%~dp0scripts\watchdog-hidden.vbs"
echo  Запущен в фоне. Окно можно закрыть.
timeout /t 3 >nul
