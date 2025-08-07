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
