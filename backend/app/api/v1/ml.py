from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.services.ml_service import MLService

router = APIRouter()


@router.post("/{dataset_id}/train")
async def train_model(
    dataset_id: int,
    model_config: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Train a machine learning model"""
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
    
    # Train model
    ml_service = MLService()
    try:
        training_results = await ml_service.train_model(dataset_data, model_config)
        return training_results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to train model: {str(e)}"
        )


@router.get("/models", response_model=List[Dict[str, Any]])
async def get_models(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
    project_id: int = None
) -> Any:
    """Get all models for current user"""
    query = """
        SELECT m.* FROM ml_models m
        JOIN projects p ON m.project_id = p.id
        WHERE p.owner_id = :user_id
    """
    params = {"user_id": current_user.id}
    
    if project_id:
        query += " AND m.project_id = :project_id"
        params["project_id"] = project_id
    
    query += " ORDER BY m.created_at DESC"
    
    result = await db.execute(query, params)
    
    models = []
    for row in result.fetchall():
        model_data = dict(row)
        models.append(model_data)
    
    return models


@router.get("/models/{model_id}")
async def get_model(
    model_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Get a specific model"""
    result = await db.execute(
        """
        SELECT m.* FROM ml_models m
        JOIN projects p ON m.project_id = p.id
        WHERE m.id = :model_id AND p.owner_id = :user_id
        """,
        {"model_id": model_id, "user_id": current_user.id}
    )
    model_data = result.fetchone()
    
    if not model_data:
        raise HTTPException(
            status_code=404,
            detail="Model not found"
        )
    
    return dict(model_data)


@router.post("/models/{model_id}/predict")
async def predict(
    model_id: int,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Make predictions using a trained model"""
    # Verify model ownership
    result = await db.execute(
        """
        SELECT m.* FROM ml_models m
        JOIN projects p ON m.project_id = p.id
        WHERE m.id = :model_id AND p.owner_id = :user_id
        """,
        {"model_id": model_id, "user_id": current_user.id}
    )
    model_data = result.fetchone()
    
    if not model_data:
        raise HTTPException(
            status_code=404,
            detail="Model not found"
        )
    
    # Make prediction
    ml_service = MLService()
    try:
        prediction = await ml_service.predict(model_data, data)
        return {"prediction": prediction}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to make prediction: {str(e)}"
        )


@router.delete("/models/{model_id}")
async def delete_model(
    model_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Delete a model"""
    # Verify model ownership
    result = await db.execute(
        """
        SELECT m.* FROM ml_models m
        JOIN projects p ON m.project_id = p.id
        WHERE m.id = :model_id AND p.owner_id = :user_id
        """,
        {"model_id": model_id, "user_id": current_user.id}
    )
    model_data = result.fetchone()
    
    if not model_data:
        raise HTTPException(
            status_code=404,
            detail="Model not found"
        )
    
    # Delete model files from storage
    ml_service = MLService()
    try:
        await ml_service.delete_model_files(model_data)
    except Exception as e:
        # Failed to delete model files - continuing with database deletion
        pass
    
    # Delete from database
    await db.execute(
        "DELETE FROM ml_models WHERE id = :model_id",
        {"model_id": model_id}
    )
    await db.commit()
    
    return {"message": "Model deleted successfully"}


@router.post("/ai-insights")
async def get_ai_insights(
    data_summary: str,
    question: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get AI insights about data"""
    ml_service = MLService()
    try:
        insight = await ml_service.get_ai_insights(data_summary, question)
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get AI insights: {str(e)}"
        ) 