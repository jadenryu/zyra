from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class DataCleaningJob(Base):
    __tablename__ = "data_cleaning_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    
    # Cleaning configuration
    cleaning_config = Column(JSON, nullable=False)  # Cleaning rules and parameters
    applied_filters = Column(JSON, nullable=True)  # Applied cleaning operations
    
    # Results
    original_row_count = Column(Integer, nullable=True)
    cleaned_row_count = Column(Integer, nullable=True)
    removed_duplicates = Column(Integer, nullable=True)
    filled_missing_values = Column(Integer, nullable=True)
    outliers_removed = Column(Integer, nullable=True)
    
    # Output
    cleaned_file_path = Column(String, nullable=True)  # Path to cleaned dataset
    cleaning_report = Column(JSON, nullable=True)  # Detailed cleaning report
    
    # Status
    status = Column(String, default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    dataset = relationship("Dataset", back_populates="cleaning_jobs") 