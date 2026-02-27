from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'autotrack-secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# SendGrid Configuration
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@autotrack.com')

app = FastAPI(title="AutoTrack API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CarCreate(BaseModel):
    make: str
    model: str
    year: int
    color: Optional[str] = None
    license_plate: Optional[str] = None
    vin: Optional[str] = None
    current_mileage: int = 0
    image_url: Optional[str] = None

class CarUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    license_plate: Optional[str] = None
    vin: Optional[str] = None
    current_mileage: Optional[int] = None
    image_url: Optional[str] = None

class CarResponse(BaseModel):
    id: str
    user_id: str
    make: str
    model: str
    year: int
    color: Optional[str] = None
    license_plate: Optional[str] = None
    vin: Optional[str] = None
    current_mileage: int
    image_url: Optional[str] = None
    created_at: str

class MaintenanceTaskCreate(BaseModel):
    car_id: str
    task_type: str  # oil_change, air_filter, cabin_filter, coolant, brakes, brake_fluid, tire_rotation, etc.
    description: Optional[str] = None
    last_performed_date: Optional[str] = None
    last_performed_mileage: Optional[int] = None
    interval_miles: int = 5000
    interval_months: int = 6
    cost: Optional[float] = None
    notes: Optional[str] = None

class MaintenanceTaskUpdate(BaseModel):
    task_type: Optional[str] = None
    description: Optional[str] = None
    last_performed_date: Optional[str] = None
    last_performed_mileage: Optional[int] = None
    interval_miles: Optional[int] = None
    interval_months: Optional[int] = None
    cost: Optional[float] = None
    notes: Optional[str] = None

class MaintenanceTaskResponse(BaseModel):
    id: str
    car_id: str
    user_id: str
    task_type: str
    description: Optional[str] = None
    last_performed_date: Optional[str] = None
    last_performed_mileage: Optional[int] = None
    next_due_mileage: Optional[int] = None
    next_due_date: Optional[str] = None
    interval_miles: int
    interval_months: int
    cost: Optional[float] = None
    notes: Optional[str] = None
    status: str  # good, due_soon, overdue
    created_at: str

class MileageLogCreate(BaseModel):
    car_id: str
    mileage: int
    date: Optional[str] = None
    notes: Optional[str] = None

class MileageLogResponse(BaseModel):
    id: str
    car_id: str
    user_id: str
    mileage: int
    date: str
    notes: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    car_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = None

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str  # maintenance_due, reminder, info

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: str

class ReminderSettingsUpdate(BaseModel):
    email_reminders: Optional[bool] = None
    push_notifications: Optional[bool] = None
    reminder_days_before: Optional[int] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== EMAIL HELPERS ====================

def send_email(to_email: str, subject: str, content: str):
    if not SENDGRID_API_KEY or SENDGRID_API_KEY == "your_sendgrid_api_key_here":
        logger.warning("SendGrid API key not configured, skipping email")
        return False
    try:
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=content
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_maintenance_reminder(user_email: str, user_name: str, car_name: str, task_type: str, due_info: str):
    subject = f"AutoTrack: {task_type.replace('_', ' ').title()} Due for {car_name}"
    content = f"""
    <html>
        <body style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); padding: 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">AutoTrack</h1>
            </div>
            <div style="background: #F8FAFC; padding: 30px; border-radius: 0 0 12px 12px;">
                <h2 style="color: #1E293B;">Hi {user_name},</h2>
                <p style="color: #475569; font-size: 16px;">
                    Your <strong>{task_type.replace('_', ' ').title()}</strong> for <strong>{car_name}</strong> is {due_info}.
                </p>
                <p style="color: #475569;">
                    Don't forget to schedule your maintenance to keep your vehicle in top condition!
                </p>
                <a href="#" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">
                    View in AutoTrack
                </a>
            </div>
        </body>
    </html>
    """
    return send_email(user_email, subject, content)

# ==================== MAINTENANCE STATUS HELPER ====================

def calculate_maintenance_status(task: dict, car_mileage: int) -> tuple:
    status = "good"
    next_due_mileage = None
    next_due_date = None
    
    if task.get("last_performed_mileage"):
        next_due_mileage = task["last_performed_mileage"] + task["interval_miles"]
        if car_mileage >= next_due_mileage:
            status = "overdue"
        elif car_mileage >= next_due_mileage - 500:
            status = "due_soon"
    
    if task.get("last_performed_date"):
        try:
            last_date = datetime.fromisoformat(task["last_performed_date"].replace('Z', '+00:00'))
            next_due_date = (last_date + timedelta(days=task["interval_months"] * 30)).isoformat()
            if datetime.now(timezone.utc) >= datetime.fromisoformat(next_due_date.replace('Z', '+00:00')):
                status = "overdue"
            elif datetime.now(timezone.utc) >= datetime.fromisoformat(next_due_date.replace('Z', '+00:00')) - timedelta(days=14):
                status = "due_soon" if status != "overdue" else "overdue"
        except:
            pass
    
    return status, next_due_mileage, next_due_date

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "settings": {
            "email_reminders": True,
            "push_notifications": True,
            "reminder_days_before": 7,
            "theme": "light"
        }
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name, created_at=user_doc["created_at"])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )

