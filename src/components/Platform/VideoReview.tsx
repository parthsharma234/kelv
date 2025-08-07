import React, { useRef, useState, useEffect } from 'react';

interface VideoReviewProps {
  src: string;
}

const VideoReview: React.FC<VideoReviewProps> = ({ src }) => {
  const rawRef = useRef<HTMLVideoElement>(null);
  const annotatedRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'split' | 'overlay'>('split');
  const [showOverlay, setShowOverlay] = useState(true);

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

  // Simple overlay placeholder
  useEffect(() => {
    if (!showOverlay) return;
    const video = mode === 'split' ? annotatedRef.current : rawRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    let raf: number;
    const draw = () => {
      if (!ctx || !video) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255,165,0,0.8)';
      ctx.lineWidth = 2;
      const w = canvas.width * 0.5;
      const h = canvas.height * 0.6;
      ctx.strokeRect((canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [showOverlay, mode]);

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
      <div className="flex gap-2">
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
      </div>
    </div>
  );
};

export default VideoReview;
