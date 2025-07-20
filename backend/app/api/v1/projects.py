from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.project import Project, ProjectCreate, ProjectUpdate, ProjectWithStats

router = APIRouter()


@router.get("/", response_model=List[ProjectWithStats])
async def get_projects(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Get all projects for current user"""
    result = await db.execute(
        """
        SELECT p.*, 
               COUNT(DISTINCT d.id) as dataset_count,
               COUNT(DISTINCT a.id) as analysis_count,
               COUNT(DISTINCT m.id) as model_count
        FROM projects p
        LEFT JOIN datasets d ON p.id = d.project_id
        LEFT JOIN analyses a ON p.id = a.project_id
        LEFT JOIN ml_models m ON p.id = m.project_id
        WHERE p.owner_id = :user_id
        GROUP BY p.id
        ORDER BY p.updated_at DESC
        LIMIT :limit OFFSET :skip
        """,
        {"user_id": current_user.id, "limit": limit, "skip": skip}
    )
    
    projects = []
    for row in result.fetchall():
        project_data = dict(row)
        project = ProjectWithStats(**project_data)
        projects.append(project)
    
    return projects


@router.post("/", response_model=Project)
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Create a new project"""
    result = await db.execute(
        """
        INSERT INTO projects (name, description, owner_id, is_public, default_cleaning_config, default_visualization_config, tags)
        VALUES (:name, :description, :owner_id, :is_public, :default_cleaning_config, :default_visualization_config, :tags)
        RETURNING *
        """,
        {
            "name": project_in.name,
            "description": project_in.description,
            "owner_id": current_user.id,
            "is_public": project_in.is_public,
            "default_cleaning_config": project_in.default_cleaning_config,
            "default_visualization_config": project_in.default_visualization_config,
            "tags": str(project_in.tags) if project_in.tags else None,
        }
    )
    await db.commit()
    
    project_data = result.fetchone()
    return Project(**dict(project_data))


@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Get a specific project"""
    result = await db.execute(
        "SELECT * FROM projects WHERE id = :project_id AND owner_id = :user_id",
        {"project_id": project_id, "user_id": current_user.id}
    )
    project_data = result.fetchone()
    
    if not project_data:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )
    
    return Project(**dict(project_data))


@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Update a project"""
    # Check if project exists and user owns it
    result = await db.execute(
        "SELECT * FROM projects WHERE id = :project_id AND owner_id = :user_id",
        {"project_id": project_id, "user_id": current_user.id}
    )
    if not result.fetchone():
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )
    
    # Build update query
    update_fields = []
    params = {"project_id": project_id}
    
    if project_in.name is not None:
        update_fields.append("name = :name")
        params["name"] = project_in.name
    
    if project_in.description is not None:
        update_fields.append("description = :description")
        params["description"] = project_in.description
    
    if project_in.is_public is not None:
        update_fields.append("is_public = :is_public")
        params["is_public"] = project_in.is_public
    
    if project_in.default_cleaning_config is not None:
        update_fields.append("default_cleaning_config = :default_cleaning_config")
        params["default_cleaning_config"] = project_in.default_cleaning_config
    
    if project_in.default_visualization_config is not None:
        update_fields.append("default_visualization_config = :default_visualization_config")
        params["default_visualization_config"] = project_in.default_visualization_config
    
    if project_in.tags is not None:
        update_fields.append("tags = :tags")
        params["tags"] = str(project_in.tags)
    
    if not update_fields:
        raise HTTPException(
            status_code=400,
            detail="No fields to update"
        )
    
    # Execute update
    query = f"""
        UPDATE projects 
        SET {', '.join(update_fields)}, updated_at = NOW()
        WHERE id = :project_id
        RETURNING *
    """
    
    result = await db.execute(query, params)
    await db.commit()
    
    project_data = result.fetchone()
    return Project(**dict(project_data))


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Any:
    """Delete a project"""
    # Check if project exists and user owns it
    result = await db.execute(
        "SELECT id FROM projects WHERE id = :project_id AND owner_id = :user_id",
        {"project_id": project_id, "user_id": current_user.id}
    )
    if not result.fetchone():
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )
    
    # Delete project (cascade will handle related data)
    await db.execute(
        "DELETE FROM projects WHERE id = :project_id",
        {"project_id": project_id}
    )
    await db.commit()
    
    return {"message": "Project deleted successfully"} 