# ==================== CAR ROUTES ====================

@api_router.post("/cars", response_model=CarResponse)
async def create_car(car_data: CarCreate, current_user: dict = Depends(get_current_user)):
    car_id = str(uuid.uuid4())
    car_doc = {
        "id": car_id,
        "user_id": current_user["id"],
        **car_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cars.insert_one(car_doc)
    return CarResponse(**{k: v for k, v in car_doc.items() if k != "_id"})

@api_router.get("/cars", response_model=List[CarResponse])
async def get_cars(current_user: dict = Depends(get_current_user)):
    cars = await db.cars.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    return [CarResponse(**car) for car in cars]

@api_router.get("/cars/{car_id}", response_model=CarResponse)
async def get_car(car_id: str, current_user: dict = Depends(get_current_user)):
    car = await db.cars.find_one({"id": car_id, "user_id": current_user["id"]}, {"_id": 0})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return CarResponse(**car)

@api_router.put("/cars/{car_id}", response_model=CarResponse)
async def update_car(car_id: str, car_data: CarUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in car_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.cars.update_one(
        {"id": car_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Car not found")
    
    car = await db.cars.find_one({"id": car_id}, {"_id": 0})
    return CarResponse(**car)

@api_router.delete("/cars/{car_id}")
async def delete_car(car_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cars.delete_one({"id": car_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Car not found")
    
    # Also delete related maintenance tasks and mileage logs
    await db.maintenance_tasks.delete_many({"car_id": car_id})
    await db.mileage_logs.delete_many({"car_id": car_id})
    
    return {"message": "Car deleted successfully"}

# ==================== MAINTENANCE ROUTES ====================

@api_router.post("/maintenance", response_model=MaintenanceTaskResponse)
async def create_maintenance_task(task_data: MaintenanceTaskCreate, current_user: dict = Depends(get_current_user)):
    car = await db.cars.find_one({"id": task_data.car_id, "user_id": current_user["id"]})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    task_id = str(uuid.uuid4())
    task_doc = {
        "id": task_id,
        "user_id": current_user["id"],
        **task_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    status, next_due_mileage, next_due_date = calculate_maintenance_status(task_doc, car.get("current_mileage", 0))
    task_doc["status"] = status
    task_doc["next_due_mileage"] = next_due_mileage
    task_doc["next_due_date"] = next_due_date
    
    await db.maintenance_tasks.insert_one(task_doc)
    return MaintenanceTaskResponse(**{k: v for k, v in task_doc.items() if k != "_id"})

@api_router.get("/maintenance", response_model=List[MaintenanceTaskResponse])
async def get_maintenance_tasks(car_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if car_id:
        query["car_id"] = car_id
    
    tasks = await db.maintenance_tasks.find(query, {"_id": 0}).to_list(500)
    
    # Update status for each task
    result = []
    for task in tasks:
        car = await db.cars.find_one({"id": task["car_id"]}, {"_id": 0})
        car_mileage = car.get("current_mileage", 0) if car else 0
        status, next_due_mileage, next_due_date = calculate_maintenance_status(task, car_mileage)
        task["status"] = status
        task["next_due_mileage"] = next_due_mileage
        task["next_due_date"] = next_due_date
        result.append(MaintenanceTaskResponse(**task))
    
    return result

@api_router.get("/maintenance/{task_id}", response_model=MaintenanceTaskResponse)
async def get_maintenance_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.maintenance_tasks.find_one({"id": task_id, "user_id": current_user["id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    car = await db.cars.find_one({"id": task["car_id"]}, {"_id": 0})
    car_mileage = car.get("current_mileage", 0) if car else 0
    status, next_due_mileage, next_due_date = calculate_maintenance_status(task, car_mileage)
    task["status"] = status
    task["next_due_mileage"] = next_due_mileage
    task["next_due_date"] = next_due_date
    
    return MaintenanceTaskResponse(**task)

@api_router.put("/maintenance/{task_id}", response_model=MaintenanceTaskResponse)
async def update_maintenance_task(task_id: str, task_data: MaintenanceTaskUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in task_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.maintenance_tasks.update_one(
        {"id": task_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.maintenance_tasks.find_one({"id": task_id}, {"_id": 0})
    car = await db.cars.find_one({"id": task["car_id"]}, {"_id": 0})
    car_mileage = car.get("current_mileage", 0) if car else 0
    status, next_due_mileage, next_due_date = calculate_maintenance_status(task, car_mileage)
    task["status"] = status
    task["next_due_mileage"] = next_due_mileage
    task["next_due_date"] = next_due_date
    
    return MaintenanceTaskResponse(**task)

@api_router.delete("/maintenance/{task_id}")
async def delete_maintenance_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.maintenance_tasks.delete_one({"id": task_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

@api_router.post("/maintenance/{task_id}/complete", response_model=MaintenanceTaskResponse)
async def complete_maintenance_task(task_id: str, mileage: int, current_user: dict = Depends(get_current_user)):
    task = await db.maintenance_tasks.find_one({"id": task_id, "user_id": current_user["id"]})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "last_performed_date": now,
        "last_performed_mileage": mileage
    }
    
    await db.maintenance_tasks.update_one({"id": task_id}, {"$set": update_data})
    
    # Update car's current mileage if higher
    await db.cars.update_one(
        {"id": task["car_id"], "current_mileage": {"$lt": mileage}},
        {"$set": {"current_mileage": mileage}}
    )
    
    task = await db.maintenance_tasks.find_one({"id": task_id}, {"_id": 0})
    car = await db.cars.find_one({"id": task["car_id"]}, {"_id": 0})
    car_mileage = car.get("current_mileage", 0) if car else 0
    status, next_due_mileage, next_due_date = calculate_maintenance_status(task, car_mileage)
    task["status"] = status
    task["next_due_mileage"] = next_due_mileage
    task["next_due_date"] = next_due_date
    
    return MaintenanceTaskResponse(**task)

# ==================== MILEAGE ROUTES ====================

@api_router.post("/mileage", response_model=MileageLogResponse)
async def log_mileage(log_data: MileageLogCreate, current_user: dict = Depends(get_current_user)):
    car = await db.cars.find_one({"id": log_data.car_id, "user_id": current_user["id"]})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    log_id = str(uuid.uuid4())
    log_doc = {
        "id": log_id,
        "user_id": current_user["id"],
        "car_id": log_data.car_id,
        "mileage": log_data.mileage,
        "date": log_data.date or datetime.now(timezone.utc).isoformat(),
        "notes": log_data.notes
    }
    await db.mileage_logs.insert_one(log_doc)
    
    # Update car's current mileage
    if log_data.mileage > car.get("current_mileage", 0):
        await db.cars.update_one({"id": log_data.car_id}, {"$set": {"current_mileage": log_data.mileage}})
    
    return MileageLogResponse(**{k: v for k, v in log_doc.items() if k != "_id"})

@api_router.get("/mileage/{car_id}", response_model=List[MileageLogResponse])
async def get_mileage_logs(car_id: str, current_user: dict = Depends(get_current_user)):
    logs = await db.mileage_logs.find(
        {"car_id": car_id, "user_id": current_user["id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(500)
    return [MileageLogResponse(**log) for log in logs]

# ==================== AI MECHANIC CHAT ====================

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_mechanic(chat_data: ChatMessage, current_user: dict = Depends(get_current_user)):
    car_context = ""
    if chat_data.car_id:
        car = await db.cars.find_one({"id": chat_data.car_id, "user_id": current_user["id"]}, {"_id": 0})
        if car:
            tasks = await db.maintenance_tasks.find({"car_id": chat_data.car_id}, {"_id": 0}).to_list(50)
            car_context = f"""
User's car: {car.get('year')} {car.get('make')} {car.get('model')}
Current Mileage: {car.get('current_mileage', 0)} miles
Maintenance History: {', '.join([f"{t['task_type']} (last done at {t.get('last_performed_mileage', 'N/A')} miles)" for t in tasks]) if tasks else 'No maintenance records yet'}
"""
    
    system_message = f"""You are AutoBot, a friendly and knowledgeable AI mechanic assistant. You help car owners with:
1. Maintenance advice and schedules
2. Diagnosing car problems based on symptoms
3. Step-by-step repair guidance for common issues
4. Recommendations on when to seek professional help
5. Finding nearby mechanics when needed

{car_context}

Be helpful, clear, and safety-conscious. If a repair is dangerous or complex, recommend visiting a professional mechanic.
When discussing repairs, provide clear step-by-step instructions when appropriate.
If the user needs to find a mechanic, suggest they use the "Find Nearby Mechanics" feature in the app.
Keep responses concise but thorough. Use bullet points for lists."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"autotrack-{current_user['id']}-{datetime.now().timestamp()}",
            system_message=system_message
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=chat_data.message)
        response = await chat.send_message(user_message)
        
        suggestions = []
        if "oil" in chat_data.message.lower():
            suggestions = ["How often should I change my oil?", "What type of oil should I use?"]
        elif "brake" in chat_data.message.lower():
            suggestions = ["How do I know if my brakes need replacing?", "What causes squeaky brakes?"]
        elif "noise" in chat_data.message.lower() or "sound" in chat_data.message.lower():
            suggestions = ["What could cause a knocking sound?", "Should I be worried about this noise?"]
        
        return ChatResponse(response=response, suggestions=suggestions)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response from AI mechanic")

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [NotificationResponse(**n) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.delete_one({"id": notification_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}

# ==================== SETTINGS ====================

@api_router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    return current_user.get("settings", {
        "email_reminders": True,
        "push_notifications": True,
        "reminder_days_before": 7,
        "theme": "light"
    })

@api_router.put("/settings")
async def update_settings(settings: ReminderSettingsUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {f"settings.{k}": v for k, v in settings.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return user.get("settings", {})

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    cars = await db.cars.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    tasks = await db.maintenance_tasks.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(500)
    
    overdue_count = 0
    due_soon_count = 0
    good_count = 0
    
    for task in tasks:
        car = next((c for c in cars if c["id"] == task["car_id"]), None)
        car_mileage = car.get("current_mileage", 0) if car else 0
        status, _, _ = calculate_maintenance_status(task, car_mileage)
        if status == "overdue":
            overdue_count += 1
        elif status == "due_soon":
            due_soon_count += 1
        else:
            good_count += 1
    
    return {
        "total_cars": len(cars),
        "total_tasks": len(tasks),
        "overdue": overdue_count,
        "due_soon": due_soon_count,
        "good": good_count
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "AutoTrack API is running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "service": "autotrack-api"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
