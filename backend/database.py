import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

try:
    from config import DATABASE_FILE
except Exception:
    DATABASE_FILE = 'users.db'


DB_FILE = DATABASE_FILE


def _get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def _normalize_email(email):
    return (email or '').strip().lower()


def _row_to_dict(row):
    return dict(row) if row else None


def _column_exists(cursor, table_name, column_name):
    cursor.execute(f'PRAGMA table_info({table_name})')
    columns = [col[1] for col in cursor.fetchall()]
    return column_name in columns


def _create_users_table(cursor):
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')


def _create_bookings_table(cursor):
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            destination TEXT NOT NULL,
            travel_date TEXT,
            travelers INTEGER DEFAULT 1,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            updated_by TEXT
        )
    ''')


def _create_content_table(cursor):
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS content_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_type TEXT NOT NULL,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            summary TEXT,
            body TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            updated_by TEXT
        )
    ''')


def _apply_migrations(cursor):
    if not _column_exists(cursor, 'users', 'role'):
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")


def init_db():
    """Initialize and migrate the SQLite schema."""
    conn = _get_connection()
    c = conn.cursor()

    _create_users_table(c)
    _create_bookings_table(c)
    _create_content_table(c)
    _apply_migrations(c)

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_FILE}")


def get_user_by_email(email):
    """Retrieve user by email."""
    normalized_email = _normalize_email(email)
    conn = _get_connection()
    c = conn.cursor()

    c.execute('SELECT * FROM users WHERE email = ?', (normalized_email,))
    user = c.fetchone()
    conn.close()

    return _row_to_dict(user)


def get_user_by_id(user_id):
    """Retrieve user by ID."""
    conn = _get_connection()
    c = conn.cursor()

    c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()

    return _row_to_dict(user)


def user_exists(email):
    """Check whether a user exists by email."""
    return get_user_by_email(email) is not None


def create_user(name, email, password, role='user'):
    """Create a new user."""
    try:
        hashed_password = generate_password_hash(password)
        normalized_email = _normalize_email(email)
        normalized_role = (role or 'user').strip().lower()

        conn = _get_connection()
        c = conn.cursor()

        c.execute(
            '''
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        ''',
            (name.strip(), normalized_email, hashed_password, normalized_role),
        )

        conn.commit()
        conn.close()
        return True, "User created successfully"
    except sqlite3.IntegrityError:
        return False, "Email already exists"
    except Exception as e:
        return False, str(e)


def verify_user(email, password):
    """Verify user credentials."""
    user = get_user_by_email(email)

    if not user:
        return False, "User not found"

    if check_password_hash(user['password'], password):
        update_last_login(user['email'])
        return True, "Login successful"

    return False, "Invalid password"


def update_last_login(email):
    """Update last login timestamp."""
    try:
        normalized_email = _normalize_email(email)
        conn = _get_connection()
        c = conn.cursor()

        c.execute(
            '''
            UPDATE users
            SET last_login = CURRENT_TIMESTAMP
            WHERE email = ?
        ''',
            (normalized_email,),
        )

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error updating last login: {e}")


def get_all_users(search=None, role=None, limit=50, offset=0):
    """Get users with optional search and role filter."""
    conn = _get_connection()
    c = conn.cursor()

    query = '''
        SELECT id, name, email, role, created_at, last_login
        FROM users
        WHERE 1 = 1
    '''
    params = []

    if search:
        query += ' AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ?)'
        search_term = f"%{search.strip().lower()}%"
        params.extend([search_term, search_term])

    if role:
        query += ' AND role = ?'
        params.append(role.strip().lower())

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.extend([limit, offset])

    c.execute(query, tuple(params))
    users = [dict(row) for row in c.fetchall()]
    conn.close()

    return users


def count_users(search=None, role=None):
    """Count users for pagination."""
    conn = _get_connection()
    c = conn.cursor()

    query = 'SELECT COUNT(*) AS total FROM users WHERE 1 = 1'
    params = []

    if search:
        query += ' AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ?)'
        search_term = f"%{search.strip().lower()}%"
        params.extend([search_term, search_term])

    if role:
        query += ' AND role = ?'
        params.append(role.strip().lower())

    c.execute(query, tuple(params))
    total = c.fetchone()['total']
    conn.close()
    return total


def update_user(user_id, name=None, email=None, role=None, password=None):
    """Update editable user fields."""
    try:
        fields = []
        params = []

        if name is not None:
            fields.append('name = ?')
            params.append(name.strip())

        if email is not None:
            fields.append('email = ?')
            params.append(_normalize_email(email))

        if role is not None:
            fields.append('role = ?')
            params.append(role.strip().lower())

        if password:
            fields.append('password = ?')
            params.append(generate_password_hash(password))

        if not fields:
            return False, "No fields provided for update"

        params.append(user_id)

        conn = _get_connection()
        c = conn.cursor()
        c.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", tuple(params))
        conn.commit()
        updated = c.rowcount > 0
        conn.close()

        if not updated:
            return False, "User not found"
        return True, "User updated successfully"
    except sqlite3.IntegrityError:
        return False, "Email already exists"
    except Exception as e:
        return False, str(e)


