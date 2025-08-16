import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { CameraTimelinePoint } from '../../types/analytics';
import { ensureEmotionModel, landmarksToFeatures, classifyEmotion } from '../../utils/emotionClassifier';

interface VideoReviewProps {
  src: string;
  timeline?: CameraTimelinePoint[];
  defaultMode?: OverlayMode;
  defaultShowOverlay?: boolean;
  externalSeekSec?: number;
}

// Enhanced overlay types
type OverlayMode = 'split' | 'overlay';
type Layer = 'faceBox' | 'idealZone' | 'center' | 'motion' | 'pose' | 'emotions' | 'landmarks';

const VideoReview: React.FC<VideoReviewProps> = ({ src, timeline, defaultMode = 'split', defaultShowOverlay = false, externalSeekSec }) => {
  const rawRef = useRef<HTMLVideoElement>(null);
  const annotatedRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipsRef = useRef<Array<{ t: number; label: string }>>([]);
  const [mode, setMode] = useState<OverlayMode>(defaultMode);
  const [showOverlay, setShowOverlay] = useState(defaultShowOverlay);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    faceBox: true,
    idealZone: false,
    center: false,
    motion: true,
    pose: true,
    emotions: true,
    landmarks: true,
  });
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; timestamp: number; type: 'info' | 'warning' | 'success' }>>([]);
  const prevCenterRef = useRef<{ x: number; y: number } | null>(null);
  const latestLandmarksRef = useRef<Array<{ x: number; y: number }> | null>(null);
  const latestPoseRef = useRef<Array<{ x: number; y: number; z?: number; visibility?: number }> | null>(null);
  const latestEmotionRef = useRef<{ label: string; confidence: number } | null>(null);
  const timelineStart = useMemo(() => (timeline && timeline.length > 0 ? timeline[0].timestamp : null), [timeline]);

  // Sync playback between videos
  useEffect(() => {
    const sync = () => {
      const raw = rawRef.current;
      const ann = annotatedRef.current;
      if (!raw || !ann) return;
      ann.currentTime = raw.currentTime;
      if (raw.paused) ann.pause(); else ann.play();
    };
    const raw = rawRef.current;
    raw?.addEventListener('play', sync);
    raw?.addEventListener('pause', sync);
    raw?.addEventListener('seeked', sync);
    return () => {
      raw?.removeEventListener('play', sync);
      raw?.removeEventListener('pause', sync);
      raw?.removeEventListener('seeked', sync);
    };
  }, []);

  // External seek from parent
  useEffect(() => {
    if (typeof externalSeekSec === 'number' && rawRef.current) {
      rawRef.current.currentTime = Math.max(0, externalSeekSec);
    }
  }, [externalSeekSec]);

  // Build change-point chips from timeline
  useEffect(() => {
    if (!timeline || timeline.length === 0) { chipsRef.current = []; return; }
    const arr: Array<{ t: number; label: string }> = [];
    for (const p of timeline) {
      const temporal: any = (p as any).temporal;
      if (temporal?.changePoints?.length) {
        const cp = temporal.changePoints[0];
        arr.push({ t: p.timestamp, label: `${cp.signal} Δ${cp.magnitude.toFixed(1)}` });
      }
    }
    chipsRef.current = arr;
  }, [timeline]);

  // Rich overlay with FaceDetector, optional FaceMesh landmarks, and Pose skeleton
  useEffect(() => {
    if (!showOverlay) return;
    const video = mode === 'split' ? annotatedRef.current : rawRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let raf: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let detector: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const FaceDetectorCtor: any = (window as any).FaceDetector;
      detector = FaceDetectorCtor ? new FaceDetectorCtor() : null;
    } catch (err) {
      detector = null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let faceMesh: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pose: any = null;
    try {
      // Check if worker is active - suppress if so to avoid conflicts
      const workerActive = (window as any).__kelv_worker_cv_active__ === true;
      if (workerActive) {
        faceMesh = null;
        pose = null;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FaceMeshCtor: any = (window as any).FaceMesh;
        faceMesh = FaceMeshCtor ? new FaceMeshCtor({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        }) : null;
        if (faceMesh && typeof faceMesh.setOptions === 'function' && typeof faceMesh.onResults === 'function') {
          faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true });
          faceMesh.onResults((results: any) => {
            const lm = results?.multiFaceLandmarks?.[0];
            if (lm) {
              latestLandmarksRef.current = lm.map((p: any) => ({ x: p.x, y: p.y }));
            } else {
              latestLandmarksRef.current = null;
            }
          });
        } else {
          faceMesh = null;
        }
        // Pose
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const PoseCtor: any = (window as any).Pose;
        pose = PoseCtor ? new PoseCtor({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` }) : null;
        if (pose && typeof pose.setOptions === 'function' && typeof pose.onResults === 'function') {
          pose.setOptions({ modelComplexity: 0, selfieMode: true, smoothLandmarks: true });
          pose.onResults((results: any) => {
            const lm = results?.poseLandmarks;
            latestPoseRef.current = lm ? lm.map((p: any) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility })) : null;
          });
        } else {
          pose = null;
        }
      }
    } catch (err) {
      faceMesh = null;
      pose = null;
    }
    const lastDetectRef = { t: 0 } as { t: number };
    const lastPoseDetectRef = { t: 0 } as { t: number };

    const drawSpineAndSkeleton = (poseLm: Array<{ x: number; y: number; visibility?: number }> | null) => {
      if (!poseLm || !ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;
      const toXY = (i: number) => ({ x: (poseLm[i].x || 0) * W, y: (poseLm[i].y || 0) * H });
      const drawLine = (i: number, j: number, color = 'rgba(59,130,246,0.9)') => {
        const a = toXY(i), b = toXY(j);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      };
      // shoulders and hips
      drawLine(11, 12);
      drawLine(23, 24);
      drawLine(11, 23);
      drawLine(12, 24);
      // center spine
      const ls = toXY(11), rs = toXY(12), lh = toXY(23), rh = toXY(24);
      const midS = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      const midH = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
      ctx.strokeStyle = 'rgba(34,197,94,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(midS.x, midS.y);
      ctx.lineTo(midH.x, midH.y);
      ctx.stroke();
      // limbs
      drawLine(11, 13); drawLine(13, 15);
      drawLine(12, 14); drawLine(14, 16);
      drawLine(23, 25); drawLine(25, 27);
      drawLine(24, 26); drawLine(26, 28);
    };

    const estimateEmotionFromLandmarks = (lm: Array<{ x: number; y: number }>) => {
      const needed = [13, 14, 61, 291, 159, 145, 386, 374];
      for (const i of needed) if (!lm[i]) return null;
      const mouthTop = lm[13];
      const mouthBot = lm[14];
      const mouthLeft = lm[61];
      const mouthRight = lm[291];
      const eyeLT = lm[159];
      const eyeLB = lm[145];
      const eyeRT = lm[386];
      const eyeRB = lm[374];
      const mouthOpen = Math.hypot(mouthTop.x - mouthBot.x, mouthTop.y - mouthBot.y);
      const mouthWidth = Math.hypot(mouthLeft.x - mouthRight.x, mouthLeft.y - mouthRight.y);
      const mouthOpenRatio = mouthOpen / (mouthWidth + 1e-6);
      const eyeLOpen = Math.hypot(eyeLT.y - eyeLB.y, eyeLT.x - eyeLB.x);
      const eyeROpen = Math.hypot(eyeRT.y - eyeRB.y, eyeRT.x - eyeRB.x);
      const eyeOpen = (eyeLOpen + eyeROpen) / 2;
      let label = 'Neutral';
      let conf = 0.6;
      if (mouthOpenRatio > 0.25 && eyeOpen > 0.02) { label = 'Surprised'; conf = 0.75; }
      else if (mouthOpenRatio > 0.12 && mouthWidth > 0.18) { label = 'Happy'; conf = 0.7; }
      else if (eyeOpen < 0.01 && mouthOpenRatio < 0.08) { label = 'Calm'; conf = 0.65; }
      return { label, confidence: conf };
    };
    let lastTfRun = 0;
    const draw = () => {
      try {
        if (!ctx || !video) return;
        if (!video.videoWidth || !video.videoHeight) {
          raf = requestAnimationFrame(draw);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

      const idealW = canvas.width * 0.33;
      const idealH = canvas.height * 0.40;
      const idealX = (canvas.width - idealW) / 2;
      const idealY = (canvas.height - idealH) / 2;

      const render = (faceBox?: { x: number; y: number; width: number; height: number }) => {
        if (layers.idealZone) {
          ctx.strokeStyle = 'rgba(56,189,248,0.8)';
          ctx.lineWidth = 2;
          ctx.strokeRect(idealX, idealY, idealW, idealH);
        }
        let center: { x: number; y: number } | null = null;
        if (faceBox && layers.faceBox) {
          ctx.strokeStyle = 'rgba(255,165,0,0.9)';
          ctx.lineWidth = 2;
          ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
          center = { x: faceBox.x + faceBox.width / 2, y: faceBox.y + faceBox.height / 2 };
        }
        if (layers.center) {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, 0);
          ctx.lineTo(canvas.width / 2, canvas.height);
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
        if (center && layers.motion) {
          const prev = prevCenterRef.current;
          if (prev) {
            ctx.strokeStyle = 'rgba(34,197,94,0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(center.x, center.y);
            ctx.stroke();
          }
          prevCenterRef.current = center;
        }
        // Labels layer removed as requested - no text overlays on video
        };

        // Enhanced face mesh landmarks with detailed feature mapping and animations
        if (layers.landmarks && latestLandmarksRef.current && faceMesh) {
          const landmarks = latestLandmarksRef.current;
          const time = Date.now() / 1000;
          const pulse = Math.sin(time * 3) * 0.3 + 0.7; // Pulsing effect
          
          // Eye landmarks with enhanced visibility and animation
          ctx.fillStyle = `rgba(34,197,94,${0.8 * pulse})`;
          ctx.strokeStyle = `rgba(34,197,94,${0.9})`;
          ctx.lineWidth = 1;
          const eyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];
          eyeIndices.forEach(i => {
            if (landmarks[i]) {
              const x = landmarks[i].x * canvas.width;
              const y = landmarks[i].y * canvas.height;
              const radius = 2 + Math.sin(time * 4 + i) * 0.5; // Dynamic radius
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          });
          
          // Mouth landmarks with enhanced visibility
          ctx.fillStyle = `rgba(239,68,68,${0.8 * pulse})`;
          ctx.strokeStyle = `rgba(239,68,68,${0.9})`;
          const mouthIndices = [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 78, 82, 13, 312, 311, 310, 415, 95, 88, 178, 87, 14, 317, 402, 318, 324];
          mouthIndices.forEach(i => {
            if (landmarks[i]) {
              const x = landmarks[i].x * canvas.width;
              const y = landmarks[i].y * canvas.height;
              const radius = 2 + Math.sin(time * 3 + i) * 0.5;
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          });
          
          // Nose landmarks with enhanced visibility
          ctx.fillStyle = `rgba(251,191,36,${0.8 * pulse})`;
          ctx.strokeStyle = `rgba(251,191,36,${0.9})`;
          const noseIndices = [1, 2, 5, 4, 6, 19, 20, 94, 125, 141, 235, 236, 3, 51, 48, 115, 131, 134, 102, 49, 220, 305, 281, 363, 360, 279];
          noseIndices.forEach(i => {
            if (landmarks[i]) {
              const x = landmarks[i].x * canvas.width;
              const y = landmarks[i].y * canvas.height;
              const radius = 1.5 + Math.sin(time * 2 + i) * 0.3;
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          });
          
          // Add connecting lines for key facial features
          ctx.strokeStyle = `rgba(59,130,246,${0.4 * pulse})`;
          ctx.lineWidth = 1;
          
          // Eye contours
          const leftEyeContour = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
          const rightEyeContour = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];
          
          [leftEyeContour, rightEyeContour].forEach(contour => {
            ctx.beginPath();
            contour.forEach((i, idx) => {
              if (landmarks[i]) {
                const x = landmarks[i].x * canvas.width;
                const y = landmarks[i].y * canvas.height;
                if (idx === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
            });
            ctx.closePath();
            ctx.stroke();
          });
          
          // Eyebrow landmarks (purple)
          ctx.fillStyle = 'rgba(147,51,234,0.9)';
          const eyebrowIndices = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46, 285, 295, 282, 283, 276, 293, 334, 296, 336, 285, 300, 293, 334, 296];
          eyebrowIndices.forEach(i => {
            if (landmarks[i]) {
              const x = landmarks[i].x * canvas.width;
              const y = landmarks[i].y * canvas.height;
              ctx.beginPath();
              ctx.arc(x, y, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          
          // Face contour (blue)
          ctx.fillStyle = 'rgba(59,130,246,0.7)';
          const contourIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
          contourIndices.forEach(i => {
            if (landmarks[i]) {
              const x = landmarks[i].x * canvas.width;
              const y = landmarks[i].y * canvas.height;
              ctx.beginPath();
              ctx.arc(x, y, 1.0, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }
        if (layers.pose && latestPoseRef.current) {
          drawSpineAndSkeleton(latestPoseRef.current);
        }

        // Pull worker-provided landmarks if available (minimize main-thread inference)
        const proceed = async () => {
          try {
            const now = performance.now();
            // Enhanced 60fps analysis - process every ~16ms for 60fps
            if (faceMesh && layers.landmarks && now - lastDetectRef.t > 16) {
              await faceMesh.send({ image: video });
              lastDetectRef.t = now;
              if (latestLandmarksRef.current) {
                const heuristic = estimateEmotionFromLandmarks(latestLandmarksRef.current);
                if (heuristic) latestEmotionRef.current = heuristic;
                if (layers.emotions && performance.now() - lastTfRun > 100) {
                  await ensureEmotionModel().catch(() => undefined);
                  const fv = landmarksToFeatures(latestLandmarksRef.current);
                  if (fv.length) {
                    const pred = await classifyEmotion(fv).catch(() => null);
                    if (pred && pred.confidence >= 0.5) latestEmotionRef.current = pred;
                  }
                  lastTfRun = performance.now();
                }
              }
            }
            if (pose && layers.pose && performance.now() - lastPoseDetectRef.t > 16) {
              await pose.send({ image: video });
              lastPoseDetectRef.t = performance.now();
            }
            // Ingest worker landmarks when available and detect changes
            try {
              const overlay = (window as any).__kelv_cv_overlay__;
              if (overlay?.faceLandmarks && Array.isArray(overlay.faceLandmarks)) {
                const prevLandmarks = latestLandmarksRef.current;
                latestLandmarksRef.current = overlay.faceLandmarks;
                
                // Detect significant changes in facial expression
                if (prevLandmarks && overlay.faceLandmarks.length > 0) {
                  const currentEmotion = estimateEmotionFromLandmarks(overlay.faceLandmarks);
                  const prevEmotion = estimateEmotionFromLandmarks(prevLandmarks);
                  
                  if (currentEmotion && prevEmotion && currentEmotion.label !== prevEmotion.label) {
                    const notification = {
                      id: `emotion-${Date.now()}`,
                      message: `Facial expression changed to ${currentEmotion.label}`,
                      timestamp: Date.now(),
                      type: 'info' as const
                    };
                    setNotifications(prev => [...prev.slice(-4), notification]);
                  }
                }
              }
              if (overlay?.poseLandmarks && Array.isArray(overlay.poseLandmarks)) {
                const prevPose = latestPoseRef.current;
                latestPoseRef.current = overlay.poseLandmarks;
                
                // Detect posture changes
                if (prevPose && overlay.poseLandmarks.length > 0) {
                  const currentShoulder = overlay.poseLandmarks[11];
                  const prevShoulder = prevPose[11];
                  
                  if (currentShoulder && prevShoulder) {
                    const movement = Math.abs(currentShoulder.y - prevShoulder.y);
                    if (movement > 0.05) {
                      const notification = {
                        id: `posture-${Date.now()}`,
                        message: movement > 0.1 ? 'Significant posture change detected' : 'Posture adjustment detected',
                        timestamp: Date.now(),
                        type: movement > 0.1 ? 'warning' as const : 'info' as const
                      };
                      setNotifications(prev => [...prev.slice(-4), notification]);
                    }
                  }
                }
              }
            } catch { /* ignore */ }
          } catch (_) {
            // ignore
          }

          let faceBox: { x: number; y: number; width: number; height: number } | undefined;

          // Enhanced face detection at 60fps
          const now = performance.now();
          const shouldDetect = now - lastDetectRef.t > 16;
          if (detector && shouldDetect) {
            try {
              const faces: Array<{ boundingBox: DOMRect }> = await detector.detect(video);
              const box = faces && faces[0]?.boundingBox;
              if (box) {
                faceBox = { x: box.x, y: box.y, width: box.width, height: box.height };
              }
              lastDetectRef.t = now;
            } catch (_) {
              // ignore
            }
          }

          render(faceBox);
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && (video as any).requestVideoFrameCallback) {
            (video as any).requestVideoFrameCallback(() => draw());
          } else {
            raf = requestAnimationFrame(draw);
          }
        };

        void proceed();
      } catch (err) {
        // Swallow overlay errors to avoid breaking the page
      }
    };
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && (video as any).requestVideoFrameCallback) {
      (video as any).requestVideoFrameCallback(() => draw());
    } else {
      raf = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(raf);
  }, [showOverlay, mode, layers, timeline, timelineStart]);

  return (
    <div className="space-y-2">
      
      {mode === 'split' ? (
        <div className="flex gap-4">
          <video ref={rawRef} src={src} controls className="w-1/2 rounded-lg" />
          <div className="relative w-1/2">
            <video ref={annotatedRef} src={src} className="w-full rounded-lg" muted />
            {showOverlay && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />}
          </div>
        </div>
      ) : (
        <div className="relative">
          <video ref={rawRef} src={src} controls className="w-full rounded-lg" />
          {showOverlay && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />}
        </div>
      )}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          className="px-3 py-1 bg-dark-600 text-white text-xs rounded"
          onClick={() => setMode(mode === 'split' ? 'overlay' : 'split')}
        >
          {mode === 'split' ? 'Overlay' : 'Side-by-Side'}
        </button>
        <button
          className={`px-4 py-2 text-xs rounded-lg font-medium transition-all duration-200 ${
            showOverlay 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
              : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
          }`}
          onClick={() => setShowOverlay(!showOverlay)}
        >
          {showOverlay ? '✓ Annotations Active' : 'Show Annotations'}
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={layers.faceBox} onChange={e => setLayers(v => ({ ...v, faceBox: e.target.checked }))} /> Box
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={layers.idealZone} onChange={e => setLayers(v => ({ ...v, idealZone: e.target.checked }))} /> Ideal
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={layers.center} onChange={e => setLayers(v => ({ ...v, center: e.target.checked }))} /> Center
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={layers.motion} onChange={e => setLayers(v => ({ ...v, motion: e.target.checked }))} /> Motion
          </label>

          <label className="flex items-center gap-1">
            <input type="checkbox" checked={layers.landmarks} onChange={e => setLayers(v => ({ ...v, landmarks: e.target.checked }))} /> Landmarks
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={layers.pose} onChange={e => setLayers(v => ({ ...v, pose: e.target.checked }))} /> Pose
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={layers.emotions} onChange={e => setLayers(v => ({ ...v, emotions: e.target.checked }))} /> Emotion
          </label>
        </div>
        {/* Enhanced Change-point chips with better styling */}
        {chipsRef.current.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Key Moments
            </h4>
            <div className="flex gap-2 flex-wrap">
              {chipsRef.current.map((c, i) => (
                <button
                  key={i}
                  className="group px-3 py-2 rounded-lg text-xs bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-200 border border-blue-500/40 hover:from-blue-600/30 hover:to-cyan-600/30 hover:border-blue-400/60 transition-all duration-200 flex items-center gap-2"
                  onClick={() => {
                    if (!rawRef.current || !timeline || timeline.length === 0) return;
                    const start = timeline[0].timestamp;
                    const seconds = (c.t - start) / 1000;
                    rawRef.current.currentTime = Math.max(0, seconds);
                  }}
                  title={`Jump to ${new Date((c.t - (timeline?.[0]?.timestamp || c.t))).toISOString().substr(14, 5)}`}
                >
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:bg-cyan-400 transition-colors"></div>
                  <span className="font-medium">{c.label}</span>
                  <div className="text-gray-400 text-xs">
                    {timeline && new Date((c.t - timeline[0].timestamp)).toISOString().substr(14, 5)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoReview;
