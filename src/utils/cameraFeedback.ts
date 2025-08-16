import type { CameraPresence, PostureScore } from '../types/analytics';
import { FaceDetection } from '@mediapipe/face_detection';
import { Pose } from '@mediapipe/pose';
import * as faceapi from 'face-api.js';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Lightweight Kalman filter for smoothing noisy metrics
class KalmanFilter {
  private q: number;
  private r: number;
  private x: number;
  private p: number;
  private k: number;

  constructor(q = 0.01, r = 0.1, x = 0, p = 1) {
    this.q = q; // process noise
    this.r = r; // measurement noise
    this.x = x; // estimated value
    this.p = p; // estimation error covariance
    this.k = 0; // kalman gain
  }

  filter(measurement: number): number {
    // prediction update
    this.p += this.q;
    // measurement update
    this.k = this.p / (this.p + this.r);
    this.x += this.k * (measurement - this.x);
    this.p *= 1 - this.k;
    return this.x;
  }
}

// MediaPipe detectors (initialized lazily)
// Worker integration for advanced CV analysis
let cameraWorker: Worker | null = null;

function initWorker() {
  if (!cameraWorker) {
    cameraWorker = new Worker(new URL('../workers/cameraWorker.ts', import.meta.url), { type: 'module' });
    cameraWorker.postMessage({ type: 'init' });
  }
}

async function analyzeWithWorker(frame: ImageBitmap, width: number, height: number, faceBox?: { x: number; y: number; width: number; height: number } | null): Promise<any> {
  initWorker();
  return new Promise(resolve => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'metrics') {
        cameraWorker?.removeEventListener('message', handleMessage);
        resolve(e.data);
      }
    };
    cameraWorker?.addEventListener('message', handleMessage);
    cameraWorker?.postMessage({ type: 'analyze', frame, width, height, faceBox });
  });
}

// Persist basic state between frames for temporal metrics
let prevCenter: { x: number; y: number } | null = null;
let prevFaceData: Uint8ClampedArray | null = null;
let prevEyeBrightness = 0;
let blinkCount = 0;
let totalFrames = 0;
let smileFrames = 0;
let prevPose: { leftWrist?: { x: number; y: number }; rightWrist?: { x: number; y: number } } = {};
const blinkStart = Date.now();

// Smoothing filters
const eyeContactKF = new KalmanFilter();
const lightingKF = new KalmanFilter();
const distanceKF = new KalmanFilter();
const gestureKF = new KalmanFilter();

/**
 * Basic camera presence analysis using Canvas API.
 * Evaluates lighting by averaging pixel brightness and
 * estimates eye contact based on face position if the
 * browser FaceDetector API is available.
 */
