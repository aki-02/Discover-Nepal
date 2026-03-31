from datetime import datetime, timedelta, timezone
from functools import wraps
import re

import jwt
from flask import Flask, g, jsonify, request
from flask_cors import CORS

from config import (
    ADMIN_BOOTSTRAP_EMAILS,
    CORS_ORIGINS,
    FLASK_DEBUG,
    JWT_ACCESS_TOKEN_EXPIRES_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    PASSWORD_MIN_LENGTH,
    SERVER_HOST,
    SERVER_PORT,
)
from database import (
    count_bookings,
    count_content,
    count_users,
    create_booking,
    create_content,
    create_user,
    delete_booking,
    delete_content,
    delete_user,
    delete_user_by_id,
    get_all_users,
    get_booking_by_id,
    get_content_by_id,
    get_user_by_email,
    get_user_by_id,
    init_db,
    list_bookings,
    list_content,
    promote_bootstrap_admins,
    update_booking,
    update_content,
    update_user,
    update_user_password,
    user_exists,
    verify_user,
)


VALID_ROLES = {'user', 'admin'}
VALID_BOOKING_STATUS = {'pending', 'confirmed', 'cancelled', 'completed'}
VALID_CONTENT_STATUS = {'draft', 'published', 'archived'}


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration
app.config['JSON_SORT_KEYS'] = False

# Initialize database on startup
init_db()
promoted_count = promote_bootstrap_admins(ADMIN_BOOTSTRAP_EMAILS)
if promoted_count:
    print(f"Bootstrap admin promotion updated {promoted_count} user(s)")


def normalize_email(email):
    return (email or '').strip().lower()


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password length."""
    return len(password) >= PASSWORD_MIN_LENGTH


def validate_name(name):
    """Validate name (non-empty, reasonable length)."""
    return 1 <= len((name or '').strip()) <= 100


def validate_role(role):
    return (role or '').strip().lower() in VALID_ROLES


def validate_slug(slug):
    if not slug:
        return False
    return re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', slug.strip().lower()) is not None


def parse_pagination(default_limit=20, max_limit=100):
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', default_limit))
    except ValueError:
        return None, None, None, (jsonify({'success': False, 'message': 'Invalid pagination values'}), 400)

    page = max(page, 1)
    limit = max(1, min(limit, max_limit))
    offset = (page - 1) * limit
    return page, limit, offset, None


def generate_access_token(user):
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRES_MINUTES)
    payload = {
        'sub': str(user['id']),
        'email': user['email'],
        'role': user.get('role', 'user'),
        'iat': int(now.timestamp()),
        'exp': int(expires_at.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def authenticate_request():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, (jsonify({'success': False, 'message': 'Missing or invalid Authorization header'}), 401)

    token = auth_header.split(' ', 1)[1].strip()
    if not token:
        return None, (jsonify({'success': False, 'message': 'Missing bearer token'}), 401)

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None, (jsonify({'success': False, 'message': 'Token has expired'}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({'success': False, 'message': 'Invalid token'}), 401)

    try:
        user_id = int(payload.get('sub'))
    except (TypeError, ValueError):
        return None, (jsonify({'success': False, 'message': 'Invalid token subject'}), 401)

    user = get_user_by_id(user_id)
    if not user:
        return None, (jsonify({'success': False, 'message': 'User not found for token'}), 401)

    return {'user': user, 'payload': payload}, None


def token_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_data, error_response = authenticate_request()
        if error_response:
            return error_response

        g.current_user = auth_data['user']
        g.token_payload = auth_data['payload']
        return func(*args, **kwargs)

    return wrapper


def admin_required(func):
    @wraps(func)
    @token_required
    def wrapper(*args, **kwargs):
        if g.current_user.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return func(*args, **kwargs)

    return wrapper


@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User signup endpoint."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        name = data.get('name', '').strip()
        email = normalize_email(data.get('email', ''))
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')

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
            return jsonify({'success': False, 'message': f'Password must be at least {PASSWORD_MIN_LENGTH} characters'}), 400

        if password != confirm_password:
            return jsonify({'success': False, 'message': 'Passwords do not match'}), 400

        if user_exists(email):
            return jsonify({'success': False, 'message': 'Email already registered'}), 400

        role = 'admin' if email in {item.lower() for item in ADMIN_BOOTSTRAP_EMAILS} else 'user'

        success, message = create_user(name, email, password, role=role)

        if success:
            return jsonify({'success': True, 'message': message}), 201
        return jsonify({'success': False, 'message': message}), 400

    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        email = normalize_email(data.get('email', ''))
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400

        success, message = verify_user(email, password)

        if success:
            user = get_user_by_email(email)
            token = generate_access_token(user)
            return jsonify(
                {
                    'success': True,
                    'message': message,
                    'token': token,
                    'token_type': 'Bearer',
                    'expires_in_minutes': JWT_ACCESS_TOKEN_EXPIRES_MINUTES,
                    'user': {
                        'id': user['id'],
                        'name': user['name'],
                        'email': user['email'],
                        'role': user.get('role', 'user'),
                    },
                }
            ), 200

        return jsonify({'success': False, 'message': message}), 401

    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500


@app.route('/api/users/<path:email>', methods=['GET'])
@token_required
def get_user(email):
    """Get user details for self or admin."""
    try:
        normalized_email = normalize_email(email)

        is_self = g.current_user['email'] == normalized_email
        is_admin = g.current_user.get('role') == 'admin'
        if not (is_self or is_admin):
            return jsonify({'success': False, 'message': 'Forbidden'}), 403

        user = get_user_by_email(normalized_email)

        if user:
            return jsonify(
                {
                    'success': True,
                    'user': {
                        'id': user['id'],
                        'name': user['name'],
                        'email': user['email'],
                        'role': user.get('role', 'user'),
                        'created_at': user['created_at'],
                        'last_login': user['last_login'],
                    },
                }
            ), 200

        return jsonify({'success': False, 'message': 'User not found'}), 404

    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500


@app.route('/api/auth/change-password', methods=['POST'])
@token_required
def change_password():
    """Change user password endpoint."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        email = normalize_email(data.get('email', ''))
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')

        if not email or not new_password or not confirm_password:
            return jsonify({'success': False, 'message': 'All fields are required'}), 400

        is_self = g.current_user['email'] == email
        is_admin = g.current_user.get('role') == 'admin'
        if not (is_self or is_admin):
            return jsonify({'success': False, 'message': 'Forbidden'}), 403

        if is_self:
            if not old_password:
                return jsonify({'success': False, 'message': 'Current password is required'}), 400

            success, _ = verify_user(email, old_password)
            if not success:
                return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401

        if not validate_password(new_password):
            return jsonify({'success': False, 'message': f'New password must be at least {PASSWORD_MIN_LENGTH} characters'}), 400

        if new_password != confirm_password:
            return jsonify({'success': False, 'message': 'New passwords do not match'}), 400

        success, message = update_user_password(email, new_password)

        if success:
            return jsonify({'success': True, 'message': message}), 200
        return jsonify({'success': False, 'message': message}), 400

    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500


