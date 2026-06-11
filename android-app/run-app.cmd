@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-app.ps1" %*
endlocal
