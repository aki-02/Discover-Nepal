"""Configuration for Discover Nepal backend."""

import os


def _read_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


def _read_csv(value):
    if not value:
        return []
    return [item.strip() for item in value.split(',') if item.strip()]


# Flask Configuration
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
FLASK_DEBUG = _read_bool(os.getenv('FLASK_DEBUG'), True)
FLASK_APP = os.getenv('FLASK_APP', 'app.py')

# Server Configuration
SERVER_PORT = int(os.getenv('SERVER_PORT', '5000'))
SERVER_HOST = os.getenv('SERVER_HOST', '0.0.0.0')

# Database Configuration
DATABASE_FILE = os.getenv('DATABASE_FILE', 'users.db')
DATABASE_TIMEOUT = float(os.getenv('DATABASE_TIMEOUT', '5.0'))

# Security Configuration
PASSWORD_MIN_LENGTH = int(os.getenv('PASSWORD_MIN_LENGTH', '6'))
SESSION_TIMEOUT = int(os.getenv('SESSION_TIMEOUT', '3600'))  # 1 hour in seconds

# JWT Settings
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'discover-nepal-dev-secret-change-me')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_ACCESS_TOKEN_EXPIRES_MINUTES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', '120'))

# Admin bootstrap list (comma-separated emails in env)
ADMIN_BOOTSTRAP_EMAILS = _read_csv(os.getenv('ADMIN_BOOTSTRAP_EMAILS', 'admin@discovernepal.com'))

# Email Configuration
EMAIL_VALIDATION_ENABLED = _read_bool(os.getenv('EMAIL_VALIDATION_ENABLED'), True)

# CORS Configuration
CORS_ORIGINS = "*"
