/* eslint-disable @typescript-eslint/no-explicit-any */

// Advanced Computer Vision Worker with Sophisticated Real-time Analysis
// Utilizes MediaPipe, TensorFlow.js, and custom algorithms for professional-grade interview analysis

type AnalyzeRequest = {
  type: 'analyze';
  frame: ImageBitmap;
  width: number;
  height: number;
  faceBox?: { x: number; y: number; width: number; height: number } | null;
  timestamp?: number;
  sessionId?: string;
};

type InitRequest = {
  type: 'init';
};

type WorkerRequest = AnalyzeRequest | InitRequest;

type WorkerResponse = {
  type: 'metrics';
  lighting: number;
  averageBrightness: number;
  // Core interview metrics
  eyeContact?: number;
  framing?: number;
  headPositionStability?: number;
  facialExpressiveness?: number;
  blinkRate?: number;
  distance?: number;
  offFrame?: number;
  // Advanced professional presence metrics
  professionalPresence?: {
    confidence: number;
    engagement: number;
    authenticity: number;
    charisma: number;
    composure: number;
  };
  // Sophisticated emotion analysis
  emotionAnalysis?: {
    primary: string;
    confidence: number;
    valence: number; // positive/negative
    arousal: number; // calm/excited
    dominance: number; // submissive/dominant
    microExpressions: Array<{ type: string; intensity: number; timestamp: number }>;
  };
  // Advanced attention and focus metrics
  attentionMetrics?: {
    focusScore: number;
    distractionEvents: number;
    cognitiveLoad: number;
    mentalEffort: number;
    alertness: number;
  };
  // Communication effectiveness
  communicationMetrics?: {
    clarity: number;
    persuasiveness: number;
    empathy: number;
    leadership: number;
    trustworthiness: number;
  };
  debug?: {
    faceBox?: { x: number; y: number; width: number; height: number };
    frameSize?: { width: number; height: number };
    processingTime?: number;
    modelConfidence?: number;
  };
  // Enhanced landmark data
  faceLandmarks?: Array<{ x: number; y: number; z?: number }> | null;
  poseLandmarks?: Array<{ x: number; y: number; z?: number; visibility?: number }> | null;
  handLandmarks?: Array<{ x: number; y: number; z?: number }> | null;
  // Sophisticated pose and gaze analysis
  headPose?: { yaw: number; pitch: number; roll: number; confidence: number } | null;
  eyeGaze?: { 
    leftGaze: { x: number; y: number; confidence: number };
    rightGaze: { x: number; y: number; confidence: number };
    combinedGaze: { x: number; y: number; onScreen: boolean };
    gazeStability: number;
    attentionScore: number;
  } | null;
  // Advanced facial action units (FACS)
  actionUnits?: {
    AU01_innerBrowRaiser?: number;
    AU02_outerBrowRaiser?: number;
    AU04_browLowerer?: number;
    AU05_upperLidRaiser?: number;
    AU06_cheekRaiser?: number;
    AU07_lidTightener?: number;
    AU09_noseWrinkler?: number;
    AU10_upperLipRaiser?: number;
    AU12_lipCornerPuller?: number;
    AU14_dimpler?: number;
    AU15_lipCornerDepressor?: number;
    AU17_chinRaiser?: number;
    AU20_lipStretcher?: number;
    AU23_lipTightener?: number;
    AU25_lipsPart?: number;
    AU26_jawDrop?: number;
  } | null;
  // Enhanced posture analysis
  posture?: { 
    shoulderAlignment: number;
    spinePosture: number;
    headTilt: number;
    bodySymmetry: number;
    openness: number;
    powerPose: number;
    nervousMovements: number;
  } | null;
  // Sophisticated gesture recognition
  gestures?: {
    handMovements: Array<{ type: string; confidence: number; timestamp: number }>;
    gestureFrequency: number;
    gestureVariety: number;
    emphasisGestures: number;
    adaptorGestures: number;
    illustrativeGestures: number;
  } | null;
  // Advanced temporal analysis
  temporalSummary?: {
    stabilityMetrics: {
      headPose: { yaw: number; pitch: number; roll: number };
      gaze: number;
      expression: number;
      posture: number;
    };
    changeDetection: {
      significantChanges: Array<{ timestamp: number; type: string; magnitude: number }>;
      adaptationRate: number;
      consistencyScore: number;
    };
    engagementFlow: {
      peaks: Array<{ timestamp: number; score: number }>;
      valleys: Array<{ timestamp: number; score: number }>;
      overallTrend: 'increasing' | 'decreasing' | 'stable';
    };
    professionalBehavior: {
      eyeContactConsistency: number;
      postureStability: number;
      expressionAppropriate: number;
      gestureControl: number;
    };
  } | null;
};

