from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, create_user, verify_user, get_user_by_email, user_exists, get_all_users, delete_user, update_user_password
import re

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JSON_SORT_KEYS'] = False

# Initialize database on startup
init_db()

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password (minimum 6 characters)"""
    return len(password) >= 6

def validate_name(name):
    """Validate name (non-empty, reasonable length)"""
    return 1 <= len(name.strip()) <= 100

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User signup endpoint"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Validation checks
        if not name:
            return jsonify({'success': False, 'message': 'Name is required'}), 400
        
        if not validate_name(name):
            return jsonify({'success': False, 'message': 'Name must be between 1 and 100 characters'}), 400
        
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        if not validate_email(email):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400
        
        if not password:
            return jsonify({'success': False, 'message': 'Password is required'}), 400
        
        if not validate_password(password):
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        
        if password != confirm_password:
            return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
        
        if user_exists(email):
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        # Create user
        success, message = create_user(name, email, password)
        
        if success:
            return jsonify({'success': True, 'message': message}), 201
        else:
            return jsonify({'success': False, 'message': message}), 400
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        success, message = verify_user(email, password)
        
        if success:
            user = get_user_by_email(email)
            return jsonify({
                'success': True,
                'message': message,
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email']
                }
            }), 200
        else:
            return jsonify({'success': False, 'message': message}), 401
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/api/users/<email>', methods=['GET'])
def get_user(email):
    """Get user details"""
    try:
        user = get_user_by_email(email)
        
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'created_at': user['created_at'],
                    'last_login': user['last_login']
                }
            }), 200
        else:
            return jsonify({'success': False, 'message': 'User not found'}), 404
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/api/auth/change-password', methods=['POST'])
def change_password():
    """Change user password endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        if not email or not old_password or not new_password:
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        # Verify old password
        success, message = verify_user(email, old_password)
        
        if not success:
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401
        
        if not validate_password(new_password):
            return jsonify({'success': False, 'message': 'New password must be at least 6 characters'}), 400
        
        if new_password != confirm_password:
            return jsonify({'success': False, 'message': 'New passwords do not match'}), 400
        
        success, message = update_user_password(email, new_password)
        
        if success:
            return jsonify({'success': True, 'message': message}), 200
        else:
            return jsonify({'success': False, 'message': message}), 400
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/api/admin/users', methods=['GET'])
def list_users():
    """List all users (admin endpoint)"""
    try:
        users = get_all_users()
        return jsonify({
            'success': True,
            'count': len(users),
            'users': users
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/api/admin/users/<email>', methods=['DELETE'])
def delete_user_endpoint(email):
    """Delete a user (admin endpoint)"""
    try:
        success, message = delete_user(email)
        
        if success:
            return jsonify({'success': True, 'message': message}), 200
        else:
            return jsonify({'success': False, 'message': message}), 400
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'Server is running', 'version': '1.0'}), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting Discover Nepal API Server...")
    print("Server running at http://localhost:5000")
    print("API Documentation at http://localhost:5000/api/docs")
    app.run(debug=True, host='0.0.0.0', port=5000)
