from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class DatasetBase(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    name: str
    description: Optional[str] = None


class DatasetCreate(DatasetBase):
    project_id: int


class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DatasetInDB(DatasetBase):
    id: int
    project_id: int
    file_path: str
    file_name: str
    file_size: int
    file_type: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    data_schema: Optional[Dict[str, Any]] = None
    sample_data: Optional[Dict[str, Any]] = None
    statistics: Optional[Dict[str, Any]] = None
    is_processed: bool
    processing_status: str
    processing_error: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Dataset(DatasetInDB):
    pass


class DatasetUpload(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: int


class DatasetProcessingStatus(BaseModel):
    status: str
    progress: Optional[float] = None
    message: Optional[str] = None 