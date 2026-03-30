# Frontend Integration Guide

Complete step-by-step guide to integrate the authentication system with your existing HTML forms.

---

## Table of Contents
1. [Overview](#overview)
2. [Login Page Integration](#login-page-integration)
3. [Signup Form Handling](#signup-form-handling)
4. [User Profile Display](#user-profile-display)
5. [Protected Pages](#protected-pages)
6. [Logout Functionality](#logout-functionality)
7. [Notification Display](#notification-display)
8. [Testing Checklist](#testing-checklist)

---

## Overview

The `auth-system.js` file provides a reusable `AuthSystem` class that handles all authentication logic. This guide shows how to integrate it with your HTML forms.

### What's Already Done
✅ `FR/login.html` - Script reference added
✅ `FR/auth-system.js` - Complete auth client created
✅ `app.py` - Flask server with API endpoints ready
✅ `database.py` - SQLite database with user storage ready

### What You Need to Do
1. Verify forms have proper HTML structure
2. Add event listeners to forms
3. Display user info when logged in
4. Test login/signup workflow

---

## Login Page Integration

### Current Form Structure (FR/login.html)

Your login.html should have this structure:

```html
<!-- Login Form -->
<div id="loginForm">
    <h2>Login</h2>
    <form id="form-login">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>
</div>

<!-- Signup Form (Hidden) -->
<div id="signupForm" style="display:none;">
    <h2>Sign Up</h2>
    <form id="form-signup">
        <input type="text" id="name" placeholder="Full Name" required>
        <input type="email" id="email-signup" placeholder="Email" required>
        <input type="password" id="password-signup" placeholder="Password (min 6 chars)" required>
        <input type="password" id="confirm-password" placeholder="Confirm Password" required>
        <button type="submit">Sign Up</button>
    </form>
</div>

<!-- Toggle Button -->
<button id="toggleForm" onclick="toggleForm()">Switch to Sign Up</button>

<!-- Notifications -->
<div id="authNotifications"></div>

<!-- Script -->
<script src="./auth-system.js"></script>
```

### How Auth-System.js Works

When the page loads, `auth-system.js` automatically:

1. **Creates AuthSystem instance**
```javascript
const authSystem = new AuthSystem();
```

2. **Attaches to form elements**
```javascript
const loginForm = document.getElementById('form-login');
const signupForm = document.getElementById('form-signup');
```

3. **Adds submit listeners**
- When login form submitted → calls `authSystem.login()`
- When signup form submitted → calls `authSystem.signup()`

4. **Stores user in localStorage**
```javascript
localStorage.setItem('discoverNepal_user', JSON.stringify(user));
```

### Testing Login Page

**Raw JavaScript Test:**
Open browser console (F12) and run:

```javascript
// Check if AuthSystem loaded
console.log(authSystem);

// Test login
await authSystem.login('john@test.com', 'password123');

// Check stored user
console.log(authSystem.getCurrentUser());
```

---

## Signup Form Handling

### Form Structure

Your signup form should include:

```html
<form id="form-signup">
    <!-- Full Name -->
    <div class="form-group">
        <label for="name">Full Name</label>
        <input 
            type="text" 
            id="name" 
            placeholder="John Doe"
            minlength="1"
            maxlength="100"
            required>
        <small>1-100 characters</small>
    </div>

    <!-- Email -->
    <div class="form-group">
        <label for="email-signup">Email</label>
        <input 
            type="email" 
            id="email-signup" 
            placeholder="john@example.com"
            required>
        <small>Must be valid email</small>
    </div>

    <!-- Password -->
    <div class="form-group">
        <label for="password-signup">Password</label>
        <input 
            type="password" 
            id="password-signup" 
            placeholder="••••••••"
            minlength="6"
            required>
        <small>Minimum 6 characters</small>
    </div>

    <!-- Confirm Password -->
    <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <input 
            type="password" 
            id="confirm-password" 
            placeholder="••••••••"
            minlength="6"
            required>
        <small>Must match password</small>
    </div>

    <!-- Submit Button -->
    <button type="submit" class="btn-primary">Create Account</button>
</form>
```

### Validation Flow

**Client-Side (Browser):**
1. Email format check
2. Password length (min 6)
3. Passwords match
4. Name not empty

**Server-Side (Flask):**
1. All client validation repeated
2. Email uniqueness check
3. Password hashed before storage

---

## User Profile Display

### Show Logged-In User Info

**After successful login, display user here:**

```html
<!-- Hidden when not logged in -->
<div id="userProfile" style="display:none;">
    <h3>Welcome, <span id="userName"></span>!</h3>
    <p>Email: <span id="userEmail"></span></p>
    <button onclick="logout()">Logout</button>
</div>

<!-- Hidden when logged in -->
<div id="authSection">
    <p>Please login or signup</p>
    <button onclick="toggleForm()">Login / Signup</button>
</div>
```

### Update Profile Display

**Add this JavaScript:**

```javascript
// After login/signup successful
function updateProfileDisplay() {
    if (authSystem.isLoggedIn()) {
        const user = authSystem.getCurrentUser();
        
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
        
        document.getElementById('userProfile').style.display = 'block';
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('form-login').style.display = 'none';
        document.getElementById('form-signup').style.display = 'none';
    } else {
        document.getElementById('userProfile').style.display = 'none';
        document.getElementById('authSection').style.display = 'block';
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', updateProfileDisplay);
```

---

## Protected Pages

### Redirect Non-Logged-In Users

**Add to the top of protected pages (e.g., user profile, dashboard):**

```javascript
// Page Protection
document.addEventListener('DOMContentLoaded', function() {
    const authSystem = new AuthSystem();
    
    if (!authSystem.isLoggedIn()) {
        // Redirect to login
        window.location.href = './login.html';
    } else {
        // User is logged in, proceed normally
        const user = authSystem.getCurrentUser();
        console.log('Welcome:', user.name);
    }
});
```

### Display User-Specific Content

```html
<h1 id="pageTitle"></h1>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const authSystem = new AuthSystem();
    const user = authSystem.getCurrentUser();
    
    if (user) {
        document.getElementById('pageTitle').textContent = 
            `Welcome back, ${user.name}!`;
    }
});
</script>
```

---

## Logout Functionality

### Add Logout Button

```html
<button onclick="handleLogout()" class="btn-logout">Logout</button>
```

### Logout Handler

```javascript
function handleLogout() {
    const authSystem = new AuthSystem();
    authSystem.logout();
    
    // Show message
    authSystem.showNotification('Logged out successfully', 'success');
    
    // Redirect to home
    setTimeout(() => {
        window.location.href = './index.html';
    }, 1000);
}
```

---

## Notification Display

### How Notifications Work

The AuthSystem automatically creates notifications:

```javascript
showNotification(message, type) {
    // type: 'success', 'error', or 'info'
}
```

### Notification HTML

The system creates this HTML automatically:

```html
<div id="authNotifications">
    <div class="notification success">
        <span>✓</span> Successfully logged in!
    </div>
</div>
```

### Styling Notifications

**Add to your CSS:**

```css
#authNotifications {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    z-index: 1000;
}

.notification {
    padding: 15px 20px;
    margin: 10px 0;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    animation: slideIn 0.3s ease;
}

.notification.success {
    background-color: #4CAF50;
}

.notification.error {
    background-color: #f44336;
}

.notification.info {
    background-color: #2196F3;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
```

---

## Testing Checklist

### Prerequisites
- [ ] Flask server running: `python app.py`
- [ ] Database initialized: `users.db` exists
- [ ] auth-system.js linked in login.html
- [ ] Browser console ready (F12)

### Test 1: Signup
- [ ] Navigate to login.html
- [ ] Click "Switch to Sign Up"
- [ ] Enter new user details
- [ ] Click "Create Account"
- [ ] See success notification
- [ ] Check browser console for stored user

### Test 2: Login
- [ ] Click "Switch to Login"
- [ ] Enter credentials
- [ ] Click "Login"
- [ ] See success notification
- [ ] User info appears (if display code added)
- [ ] Check localStorage for user object

### Test 3: Validation
- [ ] Try incomplete form (leave field blank)
- [ ] Try invalid email format
- [ ] Try password < 6 characters
- [ ] Try mismatched passwords
- [ ] See appropriate error messages

### Test 4: Error Handling
- [ ] Try login with wrong password
- [ ] Try signup with existing email
- [ ] Try login with non-existent email
- [ ] See appropriate error messages

### Test 5: Session Persistence
- [ ] Login successfully
- [ ] Refresh the page
- [ ] User should still be logged in
- [ ] Check localStorage persists

### Test 6: Logout
- [ ] Click logout button
- [ ] See logout message
- [ ] User should be removed from localStorage
- [ ] Profile section should hide

---

## Troubleshooting

### Problem: "Cannot POST /api/auth/login"
**Solution:** 
- Ensure Flask server running: `python app.py`
- Check server is on localhost:5000
- Check fetch URL in auth-system.js

### Problem: "Uncaught ReferenceError: authSystem is not defined"
**Solution:**
- Check auth-system.js script is loaded
- Check script tag location (before closing `</body>`)
- Check file path is correct

### Problem: LocalStorage not persisting
**Solution:**
- Check browser allows localStorage
- Don't use private/incognito mode
- Check console for errors

### Problem: CORS error
**Solution:**
- Ensure Flask-CORS is installed
- Check app.py has CORS(app) enabled
- Verify origin in config.py

### Problem: Database errors
**Solution:**
- Check users.db exists
- Delete if corrupted: `rm users.db; python database.py`
- Check database.py ran without errors

---

## Example: Complete Login Page

Here's a complete example you can use:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Login - Discover Nepal</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; }
        .auth-container { padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        #authNotifications { position: fixed; top: 20px; right: 20px; }
        .notification { padding: 15px; margin: 10px 0; border-radius: 4px; color: white; }
        .notification.success { background: #4CAF50; }
        .notification.error { background: #f44336; }
    </style>
</head>
<body>
    <div class="auth-container">
        <div id="Form-login">
            <h2>Login</h2>
            <form id="form-login">
                <input type="email" id="email" placeholder="Email" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
            <p><button onclick="toggleForm()" style="background: #6c757d;">Switch to Sign Up</button></p>
        </div>

        <div id="signupForm" style="display:none;">
            <h2>Sign Up</h2>
            <form id="form-signup">
                <input type="text" id="name" placeholder="Full Name" required>
                <input type="email" id="email-signup" placeholder="Email" required>
                <input type="password" id="password-signup" placeholder="Password" required>
                <input type="password" id="confirm-password" placeholder="Confirm Password" required>
                <button type="submit">Sign Up</button>
            </form>
            <p><button onclick="toggleForm()" style="background: #6c757d;">Switch to Login</button></p>
        </div>
    </div>

    <div id="authNotifications"></div>

    <script>
        function toggleForm() {
            const loginForm = document.getElementById('Form-login');
            const signupForm = document.getElementById('signupForm');
            
            if (loginForm.style.display === 'none') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
            }
        }
    </script>

    <script src="./auth-system.js"></script>
</body>
</html>
```

---

## Next Steps

1. **Verify Setup**
   - [ ] `python app.py` running
   - [ ] Open login.html in browser
   - [ ] Check console for errors

2. **Test Authentication**
   - [ ] Run test signup
   - [ ] Run test login
   - [ ] Verify database has new user

3. **Wire Up Pages**
   - [ ] Add profile display code
   - [ ] Add logout functionality
   - [ ] Protect pages if needed

4. **Polish UI**
   - [ ] Style auth notifications
   - [ ] Improve form styling
   - [ ] Add loading states

---

**Status:** Ready for integration  
**Last Updated:** March 30, 2024
