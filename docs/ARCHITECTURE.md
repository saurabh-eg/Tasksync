# TaskSync Architecture Documentation

## System Overview

TaskSync is built on a modern client-server architecture with clear separation of concerns between the mobile frontend and backend API. The system follows RESTful principles and implements offline-first design patterns.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         React Native Mobile App (Expo)                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  │   iOS    │  │ Android  │  │   Web    │             │ │
│  │  └──────────┘  └──────────┘  └──────────┘             │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     API LAYER                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           FastAPI Backend (Python)                      │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │   Auth     │  │   Tasks    │  │  Health    │       │ │
│  │  │  Routes    │  │  Routes    │  │  Routes    │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘       │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  DATA LAYER                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           MongoDB Atlas (Cloud Database)                │ │
│  │  ┌────────────┐  ┌────────────┐                        │ │
│  │  │   users    │  │   tasks    │                        │ │
│  │  │ collection │  │ collection │                        │ │
│  │  └────────────┘  └────────────┘                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Technology Stack

- **Framework**: React Native 0.74.5
- **Build Tool**: Expo 51.0.28
- **Language**: TypeScript 5.3.3
- **Navigation**: Expo Router (file-based)
- **State Management**: Zustand 4.5.5
- **Form Handling**: React Hook Form 7.53.0
- **Storage**: AsyncStorage (offline persistence)

### Application Structure

```
frontend/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout & navigation setup
│   ├── index.tsx                # Welcome/landing screen
│   ├── home.tsx                 # Main dashboard
│   ├── settings.tsx             # User settings
│   ├── auth/                    # Authentication flows
│   │   ├── login.tsx           # Login screen
│   │   └── register.tsx        # Registration screen
│   └── tasks/                   # Task management
│       ├── add.tsx             # Create task
│       └── [id].tsx            # View/Edit task detail
│
├── components/                   # Reusable UI components
│   ├── TaskCard.tsx            # Individual task item
│   ├── FilterBar.tsx           # Filter buttons
│   └── FloatingActionButton.tsx # FAB for quick actions
│
├── store/                        # State management
│   ├── authStore.ts            # Authentication state
│   └── taskStore.ts            # Tasks & filtering state
│
└── utils/                        # Utility functions
    └── config.ts               # App configuration
```

### State Management Architecture

TaskSync uses Zustand for lightweight, performant state management:

#### Authentication Store (`authStore.ts`)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (token, user) => Promise<void>;
  logout: () => Promise<void>;
  loadAuthData: () => Promise<void>;
  updateUser: (user) => Promise<void>;
}
```

**Responsibilities**:
- Store user credentials and JWT token
- Persist authentication state to AsyncStorage
- Manage login/logout flows
- Handle token expiration

#### Task Store (`taskStore.ts`)

```typescript
interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  currentFilter: 'all' | 'completed' | 'pending';
  searchQuery: string;
  sortBy: 'created_at' | 'updated_at' | 'due_date' | 'title';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  stats: TaskStats | null;
  
  // Actions
  setTasks: (tasks) => void;
  addTask: (task) => void;
  updateTask: (id, updates) => void;
  removeTask: (id) => void;
  setFilter: (filter) => void;
  setSearchQuery: (query) => void;
  setSorting: (sortBy, sortOrder) => void;
  applyFilters: () => void;
  
  // Offline sync
  saveOfflineTasks: () => Promise<void>;
  loadOfflineTasks: () => Promise<void>;
}
```

**Responsibilities**:
- Manage task list and filtering
- Handle offline data persistence
- Apply search and sort operations
- Sync with backend API

### Navigation Flow

```
┌──────────────┐
│    index     │ ──────► Check auth status
└──────┬───────┘
       │
       ├── Authenticated? ──► Yes ──► home (Dashboard)
       │                              
       └── No ──► auth/login ──► Success ──► home
                      │
                      └── New user? ──► auth/register ──► Success ──► home

