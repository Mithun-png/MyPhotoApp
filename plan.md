# Project Plan (Final) — Photo Sharing Platform (TrizenAI Full-Stack Internship Challenge)

**Type:** Solo submission
**Deadline:** September 20, 2026 — 11:59 PM IST

---

## 1. Locked Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) |
| Backend | Python — FastAPI |
| Database | MongoDB |
| Object Storage | Cloudinary |
| Auth | JWT (access token) with role claim (`admin` / `team_member`) |
| Deployment | To be decided later (Render/Vercel are the likely default) |
| Testing | Pytest for backend auth, access control, and gallery workflows |

---

## 2. Confirmed Product Decisions

- **Team members are pre-registered by the Admin** — the Admin creates the account/assignment; no self-registration flow for Team Members.
- **Gallery PIN is numeric and does not expire** — needed so the demo gallery link + PIN stay valid at submission/evaluation time.
- **One active gallery per event** — no multiple gallery "versions"; publishing again updates the same gallery.
- **Multiple photo uploads supported** — Team Members can select and upload multiple photos in a single action (SRD §4 requirement).
- **Solo project** — one person (you) fills the Admin role and at least one Team Member role for demo/testing purposes. Demo credentials will include one Admin account and one Team Member account, both under your control.

---

## 3. User Roles & Permissions

| Role | Can Do | Cannot Do |
|---|---|---|
| Admin/Lead | Register/login, create events, add (pre-registered) team members, view all photos, select photos, publish/update gallery, generate link + PIN | — |
| Team Member | Login, view assigned events, upload photos (single & multiple), view own uploads | Publish galleries, manage others' photos, access unassigned events |
| Customer | Enter link + PIN, view/browse published photos | Access unpublished photos, access other events, guess PIN without rate limiting |

---

## 4. Workflow

1. Admin registers/logs in, creates an Event
2. Admin adds pre-registered Team Members to the Event
3. Team Member logs in, uploads photos (single or batch) to their assigned Event
4. Admin reviews all uploaded photos for the Event, selects a subset
5. Admin publishes the Gallery (or updates the existing one, since only one gallery is active per event) → system generates/reuses a share link + numeric PIN
6. Customer opens the link, enters the PIN, views the published photos — no account needed

---

## 5. Data Model (MongoDB Collections)

```js
// users
{
  _id, name, email, password_hash, role: "admin" | "team_member", created_at
}

// events
{
  _id, name, created_by (user_id ref), created_at,
  team_members: [user_id, ...]   // pre-registered team members assigned to this event
}

// photos
{
  _id, event_id (ref), uploaded_by (user_id ref),
  filename, cloudinary_url, cloudinary_public_id,
  file_size, is_selected: boolean, created_at
}

// galleries
{
  _id, event_id (ref, unique — one gallery per event),
  pin_hash, share_slug, photo_ids: [photo_id, ...],
  is_published: boolean, published_at, updated_at
}
```

**Notes:**
- `event_id` is unique in `galleries` to enforce "one gallery per event."
- `pin_hash` stores a bcrypt hash of the numeric PIN — never the raw PIN.
- Cloudinary stores the actual image; MongoDB stores only `cloudinary_url` / `cloudinary_public_id` and metadata, per the SRD's "no image files in the database" requirement.

---

## 6. Architecture

### 6.1 High-Level System Diagram

```
┌─────────────────────┐         HTTPS (JSON)         ┌──────────────────────────┐
│                     │ ──────────────────────────▸   │                          │
│   React (Vite)      │                               │    FastAPI Backend        │
│   SPA Frontend      │ ◂──────────────────────────   │                          │
│                     │                               │  ┌──────────────────┐    │
│  Pages:             │                               │  │  Auth Middleware  │    │
│  - Login            │                               │  │  (JWT + Roles)   │    │
│  - Admin Dashboard  │                               │  └────────┬─────────┘    │
│  - Event Manager    │                               │           │              │
│  - Photo Upload     │                               │  ┌────────▾─────────┐    │
│  - Gallery Publish  │                               │  │  Route Handlers  │    │
│  - Public Gallery   │                               │  │  /auth, /events  │    │
│                     │                               │  │  /photos,        │    │
└─────────────────────┘                               │  │  /galleries      │    │
                                                      │  └──┬──────────┬────┘    │
                                                      │     │          │         │
                                                      └─────┼──────────┼─────────┘
                                                            │          │
                                            ┌───────────────▾┐    ┌───▾──────────────┐
                                            │   MongoDB       │    │   Cloudinary     │
                                            │   (Atlas)       │    │   (Object Store) │
                                            │                 │    │                  │
                                            │  Collections:   │    │  Folders:        │
                                            │  - users        │    │  /events/{id}/   │
                                            │  - events       │    │                  │
                                            │  - photos       │    │  Stores actual   │
                                            │  - galleries    │    │  image files     │
                                            └─────────────────┘    └──────────────────┘
```

### 6.2 Request Flow

