@echo off
REM Quick Start Script for Discover Nepal Login System on Windows
REM Run this from the backend folder

echo ======================================
echo Discover Nepal - Backend Quick Start
echo ======================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python version:
python --version
echo.

echo Installing dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Initializing database...
python database.py

if errorlevel 1 (
    echo ERROR: Failed to initialize database
    pause
    exit /b 1
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Starting Flask server...
echo Server will run at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
python app.py

pause
