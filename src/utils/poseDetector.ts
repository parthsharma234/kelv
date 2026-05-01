import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// MoveNet keypoint indices
const KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16
} as const;

export interface PoseKeypoint {
  name: string;
  x: number;      // 0-1 normalized
  y: number;      // 0-1 normalized
  score: number;  // Confidence 0-1
}

export interface PostureGeometry {
  shoulderTiltDeg: number;
  headOffsetPct: number;
  torsoLeanDeg: number;
  shoulderWidthPct: number;
}

export interface PostureMetrics {
  shoulderAlignment: number;   // 0-100
  headPosition: 'centered' | 'forward' | 'tilted';
  isGoodPosture: boolean;
  confidence: number;          // 0-1 average confidence
  timestamp: number;           // Date.now()
  keypoints?: PoseKeypoint[];
  geometry?: PostureGeometry;
}

export interface PoseDetector {
  initialize(): Promise<boolean>;
  detectPose(video: HTMLVideoElement): Promise<PoseKeypoint[] | null>;
  analyzePosture(keypoints: PoseKeypoint[]): PostureMetrics;
  dispose(): void;
  isReady(): boolean;
}

class MoveNetPoseDetector implements PoseDetector {
  private detector: poseDetection.PoseDetector | null = null;
  private ready = false;
  private initPromise: Promise<boolean> | null = null;

  async initialize(): Promise<boolean> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.ready) {
      return true;
    }

    this.initPromise = this.doInitialize();
    const result = await this.initPromise;
    this.initPromise = null;
    return result;
  }

  private async doInitialize(): Promise<boolean> {
    try {
      console.log('[PoseDetector] Initializing MoveNet Lightning...');
      await tf.setBackend('webgl');
      await tf.ready();

      const model = poseDetection.SupportedModels.MoveNet;
      this.detector = await poseDetection.createDetector(model, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true
      });

      this.ready = true;
      console.log('[PoseDetector] MoveNet initialized successfully');
      return true;
    } catch (error) {
      console.error('[PoseDetector] Failed to initialize MoveNet:', error);
      this.ready = false;
      return false;
    }
  }

  async detectPose(video: HTMLVideoElement): Promise<PoseKeypoint[] | null> {
    if (!this.detector || !this.ready) {
      return null;
    }

    // Skip if video not ready
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    try {
      const poses = await this.detector.estimatePoses(video, {
        flipHorizontal: false
      });

      if (poses.length === 0 || !poses[0].keypoints) {
        return null;
      }

      return poses[0].keypoints.map(kp => ({
        name: kp.name || '',
        x: kp.x / video.videoWidth,
        y: kp.y / video.videoHeight,
        score: kp.score || 0
      }));
    } catch (error) {
      console.warn('[PoseDetector] Detection error:', error);
      return null;
    }
  }

  analyzePosture(keypoints: PoseKeypoint[]): PostureMetrics {
    const timestamp = Date.now();

    // Get relevant keypoints with confidence check
    const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
    const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
    const leftEar = keypoints[KEYPOINTS.LEFT_EAR];
    const rightEar = keypoints[KEYPOINTS.RIGHT_EAR];
    const nose = keypoints[KEYPOINTS.NOSE];

    // Check if we have enough confidence in key points
    const minConfidence = 0.3;
    const hasShoulders = leftShoulder?.score > minConfidence && rightShoulder?.score > minConfidence;
    const hasEars = leftEar?.score > minConfidence && rightEar?.score > minConfidence;

    // Calculate average confidence of key points
    const relevantPoints = [leftShoulder, rightShoulder, leftEar, rightEar, nose].filter(p => p);
    const avgConfidence = relevantPoints.length > 0
      ? relevantPoints.reduce((sum, p) => sum + (p?.score || 0), 0) / relevantPoints.length
      : 0;

    // Default values for low confidence
    if (!hasShoulders) {
      return {
        shoulderAlignment: 50,
        headPosition: 'centered',
        isGoodPosture: false,
        confidence: avgConfidence,
        timestamp,
        keypoints,
        geometry: {
          shoulderTiltDeg: 0,
          headOffsetPct: 0,
          torsoLeanDeg: 0,
          shoulderWidthPct: 0
        }
      };
    }

    const shoulderDx = rightShoulder.x - leftShoulder.x;
    const shoulderDy = rightShoulder.y - leftShoulder.y;
    const shoulderTiltDeg = Math.abs(Math.atan2(shoulderDy, shoulderDx) * 180 / Math.PI);
    const shoulderAlignment = Math.max(0, Math.min(100, Math.round(100 - (shoulderTiltDeg / 18) * 100)));

    const leftHip = keypoints[KEYPOINTS.LEFT_HIP];
    const rightHip = keypoints[KEYPOINTS.RIGHT_HIP];
    const hasHips = leftHip?.score > minConfidence && rightHip?.score > minConfidence;
    const shoulderCenter = midpoint(leftShoulder, rightShoulder);
    const hipCenter = hasHips ? midpoint(leftHip, rightHip) : { x: shoulderCenter.x, y: Math.min(1, shoulderCenter.y + 0.34) };
    const torsoLeanDeg = Math.atan2(shoulderCenter.x - hipCenter.x, Math.max(0.001, hipCenter.y - shoulderCenter.y)) * 180 / Math.PI;
    const headAnchor = nose?.score > minConfidence ? nose : hasEars ? midpoint(leftEar, rightEar) : shoulderCenter;
    const shoulderWidth = Math.max(0.001, Math.abs(rightShoulder.x - leftShoulder.x));
    const headOffsetPct = ((headAnchor.x - shoulderCenter.x) / shoulderWidth) * 100;

    // Calculate head position
    let headPosition: 'centered' | 'forward' | 'tilted' = 'centered';

    if (hasEars) {
      const avgEarY = (leftEar.y + rightEar.y) / 2;
      const earTiltDeg = Math.abs(Math.atan2(rightEar.y - leftEar.y, rightEar.x - leftEar.x) * 180 / Math.PI);

      // Head tilted if ears are at significantly different heights
      if (earTiltDeg > 10 || Math.abs(headOffsetPct) > 26) {
        headPosition = 'tilted';
      }
      // Head forward if ears are significantly below shoulder line
      // (in normalized coords, larger Y = lower on screen)
      else if (avgEarY > shoulderCenter.y + 0.1 || Math.abs(torsoLeanDeg) > 12) {
        headPosition = 'forward';
      }
    }

    // Good posture: shoulders aligned and head centered
    const isGoodPosture = shoulderAlignment > 70 && headPosition === 'centered' && Math.abs(torsoLeanDeg) < 12;

    return {
      shoulderAlignment,
      headPosition,
      isGoodPosture,
      confidence: avgConfidence,
      timestamp,
      keypoints,
      geometry: {
        shoulderTiltDeg: round1(shoulderTiltDeg),
        headOffsetPct: round1(headOffsetPct),
        torsoLeanDeg: round1(torsoLeanDeg),
        shoulderWidthPct: round1(shoulderWidth * 100)
      }
    };
  }

  dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
    }
    this.ready = false;
    console.log('[PoseDetector] Disposed');
  }

  isReady(): boolean {
    return this.ready;
  }
}

// Factory function for easy instantiation
export function createPoseDetector(): PoseDetector {
  return new MoveNetPoseDetector();
}

function midpoint(a: PoseKeypoint, b: PoseKeypoint): { x: number; y: number } {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
