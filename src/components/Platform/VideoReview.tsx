import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { CameraTimelinePoint } from '../../types/analytics';
import { ensureEmotionModel, landmarksToFeatures, classifyEmotion } from '../../utils/emotionClassifier';

interface VideoReviewProps {
  src: string;
  timeline?: CameraTimelinePoint[];
  defaultMode?: OverlayMode;
  defaultShowOverlay?: boolean;
}

// Enhanced overlay types
type OverlayMode = 'split' | 'overlay';
type Layer = 'faceBox' | 'idealZone' | 'center' | 'motion' | 'labels' | 'pose' | 'emotions' | 'landmarks';

const VideoReview: React.FC<VideoReviewProps> = ({ src, timeline, defaultMode = 'split', defaultShowOverlay = false }) => {
  const rawRef = useRef<HTMLVideoElement>(null);
  const annotatedRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<OverlayMode>(defaultMode);
  const [showOverlay, setShowOverlay] = useState(defaultShowOverlay);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    faceBox: true,
    idealZone: true,
    center: true,
    motion: true,
    labels: true,
    pose: true,
    emotions: true,
    landmarks: false,
  });
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

  // Rich overlay with FaceDetector, optional FaceMesh landmarks, and Pose skeleton
  useEffect(() => {
    if (!showOverlay) return;
    const video = mode === 'split' ? annotatedRef.current : rawRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
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
        if (layers.labels) {
          const faceRatio = faceBox ? (faceBox.width * faceBox.height) / (canvas.width * canvas.height) : 0;
          const idealRatio = 0.10;
          const distX = center ? Math.abs(center.x - canvas.width / 2) / (canvas.width / 2) : 0;
          const distY = center ? Math.abs(center.y - canvas.height / 2) / (canvas.height / 2) : 0;
          const eyeContact = Math.max(0, 1 - (distX + distY) / 2);
          const distanceScore = Math.max(0, 1 - Math.abs(faceRatio - idealRatio) / idealRatio);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(10, 10, 380, 120);
          ctx.fillStyle = '#fff';
          ctx.font = '12px monospace';
          ctx.fillText(`Eye Contact≈ ${(eyeContact * 100).toFixed(0)}%`, 18, 28);
          ctx.fillText(`Framing≈ ${(Math.max(0, 1 - Math.max(distX, distY)) * 100).toFixed(0)}%`, 18, 44);
          ctx.fillText(`Distance≈ ${(distanceScore * 100).toFixed(0)}%`, 18, 60);
          if (layers.emotions && latestEmotionRef.current) {
            ctx.fillText(`Emotion: ${latestEmotionRef.current.label} (${Math.round(latestEmotionRef.current.confidence * 100)}%)`, 18, 76);
          }
          // timeline-driven debug overlay
          if (timeline && timelineStart !== null) {
            const absTime = timelineStart + video.currentTime * 1000;
            let nearest: CameraTimelinePoint | null = null;
            let best = Infinity;
            for (const p of timeline) {
              const d = Math.abs(p.timestamp - absTime);
              if (d < best) { best = d; nearest = p; }
            }
            if (nearest && best <= 3000) {
              ctx.fillText(`Off-Frame ${(Math.round((nearest.cameraPresence.offFrame || 0) * 100))}%`, 18, 76);
              if (nearest.triggers && nearest.triggers.length) {
                ctx.fillText(`Flags: ${nearest.triggers.slice(0,2).join(' | ')}`, 18, 92);
              }
              const dbg = nearest.cameraPresence.debug;
              if (dbg?.faceBox) {
                ctx.strokeStyle = 'rgba(250,204,21,0.9)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(dbg.faceBox.x, dbg.faceBox.y, dbg.faceBox.width, dbg.faceBox.height);
              }
            }
          }
        }
        };

        // Face mesh landmarks if available
        if (layers.landmarks && latestLandmarksRef.current && faceMesh) {
          ctx.fillStyle = 'rgba(59,130,246,0.9)';
          for (const p of latestLandmarksRef.current) {
            const x = p.x * canvas.width;
            const y = p.y * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (layers.pose && latestPoseRef.current) {
          drawSpineAndSkeleton(latestPoseRef.current);
        }

        // Pull worker-provided landmarks if available (minimize main-thread inference)
        const proceed = async () => {
          try {
            const now = performance.now();
            if (faceMesh && layers.landmarks && now - lastDetectRef.t > 70) {
              await faceMesh.send({ image: video });
              lastDetectRef.t = now;
              if (latestLandmarksRef.current) {
                const heuristic = estimateEmotionFromLandmarks(latestLandmarksRef.current);
                if (heuristic) latestEmotionRef.current = heuristic;
                if (layers.emotions && performance.now() - lastTfRun > 200) {
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
            if (pose && layers.pose && performance.now() - lastPoseDetectRef.t > 70) {
              await pose.send({ image: video });
              lastPoseDetectRef.t = performance.now();
            }
            // Ingest worker landmarks when available
            try {
              const overlay = (window as any).__kelv_cv_overlay__;
              if (overlay?.faceLandmarks && Array.isArray(overlay.faceLandmarks)) {
                latestLandmarksRef.current = overlay.faceLandmarks;
              }
              if (overlay?.poseLandmarks && Array.isArray(overlay.poseLandmarks)) {
                latestPoseRef.current = overlay.poseLandmarks;
              }
            } catch { /* ignore */ }
          } catch (_) {
            // ignore
          }

          let faceBox: { x: number; y: number; width: number; height: number } | undefined;

          // Throttle face detection to ~8fps
          const now = performance.now();
          const shouldDetect = now - lastDetectRef.t > 125;
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
          className="px-3 py-1 bg-dark-600 text-white text-xs rounded"
          onClick={() => setShowOverlay(!showOverlay)}
        >
          {showOverlay ? 'Hide Annotations' : 'Show Annotations'}
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
            <input type="checkbox" checked={layers.labels} onChange={e => setLayers(v => ({ ...v, labels: e.target.checked }))} /> Labels
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
      </div>
    </div>
  );
};

export default VideoReview;
