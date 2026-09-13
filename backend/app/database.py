import logging
import uuid
from typing import Optional, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("photosharing.database")

class Database:
    client: Optional[Any] = None
    db: Optional[Any] = None

db_instance = Database()

async def get_db():
    return db_instance.db

async def seed_initial_data(db):
    user_count = await db.users.count_documents({})
    if user_count == 0:
        logger.info("Database empty. Auto-seeding evaluation demo data...")
        from app.services.auth_service import hash_password
        from app.services.gallery_service import hash_pin

        now = datetime.now(timezone.utc)

        # Admin
        admin_id = str(uuid.uuid4())
        await db.users.insert_one({
            "_id": admin_id,
            "name": "Sarah Jenkins (Lead)",
            "email": "admin@trizen.ai",
            "password_hash": hash_password("Admin@12345"),
            "role": "admin",
            "created_at": now
        })

        # Team Member
        team_id = str(uuid.uuid4())
        await db.users.insert_one({
            "_id": team_id,
            "name": "Alex Rivera (Photographer)",
            "email": "photographer@trizen.ai",
            "password_hash": hash_password("Team@12345"),
            "role": "team_member",
            "created_at": now
        })

        # Event
        event_id = str(uuid.uuid4())
        await db.events.insert_one({
            "_id": event_id,
            "name": "Arjun & Priya Wedding",
            "created_by": admin_id,
            "team_members": [team_id],
            "created_at": now
        })

        # Photos
        sample_photos = [
            ("Ceremony Entrance.jpg", "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80", 2450000, True),
            ("Ring Exchange.jpg", "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop&q=80", 3120000, True),
            ("Couple Portrait at Sunset.jpg", "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&auto=format&fit=crop&q=80", 2890000, True),
            ("Reception First Dance.jpg", "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80", 3540000, True),
            ("Floral Centerpiece Detail.jpg", "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1200&auto=format&fit=crop&q=80", 1850000, False),
            ("Cake Cutting Moment.jpg", "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1200&auto=format&fit=crop&q=80", 2150000, True),
        ]

        selected_ids = []
        for filename, url, size, is_sel in sample_photos:
            pid = str(uuid.uuid4())
            await db.photos.insert_one({
                "_id": pid,
                "event_id": event_id,
                "uploaded_by": team_id,
                "filename": filename,
                "cloudinary_url": url,
                "cloudinary_public_id": f"sample/{pid}",
                "file_size": size,
                "is_selected": is_sel,
                "created_at": now
            })
            if is_sel:
                selected_ids.append(pid)

        # Published Gallery
        await db.galleries.insert_one({
            "_id": str(uuid.uuid4()),
            "event_id": event_id,
            "share_slug": "abc123",
            "pin_hash": hash_pin("482917"),
            "photo_ids": selected_ids,
            "is_published": True,
            "published_at": now,
            "updated_at": now
        })
        logger.info("Demo data auto-seeded: admin@trizen.ai, photographer@trizen.ai, gallery /gallery/abc123 (PIN: 482917).")

async def connect_to_mongo():
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        await db_instance.client.admin.command('ping')
        db_instance.db = db_instance.client[settings.DB_NAME]
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URI}, database: {settings.DB_NAME}")
        await init_indexes(db_instance.db)
        await seed_initial_data(db_instance.db)
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB ({e}). Initializing in-memory mock store for offline/demo/testing mode.")
        try:
            import mongomock_motor
            db_instance.client = mongomock_motor.AsyncMongoMockClient()
            db_instance.db = db_instance.client[settings.DB_NAME]
            await init_indexes(db_instance.db)
            await seed_initial_data(db_instance.db)
            logger.info("Successfully initialized AsyncMongoMockClient fallback with seed data.")
        except Exception as mock_err:
            logger.error(f"Fallback initialization error: {mock_err}")
            raise e

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

async def init_indexes(db):
    try:
        await db.users.create_index("email", unique=True)
        await db.galleries.create_index("event_id", unique=True)
        await db.galleries.create_index("share_slug", unique=True)
        await db.photos.create_index("event_id")
        logger.info("MongoDB indexes verified.")
    except Exception as e:
        logger.warning(f"Index creation note: {e}")
