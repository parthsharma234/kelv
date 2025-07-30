"""
Computer Vision processor for posture and body language analysis using MediaPipe.
Analyzes video recordings to extract posture, eye contact, hand movement, and fidgeting metrics.
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, List, Tuple, Optional
import math
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PostureMetrics:
    """Container for posture analysis metrics at a specific timestamp"""
    timestamp_ms: int
    timestamp_formatted: str
    posture_score: float
    eye_contact: bool
    hand_movement_score: float
    fidgeting_score: float
    head_pose: Dict[str, float]
    shoulder_alignment: float
    back_straightness: float
    hand_positions: List[Dict[str, float]]
    movement_velocity: float

class PostureAnalyzer:
    """Main class for analyzing posture and body language from video"""
    
    def __init__(self, analysis_interval_ms: int = 500):
        """
        Initialize the posture analyzer
        
        Args:
            analysis_interval_ms: Interval between analysis frames in milliseconds
        """
        self.analysis_interval_ms = analysis_interval_ms
        
        # Initialize MediaPipe components
        mp_pose = mp.solutions.pose
        mp_face_mesh = mp.solutions.face_mesh
        mp_hands = mp.solutions.hands
        
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.hands = mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Store previous frame data for movement analysis
        self.prev_landmarks = None
        self.movement_history = []
        self.hand_movement_history = []
        
    def analyze_video(self, video_path: str) -> Tuple[List[PostureMetrics], Dict[str, float]]:
        """
        Analyze a video file for posture and body language metrics
        
        Args:
            video_path: Path to the video file
            
        Returns:
            Tuple of (timeline_data, summary_metrics)
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_ms = (total_frames / fps) * 1000
        
        logger.info(f"Processing video: {total_frames} frames at {fps} FPS ({duration_ms/1000:.2f}s)")
        
        timeline_data = []
        frame_interval = int((fps * self.analysis_interval_ms) / 1000)
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Process frame only at specified intervals
            if frame_count % frame_interval == 0:
                timestamp_ms = int((frame_count / fps) * 1000)
                timestamp_formatted = self._format_timestamp(timestamp_ms)
                
                try:
                    metrics = self._analyze_frame(frame, timestamp_ms, timestamp_formatted)
                    if metrics:
                        timeline_data.append(metrics)
                        
                    if len(timeline_data) % 10 == 0:
                        logger.info(f"Processed {len(timeline_data)} analysis points ({timestamp_formatted})")
                        
                except Exception as e:
                    logger.warning(f"Error analyzing frame at {timestamp_formatted}: {e}")
            
            frame_count += 1
        
        cap.release()
        
        # Calculate summary metrics
        summary = self._calculate_summary(timeline_data, duration_ms)
        
        logger.info(f"Analysis complete: {len(timeline_data)} data points, {duration_ms/1000:.2f}s duration")
        return timeline_data, summary
    
    def _analyze_frame(self, frame: np.ndarray, timestamp_ms: int, timestamp_formatted: str) -> Optional[PostureMetrics]:
        """Analyze a single frame for posture metrics"""
        
        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Run MediaPipe inference
        pose_results = self.pose.process(rgb_frame)
        face_results = self.face_mesh.process(rgb_frame)
        hands_results = self.hands.process(rgb_frame)
        
        # Extract metrics if pose landmarks are detected
        if not pose_results.landmarks:
            return None
            
        try:
            # Calculate posture score
            posture_score = self._calculate_posture_score(pose_results.landmarks)
            
            # Calculate eye contact
            eye_contact = self._calculate_eye_contact(face_results)
            
            # Calculate hand movement
            hand_movement_score, hand_positions = self._calculate_hand_movement(hands_results)
            
            # Calculate fidgeting score
            fidgeting_score = self._calculate_fidgeting_score(pose_results.landmarks)
            
            # Calculate head pose
            head_pose = self._calculate_head_pose(face_results)
            
            # Calculate shoulder alignment
            shoulder_alignment = self._calculate_shoulder_alignment(pose_results.landmarks)
            
            # Calculate back straightness
            back_straightness = self._calculate_back_straightness(pose_results.landmarks)
            
            # Calculate movement velocity
            movement_velocity = self._calculate_movement_velocity(pose_results.landmarks)
            
            return PostureMetrics(
                timestamp_ms=timestamp_ms,
                timestamp_formatted=timestamp_formatted,
                posture_score=posture_score,
                eye_contact=eye_contact,
                hand_movement_score=hand_movement_score,
                fidgeting_score=fidgeting_score,
                head_pose=head_pose,
                shoulder_alignment=shoulder_alignment,
                back_straightness=back_straightness,
                hand_positions=hand_positions,
                movement_velocity=movement_velocity
            )
            
        except Exception as e:
            logger.warning(f"Error calculating metrics for frame at {timestamp_formatted}: {e}")
            return None
    
    def _calculate_posture_score(self, pose_landmarks) -> float:
        """Calculate overall posture score based on spine alignment and shoulder position"""
        landmarks = pose_landmarks.landmark
        
        # Get key landmarks
        left_shoulder = landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
        left_hip = landmarks[mp.solutions.pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_HIP]
        nose = landmarks[mp.solutions.pose.PoseLandmark.NOSE]
        
        # Calculate shoulder levelness (0 = perfect, 1 = very tilted)
        shoulder_tilt = abs(left_shoulder.y - right_shoulder.y)
        shoulder_score = max(0, 1 - shoulder_tilt * 10)
        
        # Calculate forward head posture
        shoulder_center_x = (left_shoulder.x + right_shoulder.x) / 2
        head_forward_ratio = abs(nose.x - shoulder_center_x)
        head_score = max(0, 1 - head_forward_ratio * 5)
        
        # Calculate spine alignment
        shoulder_center_y = (left_shoulder.y + right_shoulder.y) / 2
        hip_center_y = (left_hip.y + right_hip.y) / 2
        spine_alignment = abs(shoulder_center_x - ((left_hip.x + right_hip.x) / 2))
        spine_score = max(0, 1 - spine_alignment * 3)
        
        # Weighted combination
        posture_score = (shoulder_score * 0.3 + head_score * 0.4 + spine_score * 0.3)
        return round(posture_score, 2)
    
    def _calculate_eye_contact(self, face_results) -> bool:
        """Determine if the person is making eye contact based on head pose and gaze direction"""
        if not face_results.multi_face_landmarks:
            return False
            
        face_landmarks = face_results.multi_face_landmarks[0]
        landmarks = face_landmarks.landmark
        
        # Get key facial landmarks for gaze estimation
        left_eye_center = landmarks[468]  # Left eye center
        right_eye_center = landmarks[473]  # Right eye center
        nose_tip = landmarks[1]
        
        # Calculate horizontal gaze direction
        eye_center_x = (left_eye_center.x + right_eye_center.x) / 2
        gaze_deviation = abs(eye_center_x - nose_tip.x)
        
        # Calculate vertical gaze (head tilt)
        eye_center_y = (left_eye_center.y + right_eye_center.y) / 2
        vertical_deviation = abs(eye_center_y - nose_tip.y)
        
        # Thresholds for "good" eye contact
        horizontal_threshold = 0.02
        vertical_threshold = 0.03
        
        return gaze_deviation < horizontal_threshold and vertical_deviation < vertical_threshold
    
    def _calculate_hand_movement(self, hands_results) -> Tuple[float, List[Dict[str, float]]]:
        """Calculate hand movement intensity and positions"""
        hand_positions = []
        
        if not hands_results.multi_hand_landmarks:
            self.hand_movement_history.append(0)
            return 0.0, hand_positions
        
        current_hand_positions = []
        
        for hand_landmarks in hands_results.multi_hand_landmarks:
            # Get wrist position as hand center
            wrist = hand_landmarks.landmark[0]
            hand_pos = {"x": wrist.x, "y": wrist.y, "z": wrist.z}
            hand_positions.append(hand_pos)
            current_hand_positions.append([wrist.x, wrist.y, wrist.z])
        
        # Calculate movement if we have previous positions
        movement_score = 0.0
        if len(self.hand_movement_history) > 0 and len(current_hand_positions) > 0:
            if len(self.hand_movement_history) > 0:
                prev_positions = self.hand_movement_history[-1] if self.hand_movement_history[-1] else []
                
                total_movement = 0
                for i, current_pos in enumerate(current_hand_positions):
                    if i < len(prev_positions):
                        movement = np.linalg.norm(np.array(current_pos) - np.array(prev_positions[i]))
                        total_movement += movement
                
                movement_score = min(1.0, total_movement * 10)  # Scale and cap at 1.0
        
        self.hand_movement_history.append(current_hand_positions)
        
        # Keep only recent history
        if len(self.hand_movement_history) > 10:
            self.hand_movement_history = self.hand_movement_history[-10:]
        
        return round(movement_score, 2), hand_positions
    
    def _calculate_fidgeting_score(self, pose_landmarks) -> float:
        """Calculate fidgeting score based on small, frequent movements"""
        landmarks = pose_landmarks.landmark
        
        # Get key landmarks for movement tracking
        key_points = [
            landmarks[mp.solutions.pose.PoseLandmark.NOSE],
            landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER],
            landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER],
            landmarks[mp.solutions.pose.PoseLandmark.LEFT_ELBOW],
            landmarks[mp.solutions.pose.PoseLandmark.RIGHT_ELBOW]
        ]
        
        current_positions = [[p.x, p.y, p.z] for p in key_points]
        
        fidgeting_score = 0.0
        if self.prev_landmarks:
            total_movement = 0
            for i, current_pos in enumerate(current_positions):
                if i < len(self.prev_landmarks):
                    movement = np.linalg.norm(np.array(current_pos) - np.array(self.prev_landmarks[i]))
                    total_movement += movement
            
            # Small movements indicate fidgeting
            avg_movement = total_movement / len(current_positions)
            fidgeting_score = min(1.0, avg_movement * 20)  # Scale small movements
        
        self.prev_landmarks = current_positions
        self.movement_history.append(fidgeting_score)
        
        # Keep only recent history for smoothing
        if len(self.movement_history) > 5:
            self.movement_history = self.movement_history[-5:]
        
        # Smooth the fidgeting score
        smoothed_score = np.mean(self.movement_history) if self.movement_history else 0.0
        return round(smoothed_score, 2)
    
    def _calculate_head_pose(self, face_results) -> Dict[str, float]:
        """Calculate head pose angles (yaw, pitch, roll)"""
        if not face_results.multi_face_landmarks:
            return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}
        
        face_landmarks = face_landmarks = face_results.multi_face_landmarks[0]
        landmarks = face_landmarks.landmark
        
        # Get key points for head pose estimation
        nose_tip = np.array([landmarks[1].x, landmarks[1].y, landmarks[1].z])
        chin = np.array([landmarks[18].x, landmarks[18].y, landmarks[18].z])
        left_eye = np.array([landmarks[33].x, landmarks[33].y, landmarks[33].z])
        right_eye = np.array([landmarks[263].x, landmarks[263].y, landmarks[263].z])
        
        # Calculate approximate head pose
        # Yaw (left-right rotation)
        eye_center = (left_eye + right_eye) / 2
        yaw = math.atan2(nose_tip[0] - eye_center[0], abs(nose_tip[2] - eye_center[2])) * 180 / math.pi
        
        # Pitch (up-down rotation)
        pitch = math.atan2(nose_tip[1] - chin[1], abs(nose_tip[2] - chin[2])) * 180 / math.pi
        
        # Roll (tilt)
        roll = math.atan2(right_eye[1] - left_eye[1], right_eye[0] - left_eye[0]) * 180 / math.pi
        
        return {
            "yaw": round(yaw, 2),
            "pitch": round(pitch, 2),
            "roll": round(roll, 2)
        }
    
    def _calculate_shoulder_alignment(self, pose_landmarks) -> float:
        """Calculate how well-aligned the shoulders are"""
        landmarks = pose_landmarks.landmark
        left_shoulder = landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
        
        # Calculate shoulder levelness
        height_diff = abs(left_shoulder.y - right_shoulder.y)
        alignment_score = max(0, 1 - height_diff * 10)
        
        return round(alignment_score, 2)
    
    def _calculate_back_straightness(self, pose_landmarks) -> float:
        """Calculate how straight the back/spine appears"""
        landmarks = pose_landmarks.landmark
        
        left_shoulder = landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
        left_hip = landmarks[mp.solutions.pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_HIP]
        
        # Calculate spine straightness
        shoulder_center = [(left_shoulder.x + right_shoulder.x) / 2, (left_shoulder.y + right_shoulder.y) / 2]
        hip_center = [(left_hip.x + right_hip.x) / 2, (left_hip.y + right_hip.y) / 2]
        
        # Measure deviation from vertical line
        horizontal_deviation = abs(shoulder_center[0] - hip_center[0])
        straightness_score = max(0, 1 - horizontal_deviation * 5)
        
        return round(straightness_score, 2)
    
    def _calculate_movement_velocity(self, pose_landmarks) -> float:
        """Calculate overall movement velocity"""
        if not hasattr(self, 'prev_pose_landmarks') or not self.prev_pose_landmarks:
            self.prev_pose_landmarks = pose_landmarks
            return 0.0
        
        landmarks = pose_landmarks.landmark
        prev_landmarks = self.prev_pose_landmarks.landmark
        
        total_movement = 0
        landmark_count = 0
        
        # Calculate movement for key landmarks
        key_landmark_indices = [
            mp.solutions.pose.PoseLandmark.NOSE,
            mp.solutions.pose.PoseLandmark.LEFT_SHOULDER,
            mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER,
            mp.solutions.pose.PoseLandmark.LEFT_ELBOW,
            mp.solutions.pose.PoseLandmark.RIGHT_ELBOW,
            mp.solutions.pose.PoseLandmark.LEFT_WRIST,
            mp.solutions.pose.PoseLandmark.RIGHT_WRIST
        ]
        
        for idx in key_landmark_indices:
            current = landmarks[idx]
            previous = prev_landmarks[idx]
            
            movement = math.sqrt(
                (current.x - previous.x) ** 2 +
                (current.y - previous.y) ** 2 +
                (current.z - previous.z) ** 2
            )
            total_movement += movement
            landmark_count += 1
        
        avg_movement = total_movement / landmark_count if landmark_count > 0 else 0
        velocity = min(1.0, avg_movement * 50)  # Scale and cap
        
        self.prev_pose_landmarks = pose_landmarks
        return round(velocity, 2)
    
    def _calculate_summary(self, timeline_data: List[PostureMetrics], duration_ms: float) -> Dict[str, float]:
        """Calculate summary metrics from timeline data"""
        if not timeline_data:
            return {
                "avg_posture_score": 0.0,
                "eye_contact_percentage": 0.0,
                "avg_hand_movement_score": 0.0,
                "avg_fidgeting_score": 0.0,
                "overall_body_language_score": 0.0,
                "total_duration": duration_ms / 1000,
                "total_frames": 0
            }
        
        # Calculate averages
        avg_posture = np.mean([d.posture_score for d in timeline_data])
        eye_contact_frames = sum(1 for d in timeline_data if d.eye_contact)
        eye_contact_percentage = (eye_contact_frames / len(timeline_data)) * 100
        avg_hand_movement = np.mean([d.hand_movement_score for d in timeline_data])
        avg_fidgeting = np.mean([d.fidgeting_score for d in timeline_data])
        
        # Calculate overall body language score
        overall_score = (
            avg_posture * 0.3 +
            (eye_contact_percentage / 100) * 0.3 +
            (1 - avg_hand_movement) * 0.2 +  # Lower hand movement is better
            (1 - avg_fidgeting) * 0.2        # Lower fidgeting is better
        )
        
        return {
            "avg_posture_score": round(avg_posture, 2),
            "eye_contact_percentage": round(eye_contact_percentage, 2),
            "avg_hand_movement_score": round(avg_hand_movement, 2),
            "avg_fidgeting_score": round(avg_fidgeting, 2),
            "overall_body_language_score": round(overall_score, 2),
            "total_duration": duration_ms / 1000,
            "total_frames": len(timeline_data)
        }
    
    def _format_timestamp(self, timestamp_ms: int) -> str:
        """Format timestamp in HH:MM:SS.mmm format"""
        total_seconds = timestamp_ms // 1000
        milliseconds = timestamp_ms % 1000
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"
    
    def get_highlights(self, timeline_data: List[PostureMetrics]) -> Dict[str, List[Dict]]:
        """Extract key highlights from the analysis"""
        if not timeline_data:
            return {"poor_posture_moments": [], "good_moments": [], "problem_areas": []}
        
        # Find poor posture moments
        poor_posture_moments = []
        for data in timeline_data:
            if data.posture_score < 0.4:  # Poor posture threshold
                poor_posture_moments.append({
                    "timestamp": data.timestamp_formatted,
                    "timestamp_ms": data.timestamp_ms,
                    "posture_score": data.posture_score,
                    "description": "Poor posture detected"
                })
        
        # Sort and get top 3 worst moments
        poor_posture_moments.sort(key=lambda x: x["posture_score"])
        top_poor_moments = poor_posture_moments[:3]
        
        # Find good moments
        good_moments = []
        for data in timeline_data:
            if data.posture_score > 0.8 and data.eye_contact:
                good_moments.append({
                    "timestamp": data.timestamp_formatted,
                    "timestamp_ms": data.timestamp_ms,
                    "posture_score": data.posture_score,
                    "description": "Excellent posture and eye contact"
                })
        
        # Analyze problem areas
        problem_areas = []
        avg_posture = np.mean([d.posture_score for d in timeline_data])
        avg_fidgeting = np.mean([d.fidgeting_score for d in timeline_data])
        eye_contact_percentage = (sum(1 for d in timeline_data if d.eye_contact) / len(timeline_data)) * 100
        
        if avg_posture < 0.6:
            problem_areas.append("Posture needs improvement - focus on sitting/standing straighter")
        if avg_fidgeting > 0.6:
            problem_areas.append("Excessive fidgeting detected - practice staying still")
        if eye_contact_percentage < 60:
            problem_areas.append("Limited eye contact - practice looking at the camera")
        
        return {
            "poor_posture_moments": top_poor_moments,
            "good_moments": good_moments[:3],  # Top 3 good moments
            "problem_areas": problem_areas
        }
    
    def get_recommendations(self, summary: Dict[str, float]) -> List[str]:
        """Generate improvement recommendations based on analysis"""
        recommendations = []
        
        if summary["avg_posture_score"] < 0.6:
            recommendations.append("Focus on maintaining better posture - keep your back straight and shoulders relaxed")
        
        if summary["eye_contact_percentage"] < 60:
            recommendations.append("Practice maintaining eye contact with the camera - aim for 60-80% of the time")
        
        if summary["avg_fidgeting_score"] > 0.6:
            recommendations.append("Try to minimize fidgeting - practice keeping your hands still or in a comfortable position")
        
        if summary["avg_hand_movement_score"] > 0.7:
            recommendations.append("Reduce excessive hand movements - use purposeful gestures instead")
        
        if summary["overall_body_language_score"] < 0.6:
            recommendations.append("Overall body language needs improvement - practice in front of a mirror")
        
        if not recommendations:
            recommendations.append("Great body language! Continue maintaining your professional presence")
        
        return recommendations
    
    def cleanup(self):
        """Clean up MediaPipe resources"""
        if hasattr(self, 'pose'):
            self.pose.close()
        if hasattr(self, 'face_mesh'):
            self.face_mesh.close()
        if hasattr(self, 'hands'):
            self.hands.close()