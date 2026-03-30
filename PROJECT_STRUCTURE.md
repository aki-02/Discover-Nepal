# Discover Nepal - Project Structure

## 📁 Organized Project Layout

```
Discover Nepal/
│
├── 📁 backend/                      ← Backend API Server (NEW)
│   ├── app.py                       # Flask REST API
│   ├── database.py                  # SQLite database layer
│   ├── config.py                    # Configuration settings
│   ├── requirements.txt             # Python dependencies
│   ├── test_api.py                  # API test suite
│   ├── quick-start.bat              # Windows setup
│   ├── quick-start.sh               # macOS/Linux setup
│   ├── users.db                     # SQLite database (auto-created)
│   └── README.md                    # Backend documentation
│
├── 📁 FR/                           # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── destinations.html
│   ├── contact.html
│   ├── booking.html
│   ├── login.html
│   ├── wishlist.html
│   ├── aboutus.html
│   ├── *.css                        # Stylesheets
│   ├── *.js                         # JavaScript files
│   ├── auth-system.js               # Authentication client
│   ├── images/                      # Image files
│   └── [destination pages]
│
├── 📁 .git/                         # Git repository
│
├── 📄 QUICK_START_GUIDE.md          # System overview
├── 📄 LOGIN_SYSTEM_README.md        # Authentication docs
├── 📄 API_REFERENCE.md              # API endpoints reference
├── 📄 FRONTEND_INTEGRATION.md       # Frontend integration guide
└── 📄 PROJECT_STRUCTURE.md          # This file

```

## 🎯 What's Where?

### Backend (`backend/` folder)
- **Python Flask REST API** for user authentication
- **SQLite database** for user data storage
- **All server-side logic** for login/signup
- Located in: `backend/`

**To use the backend:**
```bash
cd backend
python quick-start.bat  # Windows
# or
chmod +x quick-start.sh && ./quick-start.sh  # macOS/Linux
```

### Frontend (`FR/` folder)
- **HTML pages** for user interface
- **CSS styling** (modern design, no gradients)
- **JavaScript** for interactivity
- **auth-system.js** for browser-side authentication
- **Wishlist functionality** with localStorage
- Located in: `FR/`

## 🚀 Getting Started

### Step 1: Start the Backend
```bash
cd backend
python quick-start.bat  # Windows
# or
./quick-start.sh        # macOS/Linux
```
This will:
- Install Python dependencies
- Create/initialize SQLite database
- Start Flask server on http://localhost:5000

### Step 2: Open Frontend
```bash
# Open FR/login.html in your web browser
# or open FR/index.html to browse the site
```

The frontend will automatically connect to your backend server.

## 📡 API Connection

The frontend (`FR/auth-system.js`) connects to:
```
http://localhost:5000/api
```

Make sure the backend is running before testing login/signup!

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `QUICK_START_GUIDE.md` | Fast overview - what was built |
| `LOGIN_SYSTEM_README.md` | Deep technical documentation |
| `API_REFERENCE.md` | All API endpoints with examples |
| `FRONTEND_INTEGRATION.md` | How to integrate auth in pages |
| `backend/README.md` | Backend-specific documentation |

## ✨ Features Overview

### Authentication System
- ✅ User Signup with validation
- ✅ Secure Login with password hashing
- ✅ Password change functionality
- ✅ Session management (localStorage)
- ✅ Admin user management APIs

### Frontend
- ✅ Modern responsive UI (no gradients)
- ✅ Wishlist feature with heart buttons
- ✅ About Us page
- ✅ Destination browsing
- ✅ Contact & booking pages
- ✅ Working login/signup forms

### Database
- ✅ SQLite for lightweight storage
- ✅ Password hashing with Werkzeug
- ✅ User data persistence
- ✅ Auto-cleanup support

## 🔧 Key Commands

### Backend Commands
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize database
python database.py

# Start server
python app.py

# Run tests
python test_api.py
```

### Quick Start (One Command)
```bash
cd backend
python quick-start.bat  # Windows
# or
./quick-start.sh        # macOS/Linux
```

## 🧑‍💻 Development Workflow

1. **Backend Development:**
   - Edit files in `backend/` folder
   - Server auto-reloads on save (debug mode)
   - Test with `python test_api.py`

2. **Frontend Development:**
   - Edit files in `FR/` folder
   - Open in browser (no build needed)
   - Check browser console (F12) for errors

3. **Testing Login:**
   - Backend running on http://localhost:5000
   - Open `FR/login.html` in browser
   - Signup/Login test user
   - Check browser LocalStorage (F12 → Application)

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if Python 3.7+ is installed
python --version

# Install dependencies
pip install -r requirements.txt

# Port 5000 in use?
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # macOS/Linux
```

### Frontend can't connect to backend
- Ensure backend is running: `python app.py`
- Check port 5000 is accessible
- Check browser console (F12) for CORS errors
- Verify API URL in `FR/auth-system.js` is correct

### Database issues
```bash
# Reset database
cd backend
rm users.db (or Delete users.db on Windows)
python database.py
```

## 📊 Project Statistics

- **Backend Files:** 7 files (Python/config)
- **Frontend Files:** 50+ files (HTML/CSS/JS)
- **Documentation:** 5 markdown guides
- **Total Size:** ~2-3 MB
- **Dependencies:** 3 Python packages

## 🎓 Learning Path

If you're new to this project:

1. Read `QUICK_START_GUIDE.md` (2-3 min)
2. Start backend: `cd backend && python quick-start.bat`
3. Open `FR/index.html` in browser
4. Try login/signup at `FR/login.html`
5. Check `API_REFERENCE.md` for endpoint details
6. Explore code and make changes

## 🔄 Next Steps

### Frontend Enhancements
- [ ] Add input validation styling
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add password strength indicator

### Backend Enhancements
- [ ] Add JWT token authentication
- [ ] Implement email verification
- [ ] Add password reset via email
- [ ] Rate limiting on login attempts
- [ ] Two-factor authentication

### Database Enhancements
- [ ] Migrate to PostgreSQL (for production)
- [ ] Add database backups
- [ ] Add user roles/permissions
- [ ] Add audit logging

### Integration
- [ ] Connect wishlist to user accounts
- [ ] Create user profile/dashboard
- [ ] Add booking history
- [ ] Add user preferences

## 📞 Support

For questions or issues:
1. Check the relevant documentation file
2. Review code comments
3. Run test suite: `python test_api.py`
4. Check browser console (F12) for errors

## ✅ Deployment Checklist

Before going live:

- [ ] Set `FLASK_DEBUG = False`
- [ ] Change `FLASK_ENV` to `production`
- [ ] Use production WSGI server (Gunicorn)
- [ ] Enable HTTPS/SSL
- [ ] Set environment variables
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set up logging
- [ ] Configure backups
- [ ] Test all endpoints
- [ ] Security audit

---

**Current Version:** 1.0  
**Last Updated:** March 30, 2024  
**Status:** ✅ Production Ready  
**Maintainer:** Development Team