@app.route('/api/bookings', methods=['POST'])
def submit_booking():
    """Public booking submission endpoint."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        name = data.get('name', '').strip()
        email = normalize_email(data.get('email', ''))
        destination = data.get('destination', '').strip()
        travel_date = data.get('travel_date')
        notes = (data.get('notes') or '').strip() or None

        try:
            travelers = int(data.get('travelers', 1))
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'Travelers must be a number'}), 400

        if not validate_name(name):
            return jsonify({'success': False, 'message': 'Name is required'}), 400

        if not validate_email(email):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400

        if not destination:
            return jsonify({'success': False, 'message': 'Destination is required'}), 400

        if travelers < 1 or travelers > 20:
            return jsonify({'success': False, 'message': 'Travelers must be between 1 and 20'}), 400

        success, message, booking_id = create_booking(
            name=name,
            email=email,
            destination=destination,
            travel_date=travel_date,
            travelers=travelers,
            notes=notes,
            status='pending',
            created_by='public-form',
        )

        if success:
            return jsonify({'success': True, 'message': message, 'booking_id': booking_id}), 201
        return jsonify({'success': False, 'message': message}), 400

    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500


@app.route('/api/content', methods=['GET'])
def get_public_content():
    """Public content listing (published only)."""
    page, limit, offset, pagination_error = parse_pagination()
    if pagination_error:
        return pagination_error

    search = request.args.get('q', '').strip() or None
    content_type = request.args.get('type', '').strip().lower() or None
    rows = list_content(search=search, status='published', content_type=content_type, limit=limit, offset=offset)
    total = count_content(search=search, status='published', content_type=content_type)

    return (
        jsonify({'success': True, 'count': len(rows), 'total': total, 'page': page, 'limit': limit, 'content': rows}),
        200,
    )


@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_list_users():
    """Admin: list users with optional filters."""
    page, limit, offset, pagination_error = parse_pagination()
    if pagination_error:
        return pagination_error

    search = request.args.get('q', '').strip() or None
    role = request.args.get('role', '').strip().lower() or None

    if role and role not in VALID_ROLES:
        return jsonify({'success': False, 'message': 'Invalid role filter'}), 400

    users = get_all_users(search=search, role=role, limit=limit, offset=offset)
    total = count_users(search=search, role=role)

    return jsonify({'success': True, 'count': len(users), 'total': total, 'page': page, 'limit': limit, 'users': users}), 200


@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@admin_required
def admin_get_user(user_id):
    """Admin: get one user by ID."""
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    safe_user = {
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user.get('role', 'user'),
        'created_at': user['created_at'],
        'last_login': user['last_login'],
    }
    return jsonify({'success': True, 'user': safe_user}), 200


@app.route('/api/admin/users', methods=['POST'])
@admin_required
def admin_create_user():
    """Admin: create user."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    name = data.get('name', '').strip()
    email = normalize_email(data.get('email', ''))
    password = data.get('password', '')
    role = data.get('role', 'user').strip().lower()

    if not validate_name(name):
        return jsonify({'success': False, 'message': 'Invalid name'}), 400

    if not validate_email(email):
        return jsonify({'success': False, 'message': 'Invalid email format'}), 400

    if not validate_password(password):
        return jsonify({'success': False, 'message': f'Password must be at least {PASSWORD_MIN_LENGTH} characters'}), 400

    if not validate_role(role):
        return jsonify({'success': False, 'message': 'Invalid role'}), 400

    if user_exists(email):
        return jsonify({'success': False, 'message': 'Email already registered'}), 400

    success, message = create_user(name, email, password, role=role)
    if not success:
        return jsonify({'success': False, 'message': message}), 400

    user = get_user_by_email(email)
    safe_user = {
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user.get('role', 'user'),
        'created_at': user['created_at'],
        'last_login': user['last_login'],
    }

    return jsonify({'success': True, 'message': message, 'user': safe_user}), 201


