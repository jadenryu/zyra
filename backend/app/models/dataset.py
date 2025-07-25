from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    file_path = Column(String, nullable=False)  # Path in Supabase Storage
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    file_type = Column(String, nullable=False)  # csv, excel, json, parquet
    
    # Dataset metadata
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    data_schema = Column(JSON, nullable=True)  # Column types and info
    sample_data = Column(JSON, nullable=True)  # First few rows
    statistics = Column(JSON, nullable=True)  # Basic stats
    
    # Processing status
    is_processed = Column(Boolean, default=False)
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    processing_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="datasets")
    analyses = relationship("Analysis", back_populates="dataset", cascade="all, delete-orphan")
    cleaning_jobs = relationship("DataCleaningJob", back_populates="dataset", cascade="all, delete-orphan") 