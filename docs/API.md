# TaskSync API Documentation

## Base URL

- **Production**: `https://tasksyncpro.up.railway.app`
- **Development**: `http://localhost:8000`

All endpoints are prefixed with `/api`

---

## Authentication

TaskSync uses JWT (JSON Web Tokens) for authentication. After successful login or registration, you'll receive an access token that must be included in the Authorization header for protected endpoints.

### Headers Format
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## Endpoints

### 1. Health Check

Check if the API server is running.

**Endpoint**: `GET /api/health`

**Authentication**: Not required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00.000000"
}
```

---

### 2. User Registration

Register a new user account.

**Endpoint**: `POST /api/auth/register`

**Authentication**: Not required

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Validation Rules**:
- `name`: Required, minimum 2 characters
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Success Response** (201 Created):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "created_at": "2025-11-01T12:00:00.000000"
  }
}
```

**Error Responses**:

- **400 Bad Request** - Email already registered
```json
{
  "detail": "Email already registered"
}
```

- **422 Unprocessable Entity** - Validation error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

### 3. User Login

Authenticate and receive access token.

**Endpoint**: `POST /api/auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Success Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "created_at": "2025-11-01T12:00:00.000000"
  }
}
```

**Error Responses**:

- **401 Unauthorized** - Invalid credentials
```json
{
  "detail": "Invalid email or password"
}
```

---

### 4. Get Current User

Retrieve authenticated user's information.

**Endpoint**: `GET /api/auth/me`

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": "2025-11-01T12:00:00.000000"
}
```

**Error Responses**:

- **401 Unauthorized** - Invalid or expired token
```json
{
  "detail": "Invalid token"
}
```

---

### 5. Create Task

Create a new task for the authenticated user.

**Endpoint**: `POST /api/tasks`

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation for TaskSync",
  "due_date": "2025-11-05T18:00:00.000Z"
}
```

**Field Specifications**:
- `title`: Required, string, max 100 characters
- `description`: Optional, string, max 500 characters
- `due_date`: Optional, ISO 8601 datetime string

**Success Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439012",
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation for TaskSync",
  "due_date": "2025-11-05T18:00:00.000Z",
  "completed": false,
  "created_at": "2025-11-01T12:00:00.000000",
  "updated_at": "2025-11-01T12:00:00.000000",
  "user_id": "507f1f77bcf86cd799439011"
}
```

---

### 6. Get All Tasks

Retrieve all tasks for the authenticated user with optional filtering and sorting.

**Endpoint**: `GET /api/tasks`

**Authentication**: Required

**Query Parameters**:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `completed` | boolean | Filter by completion status | None (all) |
| `search` | string | Search in title and description | None |
| `sort_by` | string | Sort field: `created_at`, `updated_at`, `due_date`, `title` | `created_at` |
| `order` | string | Sort order: `asc` or `desc` | `desc` |

**Example Requests**:

```
GET /api/tasks
GET /api/tasks?completed=false
GET /api/tasks?search=documentation
GET /api/tasks?sort_by=due_date&order=asc
GET /api/tasks?completed=false&sort_by=title&order=asc
```

**Success Response** (200 OK):
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation for TaskSync",
    "due_date": "2025-11-05T18:00:00.000Z",
    "completed": false,
    "created_at": "2025-11-01T12:00:00.000000",
    "updated_at": "2025-11-01T12:00:00.000000",
    "user_id": "507f1f77bcf86cd799439011"
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "title": "Deploy to production",
    "description": "Deploy the app to Railway and EAS",
    "due_date": null,
    "completed": true,
    "created_at": "2025-10-30T10:00:00.000000",
    "updated_at": "2025-10-31T15:00:00.000000",
    "user_id": "507f1f77bcf86cd799439011"
  }
]
```

---

### 7. Get Single Task

Retrieve a specific task by ID.

**Endpoint**: `GET /api/tasks/{task_id}`

**Authentication**: Required

**URL Parameters**:
- `task_id`: MongoDB ObjectId of the task

**Success Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439012",
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation for TaskSync",
  "due_date": "2025-11-05T18:00:00.000Z",
  "completed": false,
  "created_at": "2025-11-01T12:00:00.000000",
  "updated_at": "2025-11-01T12:00:00.000000",
  "user_id": "507f1f77bcf86cd799439011"
}
```

**Error Responses**:

- **404 Not Found** - Task doesn't exist or doesn't belong to user
```json
{
  "detail": "Task not found"
}
```

- **400 Bad Request** - Invalid task ID format
```json
{
  "detail": "Invalid task ID"
}
```

---

### 8. Update Task

Update an existing task.

**Endpoint**: `PUT /api/tasks/{task_id}`

**Authentication**: Required

**Request Body** (all fields optional):
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "due_date": "2025-11-06T18:00:00.000Z",
  "completed": true
}
```

