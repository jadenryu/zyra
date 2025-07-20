from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.post("/{dataset_id}/eda")
async def run_exploratory_data_analysis(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Run exploratory data analysis on a dataset"""
    # Verify dataset ownership
    result = await db.execute(
        """
        SELECT d.* FROM datasets d
        JOIN projects p ON d.project_id = p.id
        WHERE d.id = :dataset_id AND p.owner_id = :user_id
        """,
        {"dataset_id": dataset_id, "user_id": current_user.id}
    )
    dataset_data = result.fetchone()
    
    if not dataset_data:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    # Run EDA
    analytics_service = AnalyticsService()
    try:
        eda_results = await analytics_service.run_eda(dataset_data)
        return eda_results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run EDA: {str(e)}"
        )


@router.post("/{dataset_id}/clean")
async def clean_dataset(
    dataset_id: int,
    cleaning_config: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Clean a dataset based on configuration"""
    # Verify dataset ownership
    result = await db.execute(
        """
        SELECT d.* FROM datasets d
        JOIN projects p ON d.project_id = p.id
        WHERE d.id = :dataset_id AND p.owner_id = :user_id
        """,
        {"dataset_id": dataset_id, "user_id": current_user.id}
    )
    dataset_data = result.fetchone()
    
    if not dataset_data:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    # Run data cleaning
    analytics_service = AnalyticsService()
    try:
        cleaning_results = await analytics_service.clean_dataset(dataset_data, cleaning_config)
        return cleaning_results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clean dataset: {str(e)}"
        )


@router.get("/{dataset_id}/statistics")
async def get_dataset_statistics(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Get basic statistics for a dataset"""
    # Verify dataset ownership
    result = await db.execute(
        """
        SELECT d.* FROM datasets d
        JOIN projects p ON d.project_id = p.id
        WHERE d.id = :dataset_id AND p.owner_id = :user_id
        """,
        {"dataset_id": dataset_id, "user_id": current_user.id}
    )
    dataset_data = result.fetchone()
    
    if not dataset_data:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    # Get statistics
    analytics_service = AnalyticsService()
    try:
        statistics = await analytics_service.get_statistics(dataset_data)
        return statistics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )


@router.post("/{dataset_id}/feature-engineering")
async def run_feature_engineering(
    dataset_id: int,
    feature_config: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Run feature engineering on a dataset"""
    # Verify dataset ownership
    result = await db.execute(
        """
        SELECT d.* FROM datasets d
        JOIN projects p ON d.project_id = p.id
        WHERE d.id = :dataset_id AND p.owner_id = :user_id
        """,
        {"dataset_id": dataset_id, "user_id": current_user.id}
    )
    dataset_data = result.fetchone()
    
    if not dataset_data:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    # Run feature engineering
    analytics_service = AnalyticsService()
    try:
        feature_results = await analytics_service.run_feature_engineering(dataset_data, feature_config)
        return feature_results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run feature engineering: {str(e)}"
        ) 