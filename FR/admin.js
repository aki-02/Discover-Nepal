// Admin Panel JavaScript

class AdminPanel {
    constructor() {
        this.users = [];
        this.editingUserId = null;
        this.deleteUserId = null;
        this.init();
    }

    async init() {
        // Check if user is logged in and is admin
        if (!this.authSystem.isLoggedIn()) {
            window.location.href = './login.html';
            return;
        }

        // Initialize theme
        this.initTheme();

        // Load data
        await this.loadUsers();
        this.updateDashboard();

        // Event listeners
        this.setupEventListeners();
    }

    get authSystem() {
        return window.authSystem;
    }

    // Theme Management
    initTheme() {
        const isDark = localStorage.getItem('discoverNepal_theme') === 'dark';
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('discoverNepal_theme', isDark ? 'dark' : 'light');
    }

    // Load Users
    async loadUsers() {
        try {
            const response = await fetch('http://localhost:5000/api/admin/users');
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            this.users = data.users || [];
            this.renderUsersTable();
            this.renderRecentUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            this.showToast('Error loading users', 'error');
        }
    }

    // Update Dashboard
    updateDashboard() {
        const totalUsers = this.users.length;
        const today = new Date().toDateString();
        const todayJoined = this.users.filter(user => {
            return new Date(user.created_at).toDateString() === today;
        }).length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeUsers').textContent = totalUsers;
        document.getElementById('todayJoined').textContent = todayJoined;
        document.getElementById('adminName').textContent = this.authSystem.getCurrentUser().name;
    }

    // Render Users Table
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        
        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>${this.escapeHtml(user.name)}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="adminPanel.editUser(${user.id}, '${this.escapeHtml(user.name)}', '${this.escapeHtml(user.email)}')">Edit</button>
                        <button class="action-btn danger" onclick="adminPanel.deleteUser(${user.id}, '${this.escapeHtml(user.email)}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Render Recent Users
    renderRecentUsers() {
        const container = document.getElementById('recentUsersList');
        const recent = this.users.slice(-5).reverse();

        if (recent.length === 0) {
            container.innerHTML = '<p class="text-center" style="padding: 20px;">No users yet</p>';
            return;
        }

        container.innerHTML = recent.map(user => {
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const joinDate = new Date(user.created_at);
            const daysAgo = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
            const dateText = daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;

            return `
                <div class="recent-user-item">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-info">
                        <div class="user-name">${this.escapeHtml(user.name)}</div>
                        <div class="user-email">${this.escapeHtml(user.email)}</div>
                    </div>
                    <div class="user-time">${dateText}</div>
                </div>
            `;
        }).join('');
    }

    // Edit User
    editUser(userId, userName, userEmail) {
        this.editingUserId = userId;
        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('userName').value = userName;
        document.getElementById('userEmail').value = userEmail;
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').placeholder = 'Leave empty to keep current password';
        document.getElementById('userModal').classList.add('active');
    }

    // Delete User
    deleteUser(userId, userEmail) {
        this.deleteUserId = userId;
        document.getElementById('confirmText').textContent = `Are you sure you want to delete ${userEmail}? This action cannot be undone.`;
        document.getElementById('confirmModal').classList.add('active');
    }

    // Add User Form
    async handleUserForm(e) {
        e.preventDefault();

        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value.trim();

        if (!name || !email || (!this.editingUserId && !password)) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }

        try {
            if (this.editingUserId) {
                // Edit user
                const endpoint = `http://localhost:5000/api/admin/users/${email}`;
                const body = { name };
                
                if (password && password.length >= 6) {
                    body.password = password;
                }

                const response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    throw new Error('Failed to update user');
                }

                this.showToast('User updated successfully');
                this.editingUserId = null;
            } else {
                // Create new user
                const response = await fetch('http://localhost:5000/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to create user');
                }

