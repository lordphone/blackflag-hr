"""
Health check endpoints
"""
from fastapi import APIRouter, status
from datetime import datetime
from src.database import check_db_connection
from src.config import settings

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Basic health check endpoint
    Used by ALB target group health checks
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment
    }


@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def readiness_check():
    """
    Readiness check - includes database connection
    """
    db_connected = await check_db_connection()
    
    if not db_connected:
        return {
            "status": "not_ready",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "disconnected"
        }
    
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.app_name,
        "database": "connected",
        "environment": settings.environment
    }


@router.get("/health/live", status_code=status.HTTP_200_OK)
async def liveness_check():
    """
    Liveness check - simple check that app is running
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }



