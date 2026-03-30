# Discover Nepal - Login System Setup Guide

## Overview
This document provides complete instructions for setting up and running the login/authentication system for the Discover Nepal project.

## Technology Stack
- **Backend:** Python with Flask
- **Database:** SQLite
- **Frontend:** HTML, CSS, JavaScript
- **Password Hashing:** Werkzeug Security

## Prerequisites
- Python 3.7 or higher
- pip (Python package manager)
- Git (optional)

## Installation Steps

### 1. Install Python Dependencies

Open PowerShell in the project directory and run:

```powershell
pip install -r requirements.txt
```

**Required packages:**
- Flask 2.3.3 - Web framework
- Flask-CORS 4.0.0 - Cross-Origin Resource Sharing
- Werkzeug 2.3.7 - Security utilities

### 2. Initialize the Database

Run the database initialization script:

```powershell
python database.py
```

This will create `users.db` file in the project root with the users table.

### 3. Start the Flask Server

Run the Flask application:

```powershell
python app.py
```

You should see:
```
Starting Discover Nepal API Server...
Server running at http://localhost:5000
```

**The server must be running for the login system to work!**

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
)
```

**Columns:**
- `id` - Unique user identifier
- `name` - User's full name
- `email` - User's email (must be unique)
- `password` - Hashed password (not stored in plain text)
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp

## API Endpoints

### 1. User Signup
**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirm_password": "password123"
}
```

**Success Response (201):**
```json
{
    "success": true,
    "message": "User created successfully"
}
```

**Error Response (400):**
```json
{
    "success": false,
    "message": "Email already registered"
}
```

### 2. User Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Login successful",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    }
}
```

**Error Response (401):**
```json
{
    "success": false,
    "message": "Invalid password"
}
```

### 3. Get User Details
**Endpoint:** `GET /api/users/<email>`

**Success Response (200):**
```json
{
    "success": true,
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2024-03-30 10:30:00",
        "last_login": "2024-03-30 11:00:00"
    }
}
```

### 4. Change Password
**Endpoint:** `POST /api/auth/change-password`

**Request Body:**
```json
{
    "email": "john@example.com",
    "old_password": "password123",
    "new_password": "newpassword123",
    "confirm_password": "newpassword123"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Password updated successfully"
}
```

### 5. Health Check
**Endpoint:** `GET /api/health`

**Success Response (200):**
```json
{
    "status": "Server is running",
    "version": "1.0"
}
```

### 6. List All Users (Admin)
**Endpoint:** `GET /api/admin/users`

**Success Response (200):**
```json
{
    "success": true,
    "count": 5,
    "users": [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "created_at": "2024-03-30 10:30:00",
            "last_login": "2024-03-30 11:00:00"
        }
    ]
}
```

### 7. Delete User (Admin)
**Endpoint:** `DELETE /api/admin/users/<email>`

**Success Response (200):**
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

## Frontend Integration

### Using the Auth System

The `auth-system.js` file in the `FR/` folder provides the `AuthSystem` class for frontend integration.

#### Example: Login
```javascript
const authSystem = new AuthSystem();

// Login
const success = await authSystem.login('user@example.com', 'password123');
if (success) {
    console.log('Logged in as:', authSystem.getCurrentUser());
}
```

#### Example: Signup
```javascript
const success = await authSystem.signup('John Doe', 'john@example.com', 'password123', 'password123');
if (success) {
    console.log('Account created successfully');
}
```

#### Check User Status
```javascript
if (authSystem.isLoggedIn()) {
    const user = authSystem.getCurrentUser();
    console.log('Welcome,', user.name);
} else {
    console.log('Please log in');
}
```

#### Logout
```javascript
authSystem.logout();
```

### Local Storage
User information is stored in browser's localStorage under the key `discoverNepal_user` for persistence across sessions.

## Security Features

1. **Password Hashing:** All passwords are hashed using Werkzeug's security utilities (PBKDF2)
2. **Email Validation:** Email format is validated on both frontend and backend
3. **Unique Emails:** Database constraint ensures each email is unique
4. **CORS Protection:** Flask-CORS handles cross-origin requests safely
5. **Input Validation:** All user inputs are validated before processing
6. **SQL Injection Prevention:** Using parameterized queries with sqlite3

## Validation Rules

### Email
- Must be valid email format (user@domain.com)
- Must be unique in database

### Password
- Minimum 6 characters
- Case-sensitive
- Must match confirmation password during signup

### Name
- Required, non-empty
- Maximum 100 characters

## File Structure

```
Discover Nepal/
├── app.py                 # Flask application with API endpoints
├── database.py           # Database functions and schema
├── requirements.txt      # Python dependencies
├── users.db             # SQLite database (created after first run)
├── README.md            # Setup guide
└── FR/
    ├── login.html       # Login page
    ├── auth-system.js   # Frontend auth client
    └── ... other files
```

## Troubleshooting

### Server Not Starting
- Ensure Python is installed: `python --version`
- Check all required packages: `pip list`
- Look for error messages in terminal

### "Cannot connect to server" Error
- Ensure Flask server is running on localhost:5000
- Check if port 5000 is not blocked by firewall
- Try accessing http://localhost:5000/api/health

### Database Errors
- Delete `users.db` and run `python database.py` again
- Check database file permissions
- Ensure disk space is available

### Login Not Working
- Verify email exists in database
- Check password is correct
- Ensure backend server is running
- Open browser console (F12) for detailed error messages

## Testing the System

### Via Python Script
```python
from database import init_db, create_user, verify_user

init_db()
success, msg = create_user('Test User', 'test@example.com', 'password123')
print(f"Create user: {success} - {msg}")

success, msg = verify_user('test@example.com', 'password123')
print(f"Login: {success} - {msg}")
```

### Via cURL (Command Line)
```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123","confirm_password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Database Backup

To backup your users database:
```powershell
Copy-Item users.db users.db.backup
```

To restore:
```powershell
Copy-Item users.db.backup users.db
```

## Common Tasks

### Reset Database
```powershell
Remove-Item users.db
python database.py
```

### View All Users
```python
from database import get_all_users
users = get_all_users()
for user in users:
    print(user)
```

### Delete Specific User
```python
from database import delete_user
success, msg = delete_user('email@example.com')
print(msg)
```

### Change User Password
```python
from database import update_user_password
success, msg = update_user_password('email@example.com', 'newpassword')
print(msg)
```

## Production Considerations

Before deploying to production:

1. **Disable Debug Mode:** Set `debug=False` in app.py
2. **Use Environment Variables:** Store sensitive data in .env file
3. **Add Rate Limiting:** Protect against brute force attacks
4. **Use HTTPS:** Always use SSL/TLS in production
5. **Database Backup:** Implement regular backups
6. **Logging:** Add comprehensive logging for debugging
7. **Authentication Tokens:** Consider adding JWT tokens for sessions
8. **CORS Configuration:** Specify allowed origins instead of allowing all

## Support & Documentation

- Flask: https://flask.palletsprojects.com/
- SQLite: https://www.sqlite.org/
- Werkzeug: https://werkzeug.palletsprojects.com/

## License

This login system is part of the Discover Nepal project.

---

**Version:** 1.0
**Last Updated:** March 30, 2024
