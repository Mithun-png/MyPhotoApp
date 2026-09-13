import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.services.auth_service import hash_password
from app.services.gallery_service import hash_pin

async def seed():
    print(f"Connecting to MongoDB ({settings.MONGODB_URI})...")
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
    
    # Try connecting, fallback if offline
    try:
        await client.admin.command('ping')
        db = client[settings.DB_NAME]
    except Exception:
        import mongomock_motor
        print("Note: Using mongomock for seed preview.")
        client = mongomock_motor.AsyncMongoMockClient()
        db = client[settings.DB_NAME]

    now = datetime.now(timezone.utc)

    # 1. Clear existing demo data
    await db.users.delete_many({"email": {"$in": ["admin@trizen.ai", "photographer@trizen.ai"]}})
    
    # 2. Create Admin User
    admin_id = str(uuid.uuid4())
    admin_user = {
        "_id": admin_id,
        "name": "Sarah Jenkins (Lead)",
        "email": "admin@trizen.ai",
        "password_hash": hash_password("Admin@12345"),
        "role": "admin",
        "created_at": now
    }
    await db.users.insert_one(admin_user)
    print("Created Demo Admin: admin@trizen.ai (Password: Admin@12345)")

    # 3. Create Team Member User
    team_id = str(uuid.uuid4())
    team_user = {
        "_id": team_id,
        "name": "Alex Rivera (Photographer)",
        "email": "photographer@trizen.ai",
        "password_hash": hash_password("Team@12345"),
        "role": "team_member",
        "created_at": now
    }
    await db.users.insert_one(team_user)
    print("Created Demo Team Member: photographer@trizen.ai (Password: Team@12345)")

    # 4. Create Sample Event (from SRD example)
    event_id = str(uuid.uuid4())
    sample_event = {
        "_id": event_id,
        "name": "Arjun & Priya Wedding",
        "created_by": admin_id,
        "team_members": [team_id],
        "created_at": now
    }
    await db.events.delete_many({"name": "Arjun & Priya Wedding"})
    await db.events.insert_one(sample_event)
    print("Created Sample Event: 'Arjun & Priya Wedding'")

    # 5. Create Sample Photos
    sample_photo_urls = [
        ("Ceremony Entrance.jpg", "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80", 2450000, True),
        ("Ring Exchange.jpg", "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop&q=80", 3120000, True),
        ("Couple Portrait at Sunset.jpg", "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&auto=format&fit=crop&q=80", 2890000, True),
        ("Reception First Dance.jpg", "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80", 3540000, True),
        ("Floral Centerpiece Detail.jpg", "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1200&auto=format&fit=crop&q=80", 1850000, False),
        ("Cake Cutting Moment.jpg", "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1200&auto=format&fit=crop&q=80", 2150000, True),
    ]

    selected_photo_ids = []
    for filename, url, size, is_sel in sample_photo_urls:
        pid = str(uuid.uuid4())
        doc = {
            "_id": pid,
            "event_id": event_id,
            "uploaded_by": team_id,
            "filename": filename,
            "cloudinary_url": url,
            "cloudinary_public_id": f"sample/{pid}",
            "file_size": size,
            "is_selected": is_sel,
            "created_at": now
        }
        await db.photos.insert_one(doc)
        if is_sel:
            selected_photo_ids.append(pid)

    print(f"Created {len(sample_photo_urls)} sample photos ({len(selected_photo_ids)} selected)")

    # 6. Create Published Demo Gallery (with SRD credentials: PIN 482917, slug abc123)
    demo_slug = "abc123"
    demo_pin = "482917"
    gallery_id = str(uuid.uuid4())
    gallery_doc = {
        "_id": gallery_id,
        "event_id": event_id,
        "share_slug": demo_slug,
        "pin_hash": hash_pin(demo_pin),
        "photo_ids": selected_photo_ids,
        "is_published": True,
        "published_at": now,
        "updated_at": now
    }
    await db.galleries.delete_many({"event_id": event_id})
    await db.galleries.insert_one(gallery_doc)

    print("=" * 60)
    print("SEEDED SUCCESSFULLY!")
    print(f"Demo Admin:           admin@trizen.ai / Admin@12345")
    print(f"Demo Team Member:     photographer@trizen.ai / Team@12345")
    print(f"Demo Gallery URL:     /gallery/{demo_slug}")
    print(f"Demo Gallery PIN:     {demo_pin}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(seed())