export async function analyzeCameraPresence(video: HTMLVideoElement): Promise<CameraPresence> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
  const data = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;
  let lighting = 0;
  if (data) {
    for (let i = 0; i < data.length; i += 4) {
      lighting += data[i] + data[i + 1] + data[i + 2];
    }
    // Average RGB brightness and normalise to 0..1 range
    lighting = lighting / (data.length / 4) / (255 * 3);
    lighting = Math.min(Math.max(lighting, 0), 1);
  }
  lighting = lightingKF.filter(lighting);

  // Initialize metrics to defaults
  let eyeContact = 0.5;
  let framing = 0.5;
  let headPositionStability = 1;
  let facialExpressiveness = 0.5;
  let blinkRate = 0.4;
  let distance = 0.6;
  let offFrame = 0;
  let gestureMagnitude = 0.4;
  let smileScore = 0.4;
  let smileFrequency = 0;
  let lastBoundingBox: { x: number; y: number; width: number; height: number } | null = null;

  // First, detect face box for worker input
  try {
    if ('FaceDetector' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).FaceDetector();
      const faces = await detector.detect(canvas);
      if (faces && faces.length > 0) {
        const box = faces[0].boundingBox;
        lastBoundingBox = { x: box.x, y: box.y, width: box.width, height: box.height };
      }
    }
  } catch {
    /* ignore */
  }

  // Use worker for advanced analysis with faceBox
  try {
    const bitmap = await createImageBitmap(ctx!.getImageData(0, 0, canvas.width, canvas.height));
    const workerResult = await analyzeWithWorker(bitmap, canvas.width, canvas.height, lastBoundingBox);
    bitmap.close();

    // Update metrics from worker, overriding defaults
    if (workerResult.eyeContact !== undefined) eyeContact = workerResult.eyeContact;
    if (workerResult.framing !== undefined) framing = workerResult.framing;
    if (workerResult.headPositionStability !== undefined) headPositionStability = workerResult.headPositionStability;
    if (workerResult.facialExpressiveness !== undefined) facialExpressiveness = workerResult.facialExpressiveness;
    if (workerResult.blinkRate !== undefined) blinkRate = workerResult.blinkRate;
    if (workerResult.distance !== undefined) distance = workerResult.distance;
    if (workerResult.offFrame !== undefined) offFrame = workerResult.offFrame;

    // Compute smile from actionUnits if available
    if (workerResult.actionUnits) {
      smileScore = workerResult.actionUnits.AU12 ?? smileScore;
    }

    // Compute gesture magnitude from temporalSummary if available
    if (workerResult.temporalSummary && workerResult.temporalSummary.gestureFrequency) {
      gestureMagnitude = Math.min(1, workerResult.temporalSummary.gestureFrequency / 10);
    }

    // Update smileFrequency from temporal data if available
    if (workerResult.temporalSummary && workerResult.temporalSummary.avgSmileRatio) {
      smileFrequency = workerResult.temporalSummary.avgSmileRatio;
    }
  } catch (error) {
    console.error('Worker analysis failed:', error);
  }

  // Fallback basic calculations if worker didn't provide values
  if (lastBoundingBox) {
    const centerX = lastBoundingBox.x + lastBoundingBox.width / 2;
    const centerY = lastBoundingBox.y + lastBoundingBox.height / 2;
    const distX = Math.abs(centerX - canvas.width / 2) / (canvas.width / 2);
    const distY = Math.abs(centerY - canvas.height / 2) / (canvas.height / 2);
    eyeContact = eyeContactKF.filter(Math.max(0, 1 - (distX + distY) / 2));
    framing = Math.max(0, 1 - Math.max(distX, distY));
    const faceArea = lastBoundingBox.width * lastBoundingBox.height;
    const frameArea = canvas.width * canvas.height;
    const faceRatio = faceArea / frameArea;
    const idealRatio = 0.1;
    distance = distanceKF.filter(Math.max(0, 1 - Math.abs(faceRatio - idealRatio) / idealRatio));
    const withinX = lastBoundingBox.x > canvas.width * 0.15 && lastBoundingBox.x + lastBoundingBox.width < canvas.width * 0.85;
    const withinY = lastBoundingBox.y > canvas.height * 0.15 && lastBoundingBox.y + lastBoundingBox.height < canvas.height * 0.85;
    offFrame = (withinX && withinY) ? 0 : 1;
  }

  smileFrequency = totalFrames ? smileFrames / totalFrames : 0;

  const suggestions: string[] = [];
  if (lighting < 0.4)
    suggestions.push('Add a front-facing light source like a lamp or sit facing a window.');
  if (eyeContact < 0.5)
    suggestions.push('Look more directly into your webcam, not at your screen.');
  if (headPositionStability < 0.6)
    suggestions.push('Keep your head steady and minimize unnecessary movement.');
  if (framing < 0.6)
    suggestions.push('Center your face within the webcam view with appropriate headroom.');
  if (facialExpressiveness < 0.4)
    suggestions.push('Use more varied facial expressions to appear engaged.');
  if (blinkRate < 0.4)
    suggestions.push('Maintain focus on the camera and avoid distractions.');
  if (distance < 0.4)
    suggestions.push('Move closer or further so your face fills about 10% of the frame.');
  if (offFrame > 0)
    suggestions.push('Keep your face within the camera frame.');
  if (suggestions.length === 0) suggestions.push('Great camera presence.');

  const confidenceTips: string[] = [];
  if (smileFrequency < 0.3) confidenceTips.push('Smile more to appear warm and engaged.');
  if (gestureMagnitude < 0.3) confidenceTips.push('Use hand gestures to add energy.');
  if (blinkRate < 0.2) confidenceTips.push('Blink naturally to avoid staring.');

  // Compute attentiveness as a blend of eye contact, head stability, and blink rate
  const attentivenessScore = Number((
    (eyeContact * 0.5) +
    (Math.max(0, headPositionStability) * 0.3) +
    (Math.min(1, blinkRate * 1.2) * 0.2)
  ).toFixed(2));

  const result: CameraPresence = {
    lighting: Number(lighting.toFixed(2)),
    eyeContact: Number(eyeContact.toFixed(2)),
    smile: Number(smileScore.toFixed(2)),
    smileFrequency: Number(smileFrequency.toFixed(2)),
    gestureMagnitude: Number(gestureMagnitude.toFixed(2)),
    attentiveness: attentivenessScore,
    facialExpressiveness,
    headPositionStability,
    framing,
    blinkRate,
    distance: Number(distance.toFixed(2)),
    offFrame,
    suggestions,
    confidenceTips,
    debug: lastBoundingBox ? {
      faceBox: lastBoundingBox,
      faceCenter: prevCenter || undefined,
      frameSize: { width: canvas.width, height: canvas.height },
      faceRatio: lastBoundingBox.width * lastBoundingBox.height / (canvas.width * canvas.height),
      idealFaceRatio: 0.1
    } : undefined,
  };

  console.debug('Camera analysis result', result);
  return result;
}

/**
 * Approximate posture score by checking if the detected face is vertically
 * centered. Returns 1 when the face is near the vertical center.
 */
export async function analyzePosture(video: HTMLVideoElement): Promise<PostureScore> {
  if ('FaceDetector' in window) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).FaceDetector();
      const faces = await detector.detect(canvas);
      if (faces.length > 0) {
        const { boundingBox } = faces[0];
        const centerY = boundingBox.y + boundingBox.height / 2;
        const distY = Math.abs(centerY - canvas.height / 2) / (canvas.height / 2);
        const confidence = Number(Math.max(0, 1 - distY).toFixed(2));
        const posture: PostureScore = {
          confidence,
          suggestions: confidence < 0.7
            ? ['Sit upright, center your face, and avoid leaning.']
            : ['Good posture maintained.']
        };
        console.debug('Posture analysis result', posture);
        return posture;
      }
    } catch {
      /* ignore */
    }
  }
  return {
    confidence: 0.5,
    suggestions: ['Ensure your face is visible and centered in the frame.']
  };
}


// Remove duplicated import * as faceapi from 'face-api.js';

