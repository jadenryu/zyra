"""
Analytics Configuration API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_sync_db
from app.models.analytics_config import AnalyticsConfiguration
from app.models.user import User
from app.schemas.analytics_config import (
    AnalyticsConfigurationCreate,
    AnalyticsConfigurationUpdate,
    AnalyticsConfigurationResponse,
    AnalyticsPresets
)
from app.core.deps import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[AnalyticsConfigurationResponse])
async def get_user_analytics_configurations(
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all analytics configurations for the current user"""
    configurations = db.query(AnalyticsConfiguration).filter(
        AnalyticsConfiguration.user_id == current_user.id
    ).all()
    return configurations


@router.get("/default", response_model=Optional[AnalyticsConfigurationResponse])
async def get_default_analytics_configuration(
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get the user's default analytics configuration"""
    config = db.query(AnalyticsConfiguration).filter(
        AnalyticsConfiguration.user_id == current_user.id,
        AnalyticsConfiguration.is_default == True
    ).first()
    return config


@router.post("/", response_model=AnalyticsConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_analytics_configuration(
    config_data: AnalyticsConfigurationCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new analytics configuration"""
    
    # If this is being set as default, unset other defaults
    if config_data.is_default:
        db.query(AnalyticsConfiguration).filter(
            AnalyticsConfiguration.user_id == current_user.id,
            AnalyticsConfiguration.is_default == True
        ).update({"is_default": False})
    
    # Check if user already has a configuration with this name
    existing = db.query(AnalyticsConfiguration).filter(
        AnalyticsConfiguration.user_id == current_user.id,
        AnalyticsConfiguration.name == config_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuration with this name already exists"
        )
    
    # Create new configuration
    db_config = AnalyticsConfiguration(
        user_id=current_user.id,
        **config_data.dict()
    )
    
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    
    return db_config


@router.get("/{config_id}", response_model=AnalyticsConfigurationResponse)
async def get_analytics_configuration(
    config_id: int,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific analytics configuration"""
    config = db.query(AnalyticsConfiguration).filter(
        AnalyticsConfiguration.id == config_id,
        AnalyticsConfiguration.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analytics configuration not found"
        )
    
    return config


@router.put("/{config_id}", response_model=AnalyticsConfigurationResponse)
async def update_analytics_configuration(
    config_id: int,
    config_update: AnalyticsConfigurationUpdate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an analytics configuration"""
    config = db.query(AnalyticsConfiguration).filter(
        AnalyticsConfiguration.id == config_id,
        AnalyticsConfiguration.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analytics configuration not found"
        )
    
    # If updating to default, unset other defaults
    if config_update.is_default:
        db.query(AnalyticsConfiguration).filter(
            AnalyticsConfiguration.user_id == current_user.id,
            AnalyticsConfiguration.is_default == True,
            AnalyticsConfiguration.id != config_id
        ).update({"is_default": False})
    
    # Check for name conflicts
    if config_update.name and config_update.name != config.name:
        existing = db.query(AnalyticsConfiguration).filter(
            AnalyticsConfiguration.user_id == current_user.id,
            AnalyticsConfiguration.name == config_update.name,
            AnalyticsConfiguration.id != config_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Configuration with this name already exists"
            )
    
    # Update configuration
    update_data = config_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    
    return config


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analytics_configuration(
    config_id: int,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an analytics configuration"""
    config = db.query(AnalyticsConfiguration).filter(
        AnalyticsConfiguration.id == config_id,
        AnalyticsConfiguration.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analytics configuration not found"
        )
    
    db.delete(config)
    db.commit()


@router.post("/{config_id}/set-default", response_model=AnalyticsConfigurationResponse)
async def set_default_analytics_configuration(
    config_id: int,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_active_user)
):
    """Set a configuration as the default"""
    config = db.query(AnalyticsConfiguration).filter(
        AnalyticsConfiguration.id == config_id,
        AnalyticsConfiguration.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analytics configuration not found"
        )
    
    # Unset other defaults
    db.query(AnalyticsConfiguration).filter(
        AnalyticsConfiguration.user_id == current_user.id,
        AnalyticsConfiguration.is_default == True
    ).update({"is_default": False})
    
    # Set this as default
    config.is_default = True
    db.commit()
    db.refresh(config)
    
    return config


@router.post("/presets/{preset_name}", response_model=AnalyticsConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_preset_configuration(
    preset_name: str,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a configuration from a predefined preset"""
    
    presets = {
        "quick": AnalyticsPresets.QUICK,
        "comprehensive": AnalyticsPresets.COMPREHENSIVE,
        "minimal": AnalyticsPresets.MINIMAL
    }
    
    if preset_name.lower() not in presets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown preset: {preset_name}. Available: {list(presets.keys())}"
        )
    
    preset_config = presets[preset_name.lower()]
    
    # Check if user already has a configuration with this name
    existing = db.query(AnalyticsConfiguration).filter(
        AnalyticsConfiguration.user_id == current_user.id,
        AnalyticsConfiguration.name == preset_config.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have a configuration named '{preset_config.name}'"
        )
    
    # Create configuration from preset
    db_config = AnalyticsConfiguration(
        user_id=current_user.id,
        **preset_config.dict()
    )
    
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    
    return db_config