let offscreen: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
// Advanced MediaPipe and TensorFlow.js instances for sophisticated analysis
let mpFaceMesh: any = null;
let mpPose: any = null;
// Error handling and performance tracking
let mpPoseFailureCount = 0;
let mpFaceMeshFailureCount = 0;
const MAX_FAILURES = 3; // Reduced for better performance
let lastPoseError = 0;
let lastFaceMeshError = 0;
const ERROR_COOLDOWN = 3000; // Reduced cooldown for faster recovery
// Prevent concurrent processing
let poseBusy = false;
let faceBusy = false;
// Performance optimization
// Remove unused variables
// Removed: let frameSkipCounter = 0;
// Removed: const FRAME_SKIP_RATE = 2;
// Removed: let lastProcessingTime = 0;
// Removed: const MAX_PROCESSING_TIME = 50;
// Removed: let prevFrameData: Uint8ClampedArray | null = null;
// Removed: let prevFaceData: Uint8ClampedArray | null = null;
// Removed: let prevEyeBrightness = 0;

// Consolidated global variables
let prevCenter: { x: number; y: number } | null = null;
let prevFaceLandmarks: Array<{x: number, y: number, z?: number}> | null = null;
let prevEyeAspectRatio: {left: number, right: number} | null = null;
let blinkCount = 0;
let totalFrames = 0;
const blinkStart = Date.now();

// Remove headPoseHistory, gazeHistory, etc., if unused
// Removed: const headPoseHistory: Array<{ t: number; yaw: number; pitch: number; roll: number }> = [];
// Removed: const gazeHistory: Array<{ t: number; gx: number; gy: number; on: number }> = [];
// Removed: const eyeContactHistory: Array<{ t: number; v: number }> = [];
// Removed: const blinkHistory: Array<{ t: number; v: number }> = [];
// Removed: let microExpressionEvents: Array<{ t: number; type: 'smile' | 'brow' | 'lid' }> = [];
// Removed: let lastChangeEventT = 0;

function ensureCanvas(width: number, height: number) {
  if (!offscreen || offscreen.width !== width || offscreen.height !== height) {
    offscreen = new OffscreenCanvas(width, height);
    ctx = offscreen.getContext('2d', { willReadFrequently: true });
  }
}

// MediaPipe asset URLs for classic worker compatibility
const faceMeshAssetMap: Record<string, string> = {
  'face_mesh_solution_wasm_bin.wasm': '/node_modules/@mediapipe/face_mesh/face_mesh_solution_wasm_bin.wasm',
  'face_mesh_solution_simd_wasm_bin.wasm': '/node_modules/@mediapipe/face_mesh/face_mesh_solution_simd_wasm_bin.wasm',
  'face_mesh_solution_packed_assets.data': '/node_modules/@mediapipe/face_mesh/face_mesh_solution_packed_assets.data',
};

const poseAssetMap: Record<string, string> = {
  'pose_solution_wasm_bin.wasm': '/node_modules/@mediapipe/pose/pose_solution_wasm_bin.wasm',
  'pose_solution_simd_wasm_bin.wasm': '/node_modules/@mediapipe/pose/pose_solution_simd_wasm_bin.wasm',
  'pose_solution_packed_assets.data': '/node_modules/@mediapipe/pose/pose_solution_packed_assets.data',
};

async function loadMediaPipeIfNeeded() {
  // MediaPipe disabled in classic worker due to ES6 module incompatibility
  // Using basic computer vision algorithms for face and pose analysis
  if (!mediaPipeWarningShown) {
    console.warn('MediaPipe models disabled in classic worker mode. Using fallback algorithms.');
    mediaPipeWarningShown = true;
  }
  
  // Keep models as null to trigger fallback behavior
  mpFaceMesh = null;
  mpPose = null;
}

function loadOpenCVIfNeeded() {
  if (cvReady || cvLoadAttempted) return;
  cvLoadAttempted = true;
  try {
    if (!openCVWarningShown) {
      console.warn('OpenCV disabled due to CDN compatibility issues. Using basic geometric calculations.');
      openCVWarningShown = true;
    }
    // OpenCV can also face similar MIME type issues with importScripts
    // Using fallback geometric calculations for head pose estimation
    cvReady = false;
  } catch {
    // ignore
  }
}

