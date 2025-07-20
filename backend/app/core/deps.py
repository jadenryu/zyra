from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from app.core.database import get_async_db, get_sync_db
from app.core.security import verify_token
from app.models.user import User
from app.schemas.user import TokenData

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(credentials.credentials)
    if email is None:
        raise credentials_exception
    
    # Get user from database
    result = await db.execute(
        "SELECT * FROM users WHERE email = :email", {"email": email}
    )
    user = result.fetchone()
    
    if user is None:
        raise credentials_exception
    
    return User(**dict(user))


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_user_sync(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_sync_db)
) -> User:
    """Get current authenticated user (sync version)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(credentials.credentials)
    if email is None:
        raise credentials_exception
    
    # Get user from database
    result = db.execute(
        "SELECT * FROM users WHERE email = :email", {"email": email}
    )
    user = result.fetchone()
    
    if user is None:
        raise credentials_exception
    
    return User(**dict(user))


def get_current_active_user_sync(
    current_user: User = Depends(get_current_user_sync),
) -> User:
    """Get current active user (sync version)"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user 