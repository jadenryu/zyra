from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class ProjectBase(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    name: str
    description: Optional[str] = None
    is_public: bool = False
    default_cleaning_config: Optional[str] = None
    default_visualization_config: Optional[str] = None
    tags: Optional[List[str]] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    default_cleaning_config: Optional[str] = None
    default_visualization_config: Optional[str] = None
    tags: Optional[List[str]] = None


class ProjectInDB(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Project(ProjectInDB):
    pass


class ProjectWithStats(Project):
    dataset_count: int = 0
    analysis_count: int = 0
    model_count: int = 0 