| Flow | Path |
|---|---|
| **Auth** | Client → `POST /auth/register` or `POST /auth/login` → JWT issued → stored in client (httpOnly cookie or localStorage) |
| **Protected API** | Client → Request with `Authorization: Bearer <JWT>` → Auth middleware validates token + extracts role → Route handler executes |
| **Photo Upload** | Team Member → `POST /photos/upload` (multipart, 1–N files) → FastAPI receives files → uploads each to Cloudinary → stores metadata per photo in MongoDB → returns URLs |
| **Gallery Access** | Customer → `GET /galleries/{share_slug}` → returns gallery info (no photos yet) → `POST /galleries/{share_slug}/verify-pin` with PIN → if valid, returns photo URLs |

### 6.3 Key Design Decisions

- **Upload goes through FastAPI** (not direct client-to-Cloudinary) so the server can validate auth, enforce event membership, and ensure metadata consistency.
- **PIN verification is a separate POST** (not a query parameter) to avoid PIN leakage in server logs/URL history.
- **Rate limiting on PIN attempts** — per share_slug, lock after 5 failed attempts (configurable).
- **JWT contains role claim** — middleware checks role before allowing access to admin-only endpoints.

---

## 7. API Endpoints

### 7.1 Auth (`/api/auth`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | — | Register a new Admin account (first-use) or Admin registers a Team Member |
| `POST` | `/api/auth/login` | None | — | Login → returns JWT |

### 7.2 Events (`/api/events`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/events` | JWT | Admin: all events; TM: assigned only | List events |
| `POST` | `/api/events` | JWT | Admin | Create a new event |
| `GET` | `/api/events/{event_id}` | JWT | Admin or assigned TM | Get event details |
| `POST` | `/api/events/{event_id}/members` | JWT | Admin | Add team member(s) to event |
| `DELETE` | `/api/events/{event_id}/members/{user_id}` | JWT | Admin | Remove a team member from event |

### 7.3 Photos (`/api/photos`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/events/{event_id}/photos` | JWT | Admin or assigned TM | Upload one or multiple photos (multipart/form-data) |
| `GET` | `/api/events/{event_id}/photos` | JWT | Admin: all photos; TM: own uploads | List photos for an event |
| `PATCH` | `/api/photos/{photo_id}/select` | JWT | Admin | Toggle `is_selected` on a photo |
| `PATCH` | `/api/events/{event_id}/photos/select` | JWT | Admin | Bulk select/deselect photos (body: `{ photo_ids: [...], is_selected: bool }`) |
| `DELETE` | `/api/photos/{photo_id}` | JWT | Admin | Delete a photo (removes from Cloudinary + MongoDB) |

### 7.4 Galleries (`/api/galleries`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/events/{event_id}/gallery` | JWT | Admin | Publish/update gallery (creates gallery with selected photos, generates slug + PIN) |
| `GET` | `/api/events/{event_id}/gallery` | JWT | Admin | Get gallery status/details for an event |

### 7.5 Public Gallery (`/api/gallery` — no auth)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/gallery/{share_slug}` | None | — | Get gallery metadata (event name, photo count — no photo URLs yet) |
| `POST` | `/api/gallery/{share_slug}/verify-pin` | None | — | Verify PIN → if correct, return photo URLs; if wrong, increment fail counter |

---

## 8. Frontend Pages & Components

### 8.1 Pages

| Page | Route | Auth | Description |
|---|---|---|---|
| **Login** | `/login` | No | Email + password form; redirects to dashboard on success |
| **Admin Dashboard** | `/dashboard` | Admin | Overview: list of events, quick stats |
| **Create Event** | `/events/new` | Admin | Form to create a new event |
| **Event Detail** | `/events/:id` | Admin / TM | Admin: view all photos, manage team members, select photos, publish gallery. TM: view own photos, upload new ones |
| **Photo Upload** | `/events/:id/upload` | TM / Admin | Drag-and-drop or file picker for single/multiple photo upload with progress indicators |
| **Gallery Publish** | `/events/:id/gallery` | Admin | Review selected photos, set/regenerate PIN, publish/update gallery, copy share link |
| **Public Gallery** | `/gallery/:slug` | No | PIN entry → photo grid/masonry view of published photos |

### 8.2 Shared Components

| Component | Description |
|---|---|
| `Navbar` | Top navigation bar with role-aware links + logout |
| `ProtectedRoute` | HOC/wrapper that checks JWT + role before rendering |
| `PhotoCard` | Displays a single photo thumbnail with select checkbox (Admin) |
| `PhotoGrid` | Responsive grid/masonry layout for photo cards |
| `UploadDropzone` | Drag-and-drop area with multi-file support and upload progress bars |
| `PinInput` | Numeric PIN input field for customer gallery access |
| `EventCard` | Card displaying event name, date, photo count, gallery status |
| `MemberList` | List of team members assigned to an event with add/remove |
| `Modal` | Reusable modal dialog for confirmations, PIN display, etc. |
| `Toast/Alert` | Notification component for success/error/info messages |

---

## 9. Project Folder Structure