**Field Specifications**:
- `title`: Optional, string, max 100 characters
- `description`: Optional, string, max 500 characters
- `due_date`: Optional, ISO 8601 datetime string or null
- `completed`: Optional, boolean

**Success Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439012",
  "title": "Updated task title",
  "description": "Updated description",
  "due_date": "2025-11-06T18:00:00.000Z",
  "completed": true,
  "created_at": "2025-11-01T12:00:00.000000",
  "updated_at": "2025-11-01T14:30:00.000000",
  "user_id": "507f1f77bcf86cd799439011"
}
```

**Error Responses**:

- **404 Not Found** - Task doesn't exist or doesn't belong to user
```json
{
  "detail": "Task not found"
}
```

---

### 9. Delete Task

Delete a task permanently.

**Endpoint**: `DELETE /api/tasks/{task_id}`

**Authentication**: Required

**URL Parameters**:
- `task_id`: MongoDB ObjectId of the task

**Success Response** (200 OK):
```json
{
  "message": "Task deleted successfully"
}
```

**Error Responses**:

- **404 Not Found** - Task doesn't exist or doesn't belong to user
```json
{
  "detail": "Task not found"
}
```

- **400 Bad Request** - Invalid task ID format
```json
{
  "detail": "Invalid task ID"
}
```

---

### 10. Get Task Statistics

Retrieve statistics summary for the authenticated user's tasks.

**Endpoint**: `GET /api/tasks/stats/summary`

**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "total_tasks": 25,
  "completed_tasks": 15,
  "pending_tasks": 10,
  "due_today": 3,
  "overdue": 2
}
```

**Field Descriptions**:
- `total_tasks`: Total number of tasks
- `completed_tasks`: Number of completed tasks
- `pending_tasks`: Number of incomplete tasks
- `due_today`: Number of tasks due today (not completed)
- `overdue`: Number of overdue tasks (not completed)

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, there are no rate limits implemented. In production, consider implementing rate limiting to prevent abuse.

---

## CORS

The API supports CORS (Cross-Origin Resource Sharing) for all origins in development. In production, configure specific allowed origins.

---

## Data Models

### User Model
```typescript
{
  id: string;              // MongoDB ObjectId
  email: string;           // Valid email address
  name: string;            // User's full name
  created_at: datetime;    // Account creation timestamp
}
```

### Task Model
```typescript
{
  id: string;              // MongoDB ObjectId
  title: string;           // Task title (max 100 chars)
  description: string;     // Task description (max 500 chars)
  due_date: datetime | null; // Due date (ISO 8601)
  completed: boolean;      // Completion status
  created_at: datetime;    // Creation timestamp
  updated_at: datetime;    // Last update timestamp
  user_id: string;         // Owner's user ID
}
```

### Token Response Model
```typescript
{
  access_token: string;    // JWT token
  token_type: string;      // Always "bearer"
  user: User;              // User object
}
```

---

## Example Usage

### JavaScript/TypeScript (Fetch API)

```typescript
// Login
const login = async (email: string, password: string) => {
  const response = await fetch('https://tasksyncpro.up.railway.app/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  return data.access_token;
};

// Get tasks
const getTasks = async (token: string) => {
  const response = await fetch('https://tasksyncpro.up.railway.app/api/tasks', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return await response.json();
};

// Create task
const createTask = async (token: string, taskData: any) => {
  const response = await fetch('https://tasksyncpro.up.railway.app/api/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  
  return await response.json();
};
```

### Python (Requests)

```python
import requests

BASE_URL = "https://tasksyncpro.up.railway.app/api"

# Login
def login(email, password):
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    return response.json()["access_token"]

# Get tasks
def get_tasks(token):
    response = requests.get(
        f"{BASE_URL}/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

# Create task
def create_task(token, task_data):
    response = requests.post(
        f"{BASE_URL}/tasks",
        headers={"Authorization": f"Bearer {token}"},
        json=task_data
    )
    return response.json()
```

### cURL

```bash
# Login
curl -X POST https://tasksyncpro.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePassword123"}'

# Get tasks
curl -X GET https://tasksyncpro.up.railway.app/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create task
curl -X POST https://tasksyncpro.up.railway.app/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","description":"Task description"}'
```

---

## Interactive API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: `https://tasksyncpro.up.railway.app/docs`
- **ReDoc**: `https://tasksyncpro.up.railway.app/redoc`

These interfaces allow you to test endpoints directly from your browser.

---

## Webhooks

Currently not implemented. Future versions may include webhook support for:
- Task creation notifications
- Task completion events
- Due date reminders

---

## Changelog

### Version 1.0.2 (Current)
- Initial API release
- User authentication
- Full CRUD operations for tasks
- Task filtering and search
- Statistics endpoint

---

## Support

For API-related issues:
- Open an issue on [GitHub](https://github.com/saurabh-eg/Tasksync)
- Check the [FAQ](../README.md#faq)
- Review [common errors](#error-codes)