home (Dashboard)
├── Search & Filter tasks
├── View task statistics
├── Tap task ──► tasks/[id] (Detail/Edit)
├── FAB ──► tasks/add (Create)
└── Settings ──► settings
                   └── Logout ──► index
```

### Offline-First Strategy

1. **On App Launch**:
   - Load cached data from AsyncStorage immediately
   - Display cached data to user (instant UI)
   - Attempt to sync with backend in background

2. **On User Action**:
   - Update local state immediately (optimistic update)
   - Save to AsyncStorage
   - Send request to backend
   - On error: Revert local state, show error message

3. **On Network Restore**:
   - Automatically sync local changes with server
   - Resolve conflicts (server wins)
   - Update local cache

---

## Backend Architecture

### Technology Stack

- **Framework**: FastAPI 0.110.1
- **Language**: Python 3.10+
- **Database**: MongoDB 4.5.0 with Motor (async driver)
- **Authentication**: JWT (PyJWT 2.10.1)
- **Password Hashing**: Bcrypt 4.1.3
- **Validation**: Pydantic 2.6.4
- **Server**: Uvicorn 0.25.0 (ASGI)

### Application Structure

```python
backend/
├── server.py                    # Main FastAPI application
├── requirements.txt             # Python dependencies
├── .env                        # Environment variables
└── .env.local                  # Local development config
```

### API Architecture

```
FastAPI Application
├── Lifespan Context Manager     # Startup/shutdown hooks
├── CORS Middleware              # Cross-origin support
├── API Router (/api prefix)
│   ├── Authentication Routes
│   │   ├── POST /auth/register
│   │   ├── POST /auth/login
│   │   └── GET /auth/me
│   │
│   ├── Task Routes
│   │   ├── POST /tasks
│   │   ├── GET /tasks
│   │   ├── GET /tasks/{id}
│   │   ├── PUT /tasks/{id}
│   │   ├── DELETE /tasks/{id}
│   │   └── GET /tasks/stats/summary
│   │
│   └── Health Routes
│       └── GET /health
│
└── Exception Handlers           # Global error handling
```

### Data Models

#### User Collection

```javascript
{
  _id: ObjectId("..."),           // MongoDB ID
  email: "user@example.com",      // Unique email
  name: "John Doe",               // Full name
  hashed_password: "$2b$12$...",  // Bcrypt hash
  created_at: ISODate("...")      // Registration timestamp
}

// Indexes:
// - email (unique)
```

#### Task Collection

```javascript
{
  _id: ObjectId("..."),              // MongoDB ID
  title: "Complete documentation",   // Task title
  description: "Write API docs",     // Optional description
  due_date: ISODate("..."),         // Optional due date
  completed: false,                  // Completion status
  created_at: ISODate("..."),       // Creation timestamp
  updated_at: ISODate("..."),       // Last update timestamp
  user_id: "507f1f77bcf86cd..."     // Owner's user ID
}

// Indexes:
// - user_id
// - user_id + completed
// - user_id + due_date
```

### Authentication Flow

```
1. User Registration/Login
   ┌─────────────┐
   │   Client    │
   └──────┬──────┘
          │ POST /auth/register or /auth/login
          │ { email, password }
          ▼
   ┌─────────────┐
   │   FastAPI   │
   └──────┬──────┘
          │ 1. Validate credentials
          │ 2. Hash password (bcrypt)
          │ 3. Store/verify in MongoDB
          │ 4. Generate JWT token
          │    - Payload: { sub: user_id, exp: timestamp }
          │    - Sign with secret key
          ▼
   Return { access_token, user }

2. Authenticated Requests
   ┌─────────────┐
   │   Client    │
   └──────┬──────┘
          │ GET /tasks
          │ Authorization: Bearer <token>
          ▼
   ┌─────────────┐
   │   FastAPI   │ ──► get_current_user() dependency
   └──────┬──────┘
          │ 1. Extract token from header
          │ 2. Verify signature
          │ 3. Check expiration
          │ 4. Extract user_id from payload
          │ 5. Fetch user from database
          ▼
   Proceed with request
