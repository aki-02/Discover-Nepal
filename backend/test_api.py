"""
API Testing Script for Discover Nepal Login System
Tests all API endpoints to ensure the system is working correctly
"""

import requests
import json
from datetime import datetime

# Configuration
API_URL = 'http://localhost:5000/api'
TEST_USER = {
    'name': 'Test User',
    'email': f'testuser_{int(datetime.now().timestamp())}@example.com',
    'password': 'testpassword123'
}

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(test_name, passed, response_data=None):
    """Print test result"""
    status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
    print(f"{status} - {test_name}")
    if response_data and not passed:
        print(f"  Response: {response_data}")

def print_header(title):
    """Print section header"""
    print(f"\n{BLUE}{'='*60}")
    print(f"{title}")
    print(f"{'='*60}{RESET}\n")

def test_health_check():
    """Test health check endpoint"""
    print_header("Health Check")
    try:
        response = requests.get(f'{API_URL}/health')
        passed = response.status_code == 200
        print_test("Health Check", passed, response.json())
        return passed
    except Exception as e:
        print_test("Health Check", False, str(e))
        return False

def test_signup():
    """Test user signup"""
    print_header("User Signup")
    
    # Valid signup
    try:
        response = requests.post(f'{API_URL}/auth/signup', json={
            'name': TEST_USER['name'],
            'email': TEST_USER['email'],
            'password': TEST_USER['password'],
            'confirm_password': TEST_USER['password']
        })
        passed = response.status_code == 201 and response.json()['success']
        print_test("Valid Signup", passed, response.json() if not passed else None)
    except Exception as e:
        print_test("Valid Signup", False, str(e))
    
    # Missing fields
    try:
        response = requests.post(f'{API_URL}/auth/signup', json={
            'name': 'Test',
            'email': 'test@example.com'
        })
        passed = response.status_code == 400 and not response.json()['success']
        print_test("Missing Fields Validation", passed)
    except Exception as e:
        print_test("Missing Fields Validation", False, str(e))
    
    # Invalid email
    try:
        response = requests.post(f'{API_URL}/auth/signup', json={
            'name': 'Test',
            'email': 'invalidemail',
            'password': 'password123',
            'confirm_password': 'password123'
        })
        passed = response.status_code == 400 and not response.json()['success']
        print_test("Invalid Email Validation", passed)
    except Exception as e:
        print_test("Invalid Email Validation", False, str(e))
    
    # Password too short
    try:
        response = requests.post(f'{API_URL}/auth/signup', json={
            'name': 'Test',
            'email': 'test@example.com',
            'password': '123',
            'confirm_password': '123'
        })
        passed = response.status_code == 400 and not response.json()['success']
        print_test("Password Length Validation", passed)
    except Exception as e:
        print_test("Password Length Validation", False, str(e))
    
    # Passwords don't match
    try:
        response = requests.post(f'{API_URL}/auth/signup', json={
            'name': 'Test',
            'email': 'test@example.com',
            'password': 'password123',
            'confirm_password': 'different123'
        })
        passed = response.status_code == 400 and not response.json()['success']
        print_test("Password Mismatch Validation", passed)
    except Exception as e:
        print_test("Password Mismatch Validation", False, str(e))

def test_login():
    """Test user login"""
    print_header("User Login")
    
    # Valid login
    try:
        response = requests.post(f'{API_URL}/auth/login', json={
            'email': TEST_USER['email'],
            'password': TEST_USER['password']
        })
        passed = response.status_code == 200 and response.json()['success']
        print_test("Valid Login", passed, response.json() if not passed else None)
        return passed
    except Exception as e:
        print_test("Valid Login", False, str(e))
        return False

