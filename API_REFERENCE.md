# API Quick Reference Guide

## Server Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Initialize database
python database.py

# Start server
python app.py
```

**Server URL:** `http://localhost:5000`

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/change-password` | Change user password |
| GET | `/api/users/<email>` | Get user details |
| GET | `/api/admin/users` | List all users |
| DELETE | `/api/admin/users/<email>` | Delete user |
| GET | `/api/health` | Health check |

---

## 1️⃣ Signup

**Endpoint:** `POST /api/auth/signup`

**Request:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirm_password": "password123"
}
```

**Success (201):**
```json
{
    "success": true,
    "message": "User created successfully"
}
```

**Error (400):**
```json
{
    "success": false,
    "message": "Email already registered"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123","confirm_password":"pass123"}'
```

---

## 2️⃣ Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Success (200):**
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

**Error (401):**
```json
{
    "success": false,
    "message": "Invalid password"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

---

## 3️⃣ Get User Details

**Endpoint:** `GET /api/users/{email}`

**Success (200):**
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

**cURL:**
```bash
curl http://localhost:5000/api/users/john@example.com
```

---

## 4️⃣ Change Password

**Endpoint:** `POST /api/auth/change-password`

**Request:**
```json
{
    "email": "john@example.com",
    "old_password": "password123",
    "new_password": "newpassword456",
    "confirm_password": "newpassword456"
}
```

**Success (200):**
```json
{
    "success": true,
    "message": "Password updated successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","old_password":"pass123","new_password":"newpass123","confirm_password":"newpass123"}'
```

---

## 5️⃣ List All Users (Admin)

**Endpoint:** `GET /api/admin/users`

**Success (200):**
```json
{
    "success": true,
    "count": 3,
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

**cURL:**
```bash
curl http://localhost:5000/api/admin/users
```

---

## 6️⃣ Delete User (Admin)

**Endpoint:** `DELETE /api/admin/users/{email}`

**Success (200):**
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

**cURL:**
```bash
curl -X DELETE http://localhost:5000/api/admin/users/john@example.com
```

---

## 7️⃣ Health Check

**Endpoint:** `GET /api/health`

**Success (200):**
```json
{
    "status": "Server is running",
    "version": "1.0"
}
```

**cURL:**
```bash
curl http://localhost:5000/api/health
```

---

## Frontend JavaScript Usage

### Initialize
```javascript
const authSystem = new AuthSystem();
```

### Signup
```javascript
const success = await authSystem.signup(
    'John Doe',
    'john@example.com',
    'password123',
    'password123'
);
```

### Login
```javascript
const success = await authSystem.login('john@example.com', 'password123');
if (success) {
    const user = authSystem.getCurrentUser();
    console.log(user);
}
```

### Check Login Status
```javascript
if (authSystem.isLoggedIn()) {
    const user = authSystem.getCurrentUser();
    console.log('Logged in as:', user.name);
}
```

### Logout
```javascript
authSystem.logout();
```

### Show Notification
```javascript
authSystem.showNotification('Success!', 'success');
authSystem.showNotification('Error!', 'error');
```

---

## Validation Rules

### Email
- ✓ Valid email format required
- ✓ Must be unique in database
- ✓ Can't be empty

### Password
- ✓ Minimum 6 characters
- ✓ Case-sensitive
- ✓ Must match confirmation
- ✓ Never stored in plain text

### Name
- ✓ 1-100 characters
- ✓ Can't be empty

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized / Invalid Credentials |
| 404 | Not Found |
| 500 | Server Error |

---

## Testing

### Run Test Suite
```bash
python test_api.py
```

### Manual Testing
1. Startup Flask server: `python app.py`
2. Signup test user
3. Login with credentials
4. Check user details
5. Change password
6. Login with new password

---

## Database Info

**File:** `users.db` (SQLite)

**Table:** `users`

**Columns:**
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- email (TEXT UNIQUE)
- password (TEXT - hashed)
- created_at (TIMESTAMP)
- last_login (TIMESTAMP)

---

## Common Issues

| Problem | Solution |
|---------|----------|
| Cannot connect to server | Ensure flask server running on port 5000 |
| Module not found | Run `pip install -r requirements.txt` |
| Database locked | Close other instances, delete users.db, reinitialize |
| Login fails | Verify email exists and password is correct |
| CORS errors | Check Frontend URL in allowed CORS origins |

---

## Configuration

**File:** `config.py`

Key settings:
- `SERVER_PORT` = 5000
- `PASSWORD_MIN_LENGTH` = 6
- `FLASK_DEBUG` = True (development)

---

## File Locations

```
Discover Nepal/
├── app.py                 # Flask server
├── database.py           # Database functions
├── test_api.py           # API tests
├── requirements.txt      # Dependencies
├── config.py             # Configuration
├── users.db              # SQLite database
├── FR/
│   ├── login.html        # Login page
│   └── auth-system.js    # Frontend auth
└── [documentation files]
```

---

## Quick Commands

```bash
# Start server
python app.py

# Initialize database
python database.py

# Run tests
python test_api.py

# Install/update dependencies
pip install -r requirements.txt

# Reset database
Remove-Item users.db; python database.py  # Windows
rm users.db; python database.py           # Unix/Mac

# Python environment check
python --version
pip list
```

---

## API Response Format

All responses follow this format:

**Success:**
```json
{
    "success": true,
    "message": "Operation successful",
    "data": {}
}
```

**Error:**
```json
{
    "success": false,
    "message": "Error description"
}
```

---

**Last Updated:** March 30, 2024  
**Version:** 1.0  
**Status:** ✅ Production Ready
