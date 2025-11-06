// Hume AI Empathic Voice Interface (EVI) Client
// Based on Hume's WebSocket API for real-time voice conversations

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

// Types for Hume EVI session
export interface HumeConfig {
  configId?: string; // EVI config ID from Hume platform
  voice?: string; // Voice name (e.g., "Kelv")
  instructions?: string; // System prompt
  variables?: Record<string, string>; // Template variables for prompts
}

export interface TranscriptChunk {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isPartial: boolean;
}

export interface HumeEvents {
  'connection.opened': () => void;
  'connection.closed': () => void;
  'error': (error: Error) => void;
  'transcript.update': (chunk: TranscriptChunk) => void;
  'response.created': (event: any) => void;
  'response.done': (event: any) => void;
  'input_audio_buffer.speech_started': (event: any) => void;
  'input_audio_buffer.speech_stopped': (event: any) => void;
  'response.audio.delta': (event: any) => void;
  'input_audio_buffer.committed': () => void;
}

export class HumeRealtimeClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private configId: string;
  private variables: Record<string, string> | undefined;
  private isConnected: boolean = false;
  private sessionId: string | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private isRecording: boolean = false;
  private outputAudioContext: AudioContext | null = null;
  private outputGainNode: GainNode | null = null;
  private isPlayingAudio: boolean = false;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private audioChunks: ArrayBuffer[] = [];
  private currentResponseAudioChunks: ArrayBuffer[] = [];
  private audioQueue: ArrayBuffer[] = [];
  private processingAudio: boolean = false;

  constructor(apiKey: string, config: HumeConfig = {}, mediaStream?: MediaStream) {
    super();
    this.apiKey = apiKey;
    this.configId = config.configId || ''; // Will be set from platform
    this.variables = config.variables;

    if (mediaStream) {
      this.stream = mediaStream;
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      // Hume EVI WebSocket endpoint with API key, config, and variables in URL
      let url = `wss://api.hume.ai/v0/evi/chat?api_key=${encodeURIComponent(this.apiKey)}&config_id=${encodeURIComponent(this.configId)}`;

      // Add variables as query parameters if provided
      if (this.variables) {
        const variableParams = Object.entries(this.variables)
          .map(([key, value]) => `variables[${key}]=${encodeURIComponent(value)}`)
          .join('&');
        url += `&${variableParams}`;
      }

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
    console.log('[Hume] WebSocket opened, session starting...');
    // Connection established - Hume will send session_settings automatically
    // Mark as connected when we receive the first message
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('[Hume] Received:', data.type);

      // Handle different message types
      switch (data.type) {
        case 'session_settings':
          // Session established
          this.isConnected = true;
          this.sessionId = data.session_id;
          this.emit('connection.opened');
          break;

        case 'user_message':
          // User speech transcription
          this.handleUserTranscript(data);
          break;

        case 'assistant_message':
          // Assistant response (text)
          this.handleAssistantTranscript(data);
          break;

        case 'audio_output':
          // Audio from assistant
          this.handleAudioOutput(data);
          break;

        case 'user_interruption':
          // User interrupted the assistant
          this.emit('input_audio_buffer.speech_started', data);
          if (this.currentAudioSource) {
            this.currentAudioSource.stop();
            this.currentAudioSource = null;
            this.audioQueue = [];
          }
          break;

        case 'assistant_end':
          // Assistant finished speaking
          this.emit('response.done', data);
          break;

        case 'error':
          this.emit('error', new Error(data.message || 'Unknown error'));
          break;
      }
    } catch (error) {
      console.error('[Hume] Error parsing message:', error);
    }
  }

  private handleUserTranscript(data: any): void {
    const chunk: TranscriptChunk = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      text: data.text || '',
      timestamp: Date.now(),
      isPartial: data.is_final === false,
    };

    this.emit('transcript.update', chunk);

    if (!chunk.isPartial) {
      this.emit('input_audio_buffer.speech_stopped', data);
    }
  }

  private handleAssistantTranscript(data: any): void {
    const chunk: TranscriptChunk = {
      id: `assistant-${Date.now()}`,
      speaker: 'assistant',
      text: data.text || '',
      timestamp: Date.now(),
      isPartial: false,
    };

    this.emit('transcript.update', chunk);
    this.emit('response.created', data);
  }

  private handleAudioOutput(data: any): void {
    if (data.data) {
      // Audio data is base64 encoded
      this.audioQueue.push(this.base64ToArrayBuffer(data.data));
      this.emit('response.audio.delta', data);

      if (!this.processingAudio) {
        this.processAudioQueue();
      }
    }
  }

  private async processAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.processingAudio = false;
      return;
    }

    this.processingAudio = true;
    const audioData = this.audioQueue.shift()!;

    try {
      if (!this.outputAudioContext) {
        this.outputAudioContext = new AudioContext({ sampleRate: 48000 });
        this.outputGainNode = this.outputAudioContext.createGain();
        this.outputGainNode.gain.value = 1.0;
        this.outputGainNode.connect(this.outputAudioContext.destination);
      }

      // Hume sends PCM16 at 48kHz
      const pcm16Data = new Int16Array(audioData);
      const float32Data = new Float32Array(pcm16Data.length);

      // Convert PCM16 to float32 with proper normalization
      for (let i = 0; i < pcm16Data.length; i++) {
        float32Data[i] = pcm16Data[i] / 32768.0;
      }

      // Apply fade-in to first 50 samples to prevent pops
      const fadeInSamples = Math.min(50, float32Data.length);
      for (let i = 0; i < fadeInSamples; i++) {
        float32Data[i] *= i / fadeInSamples;
      }

      // Apply fade-out to last 50 samples for smooth transitions
      const fadeOutSamples = Math.min(50, float32Data.length);
      for (let i = 0; i < fadeOutSamples; i++) {
        const index = float32Data.length - fadeOutSamples + i;
        float32Data[index] *= (fadeOutSamples - i) / fadeOutSamples;
      }

      const audioBuffer = this.outputAudioContext.createBuffer(1, float32Data.length, 48000);
      audioBuffer.getChannelData(0).set(float32Data);

      this.currentAudioSource = this.outputAudioContext.createBufferSource();
      this.currentAudioSource.buffer = audioBuffer;
      this.currentAudioSource.connect(this.outputGainNode!);

      const startTime = this.outputAudioContext.currentTime;
      this.currentAudioSource.start(startTime);

      this.currentAudioSource.onended = () => {
        this.currentAudioSource = null;
        setTimeout(() => this.processAudioQueue(), 5);
      };
    } catch (error) {
      console.error('[Hume] Error processing audio:', error);
      this.processingAudio = false;
      setTimeout(() => this.processAudioQueue(), 10);
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  private handleClose(event: CloseEvent): void {
    this.isConnected = false;
    this.emit('connection.closed');
    console.log('[Hume] WebSocket closed:', event.code, event.reason);
  }

  private handleError(error: Event): void {
    this.isConnected = false;
    this.emit('error', new Error('WebSocket connection error'));
    console.error('[Hume] WebSocket error:', error);
  }

  // Audio recording methods
  async startAudioRecording(): Promise<boolean> {
    if (this.isRecording) {
      return true;
    }

    try {
      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          }
        });
      }

      // Hume uses 48kHz sample rate
      this.audioContext = new AudioContext({ sampleRate: 48000 });
      const source = this.audioContext.createMediaStreamSource(this.stream);

      // Use smaller buffer size for lower latency
      const processor = this.audioContext.createScriptProcessor(2048, 1, 1);

      processor.onaudioprocess = (event) => {
        if (this.isConnected && this.isRecording) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const pcm16 = this.floatTo16BitPCM(inputBuffer);
          this.sendAudioData(pcm16);

          // Store audio chunks for analysis
          this.audioChunks.push(pcm16.slice(0));
          this.currentResponseAudioChunks.push(pcm16.slice(0));
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      this.isRecording = true;
      return true;
    } catch (error) {
      console.error('[Hume] Error starting recording:', error);
      return false;
    }
  }

  stopAudioRecording(): void {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.emit('input_audio_buffer.committed');
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;

    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      // Apply soft clipping to prevent harsh distortion
      let s = float32Array[i];

      // Soft clipping using tanh-like curve for values near ±1
      if (s > 0.95) {
        s = 0.95 + (s - 0.95) * 0.2;
      } else if (s < -0.95) {
        s = -0.95 + (s + 0.95) * 0.2;
      }

      // Hard limit to prevent overflow
      s = Math.max(-1, Math.min(1, s));

      // Convert to 16-bit PCM with proper rounding
      const pcmValue = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7FFF);
      view.setInt16(offset, pcmValue, true);
    }
    return buffer;
  }

  private sendAudioData(audioData: ArrayBuffer): void {
    if (!this.isConnected || !this.ws) return;

    // Send audio as base64 to Hume
    const base64 = this.arrayBufferToBase64(audioData);

    const message = {
      type: 'audio_input',
      data: base64,
    };

    this.ws.send(JSON.stringify(message));
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Send a text message (for context or instructions)
  sendUserMessage(text: string): void {
    if (!this.isConnected || !this.ws) return;

    const message = {
      type: 'user_input',
      text: text,
    };

    this.ws.send(JSON.stringify(message));
  }

  // Create a response (trigger AI to respond)
  createResponse(instructions?: string): void {
    // Hume handles responses automatically based on turn detection
    // This method exists for API compatibility with OpenAI client
    console.log('[Hume] Response will be generated automatically');
  }

  // Update system prompt mid-session
  updateSystemPrompt(newPrompt: string): void {
    if (!this.isConnected || !this.ws) return;

    const message = {
      type: 'session_settings',
      system_prompt: newPrompt,
    };

    this.ws.send(JSON.stringify(message));
  }

  disconnect(): void {
    this.stopAudioRecording();

    // Stop any playing audio
    if (this.currentAudioSource) {
      this.currentAudioSource.stop();
      this.currentAudioSource = null;
    }

    if (this.outputGainNode) {
      this.outputGainNode.disconnect();
      this.outputGainNode = null;
    }

    if (this.outputAudioContext) {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    if (this.ws && this.isConnected) {
      this.ws.close(1000, 'Client disconnect');
    }

    this.isConnected = false;
    this.ws = null;
  }

  public stopPlayback(): void {
    if (this.currentAudioSource) {
      this.currentAudioSource.stop();
      this.currentAudioSource = null;
    }
    this.audioQueue = [];
    this.processingAudio = false;
  }

  public getAllAudioChunks(): ArrayBuffer[] {
    return [...this.audioChunks];
  }

  public clearAudioChunks(): void {
    this.audioChunks = [];
    this.currentResponseAudioChunks = [];
  }

  public muteOutput(): void {
    if (this.outputGainNode && this.outputAudioContext) {
      this.outputGainNode.gain.setValueAtTime(0, this.outputAudioContext.currentTime);
    }
  }

  public unmuteOutput(): void {
    if (this.outputGainNode && this.outputAudioContext) {
      this.outputGainNode.gain.setValueAtTime(1, this.outputAudioContext.currentTime);
    }
  }

  isConnectedToAPI(): boolean {
    return this.isConnected;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isCurrentlyPlayingAudio(): boolean {
    return this.processingAudio;
  }
}

// Factory function to create a configured Hume client
export function createHumeClient(config: HumeConfig = {}): HumeRealtimeClient {
  const apiKey = import.meta.env.VITE_HUME_API_KEY;
  const configId = import.meta.env.VITE_HUME_CONFIG_ID;

  if (!apiKey || apiKey === 'your_hume_api_key_here') {
    throw new Error('Hume API key not configured');
  }

  if (!configId) {
    throw new Error('Hume Config ID not configured. Create a config in Hume platform.');
  }

  return new HumeRealtimeClient(apiKey, { ...config, configId });
}
