# PhotoSphere — Collaborative Photo Sharing Platform
---

## 1. Project Overview

**PhotoSphere** is a high-performance, full-stack photo-sharing application tailored for photography and event teams. It solves the end-to-end workflow of collaborative event coverage:
1. **Admin / Lead:** Creates events, assigns pre-registered photographers, reviews uploaded photo submissions, selectively curates the best captures, and publishes a single active customer gallery with a numeric PIN.
2. **Team Member (Photographer):** Accesses assigned events, uploads high-resolution event captures (single or batch drag-and-drop), and views their own contributions.
3. **Customer / Guest:** Accesses their private gallery using a shareable link and a 6-digit numeric access PIN without needing to register an account.

---

## 2. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React (Vite) | Fast SPA with component-driven architecture, custom design tokens, and Lucide icons |
| **Styling** | Vanilla CSS | Custom dark obsidian glassmorphism, responsive grid/masonry, micro-animations |
| **Backend** | Python (FastAPI) | High-concurrency async REST API with Pydantic v2 data validation |
| **Database** | MongoDB (Motor) | Async document store with collection indexes and offline mock fallback |
| **Object Storage**| Cloudinary | Cloud-based media storage with resilient mock/data URI fallback for local dev |
| **Authentication**| JWT (PyJWT + Native Bcrypt)| Stateless token-based auth with embedded role claims (`admin` / `team_member`) |
| **Security** | Brute-Force Rate Limiter | In-memory PIN limiter locking after 5 consecutive failed attempts per gallery |
| **Testing** | Pytest + pytest-asyncio | Full test suite verifying auth, role isolation, multi-upload, and PIN protection |

---

## 3. System Architecture & Data Flow

```
┌────────────────────────────────┐                 ┌────────────────────────────────┐
│       Customer / Guest         │                 │      Admin & Team Member       │
│  (Share URL + 6-digit PIN)     │                 │   (JWT Role-Based Session)     │
└───────────────┬────────────────┘                 └───────────────┬────────────────┘
                │                                                  │
                │ GET /api/gallery/:slug (Metadata only)           │ POST /api/events/:id/photos
                │ POST /api/gallery/:slug/verify-pin               │ POST /api/events/:id/gallery
                │                                                  │
                ▼                                                  ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           FastAPI Application Service                             │
│                                                                                   │
│   ┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐  │
│   │   Auth Middleware   │    │  Role Authorization  │    │  PIN Rate Limiter   │  │
│   │   (JWT Validation)  │    │  (Admin / Team)      │    │  (Max 5 Attempts)   │  │
│   └─────────────────────┘    └──────────────────────┘    └─────────────────────┘  │
└───────────────────┬──────────────────────────────────────────────┬────────────────┘
                    │                                              │
                    ▼                                              ▼
┌───────────────────────────────────────┐      ┌────────────────────────────────────┐
│          MongoDB Database             │      │       Cloudinary Storage           │
│                                       │      │                                    │
│  • users: credentials & role          │      │  Stores binary image assets        │
│  • events: project metadata & team    │      │  in folder:                        │
│  • photos: urls, sizes, is_selected   │      │  photosharing/events/{event_id}/   │
│  • galleries: share_slug, pin_hash    │      │                                    │
└───────────────────────────────────────┘      └────────────────────────────────────┘
```

---

## 4. Database Design (MongoDB Schema)

```javascript
// users collection
{
  "_id": "uuid-v4-string",
  "name": "Sarah Jenkins (Lead)",
  "email": "admin@trizen.ai",
  "password_hash": "$2b$12$...bcrypt...",
  "role": "admin", // "admin" | "team_member"
  "created_at": ISODate("2026-09-06T12:00:00Z")
}

// events collection
{
  "_id": "uuid-v4-string",
  "name": "Arjun & Priya Wedding",
  "created_by": "admin-uuid",
  "team_members": ["team-member-uuid-1", "team-member-uuid-2"],
  "created_at": ISODate("2026-09-06T12:00:00Z")
}

// photos collection
{
  "_id": "uuid-v4-string",
  "event_id": "event-uuid",
  "uploaded_by": "user-uuid",
  "filename": "Ceremony Entrance.jpg",
  "storage_location": "https://res.cloudinary.com/.../image.jpg",
  "cloudinary_url": "https://res.cloudinary.com/.../image.jpg",
  "cloudinary_public_id": "photosharing/events/.../unique_id",
  "file_size": 2450000,
  "is_selected": true,
  "created_at": ISODate("2026-09-06T12:00:00Z")
}

// galleries collection (enforces one gallery per event via unique index)
{
  "_id": "uuid-v4-string",
  "event_id": "event-uuid", // UNIQUE INDEX
  "share_slug": "abc123",    // UNIQUE INDEX
  "pin_hash": "$2b$12$...bcrypt...",
  "photo_ids": ["photo-uuid-1", "photo-uuid-2"],
  "is_published": true,
  "published_at": ISODate("2026-09-06T12:00:00Z"),
  "updated_at": ISODate("2026-09-06T12:00:00Z")
}
```

