"""
Enhanced Computer Vision processor for comprehensive body language analysis.
Includes posture, facial expressions, emotions, micro-expressions, and gesture recognition.
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, List, Tuple, Optional
import math
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
from collections import deque
from sklearn.preprocessing import StandardScaler
import joblib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BodyLanguageMetrics:
    """Container for comprehensive body language analysis at a specific timestamp"""
    timestamp_ms: int
    timestamp_formatted: str
    
    # Core posture metrics
    posture_score: float
    eye_contact: bool
    hand_movement_score: float
    fidgeting_score: float
    
    # Facial expression metrics
    facial_expressions: Dict[str, float]  # {happy, sad, angry, surprised, neutral, etc.}
    confidence_expression: float
    engagement_level: float
    smile_detected: bool
    blink_rate: float
    
    # Micro-expressions and authenticity
    micro_expression_detected: Optional[str]
    authenticity_score: float
    stress_indicators: List[str]
    
    # Detailed breakdowns
    head_pose: Dict[str, float]
    shoulder_alignment: float
    back_straightness: float
    hand_positions: List[Dict[str, float]]
    movement_velocity: float
    
    # Gesture analysis
    gesture_detected: Optional[str]
    gesture_confidence: float
    gesture_appropriateness: float

class EnhancedBodyLanguageAnalyzer:
    """Enhanced analyzer for comprehensive body language assessment"""
    
    def __init__(self, analysis_interval_ms: int = 500):
        """Initialize the enhanced body language analyzer"""
        self.analysis_interval_ms = analysis_interval_ms
        
        # Initialize MediaPipe components
        mp_pose = mp.solutions.pose
        mp_face_mesh = mp.solutions.face_mesh
        mp_hands = mp.solutions.hands
        mp_face_detection = mp.solutions.face_detection
        
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
        
        self.face_detection = mp_face_detection.FaceDetection(
            model_selection=0,
            min_detection_confidence=0.5
        )
        
        # History tracking for temporal analysis
        self.prev_landmarks = None
        self.movement_history = deque(maxlen=10)
        self.hand_movement_history = deque(maxlen=10)
        self.blink_history = deque(maxlen=30)  # Track blinks over 15 seconds at 500ms intervals
        self.expression_history = deque(maxlen=20)  # Track expressions over 10 seconds
        self.gesture_history = deque(maxlen=5)
        
        # Facial landmark indices for expressions
        self._setup_facial_landmarks()
        
        # Gesture recognition patterns
        self._setup_gesture_patterns()
        
    def _setup_facial_landmarks(self):
        """Set up facial landmark indices for expression analysis"""
        # Key facial landmarks for expression analysis
        self.facial_landmarks = {
            'left_eye': [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
            'right_eye': [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
            'mouth': [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 308],
            'eyebrows': [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
            'nose': [1, 2, 5, 4, 6, 19, 94, 168, 8, 9, 10, 151]
        }
        
    def _setup_gesture_patterns(self):
        """Set up common professional gesture patterns"""
        self.gesture_patterns = {
            'open_palm': 'Confident, trustworthy gesture',
            'pointing': 'Potentially aggressive or directive',
            'steeple': 'Confident, authoritative gesture',
            'clasped_hands': 'Formal, composed posture',
            'hand_to_face': 'Possible anxiety or thinking gesture',
            'crossed_arms': 'Defensive posture',
            'gesticulating': 'Animated, engaged communication'
        }
    
    def analyze_video(self, video_path: str) -> Tuple[List[BodyLanguageMetrics], Dict[str, float]]:
        """Analyze video for comprehensive body language metrics"""
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
        
        logger.info(f"Enhanced analysis complete: {len(timeline_data)} data points")
        return timeline_data, summary
    
    def _analyze_frame(self, frame: np.ndarray, timestamp_ms: int, timestamp_formatted: str) -> Optional[BodyLanguageMetrics]:
        """Analyze a single frame for comprehensive body language metrics"""
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Run MediaPipe inference
        pose_results = self.pose.process(rgb_frame)
        face_results = self.face_mesh.process(rgb_frame)
        hands_results = self.hands.process(rgb_frame)
        face_detection_results = self.face_detection.process(rgb_frame)
        
        if not pose_results.landmarks:
            return None
            
        try:
            # Core posture metrics
            posture_score = self._calculate_posture_score(pose_results.landmarks)
            eye_contact = self._calculate_eye_contact(face_results)
            hand_movement_score, hand_positions = self._calculate_hand_movement(hands_results)
            fidgeting_score = self._calculate_fidgeting_score(pose_results.landmarks)
            
            # Enhanced facial expression analysis
            facial_expressions = self._analyze_facial_expressions(face_results, rgb_frame)
            confidence_expression = self._calculate_confidence_expression(face_results, facial_expressions)
            engagement_level = self._calculate_engagement_level(face_results, pose_results)
            smile_detected = self._detect_smile(face_results)
            blink_rate = self._calculate_blink_rate(face_results)
            
            # Micro-expressions and authenticity
            micro_expression = self._detect_micro_expressions(face_results)
            authenticity_score = self._calculate_authenticity_score(facial_expressions, pose_results)
            stress_indicators = self._detect_stress_indicators(face_results, pose_results, hands_results)
            
            # Detailed breakdowns
            head_pose = self._calculate_head_pose(face_results)
            shoulder_alignment = self._calculate_shoulder_alignment(pose_results.landmarks)
            back_straightness = self._calculate_back_straightness(pose_results.landmarks)
            movement_velocity = self._calculate_movement_velocity(pose_results.landmarks)
            
            # Gesture analysis
            gesture_detected, gesture_confidence, gesture_appropriateness = self._analyze_gestures(
                hands_results, pose_results.landmarks
            )
            
            return BodyLanguageMetrics(
                timestamp_ms=timestamp_ms,
                timestamp_formatted=timestamp_formatted,
                posture_score=posture_score,
                eye_contact=eye_contact,
                hand_movement_score=hand_movement_score,
                fidgeting_score=fidgeting_score,
                facial_expressions=facial_expressions,
                confidence_expression=confidence_expression,
                engagement_level=engagement_level,
                smile_detected=smile_detected,
                blink_rate=blink_rate,
                micro_expression_detected=micro_expression,
                authenticity_score=authenticity_score,
                stress_indicators=stress_indicators,
                head_pose=head_pose,
                shoulder_alignment=shoulder_alignment,
                back_straightness=back_straightness,
                hand_positions=hand_positions,
                movement_velocity=movement_velocity,
                gesture_detected=gesture_detected,
                gesture_confidence=gesture_confidence,
                gesture_appropriateness=gesture_appropriateness
            )
            
        except Exception as e:
            logger.warning(f"Error calculating enhanced metrics for frame at {timestamp_formatted}: {e}")
            return None
    
    def _analyze_facial_expressions(self, face_results, rgb_frame: np.ndarray) -> Dict[str, float]:
        """Analyze facial expressions using landmark geometry"""
        if not face_results.multi_face_landmarks:
            return {"neutral": 1.0, "happy": 0.0, "sad": 0.0, "angry": 0.0, "surprised": 0.0, "fear": 0.0, "disgust": 0.0}
        
        landmarks = face_results.multi_face_landmarks[0].landmark
        
        # Calculate expression features
        mouth_curve = self._calculate_mouth_curve(landmarks)
        eyebrow_height = self._calculate_eyebrow_height(landmarks)
        eye_openness = self._calculate_eye_openness(landmarks)
        mouth_openness = self._calculate_mouth_openness(landmarks)
        
        # Simple rule-based expression classification
        expressions = {
            "neutral": 0.0,
            "happy": max(0, mouth_curve * 2),  # Positive mouth curve indicates happiness
            "sad": max(0, -mouth_curve * 1.5),  # Negative mouth curve indicates sadness
            "angry": max(0, eyebrow_height * -2),  # Low eyebrows indicate anger
            "surprised": max(0, (eye_openness - 0.5) * 2 + (mouth_openness - 0.3) * 1.5),
            "fear": max(0, (eye_openness - 0.6) * 1.5),
            "disgust": max(0, mouth_curve * -1)
        }
        
        # Normalize to sum to 1
        total = sum(expressions.values())
        if total > 0:
            expressions = {k: v/total for k, v in expressions.items()}
        else:
            expressions["neutral"] = 1.0
            
        # Keep history for temporal consistency
        self.expression_history.append(expressions)
        
        # Return smoothed expressions
        if len(self.expression_history) > 1:
            smoothed = {}
            for emotion in expressions:
                values = [hist[emotion] for hist in self.expression_history]
                smoothed[emotion] = np.mean(values)
            return smoothed
        
        return expressions
    
    def _calculate_mouth_curve(self, landmarks) -> float:
        """Calculate mouth curvature (positive = smile, negative = frown)"""
        # Mouth corners and center
        left_corner = landmarks[61]  # Left mouth corner
        right_corner = landmarks[291]  # Right mouth corner
        mouth_center = landmarks[13]  # Upper lip center
        
        # Calculate the relative height of corners vs center
        corner_avg_y = (left_corner.y + right_corner.y) / 2
        curve = mouth_center.y - corner_avg_y
        
        return np.clip(curve * 10, -1, 1)  # Scale and clip
    
    def _calculate_eyebrow_height(self, landmarks) -> float:
        """Calculate eyebrow height relative to eyes"""
        # Eyebrow points
        left_eyebrow = landmarks[70]
        right_eyebrow = landmarks[107]
        
        # Eye points
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        
        # Calculate relative height
        left_height = left_eye.y - left_eyebrow.y
        right_height = right_eye.y - right_eyebrow.y
        avg_height = (left_height + right_height) / 2
        
        return np.clip(avg_height * 5, -1, 1)
    
    def _calculate_eye_openness(self, landmarks) -> float:
        """Calculate how open the eyes are"""
        # Left eye
        left_top = landmarks[159]
        left_bottom = landmarks[145]
        left_openness = abs(left_top.y - left_bottom.y)
        
        # Right eye
        right_top = landmarks[386]
        right_bottom = landmarks[374]
        right_openness = abs(right_top.y - right_bottom.y)
        
        avg_openness = (left_openness + right_openness) / 2
        return np.clip(avg_openness * 25, 0, 1)  # Scale to 0-1
    
    def _calculate_mouth_openness(self, landmarks) -> float:
        """Calculate how open the mouth is"""
        upper_lip = landmarks[13]
        lower_lip = landmarks[14]
        openness = abs(upper_lip.y - lower_lip.y)
        return np.clip(openness * 15, 0, 1)
    
    def _calculate_confidence_expression(self, face_results, facial_expressions: Dict[str, float]) -> float:
        """Calculate confidence based on facial expression and head pose"""
        if not face_results.multi_face_landmarks:
            return 0.5
        
        # Confidence indicators
        confidence_score = 0.0
        
        # Happy expressions indicate confidence
        confidence_score += facial_expressions.get("happy", 0) * 0.3
        
        # Neutral, composed expressions also indicate confidence
        confidence_score += facial_expressions.get("neutral", 0) * 0.2
        
        # Avoid negative emotions
        confidence_score -= facial_expressions.get("fear", 0) * 0.4
        confidence_score -= facial_expressions.get("sad", 0) * 0.3
        
        # Head pose affects confidence (too much tilting reduces confidence)
        head_pose = self._calculate_head_pose(face_results)
        head_stability = 1 - (abs(head_pose["yaw"]) + abs(head_pose["roll"])) / 60
        confidence_score += head_stability * 0.3
        
        return np.clip(confidence_score, 0, 1)
    
    def _calculate_engagement_level(self, face_results, pose_results) -> float:
        """Calculate engagement level based on multiple factors"""
        engagement = 0.0
        
        # Eye contact indicates engagement
        if self._calculate_eye_contact(face_results):
            engagement += 0.4
        
        # Forward lean indicates engagement
        if pose_results.landmarks:
            shoulder_center_x = (
                pose_results.landmarks.landmark[11].x + 
                pose_results.landmarks.landmark[12].x
            ) / 2
            # Closer to camera (lower x in normalized coordinates) = more engaged
            forward_lean = max(0, 0.6 - shoulder_center_x)
            engagement += forward_lean * 0.3
        
        # Facial expressions contribute to engagement
        if face_results.multi_face_landmarks:
            landmarks = face_results.multi_face_landmarks[0].landmark
            eye_openness = self._calculate_eye_openness(landmarks)
            engagement += eye_openness * 0.3
        
        return np.clip(engagement, 0, 1)
    
    def _detect_smile(self, face_results) -> bool:
        """Detect if person is smiling"""
        if not face_results.multi_face_landmarks:
            return False
        
        landmarks = face_results.multi_face_landmarks[0].landmark
        mouth_curve = self._calculate_mouth_curve(landmarks)
        
        return mouth_curve > 0.3  # Threshold for smile detection
    
    def _calculate_blink_rate(self, face_results) -> float:
        """Calculate blink rate over recent history"""
        if not face_results.multi_face_landmarks:
            current_blink = False
        else:
            landmarks = face_results.multi_face_landmarks[0].landmark
            eye_openness = self._calculate_eye_openness(landmarks)
            current_blink = eye_openness < 0.2  # Threshold for closed eye
        
        self.blink_history.append(current_blink)
        
        # Calculate blinks per minute
        if len(self.blink_history) < 5:
            return 15.0  # Default normal blink rate
        
        # Count transitions from open to closed
        blinks = 0
        for i in range(1, len(self.blink_history)):
            if self.blink_history[i] and not self.blink_history[i-1]:
                blinks += 1
        
        # Convert to blinks per minute
        time_window_minutes = (len(self.blink_history) * self.analysis_interval_ms) / (1000 * 60)
        blinks_per_minute = blinks / time_window_minutes if time_window_minutes > 0 else 15.0
        
        return min(blinks_per_minute, 60.0)  # Cap at reasonable maximum
    
    def _detect_micro_expressions(self, face_results) -> Optional[str]:
        """Detect brief micro-expressions that might indicate deception or stress"""
        if len(self.expression_history) < 3:
            return None
        
        # Look for rapid changes in expression
        current_expr = self.expression_history[-1]
        prev_expr = self.expression_history[-2]
        
        # Calculate expression change
        max_change = 0
        changed_emotion = None
        
        for emotion in current_expr:
            change = abs(current_expr[emotion] - prev_expr[emotion])
            if change > max_change:
                max_change = change
                changed_emotion = emotion
        
        # If change is significant and brief, it might be a micro-expression
        if max_change > 0.3 and changed_emotion != "neutral":
            return f"micro_{changed_emotion}"
        
        return None
    
    def _calculate_authenticity_score(self, facial_expressions: Dict[str, float], pose_results) -> float:
        """Calculate authenticity score based on expression-posture congruence"""
        authenticity = 0.7  # Start with neutral authenticity
        
        # Check for congruence between facial expression and body posture
        positive_expressions = facial_expressions.get("happy", 0) + facial_expressions.get("neutral", 0)
        
        if pose_results.landmarks:
            # Good posture should align with positive expressions
            posture_score = self._calculate_posture_score(pose_results.landmarks)
            
            # High congruence between positive expression and good posture
            if positive_expressions > 0.6 and posture_score > 0.7:
                authenticity += 0.2
            elif positive_expressions < 0.3 and posture_score < 0.4:
                authenticity += 0.1  # Consistent negativity is also authentic
            elif abs(positive_expressions - posture_score) > 0.5:
                authenticity -= 0.3  # Large mismatch reduces authenticity
        
        return np.clip(authenticity, 0, 1)
    
    def _detect_stress_indicators(self, face_results, pose_results, hands_results) -> List[str]:
        """Detect various stress indicators"""
        stress_indicators = []
        
        # High blink rate indicates stress
        if hasattr(self, 'blink_history') and len(self.blink_history) > 0:
            recent_blink_rate = self._calculate_blink_rate(face_results)
            if recent_blink_rate > 25:  # Normal is 15-20 per minute
                stress_indicators.append("rapid_blinking")
        
        # Excessive fidgeting
        if hasattr(self, 'movement_history') and len(self.movement_history) > 0:
            avg_fidgeting = np.mean(self.movement_history)
            if avg_fidgeting > 0.7:
                stress_indicators.append("excessive_fidgeting")
        
        # Facial tension (tight expressions)
        if face_results.multi_face_landmarks:
            landmarks = face_results.multi_face_landmarks[0].landmark
            mouth_tightness = self._calculate_mouth_tightness(landmarks)
            if mouth_tightness > 0.6:
                stress_indicators.append("facial_tension")
        
        # Hand-to-face gestures
        if hands_results.multi_hand_landmarks and face_results.multi_face_landmarks:
            if self._detect_hand_to_face_gesture(hands_results, face_results):
                stress_indicators.append("hand_to_face_touching")
        
        return stress_indicators
    
    def _calculate_mouth_tightness(self, landmarks) -> float:
        """Calculate how tight/tense the mouth appears"""
        # Use mouth corner positions relative to mouth center
        left_corner = landmarks[61]
        right_corner = landmarks[291]
        mouth_width = abs(right_corner.x - left_corner.x)
        
        # Tighter mouth = smaller width relative to face
        # This is a simplified measure
        return np.clip(1 - mouth_width * 8, 0, 1)
    
    def _detect_hand_to_face_gesture(self, hands_results, face_results) -> bool:
        """Detect if hands are touching face (stress indicator)"""
        if not hands_results.multi_hand_landmarks or not face_results.multi_face_landmarks:
            return False
        
        face_landmarks = face_results.multi_face_landmarks[0].landmark
        face_center_x = face_landmarks[1].x  # Nose tip
        face_center_y = face_landmarks[1].y
        
        for hand_landmarks in hands_results.multi_hand_landmarks:
            # Check if any hand landmark is close to face
            for landmark in hand_landmarks.landmark:
                distance = math.sqrt(
                    (landmark.x - face_center_x)**2 + 
                    (landmark.y - face_center_y)**2
                )
                if distance < 0.15:  # Threshold for "touching face"
                    return True
        
        return False
    
    def _analyze_gestures(self, hands_results, pose_landmarks) -> Tuple[Optional[str], float, float]:
        """Analyze hand gestures and their appropriateness"""
        if not hands_results.multi_hand_landmarks:
            return None, 0.0, 0.5
        
        # Simple gesture recognition based on hand positions
        gesture = self._classify_gesture(hands_results, pose_landmarks)
        confidence = 0.8 if gesture else 0.0
        
        # Rate appropriateness for professional context
        appropriateness = self._rate_gesture_appropriateness(gesture)
        
        return gesture, confidence, appropriateness
    
    def _classify_gesture(self, hands_results, pose_landmarks) -> Optional[str]:
        """Classify hand gesture based on landmark positions"""
        if not hands_results.multi_hand_landmarks:
            return None
        
        # Simple gesture classification
        # This could be expanded with more sophisticated ML models
        
        hand_landmarks = hands_results.multi_hand_landmarks[0].landmark
        
        # Check for open palm (fingers extended)
        finger_tips = [4, 8, 12, 16, 20]  # Thumb, index, middle, ring, pinky tips
        finger_bases = [3, 6, 10, 14, 18]  # Corresponding bases
        
        extended_fingers = 0
        for tip, base in zip(finger_tips, finger_bases):
            if hand_landmarks[tip].y < hand_landmarks[base].y:  # Finger extended
                extended_fingers += 1
        
        if extended_fingers >= 4:
            return "open_palm"
        elif extended_fingers == 1:
            return "pointing"
        elif extended_fingers == 0:
            return "closed_fist"
        else:
            return "partial_gesture"
    
    def _rate_gesture_appropriateness(self, gesture: Optional[str]) -> float:
        """Rate how appropriate a gesture is for professional interview context"""
        if not gesture:
            return 0.7  # Neutral
        
        appropriateness_scores = {
            "open_palm": 0.9,      # Very appropriate - shows openness
            "steeple": 0.85,       # Appropriate - shows confidence
            "clasped_hands": 0.8,  # Appropriate - shows composure
            "pointing": 0.3,       # Inappropriate - can seem aggressive
            "closed_fist": 0.4,    # Somewhat inappropriate - can seem defensive
            "partial_gesture": 0.6, # Neutral
            "hand_to_face": 0.4,   # Inappropriate - shows nervousness
        }
        
        return appropriateness_scores.get(gesture, 0.5)
    
    # Include all the original methods from the previous class
    def _calculate_posture_score(self, pose_landmarks) -> float:
        """Calculate overall posture score based on spine alignment and shoulder position"""
        landmarks = pose_landmarks.landmark
        
        left_shoulder = landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
        left_hip = landmarks[mp.solutions.pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_HIP]
        nose = landmarks[mp.solutions.pose.PoseLandmark.NOSE]
        
        # Calculate shoulder levelness
        shoulder_tilt = abs(left_shoulder.y - right_shoulder.y)
        shoulder_score = max(0, 1 - shoulder_tilt * 10)
        
        # Calculate forward head posture
        shoulder_center_x = (left_shoulder.x + right_shoulder.x) / 2
        head_forward_ratio = abs(nose.x - shoulder_center_x)
        head_score = max(0, 1 - head_forward_ratio * 5)
        
        # Calculate spine alignment
        spine_alignment = abs(shoulder_center_x - ((left_hip.x + right_hip.x) / 2))
        spine_score = max(0, 1 - spine_alignment * 3)
        
        posture_score = (shoulder_score * 0.3 + head_score * 0.4 + spine_score * 0.3)
        return round(posture_score, 2)
    
    def _calculate_eye_contact(self, face_results) -> bool:
        """Determine if the person is making eye contact"""
        if not face_results.multi_face_landmarks:
            return False
            
        face_landmarks = face_results.multi_face_landmarks[0]
        landmarks = face_landmarks.landmark
        
        left_eye_center = landmarks[468]
        right_eye_center = landmarks[473]
        nose_tip = landmarks[1]
        
        eye_center_x = (left_eye_center.x + right_eye_center.x) / 2
        gaze_deviation = abs(eye_center_x - nose_tip.x)
        
        eye_center_y = (left_eye_center.y + right_eye_center.y) / 2
        vertical_deviation = abs(eye_center_y - nose_tip.y)
        
        return gaze_deviation < 0.02 and vertical_deviation < 0.03
    
    def _calculate_hand_movement(self, hands_results) -> Tuple[float, List[Dict[str, float]]]:
        """Calculate hand movement intensity and positions"""
        hand_positions = []
        
        if not hands_results.multi_hand_landmarks:
            self.hand_movement_history.append(0)
            return 0.0, hand_positions
        
        current_hand_positions = []
        
        for hand_landmarks in hands_results.multi_hand_landmarks:
            wrist = hand_landmarks.landmark[0]
            hand_pos = {"x": wrist.x, "y": wrist.y, "z": wrist.z}
            hand_positions.append(hand_pos)
            current_hand_positions.append([wrist.x, wrist.y, wrist.z])
        
        movement_score = 0.0
        if len(self.hand_movement_history) > 0 and len(current_hand_positions) > 0:
            if self.hand_movement_history[-1]:
                prev_positions = self.hand_movement_history[-1]
                
                total_movement = 0
                for i, current_pos in enumerate(current_hand_positions):
                    if i < len(prev_positions):
                        movement = np.linalg.norm(np.array(current_pos) - np.array(prev_positions[i]))
                        total_movement += movement
                
                movement_score = min(1.0, total_movement * 10)
        
        self.hand_movement_history.append(current_hand_positions)
        return round(movement_score, 2), hand_positions
    
    def _calculate_fidgeting_score(self, pose_landmarks) -> float:
        """Calculate fidgeting score based on small, frequent movements"""
        landmarks = pose_landmarks.landmark
        
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
            
            avg_movement = total_movement / len(current_positions)
            fidgeting_score = min(1.0, avg_movement * 20)
        
        self.prev_landmarks = current_positions
        self.movement_history.append(fidgeting_score)
        
        smoothed_score = np.mean(self.movement_history) if self.movement_history else 0.0
        return round(smoothed_score, 2)
    
    def _calculate_head_pose(self, face_results) -> Dict[str, float]:
        """Calculate head pose angles"""
        if not face_results.multi_face_landmarks:
            return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}
        
        landmarks = face_results.multi_face_landmarks[0].landmark
        
        nose_tip = np.array([landmarks[1].x, landmarks[1].y, landmarks[1].z])
        chin = np.array([landmarks[18].x, landmarks[18].y, landmarks[18].z])
        left_eye = np.array([landmarks[33].x, landmarks[33].y, landmarks[33].z])
        right_eye = np.array([landmarks[263].x, landmarks[263].y, landmarks[263].z])
        
        eye_center = (left_eye + right_eye) / 2
        yaw = math.atan2(nose_tip[0] - eye_center[0], abs(nose_tip[2] - eye_center[2])) * 180 / math.pi
        pitch = math.atan2(nose_tip[1] - chin[1], abs(nose_tip[2] - chin[2])) * 180 / math.pi
        roll = math.atan2(right_eye[1] - left_eye[1], right_eye[0] - left_eye[0]) * 180 / math.pi
        
        return {"yaw": round(yaw, 2), "pitch": round(pitch, 2), "roll": round(roll, 2)}
    
    def _calculate_shoulder_alignment(self, pose_landmarks) -> float:
        """Calculate shoulder alignment"""
        landmarks = pose_landmarks.landmark
        left_shoulder = landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
        
        height_diff = abs(left_shoulder.y - right_shoulder.y)
        alignment_score = max(0, 1 - height_diff * 10)
        return round(alignment_score, 2)
    
    def _calculate_back_straightness(self, pose_landmarks) -> float:
        """Calculate back straightness"""
        landmarks = pose_landmarks.landmark
        
        left_shoulder = landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER]
        left_hip = landmarks[mp.solutions.pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks[mp.solutions.pose.PoseLandmark.RIGHT_HIP]
        
        shoulder_center = [(left_shoulder.x + right_shoulder.x) / 2, (left_shoulder.y + right_shoulder.y) / 2]
        hip_center = [(left_hip.x + right_hip.x) / 2, (left_hip.y + right_hip.y) / 2]
        
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
        velocity = min(1.0, avg_movement * 50)
        
        self.prev_pose_landmarks = pose_landmarks
        return round(velocity, 2)
    
    def _calculate_summary(self, timeline_data: List[BodyLanguageMetrics], duration_ms: float) -> Dict[str, float]:
        """Calculate comprehensive summary metrics"""
        if not timeline_data:
            return self._get_empty_summary(duration_ms)
        
        # Calculate averages for all metrics
        avg_posture = np.mean([d.posture_score for d in timeline_data])
        eye_contact_frames = sum(1 for d in timeline_data if d.eye_contact)
        eye_contact_percentage = (eye_contact_frames / len(timeline_data)) * 100
        avg_hand_movement = np.mean([d.hand_movement_score for d in timeline_data])
        avg_fidgeting = np.mean([d.fidgeting_score for d in timeline_data])
        
        # Facial expression metrics
        avg_confidence_expression = np.mean([d.confidence_expression for d in timeline_data])
        avg_engagement = np.mean([d.engagement_level for d in timeline_data])
        smile_frames = sum(1 for d in timeline_data if d.smile_detected)
        smile_frequency = (smile_frames / len(timeline_data)) * 100
        
        # Find dominant emotion
        emotion_totals = {}
        for data in timeline_data:
            for emotion, score in data.facial_expressions.items():
                emotion_totals[emotion] = emotion_totals.get(emotion, 0) + score
        dominant_emotion = max(emotion_totals, key=emotion_totals.get) if emotion_totals else "neutral"
        
        # Calculate gesture alignment (simplified)
        gesture_frames = sum(1 for d in timeline_data if d.gesture_detected)
        gesture_speech_alignment = min(1.0, gesture_frames / len(timeline_data) * 2)  # Simplified metric
        
        # Overall scores
        overall_body_language = (
            avg_posture * 0.25 +
            (eye_contact_percentage / 100) * 0.25 +
            (1 - avg_hand_movement) * 0.15 +
            (1 - avg_fidgeting) * 0.15 +
            avg_engagement * 0.2
        )
        
        overall_facial_expression = (
            avg_confidence_expression * 0.4 +
            avg_engagement * 0.3 +
            (smile_frequency / 100) * 0.3
        )
        
        overall_professionalism = (
            overall_body_language * 0.4 +
            overall_facial_expression * 0.3 +
            gesture_speech_alignment * 0.3
        )
        
        return {
            "avg_posture_score": round(avg_posture, 2),
            "eye_contact_percentage": round(eye_contact_percentage, 2),
            "avg_hand_movement_score": round(avg_hand_movement, 2),
            "avg_fidgeting_score": round(avg_fidgeting, 2),
            "avg_confidence_expression": round(avg_confidence_expression, 2),
            "avg_engagement_score": round(avg_engagement, 2),
            "smile_frequency": round(smile_frequency, 2),
            "dominant_emotion": dominant_emotion,
            "gesture_speech_alignment": round(gesture_speech_alignment, 2),
            "overall_body_language_score": round(overall_body_language, 2),
            "overall_facial_expression_score": round(overall_facial_expression, 2),
            "overall_professionalism_score": round(overall_professionalism, 2),
            "total_duration": duration_ms / 1000,
            "total_frames": len(timeline_data)
        }
    
    def _get_empty_summary(self, duration_ms: float) -> Dict[str, float]:
        """Return empty summary when no data is available"""
        return {
            "avg_posture_score": 0.0,
            "eye_contact_percentage": 0.0,
            "avg_hand_movement_score": 0.0,
            "avg_fidgeting_score": 0.0,
            "avg_confidence_expression": 0.0,
            "avg_engagement_score": 0.0,
            "smile_frequency": 0.0,
            "dominant_emotion": "neutral",
            "gesture_speech_alignment": 0.0,
            "overall_body_language_score": 0.0,
            "overall_facial_expression_score": 0.0,
            "overall_professionalism_score": 0.0,
            "total_duration": duration_ms / 1000,
            "total_frames": 0
        }
    
    def _format_timestamp(self, timestamp_ms: int) -> str:
        """Format timestamp in HH:MM:SS.mmm format"""
        total_seconds = timestamp_ms // 1000
        milliseconds = timestamp_ms % 1000
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"
    
    def get_enhanced_highlights(self, timeline_data: List[BodyLanguageMetrics]) -> Dict[str, List[Dict]]:
        """Extract enhanced highlights from the analysis"""
        if not timeline_data:
            return {"poor_moments": [], "excellent_moments": [], "problem_areas": [], "strengths": []}
        
        poor_moments = []
        excellent_moments = []
        problem_areas = []
        strengths = []
        
        # Find moments with poor body language
        for data in timeline_data:
            overall_score = (data.posture_score + data.confidence_expression + data.engagement_level) / 3
            if overall_score < 0.4:
                poor_moments.append({
                    "timestamp": data.timestamp_formatted,
                    "timestamp_ms": data.timestamp_ms,
                    "score": round(overall_score, 2),
                    "description": self._describe_poor_moment(data)
                })
        
        # Find excellent moments
        for data in timeline_data:
            if (data.posture_score > 0.8 and data.eye_contact and 
                data.confidence_expression > 0.7 and data.engagement_level > 0.7):
                excellent_moments.append({
                    "timestamp": data.timestamp_formatted,
                    "timestamp_ms": data.timestamp_ms,
                    "description": "Excellent professional presence - great posture, eye contact, and confidence"
                })
        
        # Analyze problem areas
        avg_posture = np.mean([d.posture_score for d in timeline_data])
        avg_fidgeting = np.mean([d.fidgeting_score for d in timeline_data])
        avg_confidence = np.mean([d.confidence_expression for d in timeline_data])
        eye_contact_percentage = (sum(1 for d in timeline_data if d.eye_contact) / len(timeline_data)) * 100
        
        if avg_posture < 0.6:
            problem_areas.append("Posture needs improvement - focus on sitting/standing straighter")
        if avg_fidgeting > 0.6:
            problem_areas.append("Excessive fidgeting detected - practice staying still and composed")
        if eye_contact_percentage < 60:
            problem_areas.append("Limited eye contact - practice looking at the camera more frequently")
        if avg_confidence < 0.5:
            problem_areas.append("Low confidence expression - work on projecting more self-assurance")
        
        # Identify strengths
        if avg_posture > 0.7:
            strengths.append("Good posture maintenance throughout the interview")
        if eye_contact_percentage > 70:
            strengths.append("Excellent eye contact - shows engagement and confidence")
        if avg_confidence > 0.7:
            strengths.append("Strong confident expression - projects professional competence")
        
        return {
            "poor_moments": sorted(poor_moments, key=lambda x: x["score"])[:3],
            "excellent_moments": excellent_moments[:3],
            "problem_areas": problem_areas,
            "strengths": strengths
        }
    
    def _describe_poor_moment(self, data: BodyLanguageMetrics) -> str:
        """Describe what made a moment poor in terms of body language"""
        issues = []
        
        if data.posture_score < 0.4:
            issues.append("poor posture")
        if not data.eye_contact:
            issues.append("lack of eye contact")
        if data.fidgeting_score > 0.7:
            issues.append("excessive fidgeting")
        if data.confidence_expression < 0.3:
            issues.append("low confidence expression")
        if data.engagement_level < 0.3:
            issues.append("low engagement")
        
        if not issues:
            return "Overall body language needs improvement"
        
        return "Issues detected: " + ", ".join(issues)
    
    def get_enhanced_recommendations(self, summary: Dict[str, float]) -> List[str]:
        """Generate comprehensive improvement recommendations"""
        recommendations = []
        
        # Posture recommendations
        if summary["avg_posture_score"] < 0.6:
            recommendations.append("Focus on maintaining better posture - keep your back straight, shoulders relaxed, and avoid slouching")
        
        # Eye contact recommendations
        if summary["eye_contact_percentage"] < 60:
            recommendations.append("Practice maintaining eye contact with the camera - aim for 60-80% of the time to show engagement")
        
        # Fidgeting recommendations
        if summary["avg_fidgeting_score"] > 0.6:
            recommendations.append("Work on minimizing fidgeting - practice keeping your hands still or in purposeful positions")
        
        # Facial expression recommendations
        if summary["avg_confidence_expression"] < 0.5:
            recommendations.append("Work on projecting confidence through facial expressions - practice speaking with conviction")
        
        if summary["avg_engagement_score"] < 0.5:
            recommendations.append("Show more engagement through facial expressions and body language - lean slightly forward and maintain alert expressions")
        
        # Gesture recommendations
        if summary["gesture_speech_alignment"] < 0.4:
            recommendations.append("Use purposeful hand gestures that align with your speech - avoid random or nervous movements")
        
        # Overall professionalism
        if summary["overall_professionalism_score"] < 0.6:
            recommendations.append("Focus on overall professional presence - combine good posture, appropriate expressions, and purposeful gestures")
        
        # Positive reinforcement
        if not recommendations:
            recommendations.append("Excellent body language! Continue maintaining your professional and confident presence")
        elif summary["overall_professionalism_score"] > 0.7:
            recommendations.append("Great job on professional presence! Focus on the specific areas mentioned above for even better results")
        
        return recommendations
    
    def cleanup(self):
        """Clean up MediaPipe resources"""
        if hasattr(self, 'pose'):
            self.pose.close()
        if hasattr(self, 'face_mesh'):
            self.face_mesh.close()
        if hasattr(self, 'hands'):
            self.hands.close()
        if hasattr(self, 'face_detection'):
            self.face_detection.close()