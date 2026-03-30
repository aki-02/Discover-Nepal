#!/bin/bash
# Quick Start Script for Discover Nepal Login System on macOS/Linux
# Run this from the backend folder

echo "======================================"
echo "Discover Nepal - Backend Quick Start"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

echo "Python version:"
python3 --version
echo ""

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "ERROR: pip3 is not installed. Please install pip."
    exit 1
fi

echo "Installing dependencies..."
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "Initializing database..."
python3 database.py

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to initialize database"
    exit 1
fi

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Starting Flask server..."
echo "Server will run at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 app.py
