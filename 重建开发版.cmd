@echo off
setlocal
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=1
".runtime\electron\electron.exe" scripts\build.mjs
if errorlevel 1 pause
