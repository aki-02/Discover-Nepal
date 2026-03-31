const adminState = {
    activeTab: 'users',
    page: 1,
    limit: 10,
    total: 0,
    search: '',
    status: '',
    type: '',
    rows: [],
    dialogMode: 'create',
    dialogItemId: null,
};

const tabConfig = {
    users: {
        endpoint: '/admin/users',
        responseKey: 'users',
        title: 'New User',
        statusLabel: 'Role',
        statusOptions: [
            { value: '', label: 'All Roles' },
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
        ],
    },
    bookings: {
        endpoint: '/admin/bookings',
        responseKey: 'bookings',
        title: 'New Booking',
        statusLabel: 'Status',
        statusOptions: [
            { value: '', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
        ],
    },
    content: {
        endpoint: '/admin/content',
        responseKey: 'content',
        title: 'New Content',
        statusLabel: 'Status',
        statusOptions: [
            { value: '', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' },
        ],
        typeOptions: [
            { value: '', label: 'All Types' },
            { value: 'destination', label: 'Destination' },
            { value: 'announcement', label: 'Announcement' },
            { value: 'guide', label: 'Guide' },
        ],
    },
};

function escapeHtml(input) {
    return String(input ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
}

function getCurrentConfig() {
    return tabConfig[adminState.activeTab];
}

function toggleLoading(isLoading) {
    const loading = document.getElementById('table-loading');
    if (!loading) {
        return;
    }

    if (isLoading) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function updatePaginationControls() {
    const pageIndicator = document.getElementById('page-indicator');
    const prevButton = document.getElementById('prev-page-btn');
    const nextButton = document.getElementById('next-page-btn');

    const currentPage = adminState.page;
    const totalPages = Math.max(1, Math.ceil(adminState.total / adminState.limit));

    if (pageIndicator) {
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    if (prevButton) {
        prevButton.disabled = currentPage <= 1;
    }

    if (nextButton) {
        nextButton.disabled = currentPage >= totalPages;
    }
}

function configureFilters() {
    const config = getCurrentConfig();
    const statusFilter = document.getElementById('status-filter');
    const typeFilter = document.getElementById('type-filter');
    const newItemButton = document.getElementById('new-item-btn');

    if (newItemButton) {
        newItemButton.textContent = config.title;
    }

    if (statusFilter) {
        statusFilter.innerHTML = config.statusOptions
            .map((option) => `<option value="${option.value}">${escapeHtml(option.label)}</option>`)
            .join('');
        statusFilter.value = adminState.status;
    }

    if (typeFilter) {
        if (adminState.activeTab === 'content') {
            typeFilter.classList.remove('hidden');
            typeFilter.innerHTML = config.typeOptions
                .map((option) => `<option value="${option.value}">${escapeHtml(option.label)}</option>`)
                .join('');
            typeFilter.value = adminState.type;
        } else {
            typeFilter.classList.add('hidden');
            typeFilter.innerHTML = '';
            adminState.type = '';
        }
    }
}

function buildQuery() {
    const params = new URLSearchParams();
    params.set('page', String(adminState.page));
    params.set('limit', String(adminState.limit));

    if (adminState.search) {
        params.set('q', adminState.search);
    }

    if (adminState.status) {
        if (adminState.activeTab === 'users') {
            params.set('role', adminState.status);
        } else {
            params.set('status', adminState.status);
        }
    }

    if (adminState.activeTab === 'content' && adminState.type) {
        params.set('type', adminState.type);
    }

    return params.toString();
}

function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>No records found</h3>
            <p>Try changing filters or create a new entry.</p>
        </div>
    `;
}

function statusBadge(value, prefix = 'status') {
    const safeValue = String(value || '').toLowerCase();
    if (!safeValue) {
        return '<span class="inline-badge">unknown</span>';
    }

    return `<span class="inline-badge ${prefix}-${safeValue}">${escapeHtml(safeValue)}</span>`;
}

function renderUsersTable(rows) {
    return `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows
                        .map(
                            (row) => `
                            <tr>
                                <td>${escapeHtml(row.name)}</td>
                                <td class="code">${escapeHtml(row.email)}</td>
                                <td>${statusBadge(row.role, 'role')}</td>
                                <td>${escapeHtml(formatDate(row.created_at))}</td>
                                <td>${escapeHtml(formatDate(row.last_login))}</td>
                                <td>
                                    <div class="row-actions">
                                        <button class="action-btn" data-action="view" data-id="${row.id}" type="button">View</button>
                                        <button class="action-btn" data-action="edit" data-id="${row.id}" type="button">Edit</button>
                                        <button class="action-btn delete" data-action="delete" data-id="${row.id}" type="button">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        `
                        )
                        .join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderBookingsTable(rows) {
    return `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Destination</th>
                        <th>Travel Date</th>
                        <th>Travelers</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows
                        .map(
                            (row) => `
                            <tr>
                                <td>${escapeHtml(row.name)}</td>
                                <td class="code">${escapeHtml(row.email)}</td>
                                <td>${escapeHtml(row.destination)}</td>
                                <td>${escapeHtml(formatDate(row.travel_date))}</td>
                                <td>${escapeHtml(row.travelers)}</td>
                                <td>${statusBadge(row.status)}</td>
                                <td>
                                    <div class="row-actions">
                                        <button class="action-btn" data-action="view" data-id="${row.id}" type="button">View</button>
                                        <button class="action-btn" data-action="edit" data-id="${row.id}" type="button">Edit</button>
                                        <button class="action-btn delete" data-action="delete" data-id="${row.id}" type="button">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        `
                        )
                        .join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderContentTable(rows) {
    return `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Slug</th>
                        <th>Status</th>
                        <th>Updated</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows
                        .map(
                            (row) => `
                            <tr>
                                <td>${escapeHtml(row.title)}</td>
                                <td>${statusBadge(row.content_type, 'type')}</td>
                                <td class="code">${escapeHtml(row.slug)}</td>
                                <td>${statusBadge(row.status)}</td>
                                <td>${escapeHtml(formatDate(row.updated_at))}</td>
                                <td>
                                    <div class="row-actions">
                                        <button class="action-btn" data-action="view" data-id="${row.id}" type="button">View</button>
                                        <button class="action-btn" data-action="edit" data-id="${row.id}" type="button">Edit</button>
                                        <button class="action-btn delete" data-action="delete" data-id="${row.id}" type="button">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        `
                        )
                        .join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderTable() {
    const wrapper = document.getElementById('table-wrapper');
    if (!wrapper) {
        return;
    }

    if (!adminState.rows.length) {
        wrapper.innerHTML = renderEmptyState();
        return;
    }

    if (adminState.activeTab === 'users') {
        wrapper.innerHTML = renderUsersTable(adminState.rows);
        return;
    }

    if (adminState.activeTab === 'bookings') {
        wrapper.innerHTML = renderBookingsTable(adminState.rows);
        return;
    }

    wrapper.innerHTML = renderContentTable(adminState.rows);
}

function showDetailPanel(item) {
    const panel = document.getElementById('detail-panel');
    if (!panel || !item) {
        return;
    }

    const entries = Object.entries(item)
        .map(
            ([key, value]) => `
            <div class="detail-item">
                <strong>${escapeHtml(key.replaceAll('_', ' '))}</strong>
                <span>${escapeHtml(value)}</span>
            </div>
        `
        )
        .join('');

    panel.innerHTML = `
        <h3>Record Details</h3>
        <div class="detail-grid">${entries}</div>
    `;
    panel.classList.remove('hidden');
}

function hideDetailPanel() {
    const panel = document.getElementById('detail-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

async function loadRecords() {
    const config = getCurrentConfig();
    toggleLoading(true);

    try {
        const query = buildQuery();
        const payload = await authSystem.adminRequest(`${config.endpoint}?${query}`);
        adminState.rows = payload[config.responseKey] || [];
        adminState.total = payload.total || payload.count || adminState.rows.length;

        renderTable();
        updatePaginationControls();
    } catch (error) {
        authSystem.showNotification(error.message || 'Failed to load records', 'error');
        adminState.rows = [];
        adminState.total = 0;
        renderTable();
        updatePaginationControls();
    } finally {
        toggleLoading(false);
    }
}

function getDialogSchema(mode, item = {}) {
    if (adminState.activeTab === 'users') {
        return {
            title: mode === 'create' ? 'Create User' : 'Edit User',
            fields: [
                { key: 'name', label: 'Name', type: 'text', required: true, value: item.name || '' },
                { key: 'email', label: 'Email', type: 'email', required: true, value: item.email || '' },
                {
                    key: 'role',
                    label: 'Role',
                    type: 'select',
                    required: true,
                    value: item.role || 'user',
                    options: [
                        { value: 'user', label: 'User' },
                        { value: 'admin', label: 'Admin' },
                    ],
                },
                {
                    key: 'password',
                    label: mode === 'create' ? 'Password' : 'New Password (optional)',
                    type: 'password',
                    required: mode === 'create',
                    value: '',
                },
            ],
        };
    }

    if (adminState.activeTab === 'bookings') {
        return {
            title: mode === 'create' ? 'Create Booking' : 'Edit Booking',
            fields: [
                { key: 'name', label: 'Name', type: 'text', required: true, value: item.name || '' },
                { key: 'email', label: 'Email', type: 'email', required: true, value: item.email || '' },
                { key: 'destination', label: 'Destination', type: 'text', required: true, value: item.destination || '' },
                { key: 'travel_date', label: 'Travel Date', type: 'date', required: false, value: item.travel_date || '' },
                { key: 'travelers', label: 'Travelers', type: 'number', required: true, value: item.travelers || 1 },
                {
                    key: 'status',
                    label: 'Status',
                    type: 'select',
                    required: true,
                    value: item.status || 'pending',
                    options: [
                        { value: 'pending', label: 'Pending' },
                        { value: 'confirmed', label: 'Confirmed' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' },
                    ],
                },
                { key: 'notes', label: 'Notes', type: 'textarea', required: false, value: item.notes || '' },
            ],
        };
    }

    return {
        title: mode === 'create' ? 'Create Content' : 'Edit Content',
        fields: [
            {
                key: 'content_type',
                label: 'Content Type',
                type: 'select',
                required: true,
                value: item.content_type || 'destination',
                options: [
                    { value: 'destination', label: 'Destination' },
                    { value: 'announcement', label: 'Announcement' },
                    { value: 'guide', label: 'Guide' },
                ],
            },
            { key: 'title', label: 'Title', type: 'text', required: true, value: item.title || '' },
            { key: 'slug', label: 'Slug', type: 'text', required: true, value: item.slug || '' },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                required: true,
                value: item.status || 'draft',
                options: [
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' },
                ],
            },
            { key: 'summary', label: 'Summary', type: 'textarea', required: false, value: item.summary || '' },
            { key: 'body', label: 'Body', type: 'textarea', required: false, value: item.body || '' },
        ],
    };
}

function renderFormField(field) {
    if (field.type === 'select') {
        const options = field.options
            .map((option) => {
                const selected = String(option.value) === String(field.value) ? 'selected' : '';
                return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
            })
            .join('');

        return `
            <div class="field">
                <label for="field-${field.key}">${escapeHtml(field.label)}</label>
                <select id="field-${field.key}" name="${escapeHtml(field.key)}" ${field.required ? 'required' : ''}>
                    ${options}
                </select>
            </div>
        `;
    }

    if (field.type === 'textarea') {
        return `
            <div class="field">
                <label for="field-${field.key}">${escapeHtml(field.label)}</label>
                <textarea id="field-${field.key}" name="${escapeHtml(field.key)}" ${field.required ? 'required' : ''}>${escapeHtml(
                    field.value
                )}</textarea>
            </div>
        `;
    }

    const min = field.type === 'number' ? 'min="1" max="20"' : '';
    return `
        <div class="field">
            <label for="field-${field.key}">${escapeHtml(field.label)}</label>
            <input
                id="field-${field.key}"
                type="${escapeHtml(field.type)}"
                name="${escapeHtml(field.key)}"
                value="${escapeHtml(field.value)}"
                ${field.required ? 'required' : ''}
                ${min}
            >
        </div>
    `;
}

function openDialog(mode, item = null) {
    adminState.dialogMode = mode;
    adminState.dialogItemId = item ? item.id : null;

    const schema = getDialogSchema(mode, item || {});
    const overlay = document.getElementById('dialog-overlay');
    const dialogTitle = document.getElementById('dialog-title');
    const form = document.getElementById('dialog-form');

    if (!overlay || !dialogTitle || !form) {
        return;
    }

    dialogTitle.textContent = schema.title;
    form.innerHTML = schema.fields.map(renderFormField).join('');
    overlay.classList.remove('hidden');
}

function closeDialog() {
    const overlay = document.getElementById('dialog-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function readDialogValues() {
    const form = document.getElementById('dialog-form');
    if (!form) {
        return {};
    }

    const formData = new FormData(form);
    const values = {};

    for (const [key, value] of formData.entries()) {
        values[key] = typeof value === 'string' ? value.trim() : value;
    }

    return values;
}

async function submitDialog() {
    const mode = adminState.dialogMode;
    const itemId = adminState.dialogItemId;
    const values = readDialogValues();

    try {
        if (adminState.activeTab === 'users') {
            if (mode === 'create') {
                await authSystem.adminRequest('/admin/users', {
                    method: 'POST',
                    body: values,
                });
            } else {
                if (!values.password) {
                    delete values.password;
                }
                await authSystem.adminRequest(`/admin/users/${itemId}`, {
                    method: 'PUT',
                    body: values,
                });
            }
        } else if (adminState.activeTab === 'bookings') {
            values.travelers = Number(values.travelers || 1);
            if (mode === 'create') {
                await authSystem.adminRequest('/admin/bookings', {
                    method: 'POST',
                    body: values,
                });
            } else {
                await authSystem.adminRequest(`/admin/bookings/${itemId}`, {
                    method: 'PUT',
                    body: values,
                });
            }
        } else {
            values.slug = (values.slug || '').toLowerCase();
            if (mode === 'create') {
                await authSystem.adminRequest('/admin/content', {
                    method: 'POST',
                    body: values,
                });
            } else {
                await authSystem.adminRequest(`/admin/content/${itemId}`, {
                    method: 'PUT',
                    body: values,
                });
            }
        }

        authSystem.showNotification('Saved successfully', 'success');
        closeDialog();
        hideDetailPanel();
        await loadRecords();
    } catch (error) {
        authSystem.showNotification(error.message || 'Save failed', 'error');
    }
}

async function deleteItem(itemId) {
    try {
        if (adminState.activeTab === 'users') {
            await authSystem.adminRequest(`/admin/users/${itemId}`, {
                method: 'DELETE',
            });
        } else if (adminState.activeTab === 'bookings') {
            await authSystem.adminRequest(`/admin/bookings/${itemId}`, {
                method: 'DELETE',
            });
        } else {
            await authSystem.adminRequest(`/admin/content/${itemId}`, {
                method: 'DELETE',
            });
        }

        authSystem.showNotification('Deleted successfully', 'success');
        hideDetailPanel();
        await loadRecords();
    } catch (error) {
        authSystem.showNotification(error.message || 'Delete failed', 'error');
    }
}

function getRowById(id) {
    return adminState.rows.find((row) => Number(row.id) === Number(id));
}

function setActiveTab(tabName) {
    if (!tabConfig[tabName]) {
        return;
    }

    adminState.activeTab = tabName;
    adminState.page = 1;
    adminState.search = '';
    adminState.status = '';
    adminState.type = '';

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }

    configureFilters();
    hideDetailPanel();
    loadRecords();
}

function handleTableClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    const row = getRowById(id);

    if (!row) {
        return;
    }

    if (action === 'view') {
        showDetailPanel(row);
        return;
    }

    if (action === 'edit') {
        openDialog('edit', row);
        return;
    }

    if (action === 'delete') {
        const confirmed = window.confirm('Delete this record? This cannot be undone.');
        if (confirmed) {
            deleteItem(id);
        }
    }
}

function setupEvents() {
    document.querySelectorAll('.tab-btn').forEach((button) => {
        button.addEventListener('click', () => {
            setActiveTab(button.dataset.tab);
        });
    });

    const searchInput = document.getElementById('search-input');
    let searchTimer = null;

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                adminState.search = searchInput.value.trim();
                adminState.page = 1;
                loadRecords();
            }, 260);
        });
    }

    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            adminState.status = statusFilter.value;
            adminState.page = 1;
            loadRecords();
        });
    }

    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            adminState.type = typeFilter.value;
            adminState.page = 1;
            loadRecords();
        });
    }

    const refreshButton = document.getElementById('refresh-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            loadRecords();
        });
    }

    const newButton = document.getElementById('new-item-btn');
    if (newButton) {
        newButton.addEventListener('click', () => {
            openDialog('create');
        });
    }

    const prevButton = document.getElementById('prev-page-btn');
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            adminState.page = Math.max(1, adminState.page - 1);
            loadRecords();
        });
    }

    const nextButton = document.getElementById('next-page-btn');
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(adminState.total / adminState.limit));
            adminState.page = Math.min(totalPages, adminState.page + 1);
            loadRecords();
        });
    }

    const tableWrapper = document.getElementById('table-wrapper');
    if (tableWrapper) {
        tableWrapper.addEventListener('click', handleTableClick);
    }

    const closeButton = document.getElementById('dialog-close');
    const cancelButton = document.getElementById('dialog-cancel');
    const submitButton = document.getElementById('dialog-submit');
    const overlay = document.getElementById('dialog-overlay');

    if (closeButton) {
        closeButton.addEventListener('click', closeDialog);
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', closeDialog);
    }

    if (submitButton) {
        submitButton.addEventListener('click', submitDialog);
    }

    if (overlay) {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeDialog();
            }
        });
    }
}

function initAdminPortal() {
    if (!window.authSystem || !authSystem.isLoggedIn() || !authSystem.isAdmin()) {
        return;
    }

    setupEvents();
    configureFilters();
    setActiveTab('users');
}

document.addEventListener('DOMContentLoaded', initAdminPortal);
