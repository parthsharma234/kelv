import type { CameraPresence, PostureScore, VoiceMetricsSummary } from '../types/analytics';

interface OverallScoreInput {
  /**
   * Base score derived from response analysis or other metrics.
   * Can be in 0-10 or 0-100 range.
   */
  responseScore: number;
  cameraPresence?: CameraPresence;
  posture?: PostureScore;
  voice?: VoiceMetricsSummary;
}

/**
 * Calculate an overall interview score by combining response analysis,
 * camera presence metrics, and posture confidence.
 * Returns a score in 0-100 range.
 */
export function calculateOverallScore({ responseScore, cameraPresence, posture, voice }: OverallScoreInput): number {
  // Normalize base score to 0-100
  const base = responseScore > 10 ? responseScore : responseScore * 10;

  // Average available camera metrics, defaulting to neutral 0.5 if missing
  let cameraScore = 50; // default neutral percentage
  if (cameraPresence) {
    const metrics = [
      cameraPresence.lighting,
      cameraPresence.eyeContact,
      cameraPresence.facialExpressiveness ?? 0.5,
      cameraPresence.headPositionStability ?? 0.5,
      cameraPresence.framing ?? 0.5,
      cameraPresence.blinkRate ?? 0.5,
    ];
    cameraScore = (metrics.reduce((sum, v) => sum + v, 0) / metrics.length) * 100;
  }

  // Convert posture confidence to percentage
  const postureScore = posture ? posture.confidence * 100 : 50;

  // Average voice metrics if available
  let voiceScore = 50;
  if (voice) {
    const v: number[] = [];
    if (voice.speechRate !== undefined) {
      const rate = Math.max(60, Math.min(200, voice.speechRate));
      const ideal = 150;
      const rateScore = Math.max(0, 100 - Math.abs(rate - ideal) * 2);
      v.push(rateScore);
    }
    if (voice.fluencyScore !== undefined) v.push(voice.fluencyScore);
    if (voice.voiceConfidence !== undefined) v.push(voice.voiceConfidence);
    if (voice.deliveryScore !== undefined) v.push(voice.deliveryScore);
    if (voice.clarityScore !== undefined) v.push(voice.clarityScore);
    if (voice.fillerWordCount !== undefined) {
      const fillerScore = Math.max(0, 100 - voice.fillerWordCount * 10);
      v.push(fillerScore);
    }
    if (v.length > 0) {
      voiceScore = v.reduce((sum, n) => sum + n, 0) / v.length;
    }
  }

  // Weighted average: responses 40%, voice 25%, camera 20%, posture 15%
  const overall = base * 0.4 + voiceScore * 0.25 + cameraScore * 0.2 + postureScore * 0.15;
  return Math.round(overall);
}

export default calculateOverallScore;
