import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPoseDetector, PoseDetector, PostureMetrics } from '../utils/poseDetector';

export interface PostureSample {
  timestamp: number;
  elapsedSeconds: number;
  metrics: PostureMetrics;
}

export interface AggregatedPostureData {
  shoulderAlignment: number;      // Average score 0-100
  headPosition: 'centered' | 'forward' | 'tilted';  // Most common
  overallScore: number;           // Weighted average 0-100
  timeInGoodPosture: number;      // Percentage 0-100
  sampleCount: number;
  samples: PostureSample[];
}

export interface UsePoseTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  sampleIntervalMs?: number;  // Default: 10000 (10 seconds)
}

export interface UsePoseTrackingReturn {
  isInitialized: boolean;
  initError: string | null;
  samples: PostureSample[];
  currentPosture: PostureMetrics | null;
  aggregatedData: AggregatedPostureData | null;
}

function aggregatePosture(samples: PostureSample[]): AggregatedPostureData {
  if (samples.length === 0) {
    return {
      shoulderAlignment: 0,
      headPosition: 'centered',
      overallScore: 0,
      timeInGoodPosture: 0,
      sampleCount: 0,
      samples: []
    };
  }

  // Average shoulder alignment
  const avgShoulder = Math.round(
    samples.reduce((sum, s) => sum + s.metrics.shoulderAlignment, 0) / samples.length
  );

  // Most common head position
  const headPositionCounts = { centered: 0, forward: 0, tilted: 0 };
  samples.forEach(s => headPositionCounts[s.metrics.headPosition]++);
  const dominantHead = Object.entries(headPositionCounts)
    .sort((a, b) => b[1] - a[1])[0][0] as 'centered' | 'forward' | 'tilted';

  // Percentage of time in good posture
  const goodPostureCount = samples.filter(s => s.metrics.isGoodPosture).length;
  const timeInGoodPosture = Math.round((goodPostureCount / samples.length) * 100);

  // Overall score: weighted combination
  const headScore = dominantHead === 'centered' ? 100 : dominantHead === 'forward' ? 50 : 30;
  const overallScore = Math.round(
    avgShoulder * 0.4 +
    headScore * 0.3 +
    timeInGoodPosture * 0.3
  );

  return {
    shoulderAlignment: avgShoulder,
    headPosition: dominantHead,
    overallScore,
    timeInGoodPosture,
    sampleCount: samples.length,
    samples
  };
}

export function usePoseTracking(options: UsePoseTrackingOptions): UsePoseTrackingReturn {
  const { videoRef, enabled, sampleIntervalMs = 10000 } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [samples, setSamples] = useState<PostureSample[]>([]);
  const [currentPosture, setCurrentPosture] = useState<PostureMetrics | null>(null);

  const detectorRef = useRef<PoseDetector | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const enabledRef = useRef(enabled);

  // Keep enabled ref in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Initialize detector when enabled
  useEffect(() => {
    if (!enabled) {
      // Cleanup when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let mounted = true;

    const init = async () => {
      try {
        console.log('[usePoseTracking] Initializing...');
        const detector = createPoseDetector();
        const success = await detector.initialize();

        if (!mounted) {
          detector.dispose();
          return;
        }

        if (success) {
          detectorRef.current = detector;
          startTimeRef.current = Date.now();
          setIsInitialized(true);
          setInitError(null);
          console.log('[usePoseTracking] Initialized successfully');
        } else {
          setInitError('Failed to initialize pose detector');
          console.warn('[usePoseTracking] Initialization failed');
        }
      } catch (error) {
        if (mounted) {
          setInitError('Failed to initialize pose detector');
          console.error('[usePoseTracking] Init error:', error);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [enabled]);

  // Sampling function
  const takeSample = useCallback(async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (!video || !detector || !detector.isReady() || !enabledRef.current) {
      return;
    }

    try {
      const keypoints = await detector.detectPose(video);
      if (!keypoints) {
        console.log('[usePoseTracking] No keypoints detected, skipping sample');
        return;
      }

      const metrics = detector.analyzePosture(keypoints);
      const now = Date.now();
      const elapsed = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;

      const sample: PostureSample = {
        timestamp: now,
        elapsedSeconds: elapsed,
        metrics
      };

      setCurrentPosture(metrics);
      setSamples(prev => [...prev, sample]);

      console.log('[usePoseTracking] Sample taken:', {
        elapsed: Math.round(elapsed),
        shoulderAlignment: metrics.shoulderAlignment,
        headPosition: metrics.headPosition,
        isGood: metrics.isGoodPosture
      });
    } catch (error) {
      console.warn('[usePoseTracking] Sample error:', error);
    }
  }, [videoRef]);

  // Start sampling interval when initialized
  useEffect(() => {
    if (!isInitialized || !enabled) {
      return;
    }

    // Take first sample immediately
    takeSample();

    // Then sample at interval
    intervalRef.current = setInterval(takeSample, sampleIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isInitialized, enabled, sampleIntervalMs, takeSample]);

  // Reset samples when disabled
  useEffect(() => {
    if (!enabled) {
      setSamples([]);
      setCurrentPosture(null);
      startTimeRef.current = null;
    }
  }, [enabled]);

  // Compute aggregated data
  const aggregatedData = useMemo(() => {
    if (samples.length === 0) return null;
    return aggregatePosture(samples);
  }, [samples]);

  return {
    isInitialized,
    initError,
    samples,
    currentPosture,
    aggregatedData
  };
}