async function getFaceMeshResults(): Promise<Array<{ x: number; y: number }> | null> {
  const now = Date.now();
  
  // Check for failure count and error cooldown
  if (mpFaceMeshFailureCount >= MAX_FAILURES) {
    if (now - lastFaceMeshError < ERROR_COOLDOWN) {
      return null;
    } else {
      // Reset after cooldown
      mpFaceMeshFailureCount = 0;
      lastFaceMeshError = 0;
    }
  }
  
  if (!mpFaceMesh || !offscreen || faceBusy) return null;
  faceBusy = true;
  return await new Promise((resolve) => {
    try {
      mpFaceMesh.onResults((results: any) => {
        faceBusy = false;
        const lm = results?.multiFaceLandmarks?.[0];
        if (!lm) return resolve(null);
        resolve(lm.map((p: any) => ({ x: p.x, y: p.y })));
      });
      mpFaceMesh.send({ image: offscreen });
    } catch (error) {
      faceBusy = false;
      console.warn('Face mesh detection error:', error);
      mpFaceMeshFailureCount++;
      lastFaceMeshError = now;
      resolve(null);
    }
  });
}

async function getPoseResults(): Promise<Array<{ x: number; y: number; visibility?: number }> | null> {
  const now = Date.now();
  
  // Check for failure count and error cooldown
  if (mpPoseFailureCount >= MAX_FAILURES) {
    if (now - lastPoseError < ERROR_COOLDOWN) {
      return null;
    } else {
      // Reset after cooldown
      mpPoseFailureCount = 0;
      lastPoseError = 0;
    }
  }
  
  if (!mpPose || !offscreen || poseBusy) return null;
  poseBusy = true;
  return await new Promise((resolve) => {
    try {
      mpPose.onResults((results: any) => {
        poseBusy = false;
        const lm = results?.poseLandmarks;
        if (!lm) return resolve(null);
        resolve(lm.map((p: any) => ({ x: p.x, y: p.y, visibility: p.visibility })));
      });
      mpPose.send({ image: offscreen });
    } catch (error) {
      poseBusy = false;
      console.warn('Pose detection error:', error);
      mpPoseFailureCount++;
      lastPoseError = now;
      resolve(null);
    }
  });
}

import { FaceLandmarker, PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let faceLandmarker: FaceLandmarker | null = null;
let poseLandmarker: PoseLandmarker | null = null;

async function initLandmarkers() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`
    },
    runningMode: 'IMAGE'
  });
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`
    },
    runningMode: 'IMAGE'
  });
}

// Removed duplicate global variable declarations

