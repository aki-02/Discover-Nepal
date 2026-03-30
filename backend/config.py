# Configuration file for Discover Nepal Login System

# Flask Configuration
FLASK_ENV = development
FLASK_DEBUG = True
FLASK_APP = app.py

# Server Configuration
SERVER_PORT = 5000
SERVER_HOST = 0.0.0.0

# Database Configuration
DATABASE_FILE = users.db
DATABASE_TIMEOUT = 5.0

# Security Configuration
PASSWORD_MIN_LENGTH = 6
SESSION_TIMEOUT = 3600  # 1 hour in seconds

# Email Configuration
EMAIL_VALIDATION_ENABLED = True

# CORS Configuration
CORS_ORIGINS = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:3000',
    'http://localhost:8000'
]
