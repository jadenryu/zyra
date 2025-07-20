from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class MLModel(Base):
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Model configuration
    model_type = Column(String, nullable=False)  # classification, regression, clustering
    algorithm = Column(String, nullable=False)  # random_forest, xgboost, etc.
    hyperparameters = Column(JSON, nullable=True)
    feature_columns = Column(JSON, nullable=True)  # List of feature column names
    target_column = Column(String, nullable=True)
    
    # Model performance
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    mse = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    
    # Model files
    model_path = Column(String, nullable=True)  # Path to saved model
    scaler_path = Column(String, nullable=True)  # Path to saved scaler
    encoder_path = Column(String, nullable=True)  # Path to saved encoders
    
    # Status
    status = Column(String, default="training")  # training, trained, deployed, archived
    training_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="models") 