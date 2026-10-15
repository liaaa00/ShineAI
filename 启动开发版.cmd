@echo off
cd /d "%~dp0"
setlocal
set ELECTRON_RUN_AS_NODE=1
".runtime\electron\electron.exe" scripts\launch.mjs
if errorlevel 1 pause
