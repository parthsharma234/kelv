import { buildSystemPrompt, PromptTemplateOptions } from './promptTemplates';
// @ts-nocheck
// Custom EventEmitter for browser compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Types for real-time session
export interface RealtimeConfig {
  model: string;
  voice: string;
  instructions: string;
  modalities: string[];
  temperature: number;
}

export interface TranscriptChunk {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isPartial: boolean;
}

export interface RealtimeEvents {
  'session.created': (event: any) => void;
  'response.created': (event: any) => void;
  'response.output_item.added': (event: any) => void;
  'response.content_part.added': (event: any) => void;
  'response.text.delta': (event: any) => void;
  'response.audio.delta': (event: any) => void;
  'response.done': (event: any) => void;
  'conversation.item.input_audio_transcription.completed': (event: any) => void;
  'conversation.item.input_audio_transcription.partial': (event: any) => void;
  'input_audio_buffer.speech_started': (event: any) => void;
  'input_audio_buffer.speech_stopped': (event: any) => void;
  'error': (error: Error) => void;
  'connection.opened': () => void;
  'connection.closed': () => void;
  'transcript.update': (chunk: TranscriptChunk) => void;
}

export class OpenAIRealtimeClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private isMockMode: boolean = false; // Enable real WebSocket connection
  // Note: Authentication for WebSocket connections typically requires server-side proxy
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _apiKey: string; // Store for potential future server-side authentication
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private sessionConfig: RealtimeConfig;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private isRecording: boolean = false;
  private outputAudioContext: AudioContext | null = null;
  private outputGainNode: GainNode | null = null;
  private isPlayingAudio: boolean = false;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private isGeneratingResponse: boolean = false; // Add flag to prevent multiple responses
  private audioQueue: { delta: string, responseId: string }[] = [];
  private currentResponseId: string | null = null;

  constructor(apiKey: string, config: Partial<RealtimeConfig> = {}, mediaStream?: MediaStream) {
    super();
    this._apiKey = apiKey;
    
    // Use provided media stream if available
    if (mediaStream) {
      this.stream = mediaStream;
    }
    
    // If instructions is not set, use a default system prompt
    let instructions = config.instructions;
    if (!instructions) {
      const options: PromptTemplateOptions = {
        tone: 'warm',
        pacing: 'normal',
        depth: 'moderate',
        type: 'default',
        responseStyle: 'elaborate',
      };
      instructions = buildSystemPrompt(options);
    }
    this.sessionConfig = {
      model: 'gpt-4o-realtime-preview-2025-06-03',
      voice: 'alloy',
      instructions,
      modalities: ['text', 'audio'],
      temperature: 0.8,
      ...config
    };
  }
  // Allow updating the system prompt mid-session
  updateSystemPrompt(newPrompt: string) {
    this.sessionConfig.instructions = newPrompt;
    if (this.isConnected) {
      this.sendEvent('session.update', {
        session: {
          instructions: newPrompt
        }
      });
    }
  }

  // Send a user message for context-aware prompting
  sendUserMessage(text: string) {
    if (!this.isConnected) {
      return;
    }

    this.sendEvent('conversation.item.create', {
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      if (this.isMockMode) {
        // ...existing code...
        return;
      }

      // Real WebSocket connection to OpenAI Realtime API
      const url = `wss://api.openai.com/v1/realtime?model=${this.sessionConfig.model}`;

      this.ws = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${this._apiKey}`,
        'openai-beta.realtime-v1'
      ]);

      // Set up event handlers
      this.ws.onopen = (event) => {
        this.handleOpen();
      };
      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };
      this.ws.onclose = (event) => {
        this.handleClose(event);
      };
      this.ws.onerror = (event) => {
        this.handleError(event);
      };

    } catch (error) {
      this.emit('error', error);
    }
  }

  private handleOpen(): void {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.emit('connection.opened');
    // Wait for session.created event before sending session.update
    // The server will send session.created when ready
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('[WebSocket] Received:', data); // Add this line for debugging

      // Check for error messages from the server
      if (data.type === 'error') {
        this.emit('error', new Error(`${data.error.type}: ${data.error.message}`));
        return;
      }

      // Handle session.created event
      if (data.type === 'session.created') {
        this.sendEvent('session.update', {
          session: {
            modalities: this.sessionConfig.modalities,
            instructions: this.sessionConfig.instructions,
            voice: this.sessionConfig.voice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 200
            },
            temperature: this.sessionConfig.temperature
          }
        });
      }

      if (data.type === 'response.created') {
        this.currentResponseId = data.response.id;
        // Clear queue of any audio from previous responses
        this.audioQueue = this.audioQueue.filter(chunk => chunk.responseId === this.currentResponseId);
      }

      // Emit specific events based on message type
      if (data.type) {
        this.emit(data.type as keyof RealtimeEvents, data);
      }

      // Handle user speech events
      if (data.type === 'input_audio_buffer.speech_started') {
        this.emit('input_audio_buffer.speech_started', data);
      } else if (data.type === 'input_audio_buffer.speech_stopped') {
        this.emit('input_audio_buffer.speech_stopped', data);
        // Automatically trigger AI response when user stops speaking - but only if not already generating
        if (!this.isGeneratingResponse) {
          this.isGeneratingResponse = true;
          setTimeout(() => {
            if (!this.isGeneratingResponse) return; // Check again in case it was cancelled
            this.createResponse();
          }, 500); // Small delay to ensure audio processing is complete
        }
      }

      // Log response lifecycle events
      if (data.type === 'response.created') {
        this.isGeneratingResponse = true; // Ensure flag is set when response starts
      } else if (data.type === 'response.done') {
        this.isGeneratingResponse = false; // Reset flag when response is complete
      }

      // Handle transcript updates
      this.handleTranscriptUpdate(data);

      // Handle audio output
      this.handleAudioOutput(data);
    } catch (error) {
      // Error parsing WebSocket message
    }
  }

  private handleTranscriptUpdate(data: any): void {
    let transcriptChunk: TranscriptChunk | null = null;

    if (data.type === 'conversation.item.input_audio_transcription.completed') {
      transcriptChunk = {
        id: data.item_id || Date.now().toString(),
        speaker: 'user',
        text: data.transcript || '',
        timestamp: Date.now(),
        isPartial: false
      };
    } else if (data.type === 'conversation.item.input_audio_transcription.partial') {
      transcriptChunk = {
        id: data.item_id || Date.now().toString(),
        speaker: 'user',
        text: data.transcript || '',
        timestamp: Date.now(),
        isPartial: true
      };
    } else if (data.type === 'response.audio_transcript.delta') {
      // This is the correct event for the AI's transcribed speech
      const deltaText = data.delta || '';
      if (deltaText) {
        transcriptChunk = {
          id: data.item_id || `assistant-${data.response_id}`,
          speaker: 'assistant',
          text: deltaText,
          timestamp: Date.now(),
          isPartial: true // Deltas are always partial
        };
      }
    } else if (data.type === 'response.audio_transcript.done') {
      // This event signals the completion of the AI's utterance
      transcriptChunk = {
        id: data.item_id || `assistant-${data.response_id}`,
        speaker: 'assistant',
        text: '', // Final text is aggregated in the state hook, this signals completion
        timestamp: Date.now(),
        isPartial: false
      };
    } else if (data.type === 'response.text.delta') {
      // This case might be used in text-only mode, keeping it as a fallback.
      const deltaText = data.delta || '';
      if (deltaText) {
        transcriptChunk = {
          id: data.item_id || `assistant-${data.response_id}`,
          speaker: 'assistant',
          text: deltaText,
          timestamp: Date.now(),
          isPartial: true
        };
      }
    } else if (data.type === 'response.done') {
      // This is a general response completion, ensure any final assistant chunk is marked as not partial
      transcriptChunk = {
        id: `assistant-final-${data.response.id}`,
        speaker: 'assistant',
        text: '', // Empty text to signal completion
        timestamp: Date.now(),
        isPartial: false
      };
    }

    if (transcriptChunk) {
      this.emit('transcript.update', transcriptChunk);
    }
  }

  private handleAudioOutput(data: any): void {
    if (data.type === 'response.audio.delta' && data.delta) {
      if (this.currentResponseId) {
        this.audioQueue.push({ delta: data.delta, responseId: this.currentResponseId });
        if (!this.isPlayingAudio) {
          this.processAudioQueue();
        }
      }
    }
  }

  private async processAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;
    const { delta, responseId } = this.audioQueue.shift()!;

    // If the response has changed, clear the old audio and stop.
    if (responseId !== this.currentResponseId) {
        this.audioQueue = [];
        if (this.currentAudioSource) {
            this.currentAudioSource.stop();
            this.currentAudioSource = null;
        }
        this.isPlayingAudio = false;
        return;
    }

    try {
      if (!this.outputAudioContext) {
        this.outputAudioContext = new AudioContext({ sampleRate: 24000 });
        this.outputGainNode = this.outputAudioContext.createGain();
        this.outputGainNode.connect(this.outputAudioContext.destination);
      }

      const audioData = this.base64ToArrayBuffer(delta);
      const pcm16Data = new Int16Array(audioData);
      const float32Data = new Float32Array(pcm16Data.length);
      for (let i = 0; i < pcm16Data.length; i++) {
        float32Data[i] = pcm16Data[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      this.currentAudioSource = this.outputAudioContext.createBufferSource();
      this.currentAudioSource.buffer = audioBuffer;
      this.currentAudioSource.connect(this.outputGainNode!);
      this.currentAudioSource.start();

      this.currentAudioSource.onended = () => {
        this.currentAudioSource = null;
        this.processAudioQueue(); // Process next chunk
      };
    } catch (error) {
      this.isPlayingAudio = false;
      // Continue with the next item in the queue
      this.processAudioQueue();
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

    // Attempt to reconnect if not intentionally closed
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleError(error: Event): void {
    this.isConnected = false;
    // Try to extract error message if available
    if ((error as any).message) {
      this.emit('error', new Error((error as any).message));
    } else {
      this.emit('error', new Error('WebSocket connection error'));
    }
  }

  sendEvent(type: string, data: any = {}): void {
    if (this.isMockMode) {
      return;
    }

    if ((!this.isConnected && this.ws?.readyState !== 1) || !this.ws) {
      return;
    }

    const event = {
      event_id: Date.now().toString(),
      type,
      ...data
    };

    try {
      this.ws.send(JSON.stringify(event));
    } catch (error) {
      // Error sending WebSocket event
    }
  }

  // Audio recording methods
  async startAudioRecording(): Promise<boolean> {
    if (this.isRecording) {
      return true;
    }

    try {
      // Use existing stream if available, otherwise create a new one
      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 24000,
            channelCount: 1
          }
        });
      }

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create a script processor to capture audio data
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (this.isConnected && this.isRecording) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const pcm16 = this.floatTo16BitPCM(inputBuffer);
          this.sendAudioData(pcm16);
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      this.isRecording = true;
      return true;
    } catch (error) {
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

    // Send input audio buffer commit
    this.sendEvent('input_audio_buffer.commit');
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  private sendAudioData(audioData: ArrayBuffer): void {
    if (!this.isConnected || !this.ws) return;

    // Convert to base64 for sending over WebSocket
    const base64 = this.arrayBufferToBase64(audioData);
    this.sendEvent('input_audio_buffer.append', {
      audio: base64
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Create a response (trigger AI to respond)
  createResponse(instructions?: string): void {
    if (this.isMockMode) {
      // In mock mode, response is handled by simulateUserResponse
      return;
    }

    if (this.isGeneratingResponse) {
      return;
    }

    this.isGeneratingResponse = true;

    this.sendEvent('response.create', {
      response: {
        modalities: this.sessionConfig.modalities,
        instructions: instructions || 'Please provide a thoughtful interview question or follow-up based on the conversation so far.'
      }
    });
  }

  // Send a message to the AI
  sendMessage(message: string): void {
    if (this.isMockMode) {
      // In mock mode, simulate the conversation
      this.simulateUserResponse(message);
      return;
    }

    this.sendEvent('conversation.item.create', {
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: message
        }]
      }
    });
    
    // Only create response if not already generating one
    if (!this.isGeneratingResponse) {
      this.createResponse();
    }
  }

  // Update session instructions
  updateInstructions(instructions: string): void {
    this.sessionConfig.instructions = instructions;
    if (this.isConnected) {
      this.sendEvent('session.update', {
        session: {
          instructions: instructions
        }
      });
    }
  }

  // Mock simulation methods for development
  private simulateAIMessage(text: string): void {
    if (!this.isMockMode) return;

    const transcriptChunk: TranscriptChunk = {
      id: Date.now().toString(),
      speaker: 'assistant',
      text: text,
      timestamp: Date.now(),
      isPartial: false
    };

    this.emit('transcript.update', transcriptChunk);
  }

  simulateUserResponse(text: string): void {
    if (!this.isMockMode) return;

    // Emit user message
    const userChunk: TranscriptChunk = {
      id: Date.now().toString(),
      speaker: 'user',
      text: text,
      timestamp: Date.now(),
      isPartial: false
    };

    this.emit('transcript.update', userChunk);

    // Simulate AI response after a delay
    setTimeout(() => {
      const responses = [
        "That's a great answer! Let me follow up with another question...",
        "Interesting perspective. Can you elaborate on that?",
        "I appreciate that insight. Now, let's talk about your experience with...",
        "Excellent point. How would you apply that in a team setting?",
        "Thank you for sharing that. What challenges have you faced in similar situations?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      this.simulateAIMessage(randomResponse);
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
  }

  disconnect(): void {
    this.stopAudioRecording();
    
    // Stop any playing audio and clean up output audio context
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
    
    if (this.isMockMode) {
      this.isConnected = false;
      this.emit('connection.closed');
      return;
    }
    
    if (this.ws && this.isConnected) {
      this.ws.close(1000, 'Client disconnect');
    }
    
    this.isConnected = false;
    this.ws = null;
  }

  public stopPlayback() {
    if (this.currentAudioSource) {
      this.currentAudioSource.stop();
      this.currentAudioSource = null;
    }
    this.audioQueue = [];
    this.isPlayingAudio = false;
  }

  public muteOutput() {
    if (this.outputGainNode && this.outputAudioContext) {
        this.outputGainNode.gain.setValueAtTime(0, this.outputAudioContext.currentTime);
    }
  }

  public unmuteOutput() {
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
    return this.isPlayingAudio;
  }
}

// Factory function to create a configured realtime client
export function createRealtimeClient(config: Partial<RealtimeConfig> = {}): OpenAIRealtimeClient {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured');
  }

  return new OpenAIRealtimeClient(apiKey, config);
}
