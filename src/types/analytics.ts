import { LucideIcon } from 'lucide-react';

export interface Metric {
  name: string;
  score: number;
  icon: LucideIcon;
  color: string;
  improvement: string;
  description: string;
}

export interface CameraPresence {
  lighting: number; // 0..1
  eyeContact: number; // 0..1
  smile: number; // 0..1 placeholder
  smileFrequency?: number; // 0..1, proportion of time smiling
  gestureMagnitude?: number; // 0..1, average hand/pose movement
  attentiveness: number; // 0..1 placeholder
  facialExpressiveness?: number; // 0..1 placeholder
  headPositionStability?: number; // 0..1 placeholder
  framing?: number; // 0..1 placeholder
  blinkRate?: number; // 0..1 placeholder
  distance?: number; // 0..1, ideal face size relative to frame
  offFrame?: number; // 0..1, percentage of time face is off frame
  suggestions: string[]; // Actionable feedback
  triggers?: string[]; // Threshold messages with durations
  confidenceTips?: string[]; // Combined confidence coaching cues
  debug?: {
    faceBox?: { x: number; y: number; width: number; height: number };
    faceCenter?: { x: number; y: number };
    frameSize?: { width: number; height: number };
    faceRatio?: number;
    idealFaceRatio?: number;
  };
}

export interface PostureScore {
  confidence: number; // 0..1, higher means better posture
  suggestions: string[]; // Actionable posture tips
}

export interface CameraTimelinePoint {
  timestamp: number;
  cameraPresence: CameraPresence;
  posture: PostureScore;
  triggers?: string[];
  // Extended optional CV signals for overlays and chips
  vision?: VisionFrameFeatures;
  temporal?: VisionTemporalSummary;
}

export interface VoiceMetricsSummary {
  speechRate?: number; // words per minute
  fluencyScore?: number; // 0-100
  voiceConfidence?: number; // 0-100
  deliveryScore?: number; // 0-100
  clarityScore?: number; // 0-100
  fillerWordCount?: number; // count
  vocalEnergy?: number; // 0-100 average vocal energy
  sentimentPaceBalance?: number; // 0-100 balance of sentiment vs pace
  confidenceTips?: string[]; // Voice-related confidence tips
}

export interface VerbalFeedback {
  fillerCount: number;
  sentiment: number; // 0..1 where 0.5 is neutral
  suggestions: string[]; // Improvement suggestions
}

// ====== CV: Extended, temporal-aware feature schemas ======

export interface HeadPose {
  // degrees
  yaw: number;
  pitch: number;
  roll: number;
}

export interface EyeGaze {
  // normalized offsets of iris center relative to each eye box center, [-1, 1]
  leftOffsetX: number;
  leftOffsetY: number;
  rightOffsetX: number;
  rightOffsetY: number;
  // instantaneous probability of looking at camera [0..1]
  onCameraProb: number;
}

export interface ActionUnits {
  // 0..1 heuristic intensities for a subset of AUs
  AU01: number; // inner brow raiser
  AU04: number; // brow lowerer
  AU06: number; // cheek raiser
  AU07: number; // lid tightener
  AU12: number; // lip corner puller (smile)
  AU14?: number; // dimpler (optional)
}

export interface PosePostureMetrics {
  shoulderTiltDeg?: number; // lateral tilt from shoulders
  slouchScore?: number; // 0..1, higher worse
  leanForwardScore?: number; // 0..1, forward leaning
}

export interface GestureMetrics {
  magnitude: number; // 0..1 average movement magnitude
  classification?: 'low' | 'medium' | 'high' | 'emphatic';
}

export interface TemporalStats {
  headPoseStabilityStd: {
    yaw: number; pitch: number; roll: number;
  };
  gazeDispersionEntropy: number; // 0..1 normalized entropy of gaze direction
  microExpressionsPerMin: number;
  changePoints: Array<{ t: number; signal: 'head' | 'gaze' | 'au'; magnitude: number }>;
  gazeOnCameraPercent?: number; // percent over rolling window
}

export interface VisionFrameFeatures {
  landmarks2D?: Array<{ x: number; y: number }>; // Face Mesh 2D
  poseLandmarks?: Array<{ x: number; y: number; z?: number; visibility?: number }>;
  headPose?: HeadPose;
  eyeGaze?: EyeGaze;
  actionUnits?: ActionUnits;
  posture?: PosePostureMetrics;
  gestures?: GestureMetrics;
}

export interface VisionTemporalSummary extends TemporalStats {
  // rolling aggregates
  avgEyeContact?: number;
  avgBlinkRate?: number;
}

export interface CompoundSignals {
  lowConfidence?: boolean;
  highEngagement?: boolean;
  negativeSentiment?: boolean;
  notes?: string[];
}