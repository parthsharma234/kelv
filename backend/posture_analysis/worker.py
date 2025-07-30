"""
Background worker for processing posture analysis jobs using Celery.
Handles video download, analysis, and result storage.
"""

import os
import tempfile
import requests
from typing import Dict, Any
import logging
from celery import Celery
from celery.utils.log import get_task_logger

from enhanced_cv_processor import EnhancedBodyLanguageAnalyzer
from database_client import BodyLanguageDatabaseClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = get_task_logger(__name__)

# Initialize Celery app
celery_app = Celery(
    'body_language_analysis',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    include=['worker']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes max
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_disable_rate_limits=False,
    task_default_retry_delay=60,
    task_max_retries=3,
)

@celery_app.task(bind=True, name='analyze_body_language')
def analyze_body_language_task(self, session_id: str, video_url: str, analysis_config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Celery task to analyze body language from a video recording
    
    Args:
        session_id: Interview session ID
        video_url: URL to the video file in Supabase Storage
        analysis_config: Optional configuration for analysis
        
    Returns:
        Dictionary with analysis results and metadata
    """
    task_id = self.request.id
    logger.info(f"Starting body language analysis task {task_id} for session {session_id}")
    
    # Update task status
    self.update_state(
        state='PROCESSING',
        meta={'status': 'Downloading video', 'progress': 0}
    )
    
    temp_video_path = None
    analyzer = None
    
    try:
        # Initialize components
        analyzer = EnhancedBodyLanguageAnalyzer(
            analysis_interval_ms=analysis_config.get('interval_ms', 500) if analysis_config else 500
        )
        db_client = BodyLanguageDatabaseClient()
        
        # Download video to temporary file
        temp_video_path = _download_video(video_url, task_id)
        
        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={'status': 'Analyzing video', 'progress': 20}
        )
        
        # Perform analysis
        logger.info(f"Starting CV analysis for task {task_id}")
        timeline_data, summary = analyzer.analyze_video(temp_video_path)
        
        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={'status': 'Generating insights', 'progress': 80}
        )
        
        # Generate highlights and recommendations
        highlights = analyzer.get_highlights(timeline_data)
        recommendations = analyzer.get_recommendations(summary)
        
        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={'status': 'Saving results', 'progress': 90}
        )
        
        # Save to database
        analysis_id = db_client.create_body_language_analysis(
            session_id=session_id,
            video_url=video_url,
            timeline_data=timeline_data,
            summary=summary,
            highlights=highlights,
            recommendations=recommendations
        )
        
        logger.info(f"Completed body language analysis task {task_id}, analysis_id: {analysis_id}")
        
        return {
            'status': 'completed',
            'analysis_id': analysis_id,
            'session_id': session_id,
            'summary': summary,
            'highlights': highlights,
            'recommendations': recommendations,
            'timeline_points': len(timeline_data)
        }
        
    except Exception as e:
        logger.error(f"Error in body language analysis task {task_id}: {e}")
        
        # Update task status with error
        self.update_state(
            state='FAILURE',
            meta={'status': 'Analysis failed', 'error': str(e)}
        )
        
        raise self.retry(exc=e, countdown=60, max_retries=3)
        
    finally:
        # Cleanup
        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.unlink(temp_video_path)
                logger.info(f"Cleaned up temporary video file: {temp_video_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {temp_video_path}: {e}")
        
        if analyzer:
            analyzer.cleanup()

# Legacy alias for backward compatibility
@celery_app.task(bind=True, name='analyze_posture')
def analyze_posture_task(self, session_id: str, video_url: str, analysis_config: Dict[str, Any] = None) -> Dict[str, Any]:
    """Legacy alias for analyze_body_language_task"""
    return analyze_body_language_task(self, session_id, video_url, analysis_config)

def _download_video(video_url: str, task_id: str) -> str:
    """
    Download video from URL to temporary file
    
    Args:
        video_url: URL to download from
        task_id: Task ID for logging
        
    Returns:
        Path to downloaded temporary file
    """
    logger.info(f"Downloading video for task {task_id}: {video_url}")
    
    try:
        # Create temporary file
        temp_fd, temp_path = tempfile.mkstemp(suffix='.mp4', prefix=f'body_language_{task_id}_')
        
        # Download video
        response = requests.get(video_url, stream=True, timeout=300)  # 5 minute timeout
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded_size = 0
        
        with os.fdopen(temp_fd, 'wb') as temp_file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_file.write(chunk)
                    downloaded_size += len(chunk)
                    
                    # Log progress every 10MB
                    if downloaded_size % (10 * 1024 * 1024) == 0:
                        progress_mb = downloaded_size / (1024 * 1024)
                        total_mb = total_size / (1024 * 1024) if total_size > 0 else 0
                        logger.info(f"Downloaded {progress_mb:.1f}MB / {total_mb:.1f}MB for task {task_id}")
        
        logger.info(f"Video download completed for task {task_id}: {temp_path} ({downloaded_size} bytes)")
        return temp_path
        
    except Exception as e:
        logger.error(f"Failed to download video for task {task_id}: {e}")
        # Clean up partial file
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass
        raise

@celery_app.task(name='get_analysis_status')
def get_analysis_status(task_id: str) -> Dict[str, Any]:
    """
    Get the status of a body language analysis task
    
    Args:
        task_id: Celery task ID
        
    Returns:
        Task status information
    """
    result = celery_app.AsyncResult(task_id)
    
    return {
        'task_id': task_id,
        'status': result.status,
        'result': result.result if result.ready() else None,
        'meta': result.info if result.status == 'PROCESSING' else None
    }

@celery_app.task(name='cleanup_old_analyses')
def cleanup_old_analyses(days_old: int = 30) -> Dict[str, int]:
    """
    Cleanup old body language analyses (maintenance task)
    
    Args:
        days_old: Delete analyses older than this many days
        
    Returns:
        Cleanup statistics
    """
    logger.info(f"Starting cleanup of body language analyses older than {days_old} days")
    
    try:
        db_client = BodyLanguageDatabaseClient()
        
        # This would need a more sophisticated query to delete by date
        # For now, just return a placeholder
        logger.info("Cleanup task completed (placeholder)")
        
        return {
            'status': 'completed',
            'analyses_deleted': 0,
            'timeline_records_deleted': 0
        }
        
    except Exception as e:
        logger.error(f"Error in cleanup task: {e}")
        raise

@celery_app.task(name='health_check')
def health_check() -> Dict[str, Any]:
    """
    Health check task for monitoring
    
    Returns:
        Health status information
    """
    try:
        db_client = BodyLanguageDatabaseClient()
        db_healthy = db_client.health_check()
        
        return {
            'status': 'healthy' if db_healthy else 'unhealthy',
            'database': 'connected' if db_healthy else 'disconnected',
            'timestamp': str(os.environ.get('timestamp', 'unknown'))
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': str(os.environ.get('timestamp', 'unknown'))
        }

# Celery beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    'cleanup-old-analyses': {
        'task': 'cleanup_old_analyses',
        'schedule': 86400.0,  # Run daily
        'kwargs': {'days_old': 30}
    },
    'health-check': {
        'task': 'health_check',
        'schedule': 300.0,  # Run every 5 minutes
    },
}

if __name__ == '__main__':
    # For development - run worker directly
    celery_app.start()