@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@admin_required
def admin_update_user(user_id):
    """Admin: update user."""
    existing_user = get_user_by_id(user_id)
    if not existing_user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    name = data.get('name')
    email = data.get('email')
    role = data.get('role')
    password = data.get('password')

    if name is not None and not validate_name(name):
        return jsonify({'success': False, 'message': 'Invalid name'}), 400

    if email is not None:
        email = normalize_email(email)
        if not validate_email(email):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400

    if role is not None:
        role = role.strip().lower()
        if not validate_role(role):
            return jsonify({'success': False, 'message': 'Invalid role'}), 400

        # Prevent locking out the currently authenticated admin.
        if g.current_user['id'] == user_id and role != 'admin':
            return jsonify({'success': False, 'message': 'You cannot remove your own admin role'}), 400

    if password is not None and not validate_password(password):
        return jsonify({'success': False, 'message': f'Password must be at least {PASSWORD_MIN_LENGTH} characters'}), 400

    success, message = update_user(user_id, name=name, email=email, role=role, password=password)
    if not success:
        return jsonify({'success': False, 'message': message}), 400

    user = get_user_by_id(user_id)
    safe_user = {
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user.get('role', 'user'),
        'created_at': user['created_at'],
        'last_login': user['last_login'],
    }
    return jsonify({'success': True, 'message': message, 'user': safe_user}), 200


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(user_id):
    """Admin: delete user by ID."""
    if g.current_user['id'] == user_id:
        return jsonify({'success': False, 'message': 'You cannot delete your own account'}), 400

    success, message = delete_user_by_id(user_id)
    if success:
        return jsonify({'success': True, 'message': message}), 200
    return jsonify({'success': False, 'message': message}), 404


@app.route('/api/admin/users/email/<path:email>', methods=['DELETE'])
@admin_required
def admin_delete_user_by_email(email):
    """Admin: compatibility route to delete user by email."""
    normalized_email = normalize_email(email)
    if g.current_user['email'] == normalized_email:
        return jsonify({'success': False, 'message': 'You cannot delete your own account'}), 400

    success, message = delete_user(normalized_email)
    if success:
        return jsonify({'success': True, 'message': message}), 200
    return jsonify({'success': False, 'message': message}), 404


@app.route('/api/admin/bookings', methods=['GET'])
@admin_required
def admin_list_bookings():
    """Admin: list bookings."""
    page, limit, offset, pagination_error = parse_pagination()
    if pagination_error:
        return pagination_error

    search = request.args.get('q', '').strip() or None
    status = request.args.get('status', '').strip().lower() or None

    if status and status not in VALID_BOOKING_STATUS:
        return jsonify({'success': False, 'message': 'Invalid booking status'}), 400

    bookings = list_bookings(search=search, status=status, limit=limit, offset=offset)
    total = count_bookings(search=search, status=status)
    return (
        jsonify({'success': True, 'count': len(bookings), 'total': total, 'page': page, 'limit': limit, 'bookings': bookings}),
        200,
    )


