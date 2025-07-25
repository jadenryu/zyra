"""
Advanced Analytics Service with AI-powered insights using Pydantic AI
"""
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from typing import Dict, List, Any, Optional, Tuple
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.metrics import classification_report, mean_squared_error, r2_score
import plotly.graph_objects as go
import plotly.express as px
from pydantic_ai import Agent
from pydantic import BaseModel
import json
import warnings
warnings.filterwarnings('ignore')

# Pydantic models for structured responses
class DatasetSummary(BaseModel):
    """Structured summary of dataset analysis"""
    dataset_shape: Tuple[int, int]
    missing_values: Dict[str, int]
    data_types: Dict[str, str]
    numeric_columns: List[str]
    categorical_columns: List[str]
    potential_target_columns: List[str]
    data_quality_score: float
    recommendations: List[str]

class ModelRecommendation(BaseModel):
    """AI-powered model recommendations"""
    recommended_models: List[Dict[str, Any]]
    best_preprocessing: Dict[str, str]
    feature_engineering_suggestions: List[str]
    expected_performance: Dict[str, float]

class AIInsights(BaseModel):
    """AI-generated insights about the dataset"""
    summary: str
    key_findings: List[str]
    business_implications: List[str]
    next_steps: List[str]
    difficulty_assessment: str
    estimated_analysis_time: str

# Initialize Pydantic AI agent conditionally
analysis_agent = None

def get_analysis_agent():
    """Get AI agent if API key is available"""
    global analysis_agent
    if analysis_agent is None:
        try:
            import os
            # Check if OpenAI API key is available
            openai_key = os.getenv('OPENAI_API_KEY') or os.getenv('OPENROUTER_API_KEY')
            if openai_key:
                analysis_agent = Agent(
                    'openai:gpt-4o-mini',  # Using OpenAI model
                    system_prompt="""You are an expert data scientist assistant. Analyze datasets and provide actionable insights.
                    Focus on practical recommendations for preprocessing, modeling, and business value.
                    Be concise but comprehensive in your analysis."""
                )
            else:
                analysis_agent = False  # Mark as unavailable
        except Exception as e:
            # AI agent initialization failed - falling back to rule-based insights
            analysis_agent = False
    return analysis_agent if analysis_agent is not False else None