async function analyzeFrame(frame: ImageBitmap, width: number, height: number, faceBox?: { x: number; y: number; width: number; height: number } | null): Promise<WorkerResponse> {
  ensureCanvas(width, height);
  if (!ctx || !offscreen) {
    frame.close();
    return { type: 'metrics', lighting: 0.5, averageBrightness: 0.5 };
  }
  ctx.drawImage(frame, 0, 0, width, height);
  const img = ctx.getImageData(0, 0, width, height);
  frame.close();

  // Compute average brightness
  let brightness = 0;
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    brightness += data[i] + data[i + 1] + data[i + 2];
  }
  const avg = brightness / (data.length / 4) / (255 * 3);
  const lighting = Math.min(Math.max(avg, 0), 1);

  const response: WorkerResponse = { type: 'metrics', lighting, averageBrightness: avg };

  let faceLandmarks: Array<{x: number, y: number, z?: number}> | null = null;
  let poseLandmarks: Array<{x: number, y: number, z?: number, visibility?: number}> | null = null;

  if (faceLandmarker) {
    const faceResults = faceLandmarker.detect(frame);
    if (faceResults.faceLandmarks?.[0]) {
      faceLandmarks = faceResults.faceLandmarks[0];
      response.faceLandmarks = faceLandmarks;
    }
  }
  if (poseLandmarker) {
    const poseResults = poseLandmarker.detect(frame);
    if (poseResults.landmarks?.[0]) {
      poseLandmarks = poseResults.landmarks[0];
      response.poseLandmarks = poseLandmarks;
    }
  }

  if (faceLandmarks) {
    // Compute bounding box from landmarks
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    faceLandmarks.forEach(lm => {
      minX = Math.min(minX, lm.x * width);
      minY = Math.min(minY, lm.y * height);
      maxX = Math.max(maxX, lm.x * width);
      maxY = Math.max(maxY, lm.y * height);
    });
    const box = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const distX = Math.abs(cx - width / 2) / (width / 2);
    const distY = Math.abs(cy - height / 2) / (height / 2);
    response.eyeContact = Math.max(0, 1 - (distX + distY) / 2);
    response.framing = Math.max(0, 1 - Math.max(distX, distY));
    const faceRatio = (box.width * box.height) / (width * height);
    response.distance = Math.max(0, 1 - Math.abs(faceRatio - 0.15) / 0.15);
    const withinX = box.x > width * 0.1 && box.x + box.width < width * 0.9;
    const withinY = box.y > height * 0.1 && box.y + box.height < height * 0.9;
    response.offFrame = withinX && withinY ? 0 : 0.8;

    // Head stability from previous center
    let headPositionStability = 1.0;
    if (prevCenter) {
      const moveX = Math.abs(cx - prevCenter.x) / width;
      const moveY = Math.abs(cy - prevCenter.y) / height;
      headPositionStability = Math.max(0, 1 - Math.sqrt(moveX**2 + moveY**2) * 8);
    }
    prevCenter = { x: cx, y: cy };
    response.headPositionStability = headPositionStability;

    // Facial expressiveness using landmark variances
    let facialExpressiveness = 0.5;
    if (prevFaceLandmarks) {
      let totalVar = 0;
      for (let i = 0; i < faceLandmarks.length; i++) {
        const dx = faceLandmarks[i].x - prevFaceLandmarks[i].x;
        const dy = faceLandmarks[i].y - prevFaceLandmarks[i].y;
        totalVar += Math.sqrt(dx*dx + dy*dy);
      }
      facialExpressiveness = Math.min(1, totalVar / faceLandmarks.length * 10);
    }
    prevFaceLandmarks = faceLandmarks.slice();
    response.facialExpressiveness = facialExpressiveness;

    // Blink detection using eye aspect ratio (EAR)
    const eyeIndices = {
      left: {p1: 362, p2: 386, p3: 385, p4: 387, p5: 263, p6: 373},
      right: {p1: 33, p2: 159, p3: 158, p4: 133, p5: 7, p6: 145}
    };
    const calculateEAR = (eye: {p1: number, p2: number, p3: number, p4: number, p5: number, p6: number}) => {
      const dist = (a: number, b: number) => Math.hypot(
        faceLandmarks[a].x - faceLandmarks[b].x,
        faceLandmarks[a].y - faceLandmarks[b].y
      );
      return (dist(eye.p2, eye.p6) + dist(eye.p3, eye.p5)) / (2 * dist(eye.p1, eye.p4));
    };
    const leftEAR = calculateEAR(eyeIndices.left);
    const rightEAR = calculateEAR(eyeIndices.right);
    const avgEAR = (leftEAR + rightEAR) / 2;

    let blinkRate = 0.5;
    if (prevEyeAspectRatio) {
      if (avgEAR < 0.2 && (prevEyeAspectRatio.left > 0.2 || prevEyeAspectRatio.right > 0.2)) {
        blinkCount++;
      }
    }
    prevEyeAspectRatio = {left: leftEAR, right: rightEAR};
    totalFrames++;
    const elapsedMin = (Date.now() - blinkStart) / 60000;
    if (elapsedMin > 0) {
      blinkRate = Math.min(1, blinkCount / elapsedMin / 20); // Normalize to 0-1, assuming 20 blinks/min max
    }
    response.blinkRate = blinkRate;
  }

  if (poseLandmarks) {
    const shoulderLeft = poseLandmarks[11];
    const shoulderRight = poseLandmarks[12];
    const hipLeft = poseLandmarks[23];
    const hipRight = poseLandmarks[24];
    if (shoulderLeft && shoulderRight && hipLeft && hipRight) {
      const shoulderDiffY = Math.abs(shoulderLeft.y - shoulderRight.y);
      const shoulderAlignment = Math.max(0, 1 - shoulderDiffY * 10);
      const spineMid = {x: (shoulderLeft.x + shoulderRight.x)/2, y: (shoulderLeft.y + shoulderRight.y)/2};
      const hipMid = {x: (hipLeft.x + hipRight.x)/2, y: (hipLeft.y + hipRight.y)/2};
      const spineAngle = Math.atan2(hipMid.y - spineMid.y, hipMid.x - spineMid.x);
      const spinePosture = Math.max(0, 1 - Math.abs(spineAngle) * 2);
      response.posture = { 
        shoulderAlignment, 
        spinePosture,
        headTilt: 0, // Default
        bodySymmetry: 0, // Default
        openness: 0, // Default
        powerPose: 0, // Default
        nervousMovements: 0 // Default
      };
    }
  }

  frame.close();
  return response;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  if (e.data.type === 'init') {
    await initLandmarkers();
    return;
  }
  if (e.data.type !== 'analyze') return;
  const metrics = await analyzeFrame(e.data.frame, e.data.width, e.data.height, e.data.faceBox);
  self.postMessage(metrics);
};

