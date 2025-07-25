from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, ClassVar
from datetime import datetime


class AnalyticsConfigurationBase(BaseModel):
    """Base schema for analytics configuration"""
    name: str = Field(..., min_length=1, max_length=100)
    is_default: bool = False
    
    # Analysis components to include
    show_dataset_overview: bool = True
    show_missing_analysis: bool = True
    show_correlation_analysis: bool = True
    show_statistical_summary: bool = True
    show_model_recommendations: bool = True
    show_preprocessing_recommendations: bool = True
    show_ai_insights: bool = True
    show_visualizations: bool = True
    
    # Specific visualization preferences
    include_correlation_heatmap: bool = True
    include_missing_values_chart: bool = True
    include_distribution_plots: bool = True
    include_outlier_detection: bool = True
    
    # Analysis depth preferences
    max_correlation_pairs: int = Field(default=10, ge=1, le=50)
    max_model_recommendations: int = Field(default=5, ge=1, le=20)
    include_advanced_stats: bool = False
    
    # Custom settings
    custom_settings: Optional[Dict[str, Any]] = None


class AnalyticsConfigurationCreate(AnalyticsConfigurationBase):
    """Schema for creating a new analytics configuration"""
    pass


class AnalyticsConfigurationUpdate(BaseModel):
    """Schema for updating an analytics configuration"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_default: Optional[bool] = None
    
    # Analysis components (all optional for updates)
    show_dataset_overview: Optional[bool] = None
    show_missing_analysis: Optional[bool] = None
    show_correlation_analysis: Optional[bool] = None
    show_statistical_summary: Optional[bool] = None
    show_model_recommendations: Optional[bool] = None
    show_preprocessing_recommendations: Optional[bool] = None
    show_ai_insights: Optional[bool] = None
    show_visualizations: Optional[bool] = None
    
    # Visualization preferences
    include_correlation_heatmap: Optional[bool] = None
    include_missing_values_chart: Optional[bool] = None
    include_distribution_plots: Optional[bool] = None
    include_outlier_detection: Optional[bool] = None
    
    # Analysis depth preferences
    max_correlation_pairs: Optional[int] = Field(None, ge=1, le=50)
    max_model_recommendations: Optional[int] = Field(None, ge=1, le=20)
    include_advanced_stats: Optional[bool] = None
    
    # Custom settings
    custom_settings: Optional[Dict[str, Any]] = None


class AnalyticsConfigurationInDB(AnalyticsConfigurationBase):
    """Schema for analytics configuration as stored in database"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AnalyticsConfigurationResponse(AnalyticsConfigurationInDB):
    """Schema for analytics configuration API responses"""
    pass


class AnalyticsPresets:
    """Default analytics configuration presets"""
    
    QUICK = AnalyticsConfigurationBase(
        name="Quick Analysis",
        show_dataset_overview=True,
        show_missing_analysis=True,
        show_correlation_analysis=False,
        show_statistical_summary=True,
        show_model_recommendations=True,
        show_preprocessing_recommendations=False,
        show_ai_insights=True,
        show_visualizations=False,
        max_correlation_pairs=5,
        max_model_recommendations=3
    )
    
    COMPREHENSIVE = AnalyticsConfigurationBase(
        name="Comprehensive Analysis",
        show_dataset_overview=True,
        show_missing_analysis=True,
        show_correlation_analysis=True,
        show_statistical_summary=True,
        show_model_recommendations=True,
        show_preprocessing_recommendations=True,
        show_ai_insights=True,
        show_visualizations=True,
        include_advanced_stats=True,
        max_correlation_pairs=15,
        max_model_recommendations=8
    )
    
    MINIMAL = AnalyticsConfigurationBase(
        name="Minimal Analysis",
        show_dataset_overview=True,
        show_missing_analysis=False,
        show_correlation_analysis=False,
        show_statistical_summary=False,
        show_model_recommendations=True,
        show_preprocessing_recommendations=False,
        show_ai_insights=False,
        show_visualizations=False,
        max_correlation_pairs=3,
        max_model_recommendations=2
    )