                this.showToast('User created successfully');
            }

            document.getElementById('userForm').reset();
            this.closeUserModal();
            await this.loadUsers();
            this.updateDashboard();
        } catch (error) {
            console.error('Error:', error);
            this.showToast(error.message || 'Error processing user', 'error');
        }
    }

    // Confirm Delete
    async confirmDelete() {
        if (!this.deleteUserId) return;

        try {
            const user = this.users.find(u => u.id === this.deleteUserId);
            if (!user) throw new Error('User not found');

            const response = await fetch(`http://localhost:5000/api/admin/users/${user.email}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            this.showToast('User deleted successfully');
            this.deleteUserId = null;
            document.getElementById('confirmModal').classList.remove('active');
            await this.loadUsers();
            this.updateDashboard();
        } catch (error) {
            console.error('Error:', error);
            this.showToast(error.message || 'Error deleting user', 'error');
        }
    }

    // Search Users
    searchUsers() {
        const query = document.getElementById('searchUsers').value.toLowerCase();
        const tbody = document.getElementById('usersTableBody');

        if (!query) {
            this.renderUsersTable();
            return;
        }

        const filtered = this.users.filter(user =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found matching your search</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(user => `
            <tr>
                <td>${this.escapeHtml(user.name)}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="adminPanel.editUser(${user.id}, '${this.escapeHtml(user.name)}', '${this.escapeHtml(user.email)}')">Edit</button>
                        <button class="action-btn danger" onclick="adminPanel.deleteUser(${user.id}, '${this.escapeHtml(user.email)}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Modal Management
    closeUserModal() {
        document.getElementById('userModal').classList.remove('active');
        document.getElementById('userForm').reset();
        document.getElementById('modalTitle').textContent = 'Add User';
        document.getElementById('userPassword').placeholder = 'Enter password';
        this.editingUserId = null;
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').classList.remove('active');
        this.deleteUserId = null;
    }

    // Toast Notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Navigation
    switchSection(sectionName) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            users: 'User Management',
            settings: 'Settings'
        };
        document.querySelector('.page-title').textContent = titles[sectionName] || 'Dashboard';

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName).classList.add('active');
    }

    // Utility Functions
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Event Listeners
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.authSystem.logout();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Add User Button
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.editingUserId = null;
            document.getElementById('modalTitle').textContent = 'Add User';
            document.getElementById('userForm').reset();
            document.getElementById('userPassword').placeholder = 'Enter password';
            document.getElementById('userModal').classList.add('active');
        });

        // User Form
        document.getElementById('userForm').addEventListener('submit', (e) => this.handleUserForm(e));

        // User Modal Controls
        document.getElementById('closeUserModal').addEventListener('click', () => this.closeUserModal());
        document.getElementById('cancelUserForm').addEventListener('click', () => this.closeUserModal());

        // Confirm Modal Controls
        document.getElementById('cancelDelete').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirmDelete').addEventListener('click', () => this.confirmDelete());

        // Search
        document.getElementById('searchUsers').addEventListener('input', () => this.searchUsers());

        // Quick Actions
        document.getElementById('addUserQuick').addEventListener('click', () => {
            document.querySelector('[data-section="users"]').click();
            setTimeout(() => document.getElementById('addUserBtn').click(), 300);
        });

        document.getElementById('viewAllUsers').addEventListener('click', () => {
            document.querySelector('[data-section="users"]').click();
        });

        document.getElementById('backupData').addEventListener('click', () => {
            this.backupData();
        });

        // Settings Actions
        document.getElementById('clearCache').addEventListener('click', () => {
            localStorage.clear();
            this.showToast('Cache cleared successfully');
        });

        document.getElementById('resetData').addEventListener('click', () => {
            if (confirm('Are you sure? This will delete all users. This action cannot be undone.')) {
                this.showToast('Reset functionality would require backend support');
            }
        });

        // Close modals on overlay click
        document.getElementById('userModal').addEventListener('click', (e) => {
            if (e.target.id === 'userModal') this.closeUserModal();
        });

        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') this.closeConfirmModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUserModal();
                this.closeConfirmModal();
            }
        });
    }

    // Backup Data
    backupData() {
        const backup = {
            timestamp: new Date().toISOString(),
            users: this.users
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `discover-nepal-backup-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);

        this.showToast('Data backed up successfully');
    }
}

// Initialize Admin Panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
