// Hume AI Expression Measurement WebSocket Client
// For real-time emotional expression analysis during interviews

// Custom EventEmitter for browser compatibility
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: string, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }

  off(event: string, callback: Function): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Types for Expression Measurement
export interface EmotionScore {
  name: string;
  score: number;
}

export interface ProsodyPrediction {
  time: {
    begin: number;
    end: number;
  };
  emotions: EmotionScore[];
}

export interface LanguagePrediction {
  text: string;
  position: {
    begin: number;
    end: number;
  };
  emotions: EmotionScore[];
}

export interface FacePrediction {
  frame: number;
  time: number;
  bbox: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  emotions: EmotionScore[];
}

export interface ExpressionMeasurementResponse {
  prosody?: {
    predictions: ProsodyPrediction[];
  };
  language?: {
    predictions: LanguagePrediction[];
  };
  face?: {
    predictions: FacePrediction[];
  };
}

export interface ExpressionMeasurementConfig {
  enableProsody?: boolean; // Voice/audio emotion analysis
  enableLanguage?: boolean; // Text/language emotion analysis
  enableFace?: boolean; // Facial expression analysis
  rawText?: boolean; // Include raw text in language responses
}

export interface ExpressionMeasurementEvents {
  'connection.opened': () => void;
  'connection.closed': () => void;
  'error': (error: Error) => void;
  'measurement.prosody': (prediction: ProsodyPrediction) => void;
  'measurement.language': (prediction: LanguagePrediction) => void;
  'measurement.face': (prediction: FacePrediction) => void;
  'measurement.complete': (response: ExpressionMeasurementResponse) => void;
}

export class HumeExpressionMeasurementClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private config: ExpressionMeasurementConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private processingQueue: boolean = false;
  private lastActivityTime: number = Date.now();

  constructor(apiKey: string, config: ExpressionMeasurementConfig = {}) {
    super();
    this.apiKey = apiKey;
    this.config = {
      enableProsody: config.enableProsody ?? true, // Default: voice analysis on
      enableLanguage: config.enableLanguage ?? true, // Default: text analysis on
      enableFace: config.enableFace ?? false, // Default: face analysis off (requires video frames)
      rawText: config.rawText ?? true,
    };
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      // Hume Expression Measurement WebSocket endpoint
      // Use query param for browser compatibility (headers not supported in browser WebSocket API)
      const url = `wss://api.hume.ai/v0/stream/models?apiKey=${this.apiKey}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onerror = (event) => this.handleError(event);

    } catch (error) {
      this.emit('error', error);
    }
  }

  private handleOpen(): void {
    console.log('[Hume Expression] WebSocket opened');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.lastActivityTime = Date.now();
    this.emit('connection.opened');

    // Start keep-alive to prevent timeout (1 minute inactivity limit)
    this.startKeepAlive();
  }

  private startKeepAlive(): void {
    // Send keep-alive every 30 seconds to prevent timeout
    this.keepAliveInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivityTime;
      if (timeSinceLastActivity > 30000 && this.isConnected) {
        // Send a minimal request to keep connection alive
        this.sendKeepAlive();
      }
    }, 30000);
  }

  private sendKeepAlive(): void {
    if (!this.isConnected || !this.ws) return;

    // Send empty audio buffer as keep-alive
    const keepAliveMessage = {
      models: this.getEnabledModels(),
      data: '', // Empty data as ping
    };

    try {
      this.ws.send(JSON.stringify(keepAliveMessage));
      this.lastActivityTime = Date.now();
    } catch (error) {
      console.error('[Hume Expression] Keep-alive error:', error);
    }
  }

  private getEnabledModels(): any {
    const models: any = {};

    if (this.config.enableProsody) {
      models.prosody = {};
    }

    if (this.config.enableLanguage) {
      models.language = {};
    }

    if (this.config.enableFace) {
      models.face = {};
    }

    return models;
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('[Hume Expression] Received measurement');

      this.lastActivityTime = Date.now();

      // Handle prosody (voice) predictions
      if (data.prosody && data.prosody.predictions) {
        data.prosody.predictions.forEach((prediction: ProsodyPrediction) => {
          this.emit('measurement.prosody', prediction);
        });
      }

      // Handle language (text) predictions
      if (data.language && data.language.predictions) {
        data.language.predictions.forEach((prediction: LanguagePrediction) => {
          this.emit('measurement.language', prediction);
        });
      }

      // Handle face predictions
      if (data.face && data.face.predictions) {
        data.face.predictions.forEach((prediction: FacePrediction) => {
          this.emit('measurement.face', prediction);
        });
      }

      // Emit complete response
      this.emit('measurement.complete', data as ExpressionMeasurementResponse);

    } catch (error) {
      console.error('[Hume Expression] Error parsing message:', error);
      this.emit('error', new Error('Failed to parse expression measurement response'));
    }
  }

  private handleClose(event: CloseEvent): void {
    this.isConnected = false;
    this.emit('connection.closed');
    console.log('[Hume Expression] WebSocket closed:', event.code, event.reason);

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    // Attempt reconnection if not a normal closure
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  private handleError(error: Event): void {
    this.isConnected = false;
    this.emit('error', new Error('WebSocket connection error'));
    console.error('[Hume Expression] WebSocket error:', error);
  }

  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`[Hume Expression] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send audio data for prosody (voice emotion) analysis
   * Audio should be PCM16 format, 48kHz sample rate
   * Maximum 5 seconds per chunk
   */
  sendAudioChunk(audioData: ArrayBuffer): void {
    if (!this.isConnected || !this.ws) {
      console.warn('[Hume Expression] Not connected, queueing audio');
      this.audioQueue.push(audioData);
      return;
    }

    this.lastActivityTime = Date.now();

    // Convert audio to base64
    const base64Audio = this.arrayBufferToBase64(audioData);

    const message = {
      models: this.getEnabledModels(),
      raw_text: this.config.rawText,
      data: base64Audio,
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[Hume Expression] Error sending audio:', error);
      this.emit('error', new Error('Failed to send audio for analysis'));
    }
  }

  /**
   * Send text for language emotion analysis
   */
  sendText(text: string): void {
    if (!this.isConnected || !this.ws) {
      console.warn('[Hume Expression] Not connected');
      return;
    }

    this.lastActivityTime = Date.now();

    const message = {
      models: {
        language: {},
      },
      raw_text: this.config.rawText,
      data: text,
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[Hume Expression] Error sending text:', error);
      this.emit('error', new Error('Failed to send text for analysis'));
    }
  }

  /**
   * Send image frame for facial expression analysis
   * Image should be base64 encoded, max 3000x3000 pixels
   */
  sendImageFrame(base64Image: string): void {
    if (!this.isConnected || !this.ws) {
      console.warn('[Hume Expression] Not connected');
      return;
    }

    this.lastActivityTime = Date.now();

    const message = {
      models: {
        face: {},
      },
      data: base64Image,
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[Hume Expression] Error sending image:', error);
      this.emit('error', new Error('Failed to send image for analysis'));
    }
  }

  /**
   * Send video frame for combined face + prosody analysis
   * Video should be base64 encoded, max 5 seconds
   */
  sendVideoChunk(base64Video: string): void {
    if (!this.isConnected || !this.ws) {
      console.warn('[Hume Expression] Not connected');
      return;
    }

    this.lastActivityTime = Date.now();

    const message = {
      models: this.getEnabledModels(),
      raw_text: this.config.rawText,
      data: base64Video,
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[Hume Expression] Error sending video:', error);
      this.emit('error', new Error('Failed to send video for analysis'));
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  disconnect(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.ws && this.isConnected) {
      this.ws.close(1000, 'Client disconnect');
    }

    this.isConnected = false;
    this.ws = null;
    this.audioQueue = [];
  }

  isConnectedToAPI(): boolean {
    return this.isConnected;
  }

  /**
   * Get aggregated emotion statistics from multiple predictions
   */
  static aggregateEmotions(predictions: (ProsodyPrediction | LanguagePrediction)[]): Map<string, number> {
    const emotionMap = new Map<string, number>();
    const emotionCounts = new Map<string, number>();

    predictions.forEach(prediction => {
      prediction.emotions.forEach(emotion => {
        const currentScore = emotionMap.get(emotion.name) || 0;
        const currentCount = emotionCounts.get(emotion.name) || 0;

        emotionMap.set(emotion.name, currentScore + emotion.score);
        emotionCounts.set(emotion.name, currentCount + 1);
      });
    });

    // Calculate averages
    const averagedEmotions = new Map<string, number>();
    emotionMap.forEach((totalScore, emotionName) => {
      const count = emotionCounts.get(emotionName) || 1;
      averagedEmotions.set(emotionName, totalScore / count);
    });

    return averagedEmotions;
  }

  /**
   * Get top N emotions from a prediction
   */
  static getTopEmotions(emotions: EmotionScore[], topN: number = 5): EmotionScore[] {
    return [...emotions]
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
}

// Factory function to create a configured Expression Measurement client
export function createExpressionMeasurementClient(
  config: ExpressionMeasurementConfig = {}
): HumeExpressionMeasurementClient {
  const apiKey = import.meta.env.VITE_HUME_API_KEY;

  if (!apiKey || apiKey === 'your_hume_api_key_here') {
    throw new Error('Hume API key not configured');
  }

  return new HumeExpressionMeasurementClient(apiKey, config);
}
