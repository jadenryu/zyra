from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class AnalyticsConfiguration(Base):
    """User's default analytics configuration preferences"""
    __tablename__ = "analytics_configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # Configuration name (e.g., "Default", "Quick Analysis")
    is_default = Column(Boolean, default=False)
    
    # Analysis components to include
    show_dataset_overview = Column(Boolean, default=True)
    show_missing_analysis = Column(Boolean, default=True)
    show_correlation_analysis = Column(Boolean, default=True)
    show_statistical_summary = Column(Boolean, default=True)
    show_model_recommendations = Column(Boolean, default=True)
    show_preprocessing_recommendations = Column(Boolean, default=True)
    show_ai_insights = Column(Boolean, default=True)
    show_visualizations = Column(Boolean, default=True)
    
    # Specific visualization preferences
    include_correlation_heatmap = Column(Boolean, default=True)
    include_missing_values_chart = Column(Boolean, default=True)
    include_distribution_plots = Column(Boolean, default=True)
    include_outlier_detection = Column(Boolean, default=True)
    
    # Analysis depth preferences
    max_correlation_pairs = Column(Integer, default=10)
    max_model_recommendations = Column(Integer, default=5)
    include_advanced_stats = Column(Boolean, default=False)  # Skewness, kurtosis, etc.
    
    # Custom settings as JSON
    custom_settings = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="analytics_configurations")