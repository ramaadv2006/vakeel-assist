@echo off
REM %~dp0 always resolves to the folder this .bat file lives in, so this
REM works no matter where the project is cloned/moved - do not hardcode
REM an absolute path here.
cd /d "%~dp0"
python send_reminders.py >> reminder_log.txt 2>&1
