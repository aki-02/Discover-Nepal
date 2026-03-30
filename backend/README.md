# Backend - Discover Nepal Authentication System

This folder contains the complete backend for the Discover Nepal authentication system built with Flask and SQLite.

## 📁 Files in This Folder

- **app.py** - Flask REST API server with authentication endpoints
- **database.py** - SQLite database layer with user management functions
- **config.py** - Configuration settings for the server
- **requirements.txt** - Python package dependencies
- **test_api.py** - Comprehensive API testing suite
- **quick-start.bat** - Automated setup script for Windows
- **quick-start.sh** - Automated setup script for macOS/Linux
- **users.db** - SQLite database (created after first run)

## 🚀 Quick Start

### Windows:
```bash
# Double-click quick-start.bat
# OR run from terminal:
quick-start.bat
```

### macOS/Linux:
```bash
chmod +x quick-start.sh
./quick-start.sh
```

### Manual Setup:
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Initialize database
python database.py

# 3. Start server
python app.py
```

The server will start at `http://localhost:5000`

## 📡 API Endpoints

All endpoints are prefixed with `/api`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/signup` | Create new user account |
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/change-password` | Change user password |
| GET | `/users/<email>` | Get user profile |
| GET | `/admin/users` | List all users |
| DELETE | `/admin/users/<email>` | Delete user |
| GET | `/health` | Server health check |

## 🧪 Testing

Run the test suite to verify all endpoints:

```bash
python test_api.py
```

Make sure the Flask server is running before testing!

## 🔒 Security Features

- ✅ Password hashing with Werkzeug PBKDF2
- ✅ Email validation (format + uniqueness)
- ✅ Input sanitization
- ✅ SQL injection prevention
- ✅ CORS headers enabled

## 📊 Database Schema

**Table: users**

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTO |
| name | TEXT | NOT NULL |
| email | TEXT | UNIQUE, NOT NULL |
| password | TEXT | NOT NULL (hashed) |
| created_at | TIMESTAMP | DEFAULT CURRENT |
| last_login | TIMESTAMP | NULL |

## ⚙️ Configuration

Edit `config.py` to customize:
- Server port (default: 5000)
- Debug mode (default: True)
- Password minimum length (default: 6)
- CORS allowed origins

## 📝 API Examples

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirm_password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 🛠️ Troubleshooting

**Port 5000 already in use:**
```bash
# Windows: Find process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux: Find and kill process
lsof -i :5000
kill -9 <PID>
```

**Database locked:**
- Delete `users.db` and reinitialize: `python database.py`

**Module not found error:**
- Install dependencies: `pip install -r requirements.txt`

**CORS errors:**
- Check that Frontend URL is in CORS_ORIGINS in `config.py`

## 📚 Documentation Files

In the parent directory, see:
- `FRONTEND_INTEGRATION.md` - How to integrate with frontend
- `API_REFERENCE.md` - Complete API reference
- `LOGIN_SYSTEM_README.md` - Full system documentation

## ✨ Features

- User registration with validation
- Secure login authentication
- Password management (change password)
- Session tracking (last login)
- Admin user management
- Comprehensive error handling
- CORS support for frontend integration

## 📦 Dependencies

- Flask 2.3.3 - Web framework
- Flask-CORS 4.0.0 - CORS support
- Werkzeug 2.3.7 - Security utilities (password hashing)

## 🔄 Development Workflow

1. Modify code in appropriate files
2. Server auto-reloads when changes detected (debug mode)
3. Check console for error messages
4. Run tests: `python test_api.py`
5. Test in frontend: Open login.html in browser

## 🚢 Production Deployment

Before deploying to production:

1. Set `FLASK_DEBUG = False` in `config.py`
2. Change `FLASK_ENV` to `production`
3. Use production WSGI server (Gunicorn, etc.)
4. Enable HTTPS/SSL
5. Set strong SECRET_KEY
6. Use PostgreSQL instead of SQLite (for scaling)
7. Set up proper logging
8. Configure environment variables

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API_REFERENCE.md
3. Run test_api.py to validate endpoints
4. Check browser console (F12) for frontend errors

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** March 30, 2024
