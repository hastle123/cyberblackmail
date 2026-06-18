@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  CyberBlackmail — авто-настройка
echo  ================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows-automation.ps1"
if errorlevel 1 goto fail

echo.
echo  RSS sources...
call npm run ingest:setup
if errorlevel 1 goto fail

echo.
echo  Первая загрузка новостей...
call npm run ingest
if errorlevel 1 goto fail

echo.
echo  ================================
echo  Готово!
echo  - Новости: каждый час (Планировщик Windows)
echo  - Перевод: каждые 4 часа
echo  - Запуск сайта: START.bat или ярлык на рабочем столе
echo  - Сайт: http://localhost:3000
echo  ================================
echo.
pause
exit /b 0

:fail
echo.
echo  Ошибка. Запусти от имени администратора, если не создались задачи в Планировщике.
pause
exit /b 1
