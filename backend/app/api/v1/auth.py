from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, Token

router = APIRouter()


@router.post("/register", response_model=UserSchema)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Register a new user"""
    # Check if user already exists
    result = await db.execute(
        "SELECT id FROM users WHERE email = :email", {"email": user_in.email}
    )
    if result.fetchone():
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_in.password)
    result = await db.execute(
        """
        INSERT INTO users (email, hashed_password, full_name, avatar_url, bio, organization, role)
        VALUES (:email, :hashed_password, :full_name, :avatar_url, :bio, :organization, :role)
        RETURNING *
        """,
        {
            "email": user_in.email,
            "hashed_password": hashed_password,
            "full_name": user_in.full_name,
            "avatar_url": user_in.avatar_url,
            "bio": user_in.bio,
            "organization": user_in.organization,
            "role": user_in.role,
        }
    )
    await db.commit()
    
    user_data = result.fetchone()
    return User(**dict(user_data))


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Login user and return access token"""
    # Get user by email
    result = await db.execute(
        "SELECT * FROM users WHERE email = :email", {"email": form_data.username}
    )
    user_data = result.fetchone()
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = User(**dict(user_data))
    
    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get current user information"""
    return current_user 