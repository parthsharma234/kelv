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
  attentiveness: number; // 0..1 placeholder
  facialExpressiveness?: number; // 0..1 placeholder
  headPositionStability?: number; // 0..1 placeholder
  framing?: number; // 0..1 placeholder
  blinkRate?: number; // 0..1 placeholder
  suggestions: string[]; // Actionable feedback
}

export interface PostureScore {
  confidence: number; // 0..1, higher means better posture
  suggestions: string[]; // Actionable posture tips
}

export interface CameraTimelinePoint {
  timestamp: number;
  cameraPresence: CameraPresence;
  posture: PostureScore;
}

export interface VerbalFeedback {
  fillerCount: number;
  sentiment: number; // 0..1 where 0.5 is neutral
  suggestions: string[]; // Improvement suggestions
}
