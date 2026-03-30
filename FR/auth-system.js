// Login and Signup System Handler

const API_URL = 'http://localhost:5000/api';

// Test localStorage availability
function isLocalStorageAvailable() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.error('localStorage not available:', e);
        return false;
    }
}

if (!isLocalStorageAvailable()) {
    console.error('WARNING: localStorage is not available! Session persistence will not work.');
}

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.storageKey = 'discoverNepal_user';
        // Load user immediately on initialization
        this.loadUserFromStorage();
        console.log('AuthSystem initialized. Current user:', this.currentUser);
    }

    // Load user from localStorage
    loadUserFromStorage() {
        try {
            const storedUser = localStorage.getItem(this.storageKey);
            console.log('Loading from storage:', storedUser);
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
                console.log('User loaded from storage:', this.currentUser);
            }
        } catch (e) {
            console.error('Error loading stored user:', e);
            localStorage.removeItem(this.storageKey);
            this.currentUser = null;
        }
    }

    // Save user to localStorage
    saveUserToStorage(user) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(user));
            this.currentUser = user;
            console.log('User saved to storage:', user);
        } catch (e) {
            console.error('Error saving user to storage:', e);
        }
    }

    // Clear user from localStorage
    clearUserFromStorage() {
        try {
            localStorage.removeItem(this.storageKey);
            this.currentUser = null;
            console.log('User cleared from storage');
        } catch (e) {
            console.error('Error clearing storage:', e);
        }
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
        
        // Update UI immediately
        if (typeof updateUIForLogin === 'function') {
            updateUIForLogin();
        }
        
        setTimeout(() => {
            window.location.href = './index.html';
        }, 1500);
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

// Initialize auth system EARLY - before other scripts run
const authSystem = new AuthSystem();

console.log('Auth system initialized. User logged in:', authSystem.isLoggedIn());

// Session management - ensure session persists
window.addEventListener('beforeunload', () => {
    if (authSystem.isLoggedIn()) {
        console.log('Session active - user will remain logged in');
        authSystem.saveUserToStorage(authSystem.currentUser);
    }
});

// Re-verify session on page focus
window.addEventListener('focus', () => {
    authSystem.loadUserFromStorage();
    console.log('Session verified on page focus. Logged in:', authSystem.isLoggedIn());
    updateUIForLogin();
});

// Update UI function
function updateUIForLogin() {
    const isLoggedIn = authSystem.isLoggedIn();
    const user = authSystem.getCurrentUser();
    
    console.log('Updating UI - Logged in:', isLoggedIn, 'User:', user ? user.name : 'none');
    
    // Update auth link in navbar
    const authLinkItem = document.getElementById('auth-link-item');
    if (authLinkItem) {
        let authLink = authLinkItem.querySelector('a');
        if (authLink) {
            if (isLoggedIn && user) {
                authLink.textContent = `Logout (${user.name})`;
                authLink.href = '#logout';
                authLink.onclick = (e) => {
                    e.preventDefault();
                    authSystem.logout();
                    return false;
                };
                authLink.style.color = '#27ae60';
                authLink.style.fontWeight = 'bold';
            } else {
                authLink.textContent = 'Log In';
                authLink.href = './login.html';
                authLink.onclick = null;
                authLink.style.color = '';
                authLink.style.fontWeight = '';
            }
        }
    }
    
    // Remove admin link (admin functionality disabled)
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        const adminLinkItem = document.getElementById('admin-link-item');
        if (adminLinkItem) {
            adminLinkItem.remove();
        }
    }
    
    console.log('UI updated successfully');
}

// Initialize on page load for login page
document.addEventListener('DOMContentLoaded', () => {
    // Update UI immediately on load
    updateUIForLogin();
    // Handle login form
    const loginForm = document.querySelector('.login-form');
    if (loginForm && loginForm.closest('section.login')) {
        // Prevent form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            return false;
        });

        const emailInput = loginForm.querySelector('input[name="email"]');
        const passwordInput = loginForm.querySelector('input[name="password"]');
        const loginButton = loginForm.querySelector('button[type="submit"]');

        if (loginButton) {
            loginButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const email = emailInput.value;
                const password = passwordInput.value;

                console.log('Login attempt:', email);
                const success = await authSystem.login(email, password);
                
                if (success) {
                    // Verify data was saved to localStorage before redirecting
                    const savedUser = localStorage.getItem('discoverNepal_user');
                    console.log('User saved to localStorage:', savedUser ? 'YES' : 'NO');
                    
                    if (savedUser) {
                        console.log('Login successful! Redirecting to home page...');
                        // Clear password fields
                        emailInput.value = '';
                        passwordInput.value = '';
                        // Redirect to home page after brief delay
                        setTimeout(() => {
                            window.location.href = './index.html';
                        }, 1000);
                    } else {
                        authSystem.showNotification('Error: Could not save login. Please try again.', 'error');
                    }
                } else {
                    console.log('Login failed');
                }
            });
        }
    }

    // Handle signup form
    const signupForm = document.querySelector('.signup-form');
    if (signupForm) {
        // Prevent form submission
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            return false;
        });

        const nameInput = signupForm.querySelector('input[name="name"]');
        const emailInput = signupForm.querySelector('input[name="email"]');
        const passwordInput = signupForm.querySelector('input[name="password"]');
        const confirmInput = signupForm.querySelector('input[name="confirm"]');
        const signupButton = signupForm.querySelector('button[type="submit"]');

        if (signupButton) {
            signupButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const name = nameInput.value;
                const email = emailInput.value;
                const password = passwordInput.value;
                const confirmPassword = confirmInput.value;

                console.log('Signup attempt:', email);
                const success = await authSystem.signup(name, email, password, confirmPassword);
                
                if (success) {
                    // Clear form
                    signupForm.reset();
                    // Switch to login after 2 seconds
                    setTimeout(() => {
                        const loginLink = document.getElementById('show-login');
                        if (loginLink) {
                            loginLink.click();
                        }
                    }, 2000);
                }
            });
        }
    }
});
