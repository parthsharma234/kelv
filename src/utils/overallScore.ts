import type { CameraPresence, PostureScore } from '../types/analytics';

interface OverallScoreInput {
  /**
   * Base score derived from response analysis or other metrics.
   * Can be in 0-10 or 0-100 range.
   */
  responseScore: number;
  cameraPresence?: CameraPresence;
  posture?: PostureScore;
}

/**
 * Calculate an overall interview score by combining response analysis,
 * camera presence metrics, and posture confidence.
 * Returns a score in 0-100 range.
 */
export function calculateOverallScore({ responseScore, cameraPresence, posture }: OverallScoreInput): number {
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

  // Weighted average: responses 60%, camera 25%, posture 15%
  const overall = base * 0.6 + cameraScore * 0.25 + postureScore * 0.15;
  return Math.round(overall);
}

export default calculateOverallScore;
