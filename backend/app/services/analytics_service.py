import pandas as pd
import numpy as np
from typing import Dict, Any, List
import json
from app.services.supabase_service import SupabaseService
from app.core.config import settings


class AnalyticsService:
    def __init__(self):
        self.supabase_service = SupabaseService()
    
    async def run_eda(self, dataset_data: Any) -> Dict[str, Any]:
        """Run exploratory data analysis on a dataset"""
        # Download dataset
        file_content = await self.supabase_service.download_file(
            bucket=settings.supabase_storage_bucket,
            path=dataset_data.file_path
        )
        
        # Load data based on file type
        if dataset_data.file_type == "csv":
            df = pd.read_csv(file_content)
        elif dataset_data.file_type in ["xlsx", "xls"]:
            df = pd.read_excel(file_content)
        elif dataset_data.file_type == "json":
            df = pd.read_json(file_content)
        elif dataset_data.file_type == "parquet":
            df = pd.read_parquet(file_content)
        else:
            raise ValueError(f"Unsupported file type: {dataset_data.file_type}")
        
        # Basic statistics
        basic_stats = {
            "shape": df.shape,
            "columns": list(df.columns),
            "dtypes": df.dtypes.to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "duplicates": df.duplicated().sum(),
        }
        
        # Numerical columns statistics
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        numerical_stats = {}
        for col in numerical_cols:
            numerical_stats[col] = {
                "mean": float(df[col].mean()),
                "median": float(df[col].median()),
                "std": float(df[col].std()),
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "q25": float(df[col].quantile(0.25)),
                "q75": float(df[col].quantile(0.75)),
            }
        
        # Categorical columns statistics
        categorical_cols = df.select_dtypes(include=['object']).columns
        categorical_stats = {}
        for col in categorical_cols:
            value_counts = df[col].value_counts()
            categorical_stats[col] = {
                "unique_count": int(value_counts.nunique()),
                "top_values": value_counts.head(5).to_dict(),
                "missing_count": int(df[col].isnull().sum()),
            }
        
        # Correlation matrix (for numerical columns)
        correlation_matrix = {}
        if len(numerical_cols) > 1:
            corr_matrix = df[numerical_cols].corr()
            correlation_matrix = corr_matrix.to_dict()
        
        return {
            "basic_stats": basic_stats,
            "numerical_stats": numerical_stats,
            "categorical_stats": categorical_stats,
            "correlation_matrix": correlation_matrix,
            "sample_data": df.head(10).to_dict(orient='records'),
        }
    
    async def clean_dataset(self, dataset_data: Any, cleaning_config: Dict[str, Any]) -> Dict[str, Any]:
        """Clean a dataset based on configuration"""
        # Download dataset
        file_content = await self.supabase_service.download_file(
            bucket=settings.supabase_storage_bucket,
            path=dataset_data.file_path
        )
        
        # Load data
        if dataset_data.file_type == "csv":
            df = pd.read_csv(file_content)
        elif dataset_data.file_type in ["xlsx", "xls"]:
            df = pd.read_excel(file_content)
        elif dataset_data.file_type == "json":
            df = pd.read_json(file_content)
        elif dataset_data.file_type == "parquet":
            df = pd.read_parquet(file_content)
        else:
            raise ValueError(f"Unsupported file type: {dataset_data.file_type}")
        
        original_shape = df.shape
        cleaning_report = {
            "original_rows": original_shape[0],
            "original_columns": original_shape[1],
            "removed_duplicates": 0,
            "filled_missing_values": 0,
            "outliers_removed": 0,
            "columns_removed": 0,
        }
        
        # Remove duplicates
        if cleaning_config.get("remove_duplicates", False):
            initial_rows = len(df)
            df = df.drop_duplicates()
            cleaning_report["removed_duplicates"] = initial_rows - len(df)
        
        # Handle missing values
        missing_strategy = cleaning_config.get("missing_values_strategy", "drop")
        if missing_strategy == "drop":
            initial_rows = len(df)
            df = df.dropna()
            cleaning_report["filled_missing_values"] = initial_rows - len(df)
        elif missing_strategy == "fill":
            for col in df.columns:
                if df[col].dtype in ['int64', 'float64']:
                    df[col] = df[col].fillna(df[col].median())
                else:
                    df[col] = df[col].fillna(df[col].mode()[0] if len(df[col].mode()) > 0 else "Unknown")
        
        # Remove outliers (for numerical columns)
        if cleaning_config.get("remove_outliers", False):
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            for col in numerical_cols:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                initial_rows = len(df)
                df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
                cleaning_report["outliers_removed"] += initial_rows - len(df)
        
        # Remove columns with too many missing values
        missing_threshold = cleaning_config.get("missing_threshold", 0.5)
        columns_to_remove = []
        for col in df.columns:
            missing_ratio = df[col].isnull().sum() / len(df)
            if missing_ratio > missing_threshold:
                columns_to_remove.append(col)
        
        if columns_to_remove:
            df = df.drop(columns=columns_to_remove)
            cleaning_report["columns_removed"] = len(columns_to_remove)
        
        # Save cleaned dataset
        cleaned_file_path = f"cleaned_datasets/{dataset_data.file_path.split('/')[-1]}"
        
        if dataset_data.file_type == "csv":
            cleaned_content = df.to_csv(index=False)
        elif dataset_data.file_type in ["xlsx", "xls"]:
            cleaned_content = df.to_excel(index=False)
        elif dataset_data.file_type == "json":
            cleaned_content = df.to_json(orient='records')
        elif dataset_data.file_type == "parquet":
            cleaned_content = df.to_parquet(index=False)
        
        await self.supabase_service.upload_file(
            bucket=settings.supabase_storage_bucket,
            path=cleaned_file_path,
            file_content=cleaned_content.encode() if isinstance(cleaned_content, str) else cleaned_content
        )
        
        cleaning_report.update({
            "final_rows": len(df),
            "final_columns": len(df.columns),
            "cleaned_file_path": cleaned_file_path,
        })
        
        return cleaning_report
    
    async def get_statistics(self, dataset_data: Any) -> Dict[str, Any]:
        """Get basic statistics for a dataset"""
        # Download dataset
        file_content = await self.supabase_service.download_file(
            bucket=settings.supabase_storage_bucket,
            path=dataset_data.file_path
        )
        
        # Load data
        if dataset_data.file_type == "csv":
            df = pd.read_csv(file_content)
        elif dataset_data.file_type in ["xlsx", "xls"]:
            df = pd.read_excel(file_content)
        elif dataset_data.file_type == "json":
            df = pd.read_json(file_content)
        elif dataset_data.file_type == "parquet":
            df = pd.read_parquet(file_content)
        else:
            raise ValueError(f"Unsupported file type: {dataset_data.file_type}")
        
        return {
            "row_count": len(df),
            "column_count": len(df.columns),
            "missing_values": df.isnull().sum().to_dict(),
            "duplicates": df.duplicated().sum(),
            "data_types": df.dtypes.to_dict(),
        }
    
    async def run_feature_engineering(self, dataset_data: Any, feature_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run feature engineering on a dataset"""
        # Download dataset
        file_content = await self.supabase_service.download_file(
            bucket=settings.supabase_storage_bucket,
            path=dataset_data.file_path
        )
        
        # Load data
        if dataset_data.file_type == "csv":
            df = pd.read_csv(file_content)
        elif dataset_data.file_type in ["xlsx", "xls"]:
            df = pd.read_excel(file_content)
        elif dataset_data.file_type == "json":
            df = pd.read_json(file_content)
        elif dataset_data.file_type == "parquet":
            df = pd.read_parquet(file_content)
        else:
            raise ValueError(f"Unsupported file type: {dataset_data.file_type}")
        
        original_columns = list(df.columns)
        feature_report = {
            "original_columns": original_columns,
            "new_features_created": 0,
            "features_removed": 0,
            "encoding_applied": [],
            "scaling_applied": [],
        }
        
        # Handle categorical encoding
        encoding_method = feature_config.get("encoding_method", "label")
        categorical_cols = df.select_dtypes(include=['object']).columns
        
        if encoding_method == "onehot" and len(categorical_cols) > 0:
            df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
            feature_report["encoding_applied"].append("one_hot_encoding")
        elif encoding_method == "label" and len(categorical_cols) > 0:
            from sklearn.preprocessing import LabelEncoder
            for col in categorical_cols:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
            feature_report["encoding_applied"].append("label_encoding")
        
        # Handle scaling
        scaling_method = feature_config.get("scaling_method", "standard")
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        
        if scaling_method == "standard" and len(numerical_cols) > 0:
            from sklearn.preprocessing import StandardScaler
            scaler = StandardScaler()
            df[numerical_cols] = scaler.fit_transform(df[numerical_cols])
            feature_report["scaling_applied"].append("standard_scaling")
        elif scaling_method == "minmax" and len(numerical_cols) > 0:
            from sklearn.preprocessing import MinMaxScaler
            scaler = MinMaxScaler()
            df[numerical_cols] = scaler.fit_transform(df[numerical_cols])
            feature_report["scaling_applied"].append("minmax_scaling")
        
        # Create interaction features
        if feature_config.get("create_interactions", False) and len(numerical_cols) > 1:
            for i, col1 in enumerate(numerical_cols):
                for col2 in numerical_cols[i+1:]:
                    interaction_name = f"{col1}_{col2}_interaction"
                    df[interaction_name] = df[col1] * df[col2]
                    feature_report["new_features_created"] += 1
        
        # Save engineered dataset
        engineered_file_path = f"engineered_datasets/{dataset_data.file_path.split('/')[-1]}"
        
        if dataset_data.file_type == "csv":
            engineered_content = df.to_csv(index=False)
        elif dataset_data.file_type in ["xlsx", "xls"]:
            engineered_content = df.to_excel(index=False)
        elif dataset_data.file_type == "json":
            engineered_content = df.to_json(orient='records')
        elif dataset_data.file_type == "parquet":
            engineered_content = df.to_parquet(index=False)
        
        await self.supabase_service.upload_file(
            bucket=settings.supabase_storage_bucket,
            path=engineered_file_path,
            file_content=engineered_content.encode() if isinstance(engineered_content, str) else engineered_content
        )
        
        feature_report.update({
            "final_columns": list(df.columns),
            "engineered_file_path": engineered_file_path,
        })
        
        return feature_report 