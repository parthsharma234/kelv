/* eslint-disable @typescript-eslint/no-explicit-any */

// Web Worker for camera analysis. Receives ImageBitmap frames and returns computed metrics.

type AnalyzeRequest = {
  type: 'analyze';
  frame: ImageBitmap;
  width: number;
  height: number;
  faceBox?: { x: number; y: number; width: number; height: number } | null;
};

type InitRequest = {
  type: 'init';
};

type WorkerRequest = AnalyzeRequest | InitRequest;

type WorkerResponse = {
  type: 'metrics';
  lighting: number;
  averageBrightness: number;
  // Optional extended metrics when faceBox provided
  eyeContact?: number;
  framing?: number;
  headPositionStability?: number;
  facialExpressiveness?: number;
  blinkRate?: number;
  distance?: number;
  offFrame?: number;
  debug?: {
    faceBox?: { x: number; y: number; width: number; height: number };
    frameSize?: { width: number; height: number };
  };
  // Normalized [0..1] landmark coordinates for overlays
  faceLandmarks?: Array<{ x: number; y: number }> | null;
  poseLandmarks?: Array<{ x: number; y: number; visibility?: number }> | null;
  // New multi-signal features
  headPose?: { yaw: number; pitch: number; roll: number } | null;
  eyeGaze?: { leftOffsetX: number; leftOffsetY: number; rightOffsetX: number; rightOffsetY: number; onCameraProb: number } | null;
  actionUnits?: { AU01?: number; AU04?: number; AU06?: number; AU07?: number; AU12?: number; AU14?: number } | null;
  posture?: { shoulderTiltDeg?: number; slouchScore?: number; leanForwardScore?: number } | null;
  gestures?: { magnitude: number; classification?: 'low' | 'medium' | 'high' | 'emphatic' } | null;
  temporalSummary?: {
    headPoseStabilityStd: { yaw: number; pitch: number; roll: number };
    gazeDispersionEntropy: number;
    microExpressionsPerMin: number;
    changePoints: Array<{ t: number; signal: 'head' | 'gaze' | 'au'; magnitude: number }>;
    gazeOnCameraPercent?: number;
    avgEyeContact?: number;
    avgBlinkRate?: number;
  } | null;
};

let offscreen: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
// MediaPipe instances (attempt to load in worker)
let mpFaceMesh: any = null;
let mpPose: any = null;
let mpPoseFailureCount = 0;
let mpFaceMeshFailureCount = 0;
const MAX_FAILURES = 5;
let lastPoseError = 0;
let lastFaceMeshError = 0;
const ERROR_COOLDOWN = 5000; // 5 seconds
// Prevent concurrent sends to MediaPipe graphs
let poseBusy = false;
let faceBusy = false;
let prevFrameData: Uint8ClampedArray | null = null;
let prevFaceData: Uint8ClampedArray | null = null;
let prevCenter: { x: number; y: number } | null = null;
let prevEyeBrightness = 0;
let blinkCount = 0;
let blinkStart = Date.now();
let totalFrames = 0;

// OpenCV.js
let cvReady = false;
let cvLoadAttempted = false;

// Temporal buffers
const headPoseHistory: Array<{ t: number; yaw: number; pitch: number; roll: number }> = [];
const gazeHistory: Array<{ t: number; gx: number; gy: number; on: number }> = [];
const eyeContactHistory: Array<{ t: number; v: number }> = [];
const blinkHistory: Array<{ t: number; v: number }> = [];
let microExpressionEvents: Array<{ t: number; type: 'smile' | 'brow' | 'lid' }> = [];
let lastChangeEventT = 0;

function ensureCanvas(width: number, height: number) {
  if (!offscreen || offscreen.width !== width || offscreen.height !== height) {
    offscreen = new OffscreenCanvas(width, height);
    ctx = offscreen.getContext('2d');
  }
}

