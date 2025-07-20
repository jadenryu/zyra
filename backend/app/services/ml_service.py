import pandas as pd
import numpy as np
import pickle
import uuid
import httpx
from typing import Dict, Any, List
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, mean_absolute_error
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC, SVR
from sklearn.preprocessing import StandardScaler, LabelEncoder
from app.services.supabase_service import SupabaseService
from app.core.config import settings


class MLService:
    def __init__(self):
        self.supabase_service = SupabaseService()
        self.models = {
            "classification": {
                "random_forest": RandomForestClassifier,
                "logistic_regression": LogisticRegression,
                "svm": SVC,
            },
            "regression": {
                "random_forest": RandomForestRegressor,
                "linear_regression": LinearRegression,
                "svr": SVR,
            }
        }
    
    async def train_model(self, dataset_data: Any, model_config: Dict[str, Any]) -> Dict[str, Any]:
        """Train a machine learning model"""
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
        
        # Get target column
        target_column = model_config.get("target_column")
        if not target_column or target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")
        
        # Prepare features and target
        X = df.drop(columns=[target_column])
        y = df[target_column]
        
        # Handle categorical features
        categorical_cols = X.select_dtypes(include=['object']).columns
        label_encoders = {}
        
        for col in categorical_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            label_encoders[col] = le
        
        # Split data
        test_size = model_config.get("test_size", 0.2)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Determine problem type
        if y.dtype in ['object', 'category'] or len(y.unique()) < 10:
            problem_type = "classification"
        else:
            problem_type = "regression"
        
        # Get model
        algorithm = model_config.get("algorithm", "random_forest")
        if algorithm not in self.models[problem_type]:
            raise ValueError(f"Algorithm '{algorithm}' not supported for {problem_type}")
        
        model_class = self.models[problem_type][algorithm]
        model = model_class(**model_config.get("hyperparameters", {}))
        
        # Train model
        model.fit(X_train_scaled, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test_scaled)
        
        # Calculate metrics
        if problem_type == "classification":
            metrics = {
                "accuracy": float(accuracy_score(y_test, y_pred)),
                "precision": float(precision_score(y_test, y_pred, average='weighted')),
                "recall": float(recall_score(y_test, y_pred, average='weighted')),
                "f1_score": float(f1_score(y_test, y_pred, average='weighted')),
            }
        else:
            metrics = {
                "mse": float(mean_squared_error(y_test, y_pred)),
                "mae": float(mean_absolute_error(y_test, y_pred)),
                "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
            }
        
        # Cross-validation
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
        
        # Save model and artifacts
        model_id = str(uuid.uuid4())
        model_path = f"models/{model_id}/model.pkl"
        scaler_path = f"models/{model_id}/scaler.pkl"
        encoders_path = f"models/{model_id}/encoders.pkl"
        
        # Save model
        model_bytes = pickle.dumps(model)
        await self.supabase_service.upload_file(
            bucket=settings.supabase_storage_bucket,
            path=model_path,
            file_content=model_bytes
        )
        
        # Save scaler
        scaler_bytes = pickle.dumps(scaler)
        await self.supabase_service.upload_file(
            bucket=settings.supabase_storage_bucket,
            path=scaler_path,
            file_content=scaler_bytes
        )
        
        # Save encoders
        encoders_bytes = pickle.dumps(label_encoders)
        await self.supabase_service.upload_file(
            bucket=settings.supabase_storage_bucket,
            path=encoders_path,
            file_content=encoders_bytes
        )
        
        # Feature importance (for tree-based models)
        feature_importance = {}
        if hasattr(model, 'feature_importances_'):
            feature_importance = dict(zip(X.columns, model.feature_importances_))
        
        return {
            "model_id": model_id,
            "problem_type": problem_type,
            "algorithm": algorithm,
            "target_column": target_column,
            "feature_columns": list(X.columns),
            "metrics": metrics,
            "cv_mean": float(cv_scores.mean()),
            "cv_std": float(cv_scores.std()),
            "feature_importance": feature_importance,
            "model_path": model_path,
            "scaler_path": scaler_path,
            "encoders_path": encoders_path,
            "training_samples": len(X_train),
            "test_samples": len(X_test),
        }
    
    async def predict(self, model_data: Any, input_data: Dict[str, Any]) -> Any:
        """Make predictions using a trained model"""
        # Load model
        model_bytes = await self.supabase_service.download_file(
            bucket=settings.supabase_storage_bucket,
            path=model_data.model_path
        )
        model = pickle.loads(model_bytes)
        
        # Load scaler
        scaler_bytes = await self.supabase_service.download_file(
            bucket=settings.supabase_storage_bucket,
            path=model_data.scaler_path
        )
        scaler = pickle.loads(scaler_bytes)
        
        # Load encoders
        encoders_bytes = await self.supabase_service.download_file(
            bucket=settings.supabase_storage_bucket,
            path=model_data.encoders_path
        )
        label_encoders = pickle.loads(encoders_bytes)
        
        # Prepare input data
        feature_columns = model_data.feature_columns
        input_df = pd.DataFrame([input_data])
        
        # Ensure all required features are present
        missing_features = set(feature_columns) - set(input_df.columns)
        if missing_features:
            raise ValueError(f"Missing features: {missing_features}")
        
        # Select only the required features
        X = input_df[feature_columns]
        
        # Apply label encoding to categorical features
        for col, encoder in label_encoders.items():
            if col in X.columns:
                X[col] = encoder.transform(X[col].astype(str))
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Make prediction
        prediction = model.predict(X_scaled)
        
        # Return prediction
        if model_data.problem_type == "classification":
            return int(prediction[0])
        else:
            return float(prediction[0])
    
    async def delete_model_files(self, model_data: Any) -> bool:
        """Delete model files from storage"""
        try:
            # Delete model file
            await self.supabase_service.delete_file(
                bucket=settings.supabase_storage_bucket,
                path=model_data.model_path
            )
            
            # Delete scaler file
            await self.supabase_service.delete_file(
                bucket=settings.supabase_storage_bucket,
                path=model_data.scaler_path
            )
            
            # Delete encoders file
            await self.supabase_service.delete_file(
                bucket=settings.supabase_storage_bucket,
                path=model_data.encoders_path
            )
            
            return True
        except Exception as e:
            print(f"Error deleting model files: {str(e)}")
            return False
    
    async def get_ai_insights(self, data_summary: str, question: str) -> str:
        """Get AI insights using OpenRouter or OpenAI"""
        try:
            # Use OpenRouter if available, otherwise fallback to OpenAI
            if settings.openrouter_api_key:
                return await self._get_openrouter_insights(data_summary, question)
            elif settings.openai_api_key:
                return await self._get_openai_insights(data_summary, question)
            else:
                return "AI insights not available - no API key configured"
        except Exception as e:
            return f"Error getting AI insights: {str(e)}"
    
    async def _get_openrouter_insights(self, data_summary: str, question: str) -> str:
        """Get insights using OpenRouter API"""
        prompt = f"""
        You are a data analyst. Here's a summary of a dataset:
        
        {data_summary}
        
        Question: {question}
        
        Please provide a clear, actionable insight based on this data. Focus on:
        1. Key patterns or trends
        2. Potential business implications
        3. Recommendations for further analysis
        
        Keep your response concise and practical.
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://zyra-ai.com",  # Your app URL
                    "X-Title": "Zyra AI Platform"
                },
                json={
                    "model": "google/gemini-2.5-flash-preview-05-20:thinking",  # You can change this to any model
                    "messages": [
                        {"role": "system", "content": "You are a helpful data analyst."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                return f"Error: {response.status_code} - {response.text}"
    
    async def _get_openai_insights(self, data_summary: str, question: str) -> str:
        """Get insights using OpenAI API (fallback)"""
        prompt = f"""
        You are a data analyst. Here's a summary of a dataset:
        
        {data_summary}
        
        Question: {question}
        
        Please provide a clear, actionable insight based on this data. Focus on:
        1. Key patterns or trends
        2. Potential business implications
        3. Recommendations for further analysis
        
        Keep your response concise and practical.
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4",
                    "messages": [
                        {"role": "system", "content": "You are a helpful data analyst."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                return f"Error: {response.status_code} - {response.text}" 