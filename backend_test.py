#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for TaskSync To-Do App
Tests all authentication, CRUD operations, statistics, and error handling
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("ERROR: Could not get backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"
print(f"Testing backend at: {API_BASE}")

# Test data
TEST_USER = {
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "name": "John Doe"
}

TEST_USER_2 = {
    "email": "jane.smith@example.com", 
    "password": "anotherpassword456",
    "name": "Jane Smith"
}

# Global variables for test state
auth_token = None
user_id = None
task_ids = []

def make_request(method, endpoint, data=None, headers=None, params=None):
    """Helper function to make HTTP requests with error handling"""
    url = f"{API_BASE}{endpoint}"
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, params=params, timeout=10)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, headers=headers, timeout=10)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed for {method} {endpoint}: {e}")
        return None

def get_auth_headers():
    """Get authorization headers with JWT token"""
    if not auth_token:
        return {}
    return {"Authorization": f"Bearer {auth_token}"}

def test_health_check():
    """Test health check endpoint"""
    print("\n🔍 Testing Health Check...")
    
    response = make_request('GET', '/health')
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if 'status' in data and data['status'] == 'healthy':
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed - invalid response: {data}")
            return False
    else:
        print(f"❌ Health check failed - status: {response.status_code}")
        return False

def test_user_registration():
    """Test user registration"""
    print("\n🔍 Testing User Registration...")
    global auth_token, user_id
    
    # Test successful registration
    response = make_request('POST', '/auth/register', TEST_USER)
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if 'access_token' in data and 'user' in data:
            auth_token = data['access_token']
            user_id = data['user']['id']
            print(f"✅ User registration successful - User ID: {user_id}")
            return True
        else:
            print(f"❌ Registration failed - missing fields in response: {data}")
            return False
    else:
        print(f"❌ Registration failed - status: {response.status_code}, response: {response.text}")
        return False

def test_duplicate_registration():
    """Test duplicate email registration"""
    print("\n🔍 Testing Duplicate Registration...")
    
    response = make_request('POST', '/auth/register', TEST_USER)
    if not response:
        return False
        
    if response.status_code == 400:
        data = response.json()
        if 'detail' in data and 'already registered' in data['detail'].lower():
            print("✅ Duplicate registration properly rejected")
            return True
        else:
            print(f"❌ Duplicate registration - wrong error message: {data}")
            return False
    else:
        print(f"❌ Duplicate registration should return 400, got: {response.status_code}")
        return False

def test_user_login():
    """Test user login"""
    print("\n🔍 Testing User Login...")
    global auth_token, user_id
    
    login_data = {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    
    response = make_request('POST', '/auth/login', login_data)
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if 'access_token' in data and 'user' in data:
            auth_token = data['access_token']
            user_id = data['user']['id']
            print(f"✅ User login successful - Token received")
            return True
        else:
            print(f"❌ Login failed - missing fields: {data}")
            return False
    else:
        print(f"❌ Login failed - status: {response.status_code}, response: {response.text}")
        return False

def test_invalid_login():
    """Test login with invalid credentials"""
    print("\n🔍 Testing Invalid Login...")
    
    invalid_login = {
        "email": TEST_USER["email"],
        "password": "wrongpassword"
    }
    
    response = make_request('POST', '/auth/login', invalid_login)
    if not response:
        return False
        
    if response.status_code == 401:
        print("✅ Invalid login properly rejected")
        return True
    else:
        print(f"❌ Invalid login should return 401, got: {response.status_code}")
        return False

def test_get_current_user():
    """Test getting current user info"""
    print("\n🔍 Testing Get Current User...")
    
    headers = get_auth_headers()
    response = make_request('GET', '/auth/me', headers=headers)
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if 'id' in data and 'email' in data and 'name' in data:
            if data['email'] == TEST_USER['email'] and data['name'] == TEST_USER['name']:
                print("✅ Get current user successful")
                return True
            else:
                print(f"❌ User data mismatch: {data}")
                return False
        else:
            print(f"❌ Get current user - missing fields: {data}")
            return False
    else:
        print(f"❌ Get current user failed - status: {response.status_code}")
        return False

def test_unauthorized_access():
    """Test accessing protected endpoint without token"""
    print("\n🔍 Testing Unauthorized Access...")
    
    response = make_request('GET', '/auth/me')
    if not response:
        return False
        
    if response.status_code == 403:  # FastAPI HTTPBearer returns 403 for missing token
        print("✅ Unauthorized access properly rejected")
        return True
    else:
        print(f"❌ Unauthorized access should return 403, got: {response.status_code}")
        return False

def test_create_task():
    """Test creating a new task"""
    print("\n🔍 Testing Create Task...")
    global task_ids
    
    task_data = {
        "title": "Complete project documentation",
        "description": "Write comprehensive documentation for the TaskSync project",
        "due_date": (datetime.now() + timedelta(days=7)).isoformat()
    }
    
    headers = get_auth_headers()
    response = make_request('POST', '/tasks', task_data, headers=headers)
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if 'id' in data and 'title' in data and data['title'] == task_data['title']:
            task_ids.append(data['id'])
            print(f"✅ Task created successfully - ID: {data['id']}")
            return True
        else:
            print(f"❌ Create task failed - invalid response: {data}")
            return False
    else:
        print(f"❌ Create task failed - status: {response.status_code}, response: {response.text}")
        return False

def test_create_multiple_tasks():
    """Create multiple tasks for testing"""
    print("\n🔍 Creating Multiple Tasks for Testing...")
    global task_ids
    
    tasks = [
        {
            "title": "Review code changes",
            "description": "Review pull requests and provide feedback",
            "due_date": (datetime.now() + timedelta(days=2)).isoformat()
        },
        {
            "title": "Update dependencies",
            "description": "Update all project dependencies to latest versions"
        },
        {
            "title": "Fix bug in authentication",
            "description": "Resolve the JWT token validation issue",
            "due_date": (datetime.now() - timedelta(days=1)).isoformat()  # Overdue task
        }
    ]
    
    headers = get_auth_headers()
    success_count = 0
    
    for task_data in tasks:
        response = make_request('POST', '/tasks', task_data, headers=headers)
        if response and response.status_code == 200:
            data = response.json()
            task_ids.append(data['id'])
            success_count += 1
    
    if success_count == len(tasks):
        print(f"✅ Created {success_count} additional tasks")
        return True
    else:
        print(f"❌ Only created {success_count}/{len(tasks)} tasks")
        return False

def test_get_tasks():
    """Test getting all tasks"""
    print("\n🔍 Testing Get All Tasks...")
    
    headers = get_auth_headers()
    response = make_request('GET', '/tasks', headers=headers)
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list) and len(data) >= len(task_ids):
            print(f"✅ Retrieved {len(data)} tasks")
            return True
        else:
            print(f"❌ Get tasks failed - expected list with {len(task_ids)} tasks, got: {data}")
            return False
    else:
        print(f"❌ Get tasks failed - status: {response.status_code}")
        return False