```
PhotoSharingPlatform/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point, CORS, router mounting
│   │   ├── config.py                # Settings (env vars, DB URI, Cloudinary config)
│   │   ├── database.py              # MongoDB connection (Motor async client)
│   │   ├── models/
│   │   │   ├── user.py              # User Pydantic schemas
│   │   │   ├── event.py             # Event Pydantic schemas
│   │   │   ├── photo.py             # Photo Pydantic schemas
│   │   │   └── gallery.py           # Gallery Pydantic schemas
│   │   ├── routers/
│   │   │   ├── auth.py              # /api/auth routes
│   │   │   ├── events.py            # /api/events routes
│   │   │   ├── photos.py            # /api/photos routes
│   │   │   └── galleries.py         # /api/galleries + /api/gallery (public) routes
│   │   ├── services/
│   │   │   ├── auth_service.py      # Password hashing, JWT creation/validation
│   │   │   ├── cloudinary_service.py # Cloudinary upload/delete helpers
│   │   │   └── gallery_service.py   # PIN hashing, slug generation
│   │   ├── middleware/
│   │   │   ├── auth_middleware.py    # JWT verification dependency
│   │   │   └── rate_limiter.py      # PIN attempt rate limiting
│   │   └── utils/
│   │       └── helpers.py           # Shared utilities
│   ├── tests/
│   │   ├── test_auth.py             # Auth registration/login tests
│   │   ├── test_events.py           # Event CRUD + membership tests
│   │   ├── test_photos.py           # Upload, access control tests
│   │   └── test_galleries.py        # Publish, PIN verify tests
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── main.jsx                 # React entry point
│   │   ├── App.jsx                  # Root component + routing
│   │   ├── api/
│   │   │   └── client.js            # Axios/fetch wrapper with JWT interceptor
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx      # Auth state provider (JWT, user, role)
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── PhotoCard.jsx
│   │   │   ├── PhotoGrid.jsx
│   │   │   ├── UploadDropzone.jsx
│   │   │   ├── PinInput.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── MemberList.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── CreateEventPage.jsx
│   │   │   ├── EventDetailPage.jsx
│   │   │   ├── PhotoUploadPage.jsx
│   │   │   ├── GalleryPublishPage.jsx
│   │   │   └── PublicGalleryPage.jsx
│   │   └── styles/
│   │       └── index.css            # Global styles / design tokens
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── plan.md                          # This file
├── srd.md                           # Software Requirements Document
└── README.md                        # Final documentation (to be written)
```

---

## 10. Environment Variables

```env
# Backend (.env)
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/photosharing
JWT_SECRET=<random-secret-key>
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=1440

CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

PIN_MAX_ATTEMPTS=5
CORS_ORIGINS=http://localhost:5173

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 11. Edge Cases to Handle (per SRD Section 6)

| Scenario | Handling |
|---|---|
| User accesses another event | Filter every event/photo query by `event_id` + membership check server-side, not just in the UI |
| Team Member tries to publish a gallery | Role check on the publish endpoint (`admin` only) |
| Failed photo upload | Catch Cloudinary upload errors, return clear error, don't create a partial DB record. For multi-upload: report per-file success/failure |
| Incorrect gallery PIN | Compare against `pin_hash`, rate-limit attempts (lock after N failed tries per slug) |
| Access to unpublished photos | Public gallery endpoint only returns photos where `is_published: true` and only via correct slug + PIN |
| Multiple file upload — partial failure | Upload files sequentially or in parallel; return a response listing each file's status (success/error). Successfully uploaded files are kept; failed files are reported with error reasons |

---

## 12. Suggested Build Order (2-week window: Sept 6 → Sept 20)

| Days | Focus |
|---|---|
| 1–3 | Project scaffolding (Vite + FastAPI), MongoDB connection, User model, JWT auth (register/login), role-based auth middleware |
| 4–6 | Event CRUD, team member assignment APIs, Cloudinary integration, single + multi-photo upload endpoint |
| 7–9 | Admin photo review/selection (single + bulk select), gallery publish + PIN generation/hashing, public gallery verify-pin endpoint |
| 10–12 | Frontend: Login, Dashboard, Event Detail, Photo Upload (with drag-and-drop + progress), Gallery Publish page, Public Gallery (PIN entry + photo grid) |
| 13–14 | Pytest coverage (auth, access control, PIN flow, multi-upload), deployment (Render + Vercel), README, final QA, demo credentials setup |

---

## 13. Deliverables Checklist

- [ ] Live application URL
- [ ] Source code repository (no committed secrets)
- [ ] Demo Admin credentials
- [ ] Demo Team Member credentials
- [ ] Demo Gallery URL + non-expiring numeric PIN
- [ ] README (overview, stack, architecture, DB design, setup, env vars, deployment, limitations)
- [ ] Basic tests: authentication, photo access control, gallery publishing workflow, PIN verification
- [ ] Submitted to talent@trizen-ai.com before Sept 20, 2026, 11:59 PM IST

---

## 14. Still Open

- **Deployment platform** — deferred; default assumption is Render (backend) + Vercel (frontend) unless you decide otherwise.
