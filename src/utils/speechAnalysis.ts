// Speech Analysis Utilities using Web Audio API
// This provides basic speech metrics that can be calculated in the browser

export interface AudioFeatures {
  rms: number;
  zcr: number;
  spectralCentroid: number;
  spectralRolloff: number;
  mfcc: number[];
  pitch: number;
  energy: number;
}

export class SpeechAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private frequencyData: Uint8Array;
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async analyzeAudioBlob(audioBlob: Blob): Promise<AudioFeatures> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      return this.extractFeatures(audioBuffer);
    } catch (error) {
      console.error('Error analyzing audio:', error);
      throw error;
    }
  }

  private extractFeatures(audioBuffer: AudioBuffer): AudioFeatures {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate RMS (Root Mean Square) - energy measure
    const rms = this.calculateRMS(channelData);
    
    // Calculate Zero Crossing Rate - measure of speech vs noise
    const zcr = this.calculateZCR(channelData);
    
    // Calculate spectral features
    const spectralFeatures = this.calculateSpectralFeatures(channelData, sampleRate);
    
    // Calculate pitch using autocorrelation
    const pitch = this.calculatePitch(channelData, sampleRate);
    
    // Calculate energy
    const energy = this.calculateEnergy(channelData);
    
    return {
      rms,
      zcr,
      spectralCentroid: spectralFeatures.centroid,
      spectralRolloff: spectralFeatures.rolloff,
      mfcc: spectralFeatures.mfcc,
      pitch,
      energy
    };
  }

  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  private calculateZCR(data: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i] >= 0) !== (data[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / data.length;
  }

  private calculateSpectralFeatures(data: Float32Array, sampleRate: number) {
    // Simple FFT-based spectral analysis
    const fftSize = 1024;
    const fft = this.simpleFFT(data.slice(0, fftSize));
    
    // Calculate spectral centroid
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < fft.length / 2; i++) {
      const magnitude = Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2);
      const frequency = (i * sampleRate) / fftSize;
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    
    // Calculate spectral rolloff (85% of energy)
    let energySum = 0;
    let totalEnergy = 0;
    
    for (let i = 0; i < fft.length / 2; i++) {
      const magnitude = Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2);
      totalEnergy += magnitude;
    }
    
    let rolloff = 0;
    const threshold = 0.85 * totalEnergy;
    
    for (let i = 0; i < fft.length / 2; i++) {
      const magnitude = Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2);
      energySum += magnitude;
      if (energySum >= threshold) {
        rolloff = (i * sampleRate) / fftSize;
        break;
      }
    }
    
    // Simple MFCC approximation (first 13 coefficients)
    const mfcc = this.calculateMFCC(fft, sampleRate);
    
    return { centroid, rolloff, mfcc };
  }

  private calculatePitch(data: Float32Array, sampleRate: number): number {
    // Autocorrelation-based pitch detection
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
    
    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    for (let period = minPeriod; period < maxPeriod && period < data.length / 2; period++) {
      let correlation = 0;
      for (let i = 0; i < data.length - period; i++) {
        correlation += data[i] * data[i + period];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  private calculateEnergy(data: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < data.length; i++) {
      energy += data[i] * data[i];
    }
    return energy / data.length;
  }

  private simpleFFT(data: Float32Array): Float32Array {
    // Simple DFT implementation for basic spectral analysis
    const N = data.length;
    const result = new Float32Array(N * 2);
    
    for (let k = 0; k < N; k++) {
      let realSum = 0;
      let imagSum = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        realSum += data[n] * Math.cos(angle);
        imagSum += data[n] * Math.sin(angle);
      }
      
      result[k * 2] = realSum;
      result[k * 2 + 1] = imagSum;
    }
    
    return result;
  }

  private calculateMFCC(fft: Float32Array, sampleRate: number): number[] {
    // Simplified MFCC calculation
    const numCoeffs = 13;
    const mfcc = new Array(numCoeffs).fill(0);
    
    // This is a simplified version - full MFCC requires mel-scale filtering
    for (let i = 0; i < numCoeffs; i++) {
      let sum = 0;
      for (let j = 0; j < fft.length / 2; j++) {
        const magnitude = Math.sqrt(fft[j * 2] ** 2 + fft[j * 2 + 1] ** 2);
        sum += magnitude * Math.cos(Math.PI * i * j / (fft.length / 2));
      }
      mfcc[i] = sum;
    }
    
    return mfcc;
  }

  // Analyze speech patterns from transcription
  static analyzeSpeechPatterns(transcription: string, audioFeatures: AudioFeatures, duration: number) {
    const words = transcription.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Calculate speech rate with improved logic
    // Account for pauses, hesitations, and natural speech patterns
    const effectiveDuration = Math.max(duration * 0.85, duration - 2); // Account for natural pauses
    const speechRate = Number(((wordCount / effectiveDuration) * 60).toFixed(2)); // Limit to 2 decimal places
    
    // Enhanced filler word detection with context
    const fillerWords = [
      'um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically', 'literally', 'right',
      'kind of', 'sort of', 'i mean', 'you see', 'i guess', 'i think', 'i feel', 'i believe'
    ];
    const fillerCount = words.filter(word => 
      fillerWords.includes(word.replace(/[.,!?]/g, '')) ||
      fillerWords.includes(word.replace(/[.,!?]/g, '') + ' ' + (words[words.indexOf(word) + 1] || ''))
    ).length;
    
    // Enhanced repetition detection with phrase repetition
    const repetitions = this.countRepetitions(words);
    
    // Enhanced hesitation detection
    const hesitations = this.detectHesitations(transcription, audioFeatures);
    
    // Calculate improved fluency score
    const fluencyScore = this.calculateFluencyScore(wordCount, fillerCount, repetitions, hesitations, speechRate);
    
    // Calculate confidence metrics
    const voiceConfidence = this.calculateVoiceConfidence(audioFeatures, speechRate);
    
    return {
      wordCount,
      speechRate,
      fillerCount,
      repetitions,
      hesitations,
      fluencyScore,
      voiceConfidence
    };
  }

  private static countRepetitions(words: string[]): number {
    let repetitions = 0;
    
    // Check for word repetitions
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1]) {
        repetitions++;
      }
    }
    
    // Check for phrase repetitions (2-3 word phrases)
    for (let i = 2; i < words.length - 1; i++) {
      const phrase1 = words.slice(i - 2, i).join(' ');
      const phrase2 = words.slice(i, i + 2).join(' ');
      if (phrase1 === phrase2) {
        repetitions += 0.5;
      }
    }
    
    return Math.round(repetitions);
  }

  private static detectHesitations(transcription: string, audioFeatures: AudioFeatures): number {
    // Enhanced hesitation patterns
    const hesitationPatterns = /\b(well|um|uh|er|ah|hmm|you know|i mean)\b/gi;
    const matches = transcription.match(hesitationPatterns);
    
    // Consider audio features for hesitation detection
    const energyBasedHesitations = audioFeatures.energy < 0.15 ? 1 : 0;
    const pitchBasedHesitations = audioFeatures.pitch < 100 || audioFeatures.pitch > 400 ? 0.5 : 0;
    
    // Look for long pauses in speech (indicated by punctuation patterns)
    const pausePatterns = /[.!?]\s+[.!?]/g;
    const pauseMatches = transcription.match(pausePatterns);
    const pauseHesitations = pauseMatches ? pauseMatches.length * 0.3 : 0;
    
    return Math.round((matches ? matches.length : 0) + energyBasedHesitations + pitchBasedHesitations + pauseHesitations);
  }

  private static calculateFluencyScore(
    wordCount: number,
    fillerCount: number,
    repetitions: number,
    hesitations: number,
    speechRate: number
  ): number {
    // Improved optimal speech rate range (130-170 WPM is more realistic)
    const optimalRateMin = 130;
    const optimalRateMax = 170;
    const optimalRate = 150;
    
    // Rate score with better curve
    let rateScore;
    if (speechRate >= optimalRateMin && speechRate <= optimalRateMax) {
      rateScore = 100; // Perfect score for optimal range
    } else if (speechRate < optimalRateMin) {
      rateScore = Math.max(0, 100 - (optimalRateMin - speechRate) * 1.5);
    } else {
      rateScore = Math.max(0, 100 - (speechRate - optimalRateMax) * 1.2);
    }
    
    // Improved penalty calculations
    const fillerPenalty = Math.min(40, (fillerCount / Math.max(1, wordCount)) * 1000);
    const repetitionPenalty = Math.min(25, repetitions * 8);
    const hesitationPenalty = Math.min(20, hesitations * 6);
    
    // Bonus for good speech rate
    const rateBonus = speechRate >= optimalRateMin && speechRate <= optimalRateMax ? 5 : 0;
    
    const fluencyScore = Math.max(0, rateScore - fillerPenalty - repetitionPenalty - hesitationPenalty + rateBonus);
    
    return Math.round(fluencyScore);
  }

  private static calculateVoiceConfidence(audioFeatures: AudioFeatures, speechRate: number): number {
    // Enhanced confidence calculation
    const energyScore = Math.min(100, audioFeatures.rms * 1200);
    const pitchStability = audioFeatures.pitch > 0 ? Math.min(100, Math.max(0, 100 - Math.abs(audioFeatures.pitch - 200) / 2)) : 50;
    
    // Improved rate confidence with better range
    let rateConfidence;
    if (speechRate >= 120 && speechRate <= 180) {
      rateConfidence = 100;
    } else if (speechRate >= 100 && speechRate <= 200) {
      rateConfidence = 80;
    } else {
      rateConfidence = 60;
    }
    
    // Add spectral features for better confidence assessment
    const spectralScore = Math.min(100, (audioFeatures.spectralCentroid / 2000) * 100);
    
    return Math.round((energyScore + pitchStability + rateConfidence + spectralScore) / 4);
  }
}

