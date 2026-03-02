from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
import paypalrestsdk
import json
import stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# PayPal Configuration
paypalrestsdk.configure({
    "mode": "live",  # Change to "sandbox" for testing
    "client_id": os.environ.get('PAYPAL_CLIENT_ID'),
    "client_secret": os.environ.get('PAYPAL_SECRET')
})

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'espresso_beso_secret_key')
JWT_ALGORITHM = "HS256"

# VAPID Configuration for Push Notifications
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_EMAIL = os.environ.get('VAPID_EMAIL', 'mailto:admin@espressobeso.com')

# Stripe Configuration
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
stripe.api_key = STRIPE_SECRET_KEY

# Create the main app
app = FastAPI(title="Espresso Beso API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class TimeWindow(BaseModel):
    start: str  # "07:00"
    end: str    # "10:00"

class Zone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    time_windows: List[TimeWindow] = []
    is_active: bool = True
    active_today: bool = True  # Show in "Today's Schedule"
    is_custom: bool = False  # Custom/temporary zone for events
    sort_order: int = 0  # Order in the list
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ZoneCreate(BaseModel):
    name: str
    time_windows: List[TimeWindow] = []
    is_active: bool = True
    active_today: bool = True
    sort_order: int = 0

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    time_windows: Optional[List[TimeWindow]] = None
    is_active: Optional[bool] = None
    active_today: Optional[bool] = None
    sort_order: Optional[int] = None

class TodayScheduleUpdate(BaseModel):
    zones: List[dict]  # [{"id": "zone-id", "active_today": true, "sort_order": 0, "time_windows": [...]}]

class Customization(BaseModel):
    name: str  # "Milk Type", "Syrup", "Size"
    options: List[str]  # ["Whole", "Oat", "Almond"]
    default: Optional[str] = None
    price_modifier: Dict[str, float] = {}  # {"Oat": 0.75, "Almond": 0.75}

class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str  # "Espresso", "Latte", "Cold Brew", etc.
    image_url: Optional[str] = None
    customizations: List[Customization] = []
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    customizations: List[Customization] = []
    is_available: bool = True

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    customizations: Optional[List[Customization]] = None
    is_available: Optional[bool] = None

class OrderItem(BaseModel):
    menu_item_id: str
    menu_item_name: str
    quantity: int
    unit_price: float
    customizations: Dict[str, str] = {}  # {"Milk Type": "Oat", "Size": "Large"}
    item_total: float

class CustomerInfo(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    pickup_instructions: Optional[str] = None

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_info: CustomerInfo
    items: List[OrderItem]
    zone_id: Optional[str] = None
    zone_name: Optional[str] = None
    time_window: Optional[TimeWindow] = None
    order_type: str = "at_location"  # at_location or delivery
    delivery_address: Optional[str] = None
    subtotal: float
    tax: float = 0.0
    total: float
    status: str = "pending"  # pending, confirmed, preparing, ready, completed, cancelled
    payment_status: str = "unpaid"  # unpaid, pending, pending_verification, paid, failed
    payment_method: Optional[str] = None  # paypal, venmo, cashapp, zelle, cash, stripe
    payment_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None  # Timestamp when order was completed

class OrderCreate(BaseModel):
    customer_info: CustomerInfo
    items: List[OrderItem]
    zone_id: Optional[str] = None
    time_window: Optional[TimeWindow] = None
    order_type: Optional[str] = "at_location"  # at_location or delivery
    delivery_address: Optional[str] = None
    payment_status: Optional[str] = "pending"
    payment_method: Optional[str] = "manual"

class OrderStatusUpdate(BaseModel):
    status: str

class GroupRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    address: str
    people_count: int
    preferred_date: str
    preferred_time: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: str
    company_name: Optional[str] = None
    notes: Optional[str] = None
    status: str = "pending"  # pending, contacted, scheduled, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupRequestCreate(BaseModel):
    address: str
    people_count: int
    preferred_date: str
    preferred_time: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: str
    company_name: Optional[str] = None
    notes: Optional[str] = None

class VanLocation(BaseModel):
    lat: float
    lng: float
    status: str = "available"  # available, preparing, traveling, offline
    is_online: bool = False  # Controls if ordering is enabled
    mode: str = "mobile"  # mobile or stationary
    stationary_location_name: Optional[str] = None  # e.g., "Soccer Match at Lincoln Park"
    current_zone: Optional[str] = None
    # Traveling info - shows on map when heading to a customer
    traveling_to_name: Optional[str] = None  # Customer name or business name
    traveling_to_address: Optional[str] = None  # Delivery address
    traveling_to_order_id: Optional[str] = None  # Order ID being delivered
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VanLocationUpdate(BaseModel):
    lat: float
    lng: float
    status: Optional[str] = None
    is_online: Optional[bool] = None  # Controls if ordering is enabled
    mode: Optional[str] = None  # mobile or stationary
    stationary_location_name: Optional[str] = None
    current_zone: Optional[str] = None
    # Traveling info
    traveling_to_name: Optional[str] = None
    traveling_to_address: Optional[str] = None
    traveling_to_order_id: Optional[str] = None

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    order_id: str
    amount: float
    currency: str = "usd"
    status: str = "initiated"  # initiated, paid, failed, expired
    payment_status: str = "pending"
    metadata: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode['exp'] = datetime.now(timezone.utc).timestamp() + (24 * 60 * 60)  # 24 hours
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    admin = await db.admin_users.find_one({"id": payload.get("admin_id")}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin

# ===================== PUSH NOTIFICATION HELPERS =====================

class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]  # p256dh, auth

async def send_push_notification(title: str, body: str, url: str = "/admin/orders"):
    """Send push notification to all subscribed admins"""
    try:
        from pywebpush import webpush, WebPushException
        
        subscriptions = await db.push_subscriptions.find({}, {"_id": 0}).to_list(100)
        
        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": "/logo192.png",
            "badge": "/logo192.png",
            "url": url,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub["endpoint"],
                        "keys": sub["keys"]
                    },
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_EMAIL}
                )
                logger.info(f"Push sent to {sub['endpoint'][:50]}...")
            except WebPushException as e:
                logger.error(f"Push failed: {e}")
                # Remove invalid subscription
                if e.response and e.response.status_code in [404, 410]:
                    await db.push_subscriptions.delete_one({"endpoint": sub["endpoint"]})
            except Exception as e:
                logger.error(f"Push error: {e}")
    except ImportError:
        logger.warning("pywebpush not installed, skipping push notification")
    except Exception as e:
        logger.error(f"Push notification error: {e}")

