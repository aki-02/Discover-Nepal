import os
import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# Database file path
DB_FILE = 'users.db'

def init_db():
    """Initialize the database with the users table"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Create users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_FILE}")

def get_user_by_email(email):
    """Retrieve user by email"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = c.fetchone()
    conn.close()
    
    return dict(user) if user else None

def user_exists(email):
    """Check if user exists"""
    return get_user_by_email(email) is not None

def create_user(name, email, password):
    """Create a new user"""
    try:
        # Hash the password
        hashed_password = generate_password_hash(password)
        
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        ''', (name, email, hashed_password))
        
        conn.commit()
        conn.close()
        
        return True, "User created successfully"
    except sqlite3.IntegrityError:
        return False, "Email already exists"
    except Exception as e:
        return False, str(e)

def verify_user(email, password):
    """Verify user credentials"""
    user = get_user_by_email(email)
    
    if not user:
        return False, "User not found"
    
    if check_password_hash(user['password'], password):
        # Update last login
        update_last_login(email)
        return True, "Login successful"
    else:
        return False, "Invalid password"

def update_last_login(email):
    """Update last login timestamp"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        c.execute('''
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP 
            WHERE email = ?
        ''', (email,))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error updating last login: {e}")

def get_all_users():
    """Get all users (for admin purposes)"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT id, name, email, created_at, last_login FROM users')
    users = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return users

def delete_user(email):
    """Delete a user"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        c.execute('DELETE FROM users WHERE email = ?', (email,))
        
        conn.commit()
        conn.close()
        
        return True, "User deleted successfully"
    except Exception as e:
        return False, str(e)

def update_user_password(email, new_password):
    """Update user password"""
    try:
        hashed_password = generate_password_hash(new_password)
        
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        c.execute('''
            UPDATE users 
            SET password = ? 
            WHERE email = ?
        ''', (hashed_password, email))
        
        conn.commit()
        conn.close()
        
        return True, "Password updated successfully"
    except Exception as e:
        return False, str(e)

if __name__ == '__main__':
    init_db()
