"""
Advanced Analytics API endpoints with AI-powered analysis
"""
from typing import Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import pandas as pd
import io
from app.core.database import get_async_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.services.advanced_analytics import AdvancedAnalyticsService
from app.models.analytics_config import AnalyticsConfiguration
import json

router = APIRouter()


async def get_user_analytics_config(user_id: int, db) -> Dict[str, Any]:
    """Get user's default analytics configuration or return default"""
    # Try to get user's default configuration
    result = await db.execute(
        text("SELECT * FROM analytics_configurations WHERE user_id = :user_id AND is_default = true LIMIT 1"),
        {"user_id": user_id}
    )
    config_row = result.fetchone()
    
    if config_row:
        # Convert database row to dict and return relevant config fields
        return {
            'show_dataset_overview': config_row.show_dataset_overview,
            'show_missing_analysis': config_row.show_missing_analysis,
            'show_correlation_analysis': config_row.show_correlation_analysis,
            'show_statistical_summary': config_row.show_statistical_summary,
            'show_model_recommendations': config_row.show_model_recommendations,
            'show_preprocessing_recommendations': config_row.show_preprocessing_recommendations,
            'show_ai_insights': config_row.show_ai_insights,
            'show_visualizations': config_row.show_visualizations,
            'include_correlation_heatmap': config_row.include_correlation_heatmap,
            'include_missing_values_chart': config_row.include_missing_values_chart,
            'include_distribution_plots': config_row.include_distribution_plots,
            'include_outlier_detection': config_row.include_outlier_detection,
            'max_correlation_pairs': config_row.max_correlation_pairs,
            'max_model_recommendations': config_row.max_model_recommendations,
            'include_advanced_stats': config_row.include_advanced_stats
        }
    else:
        # Return default configuration
        return AdvancedAnalyticsService._get_default_config()