@app.route('/api/admin/bookings/<int:booking_id>', methods=['GET'])
@admin_required
def admin_get_booking(booking_id):
    """Admin: get booking by ID."""
    booking = get_booking_by_id(booking_id)
    if not booking:
        return jsonify({'success': False, 'message': 'Booking not found'}), 404

    return jsonify({'success': True, 'booking': booking}), 200


@app.route('/api/admin/bookings', methods=['POST'])
@admin_required
def admin_create_booking():
    """Admin: create booking."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    name = (data.get('name') or '').strip()
    email = normalize_email(data.get('email', ''))
    destination = (data.get('destination') or '').strip()
    status = (data.get('status') or 'pending').strip().lower()
    travel_date = data.get('travel_date')
    notes = (data.get('notes') or '').strip() or None

    try:
        travelers = int(data.get('travelers', 1))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'Travelers must be a number'}), 400

    if not validate_name(name):
        return jsonify({'success': False, 'message': 'Invalid name'}), 400

    if not validate_email(email):
        return jsonify({'success': False, 'message': 'Invalid email format'}), 400

    if not destination:
        return jsonify({'success': False, 'message': 'Destination is required'}), 400

    if travelers < 1 or travelers > 20:
        return jsonify({'success': False, 'message': 'Travelers must be between 1 and 20'}), 400

    if status not in VALID_BOOKING_STATUS:
        return jsonify({'success': False, 'message': 'Invalid booking status'}), 400

    success, message, booking_id = create_booking(
        name=name,
        email=email,
        destination=destination,
        travel_date=travel_date,
        travelers=travelers,
        notes=notes,
        status=status,
        created_by=g.current_user['email'],
    )

    if not success:
        return jsonify({'success': False, 'message': message}), 400

    booking = get_booking_by_id(booking_id)
    return jsonify({'success': True, 'message': message, 'booking': booking}), 201


@app.route('/api/admin/bookings/<int:booking_id>', methods=['PUT'])
@admin_required
def admin_update_booking(booking_id):
    """Admin: update booking."""
    existing = get_booking_by_id(booking_id)
    if not existing:
        return jsonify({'success': False, 'message': 'Booking not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    payload = {}

    if 'name' in data:
        if not validate_name(data.get('name', '')):
            return jsonify({'success': False, 'message': 'Invalid name'}), 400
        payload['name'] = data.get('name')

    if 'email' in data:
        normalized_email = normalize_email(data.get('email'))
        if not validate_email(normalized_email):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400
        payload['email'] = normalized_email

    if 'destination' in data:
        destination = (data.get('destination') or '').strip()
        if not destination:
            return jsonify({'success': False, 'message': 'Destination is required'}), 400
        payload['destination'] = destination

    if 'travelers' in data:
        try:
            travelers = int(data.get('travelers'))
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'Travelers must be a number'}), 400

        if travelers < 1 or travelers > 20:
            return jsonify({'success': False, 'message': 'Travelers must be between 1 and 20'}), 400
        payload['travelers'] = travelers

    if 'status' in data:
        status = (data.get('status') or '').strip().lower()
        if status not in VALID_BOOKING_STATUS:
            return jsonify({'success': False, 'message': 'Invalid booking status'}), 400
        payload['status'] = status

    if 'travel_date' in data:
        payload['travel_date'] = data.get('travel_date')

    if 'notes' in data:
        payload['notes'] = data.get('notes')

    success, message = update_booking(booking_id, payload, updated_by=g.current_user['email'])
    if not success:
        return jsonify({'success': False, 'message': message}), 400

    booking = get_booking_by_id(booking_id)
    return jsonify({'success': True, 'message': message, 'booking': booking}), 200


@app.route('/api/admin/bookings/<int:booking_id>', methods=['DELETE'])
@admin_required
def admin_delete_booking(booking_id):
    """Admin: delete booking."""
    success, message = delete_booking(booking_id)
    if success:
        return jsonify({'success': True, 'message': message}), 200
    return jsonify({'success': False, 'message': message}), 404


@app.route('/api/admin/content', methods=['GET'])
@admin_required
def admin_list_content():
    """Admin: list content items."""
    page, limit, offset, pagination_error = parse_pagination()
    if pagination_error:
        return pagination_error

    search = request.args.get('q', '').strip() or None
    status = request.args.get('status', '').strip().lower() or None
    content_type = request.args.get('type', '').strip().lower() or None

    if status and status not in VALID_CONTENT_STATUS:
        return jsonify({'success': False, 'message': 'Invalid content status'}), 400

    items = list_content(search=search, status=status, content_type=content_type, limit=limit, offset=offset)
    total = count_content(search=search, status=status, content_type=content_type)

    return jsonify({'success': True, 'count': len(items), 'total': total, 'page': page, 'limit': limit, 'content': items}), 200


@app.route('/api/admin/content/<int:content_id>', methods=['GET'])
@admin_required
def admin_get_content(content_id):
    """Admin: get one content item."""
    item = get_content_by_id(content_id)
    if not item:
        return jsonify({'success': False, 'message': 'Content not found'}), 404

    return jsonify({'success': True, 'content': item}), 200


@app.route('/api/admin/content', methods=['POST'])
@admin_required
def admin_create_content():
    """Admin: create content item."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    content_type = (data.get('content_type') or '').strip().lower()
    title = (data.get('title') or '').strip()
    slug = (data.get('slug') or '').strip().lower()
    summary = (data.get('summary') or '').strip()
    body = data.get('body') or ''
    status = (data.get('status') or 'draft').strip().lower()

    if not content_type:
        return jsonify({'success': False, 'message': 'Content type is required'}), 400

    if not title:
        return jsonify({'success': False, 'message': 'Title is required'}), 400

    if not validate_slug(slug):
        return jsonify({'success': False, 'message': 'Slug must be lowercase words separated by hyphens'}), 400

    if status not in VALID_CONTENT_STATUS:
        return jsonify({'success': False, 'message': 'Invalid content status'}), 400

    success, message, content_id = create_content(
        content_type=content_type,
        title=title,
        slug=slug,
        summary=summary,
        body=body,
        status=status,
        created_by=g.current_user['email'],
    )

    if not success:
        return jsonify({'success': False, 'message': message}), 400

    item = get_content_by_id(content_id)
    return jsonify({'success': True, 'message': message, 'content': item}), 201