// Enhanced transcription with streaming for faster response
export class FastTranscription {
  private static readonly CHUNK_SIZE = 1024 * 16; // 16KB chunks
  private static readonly OVERLAP_SIZE = 1024 * 2; // 2KB overlap
  
  static async transcribeWithStreaming(audioBlob: Blob, apiKey: string): Promise<string> {
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.warn('OpenAI API key not configured');
      return '';
    }

    // Validate audio blob
    if (!audioBlob || audioBlob.size === 0) {
      console.warn('Invalid or empty audio blob');
      return '';
    }

    // Check if audio blob is too small (less than 1 second of audio)
    if (audioBlob.size < 1000) {
      console.warn('Audio blob too small for transcription');
      return '';
    }

    try {
      // For smaller audio files, use direct transcription
      if (audioBlob.size < this.CHUNK_SIZE * 2) {
        return await this.directTranscription(audioBlob, apiKey);
      }

      // For larger files, use chunked processing
      return await this.chunkedTranscription(audioBlob, apiKey);
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Check if it's an API key error
      if (error instanceof Error && error.message.includes('401')) {
        console.error('Invalid or expired OpenAI API key');
        throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
      }
      
      // Check if it's a bad request error
      if (error instanceof Error && error.message.includes('400')) {
        console.error('Bad request to OpenAI API - likely invalid audio format or API key');
        throw new Error('Invalid audio format or API configuration. Please check your audio recording and API key.');
      }
      
      return '';
    }
  }

  private static async directTranscription(audioBlob: Blob, apiKey: string): Promise<string> {
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    // Convert webm to a more compatible format if needed
    let processedBlob = audioBlob;
    
    // If the blob is webm, try to ensure it's in a format OpenAI accepts
    if (audioBlob.type.includes('webm')) {
      // Create a new blob with explicit audio/webm type
      processedBlob = new Blob([audioBlob], { type: 'audio/webm' });
    }

    const formData = new FormData();
    formData.append('file', processedBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');
    formData.append('temperature', '0.2'); // Lower temperature for more consistent results

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error Response:', errorText);
      
      if (response.status === 401) {
        throw new Error('Transcription API error: 401 - Invalid API key');
      } else if (response.status === 400) {
        throw new Error('Transcription API error: 400 - Bad request (check audio format and API key)');
      } else {
        throw new Error(`Transcription API error: ${response.status}`);
      }
    }

    const data = await response.json();
    return data.text || '';
  }

  private static async chunkedTranscription(audioBlob: Blob, apiKey: string): Promise<string> {
    // Convert blob to array buffer for chunking
    const arrayBuffer = await audioBlob.arrayBuffer();
    const chunks = this.createAudioChunks(arrayBuffer);
    
    // Process chunks in parallel for faster transcription
    const transcriptionPromises = chunks.map(chunk => 
      this.directTranscription(new Blob([chunk], { type: audioBlob.type }), apiKey)
    );

    const results = await Promise.all(transcriptionPromises);
    return results.join(' ').trim();
  }

  private static createAudioChunks(arrayBuffer: ArrayBuffer): ArrayBuffer[] {
    const chunks: ArrayBuffer[] = [];
    const totalSize = arrayBuffer.byteLength;
    
    for (let offset = 0; offset < totalSize; offset += this.CHUNK_SIZE - this.OVERLAP_SIZE) {
      const end = Math.min(offset + this.CHUNK_SIZE, totalSize);
      chunks.push(arrayBuffer.slice(offset, end));
    }
    
    return chunks;
  }
}