def delete_user(email):
    """Delete a user by email."""
    try:
        normalized_email = _normalize_email(email)
        conn = _get_connection()
        c = conn.cursor()

        c.execute('DELETE FROM users WHERE email = ?', (normalized_email,))
        conn.commit()
        deleted = c.rowcount > 0
        conn.close()

        if not deleted:
            return False, "User not found"
        return True, "User deleted successfully"
    except Exception as e:
        return False, str(e)


def delete_user_by_id(user_id):
    """Delete a user by ID."""
    try:
        conn = _get_connection()
        c = conn.cursor()

        c.execute('DELETE FROM users WHERE id = ?', (user_id,))
        conn.commit()
        deleted = c.rowcount > 0
        conn.close()

        if not deleted:
            return False, "User not found"
        return True, "User deleted successfully"
    except Exception as e:
        return False, str(e)


def update_user_password(email, new_password):
    """Update user password by email."""
    try:
        normalized_email = _normalize_email(email)
        hashed_password = generate_password_hash(new_password)

        conn = _get_connection()
        c = conn.cursor()

        c.execute(
            '''
            UPDATE users
            SET password = ?
            WHERE email = ?
        ''',
            (hashed_password, normalized_email),
        )

        conn.commit()
        updated = c.rowcount > 0
        conn.close()

        if not updated:
            return False, "User not found"
        return True, "Password updated successfully"
    except Exception as e:
        return False, str(e)


def promote_bootstrap_admins(admin_emails):
    """Promote configured emails to admin role."""
    normalized_emails = [_normalize_email(item) for item in (admin_emails or []) if item]
    if not normalized_emails:
        return 0

    conn = _get_connection()
    c = conn.cursor()
    updated_total = 0

    for email in normalized_emails:
        c.execute('UPDATE users SET role = ? WHERE email = ?', ('admin', email))
        updated_total += c.rowcount

    conn.commit()
    conn.close()
    return updated_total


