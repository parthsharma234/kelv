// Hook for integrating Hume Expression Measurement during interviews
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  HumeExpressionMeasurementClient,
  ExpressionMeasurementConfig,
  ProsodyPrediction,
  LanguagePrediction,
  FacePrediction,
  EmotionScore,
  ExpressionMeasurementResponse
} from '../utils/humeExpressionMeasurement';

interface UseExpressionMeasurementOptions {
  enabled?: boolean;
  enableProsody?: boolean; // Voice emotion analysis
  enableLanguage?: boolean; // Text emotion analysis
  enableFace?: boolean; // Facial expression analysis
  onProsodyMeasurement?: (prediction: ProsodyPrediction) => void;
  onLanguageMeasurement?: (prediction: LanguagePrediction) => void;
  onFaceMeasurement?: (prediction: FacePrediction) => void;
  onError?: (error: Error) => void;
}

interface ExpressionMetrics {
  prosodyPredictions: ProsodyPrediction[];
  languagePredictions: LanguagePrediction[];
  facePredictions: FacePrediction[];
  aggregatedEmotions: Map<string, number>;
  topEmotions: EmotionScore[];
}

export function useExpressionMeasurement(options: UseExpressionMeasurementOptions = {}) {
  const {
    enabled = true,
    enableProsody = true,
    enableLanguage = true,
    enableFace = false,
    onProsodyMeasurement,
    onLanguageMeasurement,
    onFaceMeasurement,
    onError
  } = options;

  const clientRef = useRef<HumeExpressionMeasurementClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Store all predictions for aggregation
  const prosodyPredictionsRef = useRef<ProsodyPrediction[]>([]);
  const languagePredictionsRef = useRef<LanguagePrediction[]>([]);
  const facePredictionsRef = useRef<FacePrediction[]>([]);

  // Audio buffer management (accumulate 2-3 seconds before sending)
  const audioBufferRef = useRef<ArrayBuffer[]>([]);
  const audioBufferTimerRef = useRef<NodeJS.Timeout | null>(null);
  const AUDIO_BUFFER_INTERVAL = 3000; // Send audio every 3 seconds

  // Initialize client
  const connect = useCallback(async () => {
    if (!enabled || clientRef.current?.isConnectedToAPI()) {
      return;
    }

    try {
      const config: ExpressionMeasurementConfig = {
        enableProsody,
        enableLanguage,
        enableFace,
        rawText: true,
      };

      clientRef.current = new HumeExpressionMeasurementClient(
        import.meta.env.VITE_HUME_API_KEY,
        config
      );

      // Set up event listeners
      clientRef.current.on('connection.opened', () => {
        console.log('[Expression Measurement] Connected');
        setIsConnected(true);
        setIsAnalyzing(false);
      });

      clientRef.current.on('connection.closed', () => {
        console.log('[Expression Measurement] Disconnected');
        setIsConnected(false);
        setIsAnalyzing(false);
      });

      clientRef.current.on('error', (error: Error) => {
        console.error('[Expression Measurement] Error:', error);
        onError?.(error);
      });

      // Handle prosody (voice) measurements
      clientRef.current.on('measurement.prosody', (prediction: ProsodyPrediction) => {
        prosodyPredictionsRef.current.push(prediction);
        onProsodyMeasurement?.(prediction);

        // Log top emotions from this prediction
        const topEmotions = HumeExpressionMeasurementClient.getTopEmotions(prediction.emotions, 3);
        console.log('[Prosody] Top emotions:', topEmotions.map(e => `${e.name}: ${e.score.toFixed(3)}`).join(', '));
      });

      // Handle language (text) measurements
      clientRef.current.on('measurement.language', (prediction: LanguagePrediction) => {
        languagePredictionsRef.current.push(prediction);
        onLanguageMeasurement?.(prediction);

        // Log top emotions from this prediction
        const topEmotions = HumeExpressionMeasurementClient.getTopEmotions(prediction.emotions, 3);
        console.log('[Language] Text:', prediction.text, '| Top emotions:', topEmotions.map(e => `${e.name}: ${e.score.toFixed(3)}`).join(', '));
      });

      // Handle face measurements
      if (enableFace) {
        clientRef.current.on('measurement.face', (prediction: FacePrediction) => {
          facePredictionsRef.current.push(prediction);
          onFaceMeasurement?.(prediction);

          const topEmotions = HumeExpressionMeasurementClient.getTopEmotions(prediction.emotions, 3);
          console.log('[Face] Frame:', prediction.frame, '| Top emotions:', topEmotions.map(e => `${e.name}: ${e.score.toFixed(3)}`).join(', '));
        });
      }

      clientRef.current.on('measurement.complete', (response: ExpressionMeasurementResponse) => {
        setIsAnalyzing(false);
      });

      await clientRef.current.connect();
    } catch (error) {
      console.error('[Expression Measurement] Failed to connect:', error);
      onError?.(error as Error);
    }
  }, [enabled, enableProsody, enableLanguage, enableFace, onProsodyMeasurement, onLanguageMeasurement, onFaceMeasurement, onError]);

  // Disconnect client
  const disconnect = useCallback(() => {
    if (audioBufferTimerRef.current) {
      clearInterval(audioBufferTimerRef.current);
      audioBufferTimerRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    setIsConnected(false);
    setIsAnalyzing(false);
  }, []);

  // Send audio chunk for prosody analysis
  // Note: Audio should be PCM16, 48kHz, and we'll accumulate 2-3 seconds before sending
  const sendAudioChunk = useCallback((audioData: ArrayBuffer) => {
    if (!isConnected || !clientRef.current) {
      return;
    }

    audioBufferRef.current.push(audioData);

    // If we don't have a timer running, start one
    if (!audioBufferTimerRef.current) {
      audioBufferTimerRef.current = setTimeout(() => {
        // Concatenate accumulated audio buffers
        const totalLength = audioBufferRef.current.reduce((sum, buf) => sum + buf.byteLength, 0);
        const combinedBuffer = new ArrayBuffer(totalLength);
        const combinedView = new Uint8Array(combinedBuffer);

        let offset = 0;
        audioBufferRef.current.forEach(buffer => {
          combinedView.set(new Uint8Array(buffer), offset);
          offset += buffer.byteLength;
        });

        // Send combined buffer
        if (clientRef.current && combinedBuffer.byteLength > 0) {
          setIsAnalyzing(true);
          clientRef.current.sendAudioChunk(combinedBuffer);
        }

        // Clear buffer and timer
        audioBufferRef.current = [];
        audioBufferTimerRef.current = null;
      }, AUDIO_BUFFER_INTERVAL);
    }
  }, [isConnected]);

  // Send text for language emotion analysis
  const sendText = useCallback((text: string) => {
    if (!isConnected || !clientRef.current || !text.trim()) {
      return;
    }

    setIsAnalyzing(true);
    clientRef.current.sendText(text);
  }, [isConnected]);

  // Send image frame for facial expression analysis
  const sendImageFrame = useCallback((base64Image: string) => {
    if (!isConnected || !clientRef.current) {
      return;
    }

    setIsAnalyzing(true);
    clientRef.current.sendImageFrame(base64Image);
  }, [isConnected]);

  // Get aggregated expression metrics
  const getMetrics = useCallback((): ExpressionMetrics => {
    // Combine prosody and language predictions for aggregation
    const allPredictions = [
      ...prosodyPredictionsRef.current,
      ...languagePredictionsRef.current
    ];

    const aggregatedEmotions = HumeExpressionMeasurementClient.aggregateEmotions(allPredictions);

    // Convert to array and sort by score
    const topEmotions = Array.from(aggregatedEmotions.entries())
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      prosodyPredictions: [...prosodyPredictionsRef.current],
      languagePredictions: [...languagePredictionsRef.current],
      facePredictions: [...facePredictionsRef.current],
      aggregatedEmotions,
      topEmotions
    };
  }, []);

  // Clear all stored predictions
  const clearMetrics = useCallback(() => {
    prosodyPredictionsRef.current = [];
    languagePredictionsRef.current = [];
    facePredictionsRef.current = [];
  }, []);

  // Get emotion summary for a specific time range
  const getEmotionsInTimeRange = useCallback((startTime: number, endTime: number): EmotionScore[] => {
    const predictionsInRange = prosodyPredictionsRef.current.filter(
      p => p.time.begin >= startTime && p.time.end <= endTime
    );

    if (predictionsInRange.length === 0) {
      return [];
    }

    const aggregated = HumeExpressionMeasurementClient.aggregateEmotions(predictionsInRange);

    return Array.from(aggregated.entries())
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    isAnalyzing,
    connect,
    disconnect,

    // Send data for analysis
    sendAudioChunk,
    sendText,
    sendImageFrame,

    // Get results
    getMetrics,
    clearMetrics,
    getEmotionsInTimeRange,

    // Direct access to client for advanced use
    client: clientRef.current
  };
}