# ===================== ZONE ENDPOINTS =====================

@api_router.get("/zones", response_model=List[Zone])
async def get_zones():
    zones = await db.zones.find({}, {"_id": 0}).to_list(100)
    return zones

@api_router.get("/zones/active", response_model=List[Zone])
async def get_active_zones():
    zones = await db.zones.find({"is_active": True}, {"_id": 0}).to_list(100)
    return zones

@api_router.get("/zones/{zone_id}", response_model=Zone)
async def get_zone(zone_id: str):
    zone = await db.zones.find_one({"id": zone_id}, {"_id": 0})
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone

@api_router.post("/zones", response_model=Zone)
async def create_zone(zone_data: ZoneCreate, admin: dict = Depends(get_current_admin)):
    zone = Zone(**zone_data.model_dump())
    doc = zone.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.zones.insert_one(doc)
    return zone

@api_router.put("/zones/{zone_id}", response_model=Zone)
async def update_zone(zone_id: str, zone_data: ZoneUpdate, admin: dict = Depends(get_current_admin)):
    update_dict = {k: v for k, v in zone_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.zones.update_one({"id": zone_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Zone not found")
    zone = await db.zones.find_one({"id": zone_id}, {"_id": 0})
    return zone

@api_router.delete("/zones/{zone_id}")
async def delete_zone(zone_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.zones.delete_one({"id": zone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {"message": "Zone deleted"}

# Get zones for today's schedule (only active_today=True, sorted)
@api_router.get("/zones/today/schedule")
async def get_today_schedule():
    zones = await db.zones.find(
        {"is_active": True, "active_today": True}, 
        {"_id": 0}
    ).sort("sort_order", 1).to_list(100)
    return zones

# Update today's schedule (bulk update zones)
@api_router.put("/zones/today/schedule")
async def update_today_schedule(schedule: TodayScheduleUpdate, admin: dict = Depends(get_current_admin)):
    for zone_update in schedule.zones:
        zone_id = zone_update.get("id")
        if not zone_id:
            continue
        
        # Check if this is a custom zone (new zone to be created)
        is_custom = zone_update.get("is_custom", False) or str(zone_id).startswith("custom-")
        
        if is_custom:
            # Create or update custom zone
            existing = await db.zones.find_one({"id": zone_id})
            if not existing:
                # Create new custom zone
                new_zone = {
                    "id": zone_id,
                    "name": zone_update.get("name", "Custom Location"),
                    "is_active": True,
                    "active_today": zone_update.get("active_today", True),
                    "is_custom": True,
                    "sort_order": zone_update.get("sort_order", 99),
                    "time_windows": zone_update.get("time_windows", [{"start": "09:00", "end": "17:00"}])
                }
                await db.zones.insert_one(new_zone)
            else:
                # Update existing custom zone
                update_dict = {}
                if "active_today" in zone_update:
                    update_dict["active_today"] = zone_update["active_today"]
                if "sort_order" in zone_update:
                    update_dict["sort_order"] = zone_update["sort_order"]
                if "time_windows" in zone_update:
                    update_dict["time_windows"] = zone_update["time_windows"]
                if update_dict:
                    await db.zones.update_one({"id": zone_id}, {"$set": update_dict})
        else:
            # Update regular zone
            update_dict = {}
            if "active_today" in zone_update:
                update_dict["active_today"] = zone_update["active_today"]
            if "sort_order" in zone_update:
                update_dict["sort_order"] = zone_update["sort_order"]
            if "time_windows" in zone_update:
                update_dict["time_windows"] = zone_update["time_windows"]
            if update_dict:
                await db.zones.update_one({"id": zone_id}, {"$set": update_dict})
    return {"message": "Schedule updated"}

# ===================== MENU ENDPOINTS =====================

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    items = await db.menu_items.find({}, {"_id": 0}).to_list(100)
    return items

@api_router.get("/menu/available", response_model=List[MenuItem])
async def get_available_menu():
    items = await db.menu_items.find({"is_available": True}, {"_id": 0}).to_list(100)
    return items

@api_router.get("/menu/categories")
async def get_categories():
    categories = await db.menu_items.distinct("category")
    return categories

@api_router.get("/menu/{item_id}", response_model=MenuItem)
async def get_menu_item(item_id: str):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item

@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item_data: MenuItemCreate, admin: dict = Depends(get_current_admin)):
    item = MenuItem(**item_data.model_dump())
    doc = item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.menu_items.insert_one(doc)
    return item

@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, item_data: MenuItemUpdate, admin: dict = Depends(get_current_admin)):
    update_dict = {k: v for k, v in item_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.menu_items.update_one({"id": item_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return item

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted"}

# ===================== ORDER ENDPOINTS =====================

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Get zone info if provided
    zone_name = None
    if order_data.zone_id:
        zone = await db.zones.find_one({"id": order_data.zone_id}, {"_id": 0})
        if zone:
            zone_name = zone.get('name')
    
    # Calculate totals
    subtotal = sum(item.item_total for item in order_data.items)
    tax = round(subtotal * 0.09, 2)  # 9% tax
    total = round(subtotal + tax, 2)
    
    order = Order(
        customer_info=order_data.customer_info,
        items=order_data.items,
        zone_id=order_data.zone_id,
        zone_name=zone_name,
        time_window=order_data.time_window,
        order_type=order_data.order_type or "at_location",
        delivery_address=order_data.delivery_address,
        subtotal=subtotal,
        tax=tax,
        total=total,
        payment_status=order_data.payment_status or "pending",
        payment_method=order_data.payment_method
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    
    # Send push notification for new order
    customer_name = order_data.customer_info.name if order_data.customer_info else "Customer"
    items_count = sum(item.quantity for item in order_data.items)
    try:
        await send_push_notification(
            title=f"🧋 New Order from {customer_name}!",
            body=f"{items_count} drink{'s' if items_count > 1 else ''} • ${total:.2f}",
            url="/admin/orders"
        )
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(admin: dict = Depends(get_current_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

@api_router.get("/orders/by-zone/{zone_id}")
async def get_orders_by_zone(zone_id: str, admin: dict = Depends(get_current_admin)):
    orders = await db.orders.find({"zone_id": zone_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders

@api_router.get("/orders/today")
async def get_todays_orders(admin: dict = Depends(get_current_admin)):
    today = datetime.now(timezone.utc).date().isoformat()
    orders = await db.orders.find(
        {"created_at": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return orders

@api_router.get("/orders/summary")
async def get_order_summary(admin: dict = Depends(get_current_admin)):
    today = datetime.now(timezone.utc).date().isoformat()
    orders = await db.orders.find(
        {"created_at": {"$regex": f"^{today}"}, "payment_status": "paid"},
        {"_id": 0}
    ).to_list(500)
    
    # Group by zone
    summary = {}
    total_revenue = 0
    total_drinks = 0
    
    for order in orders:
        zone_name = order.get('zone_name', 'Unknown')
        if zone_name not in summary:
            summary[zone_name] = {"drinks": {}, "total": 0, "order_count": 0}
        
        summary[zone_name]["total"] += order.get('total', 0)
        summary[zone_name]["order_count"] += 1
        total_revenue += order.get('total', 0)
        
        for item in order.get('items', []):
            drink_name = item.get('menu_item_name', 'Unknown')
            qty = item.get('quantity', 0)
            total_drinks += qty
            if drink_name in summary[zone_name]["drinks"]:
                summary[zone_name]["drinks"][drink_name] += qty
            else:
                summary[zone_name]["drinks"][drink_name] = qty
    
    return {
        "date": today,
        "total_revenue": round(total_revenue, 2),
        "total_drinks": total_drinks,
        "total_orders": len(orders),
        "by_zone": summary
    }

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# Calculate smart priority score for an order
def calculate_priority_score(order, van_location, current_time):
    """
    Smart priority balances wait time and distance.
    Higher score = higher priority
    Formula: (wait_time_minutes * 3) - (distance_miles * 2)
    """
    import math
    
    # Calculate wait time in minutes
    created_at = order.get('created_at', '')
    if isinstance(created_at, str):
        try:
            order_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        except ValueError:
            order_time = current_time
    else:
        order_time = created_at
    
    wait_minutes = (current_time - order_time).total_seconds() / 60
    
    # Calculate distance (simplified - would use real geocoding in production)
    distance = 5.0  # Default distance
    if van_location and order.get('delivery_address'):
        # Simple hash-based distance simulation
        addr = order.get('delivery_address', '')
        hash_val = sum(ord(c) for c in addr)
        distance = 1 + (hash_val % 100) / 10  # 1-11 miles range
    
    # Priority score: higher wait time = higher priority, higher distance = lower priority
    priority = (wait_minutes * 3) - (distance * 2)
    
    return {
        'priority_score': round(priority, 1),
        'wait_minutes': round(wait_minutes, 0),
        'distance_miles': round(distance, 1)
    }

# Get queue with smart priority ordering
@api_router.get("/orders/queue/active")
async def get_active_queue():
    """Get all active orders sorted by smart priority with queue positions and ETAs"""
    # Get active orders
    orders = await db.orders.find(
        {"status": {"$nin": ["completed", "cancelled"]}},
        {"_id": 0}
    ).to_list(100)
    
    if not orders:
        return {"queue": [], "total_active": 0}
    
    # Get van location
    van_loc = await db.van_location.find_one({}, {"_id": 0})
    current_time = datetime.now(timezone.utc)
    
    # Calculate priority for each order
    orders_with_priority = []
    for order in orders:
        priority_info = calculate_priority_score(order, van_loc, current_time)
        order['priority_score'] = priority_info['priority_score']
        order['wait_minutes'] = priority_info['wait_minutes']
        order['distance_miles'] = priority_info['distance_miles']
        orders_with_priority.append(order)
    
    # Sort by priority (highest first), then by status (preparing > confirmed > pending)
    status_order = {'preparing': 0, 'ready': 1, 'confirmed': 2, 'pending': 3}
    orders_with_priority.sort(
        key=lambda x: (status_order.get(x['status'], 4), -x['priority_score'])
    )
    
    # Calculate queue position and ETA for each order
    cumulative_time = 0
    PREP_TIME_PER_DRINK = 3  # minutes per drink (includes prep, payment, customer interaction)
    TRAVEL_TIME_PER_MILE = 3  # minutes per mile
    
    for idx, order in enumerate(orders_with_priority):
        order['queue_position'] = idx + 1
        
        # Calculate prep time for this order
        total_drinks = sum(item.get('quantity', 0) for item in order.get('items', []))
        prep_time = total_drinks * PREP_TIME_PER_DRINK
        
        # Add travel time for delivery orders
        travel_time = 0
        if order.get('order_type') == 'delivery':
            travel_time = order.get('distance_miles', 3) * TRAVEL_TIME_PER_MILE
        
        # ETA is cumulative time + this order's time
        order['estimated_prep_minutes'] = prep_time
        order['estimated_travel_minutes'] = round(travel_time, 0)
        order['estimated_wait_minutes'] = round(cumulative_time + prep_time + travel_time, 0)
        
        # Create ETA range (±5 minutes)
        eta_min = max(0, order['estimated_wait_minutes'] - 5)
        eta_max = order['estimated_wait_minutes'] + 5
        order['eta_range'] = f"{int(eta_min)}-{int(eta_max)} min"
        
        # Update cumulative time for next order
        cumulative_time += prep_time + travel_time
    
    return {
        "queue": orders_with_priority,
        "total_active": len(orders_with_priority),
        "van_location": van_loc
    }

# Public order tracking endpoint (no auth required)
@api_router.get("/orders/track/{order_id}")
async def track_order(order_id: str):
    """Public endpoint for customers to track their order status"""
    # Get the order
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # If completed or cancelled, return simple status
    if order.get('status') in ['completed', 'cancelled']:
        return {
            "order_id": order_id,
            "status": order.get('status'),
            "customer_name": order.get('customer_info', {}).get('name'),
            "total": order.get('total'),
            "items_count": sum(item.get('quantity', 0) for item in order.get('items', [])),
            "queue_position": None,
            "estimated_wait": None,
            "message": "Order completed!" if order.get('status') == 'completed' else "Order cancelled"
        }
    
    # Get full queue to calculate position
    queue_data = await get_active_queue()
    queue = queue_data.get('queue', [])
    
    # Find this order in the queue
    order_in_queue = None
    for q_order in queue:
        if q_order.get('id') == order_id:
            order_in_queue = q_order
            break
    
    if not order_in_queue:
        # Order not in active queue - might be just created
        order_in_queue = order
        order_in_queue['queue_position'] = len(queue) + 1
        order_in_queue['eta_range'] = "Calculating..."
    
    # Status messages
    status_messages = {
        'pending': "Order received! We'll start preparing soon.",
        'confirmed': "Order confirmed! Getting ready to make your drinks.",
        'preparing': "Your drinks are being made right now! ☕",
        'ready': "Your order is ready! 🎉"
    }
    
    # Check if van is traveling to this specific order
    van_loc = queue_data.get('van_location', {})
    is_van_coming_to_me = (
        van_loc.get('status') == 'traveling' and 
        van_loc.get('traveling_to_order_id') == order_id
    )
    
    # Custom message if van is on the way to THIS customer
    if is_van_coming_to_me:
        message = "🚐 The van is on the way to YOU right now!"
    else:
        message = status_messages.get(order_in_queue.get('status'), "Processing...")
    
    return {
        "order_id": order_id,
        "status": order_in_queue.get('status'),
        "customer_name": order_in_queue.get('customer_info', {}).get('name'),
        "total": order_in_queue.get('total'),
        "items_count": sum(item.get('quantity', 0) for item in order_in_queue.get('items', [])),
        "order_type": order_in_queue.get('order_type'),
        "queue_position": order_in_queue.get('queue_position'),
        "total_in_queue": len(queue),
        "estimated_wait": order_in_queue.get('eta_range'),
        "wait_minutes": order_in_queue.get('estimated_wait_minutes'),
        "distance_miles": order_in_queue.get('distance_miles'),
        "message": message,
        "van_status": van_loc.get('status', 'unknown'),
        "van_coming_to_me": is_van_coming_to_me,
        "items": [
            {
                "name": i.get('menu_item_name'), 
                "qty": i.get('quantity'),
                "customizations": i.get('customizations', {}),
                "unit_price": i.get('unit_price')
            } for i in order_in_queue.get('items', [])
        ]
    }

# Get archived (completed) orders for history/reports
@api_router.get("/orders/history/archived")
async def get_archived_orders(admin: dict = Depends(get_current_admin), days: int = 30):
    """Get completed orders from the last N days, grouped by date"""
    from datetime import timedelta
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    orders = await db.orders.find(
        {
            "status": {"$in": ["completed", "cancelled"]},
            "created_at": {"$gte": cutoff_date.isoformat()}
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Group orders by date
    grouped = {}
    for order in orders:
        # Parse the date from created_at
        created = order.get("created_at", "")
        if isinstance(created, str):
            date_str = created[:10]  # Get YYYY-MM-DD part
        else:
            date_str = created.strftime("%Y-%m-%d")
        
        if date_str not in grouped:
            grouped[date_str] = {
                "date": date_str,
                "orders": [],
                "total_revenue": 0,
                "total_orders": 0,
                "total_drinks": 0,
                "completed": 0,
                "cancelled": 0
            }
        
        grouped[date_str]["orders"].append(order)
        grouped[date_str]["total_orders"] += 1
        
        if order.get("status") == "completed":
            grouped[date_str]["completed"] += 1
            if order.get("payment_status") == "paid":
                grouped[date_str]["total_revenue"] += order.get("total", 0)
        else:
            grouped[date_str]["cancelled"] += 1
        
        for item in order.get("items", []):
            grouped[date_str]["total_drinks"] += item.get("quantity", 0)
    
    # Convert to sorted list
    result = sorted(grouped.values(), key=lambda x: x["date"], reverse=True)
    
    return result

# Get daily report for a specific date
@api_router.get("/orders/history/daily/{date}")
async def get_daily_report(date: str, admin: dict = Depends(get_current_admin)):
    """Get detailed report for a specific date (YYYY-MM-DD)"""
    # Get all orders for the date
    start_date = f"{date}T00:00:00"
    end_date = f"{date}T23:59:59"
    
    orders = await db.orders.find(
        {
            "created_at": {"$gte": start_date, "$lte": end_date}
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Calculate stats
    total_revenue = 0
    total_drinks = 0
    payment_methods = {}
    order_types = {"at_location": 0, "delivery": 0}
    statuses = {"completed": 0, "cancelled": 0, "pending": 0, "other": 0}
    top_drinks = {}
    
    for order in orders:
        status = order.get("status", "other")
        if status in statuses:
            statuses[status] += 1
        else:
            statuses["other"] += 1
        
        order_type = order.get("order_type", "at_location")
        order_types[order_type] = order_types.get(order_type, 0) + 1
        
        if status == "completed" and order.get("payment_status") == "paid":
            total_revenue += order.get("total", 0)
            
            method = order.get("payment_method", "unknown")
            payment_methods[method] = payment_methods.get(method, 0) + order.get("total", 0)
        
        for item in order.get("items", []):
            qty = item.get("quantity", 0)
            total_drinks += qty
            name = item.get("menu_item_name", "Unknown")
            top_drinks[name] = top_drinks.get(name, 0) + qty
    
    # Sort top drinks
    top_drinks_sorted = sorted(top_drinks.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "date": date,
        "total_orders": len(orders),
        "total_revenue": round(total_revenue, 2),
        "total_drinks": total_drinks,
        "statuses": statuses,
        "order_types": order_types,
        "payment_methods": payment_methods,
        "top_drinks": top_drinks_sorted,
        "orders": orders
    }

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, admin: dict = Depends(get_current_admin)):
    valid_statuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    update_data = {"status": status_update.status}
    
    # Add completed_at timestamp when order is completed
    if status_update.status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    # Add cancelled_at timestamp when order is cancelled
    if status_update.status == "cancelled":
        update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated", "status": status_update.status}

# Quick verify payment endpoint (for admin to mark manual payments as paid)
@api_router.post("/orders/{order_id}/verify-payment")
async def verify_order_payment(order_id: str, admin: dict = Depends(get_current_admin)):
    """Mark a manual payment (Venmo, CashApp, Zelle, Cash) as verified/paid"""
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "payment_status": "paid",
            "payment_verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Payment verified!", "payment_status": "paid"}

# Cancel order endpoint
@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, admin: dict = Depends(get_current_admin)):
    """Cancel an order"""
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order cancelled", "status": "cancelled"}

# Update order payment info
class PaymentUpdate(BaseModel):
    payment_method: str
    payment_status: str

@api_router.put("/orders/{order_id}/payment")
async def update_order_payment(order_id: str, payment_update: PaymentUpdate):
    valid_methods = ["paypal", "venmo", "cashapp", "zelle", "cash", "stripe", "manual"]
    valid_statuses = ["pending", "pending_verification", "paid", "failed", "refunded"]
    
    if payment_update.payment_method not in valid_methods:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    if payment_update.payment_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid payment status")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "payment_method": payment_update.payment_method,
            "payment_status": payment_update.payment_status
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Payment info updated"}

# ===================== PAYPAL PAYMENT ENDPOINTS =====================

class PayPalOrderCreate(BaseModel):
    order_id: str
    return_url: str
    cancel_url: str

@api_router.post("/paypal/create-order")
async def create_paypal_order(data: PayPalOrderCreate):
    # Get the order from database
    order = await db.orders.find_one({"id": data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get('payment_status') == 'paid':
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Create PayPal payment
    payment = paypalrestsdk.Payment({
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": data.return_url,
            "cancel_url": data.cancel_url
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": f"Espresso Beso Order #{order['id'][-6:].upper()}",
                    "sku": order['id'],
                    "price": str(round(order['total'], 2)),
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "total": str(round(order['total'], 2)),
                "currency": "USD"
            },
            "description": "Coffee order from Espresso Beso"
        }]
    })
    
    if payment.create():
        # Find approval URL
        approval_url = None
        for link in payment.links:
            if link.rel == "approval_url":
                approval_url = link.href
                break
        
        # Store PayPal payment ID with order
        await db.orders.update_one(
            {"id": data.order_id},
            {"$set": {"paypal_payment_id": payment.id}}
        )
        
        return {
            "paypal_order_id": payment.id,
            "approval_url": approval_url
        }
    else:
        raise HTTPException(status_code=400, detail=f"PayPal error: {payment.error}")

@api_router.post("/paypal/capture-order")
async def capture_paypal_order(payment_id: str = Body(...), payer_id: str = Body(...), order_id: str = Body(...)):
    # Execute the PayPal payment
    payment = paypalrestsdk.Payment.find(payment_id)
    
    if payment.execute({"payer_id": payer_id}):
        # Payment successful - update order
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "payment_status": "paid",
                "payment_method": "paypal_checkout",
                "paypal_payer_id": payer_id
            }}
        )
        return {"status": "success", "message": "Payment captured successfully"}
    else:
        raise HTTPException(status_code=400, detail=f"PayPal capture error: {payment.error}")

# ===================== STRIPE PAYMENT ENDPOINTS =====================

class StripeCheckoutRequest(BaseModel):
    order_id: str
    success_url: str
    cancel_url: str

@api_router.get("/stripe/config")
async def get_stripe_config():
    """Return Stripe publishable key for frontend"""
    return {"publishable_key": STRIPE_PUBLISHABLE_KEY}

@api_router.post("/stripe/create-checkout")
async def create_stripe_checkout(data: StripeCheckoutRequest):
    """Create a Stripe checkout session"""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    # Get the order from database
    order = await db.orders.find_one({"id": data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get('payment_status') == 'paid':
        raise HTTPException(status_code=400, detail="Order already paid")
    
    try:
        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f"Espresso Beso Order #{order['id'][-6:].upper()}",
                        'description': f"{sum(item.get('quantity', 1) for item in order.get('items', []))} drink(s)",
                    },
                    'unit_amount': int(float(order['total']) * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=data.success_url + '&session_id={CHECKOUT_SESSION_ID}',
            cancel_url=data.cancel_url,
            metadata={
                'order_id': data.order_id
            }
        )
        
        # Store Stripe session ID with order
        await db.orders.update_one(
            {"id": data.order_id},
            {"$set": {"stripe_session_id": checkout_session.id, "payment_status": "awaiting_payment"}}
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/stripe/session/{session_id}")
async def get_stripe_session_status(session_id: str):
    """Check Stripe checkout session status"""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        # If payment is complete, update order
        if session.payment_status == 'paid':
            order_id = session.metadata.get('order_id')
            if order_id:
                await db.orders.update_one(
                    {"id": order_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"payment_status": "paid", "payment_method": "stripe"}}
                )
        
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "order_id": session.metadata.get('order_id')
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe session error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Event.construct_from(
            json.loads(payload), stripe.api_key
        )
        
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            order_id = session.get('metadata', {}).get('order_id')
            
            if order_id and session.get('payment_status') == 'paid':
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {"payment_status": "paid", "payment_method": "stripe"}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ===================== PUSH NOTIFICATION ENDPOINTS =====================

@api_router.get("/push/vapid-key")
async def get_vapid_public_key():
    """Get VAPID public key for push subscription"""
    return {"publicKey": VAPID_PUBLIC_KEY}

@api_router.post("/push/subscribe")
async def subscribe_to_push(subscription: PushSubscription, admin: dict = Depends(get_current_admin)):
    """Subscribe admin to push notifications"""
    # Check if already subscribed
    existing = await db.push_subscriptions.find_one({"endpoint": subscription.endpoint})
    if existing:
        return {"message": "Already subscribed"}
    
    # Save subscription
    doc = {
        "endpoint": subscription.endpoint,
        "keys": subscription.keys,
        "admin_id": admin["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.push_subscriptions.insert_one(doc)
    logger.info(f"Push subscription added for admin {admin['email']}")
    return {"message": "Subscribed successfully"}

@api_router.post("/push/unsubscribe")
async def unsubscribe_from_push(subscription: PushSubscription, admin: dict = Depends(get_current_admin)):
    """Unsubscribe from push notifications"""
    result = await db.push_subscriptions.delete_one({"endpoint": subscription.endpoint})
    if result.deleted_count:
        return {"message": "Unsubscribed successfully"}
    return {"message": "Subscription not found"}

@api_router.post("/push/test")
async def test_push_notification(admin: dict = Depends(get_current_admin)):
    """Send a test push notification"""
    await send_push_notification(
        title="Test Notification",
        body="Push notifications are working! 🎉",
        url="/admin/orders"
    )
    return {"message": "Test notification sent"}

# ===================== GROUP REQUEST ENDPOINTS =====================

@api_router.post("/group-requests", response_model=GroupRequest)
async def create_group_request(request_data: GroupRequestCreate):
    group_request = GroupRequest(**request_data.model_dump())
    doc = group_request.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.group_requests.insert_one(doc)
    return group_request

@api_router.get("/group-requests", response_model=List[GroupRequest])
async def get_group_requests(admin: dict = Depends(get_current_admin)):
    requests = await db.group_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return requests

@api_router.put("/group-requests/{request_id}/status")
async def update_group_request_status(request_id: str, status: str = Body(..., embed=True), admin: dict = Depends(get_current_admin)):
    valid_statuses = ["pending", "contacted", "scheduled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.group_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Status updated", "status": status}

# ===================== VAN LOCATION ENDPOINTS =====================

@api_router.get("/van-location")
async def get_van_location():
    location = await db.van_location.find_one({}, {"_id": 0})
    if not location:
        # Return default location (Spokane) with default mode
        return {"lat": 47.6588, "lng": -117.4260, "status": "offline", "is_online": False, "mode": "mobile", "stationary_location_name": None, "current_zone": None}
    return location

# Simple endpoint to check if ordering is available
@api_router.get("/shop-status")
async def get_shop_status():
    location = await db.van_location.find_one({}, {"_id": 0})
    is_online = location.get("is_online", False) if location else False
    status = location.get("status", "offline") if location else "offline"
    mode = location.get("mode", "mobile") if location else "mobile"
    stationary_name = location.get("stationary_location_name") if location else None
    return {
        "is_online": is_online,
        "status": status,
        "mode": mode,
        "stationary_location_name": stationary_name,
        "can_order": is_online,
        "message": "We're open! Order now." if is_online else "We're currently offline. Request a visit!"
    }

@api_router.post("/van-location")
async def update_van_location(location_data: VanLocationUpdate, admin: dict = Depends(get_current_admin)):
    location = VanLocation(
        lat=location_data.lat,
        lng=location_data.lng,
        status=location_data.status or "available",
        is_online=location_data.is_online if location_data.is_online is not None else False,
        mode=location_data.mode or "mobile",
        stationary_location_name=location_data.stationary_location_name,
        current_zone=location_data.current_zone,
        traveling_to_name=location_data.traveling_to_name,
        traveling_to_address=location_data.traveling_to_address,
        traveling_to_order_id=location_data.traveling_to_order_id
    )
    
    doc = location.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    # Upsert - update if exists, insert if not
    await db.van_location.update_one({}, {"$set": doc}, upsert=True)
    return location

# Quick toggle for online/offline status
@api_router.post("/shop-status/toggle")
async def toggle_shop_status(admin: dict = Depends(get_current_admin)):
    location = await db.van_location.find_one({}, {"_id": 0})
    current_online = location.get("is_online", False) if location else False
    new_online = not current_online
    
    await db.van_location.update_one({}, {"$set": {"is_online": new_online}}, upsert=True)
    
    return {
        "is_online": new_online,
        "message": "Shop is now ONLINE - customers can order!" if new_online else "Shop is now OFFLINE - only visit requests allowed."
    }

# Endpoint to set van as traveling to a specific order
@api_router.post("/van-location/traveling-to/{order_id}")
async def set_traveling_to_order(order_id: str, admin: dict = Depends(get_current_admin)):
    """Set the van status to 'traveling' and show who you're heading to"""
    # Get the order details
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    customer_info = order.get('customer_info', {})
    # Use company/business name if available, otherwise use customer name
    display_name = customer_info.get('company') or customer_info.get('name', 'Customer')
    
    # Get current location
    current_loc = await db.van_location.find_one({}, {"_id": 0})
    if not current_loc:
        raise HTTPException(status_code=400, detail="Van location not set")
    
    # Update van location with traveling info
    update_data = {
        "status": "traveling",
        "traveling_to_name": display_name,
        "traveling_to_address": order.get('delivery_address'),
        "traveling_to_order_id": order_id,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.van_location.update_one({}, {"$set": update_data})
    
    # Also update the order status to 'ready' (out for delivery)
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "ready"}}
    )
    
    return {
        "message": f"Now traveling to {display_name}",
        "traveling_to": {
            "name": display_name,
            "address": order.get('delivery_address'),
            "order_id": order_id
        }
    }

# Endpoint to clear traveling status (arrived at destination)
@api_router.post("/van-location/arrived")
async def clear_traveling_status(admin: dict = Depends(get_current_admin)):
    """Clear the traveling status when you've arrived"""
    update_data = {
        "status": "available",
        "traveling_to_name": None,
        "traveling_to_address": None,
        "traveling_to_order_id": None,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.van_location.update_one({}, {"$set": update_data})
    return {"message": "Arrived! Status cleared."}

# Public endpoint for tracker app (with simple auth token)
@api_router.post("/van-location/update")
async def update_van_location_tracker(location_data: VanLocationUpdate, token: str = None):
    # Simple token auth for the tracker app
    if token != JWT_SECRET:
        raise HTTPException(status_code=401, detail="Invalid tracker token")
    
    location = VanLocation(
        lat=location_data.lat,
        lng=location_data.lng,
        status=location_data.status or "available",
        current_zone=location_data.current_zone
    )
    
    doc = location.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.van_location.update_one({}, {"$set": doc}, upsert=True)
    return {"message": "Location updated"}

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/register")
async def register_admin(admin_data: AdminRegister):
    # Check if admin exists
    existing = await db.admin_users.find_one({"email": admin_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    admin = AdminUser(
        email=admin_data.email,
        password_hash=hash_password(admin_data.password),
        name=admin_data.name
    )
    
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.admin_users.insert_one(doc)
    
    token = create_token({"admin_id": admin.id, "email": admin.email})
    return {"token": token, "admin": {"id": admin.id, "email": admin.email, "name": admin.name}}

@api_router.post("/auth/login")
async def login_admin(login_data: AdminLogin):
    admin = await db.admin_users.find_one({"email": login_data.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, admin['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"admin_id": admin['id'], "email": admin['email']})
    return {"token": token, "admin": {"id": admin['id'], "email": admin['email'], "name": admin['name']}}

@api_router.get("/auth/me")
async def get_current_admin_info(admin: dict = Depends(get_current_admin)):
    return {"id": admin['id'], "email": admin['email'], "name": admin['name']}

# ===================== SEED DATA ENDPOINT =====================


# Reset menu with full Espresso Beso menu
@api_router.post("/menu/reset")
async def reset_menu(admin: dict = Depends(get_current_admin)):
    # Clear existing menu
    await db.menu_items.delete_many({})
    
    # Standard customizations
    milk_options = Customization(
        name="Milk", 
        options=["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], 
        default="Whole Milk",
        price_modifier={}
    )
    
    flavor_options = Customization(
        name="Add Flavor",
        options=["None", "Coconut", "Hazelnut", "Brown Sugar Cinnamon", "Salted Caramel", "White Chocolate", "Vanilla", "Caramel"],
        default="None",
        price_modifier={
            "Coconut": 0.50, "Hazelnut": 0.50, "Brown Sugar Cinnamon": 0.50,
            "Salted Caramel": 0.50, "White Chocolate": 0.50, "Vanilla": 0.50, "Caramel": 0.50
        }
    )
    
    # Size options (2 sizes only)
    size_options = Customization(
        name="Size", 
        options=["12oz", "16oz"], 
        default="12oz",
        price_modifier={"16oz": 2.50}
    )
    
    menu_items = [
        # ============ SIGNATURE DRINKS ============
        MenuItem(
            name="Beso Delight",
            description="Hazelnut Sensation Mocha - our signature mocha with rich hazelnut",
            price=3.25,
            category="Signature Drinks",
            image_url="https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400",
            customizations=[size_options, milk_options]
        ),
        MenuItem(
            name="Sweet Beso",
            description="Coconut Caramel Mocha - sweet coconut meets rich caramel",
            price=3.25,
            category="Signature Drinks",
            image_url="https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400",
            customizations=[size_options, milk_options]
        ),
        MenuItem(
            name="White Beso",
            description="White Chocolate Mocha - creamy white chocolate perfection",
            price=3.25,
            category="Signature Drinks",
            image_url="https://images.unsplash.com/photo-1534778101976-62847782c213?w=400",
            customizations=[size_options, milk_options]
        ),
        MenuItem(
            name="Spice Beso",
            description="Cinnamon Salted Caramel Mocha - warm spice with sweet caramel",
            price=3.25,
            category="Signature Drinks",
            image_url="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
            customizations=[size_options, milk_options]
        ),
        MenuItem(
            name="Creamy Beso",
            description="Rich Creamy White Chocolate Macadamia Nut Mocha",
            price=3.25,
            category="Signature Drinks",
            image_url="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
            customizations=[size_options, milk_options]
        ),
        MenuItem(
            name="Kids Beso",
            description="Hot Chocolate Milk with Whip Cream (100 Degrees - kid-safe temp)",
            price=2.75,
            category="Signature Drinks",
            image_url="https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400",
            customizations=[milk_options]
        ),
        
        # ============ ICED DRINKS ============
        MenuItem(
            name="RedBull Beso",
            description="Redbull with your choice of syrup flavor, topped with whip cream",
            price=4.50,
            category="Iced Drinks",
            image_url="https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400",
            customizations=[flavor_options]
        ),
        MenuItem(
            name="Beso Frio",
            description="Coconut Caramel Ice Mocha - blended or iced",
            price=3.75,
            category="Iced Drinks",
            image_url="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
            customizations=[
                size_options,
                Customization(name="Style", options=["Iced", "Blended"], default="Iced", price_modifier={}),
                milk_options
            ]
        ),
        
        # ============ ESPRESSO CLASSICS ============
        MenuItem(
            name="Latte",
            description="Espresso shot with steamed whole milk - choose a flavor",
            price=3.25,
            category="Espresso Classics",
            image_url="https://images.unsplash.com/photo-1534778101976-62847782c213?w=400",
            customizations=[size_options, milk_options, flavor_options]
        ),
        MenuItem(
            name="Mocha",
            description="Espresso with steamed milk, white or dark chocolate - choose a flavor",
            price=3.25,
            category="Espresso Classics",
            image_url="https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400",
            customizations=[
                size_options,
                Customization(name="Chocolate", options=["Dark Chocolate", "White Chocolate"], default="Dark Chocolate", price_modifier={}),
                milk_options,
                flavor_options
            ]
        ),
        MenuItem(
            name="Macchiato",
            description="Espresso shot with steamed milk and microfoam - choose a flavor",
            price=3.25,
            category="Espresso Classics",
            image_url="https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400",
            customizations=[size_options, milk_options, flavor_options]
        ),
        MenuItem(
            name="Breves",
            description="Espresso shot with half and half steamed milk - choose a flavor",
            price=3.25,
            category="Espresso Classics",
            image_url="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
            customizations=[size_options, flavor_options]
        ),
        
        # ============ SMOOTHIES ============
        MenuItem(
            name="Fruit Smoothie",
            description="Blended fruit smoothie - Mango, Peach, or Strawberry",
            price=3.75,
            category="Smoothies",
            image_url="https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400",
            customizations=[
                size_options,
                Customization(name="Flavor", options=["Mango", "Peach", "Strawberry"], default="Strawberry", price_modifier={})
            ]
        ),
    ]
    
    for item in menu_items:
        doc = item.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.menu_items.insert_one(doc)
    
    return {"message": "Menu reset successfully", "items_added": len(menu_items)}


@api_router.post("/seed")
async def seed_data():
    # Check if data exists
    zones_count = await db.zones.count_documents({})
    if zones_count > 0:
        return {"message": "Data already seeded"}
    
    # Seed zones
    zones = [
        Zone(name="Spokane Valley", time_windows=[TimeWindow(start="07:00", end="10:00")], is_active=True, active_today=True, sort_order=0),
        Zone(name="South Hill", time_windows=[TimeWindow(start="10:30", end="13:00")], is_active=True, active_today=True, sort_order=1),
        Zone(name="North Spokane", time_windows=[TimeWindow(start="13:30", end="16:00")], is_active=True, active_today=True, sort_order=2),
        Zone(name="Downtown", time_windows=[TimeWindow(start="16:30", end="19:00")], is_active=True, active_today=True, sort_order=3),
    ]
    
    for zone in zones:
        doc = zone.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.zones.insert_one(doc)
    
    # Seed menu items
    menu_items = [
        MenuItem(
            name="Classic Espresso",
            description="Rich, bold double shot of premium espresso",
            price=3.50,
            category="Espresso",
            image_url="https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400",
            customizations=[
                Customization(name="Size", options=["Single", "Double", "Triple"], default="Double", price_modifier={"Single": -0.50, "Triple": 0.75})
            ]
        ),
        MenuItem(
            name="Vanilla Latte",
            description="Smooth espresso with steamed milk and vanilla",
            price=5.50,
            category="Latte",
            image_url="https://images.unsplash.com/photo-1534778101976-62847782c213?w=400",
            customizations=[
                Customization(name="Size", options=["Small", "Medium", "Large"], default="Medium", price_modifier={"Small": -0.50, "Large": 0.75}),
                Customization(name="Milk", options=["Whole", "Oat", "Almond", "Soy"], default="Whole", price_modifier={"Oat": 0.75, "Almond": 0.75, "Soy": 0.50}),
                Customization(name="Extra Shot", options=["No", "Yes"], default="No", price_modifier={"Yes": 0.75})
            ]
        ),
        MenuItem(
            name="Caramel Macchiato",
            description="Espresso with vanilla, milk, and caramel drizzle",
            price=5.75,
            category="Latte",
            image_url="https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400",
            customizations=[
                Customization(name="Size", options=["Small", "Medium", "Large"], default="Medium", price_modifier={"Small": -0.50, "Large": 0.75}),
                Customization(name="Milk", options=["Whole", "Oat", "Almond", "Soy"], default="Whole", price_modifier={"Oat": 0.75, "Almond": 0.75, "Soy": 0.50}),
                Customization(name="Extra Caramel", options=["No", "Yes"], default="No", price_modifier={"Yes": 0.50})
            ]
        ),
        MenuItem(
            name="Mocha",
            description="Espresso with chocolate and steamed milk topped with whip",
            price=5.75,
            category="Latte",
            image_url="https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400",
            customizations=[
                Customization(name="Size", options=["Small", "Medium", "Large"], default="Medium", price_modifier={"Small": -0.50, "Large": 0.75}),
                Customization(name="Milk", options=["Whole", "Oat", "Almond", "Soy"], default="Whole", price_modifier={"Oat": 0.75, "Almond": 0.75, "Soy": 0.50}),
                Customization(name="Whipped Cream", options=["Yes", "No"], default="Yes")
            ]
        ),
        MenuItem(
            name="Cappuccino",
            description="Equal parts espresso, steamed milk, and foam",
            price=5.00,
            category="Espresso",
            image_url="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
            customizations=[
                Customization(name="Size", options=["Small", "Medium", "Large"], default="Medium", price_modifier={"Small": -0.50, "Large": 0.75}),
                Customization(name="Milk", options=["Whole", "Oat", "Almond"], default="Whole", price_modifier={"Oat": 0.75, "Almond": 0.75})
            ]
        ),
        MenuItem(
            name="Americano",
            description="Espresso with hot water for a smooth, bold taste",
            price=4.00,
            category="Espresso",
            image_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400",
            customizations=[
                Customization(name="Size", options=["Small", "Medium", "Large"], default="Medium", price_modifier={"Small": -0.50, "Large": 0.50}),
                Customization(name="Extra Shot", options=["No", "Yes"], default="No", price_modifier={"Yes": 0.75})
            ]
        ),
        MenuItem(
            name="Cold Brew",
            description="Smooth, slow-steeped cold coffee",
            price=4.50,
            category="Cold",
            image_url="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400",
            customizations=[
                Customization(name="Size", options=["Medium", "Large"], default="Medium", price_modifier={"Large": 0.75}),
                Customization(name="Sweetener", options=["None", "Classic", "Vanilla"], default="None", price_modifier={"Classic": 0.25, "Vanilla": 0.50})
            ]
        ),
        MenuItem(
            name="Iced Latte",
            description="Chilled espresso with cold milk over ice",
            price=5.50,
            category="Cold",
            image_url="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
            customizations=[
                Customization(name="Size", options=["Medium", "Large"], default="Medium", price_modifier={"Large": 0.75}),
                Customization(name="Milk", options=["Whole", "Oat", "Almond", "Soy"], default="Whole", price_modifier={"Oat": 0.75, "Almond": 0.75, "Soy": 0.50}),
                Customization(name="Flavor", options=["None", "Vanilla", "Caramel", "Hazelnut"], default="None", price_modifier={"Vanilla": 0.50, "Caramel": 0.50, "Hazelnut": 0.50})
            ]
        ),
    ]
    
    for item in menu_items:
        doc = item.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.menu_items.insert_one(doc)
    
    return {"message": "Data seeded successfully", "zones": len(zones), "menu_items": len(menu_items)}

# ===================== ROOT ENDPOINT =====================

@api_router.get("/")
async def root():
    return {"message": "Espresso Beso API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

# CORS
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
