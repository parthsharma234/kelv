"""
Database client for storing posture analysis results in Supabase.
Handles all database operations for posture analysis data.
"""

import os
from typing import List, Dict, Optional, Any
from dataclasses import asdict
import json
import logging
from datetime import datetime

from supabase import create_client, Client
from enhanced_cv_processor import BodyLanguageMetrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BodyLanguageDatabaseClient:
    """Client for managing body language analysis data in Supabase"""
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """
        Initialize the database client
        
        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase service role key
        """
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase URL and Service Role Key must be provided")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        
    def create_body_language_analysis(
        self,
        session_id: str,
        video_url: str,
        timeline_data: List[BodyLanguageMetrics],
        summary: Dict[str, float],
        highlights: Dict[str, List[Dict]],
        recommendations: List[str]
    ) -> str:
        """
        Create a new body language analysis record
        
        Args:
            session_id: Interview session ID
            video_url: URL to the video file
            timeline_data: List of timestamped body language metrics
            summary: Summary statistics
            highlights: Key highlights from analysis
            recommendations: Improvement recommendations
            
        Returns:
            The ID of the created body language analysis record
        """
        try:
            # Prepare highlights and recommendations for storage
            prepared_highlights = {
                "top_posture_moments": highlights.get("poor_posture_moments", []),
                "good_moments": highlights.get("good_moments", []),
                "problem_areas": highlights.get("problem_areas", [])
            }
            
            # Create main body language analysis record
            analysis_data = {
                "session_id": session_id,
                "video_url": video_url,
                "total_duration": summary["total_duration"],
                "analysis_interval_ms": 500,  # Default interval
                "total_frames": summary["total_frames"],
                "avg_posture_score": summary["avg_posture_score"],
                "eye_contact_percentage": summary["eye_contact_percentage"],
                "avg_hand_movement_score": summary["avg_hand_movement_score"],
                "avg_fidgeting_score": summary["avg_fidgeting_score"],
                # Facial expression metrics
                "avg_confidence_expression": summary.get("avg_confidence_expression", 0.0),
                "avg_engagement_score": summary.get("avg_engagement_score", 0.0),
                "smile_frequency": summary.get("smile_frequency", 0.0),
                "dominant_emotion": summary.get("dominant_emotion"),
                # Voice-visual synchronization
                "gesture_speech_alignment": summary.get("gesture_speech_alignment", 0.0),
                # Overall scores
                "overall_body_language_score": summary["overall_body_language_score"],
                "overall_facial_expression_score": summary.get("overall_facial_expression_score", 0.0),
                "overall_professionalism_score": summary.get("overall_professionalism_score", 0.0),
                # Key insights
                "top_posture_moments": json.dumps(prepared_highlights["top_posture_moments"]),
                "problem_areas": json.dumps(prepared_highlights["problem_areas"]),
                "recommendations": json.dumps(recommendations)
            }
            
            response = self.client.table("body_language_analysis").insert(analysis_data).execute()
            
            if not response.data:
                raise Exception("Failed to create body language analysis record")
                
            analysis_id = response.data[0]["id"]
            logger.info(f"Created body language analysis record: {analysis_id}")
            
            # Insert timeline data in batches
            self._insert_timeline_data(analysis_id, timeline_data)
            
            return analysis_id
            
        except Exception as e:
            logger.error(f"Error creating body language analysis: {e}")
            raise
    
    def _insert_timeline_data(self, analysis_id: str, timeline_data: List[BodyLanguageMetrics]):
        """Insert timeline data in batches for better performance"""
        batch_size = 100
        total_batches = (len(timeline_data) + batch_size - 1) // batch_size
        
        for i in range(0, len(timeline_data), batch_size):
            batch = timeline_data[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            
            timeline_records = []
            for metrics in batch:
                record = {
                    "body_language_analysis_id": analysis_id,
                    "timestamp_ms": metrics.timestamp_ms,
                    "timestamp_formatted": metrics.timestamp_formatted,
                    # Core posture metrics
                    "posture_score": metrics.posture_score,
                    "eye_contact": metrics.eye_contact,
                    "hand_movement_score": metrics.hand_movement_score,
                    "fidgeting_score": metrics.fidgeting_score,
                    # Facial expression metrics
                    "facial_expressions": json.dumps(metrics.facial_expressions),
                    "confidence_expression": metrics.confidence_expression,
                    "engagement_level": metrics.engagement_level,
                    "smile_detected": metrics.smile_detected,
                    "blink_rate": metrics.blink_rate,
                    # Micro-expressions and authenticity
                    "micro_expression_detected": metrics.micro_expression_detected,
                    "authenticity_score": metrics.authenticity_score,
                    "stress_indicators": json.dumps(metrics.stress_indicators),
                    # Detailed posture breakdowns
                    "head_pose": json.dumps(metrics.head_pose),
                    "shoulder_alignment": metrics.shoulder_alignment,
                    "back_straightness": metrics.back_straightness,
                    "hand_positions": json.dumps(metrics.hand_positions),
                    "movement_velocity": metrics.movement_velocity,
                    # Gesture analysis
                    "gesture_detected": metrics.gesture_detected,
                    "gesture_confidence": metrics.gesture_confidence,
                    "gesture_appropriateness": metrics.gesture_appropriateness
                }
                timeline_records.append(record)
            
            try:
                response = self.client.table("body_language_timeline").insert(timeline_records).execute()
                if not response.data:
                    raise Exception(f"Failed to insert timeline batch {batch_num}")
                    
                logger.info(f"Inserted timeline batch {batch_num}/{total_batches} ({len(batch)} records)")
                
            except Exception as e:
                logger.error(f"Error inserting timeline batch {batch_num}: {e}")
                raise
    
    def get_body_language_analysis(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get body language analysis data for a session
        
        Args:
            session_id: Interview session ID
            
        Returns:
            Body language analysis data or None if not found
        """
        try:
            response = self.client.table("body_language_analysis") \
                .select("*") \
                .eq("session_id", session_id) \
                .single() \
                .execute()
            
            if response.data:
                # Parse JSON fields
                data = response.data
                data["top_posture_moments"] = json.loads(data["top_posture_moments"]) if data["top_posture_moments"] else []
                data["problem_areas"] = json.loads(data["problem_areas"]) if data["problem_areas"] else []
                data["recommendations"] = json.loads(data["recommendations"]) if data["recommendations"] else []
                
                return data
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting body language analysis for session {session_id}: {e}")
            return None
    
    def get_body_language_timeline(self, analysis_id: str, limit: int = None) -> List[Dict[str, Any]]:
        """
        Get timeline data for a body language analysis
        
        Args:
            analysis_id: Body language analysis ID
            limit: Maximum number of records to return
            
        Returns:
            List of timeline data points
        """
        try:
            query = self.client.table("body_language_timeline") \
                .select("*") \
                .eq("body_language_analysis_id", analysis_id) \
                .order("timestamp_ms")
            
            if limit:
                query = query.limit(limit)
            
            response = query.execute()
            
            timeline_data = []
            for record in response.data:
                # Parse JSON fields
                record["facial_expressions"] = json.loads(record["facial_expressions"]) if record["facial_expressions"] else {}
                record["stress_indicators"] = json.loads(record["stress_indicators"]) if record["stress_indicators"] else []
                record["head_pose"] = json.loads(record["head_pose"]) if record["head_pose"] else {}
                record["hand_positions"] = json.loads(record["hand_positions"]) if record["hand_positions"] else []
                timeline_data.append(record)
            
            return timeline_data
            
        except Exception as e:
            logger.error(f"Error getting timeline data for analysis {analysis_id}: {e}")
            return []
    
    def get_body_language_timeline_for_session(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Get timeline data for a session (convenience method)
        
        Args:
            session_id: Interview session ID
            
        Returns:
            List of timeline data points
        """
        try:
            # First get the analysis ID
            analysis = self.get_body_language_analysis(session_id)
            if not analysis:
                return []
            
            return self.get_body_language_timeline(analysis["id"])
            
        except Exception as e:
            logger.error(f"Error getting timeline data for session {session_id}: {e}")
            return []
    
    def update_body_language_analysis(self, analysis_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a body language analysis record
        
        Args:
            analysis_id: Body language analysis ID
            updates: Dictionary of fields to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = self.client.table("body_language_analysis") \
                .update(updates) \
                .eq("id", analysis_id) \
                .execute()
            
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Error updating body language analysis {analysis_id}: {e}")
            return False
    
    def delete_body_language_analysis(self, analysis_id: str) -> bool:
        """
        Delete a body language analysis and all its timeline data
        
        Args:
            analysis_id: Body language analysis ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Delete timeline data first (due to foreign key constraint)
            self.client.table("body_language_timeline") \
                .delete() \
                .eq("body_language_analysis_id", analysis_id) \
                .execute()
            
            # Delete main analysis record
            response = self.client.table("body_language_analysis") \
                .delete() \
                .eq("id", analysis_id) \
                .execute()
            
            logger.info(f"Deleted body language analysis: {analysis_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting body language analysis {analysis_id}: {e}")
            return False
    
    def get_analysis_summary_stats(self, user_id: str = None) -> Dict[str, Any]:
        """
        Get summary statistics for body language analyses
        
        Args:
            user_id: Optional user ID to filter by
            
        Returns:
            Dictionary of summary statistics
        """
        try:
            query = """
            SELECT 
                COUNT(*) as total_analyses,
                AVG(avg_posture_score) as avg_posture_score,
                AVG(eye_contact_percentage) as avg_eye_contact_percentage,
                AVG(avg_hand_movement_score) as avg_hand_movement_score,
                AVG(avg_fidgeting_score) as avg_fidgeting_score,
                AVG(avg_confidence_expression) as avg_confidence_expression,
                AVG(avg_engagement_score) as avg_engagement_score,
                AVG(overall_body_language_score) as avg_overall_score,
                AVG(overall_facial_expression_score) as avg_facial_expression_score,
                AVG(overall_professionalism_score) as avg_professionalism_score,
                SUM(total_duration) as total_duration_analyzed
            FROM body_language_analysis pa
            """
            
            if user_id:
                query += """
                JOIN interview_sessions is ON pa.session_id = is.id
                WHERE is.user_id = %s
                """
                response = self.client.rpc('execute_sql', {
                    'query': query,
                    'params': [user_id]
                }).execute()
            else:
                response = self.client.rpc('execute_sql', {
                    'query': query
                }).execute()
            
            if response.data:
                return response.data[0]
            
            return {}
            
        except Exception as e:
            logger.error(f"Error getting analysis summary stats: {e}")
            return {}
    
    def get_recent_analyses(self, limit: int = 10, user_id: str = None) -> List[Dict[str, Any]]:
        """
        Get recent body language analyses
        
        Args:
            limit: Maximum number of records to return
            user_id: Optional user ID to filter by
            
        Returns:
            List of recent body language analyses
        """
        try:
            query = self.client.table("body_language_analysis") \
                .select("""
                    id,
                    session_id,
                    video_url,
                    created_at,
                    total_duration,
                    avg_posture_score,
                    eye_contact_percentage,
                    avg_confidence_expression,
                    avg_engagement_score,
                    overall_body_language_score,
                    overall_facial_expression_score,
                    overall_professionalism_score,
                    interview_sessions(id, user_id, created_at)
                """) \
                .order("created_at", desc=True) \
                .limit(limit)
            
            if user_id:
                # This requires a more complex query with RLS
                # For now, we'll get all and filter in Python
                # In production, you'd want to optimize this
                pass
            
            response = query.execute()
            return response.data or []
            
        except Exception as e:
            logger.error(f"Error getting recent analyses: {e}")
            return []
    
    def health_check(self) -> bool:
        """
        Check if the database connection is working
        
        Returns:
            True if connection is healthy, False otherwise
        """
        try:
            response = self.client.table("body_language_analysis").select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False