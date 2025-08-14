import type { FusionScores, CompoundSignals } from '../types/analytics';
import type { VoiceMetrics } from './speechAnalysis';

export type VisionFusionInputs = {
  eyeContact?: number;
  distance?: number;
  blinkRate?: number;
  facialExpressiveness?: number;
  gesturesMagnitude?: number;
  posture?: { slouchScore?: number; leanForwardScore?: number } | null;
  temporal?: { gazeOnCameraPercent?: number } | null;
};

export function fuseVoiceAndVision(
  voice: VoiceMetrics | null | undefined,
  vision: VisionFusionInputs
): FusionScores {
  const v = voice || null;
  const eye = vision.eyeContact ?? 0.5;
  const onCam = vision.temporal?.gazeOnCameraPercent ?? eye;
  const gesture = vision.gesturesMagnitude ?? (vision.facialExpressiveness ?? 0.4);
  const slouch = vision.posture?.slouchScore ?? 0.3;
  const lean = vision.posture?.leanForwardScore ?? 0.5;

  // Confidence: blend voiceConfidence with on-camera gaze and posture
  const voiceConf = v ? v.voiceConfidence : 60;
  const confidence = Math.max(0, Math.min(100,
    0.6 * voiceConf + 20 * onCam + 10 * (1 - slouch) + 10 * (lean > 0.5 ? 0.7 : 0.5)
  ));

  // Clarity: rely on clarityScore and eye contact
  const clarity = Math.max(0, Math.min(100,
    (v ? 0.85 * v.clarityScore : 60) + 15 * Math.max(0, eye - 0.5)
  ));

  // Warmth: smile/expressiveness proxy via gesturesMagnitude and energy
  const energy = v ? v.energyAnalysis.averageEnergy : 0.3;
  const warmth = Math.max(0, Math.min(100,
    50 + 25 * gesture + 25 * Math.min(1, energy * 2)
  ));

  // Engagement: delivery, speech rate in range, gestures, gaze stability
  const inRange = v ? (v.speechRate >= 130 && v.speechRate <= 180 ? 1 : 0.7) : 0.8;
  const delivery = v ? v.deliveryScore : 60;
  const engagement = Math.max(0, Math.min(100,
    0.5 * delivery + 20 * inRange + 15 * gesture + 15 * onCam
  ));

  const compound: CompoundSignals = {};
  // Low confidence: low energy and downward gaze
  if ((v ? v.energyAnalysis.averageEnergy < 0.15 : true) && eye < 0.45) {
    compound.lowConfidence = true;
  }
  // High engagement: upright posture + strong gestures + smile proxy
  if ((1 - slouch) > 0.7 && gesture > 0.6 && onCam > 0.6) {
    compound.highEngagement = true;
  }

  const notes: string[] = [];
  if (compound.lowConfidence) notes.push('Low energy + poor gaze suggests lower confidence.');
  if (compound.highEngagement) notes.push('Good posture, gestures, and gaze indicate high engagement.');
  if (notes.length) compound.notes = notes;

  return { confidence, clarity, warmth, engagement, compound };
}



