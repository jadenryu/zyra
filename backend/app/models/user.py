from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Profile fields
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    organization = Column(String, nullable=True)
    role = Column(String, nullable=True)
    
    # Preferences
    default_cleaning_config = Column(Text, nullable=True)  # JSON string
    default_visualization_config = Column(Text, nullable=True)  # JSON string
    theme_preference = Column(String, default="light")
    language = Column(String, default="en") 