// Login, Session, Booking, and Admin API Handler

const API_URL = 'http://localhost:5000/api';

function isLocalStorageAvailable() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        console.error('localStorage not available:', error);
        return false;
    }
}

function getPathPrefix() {
    const normalizedPath = window.location.pathname.replace(/\\/g, '/');
    return normalizedPath.includes('/Paragraph/') ? '..' : '.';
}

function getAdminHref() {
    return `${getPathPrefix()}/admin.html`;
}

function getLoginHref() {
    return `${getPathPrefix()}/login.html`;
}

function getHomeHref() {
    return `${getPathPrefix()}/index.html`;
}

if (!isLocalStorageAvailable()) {
    console.error('WARNING: localStorage is not available. Session persistence will not work.');
}

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.userStorageKey = 'discoverNepal_user';
        this.tokenStorageKey = 'discoverNepal_token';
        this.loadSession();
    }

    loadSession() {
        try {
            const storedUser = localStorage.getItem(this.userStorageKey);
            const storedToken = localStorage.getItem(this.tokenStorageKey);

            this.currentUser = storedUser ? JSON.parse(storedUser) : null;
            this.token = storedToken || null;

            if (this.currentUser && !this.token) {
                this.clearSession();
            }
        } catch (error) {
            console.error('Error loading stored session:', error);
            this.clearSession();
        }
    }

    saveSession(user, token) {
        try {
            this.currentUser = user;
            this.token = token;
            localStorage.setItem(this.userStorageKey, JSON.stringify(user));
            localStorage.setItem(this.tokenStorageKey, token);
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    clearSession() {
        try {
            this.currentUser = null;
            this.token = null;
            localStorage.removeItem(this.userStorageKey);
            localStorage.removeItem(this.tokenStorageKey);
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background-color: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#0ea5e9'};
            color: white;
            border-radius: 10px;
            z-index: 1000;
            font-weight: 500;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.2);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3200);
    }

    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test((email || '').trim());
    }

    validatePassword(password) {
        return (password || '').length >= 6;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    isLoggedIn() {
        return Boolean(this.currentUser && this.token);
    }

    isAdmin() {
        return this.isLoggedIn() && this.currentUser.role === 'admin';
    }

    async request(path, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ?? null;
        const auth = options.auth || false;

        const headers = {
            'Content-Type': 'application/json',
        };

        if (auth) {
            if (!this.token) {
                throw new Error('You must be logged in to perform this action');
            }
            headers.Authorization = `Bearer ${this.token}`;
        }

        const requestOptions = {
            method,
            headers,
        };

        if (body !== null) {
            requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${path}`, requestOptions);
        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {
            const message = data.message || `Request failed with status ${response.status}`;
            if (auth && response.status === 401) {
                this.clearSession();
                updateUIForLogin();
            }
            throw new Error(message);
        }

        return data;
    }

    async signup(name, email, password, confirmPassword) {
        try {
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

            const data = await this.request('/auth/signup', {
                method: 'POST',
                body: {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    confirm_password: confirmPassword,
                },
            });

            if (data.success) {
                this.showNotification('Account created successfully. Please log in.', 'success');
                return true;
            }

            this.showNotification(data.message || 'Signup failed', 'error');
            return false;
        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification(error.message || 'Network error. Check if server is running.', 'error');
            return false;
        }
    }

    async login(email, password) {
        try {
            if (!email || !password) {
                this.showNotification('Email and password are required', 'error');
                return false;
            }

            if (!this.validateEmail(email)) {
                this.showNotification('Invalid email format', 'error');
                return false;
            }

            const data = await this.request('/auth/login', {
                method: 'POST',
                body: {
                    email: email.trim().toLowerCase(),
                    password,
                },
            });

            if (data.success && data.user && data.token) {
                this.saveSession(data.user, data.token);
                this.showNotification(`Welcome back, ${data.user.name}!`, 'success');
                return true;
            }

            this.showNotification(data.message || 'Login failed', 'error');
            return false;
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message || 'Network error. Check if server is running.', 'error');
            return false;
        }
    }

    logout() {
        this.clearSession();
        this.showNotification('Logged out successfully', 'success');

        if (typeof updateUIForLogin === 'function') {
            updateUIForLogin();
        }

        setTimeout(() => {
            window.location.href = getHomeHref();
        }, 1000);
    }

    async changePassword(email, oldPassword, newPassword, confirmPassword) {
        try {
            if (!newPassword || !confirmPassword) {
                this.showNotification('All password fields are required', 'error');
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

            const payload = {
                email: (email || '').trim().toLowerCase(),
                old_password: oldPassword || '',
                new_password: newPassword,
                confirm_password: confirmPassword,
            };

            const data = await this.request('/auth/change-password', {
                method: 'POST',
                body: payload,
                auth: true,
            });

            this.showNotification(data.message || 'Password changed successfully', 'success');
            return true;
        } catch (error) {
            console.error('Change password error:', error);
            this.showNotification(error.message || 'Password change failed', 'error');
            return false;
        }
    }

    async submitBooking(payload) {
        try {
            const bookingPayload = {
                name: (payload.name || '').trim(),
                email: (payload.email || '').trim().toLowerCase(),
                destination: (payload.destination || '').trim(),
                travel_date: payload.travel_date || null,
                travelers: Number(payload.travelers || 1),
                notes: (payload.notes || '').trim(),
            };

            if (!bookingPayload.name || !bookingPayload.email || !bookingPayload.destination) {
                this.showNotification('Name, email, and destination are required', 'error');
                return false;
            }

            if (!this.validateEmail(bookingPayload.email)) {
                this.showNotification('Please enter a valid email address', 'error');
                return false;
            }

            const data = await this.request('/bookings', {
                method: 'POST',
                body: bookingPayload,
            });

            this.showNotification(data.message || 'Booking submitted successfully', 'success');
            return true;
        } catch (error) {
            console.error('Booking submission error:', error);
            this.showNotification(error.message || 'Booking failed', 'error');
            return false;
        }
    }

    async adminRequest(path, options = {}) {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        return this.request(path, {
            ...options,
            auth: true,
        });
    }
}

const authSystem = new AuthSystem();
window.AuthSystem = AuthSystem;
window.authSystem = authSystem;

window.addEventListener('beforeunload', () => {
    if (authSystem.isLoggedIn()) {
        authSystem.saveSession(authSystem.currentUser, authSystem.token);
    }
});

window.addEventListener('focus', () => {
    authSystem.loadSession();
    updateUIForLogin();
});

function updateUIForLogin() {
    const user = authSystem.getCurrentUser();
    const isLoggedIn = authSystem.isLoggedIn();
    const navLinks = document.querySelector('.nav-links');
    const authLinkItem = document.getElementById('auth-link-item');

    if (authLinkItem) {
        const authLink = authLinkItem.querySelector('a');
        if (authLink) {
            if (isLoggedIn && user) {
                authLink.textContent = `Logout (${user.name})`;
                authLink.href = '#logout';
                authLink.onclick = (event) => {
                    event.preventDefault();
                    authSystem.logout();
                    return false;
                };
                authLink.style.color = '#16a34a';
                authLink.style.fontWeight = '700';
            } else {
                authLink.textContent = 'Log In';
                authLink.href = getLoginHref();
                authLink.onclick = null;
                authLink.style.color = '';
                authLink.style.fontWeight = '';
            }
        }
    }

    if (navLinks) {
        let adminLinkItem = document.getElementById('admin-link-item');

        if (isLoggedIn && authSystem.isAdmin()) {
            if (!adminLinkItem) {
                adminLinkItem = document.createElement('li');
                adminLinkItem.id = 'admin-link-item';
                const adminLink = document.createElement('a');
                adminLink.textContent = 'Admin Portal';
                adminLink.href = getAdminHref();
                adminLinkItem.appendChild(adminLink);

                if (authLinkItem) {
                    navLinks.insertBefore(adminLinkItem, authLinkItem);
                } else {
                    navLinks.appendChild(adminLinkItem);
                }
            }

            const adminLink = adminLinkItem.querySelector('a');
            if (adminLink) {
                adminLink.href = getAdminHref();
                adminLink.textContent = 'Admin Portal';
            }
            adminLinkItem.style.display = 'list-item';
        } else if (adminLinkItem) {
            adminLinkItem.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateUIForLogin();

    const requiresAdmin = document.body.getAttribute('data-requires-admin') === 'true';
    if (requiresAdmin && !authSystem.isAdmin()) {
        authSystem.showNotification('Admin access required', 'error');
        setTimeout(() => {
            window.location.href = getLoginHref();
        }, 1000);
        return;
    }

    const loginForm = document.querySelector('.login-form');
    if (loginForm && loginForm.closest('section.login')) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const emailInput = loginForm.querySelector('input[name="email"]');
            const passwordInput = loginForm.querySelector('input[name="password"]');
            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';

            const success = await authSystem.login(email, password);
            if (success) {
                loginForm.reset();
                updateUIForLogin();
                setTimeout(() => {
                    window.location.href = getHomeHref();
                }, 700);
            }
        });
    }

    const signupForm = document.querySelector('.signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nameInput = signupForm.querySelector('input[name="name"]');
            const emailInput = signupForm.querySelector('input[name="email"]');
            const passwordInput = signupForm.querySelector('input[name="password"]');
            const confirmInput = signupForm.querySelector('input[name="confirm"]');

            const success = await authSystem.signup(
                nameInput ? nameInput.value : '',
                emailInput ? emailInput.value : '',
                passwordInput ? passwordInput.value : '',
                confirmInput ? confirmInput.value : ''
            );

            if (success) {
                signupForm.reset();
                setTimeout(() => {
                    const showLogin = document.getElementById('show-login');
                    if (showLogin) {
                        showLogin.click();
                    }
                }, 1200);
            }
        });
    }

    const bookingForm = document.querySelector('.booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(bookingForm);
            const payload = {
                name: formData.get('name'),
                email: formData.get('email'),
                destination: formData.get('destination'),
                travel_date: formData.get('travel_date'),
                travelers: formData.get('travelers'),
                notes: formData.get('notes'),
            };

            const success = await authSystem.submitBooking(payload);
            if (success) {
                bookingForm.reset();
                const travelerInput = bookingForm.querySelector('input[name="travelers"]');
                if (travelerInput) {
                    travelerInput.value = '1';
                }
            }
        });
    }
});