---

## 5. Demo Credentials (Evaluation Ready)

The database includes pre-seeded demo accounts and a pre-configured gallery for immediate verification:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin / Lead** | `admin@trizen.ai` | `Admin@12345` | Full access: Create events, assign team, curate & publish galleries |
| **Team Member** | `photographer@trizen.ai` | `Team@12345` | Restricted: View assigned events, upload photos, view own uploads |

### Demo Customer Gallery
- **Public URL:** `/gallery/abc123` (or full URL: `http://localhost:5173/gallery/abc123`)
- **Access PIN:** `482917` (Non-expiring numeric PIN)
- **Status:** Pre-loaded with 6 sample photos (5 curated) for the "Arjun & Priya Wedding" event.

---

## 6. Local Setup & Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB (optional — built-in in-memory fallback runs automatically if local MongoDB is not detected)

### Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run seed script to populate demo data
python seed.py

# Launch FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` (Interactive Swagger Docs at `http://127.0.0.1:8000/docs`).

### Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## 7. Environment Variables

### Backend (`backend/.env`)
```env
PROJECT_NAME="Photo Sharing Platform"
MONGODB_URI="mongodb://localhost:27017"
DB_NAME="photosharing"

JWT_SECRET="super-secret-key-for-jwt-signing-change-in-production-2026"
JWT_ALGORITHM="HS256"
JWT_EXPIRY_MINUTES=1440

CLOUDINARY_CLOUD_NAME="demo"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz"

PIN_MAX_ATTEMPTS=5
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL="http://localhost:8000/api"
```

---

## 8. Automated Testing

The backend includes a comprehensive Pytest suite:
```bash
cd backend
python -m pytest tests/ -v
```

### Test Coverage Highlights:
- `test_register_and_login`: User registration, first-admin bootstrap, and JWT issuance.
- `test_login_invalid_credentials`: 401 handling on wrong password.
- `test_get_me`: Protected route verification.
- `test_admin_create_event`: Admin event creation.
- `test_team_member_cannot_create_event`: 403 Forbidden enforcement on non-admin event creation.
- `test_event_isolation_for_team_member`: Multi-tenant isolation ensuring photographers cannot view or upload to unassigned events.
- `test_batch_photo_upload_and_selection`: Multi-photo file upload, individual status reporting, single and bulk photo selection.
- `test_gallery_workflow_and_pin_protection`: End-to-end gallery publishing, PIN bcrypt verification, leak-free metadata route, and brute-force attempt lockout.

---

## 9. Edge Cases Handled

| Scenario | Handled By |
|---|---|
| **Unauthorized event access** | Server-side check in `events.py` and `photos.py` verifying event membership before returning any data. |
| **Team member publishing** | `require_admin` dependency rejects non-admin requests with `403 Forbidden`. |
| **Failed photo upload** | Per-file status handling in `BatchUploadResponse`. Successful uploads are committed while failed files return exact error reasons. |
| **Brute-force PIN guessing** | `PinRateLimiter` tracks consecutive failures per slug and locks out attempts for 15 minutes after 5 failed attempts (`429 Too Many Requests`). |
| **Unpublished photos leakage** | Public metadata route (`GET /api/gallery/:slug`) returns zero photo URLs. Photos are only returned after successful PIN verification. |
| **PIN leakage in URLs/logs** | PIN verification is transmitted via POST request body (`POST /api/gallery/:slug/verify-pin`) rather than query parameters. |

---

## 10. Deployment Steps

### Backend Deployment (Render / Railway)
1. Push repository to GitHub.
2. Create a new Web Service on Render pointing to `backend/`.
3. Set Build Command: `pip install -r requirements.txt`
4. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Configure Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`).

### Frontend Deployment (Vercel)
1. Import repository on Vercel pointing to the `frontend/` root directory.
2. Framework Preset: `Vite`.
3. Set Environment Variable: `VITE_API_BASE_URL=https://<your-backend-render-domain>/api`.
4. Deploy.

---

## 11. Known Limitations & Future Enhancements

- **Object Storage:** Built-in resilient fallback converts files to structured data URIs when Cloudinary credentials are in placeholder mode, enabling full local testing without cloud account setup.
- **Bonus Capabilities Available for Extension:** Image watermarking, client-side EXIF metadata parsing, and ZIP archive batch download for customers.
