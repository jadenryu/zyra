from fastapi import APIRouter
from app.api.v1 import auth, projects, datasets, analytics, ml, data

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(ml.router, prefix="/ml", tags=["machine-learning"])
api_router.include_router(data.router, prefix="/data", tags=["data-processing"]) 