@router.post("/analyze-dataset")
async def analyze_uploaded_dataset(
    file: UploadFile = File(...),
    target_column: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Upload and analyze a dataset with comprehensive AI-powered insights
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Read the uploaded file
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validate dataset size
        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded file is empty")
        
        if len(df) > 100000:  # Limit for performance
            df = df.sample(n=100000, random_state=42)
        
        # Get user's analytics configuration
        config = await get_user_analytics_config(current_user.id, db)
        
        # Perform comprehensive analysis
        analysis_result = AdvancedAnalyticsService.analyze_dataset(df, target_column, config)
        
        # Store analysis in database for future reference
        try:
            await db.execute(
                text("""
                    INSERT INTO analyses (name, description, project_id, dataset_id, analysis_type, configuration, results, status, created_at)
                    VALUES (:name, :description, NULL, NULL, :analysis_type, :configuration, :results, :status, NOW())
                """),
                {
                    "name": f"Advanced Analysis - {file.filename}",
                    "description": f"AI-powered analysis of {file.filename}",
                    "analysis_type": "advanced_analytics",
                    "configuration": json.dumps({"target_column": target_column}),
                    "results": json.dumps(analysis_result),
                    "status": "completed"
                }
            )
            await db.commit()
        except Exception as db_error:
            # Database storage failed - continuing without storing
            pass
        
        return {
            "status": "success",
            "filename": file.filename,
            "dataset_shape": analysis_result['dataset_info']['shape'],
            "analysis": analysis_result
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The uploaded file is empty or corrupted")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Unable to parse the uploaded file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/analyze-existing-dataset/{dataset_id}")
async def analyze_existing_dataset(
    dataset_id: int,
    target_column: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Analyze an existing dataset from the database
    """
    try:
        # Get dataset information
        result = await db.execute(
            text("SELECT * FROM datasets WHERE id = :dataset_id AND project_id IN (SELECT id FROM projects WHERE owner_id = :user_id)"),
            {"dataset_id": dataset_id, "user_id": current_user.id}
        )
        dataset_info = result.fetchone()
        
        if not dataset_info:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Load dataset from file path
        try:
            if dataset_info.file_path.endswith('.csv'):
                df = pd.read_csv(dataset_info.file_path)
            else:
                df = pd.read_excel(dataset_info.file_path)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Dataset file not found on disk")
        
        # Get user's analytics configuration
        config = await get_user_analytics_config(current_user.id, db)
        
        # Perform analysis
        analysis_result = AdvancedAnalyticsService.analyze_dataset(df, target_column, config)
        
        # Store analysis results
        try:
            await db.execute(
                text("""
                    INSERT INTO analyses (name, description, project_id, dataset_id, analysis_type, configuration, results, status, created_at)
                    VALUES (:name, :description, :project_id, :dataset_id, :analysis_type, :configuration, :results, :status, NOW())
                """),
                {
                    "name": f"Advanced Analysis - {dataset_info.name}",
                    "description": f"AI-powered analysis of {dataset_info.name}",
                    "project_id": dataset_info.project_id,
                    "dataset_id": dataset_id,
                    "analysis_type": "advanced_analytics",
                    "configuration": json.dumps({"target_column": target_column}),
                    "results": json.dumps(analysis_result),
                    "status": "completed"
                }
            )
            await db.commit()
        except Exception as db_error:
            # Database storage failed
            pass
        
        return {
            "status": "success",
            "dataset_name": dataset_info.name,
            "dataset_shape": analysis_result['dataset_info']['shape'],
            "analysis": analysis_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/user-analyses")
async def get_user_analyses(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
    limit: int = 20
):
    """
    Get user's analysis history
    """
    try:
        result = await db.execute(
            text("""
                SELECT a.*, d.name as dataset_name, p.name as project_name
                FROM analyses a
                LEFT JOIN datasets d ON a.dataset_id = d.id
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.analysis_type = 'advanced_analytics' 
                AND (p.owner_id = :user_id OR a.project_id IS NULL)
                ORDER BY a.created_at DESC
                LIMIT :limit
            """),
            {"user_id": current_user.id, "limit": limit}
        )
        
        analyses = []
        for row in result.fetchall():
            analysis_dict = {
                'id': row.id,
                'name': row.name,
                'description': row.description,
                'dataset_name': row.dataset_name,
                'project_name': row.project_name,
                'status': row.status,
                'created_at': row.created_at,
                'results_summary': json.loads(row.results or '{}').get('dataset_info', {})
            }
            analyses.append(analysis_dict)
        
        return {
            "status": "success",
            "analyses": analyses
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analyses: {str(e)}")

@router.get("/analysis-details/{analysis_id}")
async def get_analysis_details(
    analysis_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get detailed results of a specific analysis
    """
    try:
        result = await db.execute(
            text("""
                SELECT a.*, d.name as dataset_name, p.name as project_name
                FROM analyses a
                LEFT JOIN datasets d ON a.dataset_id = d.id
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.id = :analysis_id 
                AND a.analysis_type = 'advanced_analytics'
                AND (p.owner_id = :user_id OR a.project_id IS NULL)
            """),
            {"analysis_id": analysis_id, "user_id": current_user.id}
        )
        
        analysis = result.fetchone()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        return {
            "status": "success",
            "analysis": {
                'id': analysis.id,
                'name': analysis.name,
                'description': analysis.description,
                'dataset_name': analysis.dataset_name,
                'project_name': analysis.project_name,
                'status': analysis.status,
                'created_at': analysis.created_at,
                'configuration': json.loads(analysis.configuration or '{}'),
                'results': json.loads(analysis.results or '{}')
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analysis details: {str(e)}")

@router.get("/dataset-summary/{dataset_id}")
async def get_dataset_summary(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get a quick summary of an existing dataset
    """
    try:
        # Get dataset information
        result = await db.execute(
            text("SELECT * FROM datasets WHERE id = :dataset_id AND project_id IN (SELECT id FROM projects WHERE owner_id = :user_id)"),
            {"dataset_id": dataset_id, "user_id": current_user.id}
        )
        dataset_info = result.fetchone()
        
        if not dataset_info:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Quick analysis without storing
        try:
            if dataset_info.file_path.endswith('.csv'):
                df = pd.read_csv(dataset_info.file_path)
            else:
                df = pd.read_excel(dataset_info.file_path)
            
            # Basic summary only
            summary = {
                'shape': df.shape,
                'columns': df.columns.tolist()[:10],  # Limit columns shown
                'dtypes': df.dtypes.astype(str).to_dict(),
                'missing_values': df.isnull().sum().to_dict(),
                'numeric_columns': df.select_dtypes(include=['number']).columns.tolist(),
                'categorical_columns': df.select_dtypes(include=['object', 'category']).columns.tolist()
            }
            
            return {
                "status": "success",
                "dataset_name": dataset_info.name,
                "summary": summary
            }
            
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Dataset file not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dataset summary: {str(e)}")