def test_login_invalid():
    """Test invalid login attempts"""
    print_header("Invalid Login Tests")
    
    # Wrong password
    try:
        response = requests.post(f'{API_URL}/auth/login', json={
            'email': TEST_USER['email'],
            'password': 'wrongpassword'
        })
        passed = response.status_code == 401 and not response.json()['success']
        print_test("Wrong Password Rejection", passed)
    except Exception as e:
        print_test("Wrong Password Rejection", False, str(e))
    
    # Non-existent user
    try:
        response = requests.post(f'{API_URL}/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'password123'
        })
        passed = response.status_code == 401 and not response.json()['success']
        print_test("Non-existent User Rejection", passed)
    except Exception as e:
        print_test("Non-existent User Rejection", False, str(e))
    
    # Missing credentials
    try:
        response = requests.post(f'{API_URL}/auth/login', json={
            'email': TEST_USER['email']
        })
        passed = response.status_code == 400 and not response.json()['success']
        print_test("Missing Credentials Rejection", passed)
    except Exception as e:
        print_test("Missing Credentials Rejection", False, str(e))

def test_get_user():
    """Test get user endpoint"""
    print_header("Get User Details")
    
    try:
        response = requests.get(f'{API_URL}/users/{TEST_USER["email"]}')
        passed = response.status_code == 200 and response.json()['success']
        print_test("Get User Details", passed, response.json() if not passed else None)
    except Exception as e:
        print_test("Get User Details", False, str(e))

def test_duplicate_email():
    """Test duplicate email prevention"""
    print_header("Duplicate Email Prevention")
    
    try:
        response = requests.post(f'{API_URL}/auth/signup', json={
            'name': 'Duplicate Test',
            'email': TEST_USER['email'],
            'password': 'password123',
            'confirm_password': 'password123'
        })
        passed = response.status_code == 400 and not response.json()['success'] and 'already' in response.json()['message'].lower()
        print_test("Duplicate Email Rejection", passed, response.json() if not passed else None)
    except Exception as e:
        print_test("Duplicate Email Rejection", False, str(e))

def test_change_password():
    """Test password change functionality"""
    print_header("Change Password")
    
    new_password = 'newpassword456'
    
    # Change password
    try:
        response = requests.post(f'{API_URL}/auth/change-password', json={
            'email': TEST_USER['email'],
            'old_password': TEST_USER['password'],
            'new_password': new_password,
            'confirm_password': new_password
        })
        passed = response.status_code == 200 and response.json()['success']
        print_test("Password Change", passed, response.json() if not passed else None)
        
        # Try login with new password
        response = requests.post(f'{API_URL}/auth/login', json={
            'email': TEST_USER['email'],
            'password': new_password
        })
        passed = response.status_code == 200 and response.json()['success']
        print_test("Login with New Password", passed)
        
        # Update TEST_USER for cleanup
        TEST_USER['password'] = new_password
    except Exception as e:
        print_test("Password Change", False, str(e))

def run_all_tests():
    """Run all tests"""
    print(f"{YELLOW}")
    print("╔════════════════════════════════════════════════════════╗")
    print("║   Discover Nepal - Login System API Test Suite       ║")
    print("║          v1.0 - Testing Script                       ║")
    print("╚════════════════════════════════════════════════════════╝")
    print(f"{RESET}")
    
    print(f"\n{YELLOW}API URL: {API_URL}{RESET}")
    print(f"{YELLOW}Test User Email: {TEST_USER['email']}{RESET}\n")
    
    # Check if server is running
    try:
        requests.get(f'{API_URL}/health', timeout=2)
    except:
        print(f"{RED}✗ ERROR: Cannot connect to server at {API_URL}{RESET}")
        print(f"{YELLOW}Please ensure Flask server is running: python app.py{RESET}")
        return
    
    # Run tests
    test_health_check()
    test_signup()
    test_login()
    test_login_invalid()
    test_get_user()
    test_duplicate_email()
    test_change_password()
    
    print_header("Test Suite Complete")
    print(f"{GREEN}All tests completed!{RESET}\n")

if __name__ == '__main__':
    run_all_tests()