@app.route('/api/admin/content/<int:content_id>', methods=['PUT'])
@admin_required
def admin_update_content(content_id):
    """Admin: update content item."""
    existing = get_content_by_id(content_id)
    if not existing:
        return jsonify({'success': False, 'message': 'Content not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    payload = {}

    if 'content_type' in data:
        value = (data.get('content_type') or '').strip().lower()
        if not value:
            return jsonify({'success': False, 'message': 'Content type is required'}), 400
        payload['content_type'] = value

    if 'title' in data:
        value = (data.get('title') or '').strip()
        if not value:
            return jsonify({'success': False, 'message': 'Title is required'}), 400
        payload['title'] = value

    if 'slug' in data:
        value = (data.get('slug') or '').strip().lower()
        if not validate_slug(value):
            return jsonify({'success': False, 'message': 'Slug must be lowercase words separated by hyphens'}), 400
        payload['slug'] = value

    if 'summary' in data:
        payload['summary'] = data.get('summary')

    if 'body' in data:
        payload['body'] = data.get('body')

    if 'status' in data:
        value = (data.get('status') or '').strip().lower()
        if value not in VALID_CONTENT_STATUS:
            return jsonify({'success': False, 'message': 'Invalid content status'}), 400
        payload['status'] = value

    success, message = update_content(content_id, payload, updated_by=g.current_user['email'])
    if not success:
        return jsonify({'success': False, 'message': message}), 400

    item = get_content_by_id(content_id)
    return jsonify({'success': True, 'message': message, 'content': item}), 200


@app.route('/api/admin/content/<int:content_id>', methods=['DELETE'])
@admin_required
def admin_delete_content(content_id):
    """Admin: delete content item."""
    success, message = delete_content(content_id)
    if success:
        return jsonify({'success': True, 'message': message}), 200
    return jsonify({'success': False, 'message': message}), 404


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return (
        jsonify(
            {
                'status': 'Server is running',
                'version': '2.0',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'features': ['jwt-auth', 'rbac', 'admin-users', 'admin-bookings', 'admin-content'],
            }
        ),
        200,
    )


@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500


if __name__ == '__main__':
    print('Starting Discover Nepal API Server...')
    print(f'Server running at http://localhost:{SERVER_PORT}')
    print('Admin APIs available under /api/admin/*')
    app.run(debug=FLASK_DEBUG, host=SERVER_HOST, port=SERVER_PORT)