def create_booking(name, email, destination, travel_date=None, travelers=1, notes=None, status='pending', created_by=None):
    """Create a booking record."""
    try:
        conn = _get_connection()
        c = conn.cursor()

        c.execute(
            '''
            INSERT INTO bookings
            (name, email, destination, travel_date, travelers, notes, status, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
            (
                name.strip(),
                _normalize_email(email),
                destination.strip(),
                travel_date,
                travelers,
                notes,
                status.strip().lower(),
                created_by,
                created_by,
            ),
        )
        booking_id = c.lastrowid

        conn.commit()
        conn.close()
        return True, "Booking created successfully", booking_id
    except Exception as e:
        return False, str(e), None


def get_booking_by_id(booking_id):
    """Get one booking by ID."""
    conn = _get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM bookings WHERE id = ?', (booking_id,))
    booking = c.fetchone()
    conn.close()
    return _row_to_dict(booking)


def list_bookings(search=None, status=None, limit=50, offset=0):
    """List bookings with optional filters."""
    conn = _get_connection()
    c = conn.cursor()

    query = '''
        SELECT id, name, email, destination, travel_date, travelers, notes, status, created_at, updated_at, created_by, updated_by
        FROM bookings
        WHERE 1 = 1
    '''
    params = []

    if search:
        search_term = f"%{search.strip().lower()}%"
        query += ' AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(destination) LIKE ?)'
        params.extend([search_term, search_term, search_term])

    if status:
        query += ' AND status = ?'
        params.append(status.strip().lower())

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.extend([limit, offset])

    c.execute(query, tuple(params))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def count_bookings(search=None, status=None):
    """Count bookings for pagination."""
    conn = _get_connection()
    c = conn.cursor()

    query = 'SELECT COUNT(*) AS total FROM bookings WHERE 1 = 1'
    params = []

    if search:
        search_term = f"%{search.strip().lower()}%"
        query += ' AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(destination) LIKE ?)'
        params.extend([search_term, search_term, search_term])

    if status:
        query += ' AND status = ?'
        params.append(status.strip().lower())

    c.execute(query, tuple(params))
    total = c.fetchone()['total']
    conn.close()
    return total


def update_booking(booking_id, payload, updated_by=None):
    """Update booking fields by ID."""
    try:
        allowed_fields = {
            'name',
            'email',
            'destination',
            'travel_date',
            'travelers',
            'notes',
            'status',
        }

        fields = []
        params = []

        for key, value in (payload or {}).items():
            if key not in allowed_fields:
                continue

            if key == 'email':
                value = _normalize_email(value)

            if key == 'status' and value is not None:
                value = str(value).strip().lower()

            if key in {'name', 'destination'} and value is not None:
                value = str(value).strip()

            fields.append(f'{key} = ?')
            params.append(value)

        if updated_by is not None:
            fields.append('updated_by = ?')
            params.append(updated_by)

        if not fields:
            return False, "No valid fields provided"

        fields.append('updated_at = CURRENT_TIMESTAMP')
        params.append(booking_id)

        conn = _get_connection()
        c = conn.cursor()
        c.execute(f"UPDATE bookings SET {', '.join(fields)} WHERE id = ?", tuple(params))
        conn.commit()
        updated = c.rowcount > 0
        conn.close()

        if not updated:
            return False, "Booking not found"
        return True, "Booking updated successfully"
    except Exception as e:
        return False, str(e)


def delete_booking(booking_id):
    """Delete booking by ID."""
    try:
        conn = _get_connection()
        c = conn.cursor()
        c.execute('DELETE FROM bookings WHERE id = ?', (booking_id,))
        conn.commit()
        deleted = c.rowcount > 0
        conn.close()

        if not deleted:
            return False, "Booking not found"
        return True, "Booking deleted successfully"
    except Exception as e:
        return False, str(e)


def create_content(content_type, title, slug, summary='', body='', status='draft', created_by=None):
    """Create a content item."""
    try:
        conn = _get_connection()
        c = conn.cursor()

        c.execute(
            '''
            INSERT INTO content_items
            (content_type, title, slug, summary, body, status, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''',
            (
                (content_type or '').strip().lower(),
                (title or '').strip(),
                (slug or '').strip().lower(),
                (summary or '').strip(),
                body or '',
                (status or 'draft').strip().lower(),
                created_by,
                created_by,
            ),
        )
        content_id = c.lastrowid

        conn.commit()
        conn.close()
        return True, "Content created successfully", content_id
    except sqlite3.IntegrityError:
        return False, "Slug already exists", None
    except Exception as e:
        return False, str(e), None


def get_content_by_id(content_id):
    """Get content item by ID."""
    conn = _get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM content_items WHERE id = ?', (content_id,))
    row = c.fetchone()
    conn.close()
    return _row_to_dict(row)


def list_content(search=None, status=None, content_type=None, limit=50, offset=0):
    """List content items with optional filters."""
    conn = _get_connection()
    c = conn.cursor()

    query = '''
        SELECT id, content_type, title, slug, summary, body, status, created_at, updated_at, created_by, updated_by
        FROM content_items
        WHERE 1 = 1
    '''
    params = []

    if search:
        search_term = f"%{search.strip().lower()}%"
        query += ' AND (LOWER(title) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(summary) LIKE ?)'
        params.extend([search_term, search_term, search_term])

    if status:
        query += ' AND status = ?'
        params.append(status.strip().lower())

    if content_type:
        query += ' AND content_type = ?'
        params.append(content_type.strip().lower())

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    params.extend([limit, offset])

    c.execute(query, tuple(params))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def count_content(search=None, status=None, content_type=None):
    """Count content items for pagination."""
    conn = _get_connection()
    c = conn.cursor()

    query = 'SELECT COUNT(*) AS total FROM content_items WHERE 1 = 1'
    params = []

    if search:
        search_term = f"%{search.strip().lower()}%"
        query += ' AND (LOWER(title) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(summary) LIKE ?)'
        params.extend([search_term, search_term, search_term])

    if status:
        query += ' AND status = ?'
        params.append(status.strip().lower())

    if content_type:
        query += ' AND content_type = ?'
        params.append(content_type.strip().lower())

    c.execute(query, tuple(params))
    total = c.fetchone()['total']
    conn.close()
    return total


def update_content(content_id, payload, updated_by=None):
    """Update content item fields."""
    try:
        allowed_fields = {'content_type', 'title', 'slug', 'summary', 'body', 'status'}
        fields = []
        params = []

        for key, value in (payload or {}).items():
            if key not in allowed_fields:
                continue

            if value is None:
                value = ''

            if key in {'content_type', 'slug', 'status'}:
                value = str(value).strip().lower()
            elif key in {'title', 'summary'}:
                value = str(value).strip()

            fields.append(f'{key} = ?')
            params.append(value)

        if updated_by is not None:
            fields.append('updated_by = ?')
            params.append(updated_by)

        if not fields:
            return False, "No valid fields provided"

        fields.append('updated_at = CURRENT_TIMESTAMP')
        params.append(content_id)

        conn = _get_connection()
        c = conn.cursor()
        c.execute(f"UPDATE content_items SET {', '.join(fields)} WHERE id = ?", tuple(params))
        conn.commit()
        updated = c.rowcount > 0
        conn.close()

        if not updated:
            return False, "Content not found"
        return True, "Content updated successfully"
    except sqlite3.IntegrityError:
        return False, "Slug already exists"
    except Exception as e:
        return False, str(e)


def delete_content(content_id):
    """Delete content item by ID."""
    try:
        conn = _get_connection()
        c = conn.cursor()
        c.execute('DELETE FROM content_items WHERE id = ?', (content_id,))
        conn.commit()
        deleted = c.rowcount > 0
        conn.close()

        if not deleted:
            return False, "Content not found"
        return True, "Content deleted successfully"
    except Exception as e:
        return False, str(e)


if __name__ == '__main__':
    init_db()
