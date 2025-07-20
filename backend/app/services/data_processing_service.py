import pandas as pd
import numpy as np
import pickle
import json
import uuid
from typing import Dict, Any, List, Tuple, Optional
from scipy import stats
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder, OneHotEncoder
from sklearn.feature_selection import SelectKBest, f_classif, f_regression, chi2
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.impute import SimpleImputer, KNNImputer
from app.services.supabase_service import SupabaseService
from app.core.config import settings


class DataProcessingService:
    def __init__(self):
        self.supabase_service = SupabaseService()
    
    async def detect_outliers(self, dataset_data: Any, method: str = "iqr") -> Dict[str, Any]:
        """Detect outliers using various methods"""
        # Download and load dataset
        df = await self._load_dataset(dataset_data)
        
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        outliers_info = {}
        
        for col in numerical_cols:
            if method == "iqr":
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
                
            elif method == "zscore":
                z_scores = np.abs(stats.zscore(df[col].dropna()))
                outliers = df[z_scores > 3]
                
            elif method == "isolation_forest":
                iso_forest = IsolationForest(contamination=0.1, random_state=42)
                outlier_labels = iso_forest.fit_predict(df[[col]].dropna())
                outliers = df[outlier_labels == -1]
            
            outliers_info[col] = {
                "count": len(outliers),
                "percentage": (len(outliers) / len(df)) * 100,
                "indices": outliers.index.tolist(),
                "values": outliers[col].tolist()
            }
        
        return {
            "method": method,
            "outliers_by_column": outliers_info,
            "total_outliers": sum([info["count"] for info in outliers_info.values()]),
            "recommendations": self._get_outlier_recommendations(outliers_info)
        }
    
    async def suggest_feature_engineering(self, dataset_data: Any, target_column: Optional[str] = None) -> Dict[str, Any]:
        """Suggest feature engineering techniques based on data analysis"""
        df = await self._load_dataset(dataset_data)
        
        suggestions = {
            "encoding_suggestions": [],
            "scaling_suggestions": [],
            "feature_creation_suggestions": [],
            "feature_selection_suggestions": [],
            "missing_value_suggestions": [],
            "transformation_suggestions": []
        }
        
        # Analyze categorical columns for encoding
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        for col in categorical_cols:
            unique_count = df[col].nunique()
            missing_ratio = df[col].isnull().sum() / len(df)
            
            if unique_count <= 5:
                suggestions["encoding_suggestions"].append({
                    "column": col,
                    "method": "one_hot_encoding",
                    "reason": f"Low cardinality ({unique_count} unique values)",
                    "priority": "high"
                })
            elif unique_count <= 20:
                suggestions["encoding_suggestions"].append({
                    "column": col,
                    "method": "label_encoding",
                    "reason": f"Medium cardinality ({unique_count} unique values)",
                    "priority": "medium"
                })
            else:
                suggestions["encoding_suggestions"].append({
                    "column": col,
                    "method": "target_encoding",
                    "reason": f"High cardinality ({unique_count} unique values)",
                    "priority": "high"
                })
        
        # Analyze numerical columns for scaling
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            if col == target_column:
                continue
                
            col_std = df[col].std()
            col_mean = df[col].mean()
            col_range = df[col].max() - df[col].min()
            
            if col_range > 1000:
                suggestions["scaling_suggestions"].append({
                    "column": col,
                    "method": "standard_scaler",
                    "reason": f"Large range ({col_range:.2f})",
                    "priority": "high"
                })
            elif abs(col_mean) > 100:
                suggestions["scaling_suggestions"].append({
                    "column": col,
                    "method": "robust_scaler",
                    "reason": f"Large mean value ({col_mean:.2f})",
                    "priority": "medium"
                })
        
        # Suggest feature creation
        if len(numerical_cols) >= 2:
            # Suggest polynomial features
            suggestions["feature_creation_suggestions"].append({
                "type": "polynomial_features",
                "columns": list(numerical_cols[:5]),  # Limit to first 5 to avoid explosion
                "reason": "Create polynomial combinations for non-linear relationships",
                "priority": "medium"
            })
            
            # Suggest interaction features
            suggestions["feature_creation_suggestions"].append({
                "type": "interaction_features",
                "columns": list(numerical_cols[:3]),
                "reason": "Capture feature interactions",
                "priority": "medium"
            })
        
        # Suggest date/time feature extraction
        date_cols = df.select_dtypes(include=['datetime64']).columns
        for col in date_cols:
            suggestions["feature_creation_suggestions"].append({
                "type": "datetime_features",
                "column": col,
                "features": ["year", "month", "day", "dayofweek", "quarter"],
                "reason": "Extract temporal patterns",
                "priority": "high"
            })
        
        # Suggest feature selection if target is provided
        if target_column and target_column in df.columns:
            suggestions["feature_selection_suggestions"].append({
                "method": "correlation_filter",
                "threshold": 0.95,
                "reason": "Remove highly correlated features",
                "priority": "high"
            })
            
            suggestions["feature_selection_suggestions"].append({
                "method": "univariate_selection",
                "k": min(20, len(df.columns) - 1),
                "reason": "Select top features based on statistical tests",
                "priority": "medium"
            })
        
        # Analyze missing values
        missing_info = df.isnull().sum()
        for col, missing_count in missing_info.items():
            if missing_count > 0:
                missing_ratio = missing_count / len(df)
                
                if missing_ratio < 0.05:
                    suggestions["missing_value_suggestions"].append({
                        "column": col,
                        "method": "drop_rows",
                        "reason": f"Low missing ratio ({missing_ratio:.1%})",
                        "priority": "high"
                    })
                elif missing_ratio < 0.30:
                    if df[col].dtype in ['int64', 'float64']:
                        suggestions["missing_value_suggestions"].append({
                            "column": col,
                            "method": "median_imputation",
                            "reason": f"Moderate missing ratio ({missing_ratio:.1%}) for numerical data",
                            "priority": "medium"
                        })
                    else:
                        suggestions["missing_value_suggestions"].append({
                            "column": col,
                            "method": "mode_imputation",
                            "reason": f"Moderate missing ratio ({missing_ratio:.1%}) for categorical data",
                            "priority": "medium"
                        })
                else:
                    suggestions["missing_value_suggestions"].append({
                        "column": col,
                        "method": "drop_column",
                        "reason": f"High missing ratio ({missing_ratio:.1%})",
                        "priority": "high"
                    })
        
        # Suggest transformations for skewed data
        for col in numerical_cols:
            if col == target_column:
                continue
                
            skewness = stats.skew(df[col].dropna())
            if abs(skewness) > 1:
                if skewness > 0:
                    suggestions["transformation_suggestions"].append({
                        "column": col,
                        "method": "log_transform",
                        "reason": f"Right-skewed data (skewness: {skewness:.2f})",
                        "priority": "medium"
                    })
                else:
                    suggestions["transformation_suggestions"].append({
                        "column": col,
                        "method": "square_transform",
                        "reason": f"Left-skewed data (skewness: {skewness:.2f})",
                        "priority": "medium"
                    })
        
        return suggestions
    
    async def apply_transformations(self, dataset_data: Any, transformations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Apply a list of transformations to the dataset"""
        df = await self._load_dataset(dataset_data)
        original_shape = df.shape
        
        transformation_log = []
        
        for transformation in transformations:
            try:
                transform_type = transformation["type"]
                
                if transform_type == "remove_outliers":
                    df, log_entry = await self._remove_outliers(df, transformation)
                elif transform_type == "handle_missing_values":
                    df, log_entry = await self._handle_missing_values(df, transformation)
                elif transform_type == "encode_categorical":
                    df, log_entry = await self._encode_categorical(df, transformation)
                elif transform_type == "scale_features":
                    df, log_entry = await self._scale_features(df, transformation)
                elif transform_type == "create_features":
                    df, log_entry = await self._create_features(df, transformation)
                elif transform_type == "select_features":
                    df, log_entry = await self._select_features(df, transformation)
                elif transform_type == "transform_skewed":
                    df, log_entry = await self._transform_skewed(df, transformation)
                else:
                    log_entry = {
                        "transformation": transform_type,
                        "status": "skipped",
                        "reason": "Unknown transformation type"
                    }
                
                transformation_log.append(log_entry)
                
            except Exception as e:
                transformation_log.append({
                    "transformation": transformation.get("type", "unknown"),
                    "status": "failed",
                    "error": str(e)
                })
        
        # Save transformed dataset
        transformed_file_path = f"transformed_datasets/{uuid.uuid4()}.csv"
        transformed_content = df.to_csv(index=False)
        
        await self.supabase_service.upload_file(
            bucket=settings.supabase_storage_bucket,
            path=transformed_file_path,
            file_content=transformed_content.encode()
        )
        
        return {
            "original_shape": original_shape,
            "final_shape": df.shape,
            "transformation_log": transformation_log,
            "transformed_file_path": transformed_file_path,
            "data_quality_score": self._calculate_data_quality_score(df)
        }
    
    async def export_pipeline(self, dataset_data: Any, transformations: List[Dict[str, Any]], format: str = "python") -> str:
        """Export the data processing pipeline as code"""
        if format == "python":
            return self._generate_python_pipeline(transformations)
        elif format == "notebook":
            return self._generate_notebook_pipeline(transformations)
        elif format == "sql":
            return self._generate_sql_pipeline(transformations)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    async def detect_schema_drift(self, original_dataset: Any, new_dataset: Any) -> Dict[str, Any]:
        """Detect schema drift between two datasets"""
        df_original = await self._load_dataset(original_dataset)
        df_new = await self._load_dataset(new_dataset)
        
        drift_report = {
            "column_changes": {
                "added": [],
                "removed": [],
                "type_changes": []
            },
            "statistical_drift": {},
            "data_quality_changes": {},
            "overall_drift_score": 0.0
        }
        
        # Check column changes
        original_cols = set(df_original.columns)
        new_cols = set(df_new.columns)
        
        drift_report["column_changes"]["added"] = list(new_cols - original_cols)
        drift_report["column_changes"]["removed"] = list(original_cols - new_cols)
        
        # Check data type changes
        common_cols = original_cols.intersection(new_cols)
        for col in common_cols:
            if df_original[col].dtype != df_new[col].dtype:
                drift_report["column_changes"]["type_changes"].append({
                    "column": col,
                    "original_type": str(df_original[col].dtype),
                    "new_type": str(df_new[col].dtype)
                })
        
        # Statistical drift detection
        for col in common_cols:
            if df_original[col].dtype in ['int64', 'float64'] and df_new[col].dtype in ['int64', 'float64']:
                # KS test for numerical columns
                ks_stat, p_value = stats.ks_2samp(df_original[col].dropna(), df_new[col].dropna())
                drift_report["statistical_drift"][col] = {
                    "test": "kolmogorov_smirnov",
                    "statistic": float(ks_stat),
                    "p_value": float(p_value),
                    "drift_detected": p_value < 0.05
                }
            else:
                # Chi-square test for categorical columns
                try:
                    orig_counts = df_original[col].value_counts()
                    new_counts = df_new[col].value_counts()
                    
                    # Align the categories
                    all_categories = set(orig_counts.index).union(set(new_counts.index))
                    orig_aligned = [orig_counts.get(cat, 0) for cat in all_categories]
                    new_aligned = [new_counts.get(cat, 0) for cat in all_categories]
                    
                    chi2_stat, p_value = stats.chisquare(new_aligned, orig_aligned)
                    drift_report["statistical_drift"][col] = {
                        "test": "chi_square",
                        "statistic": float(chi2_stat),
                        "p_value": float(p_value),
                        "drift_detected": p_value < 0.05
                    }
                except:
                    drift_report["statistical_drift"][col] = {
                        "test": "chi_square",
                        "error": "Unable to perform test"
                    }
        
        # Calculate overall drift score
        drift_scores = []
        for col_drift in drift_report["statistical_drift"].values():
            if "p_value" in col_drift:
                drift_scores.append(1 - col_drift["p_value"])
        
        if drift_scores:
            drift_report["overall_drift_score"] = np.mean(drift_scores)
        
        return drift_report
    
    # Helper methods
    async def _load_dataset(self, dataset_data: Any) -> pd.DataFrame:
        """Load dataset from storage"""
        file_content = await self.supabase_service.download_file(
            bucket=settings.supabase_storage_bucket,
            path=dataset_data.file_path
        )
        
        if dataset_data.file_type == "csv":
            return pd.read_csv(file_content)
        elif dataset_data.file_type in ["xlsx", "xls"]:
            return pd.read_excel(file_content)
        elif dataset_data.file_type == "json":
            return pd.read_json(file_content)
        elif dataset_data.file_type == "parquet":
            return pd.read_parquet(file_content)
        else:
            raise ValueError(f"Unsupported file type: {dataset_data.file_type}")
    
    def _get_outlier_recommendations(self, outliers_info: Dict) -> List[str]:
        """Generate recommendations for handling outliers"""
        recommendations = []
        
        for col, info in outliers_info.items():
            percentage = info["percentage"]
            if percentage > 10:
                recommendations.append(f"Consider investigating {col} - {percentage:.1f}% outliers detected")
            elif percentage > 5:
                recommendations.append(f"Review {col} outliers - {percentage:.1f}% of data")
            elif percentage > 0:
                recommendations.append(f"Minor outliers in {col} - {percentage:.1f}% of data")
        
        return recommendations
    
    async def _remove_outliers(self, df: pd.DataFrame, config: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Remove outliers based on configuration"""
        method = config.get("method", "iqr")
        columns = config.get("columns", df.select_dtypes(include=[np.number]).columns)
        
        initial_rows = len(df)
        
        for col in columns:
            if method == "iqr":
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
        
        return df, {
            "transformation": "remove_outliers",
            "status": "completed",
            "rows_removed": initial_rows - len(df),
            "method": method
        }
    
    async def _handle_missing_values(self, df: pd.DataFrame, config: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Handle missing values based on configuration"""
        strategy = config.get("strategy", "median")
        columns = config.get("columns", df.columns)
        
        initial_missing = df.isnull().sum().sum()
        
        if strategy == "drop":
            df = df.dropna(subset=columns)
        elif strategy == "median":
            for col in columns:
                if df[col].dtype in ['int64', 'float64']:
                    df[col] = df[col].fillna(df[col].median())
        elif strategy == "mean":
            for col in columns:
                if df[col].dtype in ['int64', 'float64']:
                    df[col] = df[col].fillna(df[col].mean())
        elif strategy == "mode":
            for col in columns:
                mode_val = df[col].mode()[0] if len(df[col].mode()) > 0 else "Unknown"
                df[col] = df[col].fillna(mode_val)
        
        final_missing = df.isnull().sum().sum()
        
        return df, {
            "transformation": "handle_missing_values",
            "status": "completed",
            "missing_values_handled": initial_missing - final_missing,
            "strategy": strategy
        }
    
    async def _encode_categorical(self, df: pd.DataFrame, config: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Encode categorical variables"""
        method = config.get("method", "label")
        columns = config.get("columns", df.select_dtypes(include=['object']).columns)
        
        encoded_columns = []
        
        for col in columns:
            if method == "label":
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                encoded_columns.append(col)
            elif method == "onehot":
                dummies = pd.get_dummies(df[col], prefix=col)
                df = pd.concat([df, dummies], axis=1)
                df = df.drop(columns=[col])
                encoded_columns.extend(dummies.columns.tolist())
        
        return df, {
            "transformation": "encode_categorical",
            "status": "completed",
            "method": method,
            "encoded_columns": encoded_columns
        }
    
    async def _scale_features(self, df: pd.DataFrame, config: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Scale numerical features"""
        method = config.get("method", "standard")
        columns = config.get("columns", df.select_dtypes(include=[np.number]).columns)
        
        if method == "standard":
            scaler = StandardScaler()
        elif method == "minmax":
            scaler = MinMaxScaler()
        elif method == "robust":
            scaler = RobustScaler()
        
        df[columns] = scaler.fit_transform(df[columns])
        
        return df, {
            "transformation": "scale_features",
            "status": "completed",
            "method": method,
            "scaled_columns": list(columns)
        }
    
    async def _create_features(self, df: pd.DataFrame, config: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Create new features"""
        feature_type = config.get("feature_type", "polynomial")
        columns = config.get("columns", df.select_dtypes(include=[np.number]).columns[:3])
        
        new_features = []
        
        if feature_type == "polynomial":
            for col in columns:
                df[f"{col}_squared"] = df[col] ** 2
                new_features.append(f"{col}_squared")
        elif feature_type == "interaction":
            for i, col1 in enumerate(columns):
                for col2 in columns[i+1:]:
                    df[f"{col1}_{col2}_interaction"] = df[col1] * df[col2]
                    new_features.append(f"{col1}_{col2}_interaction")
        
        return df, {
            "transformation": "create_features",
            "status": "completed",
            "feature_type": feature_type,
            "new_features": new_features
        }
    
    async def _select_features(self, df: pd.DataFrame, config: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Select best features"""
        method = config.get("method", "correlation")
        target_column = config.get("target_column")
        
        removed_features = []
        
        if method == "correlation" and target_column:
            # Remove highly correlated features
            corr_matrix = df.corr().abs()
            upper_triangle = corr_matrix.where(
                np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
            )
            
            to_drop = [column for column in upper_triangle.columns if any(upper_triangle[column] > 0.95)]
            df = df.drop(columns=to_drop)
            removed_features = to_drop
        
        return df, {
            "transformation": "select_features",
            "status": "completed",
            "method": method,
            "removed_features": removed_features
        }
    
    async def _transform_skewed(self, df: pd.DataFrame, config: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Transform skewed features"""
        method = config.get("method", "log")
        columns = config.get("columns", [])
        
        transformed_columns = []
        
        for col in columns:
            if method == "log":
                # Add small constant to handle zeros
                df[col] = np.log1p(df[col] - df[col].min() + 1)
                transformed_columns.append(col)
            elif method == "sqrt":
                df[col] = np.sqrt(df[col] - df[col].min() + 1)
                transformed_columns.append(col)
        
        return df, {
            "transformation": "transform_skewed",
            "status": "completed",
            "method": method,
            "transformed_columns": transformed_columns
        }
    
    def _calculate_data_quality_score(self, df: pd.DataFrame) -> float:
        """Calculate a data quality score"""
        score = 100.0
        
        # Deduct for missing values
        missing_ratio = df.isnull().sum().sum() / (len(df) * len(df.columns))
        score -= missing_ratio * 30
        
        # Deduct for duplicates
        duplicate_ratio = df.duplicated().sum() / len(df)
        score -= duplicate_ratio * 20
        
        # Deduct for constant columns
        constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
        score -= (len(constant_cols) / len(df.columns)) * 15
        
        return max(0.0, score)
    
    def _generate_python_pipeline(self, transformations: List[Dict]) -> str:
        """Generate Python code for the pipeline"""
        code = """import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from scipy import stats

def process_data(df):
    \"\"\"
    Data processing pipeline generated by Zyra
    \"\"\"
    
"""
        
        for transform in transformations:
            transform_type = transform.get("type", "")
            
            if transform_type == "handle_missing_values":
                strategy = transform.get("strategy", "median")
                code += f"""    # Handle missing values using {strategy} strategy
    if '{strategy}' == 'median':
        for col in df.select_dtypes(include=[np.number]).columns:
            df[col] = df[col].fillna(df[col].median())
    elif '{strategy}' == 'mode':
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].fillna(df[col].mode()[0] if len(df[col].mode()) > 0 else 'Unknown')
    
"""
            
            elif transform_type == "encode_categorical":
                method = transform.get("method", "label")
                code += f"""    # Encode categorical variables using {method} encoding
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
    
"""
            
            elif transform_type == "scale_features":
                method = transform.get("method", "standard")
                scaler_class = {
                    "standard": "StandardScaler",
                    "minmax": "MinMaxScaler", 
                    "robust": "RobustScaler"
                }.get(method, "StandardScaler")
                
                code += f"""    # Scale numerical features using {method} scaling
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    scaler = {scaler_class}()
    df[numerical_cols] = scaler.fit_transform(df[numerical_cols])
    
"""
        
        code += """    return df

# Usage:
# processed_df = process_data(your_dataframe)
"""
        
        return code
    
    def _generate_notebook_pipeline(self, transformations: List[Dict]) -> str:
        """Generate Jupyter notebook for the pipeline"""
        notebook = {
            "cells": [
                {
                    "cell_type": "markdown",
                    "source": "# Data Processing Pipeline Generated by Zyra\\n\\nThis notebook contains the complete data processing pipeline."
                },
                {
                    "cell_type": "code",
                    "source": "import pandas as pd\\nimport numpy as np\\nfrom sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder\\nfrom sklearn.impute import SimpleImputer\\nfrom scipy import stats\\nimport matplotlib.pyplot as plt\\nimport seaborn as sns"
                }
            ]
        }
        
        # Add cells for each transformation
        for i, transform in enumerate(transformations):
            transform_type = transform.get("type", "")
            
            notebook["cells"].append({
                "cell_type": "markdown",
                "source": f"## Step {i+1}: {transform_type.replace('_', ' ').title()}"
            })
            
            if transform_type == "handle_missing_values":
                notebook["cells"].append({
                    "cell_type": "code",
                    "source": f"# Handle missing values\\nstrategy = '{transform.get('strategy', 'median')}'\\n# Add your implementation here"
                })
        
        return json.dumps(notebook, indent=2)
    
    def _generate_sql_pipeline(self, transformations: List[Dict]) -> str:
        """Generate SQL queries for the pipeline"""
        sql = "-- Data Processing Pipeline Generated by Zyra\\n\\n"
        
        sql += "-- Create a view with processed data\\n"
        sql += "CREATE VIEW processed_data AS\\n"
        sql += "SELECT\\n"
        
        # Add basic transformations that can be done in SQL
        for transform in transformations:
            transform_type = transform.get("type", "")
            
            if transform_type == "handle_missing_values":
                strategy = transform.get("strategy", "median")
                if strategy == "median":
                    sql += "    -- Handle missing values with median\\n"
                    sql += "    COALESCE(column_name, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY column_name)) as column_name,\\n"
        
        sql += "FROM your_table_name;\\n\\n"
        sql += "-- Note: Some transformations require additional processing outside of SQL"
        
        return sql 