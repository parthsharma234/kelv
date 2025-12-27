import * as poseDetection from '@tensorflow-models/pose-detection';
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

export interface PostureMetrics {
  shoulderAlignment: number;   // 0-100
  headPosition: 'centered' | 'forward' | 'tilted';
  isGoodPosture: boolean;
  confidence: number;          // 0-1 average confidence
  timestamp: number;           // Date.now()
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
        timestamp
      };
    }

    // Calculate shoulder alignment (0-100, where 100 = perfectly horizontal)
    const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y);
    const shoulderAlignment = Math.max(0, Math.min(100, Math.round(100 - (shoulderSlope * 400))));

    // Calculate head position
    let headPosition: 'centered' | 'forward' | 'tilted' = 'centered';

    if (hasEars) {
      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const avgEarY = (leftEar.y + rightEar.y) / 2;
      const earDiff = Math.abs(leftEar.y - rightEar.y);

      // Head tilted if ears are at significantly different heights
      if (earDiff > 0.05) {
        headPosition = 'tilted';
      }
      // Head forward if ears are significantly below shoulder line
      // (in normalized coords, larger Y = lower on screen)
      else if (avgEarY > avgShoulderY + 0.1) {
        headPosition = 'forward';
      }
    }

    // Good posture: shoulders aligned and head centered
    const isGoodPosture = shoulderAlignment > 70 && headPosition === 'centered';

    return {
      shoulderAlignment,
      headPosition,
      isGoodPosture,
      confidence: avgConfidence,
      timestamp
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