```

### Request/Response Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. HTTP Request (JSON)
       │    Headers: Authorization, Content-Type
       │    Body: Request data
       ▼
┌─────────────────────────────────────┐
│          FastAPI Middleware          │
│  ┌─────────────┐  ┌──────────────┐ │
│  │    CORS     │  │   Logging    │ │
│  └─────────────┘  └──────────────┘ │
└──────────────┬──────────────────────┘
               │ 2. Route matching
               ▼
┌─────────────────────────────────────┐
│          Route Handler               │
│  ┌─────────────┐  ┌──────────────┐ │
│  │ Validation  │  │  Auth Check  │ │
│  │ (Pydantic)  │  │  (Depends)   │ │
│  └─────────────┘  └──────────────┘ │
└──────────────┬──────────────────────┘
               │ 3. Business logic
               ▼
┌─────────────────────────────────────┐
│          Database Layer              │
│  ┌─────────────┐  ┌──────────────┐ │
│  │   Motor     │  │   MongoDB    │ │
│  │  (Async)    │──│    Atlas     │ │
│  └─────────────┘  └──────────────┘ │
└──────────────┬──────────────────────┘
               │ 4. Data retrieval
               ▼
┌─────────────────────────────────────┐
│       Response Serialization         │
│  ┌─────────────┐                    │
│  │  Pydantic   │ Convert ObjectIds  │
│  │   Models    │ Format timestamps  │
│  └─────────────┘                    │
└──────────────┬──────────────────────┘
               │ 5. JSON Response
               ▼
       ┌─────────────┐
       │   Client    │
       └─────────────┘
```

---

## Database Design

### Schema Design Principles

1. **Document-Oriented**: Each user and task is a self-contained document
2. **Denormalization**: User ID embedded in tasks for faster queries
3. **Indexes**: Optimized for common query patterns
4. **No Joins**: All queries use single collection lookups

### Query Patterns

#### Most Common Queries

```javascript
// Get user's tasks (with filters)
db.tasks.find({
  user_id: "507f1f77bcf86cd...",
  completed: false,
  due_date: { $lt: ISODate("...") }
}).sort({ created_at: -1 })

// Get task statistics
db.tasks.aggregate([
  { $match: { user_id: "507f1f77bcf86cd..." } },
  { $group: { 
      _id: "$completed",
      count: { $sum: 1 }
  }}
])
```

### Data Consistency

- **Atomicity**: MongoDB provides atomic operations at document level
- **Isolation**: Each user's tasks are isolated by user_id
- **No Transactions**: Not needed due to document-level atomicity
- **Eventual Consistency**: Acceptable for task management use case

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────┐
│              Security Layers                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Transport Layer                                  │
│     └─ HTTPS/TLS encryption                         │
│                                                      │
│  2. Authentication Layer                             │
│     ├─ JWT token validation                         │
│     ├─ Token expiration (30 minutes)                │
│     └─ Signature verification                       │
│                                                      │
│  3. Password Layer                                   │
│     ├─ Bcrypt hashing (12 rounds)                   │
│     ├─ Salt generation                              │
│     └─ Password truncation (72 bytes)               │
│                                                      │
│  4. Input Validation Layer                           │
│     ├─ Pydantic models                              │
│     ├─ Email validation                             │
│     └─ Length constraints                           │
│                                                      │
│  5. Authorization Layer                              │
│     ├─ User ID extraction from token                │
│     ├─ Resource ownership verification              │
│     └─ User isolation (user_id filtering)           │
│                                                      │
│  6. Data Layer                                       │
│     ├─ MongoDB injection prevention                 │
│     ├─ ObjectId validation                          │
│     └─ Field sanitization                           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Token Management

- **Generation**: HS256 algorithm with secret key
- **Payload**: `{ sub: user_id, exp: timestamp }`
- **Expiration**: 30 minutes (configurable)
- **Storage**: Client-side in AsyncStorage (secure on mobile)
- **Transmission**: Bearer token in Authorization header

---

## Performance Optimizations

### Frontend Optimizations

1. **Lazy Loading**: Screens loaded on-demand
2. **Memoization**: React.memo for expensive components
3. **Virtual Lists**: FlatList for efficient scrolling
4. **Image Optimization**: Expo Image with caching
5. **Code Splitting**: Automatic with Expo Router

### Backend Optimizations

1. **Async Operations**: All I/O operations are async
2. **Connection Pooling**: Motor manages MongoDB connections
3. **Query Optimization**: Indexed fields for fast lookups
4. **Response Streaming**: Efficient for large datasets
5. **Pydantic V2**: Fast validation with Rust core

### Database Optimizations

1. **Indexes**: On user_id, completed, due_date
2. **Projection**: Only fetch required fields
3. **Limit Queries**: Max 1000 tasks per request
4. **Atlas Tier**: M2/M5 for production

---

## Scalability Considerations

### Horizontal Scaling

```
                    ┌─────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐      ┌────▼────┐
    │ API     │       │ API     │      │ API     │
    │ Instance│       │ Instance│      │ Instance│
    │    1    │       │    2    │      │    3    │
    └────┬────┘       └────┬────┘      └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼───────┐
                    │   MongoDB    │
                    │   Cluster    │
                    └──────────────┘
```

### Vertical Scaling

- **Increase Railway resources**: More RAM/CPU
- **Upgrade MongoDB tier**: M10, M20, M30
- **Enable MongoDB sharding**: For millions of tasks

### Caching Strategy (Future)

```
Client Request
     │
     ▼
┌─────────┐  Miss   ┌─────────┐
│  Redis  │────────►│   API   │
│  Cache  │         └────┬────┘
└────┬────┘              │
     │ Hit               │
     │                   ▼
     │            ┌──────────┐
     │            │ MongoDB  │
     └────────────┤          │
       Update     └──────────┘
```

---

## Error Handling

### Frontend Error Handling

```typescript
try {
  // API call
  const response = await fetch(url, options);
  
  if (!response.ok) {
    // Server error
    const error = await response.json();
    Alert.alert('Error', error.detail);
    return;
  }
  
  const data = await response.json();
  // Success handling
  
} catch (error) {
  // Network error
  Alert.alert('Network Error', 'Check your connection');
  
  // Fallback to offline data
  loadOfflineData();
}
```

### Backend Error Handling

```python
@router.post("/tasks")
async def create_task(task: TaskCreate, user: dict = Depends(get_current_user)):
    try:
        # Business logic
        result = await db.tasks.insert_one(task_doc)
        return Task(**task_doc)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
        
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Task creation error: {e}")
        # Return generic error
        raise HTTPException(status_code=500, detail="Internal server error")
```

---

## Monitoring & Logging

### Application Logs

```python
# Backend logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Log important events
logger.info(f"User {user_id} logged in")
logger.error(f"Database connection failed: {error}")
```

### Metrics to Track

- API response times
- Error rates by endpoint
- Database query performance
- User registration/login rates
- Task creation/completion rates
- Offline sync conflicts

---

## Future Architecture Improvements

1. **Microservices**: Split auth, tasks, notifications
2. **Message Queue**: RabbitMQ/Redis for async tasks
3. **CDN**: For static assets
4. **WebSockets**: Real-time updates
5. **GraphQL**: Flexible data fetching
6. **Kubernetes**: Container orchestration
7. **Event Sourcing**: Full audit trail
8. **CQRS**: Separate read/write models

---

## Conclusion

TaskSync's architecture is designed for:
- **Simplicity**: Easy to understand and maintain
- **Performance**: Fast response times with caching
- **Scalability**: Can handle growth in users and data
- **Security**: Multiple layers of protection
- **Reliability**: Offline-first with automatic sync
- **Developer Experience**: Clear separation of concerns
