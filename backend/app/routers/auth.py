import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.middleware.auth_middleware import get_current_user, require_admin
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate, db = Depends(get_db)):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    total_users = await db.users.count_documents({})
    assigned_role = data.role
    if total_users == 0:
        assigned_role = "admin"

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    new_user = {
        "_id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "role": assigned_role,
        "created_at": now
    }
    await db.users.insert_one(new_user)

    token = create_access_token({"sub": user_id, "role": assigned_role, "email": data.email.lower()})
    user_response = UserResponse(
        id=user_id,
        _id=user_id,
        name=new_user["name"],
        email=new_user["email"],
        role=new_user["role"],
        created_at=new_user["created_at"]
    )

    return TokenResponse(access_token=token, user=user_response)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db = Depends(get_db)):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": user["_id"], "role": user["role"], "email": user["email"]})
    user_response = UserResponse(
        id=user["_id"],
        _id=user["_id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        _id=current_user["_id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )

@router.get("/team-members", response_model=list[UserResponse])
async def list_team_members(current_user: dict = Depends(require_admin), db = Depends(get_db)):
    cursor = db.users.find({"role": "team_member"})
    members = []
    async for doc in cursor:
        members.append(UserResponse(
            id=doc["_id"],
            _id=doc["_id"],
            name=doc["name"],
            email=doc["email"],
            role=doc["role"],
            created_at=doc["created_at"]
        ))
    return members
