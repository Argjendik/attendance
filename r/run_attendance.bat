@echo off
setlocal enabledelayedexpansion

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.8 or later
    pause
    exit /b 1
)

:: Check if already running
tasklist /FI "IMAGENAME eq RFIDAttendance.exe" 2>NUL | find /I /N "RFIDAttendance.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo RFID Attendance System is already running
    exit /b 0
)

:: Change to script directory
cd /d "%~dp0"

:: Check if required files exist
if not exist rfid_client.py (
    echo Error: rfid_client.py not found
    pause
    exit /b 1
)

if not exist config.json (
    echo Error: config.json not found
    pause
    exit /b 1
)

:: Try to start the application
:retry
start "" pythonw rfid_client.py
if errorlevel 1 (
    echo Failed to start RFID Attendance System
    choice /C YN /M "Would you like to retry?"
    if errorlevel 2 exit /b 1
    goto retry
)

exit /b 0 