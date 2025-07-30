"""
FastAPI endpoints for posture analysis system.
Provides REST API for triggering analysis jobs and retrieving results.
"""

import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from celery.result import AsyncResult

from worker import celery_app, analyze_posture_task, get_analysis_status
from database_client import PostureDatabaseClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Kelv Posture Analysis API",
    description="Real-time posture and body language analysis for AI-powered mock interviews",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AnalysisRequest(BaseModel):
    """Request model for starting posture analysis"""
    session_id: str = Field(..., description="Interview session ID")
    video_url: str = Field(..., description="URL to video file in Supabase Storage")
    analysis_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional analysis configuration"
    )

class AnalysisResponse(BaseModel):
    """Response model for analysis request"""
    task_id: str = Field(..., description="Celery task ID for tracking progress")
    status: str = Field(..., description="Initial task status")
    session_id: str = Field(..., description="Interview session ID")
    estimated_duration: str = Field(..., description="Estimated processing time")

class StatusResponse(BaseModel):
    """Response model for task status"""
    task_id: str
    status: str
    progress: Optional[int] = None
    message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class PostureAnalysisResult(BaseModel):
    """Response model for completed analysis results"""
    id: str
    session_id: str
    video_url: str
    created_at: datetime
    total_duration: float
    avg_posture_score: float
    eye_contact_percentage: float
    avg_hand_movement_score: float
    avg_fidgeting_score: float
    overall_body_language_score: float
    top_posture_moments: List[Dict[str, Any]]
    problem_areas: List[str]
    recommendations: List[str]

class TimelinePoint(BaseModel):
    """Model for timeline data point"""
    timestamp_ms: int
    timestamp_formatted: str
    posture_score: float
    eye_contact: bool
    hand_movement_score: float
    fidgeting_score: float
    head_pose: Dict[str, float]
    shoulder_alignment: float
    back_straightness: float
    movement_velocity: float

# Dependency to get database client
def get_db_client():
    """Dependency to provide database client"""
    return PostureDatabaseClient()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connectivity
        db_client = get_db_client()
        db_healthy = db_client.health_check()
        
        # Check Celery connectivity
        celery_healthy = True
        try:
            # Send a simple task to check if Celery is responding
            result = celery_app.send_task('health_check')
            celery_healthy = True
        except Exception:
            celery_healthy = False
        
        status_code = status.HTTP_200_OK if (db_healthy and celery_healthy) else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return {
            "status": "healthy" if (db_healthy and celery_healthy) else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "connected" if db_healthy else "disconnected",
                "worker_queue": "connected" if celery_healthy else "disconnected"
            }
        }
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.post("/analysis/start", response_model=AnalysisResponse)
async def start_posture_analysis(request: AnalysisRequest):
    """
    Start a new posture analysis job
    
    Args:
        request: Analysis request with session_id and video_url
        
    Returns:
        Task information for tracking progress
    """
    try:
        logger.info(f"Starting posture analysis for session {request.session_id}")
        
        # Validate session exists (optional - could be done by database constraint)
        # db_client = get_db_client()
        # ... session validation logic ...
        
        # Queue the analysis task
        task = analyze_posture_task.delay(
            session_id=request.session_id,
            video_url=request.video_url,
            analysis_config=request.analysis_config
        )
        
        logger.info(f"Queued posture analysis task {task.id} for session {request.session_id}")
        
        return AnalysisResponse(
            task_id=task.id,
            status="queued",
            session_id=request.session_id,
            estimated_duration="2-5 minutes"
        )
        
    except Exception as e:
        logger.error(f"Error starting posture analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start analysis: {str(e)}")

