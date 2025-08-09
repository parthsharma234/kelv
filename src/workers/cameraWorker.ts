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
};

let offscreen: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
// MediaPipe instances (attempt to load in worker)
let mpFaceMesh: any = null;
let mpPose: any = null;
let prevFrameData: Uint8ClampedArray | null = null;
let prevFaceData: Uint8ClampedArray | null = null;
let prevCenter: { x: number; y: number } | null = null;
let prevEyeBrightness = 0;
let blinkCount = 0;
let blinkStart = Date.now();
let totalFrames = 0;
let smileFrames = 0; // reserved if we add smile proxy later

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

async function getFaceMeshResults(): Promise<Array<{ x: number; y: number }> | null> {
  if (!mpFaceMesh || !offscreen) return null;
  return await new Promise((resolve) => {
    try {
      mpFaceMesh.onResults((results: any) => {
        const lm = results?.multiFaceLandmarks?.[0];
        if (!lm) return resolve(null);
        resolve(lm.map((p: any) => ({ x: p.x, y: p.y })));
      });
      mpFaceMesh.send({ image: offscreen });
    } catch {
      resolve(null);
    }
  });
}

async function getPoseResults(): Promise<Array<{ x: number; y: number; visibility?: number }> | null> {
  if (!mpPose || !offscreen) return null;
  return await new Promise((resolve) => {
    try {
      mpPose.onResults((results: any) => {
        const lm = results?.poseLandmarks;
        if (!lm) return resolve(null);
        resolve(lm.map((p: any) => ({ x: p.x, y: p.y, visibility: p.visibility })));
      });
      mpPose.send({ image: offscreen });
    } catch {
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
    const eyeContact = Math.max(0, 1 - (distX + distY) / 2);
    const framing = Math.max(0, 1 - Math.max(distX, distY));
    const faceArea = faceBox.width * faceBox.height;
    const frameArea = width * height;
    const faceRatio = faceArea / frameArea;
    const idealRatio = 0.1;
    const distance = Math.max(0, 1 - Math.abs(faceRatio - idealRatio) / idealRatio);
    const withinX = faceBox.x > width * 0.15 && faceBox.x + faceBox.width < width * 0.85;
    const withinY = faceBox.y > height * 0.15 && faceBox.y + faceBox.height < height * 0.85;
    const offFrame = withinX && withinY ? 0 : 1;

    let headPositionStability = 1;
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
    let facialExpressiveness = 0.5;
    let blinkRate = 0.5;

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

  // Try MediaPipe inference in worker if available
  try {
    await loadMediaPipeIfNeeded();
    const [fm, pl] = await Promise.all([getFaceMeshResults(), getPoseResults()]);
    if (fm && fm.length) response.faceLandmarks = fm;
    if (pl && pl.length) response.poseLandmarks = pl;
  } catch {
    // ignore
  }

  return response;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  if (msg.type === 'init') { try { await loadMediaPipeIfNeeded(); } catch {} return; }
  if (msg.type === 'analyze') {
    const res = await analyzeFrame(msg.frame, msg.width, msg.height, msg.faceBox);
    (self as any).postMessage(res);
  }
};

