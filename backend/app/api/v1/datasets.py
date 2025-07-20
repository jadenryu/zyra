import os
import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.core.deps import get_current_active_user
from app.core.config import settings
from app.models.user import User
from app.schemas.dataset import Dataset, DatasetCreate, DatasetUpdate, DatasetUpload, DatasetProcessingStatus
from app.services.supabase_service import SupabaseService

router = APIRouter()


@router.get("/", response_model=List[Dataset])
async def get_datasets(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
    project_id: int = None,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Get all datasets for current user"""
    query = """
        SELECT d.* FROM datasets d
        JOIN projects p ON d.project_id = p.id
        WHERE p.owner_id = :user_id
    """
    params = {"user_id": current_user.id}
    
    if project_id:
        query += " AND d.project_id = :project_id"
        params["project_id"] = project_id
    
    query += " ORDER BY d.created_at DESC LIMIT :limit OFFSET :skip"
    params.update({"limit": limit, "skip": skip})
    
    result = await db.execute(query, params)
    
    datasets = []
    for row in result.fetchall():
        dataset_data = dict(row)
        dataset = Dataset(**dataset_data)
        datasets.append(dataset)
    
    return datasets


@router.post("/upload", response_model=Dataset)
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_info: DatasetUpload = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Upload a new dataset"""
    # Validate file type
    allowed_types = ["csv", "xlsx", "xls", "json", "parquet"]
    file_extension = file.filename.split(".")[-1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Check file size (100MB limit)
    max_size = 100 * 1024 * 1024  # 100MB
    if file.size and file.size > max_size:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 100MB"
        )
    
    # Verify project ownership
    result = await db.execute(
        "SELECT id FROM projects WHERE id = :project_id AND owner_id = :user_id",
        {"project_id": dataset_info.project_id, "user_id": current_user.id}
    )
    if not result.fetchone():
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_path = f"datasets/{file_id}/{file.filename}"
    
    # Upload to Supabase Storage
    supabase_service = SupabaseService()
    try:
        file_content = await file.read()
        await supabase_service.upload_file(
            bucket=settings.supabase_storage_bucket,
            path=file_path,
            file_content=file_content
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )
    
    # Create dataset record
    result = await db.execute(
        """
        INSERT INTO datasets (name, description, project_id, file_path, file_name, file_size, file_type)
        VALUES (:name, :description, :project_id, :file_path, :file_name, :file_size, :file_type)
        RETURNING *
        """,
        {
            "name": dataset_info.name,
            "description": dataset_info.description,
            "project_id": dataset_info.project_id,
            "file_path": file_path,
            "file_name": file.filename,
            "file_size": file.size or 0,
            "file_type": file_extension,
        }
    )
    await db.commit()
    
    dataset_data = result.fetchone()
    return Dataset(**dict(dataset_data))


@router.get("/{dataset_id}", response_model=Dataset)
async def get_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Get a specific dataset"""
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
    
    return Dataset(**dict(dataset_data))


@router.put("/{dataset_id}", response_model=Dataset)
async def update_dataset(
    dataset_id: int,
    dataset_in: DatasetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Update a dataset"""
    # Check if dataset exists and user owns it
    result = await db.execute(
        """
        SELECT d.* FROM datasets d
        JOIN projects p ON d.project_id = p.id
        WHERE d.id = :dataset_id AND p.owner_id = :user_id
        """,
        {"dataset_id": dataset_id, "user_id": current_user.id}
    )
    if not result.fetchone():
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )
    
    # Build update query
    update_fields = []
    params = {"dataset_id": dataset_id}
    
    if dataset_in.name is not None:
        update_fields.append("name = :name")
        params["name"] = dataset_in.name
    
    if dataset_in.description is not None:
        update_fields.append("description = :description")
        params["description"] = dataset_in.description
    
    if not update_fields:
        raise HTTPException(
            status_code=400,
            detail="No fields to update"
        )
    
    # Execute update
    query = f"""
        UPDATE datasets 
        SET {', '.join(update_fields)}, updated_at = NOW()
        WHERE id = :dataset_id
        RETURNING *
    """
    
    result = await db.execute(query, params)
    await db.commit()
    
    dataset_data = result.fetchone()
    return Dataset(**dict(dataset_data))


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Delete a dataset"""
    # Check if dataset exists and user owns it
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
    
    # Delete from Supabase Storage
    supabase_service = SupabaseService()
    try:
        await supabase_service.delete_file(
            bucket=settings.supabase_storage_bucket,
            path=dataset_data.file_path
        )
    except Exception as e:
        # Log error but continue with database deletion
        print(f"Failed to delete file from storage: {str(e)}")
    
    # Delete from database
    await db.execute(
        "DELETE FROM datasets WHERE id = :dataset_id",
        {"dataset_id": dataset_id}
    )
    await db.commit()
    
    return {"message": "Dataset deleted successfully"}


@router.get("/{dataset_id}/status", response_model=DatasetProcessingStatus)
async def get_dataset_status(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Get dataset processing status"""
    result = await db.execute(
        """
        SELECT d.processing_status, d.processing_error FROM datasets d
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
    
    return DatasetProcessingStatus(
        status=dataset_data.processing_status,
        message=dataset_data.processing_error
    ) 