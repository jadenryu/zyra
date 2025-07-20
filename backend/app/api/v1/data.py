from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.services.data_processing_service import DataProcessingService
from app.services.advanced_analytics_service import AdvancedAnalyticsService
from app.services.visualization_service import VisualizationService
from pydantic import BaseModel

router = APIRouter()

# Request/Response models
class OutlierDetectionRequest(BaseModel):
    method: str = "iqr"  # iqr, zscore, isolation_forest

class FeatureEngineeringRequest(BaseModel):
    target_column: Optional[str] = None

class TransformationRequest(BaseModel):
    transformations: List[Dict[str, Any]]

class PipelineExportRequest(BaseModel):
    transformations: List[Dict[str, Any]]
    format: str = "python"  # python, notebook, sql

class StatisticalTestRequest(BaseModel):
    test_type: str  # ttest, chisquare, anova, correlation, normality, mann_whitney
    columns: List[str]
    alpha: float = 0.05
    config: Dict[str, Any] = {}

class ABTestRequest(BaseModel):
    control_conversions: int
    control_visitors: int
    treatment_conversions: int
    treatment_visitors: int
    alpha: float = 0.05
    power: float = 0.8

class TimeSeriesRequest(BaseModel):
    time_column: str
    value_column: str
    frequency: Optional[str] = None

class VisualizationRequest(BaseModel):
    chart_type: str  # histogram, scatter, box, correlation, bar, line, pie
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    color_column: Optional[str] = None
    size_column: Optional[str] = None
    group_by: Optional[str] = None
    bins: int = 30
    top_n: int = 20
    title: Optional[str] = None

class ReportRequest(BaseModel):
    include_plots: bool = True
    target_column: Optional[str] = None