@app.get("/analysis/status/{task_id}", response_model=StatusResponse)
async def get_task_status(task_id: str):
    """
    Get the status of a posture analysis task
    
    Args:
        task_id: Celery task ID
        
    Returns:
        Current task status and progress information
    """
    try:
        result = AsyncResult(task_id, app=celery_app)
        
        response_data = {
            "task_id": task_id,
            "status": result.status
        }
        
        if result.status == 'PENDING':
            response_data.update({
                "message": "Task is waiting to be processed",
                "progress": 0
            })
        elif result.status == 'PROCESSING':
            info = result.info or {}
            response_data.update({
                "message": info.get('status', 'Processing'),
                "progress": info.get('progress', 0)
            })
        elif result.status == 'SUCCESS':
            response_data.update({
                "message": "Analysis completed successfully",
                "progress": 100,
                "result": result.result
            })
        elif result.status == 'FAILURE':
            response_data.update({
                "message": "Analysis failed",
                "error": str(result.info) if result.info else "Unknown error"
            })
        
        return StatusResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error getting task status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get task status: {str(e)}")

@app.get("/analysis/results/{session_id}", response_model=PostureAnalysisResult)
async def get_analysis_results(session_id: str, db_client: PostureDatabaseClient = Depends(get_db_client)):
    """
    Get posture analysis results for a session
    
    Args:
        session_id: Interview session ID
        
    Returns:
        Complete analysis results
    """
    try:
        analysis = db_client.get_posture_analysis(session_id)
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found for this session")
        
        return PostureAnalysisResult(**analysis)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analysis results: {str(e)}")

@app.get("/analysis/timeline/{session_id}")
async def get_analysis_timeline(
    session_id: str,
    limit: Optional[int] = None,
    db_client: PostureDatabaseClient = Depends(get_db_client)
):
    """
    Get timeline data for a posture analysis
    
    Args:
        session_id: Interview session ID
        limit: Optional limit on number of data points
        
    Returns:
        List of timeline data points
    """
    try:
        timeline_data = db_client.get_posture_timeline_for_session(session_id)
        
        if not timeline_data:
            raise HTTPException(status_code=404, detail="Timeline data not found for this session")
        
        # Apply limit if specified
        if limit and len(timeline_data) > limit:
            # Sample evenly across the timeline
            step = len(timeline_data) // limit
            timeline_data = timeline_data[::step][:limit]
        
        return {
            "session_id": session_id,
            "timeline_points": len(timeline_data),
            "data": timeline_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting timeline data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get timeline data: {str(e)}")

@app.get("/analysis/summary")
async def get_analysis_summary(
    user_id: Optional[str] = None,
    db_client: PostureDatabaseClient = Depends(get_db_client)
):
    """
    Get summary statistics for posture analyses
    
    Args:
        user_id: Optional user ID to filter by
        
    Returns:
        Summary statistics
    """
    try:
        stats = db_client.get_analysis_summary_stats(user_id)
        recent_analyses = db_client.get_recent_analyses(limit=10, user_id=user_id)
        
        return {
            "statistics": stats,
            "recent_analyses": recent_analyses
        }
        
    except Exception as e:
        logger.error(f"Error getting analysis summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analysis summary: {str(e)}")

@app.delete("/analysis/{session_id}")
async def delete_analysis(session_id: str, db_client: PostureDatabaseClient = Depends(get_db_client)):
    """
    Delete posture analysis for a session
    
    Args:
        session_id: Interview session ID
        
    Returns:
        Deletion confirmation
    """
    try:
        # First get the analysis to get the ID
        analysis = db_client.get_posture_analysis(session_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found for this session")
        
        # Delete the analysis
        success = db_client.delete_posture_analysis(analysis["id"])
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete analysis")
        
        return {"message": "Analysis deleted successfully", "session_id": session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete analysis: {str(e)}")

@app.get("/worker/stats")
async def get_worker_stats():
    """
    Get Celery worker statistics
    
    Returns:
        Worker status and queue information
    """
    try:
        # Get active tasks
        active_tasks = celery_app.control.inspect().active()
        scheduled_tasks = celery_app.control.inspect().scheduled()
        reserved_tasks = celery_app.control.inspect().reserved()
        
        return {
            "active_tasks": active_tasks,
            "scheduled_tasks": scheduled_tasks,
            "reserved_tasks": reserved_tasks,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting worker stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get worker stats: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # For development
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )