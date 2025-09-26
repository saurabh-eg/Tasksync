from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with comprehensive SSL/TLS configuration for Atlas
import certifi
import ssl

mongo_url = os.environ['MONGO_URL']

# Ensure TLS is enabled in the connection string
if "tls=true" not in mongo_url and "ssl=true" not in mongo_url:
    # Add TLS parameter if not present
    separator = "&" if "?" in mongo_url else "?"
    mongo_url = f"{mongo_url}{separator}tls=true&tlsAllowInvalidCertificates=false"

print(f"Connecting to MongoDB with URL: {mongo_url[:50]}...")

try:
    # Create SSL context with proper settings
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    ssl_context.check_hostname = False  # MongoDB Atlas handles this
    ssl_context.verify_mode = ssl.CERT_REQUIRED
    
    client = AsyncIOMotorClient(
        mongo_url,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=15000,
        connectTimeoutMS=20000,
        socketTimeoutMS=0,
        retryWrites=True,
        maxPoolSize=10,
        minPoolSize=1,
        maxIdleTimeMS=30000,
        waitQueueTimeoutMS=5000
    )
    db = client[os.environ['DB_NAME']]
    print("MongoDB connection configured with comprehensive TLS settings")
    
    # Test the connection immediately
    async def test_connection():
        try:
            await client.admin.command('ping')
            print("✅ MongoDB connection test successful")
            return True
        except Exception as e:
            print(f"❌ MongoDB connection test failed: {e}")
            return False
    
except Exception as e:
    print(f"Failed to create MongoDB client with TLS: {e}")
    # Try with minimal TLS settings as fallback
    try:
        fallback_url = mongo_url.replace("tlsAllowInvalidCertificates=false", "tlsAllowInvalidCertificates=true")
        client = AsyncIOMotorClient(
            fallback_url,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000
        )
        db = client[os.environ['DB_NAME']]
        print("MongoDB fallback connection with relaxed TLS established")
    except Exception as e2:
        print(f"MongoDB fallback also failed: {e2}")
        raise e2

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'fallback-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', 30))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Todo App API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions
def verify_password(plain_password, hashed_password):
    # Truncate password to 72 bytes for bcrypt compatibility
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Truncate password to 72 bytes for bcrypt compatibility
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None

class Task(BaseModel):
    id: str
    title: str
    description: str
    due_date: Optional[datetime] = None
    completed: bool = False
    created_at: datetime
    updated_at: datetime
    user_id: str

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "email": user.email,
        "name": user.name,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create token
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    # Return user and token
    user_response = User(
        id=user_id,
        email=user.email,
        name=user.name,
        created_at=user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    user_response = User(
        id=user_id,
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(
        id=str(current_user["_id"]),
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )

# Task Routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_doc = {
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date,
        "completed": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "user_id": str(current_user["_id"])
    }
    
    result = await db.tasks.insert_one(task_doc)
    task_doc["id"] = str(result.inserted_id)
    
    return Task(**task_doc)

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(
    completed: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    order: Optional[str] = "desc",
    current_user: dict = Depends(get_current_user)
):
    # Build query
    query = {"user_id": str(current_user["_id"])}
    if completed is not None:
        query["completed"] = completed
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Build sort
    sort_order = -1 if order == "desc" else 1
    sort_field = sort_by if sort_by in ["created_at", "updated_at", "due_date", "title"] else "created_at"
    
    tasks = await db.tasks.find(query).sort(sort_field, sort_order).to_list(1000)
    
    return [
        Task(
            id=str(task["_id"]),
            title=task["title"],
            description=task["description"],
            due_date=task.get("due_date"),
            completed=task["completed"],
            created_at=task["created_at"],
            updated_at=task["updated_at"],
            user_id=task["user_id"]
        ) for task in tasks
    ]

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    try:
        task = await db.tasks.find_one({"_id": ObjectId(task_id), "user_id": str(current_user["_id"])})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return Task(
            id=str(task["_id"]),
            title=task["title"],
            description=task["description"],
            due_date=task.get("due_date"),
            completed=task["completed"],
            created_at=task["created_at"],
            updated_at=task["updated_at"],
            user_id=task["user_id"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid task ID")

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    try:
        # Build update dict
        update_data = {}
        if task_update.title is not None:
            update_data["title"] = task_update.title
        if task_update.description is not None:
            update_data["description"] = task_update.description
        if task_update.due_date is not None:
            update_data["due_date"] = task_update.due_date
        if task_update.completed is not None:
            update_data["completed"] = task_update.completed
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.tasks.update_one(
            {"_id": ObjectId(task_id), "user_id": str(current_user["_id"])},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Return updated task
        updated_task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        return Task(
            id=str(updated_task["_id"]),
            title=updated_task["title"],
            description=updated_task["description"],
            due_date=updated_task.get("due_date"),
            completed=updated_task["completed"],
            created_at=updated_task["created_at"],
            updated_at=updated_task["updated_at"],
            user_id=updated_task["user_id"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid task ID")

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    try:
        result = await db.tasks.delete_one({"_id": ObjectId(task_id), "user_id": str(current_user["_id"])})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"message": "Task deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid task ID")

@api_router.get("/tasks/stats/summary")
async def get_task_stats(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    total_tasks = await db.tasks.count_documents({"user_id": user_id})
    completed_tasks = await db.tasks.count_documents({"user_id": user_id, "completed": True})
    pending_tasks = total_tasks - completed_tasks
    
    # Tasks due today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    due_today = await db.tasks.count_documents({
        "user_id": user_id,
        "due_date": {"$gte": today_start, "$lt": today_end},
        "completed": False
    })
    
    # Overdue tasks
    overdue = await db.tasks.count_documents({
        "user_id": user_id,
        "due_date": {"$lt": today_start},
        "completed": False
    })
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "due_today": due_today,
        "overdue": overdue
    }

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()