def test_get_task_by_id():
    """Test getting a specific task by ID"""
    print("\n🔍 Testing Get Task by ID...")
    
    if not task_ids:
        print("❌ No task IDs available for testing")
        return False
    
    task_id = task_ids[0]
    headers = get_auth_headers()
    response = make_request('GET', f'/tasks/{task_id}', headers=headers)
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if 'id' in data and data['id'] == task_id:
            print(f"✅ Retrieved task by ID: {task_id}")
            return True
        else:
            print(f"❌ Get task by ID failed - wrong task returned: {data}")
            return False
    else:
        print(f"❌ Get task by ID failed - status: {response.status_code}")
        return False

def test_update_task():
    """Test updating a task"""
    print("\n🔍 Testing Update Task...")
    
    if not task_ids:
        print("❌ No task IDs available for testing")
        return False
    
    task_id = task_ids[0]
    update_data = {
        "title": "Updated: Complete project documentation",
        "completed": True
    }
    
    headers = get_auth_headers()
    response = make_request('PUT', f'/tasks/{task_id}', update_data, headers=headers)
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if data['title'] == update_data['title'] and data['completed'] == True:
            print(f"✅ Task updated successfully")
            return True
        else:
            print(f"❌ Task update failed - data not updated: {data}")
            return False
    else:
        print(f"❌ Update task failed - status: {response.status_code}")
        return False

def test_task_filtering():
    """Test task filtering by completion status"""
    print("\n🔍 Testing Task Filtering...")
    
    headers = get_auth_headers()
    
    # Test completed tasks
    response = make_request('GET', '/tasks', headers=headers, params={'completed': True})
    if not response or response.status_code != 200:
        print("❌ Failed to get completed tasks")
        return False
    
    completed_tasks = response.json()
    
    # Test pending tasks
    response = make_request('GET', '/tasks', headers=headers, params={'completed': False})
    if not response or response.status_code != 200:
        print("❌ Failed to get pending tasks")
        return False
    
    pending_tasks = response.json()
    
    print(f"✅ Task filtering works - Completed: {len(completed_tasks)}, Pending: {len(pending_tasks)}")
    return True

def test_task_search():
    """Test task search functionality"""
    print("\n🔍 Testing Task Search...")
    
    headers = get_auth_headers()
    response = make_request('GET', '/tasks', headers=headers, params={'search': 'documentation'})
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            # Check if search results contain the search term
            found_match = any('documentation' in task.get('title', '').lower() or 
                            'documentation' in task.get('description', '').lower() 
                            for task in data)
            if found_match:
                print(f"✅ Task search works - found {len(data)} results")
                return True
            else:
                print(f"❌ Task search failed - no matching results: {data}")
                return False
        else:
            print(f"❌ Task search failed - invalid response: {data}")
            return False
    else:
        print(f"❌ Task search failed - status: {response.status_code}")
        return False

