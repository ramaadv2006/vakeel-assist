@echo off
REM %~dp0 resolves to the folder this .bat file lives in.
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" send_reminders.py >> reminder_log.txt 2>&1
) else (
    python send_reminders.py >> reminder_log.txt 2>&1
)