@router.post("/datasets/{dataset_id}/detect-outliers")
async def detect_outliers(
    dataset_id: int,
    request: OutlierDetectionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """Detect outliers in the dataset using various methods"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize service
    data_service = DataProcessingService()
    
    try:
        result = await data_service.detect_outliers(dataset, request.method)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/feature-suggestions")
async def suggest_feature_engineering(
    dataset_id: int,
    request: FeatureEngineeringRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """Get feature engineering suggestions based on data analysis"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize service
    data_service = DataProcessingService()
    
    try:
        result = await data_service.suggest_feature_engineering(dataset, request.target_column)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/transform")
async def apply_transformations(
    dataset_id: int,
    request: TransformationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """Apply a series of transformations to the dataset"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize service
    data_service = DataProcessingService()
    
    try:
        result = await data_service.apply_transformations(dataset, request.transformations)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/export-pipeline")
async def export_pipeline(
    dataset_id: int,
    request: PipelineExportRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, str]:
    """Export the data processing pipeline as code"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize service
    data_service = DataProcessingService()
    
    try:
        pipeline_code = await data_service.export_pipeline(dataset, request.transformations, request.format)
        return {"pipeline_code": pipeline_code, "format": request.format}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/schema-drift")
async def detect_schema_drift(
    dataset_id: int,
    comparison_dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """Detect schema drift between two datasets"""
    # Get datasets
    original_dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    new_dataset = await _get_user_dataset(db, comparison_dataset_id, current_user.id)
    
    # Initialize service
    data_service = DataProcessingService()
    
    try:
        result = await data_service.detect_schema_drift(original_dataset, new_dataset)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/statistical-tests")
async def run_statistical_test(
    request: StatisticalTestRequest,
    dataset_id: int = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """Run various statistical tests on the dataset"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize service
    analytics_service = AdvancedAnalyticsService()
    
    try:
        result = await analytics_service.run_statistical_test(dataset, {
            "test_type": request.test_type,
            "columns": request.columns,
            "alpha": request.alpha,
            **request.config
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ab-test-calculator")
async def calculate_ab_test(
    request: ABTestRequest,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Calculate A/B test statistics and power analysis"""
    # Initialize service
    analytics_service = AdvancedAnalyticsService()
    
    try:
        result = await analytics_service.calculate_ab_test({
            "control_conversions": request.control_conversions,
            "control_visitors": request.control_visitors,
            "treatment_conversions": request.treatment_conversions,
            "treatment_visitors": request.treatment_visitors,
            "alpha": request.alpha,
            "power": request.power
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/timeseries-decomposition")
async def run_time_series_decomposition(
    dataset_id: int,
    request: TimeSeriesRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """Perform time series decomposition"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize service
    analytics_service = AdvancedAnalyticsService()
    
    try:
        result = await analytics_service.run_time_series_decomposition(
            dataset, request.time_column, request.value_column, request.frequency
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/comprehensive-report")
async def generate_comprehensive_report(
    dataset_id: int,
    request: ReportRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """Generate a comprehensive EDA report"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize service
    analytics_service = AdvancedAnalyticsService()
    
    try:
        result = await analytics_service.generate_comprehensive_report(dataset, {
            "include_plots": request.include_plots,
            "target_column": request.target_column
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/visualize")
async def create_visualization(
    dataset_id: int,
    request: VisualizationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """Create various types of visualizations"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize service
    viz_service = VisualizationService()
    
    try:
        if request.chart_type == "histogram":
            if not request.x_column:
                raise HTTPException(status_code=400, detail="x_column required for histogram")
            result = await viz_service.generate_histogram(
                dataset, request.x_column, request.bins, request.title
            )
        
        elif request.chart_type == "scatter":
            if not request.x_column or not request.y_column:
                raise HTTPException(status_code=400, detail="x_column and y_column required for scatter plot")
            result = await viz_service.generate_scatter_plot(
                dataset, request.x_column, request.y_column, 
                request.color_column, request.size_column, request.title
            )
        
        elif request.chart_type == "box":
            if not request.x_column:
                raise HTTPException(status_code=400, detail="x_column required for box plot")
            result = await viz_service.generate_box_plot(
                dataset, request.x_column, request.group_by, request.title
            )
        
        elif request.chart_type == "correlation":
            result = await viz_service.generate_correlation_heatmap(
                dataset, None, "pearson", request.title
            )
        
        elif request.chart_type == "bar":
            if not request.x_column:
                raise HTTPException(status_code=400, detail="x_column required for bar chart")
            result = await viz_service.generate_bar_chart(
                dataset, request.x_column, request.y_column, request.top_n, request.title
            )
        
        elif request.chart_type == "line":
            if not request.x_column or not request.y_column:
                raise HTTPException(status_code=400, detail="x_column and y_column required for line chart")
            result = await viz_service.generate_line_chart(
                dataset, request.x_column, request.y_column, request.group_by, request.title
            )
        
        elif request.chart_type == "pie":
            if not request.x_column:
                raise HTTPException(status_code=400, detail="x_column required for pie chart")
            result = await viz_service.generate_pie_chart(
                dataset, request.x_column, request.top_n, request.title
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported chart type: {request.chart_type}")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_id}/dashboard")
async def generate_dashboard(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """Generate a comprehensive dashboard for the dataset"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize service
    viz_service = VisualizationService()
    
    try:
        result = await viz_service.generate_dashboard(dataset)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/export-report")
async def export_report(
    dataset_id: int,
    format: str = Query("html", regex="^(html|pdf)$"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, str]:
    """Export comprehensive analysis report"""
    # Get dataset
    dataset = await _get_user_dataset(db, dataset_id, current_user.id)
    
    # Initialize services
    analytics_service = AdvancedAnalyticsService()
    viz_service = VisualizationService()
    
    try:
        # Generate comprehensive analysis
        analyses = []
        
        # Add EDA report
        eda_report = await analytics_service.generate_comprehensive_report(dataset)
        analyses.append({
            "title": "Exploratory Data Analysis",
            "content": eda_report,
            "plot_html": eda_report.get("visualizations", {}).get("distributions", "")
        })
        
        # Add correlation analysis
        corr_viz = await viz_service.generate_correlation_heatmap(dataset)
        analyses.append({
            "title": "Correlation Analysis",
            "plot_html": corr_viz["plot_html"]
        })
        
        # Export report
        report_content = await viz_service.export_report(dataset, analyses, format)
        
        return {"report_content": report_content, "format": format}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Helper function
async def _get_user_dataset(db: AsyncSession, dataset_id: int, user_id: int):
    """Get dataset and verify user ownership"""
    result = await db.execute(
        """
        SELECT d.* FROM datasets d
        JOIN projects p ON d.project_id = p.id
        WHERE d.id = :dataset_id AND p.owner_id = :user_id
        """,
        {"dataset_id": dataset_id, "user_id": user_id}
    )
    dataset_data = result.fetchone()
    
    if not dataset_data:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return dataset_data 