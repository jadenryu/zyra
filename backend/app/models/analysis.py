from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    
    # Analysis type and configuration
    analysis_type = Column(String, nullable=False)  # eda, cleaning, feature_engineering, modeling
    configuration = Column(JSON, nullable=True)  # Analysis parameters
    
    # Results
    results = Column(JSON, nullable=True)  # Analysis results
    visualizations = Column(JSON, nullable=True)  # Chart configurations
    insights = Column(JSON, nullable=True)  # Generated insights
    
    # Status
    status = Column(String, default="pending")  # pending, running, completed, failed
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="analyses")
    dataset = relationship("Dataset", back_populates="analyses") 