def test_task_stats():
    """Test task statistics endpoint"""
    print("\n🔍 Testing Task Statistics...")
    
    headers = get_auth_headers()
    response = make_request('GET', '/tasks/stats/summary', headers=headers)
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        required_fields = ['total_tasks', 'completed_tasks', 'pending_tasks', 'due_today', 'overdue']
        
        if all(field in data for field in required_fields):
            print(f"✅ Task statistics: Total: {data['total_tasks']}, Completed: {data['completed_tasks']}, Pending: {data['pending_tasks']}, Due Today: {data['due_today']}, Overdue: {data['overdue']}")
            return True
        else:
            print(f"❌ Task statistics failed - missing fields: {data}")
            return False
    else:
        print(f"❌ Task statistics failed - status: {response.status_code}")
        return False

def test_delete_task():
    """Test deleting a task"""
    print("\n🔍 Testing Delete Task...")
    
    if len(task_ids) < 2:
        print("❌ Not enough task IDs available for testing")
        return False
    
    task_id = task_ids[-1]  # Delete the last task
    headers = get_auth_headers()
    response = make_request('DELETE', f'/tasks/{task_id}', headers=headers)
    if not response:
        return False
        
    if response.status_code == 200:
        data = response.json()
        if 'message' in data and 'deleted' in data['message'].lower():
            task_ids.remove(task_id)
            print(f"✅ Task deleted successfully")
            return True
        else:
            print(f"❌ Delete task failed - invalid response: {data}")
            return False
    else:
        print(f"❌ Delete task failed - status: {response.status_code}")
        return False

def test_invalid_task_operations():
    """Test operations with invalid task IDs"""
    print("\n🔍 Testing Invalid Task Operations...")
    
    headers = get_auth_headers()
    invalid_id = "invalid-task-id"
    
    # Test get invalid task
    response = make_request('GET', f'/tasks/{invalid_id}', headers=headers)
    if not response or response.status_code != 400:
        print(f"❌ Get invalid task should return 400, got: {response.status_code if response else 'None'}")
        return False
    
    # Test update invalid task
    response = make_request('PUT', f'/tasks/{invalid_id}', {"title": "test"}, headers=headers)
    if not response or response.status_code != 400:
        print(f"❌ Update invalid task should return 400, got: {response.status_code if response else 'None'}")
        return False
    
    # Test delete invalid task
    response = make_request('DELETE', f'/tasks/{invalid_id}', headers=headers)
    if not response or response.status_code != 400:
        print(f"❌ Delete invalid task should return 400, got: {response.status_code if response else 'None'}")
        return False
    
    print("✅ Invalid task operations properly handled")
    return True

def test_task_authorization():
    """Test that users can only access their own tasks"""
    print("\n🔍 Testing Task Authorization...")
    
    # Create second user
    response = make_request('POST', '/auth/register', TEST_USER_2)
    if not response or response.status_code != 200:
        print("❌ Failed to create second user for authorization test")
        return False
    
    second_user_token = response.json()['access_token']
    
    # Try to access first user's task with second user's token
    if not task_ids:
        print("❌ No task IDs available for authorization test")
        return False
    
    task_id = task_ids[0]
    headers = {"Authorization": f"Bearer {second_user_token}"}
    response = make_request('GET', f'/tasks/{task_id}', headers=headers)
    
    if not response or response.status_code != 404:
        print(f"❌ Task authorization failed - should return 404, got: {response.status_code if response else 'None'}")
        return False
    
    print("✅ Task authorization works - users can only access their own tasks")
    return True

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting TaskSync Backend API Tests")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("User Registration", test_user_registration),
        ("Duplicate Registration", test_duplicate_registration),
        ("User Login", test_user_login),
        ("Invalid Login", test_invalid_login),
        ("Get Current User", test_get_current_user),
        ("Unauthorized Access", test_unauthorized_access),
        ("Create Task", test_create_task),
        ("Create Multiple Tasks", test_create_multiple_tasks),
        ("Get All Tasks", test_get_tasks),
        ("Get Task by ID", test_get_task_by_id),
        ("Update Task", test_update_task),
        ("Task Filtering", test_task_filtering),
        ("Task Search", test_task_search),
        ("Task Statistics", test_task_stats),
        ("Delete Task", test_delete_task),
        ("Invalid Task Operations", test_invalid_task_operations),
        ("Task Authorization", test_task_authorization),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ {test_name} - Exception: {e}")
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"🏁 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed! Backend is working correctly.")
        return True
    else:
        print(f"⚠️  {failed} tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)