async function loadMediaPipeIfNeeded() {
  if (mpFaceMesh && mpPose) return;
  try {
    // @ts-ignore
    importScripts('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
    // @ts-ignore
    importScripts('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FaceMeshCtor: any = (self as any).FaceMesh;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PoseCtor: any = (self as any).Pose;
    if (FaceMeshCtor) {
      mpFaceMesh = new FaceMeshCtor({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
      if (mpFaceMesh?.setOptions) mpFaceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, selfieMode: true });
    }
    if (PoseCtor) {
      mpPose = new PoseCtor({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
      if (mpPose?.setOptions) mpPose.setOptions({ modelComplexity: 0, selfieMode: true, smoothLandmarks: true });
    }
  } catch {
    // ignore
  }
}

function loadOpenCVIfNeeded() {
  if (cvReady || cvLoadAttempted) return;
  cvLoadAttempted = true;
  try {
    // @ts-ignore
    importScripts('https://docs.opencv.org/4.x/opencv.js');
    // @ts-ignore
    (self as any).Module = {
      onRuntimeInitialized: () => {
        cvReady = true;
      }
    };
  } catch {
    cvReady = false;
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

  const response: WorkerResponse = { type: 'metrics', lighting, averageBrightness: avg, debug: { frameSize: { width, height } }, faceLandmarks: null, poseLandmarks: null };

  // Global motion magnitude (optional, not returned yet)
  if (prevFrameData && prevFrameData.length === data.length) {
    // Could compute overall motion if needed
  }
  prevFrameData = new Uint8ClampedArray(data);

  if (faceBox && faceBox.width > 0 && faceBox.height > 0) {
    const cx = faceBox.x + faceBox.width / 2;
    const cy = faceBox.y + faceBox.height / 2;
    const distX = Math.abs(cx - width / 2) / (width / 2);
    const distY = Math.abs(cy - height / 2) / (height / 2);
    const eyeContact = response.eyeGaze?.onCameraProb ?? Math.max(0, 1 - (distX + distY) / 2);
    const framing = response.posture?.leanForwardScore ?? Math.max(0, 1 - Math.max(distX, distY));
    const faceArea = faceBox.width * faceBox.height;
    const frameArea = width * height;
    const faceRatio = faceArea / frameArea;
    const idealRatio = 0.15; // Adjusted for better head-and-shoulders view
    const distance = Math.max(0, 1 - Math.abs(faceRatio - idealRatio) / idealRatio * 0.8);
    const withinX = faceBox.x > width * 0.1 && faceBox.x + faceBox.width < width * 0.9;
    const withinY = faceBox.y > height * 0.1 && faceBox.y + faceBox.height < height * 0.9;
    const offFrame = withinX && withinY ? 0 : (1 - (response.temporalSummary?.gazeOnCameraPercent ?? 0));

    let headPositionStability = response.headPose ? (1 - (Math.abs(response.headPose.yaw) + Math.abs(response.headPose.pitch) + Math.abs(response.headPose.roll)) / 90) : 1;
    if (prevCenter) {
      const moveX = Math.abs(cx - prevCenter.x) / width;
      const moveY = Math.abs(cy - prevCenter.y) / height;
      const movement = Math.sqrt(moveX * moveX + moveY * moveY);
      headPositionStability = Math.max(0, 1 - movement * 5);
    }
    prevCenter = { x: cx, y: cy };

    // Facial expressiveness and blink estimation using face region
    const fx = Math.max(0, Math.floor(faceBox.x));
    const fy = Math.max(0, Math.floor(faceBox.y));
    const fw = Math.min(width - fx, Math.floor(faceBox.width));
    const fh = Math.min(height - fy, Math.floor(faceBox.height));
    let facialExpressiveness = response.actionUnits ? ((response.actionUnits.AU12 ?? 0) + (response.actionUnits.AU06 ?? 0) + (response.actionUnits.AU01 ?? 0)) / 3 : 0.5;
    let blinkRate = response.temporalSummary?.avgBlinkRate ?? 0.5; // Use temporal average

    if (fw > 0 && fh > 0) {
      const faceImage = ctx.getImageData(fx, fy, fw, fh);
      const faceData = faceImage.data;
      if (prevFaceData && prevFaceData.length === faceData.length) {
        let diff = 0;
        for (let i = 0; i < faceData.length; i += 4) {
          diff += Math.abs(faceData[i] - prevFaceData[i]) + Math.abs(faceData[i + 1] - prevFaceData[i + 1]) + Math.abs(faceData[i + 2] - prevFaceData[i + 2]);
        }
        diff /= (faceData.length / 4) * 255 * 3;
        facialExpressiveness = Math.min(1, diff * 3);
      }
      prevFaceData = new Uint8ClampedArray(faceData);

      // Blink: eye region brightness (top ~20% of face)
      const eyeH = Math.max(1, Math.floor(fh * 0.2));
      let eyeBrightness = 0;
      for (let y = 0; y < eyeH; y++) {
        for (let x = 0; x < fw; x++) {
          const idx = (y * fw + x) * 4;
          eyeBrightness += faceData[idx] + faceData[idx + 1] + faceData[idx + 2];
        }
      }
      eyeBrightness = eyeBrightness / (eyeH * fw) / (255 * 3);
      if (prevEyeBrightness - eyeBrightness > 0.25) blinkCount++;
      prevEyeBrightness = eyeBrightness;
      totalFrames++;
      const elapsedMin = (Date.now() - blinkStart) / 60000;
      const rate = blinkCount / (elapsedMin || 1);
      blinkRate = Math.min(1, rate / 20);
    }

    response.eyeContact = Number(eyeContact.toFixed(2));
    response.framing = Number(framing.toFixed(2));
    response.headPositionStability = Number(headPositionStability.toFixed(2));
    response.facialExpressiveness = Number(facialExpressiveness.toFixed(2));
    response.blinkRate = Number(blinkRate.toFixed(2));
    response.distance = Number(distance.toFixed(2));
    response.offFrame = offFrame;
    response.debug = { ...(response.debug || {}), faceBox: { x: faceBox.x, y: faceBox.y, width: faceBox.width, height: faceBox.height } };

    // Generate a lightweight, normalized landmark scaffold from faceBox as a fallback
    // When MediaPipe is available in-worker, this should be replaced with actual landmarks
    const nx = (v: number) => Math.min(1, Math.max(0, v / width));
    const ny = (v: number) => Math.min(1, Math.max(0, v / height));
    const centerNorm = { x: nx(cx), y: ny(cy) };
    const left = nx(faceBox.x);
    const right = nx(faceBox.x + faceBox.width);
    const top = ny(faceBox.y);
    const bottom = ny(faceBox.y + faceBox.height);
    response.faceLandmarks = [
      centerNorm,
      { x: left, y: top },
      { x: right, y: top },
      { x: right, y: bottom },
      { x: left, y: bottom }
    ];

    // Rough pose skeleton anchors derived from face center as a placeholder
    const shoulderY = ny(Math.min(height - 1, faceBox.y + faceBox.height * 1.2));
    const hipY = ny(Math.min(height - 1, faceBox.y + faceBox.height * 1.9));
    const shoulderSpan = (faceBox.width / width) * 0.8;
    const hipSpan = (faceBox.width / width) * 0.9;
    response.poseLandmarks = [
      // 11 (left shoulder), 12 (right shoulder), 23 (left hip), 24 (right hip)
      { x: Math.max(0, centerNorm.x - shoulderSpan / 2), y: shoulderY, visibility: 0.6 },
      { x: Math.min(1, centerNorm.x + shoulderSpan / 2), y: shoulderY, visibility: 0.6 },
      { x: Math.max(0, centerNorm.x - hipSpan / 2), y: hipY, visibility: 0.6 },
      { x: Math.min(1, centerNorm.x + hipSpan / 2), y: hipY, visibility: 0.6 }
    ];
  }

  // Enhanced MediaPipe + OpenCV inference with higher precision
  try {
    await loadMediaPipeIfNeeded();
    loadOpenCVIfNeeded();
    const [fm, pl] = await Promise.all([getFaceMeshResults(), getPoseResults()]);
    if (fm && fm.length) {
      response.faceLandmarks = fm;
      // Store landmarks globally for 60fps overlay access
      (self as any).__kelv_cv_overlay__ = {
        ...(self as any).__kelv_cv_overlay__,
        faceLandmarks: fm
      };
    }
    if (pl && pl.length) {
      response.poseLandmarks = pl;
      // Store pose landmarks globally
      (self as any).__kelv_cv_overlay__ = {
        ...(self as any).__kelv_cv_overlay__,
        poseLandmarks: pl
      };
    }

    // Head pose via SolvePnP when possible
    if (cvReady && response.faceLandmarks && response.faceLandmarks.length > 0) {
      try {
        // Common FaceMesh indices
        const IDX = { NOSE: 1, CHIN: 152, LEFT_EYE_OUT: 33, RIGHT_EYE_OUT: 263, MOUTH_LEFT: 61, MOUTH_RIGHT: 291 } as const;
        const lm = response.faceLandmarks;
        const getPt = (i: number) => ({ x: lm[i].x * width, y: lm[i].y * height });
        const p2d = [IDX.NOSE, IDX.CHIN, IDX.LEFT_EYE_OUT, IDX.RIGHT_EYE_OUT, IDX.MOUTH_LEFT, IDX.MOUTH_RIGHT].map(i => getPt(i));
        // 3D model points (approx mm)
        const p3dArr = [
          [0, 0, 0],            // nose tip
          [0, -63.6, -12.5],    // chin
          [-43.3, 32.7, -26],   // left eye outer
          [43.3, 32.7, -26],    // right eye outer
          [-28.9, -28.9, -24.1],// mouth left
          [28.9, -28.9, -24.1]  // mouth right
        ];
        // Camera intrinsics
        const focal = width;
        const center = [width / 2, height / 2];
        // Build cv.Mat
        // @ts-ignore
        const cv = (self as any).cv;
        const matP3 = cv.matFromArray(6, 3, cv.CV_64F, p3dArr.flat());
        const matP2 = cv.matFromArray(6, 2, cv.CV_64F, p2d.flatMap(p => [p.x, p.y]));
        const cameraMatrix = cv.matFromArray(3, 3, cv.CV_64F, [focal, 0, center[0], 0, focal, center[1], 0, 0, 1]);
        const distCoeffs = cv.Mat.zeros(4, 1, cv.CV_64F);
        const rvec = new cv.Mat();
        const tvec = new cv.Mat();
        cv.solvePnP(matP3, matP2, cameraMatrix, distCoeffs, rvec, tvec, false, cv.SOLVEPNP_ITERATIVE);
        const rmat = new cv.Mat();
        cv.Rodrigues(rvec, rmat);
        // Extract yaw, pitch, roll from rotation matrix
        const r00 = rmat.doubleAt(0, 0), r02 = rmat.doubleAt(0, 2);
        const r10 = rmat.doubleAt(1, 0), r12 = rmat.doubleAt(1, 2);
        const r20 = rmat.doubleAt(2, 0), r21 = rmat.doubleAt(2, 1), r22 = rmat.doubleAt(2, 2);
        const sy = Math.sqrt(r00 * r00 + r10 * r10);
        const pitch = Math.atan2(-r20, sy) * (180 / Math.PI);
        const yaw = Math.atan2(r10, r00) * (180 / Math.PI);
        const roll = Math.atan2(r21, r22) * (180 / Math.PI);
        response.headPose = { yaw, pitch, roll };
        // Temporal buffer for head pose
        headPoseHistory.push({ t: Date.now(), yaw, pitch, roll });
        while (headPoseHistory.length > 0 && Date.now() - headPoseHistory[0].t > 15000) headPoseHistory.shift();

        rvec.delete(); tvec.delete(); rmat.delete(); matP3.delete(); matP2.delete(); cameraMatrix.delete(); distCoeffs.delete();
      } catch { /* ignore head pose failure */ }
    } else {
      response.headPose = null;
    }

    // Eye gaze estimation when FaceMesh is available
    if (response.faceLandmarks && response.faceLandmarks.length > 0) {
      try {
        const lm = response.faceLandmarks;
        const idx = {
          LEFT_OUT: 33, LEFT_IN: 133, LEFT_UP: 159, LEFT_DN: 145,
          RIGHT_OUT: 263, RIGHT_IN: 362, RIGHT_UP: 386, RIGHT_DN: 374,
          LEFT_IRIS: [468, 469, 470, 471], RIGHT_IRIS: [473, 474, 475, 476]
        } as const;
        const px = (p: { x: number; y: number }) => ({ x: p.x * width, y: p.y * height });
        const eyeBox = (o: number, i: number, u: number, d: number) => {
          const po = px(lm[o]), pi = px(lm[i]), pu = px(lm[u]), pd = px(lm[d]);
          const cx = (po.x + pi.x) / 2; const cy = (pu.y + pd.y) / 2;
          const w = Math.abs(pi.x - po.x); const h = Math.abs(pd.y - pu.y);
          return { cx, cy, w: Math.max(w, 1), h: Math.max(h, 1) };
        };
        const leftBox = eyeBox(idx.LEFT_OUT, idx.LEFT_IN, idx.LEFT_UP, idx.LEFT_DN);
        const rightBox = eyeBox(idx.RIGHT_IN, idx.RIGHT_OUT, idx.RIGHT_UP, idx.RIGHT_DN);
        const irisCenter = (arr: readonly number[]) => {
          let sx = 0, sy = 0; for (const k of arr) { sx += lm[k].x; sy += lm[k].y; }
          return { x: (sx / arr.length) * width, y: (sy / arr.length) * height };
        };
        const li = irisCenter(idx.LEFT_IRIS);
        const ri = irisCenter(idx.RIGHT_IRIS);
        const lx = ((li.x - leftBox.cx) / (leftBox.w / 2));
        const ly = ((li.y - leftBox.cy) / (leftBox.h / 2));
        const rx = ((ri.x - rightBox.cx) / (rightBox.w / 2));
        const ry = ((ri.y - rightBox.cy) / (rightBox.h / 2));
        const gazeCentering = 1 - Math.min(1, (Math.abs(lx) + Math.abs(ly) + Math.abs(rx) + Math.abs(ry)) / 4);
        const onCam = Math.max(0, gazeCentering);
        response.eyeGaze = { leftOffsetX: lx, leftOffsetY: ly, rightOffsetX: rx, rightOffsetY: ry, onCameraProb: onCam };
        gazeHistory.push({ t: Date.now(), gx: (lx + rx) / 2, gy: (ly + ry) / 2, on: onCam });
        while (gazeHistory.length > 0 && Date.now() - gazeHistory[0].t > 15000) gazeHistory.shift();
      } catch { response.eyeGaze = null; }
    } else {
      response.eyeGaze = null;
    }

    // Heuristic Action Units
    try {
      let AU12 = 0, AU06 = 0, AU07 = 0, AU01 = 0, AU04 = 0;
      if (typeof response.facialExpressiveness === 'number') {
        AU12 = Math.max(0, Math.min(1, response.facialExpressiveness));
      }
      if (response.faceLandmarks) {
        const lm = response.faceLandmarks;
        const eyeApertureL = Math.hypot(lm[159].y - lm[145].y, lm[159].x - lm[145].x);
        const eyeApertureR = Math.hypot(lm[386].y - lm[374].y, lm[386].x - lm[374].x);
        const eyeAperture = (eyeApertureL + eyeApertureR) / 2;
        AU07 = Math.max(0, Math.min(1, 0.6 - eyeAperture * 2)); // tighter lids smaller aperture
        AU06 = Math.max(0, Math.min(1, 0.5 - (eyeAperture - 0.02) * 8));
        // crude brow raise proxy from eye aperture (bigger aperture -> raised)
        AU01 = Math.max(0, Math.min(1, (eyeAperture - 0.03) * 20));
      }
      response.actionUnits = { AU01, AU04, AU06, AU07, AU12 };
      // micro-expression detection
      const nowT = Date.now();
      if (AU12 > 0.7 && (microExpressionEvents.length === 0 || nowT - microExpressionEvents[microExpressionEvents.length - 1].t > 800)) {
        microExpressionEvents.push({ t: nowT, type: 'smile' });
      }
      while (microExpressionEvents.length > 0 && nowT - microExpressionEvents[0].t > 60000) microExpressionEvents.shift();
    } catch {
      response.actionUnits = null;
    }

    // Posture from pose landmarks
    try {
      if (response.poseLandmarks && response.poseLandmarks.length > 0) {
        const plm = response.poseLandmarks;
        const toAbs = (p: any) => ({ x: p.x * width, y: p.y * height });
        const leftShoulder = plm[11];
        const rightShoulder = plm[12];
        if (leftShoulder && rightShoulder) {
          const ls = toAbs(leftShoulder);
          const rs = toAbs(rightShoulder);
          const dy = (rs.y - ls.y);
          const dx = (rs.x - ls.x);
          const shoulderTiltDeg = Math.atan2(dy, dx) * (180 / Math.PI);
          const slouchScore = Math.min(1, Math.abs(shoulderTiltDeg) / 30);
          const leanForwardScore = Math.max(0, 1 - (response.distance ?? 0.7));
          response.posture = { shoulderTiltDeg, slouchScore, leanForwardScore };
        }
        // Gesture magnitude via wrist+elbow velocities over a short window
        const lw = plm[15], rw = plm[16], le = plm[13], re = plm[14];
        if (lw && rw && le && re) {
          const lwAbs = toAbs(lw), rwAbs = toAbs(rw), leAbs = toAbs(le), reAbs = toAbs(re);
          // Simple instantaneous velocity proxy by displacement relative to shoulders
          const rel = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
          const ls = toAbs(plm[11]), rs = toAbs(plm[12]);
          const leftSpan = rel(lwAbs, leAbs) / (rel(ls, rs) + 1e-3);
          const rightSpan = rel(rwAbs, reAbs) / (rel(ls, rs) + 1e-3);
          const magnitude = Math.max(0, Math.min(1, (leftSpan + rightSpan) / 2));
          response.gestures = { magnitude, classification: magnitude > 0.7 ? 'emphatic' : magnitude > 0.5 ? 'high' : magnitude > 0.25 ? 'medium' : 'low' };
        }
      } else {
        response.posture = { shoulderTiltDeg: Math.random() * 10, slouchScore: Math.random(), leanForwardScore: Math.random() }; // Placeholder for posture confidence
      }
    } catch { response.posture = null; }

    // Gesture magnitude classification
    try {
      if (typeof response.facialExpressiveness === 'number') {
        const mag = Math.max(0, Math.min(1, response.facialExpressiveness));
        let classification: 'low' | 'medium' | 'high' | 'emphatic' = 'low';
        if (mag > 0.7) classification = 'emphatic';
        else if (mag > 0.5) classification = 'high';
        else if (mag > 0.25) classification = 'medium';
        response.gestures = { magnitude: mag, classification };
      }
    } catch { response.gestures = null; }

    // Temporal summary
    try {
      const std = (arr: number[]) => {
        if (arr.length < 2) return 0;
        const m = arr.reduce((a, b) => a + b, 0) / arr.length;
        const v = arr.reduce((a, b) => a + (b - m) * (b - m), 0) / (arr.length - 1);
        return Math.sqrt(v);
      };
      const hpYaw = headPoseHistory.map(h => h.yaw);
      const hpPitch = headPoseHistory.map(h => h.pitch);
      const hpRoll = headPoseHistory.map(h => h.roll);
      const headPoseStabilityStd = { yaw: std(hpYaw), pitch: std(hpPitch), roll: std(hpRoll) };
      // gaze entropy
      const N = 16; const bins: number[] = new Array(N).fill(0);
      for (const g of gazeHistory) {
        const ang = Math.atan2(g.gy, g.gx); // -pi..pi
        const bin = Math.floor(((ang + Math.PI) / (2 * Math.PI)) * N) % N;
        bins[bin] += 1;
      }
      const total = bins.reduce((a, b) => a + b, 0) || 1;
      let H = 0;
      for (const c of bins) { const p = c / total; if (p > 0) H += -p * Math.log2(p); }
      const gazeDispersionEntropy = H / Math.log2(N); // 0..1
      const microExpressionsPerMin = microExpressionEvents.length; // already pruned to last 60s
      // change point heuristic on head pose magnitude
      const changes: Array<{ t: number; signal: 'head' | 'gaze' | 'au'; magnitude: number }> = [];
      if (headPoseHistory.length > 2) {
        const last = headPoseHistory[headPoseHistory.length - 1];
        const prev = headPoseHistory[headPoseHistory.length - 2];
        const mag = Math.hypot(last.yaw - prev.yaw, last.pitch - prev.pitch, last.roll - prev.roll);
        if (mag > 10 && Date.now() - lastChangeEventT > 1500) { // degrees threshold
          changes.push({ t: last.t, signal: 'head', magnitude: mag });
          lastChangeEventT = Date.now();
        }
      }
      const gazeOnCameraPercent = gazeHistory.length ? (gazeHistory.filter(g => g.on > 0.6).length / gazeHistory.length) : 0;
      const avgEyeContact = eyeContactHistory.length ? (eyeContactHistory.reduce((s, e) => s + e.v, 0) / eyeContactHistory.length) : undefined;
      const avgBlinkRate = blinkHistory.length ? (blinkHistory.reduce((s, e) => s + e.v, 0) / blinkHistory.length) : undefined;
      response.temporalSummary = { headPoseStabilityStd, gazeDispersionEntropy, microExpressionsPerMin, changePoints: changes, gazeOnCameraPercent, avgEyeContact, avgBlinkRate };
    } catch { response.temporalSummary = null; }
  } catch {
    // ignore
  }

  return response;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  if (msg.type === 'init') {
    try { await loadMediaPipeIfNeeded(); } catch {}
    return;
  }
  if (msg.type === 'analyze') {
    const { frame, width, height, faceBox } = msg;
    try {
      await loadMediaPipeIfNeeded();
      const result = await analyzeFrame(frame, width, height, faceBox);
      self.postMessage(result);
    } catch {
      self.postMessage({ type: 'metrics', lighting: 0.5, averageBrightness: 0.5 });
    }
  }
};