class AdvancedAnalyticsService:
    """Service for advanced dataset analysis with AI insights"""
    
    @staticmethod
    def analyze_dataset(df: pd.DataFrame, target_column: Optional[str] = None, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Comprehensive dataset analysis with AI insights
        """
        try:
            # Apply default configuration if none provided
            if config is None:
                config = AdvancedAnalyticsService._get_default_config()
            
            results = {}
            
            # Basic dataset information (always included)
            if config.get('show_dataset_overview', True):
                results['dataset_info'] = AdvancedAnalyticsService._get_basic_info(df)
            
            # Missing values analysis
            if config.get('show_missing_analysis', True):
                results['missing_analysis'] = AdvancedAnalyticsService._analyze_missing_values(df)
            
            # Data types and column analysis (always included for other analyses)
            results['column_analysis'] = AdvancedAnalyticsService._analyze_columns(df)
            
            # Statistical summary
            if config.get('show_statistical_summary', True):
                results['statistical_summary'] = AdvancedAnalyticsService._get_statistical_summary(df)
            
            # Correlation analysis
            if config.get('show_correlation_analysis', True):
                max_pairs = config.get('max_correlation_pairs', 10)
                results['correlation_data'] = AdvancedAnalyticsService._analyze_correlations(df, target_column, max_pairs)
            
            # Model recommendations
            if config.get('show_model_recommendations', True):
                max_models = config.get('max_model_recommendations', 5)
                results['model_recommendations'] = AdvancedAnalyticsService._recommend_models(df, target_column, max_models)
            
            # Preprocessing recommendations
            if config.get('show_preprocessing_recommendations', True):
                results['preprocessing_recommendations'] = AdvancedAnalyticsService._recommend_preprocessing(df)
            
            # Generate visualizations
            if config.get('show_visualizations', True):
                vis_config = {
                    'include_correlation_heatmap': config.get('include_correlation_heatmap', True),
                    'include_missing_values_chart': config.get('include_missing_values_chart', True),
                    'include_distribution_plots': config.get('include_distribution_plots', True),
                    'include_outlier_detection': config.get('include_outlier_detection', True)
                }
                results['visualizations'] = AdvancedAnalyticsService._generate_visualizations(df, target_column, vis_config)
            
            # AI-powered insights
            if config.get('show_ai_insights', True):
                results['ai_insights'] = AdvancedAnalyticsService._generate_ai_insights(df, target_column)
            
            return results
            
        except Exception as e:
            return {
                'error': f"Analysis failed: {str(e)}",
                'dataset_info': {},
                'missing_analysis': {},
                'column_analysis': {},
                'statistical_summary': {},
                'correlation_data': {},
                'model_recommendations': {},
                'preprocessing_recommendations': {},
                'visualizations': {},
                'ai_insights': {}
            }
    
    @staticmethod
    def _get_basic_info(df: pd.DataFrame) -> Dict[str, Any]:
        """Get basic dataset information"""
        return {
            'shape': df.shape,
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'memory_usage': df.memory_usage(deep=True).sum(),
            'duplicate_rows': df.duplicated().sum(),
            'total_missing_values': df.isnull().sum().sum()
        }
    
    @staticmethod
    def _analyze_missing_values(df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze missing values in detail"""
        missing_counts = df.isnull().sum()
        missing_percentages = (missing_counts / len(df)) * 100
        
        return {
            'missing_counts': missing_counts[missing_counts > 0].to_dict(),
            'missing_percentages': missing_percentages[missing_percentages > 0].to_dict(),
            'columns_with_missing': missing_counts[missing_counts > 0].index.tolist(),
            'complete_columns': missing_counts[missing_counts == 0].index.tolist(),
            'missing_data_patterns': AdvancedAnalyticsService._analyze_missing_patterns(df)
        }
    
    @staticmethod
    def _analyze_missing_patterns(df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze patterns in missing data"""
        if df.isnull().sum().sum() == 0:
            return {'patterns': [], 'recommendations': ['No missing data detected']}
        
        # Simple missing data pattern analysis
        missing_matrix = df.isnull()
        patterns = []
        
        # Check for columns that are always missing together
        for col1 in missing_matrix.columns:
            for col2 in missing_matrix.columns:
                if col1 != col2:
                    correlation = missing_matrix[col1].corr(missing_matrix[col2])
                    if correlation > 0.7:
                        patterns.append(f"{col1} and {col2} often missing together (correlation: {correlation:.2f})")
        
        recommendations = []
        high_missing_cols = (df.isnull().sum() / len(df) > 0.5)
        if high_missing_cols.any():
            recommendations.append(f"Consider dropping columns with >50% missing: {high_missing_cols[high_missing_cols].index.tolist()}")
        
        return {
            'patterns': patterns[:5],  # Limit to top 5 patterns
            'recommendations': recommendations
        }
    
    @staticmethod
    def _analyze_columns(df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze column types and characteristics"""
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_columns = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # Identify potential target columns
        potential_targets = []
        for col in df.columns:
            if df[col].dtype in ['object', 'category']:
                unique_count = df[col].nunique()
                if 2 <= unique_count <= 10:  # Good target candidates
                    potential_targets.append(col)
            elif df[col].dtype in [np.number]:
                if 'target' in col.lower() or 'label' in col.lower() or 'y' in col.lower():
                    potential_targets.append(col)
        
        return {
            'numeric_columns': numeric_columns,
            'categorical_columns': categorical_columns,
            'potential_target_columns': potential_targets,
            'high_cardinality_columns': [col for col in categorical_columns if df[col].nunique() > 50],
            'binary_columns': [col for col in df.columns if df[col].nunique() == 2],
            'constant_columns': [col for col in df.columns if df[col].nunique() == 1]
        }
    
    @staticmethod
    def _get_statistical_summary(df: pd.DataFrame) -> Dict[str, Any]:
        """Get comprehensive statistical summary"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            return {'summary': 'No numeric columns found'}
        
        summary_stats = numeric_df.describe()
        
        return {
            'basic_stats': summary_stats.to_dict(),
            'skewness': numeric_df.skew().to_dict(),
            'kurtosis': numeric_df.kurtosis().to_dict(),
            'outlier_counts': AdvancedAnalyticsService._detect_outliers(numeric_df)
        }
    
    @staticmethod
    def _detect_outliers(df: pd.DataFrame) -> Dict[str, int]:
        """Detect outliers using IQR method"""
        outlier_counts = {}
        for col in df.columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
            outlier_counts[col] = len(outliers)
        return outlier_counts
    
    @staticmethod
    def _analyze_correlations(df: pd.DataFrame, target_column: Optional[str] = None, max_pairs: int = 10) -> Dict[str, Any]:
        """Analyze correlations between features"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            return {'correlation_matrix': {}, 'target_correlations': {}}
        
        correlation_matrix = numeric_df.corr()
        
        # Target correlations if specified
        target_correlations = {}
        if target_column and target_column in numeric_df.columns:
            target_corr = correlation_matrix[target_column].abs().sort_values(ascending=False)
            target_correlations = target_corr.drop(target_column).to_dict()
        
        # High correlation pairs
        high_corr_pairs = []
        for i in range(len(correlation_matrix.columns)):
            for j in range(i+1, len(correlation_matrix.columns)):
                corr_val = correlation_matrix.iloc[i, j]
                if abs(corr_val) > 0.7:
                    high_corr_pairs.append({
                        'feature_1': correlation_matrix.columns[i],
                        'feature_2': correlation_matrix.columns[j],
                        'correlation': corr_val
                    })
        
        return {
            'correlation_matrix': correlation_matrix.to_dict(),
            'target_correlations': target_correlations,
            'high_correlation_pairs': high_corr_pairs[:max_pairs]  # Limited by config
        }
    
    @staticmethod
    def _recommend_models(df: pd.DataFrame, target_column: Optional[str] = None, max_models: int = 5) -> Dict[str, Any]:
        """Recommend suitable ML models based on data characteristics"""
        recommendations = []
        
        # Dataset size considerations
        n_samples, n_features = df.shape
        
        if target_column and target_column in df.columns:
            target_type = 'classification' if df[target_column].dtype in ['object', 'category'] else 'regression'
            unique_targets = df[target_column].nunique()
            
            if target_type == 'classification':
                if unique_targets == 2:
                    recommendations.extend([
                        {'model': 'Logistic Regression', 'reason': 'Binary classification, interpretable', 'priority': 'high'},
                        {'model': 'Random Forest', 'reason': 'Handles mixed data types well', 'priority': 'medium'},
                        {'model': 'XGBoost', 'reason': 'Often best performance', 'priority': 'high'}
                    ])
                else:
                    recommendations.extend([
                        {'model': 'Random Forest', 'reason': 'Multi-class classification', 'priority': 'high'},
                        {'model': 'XGBoost', 'reason': 'Excellent multi-class performance', 'priority': 'high'},
                        {'model': 'KNN', 'reason': 'Good for small datasets', 'priority': 'medium' if n_samples < 1000 else 'low'}
                    ])
            else:  # regression
                recommendations.extend([
                    {'model': 'Linear Regression', 'reason': 'Simple, interpretable baseline', 'priority': 'medium'},
                    {'model': 'Random Forest Regressor', 'reason': 'Handles non-linear relationships', 'priority': 'high'},
                    {'model': 'XGBoost Regressor', 'reason': 'Often best performance', 'priority': 'high'}
                ])
        else:
            # No target specified - suggest exploratory approaches
            recommendations.extend([
                {'model': 'Clustering (K-Means)', 'reason': 'Discover hidden patterns', 'priority': 'medium'},
                {'model': 'PCA', 'reason': 'Dimensionality reduction', 'priority': 'low'},
                {'model': 'Anomaly Detection', 'reason': 'Find outliers', 'priority': 'medium'}
            ])
        
        return {
            'recommended_models': recommendations[:max_models],  # Limited by config
            'dataset_characteristics': {
                'size': 'small' if n_samples < 1000 else 'medium' if n_samples < 10000 else 'large',
                'complexity': 'low' if n_features < 10 else 'medium' if n_features < 100 else 'high'
            }
        }
    
    @staticmethod
    def _recommend_preprocessing(df: pd.DataFrame) -> Dict[str, Any]:
        """Recommend preprocessing steps"""
        recommendations = []
        
        # Missing value handling
        missing_cols = df.isnull().sum()
        if missing_cols.any():
            recommendations.append({
                'step': 'Handle Missing Values',
                'method': 'Simple imputation for <10% missing, advanced imputation for >10%',
                'priority': 'high'
            })
        
        # Scaling recommendations
        numeric_df = df.select_dtypes(include=[np.number])
        if not numeric_df.empty:
            ranges = numeric_df.max() - numeric_df.min()
            if ranges.std() > ranges.mean():  # High variance in ranges
                recommendations.append({
                    'step': 'Feature Scaling',
                    'method': 'StandardScaler (normal distribution) or RobustScaler (outliers present)',
                    'priority': 'high'
                })
        
        # Categorical encoding
        cat_cols = df.select_dtypes(include=['object', 'category']).columns
        if len(cat_cols) > 0:
            high_card_cols = [col for col in cat_cols if df[col].nunique() > 10]
            if high_card_cols:
                recommendations.append({
                    'step': 'Categorical Encoding',
                    'method': f'Target encoding for high cardinality: {high_card_cols}',
                    'priority': 'medium'
                })
            
            low_card_cols = [col for col in cat_cols if df[col].nunique() <= 10]
            if low_card_cols:
                recommendations.append({
                    'step': 'Categorical Encoding',
                    'method': f'One-hot encoding for low cardinality: {low_card_cols}',
                    'priority': 'medium'
                })
        
        return {
            'preprocessing_steps': recommendations,
            'estimated_time': f"{len(recommendations) * 5} minutes"
        }
    
    @staticmethod
    def _generate_visualizations(df: pd.DataFrame, target_column: Optional[str] = None, vis_config: Optional[Dict[str, bool]] = None) -> Dict[str, str]:
        """Generate key visualizations as base64 encoded images"""
        if vis_config is None:
            vis_config = {
                'include_correlation_heatmap': True,
                'include_missing_values_chart': True,
                'include_distribution_plots': True,
                'include_outlier_detection': True
            }
        
        visualizations = {}
        
        try:
            # Correlation heatmap
            numeric_df = df.select_dtypes(include=[np.number])
            if not numeric_df.empty and len(numeric_df.columns) > 1:
                plt.figure(figsize=(10, 8))
                correlation_matrix = numeric_df.corr()
                sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0, fmt='.2f')
                plt.title('Feature Correlation Heatmap')
                plt.tight_layout()
                
                # Convert to base64
                img_buffer = io.BytesIO()
                plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
                img_buffer.seek(0)
                img_b64 = base64.b64encode(img_buffer.getvalue()).decode()
                visualizations['correlation_heatmap'] = f"data:image/png;base64,{img_b64}"
                plt.close()
            
            # Missing values visualization
            if df.isnull().sum().sum() > 0:
                missing_data = df.isnull().sum().sort_values(ascending=False)
                missing_data = missing_data[missing_data > 0]
                
                plt.figure(figsize=(10, 6))
                missing_data.plot(kind='bar')
                plt.title('Missing Values by Column')
                plt.xlabel('Columns')
                plt.ylabel('Missing Value Count')
                plt.xticks(rotation=45)
                plt.tight_layout()
                
                img_buffer = io.BytesIO()
                plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
                img_buffer.seek(0)
                img_b64 = base64.b64encode(img_buffer.getvalue()).decode()
                visualizations['missing_values'] = f"data:image/png;base64,{img_b64}"
                plt.close()
            
            # Distribution of numeric features
            if not numeric_df.empty:
                n_cols = min(4, len(numeric_df.columns))
                fig, axes = plt.subplots(2, 2, figsize=(12, 8))
                axes = axes.ravel()
                
                for i, col in enumerate(numeric_df.columns[:n_cols]):
                    numeric_df[col].hist(bins=30, ax=axes[i])
                    axes[i].set_title(f'Distribution of {col}')
                    axes[i].set_xlabel(col)
                    axes[i].set_ylabel('Frequency')
                
                # Hide unused subplots
                for i in range(n_cols, 4):
                    axes[i].set_visible(False)
                
                plt.tight_layout()
                
                img_buffer = io.BytesIO()
                plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
                img_buffer.seek(0)
                img_b64 = base64.b64encode(img_buffer.getvalue()).decode()
                visualizations['distributions'] = f"data:image/png;base64,{img_b64}"
                plt.close()
                
        except Exception as e:
            # Visualization generation failed - returning empty dict
            pass
        
        return visualizations
    
    @staticmethod
    def _generate_ai_insights(df: pd.DataFrame, target_column: Optional[str] = None) -> Dict[str, Any]:
        """Generate AI-powered insights about the dataset"""
        # Try to use AI agent if available, otherwise use rule-based insights
        agent = get_analysis_agent()
        
        if agent:
            try:
                # Prepare data summary for AI analysis
                data_summary = {
                    'shape': df.shape,
                    'columns': df.columns.tolist()[:20],  # Limit for token usage
                    'dtypes': df.dtypes.astype(str).to_dict(),
                    'missing_values': df.isnull().sum().to_dict(),
                    'target_column': target_column
                }
                
                # Generate AI insights (this would be implemented with the actual API call)
                # For now, fall back to rule-based analysis
                return AdvancedAnalyticsService._generate_rule_based_insights(df, target_column)
                
            except Exception as e:
                # AI insights generation failed - falling back to rule-based
                return AdvancedAnalyticsService._generate_rule_based_insights(df, target_column)
        else:
            return AdvancedAnalyticsService._generate_rule_based_insights(df, target_column)
    
    @staticmethod
    def _generate_rule_based_insights(df: pd.DataFrame, target_column: Optional[str] = None) -> Dict[str, Any]:
        """Generate rule-based insights about the dataset"""
        
        n_samples, n_features = df.shape
        missing_ratio = df.isnull().sum().sum() / (n_samples * n_features)
        numeric_ratio = len(df.select_dtypes(include=[np.number]).columns) / n_features
        
        # Generate insights based on data characteristics
        insights = {
            'summary': f"This dataset contains {n_samples:,} samples and {n_features} features. " +
                      f"{'It appears to be a well-structured dataset' if missing_ratio < 0.1 else 'There are some data quality issues to address'}.",
            'key_findings': [],
            'recommendations': [],
            'difficulty_assessment': 'beginner',
            'estimated_analysis_time': '30-60 minutes'
        }
        
        # Add specific findings
        if missing_ratio > 0.2:
            insights['key_findings'].append(f"High missing data rate ({missing_ratio*100:.1f}%) requires attention")
            insights['difficulty_assessment'] = 'intermediate'
        
        if numeric_ratio > 0.8:
            insights['key_findings'].append("Primarily numeric dataset - good for traditional ML approaches")
        elif numeric_ratio < 0.3:
            insights['key_findings'].append("Primarily categorical dataset - may need specialized encoding")
            insights['difficulty_assessment'] = 'intermediate'
        
        if n_features > 50:
            insights['key_findings'].append("High-dimensional dataset - consider dimensionality reduction")
            insights['estimated_analysis_time'] = '1-2 hours'
        
        # Add recommendations
        if target_column:
            insights['recommendations'].append(f"Start with exploratory analysis of '{target_column}' distribution")
        
        insights['recommendations'].extend([
            "Begin with data cleaning and missing value treatment",
            "Perform correlation analysis to identify key relationships",
            "Consider feature engineering based on domain knowledge"
        ])
        
        return insights
    
    @staticmethod
    def _get_default_config() -> Dict[str, Any]:
        """Get default analysis configuration"""
        return {
            'show_dataset_overview': True,
            'show_missing_analysis': True,
            'show_correlation_analysis': True,
            'show_statistical_summary': True,
            'show_model_recommendations': True,
            'show_preprocessing_recommendations': True,
            'show_ai_insights': True,
            'show_visualizations': True,
            'include_correlation_heatmap': True,
            'include_missing_values_chart': True,
            'include_distribution_plots': True,
            'include_outlier_detection': True,
            'max_correlation_pairs': 10,
            'max_model_recommendations': 5,
            'include_advanced_stats': False
        }