# TaskSync Testing Guide

This guide covers testing strategies and procedures for TaskSync.

---

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Integration Testing](#integration-testing)
- [Manual Testing](#manual-testing)
- [CI/CD Testing](#cicd-testing)

---

## Overview

TaskSync employs a comprehensive testing strategy covering:
- Unit tests for individual functions
- Integration tests for API endpoints
- Component tests for UI elements
- End-to-end tests for user flows
- Manual testing checklists

---

## Testing Stack

### Backend
- **pytest** - Test framework
- **pytest-asyncio** - Async test support
- **httpx** - Async HTTP client for testing
- **mongomock** - MongoDB mocking (optional)

### Frontend
- **Jest** - JavaScript test framework
- **React Native Testing Library** - Component testing
- **@testing-library/react-hooks** - Hook testing

---

## Backend Testing

### Setup

```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio httpx pytest-cov

# Run tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html
```

### Test Structure

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # Test configuration and fixtures
│   ├── test_auth.py          # Authentication tests
│   ├── test_tasks.py         # Task endpoint tests
│   └── test_database.py      # Database operation tests
```

### Example Tests

#### Authentication Tests (`test_auth.py`)

```python
import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

class TestAuth:
    """Test authentication endpoints"""
    
    def test_register_success(self):
        """Test successful user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["name"] == "Test User"
    
    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        # Register first user
        client.post(
            "/api/auth/register",
            json={
                "name": "User One",
                "email": "duplicate@example.com",
                "password": "password123"
            }
        )
        
        # Try to register again with same email
        response = client.post(
            "/api/auth/register",
            json={
                "name": "User Two",
                "email": "duplicate@example.com",
                "password": "password456"
            }
        )
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_login_success(self):
        """Test successful login"""
        # Register user first
        client.post(
            "/api/auth/register",
            json={
                "name": "Login Test",
                "email": "login@example.com",
                "password": "password123"
            }
        )
        
        # Login
        response = client.post(
            "/api/auth/login",
            json={
                "email": "login@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # Register and login
        register_response = client.post(
            "/api/auth/register",
            json={
                "name": "Current User",
                "email": "current@example.com",
                "password": "password123"
            }
        )
        token = register_response.json()["access_token"]
        
        # Get current user
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "current@example.com"
```

#### Task Tests (`test_tasks.py`)

```python
import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

@pytest.fixture
def auth_token():
    """Fixture to get authentication token"""
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Task Test User",
            "email": f"tasktest{uuid.uuid4()}@example.com",
            "password": "password123"
        }
    )
    return response.json()["access_token"]

class TestTasks:
    """Test task management endpoints"""
    
    def test_create_task(self, auth_token):
        """Test task creation"""
        response = client.post(
            "/api/tasks",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Test Task",
                "description": "Test Description",
                "due_date": "2025-12-31T23:59:59Z"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["completed"] == False
        assert "id" in data
    
    def test_get_all_tasks(self, auth_token):
        """Test getting all tasks"""
        # Create a task first
        client.post(
            "/api/tasks",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"title": "Task 1"}
        )
        
        # Get all tasks
        response = client.get(
            "/api/tasks",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_update_task(self, auth_token):
        """Test task update"""
        # Create task
        create_response = client.post(
            "/api/tasks",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"title": "Original Title"}
        )
        task_id = create_response.json()["id"]
        
        # Update task
        response = client.put(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Updated Title",
                "completed": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["completed"] == True
    
    def test_delete_task(self, auth_token):
        """Test task deletion"""
        # Create task
        create_response = client.post(
            "/api/tasks",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"title": "To Delete"}
        )
        task_id = create_response.json()["id"]
        
        # Delete task
        response = client.delete(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        
        # Verify deletion
        get_response = client.get(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_response.status_code == 404
    
    def test_task_statistics(self, auth_token):
        """Test task statistics endpoint"""
        # Create some tasks
        client.post(
            "/api/tasks",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"title": "Task 1", "completed": True}
        )
        client.post(
            "/api/tasks",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"title": "Task 2", "completed": False}
        )
        
        # Get statistics
        response = client.get(
            "/api/tasks/stats/summary",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_tasks" in data
        assert "completed_tasks" in data
        assert "pending_tasks" in data
        assert data["total_tasks"] >= 2
```

---

## Frontend Testing

### Setup

```bash
cd frontend

# Install test dependencies
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Example Tests

#### Component Tests

```typescript
// components/__tests__/TaskCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TaskCard from '../TaskCard';
import { Task } from '../../store/taskStore';

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    user_id: 'user1',
    due_date: null,
  };

  const mockOnPress = jest.fn();
  const mockOnToggle = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task title and description', () => {
    const { getByText } = render(
      <TaskCard
        task={mockTask}
        onPress={mockOnPress}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    expect(getByText('Test Task')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    const { getByText } = render(
      <TaskCard
        task={mockTask}
        onPress={mockOnPress}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.press(getByText('Test Task'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('calls onToggle when checkbox is pressed', () => {
    const { UNSAFE_getByType } = render(
      <TaskCard
        task={mockTask}
        onPress={mockOnPress}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    // Find and press checkbox
    const checkbox = UNSAFE_getByType(TouchableOpacity);
    fireEvent.press(checkbox);
    
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('shows completed state correctly', () => {
    const completedTask = { ...mockTask, completed: true };
    
    const { getByText } = render(
      <TaskCard
        task={completedTask}
        onPress={mockOnPress}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const titleElement = getByText('Test Task');
    expect(titleElement.props.style).toContainEqual(
      expect.objectContaining({ textDecorationLine: 'line-through' })
    );
  });
});
```

#### Store Tests

```typescript
// store/__tests__/taskStore.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useTaskStore, Task } from '../taskStore';

describe('taskStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useTaskStore());
    act(() => {
      result.current.setTasks([]);
    });
  });

  it('adds a task', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const newTask: Task = {
      id: '1',
      title: 'New Task',
      description: '',
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user1',
      due_date: null,
    };

    act(() => {
      result.current.addTask(newTask);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toEqual(newTask);
  });

  it('filters tasks by status', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Completed',
        completed: true,
        /* ... */
      },
      {
        id: '2',
        title: 'Pending',
        completed: false,
        /* ... */
      },
    ];

    act(() => {
      result.current.setTasks(tasks);
      result.current.setFilter('completed');
    });

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].completed).toBe(true);
  });

  it('searches tasks by title', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const tasks: Task[] = [
      { id: '1', title: 'Buy groceries', /* ... */ },
      { id: '2', title: 'Call dentist', /* ... */ },
    ];

    act(() => {
      result.current.setTasks(tasks);
      result.current.setSearchQuery('groceries');
    });

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].title).toBe('Buy groceries');
  });
});
```

---

## Integration Testing

### API Integration Tests

```python
# tests/test_integration.py
import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

class TestUserTaskFlow:
    """Test complete user and task workflows"""
    
    def test_full_task_lifecycle(self):
        """Test complete task CRUD operations"""
        # 1. Register user
        register_response = client.post(
            "/api/auth/register",
            json={
                "name": "Integration Test",
                "email": f"integration{uuid.uuid4()}@test.com",
                "password": "test123"
            }
        )
        assert register_response.status_code == 200
        token = register_response.json()["access_token"]
        
        # 2. Create task
        create_response = client.post(
            "/api/tasks",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Integration Task"}
        )
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]
        
        # 3. Get task
        get_response = client.get(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_response.status_code == 200
        
        # 4. Update task
        update_response = client.put(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"completed": True}
        )
        assert update_response.status_code == 200
        assert update_response.json()["completed"] == True
        
        # 5. Delete task
        delete_response = client.delete(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert delete_response.status_code == 200
        
        # 6. Verify deletion
        verify_response = client.get(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert verify_response.status_code == 404
```

---

## Manual Testing

### Pre-Release Checklist

#### Authentication Flow
- [ ] User can register with valid credentials
- [ ] Registration fails with duplicate email
- [ ] Registration fails with invalid email
- [ ] User can login with correct credentials
- [ ] Login fails with wrong password
- [ ] Token persists after app restart
- [ ] User stays logged in (token not expired)
- [ ] User is redirected to login when token expires

#### Task Management
- [ ] User can create a task with title only
- [ ] User can create a task with all fields
- [ ] User can view list of tasks
- [ ] User can filter tasks (all/pending/completed)
- [ ] User can search tasks
- [ ] User can mark task as complete/incomplete
- [ ] User can edit task details
- [ ] User can delete task
- [ ] Deletion requires confirmation

#### UI/UX
- [ ] All screens load without errors
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Forms validate inputs properly
- [ ] Navigation works smoothly
- [ ] Pull-to-refresh works
- [ ] Offline mode works
- [ ] Data syncs when connection restored

#### Cross-Platform
- [ ] App works on iOS
- [ ] App works on Android
- [ ] App works on Web
- [ ] Responsive on different screen sizes
- [ ] No console errors or warnings

---

## CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      
      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage
```

---

## Performance Testing

### Load Testing

```python
# Use locust for load testing
from locust import HttpUser, task, between

class TaskSyncUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before starting tasks"""
        response = self.client.post("/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        self.token = response.json()["access_token"]
    
    @task(3)
    def get_tasks(self):
        """Get all tasks"""
        self.client.get(
            "/api/tasks",
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    @task(1)
    def create_task(self):
        """Create a new task"""
        self.client.post(
            "/api/tasks",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"title": "Load test task"}
        )
```

---

## Best Practices

1. **Write tests before fixing bugs** - Reproduce the bug in a test first
2. **Keep tests isolated** - Each test should be independent
3. **Use descriptive names** - Test names should explain what they test
4. **Test edge cases** - Don't just test the happy path
5. **Mock external dependencies** - Database, APIs, etc.
6. **Maintain test coverage** - Aim for >80% code coverage
7. **Run tests locally** - Before pushing code
8. **Keep tests fast** - Slow tests won't be run

---

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Testing Best Practices](https://testingjavascript.com/)
