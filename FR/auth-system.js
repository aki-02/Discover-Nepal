// Login and Signup System Handler

const API_URL = 'http://localhost:5000/api';

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.loadUserFromStorage();
    }

    // Load user from localStorage
    loadUserFromStorage() {
        const storedUser = localStorage.getItem('discoverNepal_user');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
            } catch (e) {
                console.error('Error parsing stored user:', e);
                localStorage.removeItem('discoverNepal_user');
            }
        }
    }

    // Save user to localStorage
    saveUserToStorage(user) {
        localStorage.setItem('discoverNepal_user', JSON.stringify(user));
        this.currentUser = user;
    }

    // Clear user from localStorage
    clearUserFromStorage() {
        localStorage.removeItem('discoverNepal_user');
        this.currentUser = null;
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Validate email
    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    // Validate password
    validatePassword(password) {
        return password.length >= 6;
    }

    // Sign Up
    async signup(name, email, password, confirmPassword) {
        try {
            // Validation
            if (!name || !email || !password || !confirmPassword) {
                this.showNotification('All fields are required', 'error');
                return false;
            }

            if (!this.validateEmail(email)) {
                this.showNotification('Invalid email format', 'error');
                return false;
            }

            if (!this.validatePassword(password)) {
                this.showNotification('Password must be at least 6 characters', 'error');
                return false;
            }

            if (password !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return false;
            }

            // API Call
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password: password,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Account created successfully! Please login.', 'success');
                return true;
            } else {
                this.showNotification(data.message || 'Signup failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification('Network error. Please check if the server is running.', 'error');
            return false;
        }
    }

    // Login
    async login(email, password) {
        try {
            // Validation
            if (!email || !password) {
                this.showNotification('Email and password are required', 'error');
                return false;
            }

            if (!this.validateEmail(email)) {
                this.showNotification('Invalid email format', 'error');
                return false;
            }

            // API Call
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.saveUserToStorage(data.user);
                this.showNotification(`Welcome back, ${data.user.name}!`, 'success');
                return true;
            } else {
                this.showNotification(data.message || 'Login failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Network error. Please check if the server is running.', 'error');
            return false;
        }
    }

    // Logout
    logout() {
        this.clearUserFromStorage();
        this.showNotification('Logged out successfully', 'success');
        window.location.href = './index.html';
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Change password
    async changePassword(email, oldPassword, newPassword, confirmPassword) {
        try {
            if (!oldPassword || !newPassword || !confirmPassword) {
                this.showNotification('All fields are required', 'error');
                return false;
            }

            if (!this.validatePassword(newPassword)) {
                this.showNotification('New password must be at least 6 characters', 'error');
                return false;
            }

            if (newPassword !== confirmPassword) {
                this.showNotification('New passwords do not match', 'error');
                return false;
            }

            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    old_password: oldPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Password changed successfully', 'success');
                return true;
            } else {
                this.showNotification(data.message || 'Password change failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Change password error:', error);
            this.showNotification('Network error', 'error');
            return false;
        }
    }
}

// Initialize auth system
const authSystem = new AuthSystem();

// Initialize on page load for login page
document.addEventListener('DOMContentLoaded', () => {
    // Handle login form
    const loginForm = document.querySelector('.login-form');
    if (loginForm && loginForm.closest('section.login')) {
        const emailInput = loginForm.querySelector('input[name="email"]');
        const passwordInput = loginForm.querySelector('input[name="password"]');
        const loginButton = loginForm.querySelector('button[type="submit"]');

        if (loginButton) {
            loginButton.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = emailInput.value;
                const password = passwordInput.value;

                const success = await authSystem.login(email, password);
                if (success) {
                    setTimeout(() => {
                        window.location.href = './index.html';
                    }, 1500);
                }
            });
        }
    }

    // Handle signup form
    const signupForm = document.querySelector('.signup-form');
    if (signupForm) {
        const nameInput = signupForm.querySelector('input[name="name"]');
        const emailInput = signupForm.querySelector('input[name="email"]');
        const passwordInput = signupForm.querySelector('input[name="password"]');
        const confirmInput = signupForm.querySelector('input[name="confirm"]');
        const signupButton = signupForm.querySelector('button[type="submit"]');

        if (signupButton) {
            signupButton.addEventListener('click', async (e) => {
                e.preventDefault();
                const name = nameInput.value;
                const email = emailInput.value;
                const password = passwordInput.value;
                const confirmPassword = confirmInput.value;

                const success = await authSystem.signup(name, email, password, confirmPassword);
                if (success) {
                    // Clear form
                    signupForm.reset();
                    // Switch to login after 2 seconds
                    setTimeout(() => {
                        document.getElementById('show-login').click();
                    }, 2000);
                }
            });
        }
    }
});
