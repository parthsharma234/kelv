// Advanced Speech Analysis Utilities for College Interview Voice Metrics
// Focused on high-quality voice metrics for college interview feedback

export interface VoiceMetrics {
  speechRate: number;        // Words per minute
  fluencyScore: number;      // 0-100 score based on flow and smoothness
  voiceConfidence: number;   // 0-100 based on vocal characteristics
  deliveryScore: number;     // 0-100 based on pacing and rhythm
  clarityScore: number;      // 0-100 based on articulation and pronunciation
  fillerWordCount: number;   // Count of filler words (um, uh, like, etc.)
  pauseAnalysis: {
    averagePauseLength: number;
    pauseFrequency: number;
    strategicPauses: number;
  };
  pitchAnalysis: {
    averagePitch: number;
    pitchVariation: number;
    pitchStability: number;
  };
  energyAnalysis: {
    averageEnergy: number;
    energyConsistency: number;
    dynamicRange: number;
  };
}

export interface AudioAnalysisResult {
  pitch: number[];
  energy: number[];
  spectralCentroid: number[];
  spectralRolloff: number[];
  mfcc: number[][];
  zcr: number[];
  rms: number[];
}

export class AdvancedSpeechAnalyzer {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async analyzeVoiceMetrics(audioBlob: Blob, transcription: string, duration: number): Promise<VoiceMetrics> {
    try {
      // Analyze audio features
      const audioAnalysis = await this.analyzeAudioFeatures(audioBlob);
      
      // Analyze speech patterns from transcription
      const speechPatterns = this.analyzeSpeechPatterns(transcription, duration);
      
      // Calculate advanced metrics
      const speechRate = speechPatterns.speechRate;
      const fillerWordCount = speechPatterns.fillerWordCount;
      
      // Calculate fluency score
      const fluencyScore = this.calculateFluencyScore(
        speechPatterns.wordCount,
        fillerWordCount,
        speechPatterns.repetitions,
        speechPatterns.hesitations,
        speechRate
      );
      
      // Calculate voice confidence
      const voiceConfidence = this.calculateVoiceConfidence(
        audioAnalysis,
        speechRate,
        speechPatterns.hesitations
      );
      
      // Calculate delivery score
      const deliveryScore = this.calculateDeliveryScore(
        speechRate,
        audioAnalysis.energy,
        speechPatterns.pauseAnalysis
      );
      
      // Calculate clarity score
      const clarityScore = this.calculateClarityScore(
        audioAnalysis.spectralCentroid,
        audioAnalysis.zcr,
        fillerWordCount,
        speechPatterns.wordCount
      );
      
      // Advanced pitch analysis
      const pitchAnalysis = this.analyzePitch(audioAnalysis.pitch);
      
      // Advanced energy analysis
      const energyAnalysis = this.analyzeEnergy(audioAnalysis.energy);
      
      return {
        speechRate,
        fluencyScore,
        voiceConfidence,
        deliveryScore,
        clarityScore,
        fillerWordCount,
        pauseAnalysis: speechPatterns.pauseAnalysis,
        pitchAnalysis,
        energyAnalysis
      };
    } catch (error) {
      console.error('Error analyzing voice metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  private async analyzeAudioFeatures(audioBlob: Blob): Promise<AudioAnalysisResult> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    
    // Manual audio feature extraction
    const frameSize = 1024;
    const hopSize = 512;
    const features: AudioAnalysisResult = {
      pitch: [],
      energy: [],
      spectralCentroid: [],
      spectralRolloff: [],
      mfcc: [],
      zcr: [],
      rms: []
    };
    
    // Process audio in frames
    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      
      // Calculate features manually
      const energy = this.calculateFrameEnergy(frame);
      const spectralCentroid = this.calculateSpectralCentroid(frame, audioBuffer.sampleRate);
      const spectralRolloff = this.calculateSpectralRolloff(frame, audioBuffer.sampleRate);
      const mfcc = this.calculateMFCC(frame);
      const zcr = this.calculateZCR(frame);
      const rms = this.calculateRMS(frame);
      
      features.energy.push(energy);
      features.spectralCentroid.push(spectralCentroid);
      features.spectralRolloff.push(spectralRolloff);
      features.mfcc.push(mfcc);
      features.zcr.push(zcr);
      features.rms.push(rms);
      
      // Calculate pitch using autocorrelation
      const pitch = this.calculatePitchAutocorrelation(frame, audioBuffer.sampleRate);
      features.pitch.push(pitch);
    }
    
    return features;
  }

  private calculatePitchAutocorrelation(frame: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 800); // Max 800 Hz
    const maxPeriod = Math.floor(sampleRate / 80);  // Min 80 Hz
    
    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    for (let period = minPeriod; period < maxPeriod && period < frame.length / 2; period++) {
      let correlation = 0;
      let normalizer = 0;
      
      for (let i = 0; i < frame.length - period; i++) {
        correlation += frame[i] * frame[i + period];
        normalizer += frame[i] * frame[i] + frame[i + period] * frame[i + period];
      }
      
      if (normalizer > 0) {
        correlation = (2 * correlation) / normalizer;
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 && bestCorrelation > 0.3 ? sampleRate / bestPeriod : 0;
  }

  private analyzeSpeechPatterns(transcription: string, duration: number) {
    const words = transcription.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Debug logging for speech rate calculation
    console.log('Speech rate calculation debug:', {
      wordCount,
      rawDuration: duration,
      transcriptionLength: transcription.length
    });
    
    // Calculate speech rate (words per minute)
    // Ensure duration is in seconds and clamp to reasonable range
    // If duration is suspiciously small (< 1 second) or large (> 3600 seconds), assume it's in wrong units
    let safeDuration = duration;
    if (duration < 1) {
      // Duration might be in milliseconds, convert to seconds
      safeDuration = duration / 1000;
      console.log('Duration converted from milliseconds to seconds:', duration, '->', safeDuration);
    } else if (duration > 3600) {
      // Duration might be in wrong units, assume it's reasonable
      safeDuration = Math.min(duration, 300); // Cap at 5 minutes
      console.log('Duration capped to reasonable value:', duration, '->', safeDuration);
    }
    
    // Clamp duration to at least 1 second to avoid division by zero or near-zero
    safeDuration = Math.max(safeDuration, 1);
    
    // Calculate WPM: (words / minutes) = (words / (seconds / 60)) = (words * 60) / seconds
    let speechRate = (wordCount * 60) / safeDuration;
    speechRate = Math.round(speechRate * 10) / 10; // Round to 1 decimal place
    
    // Clamp output to 60–250 WPM for realistic range
    speechRate = Math.max(60, Math.min(250, speechRate));
    
    console.log('Final speech rate calculation:', {
      wordCount,
      safeDuration,
      calculatedWPM: (wordCount * 60) / safeDuration,
      clampedWPM: speechRate
    });
    
    // Advanced filler word detection
    const fillerWords = [
      'um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically', 
      'literally', 'right', 'kind of', 'sort of', 'i mean', 'you see', 
      'i guess', 'i think', 'i feel', 'i believe', 'okay', 'alright'
    ];
    
    const fillerWordCount = words.filter(word => {
      const cleanWord = word.replace(/[.,!?]/g, '');
      return fillerWords.includes(cleanWord);
    }).length;
    
    // Detect repetitions
    const repetitions = this.countRepetitions(words);
    
    // Detect hesitations
    const hesitations = this.detectHesitations(transcription);
    
    // Analyze pauses (estimated from punctuation and context)
    const pauseAnalysis = this.analyzePauses(transcription, duration);
    
    return {
      wordCount,
      speechRate,
      fillerWordCount,
      repetitions,
      hesitations,
      pauseAnalysis
    };
  }

  private countRepetitions(words: string[]): number {
    let repetitions = 0;
    
    // Word repetitions
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1] && words[i].length > 2) {
        repetitions++;
      }
    }
    
    // Phrase repetitions (2-word phrases)
    for (let i = 2; i < words.length - 1; i++) {
      const phrase1 = words.slice(i - 2, i).join(' ');
      const phrase2 = words.slice(i, i + 2).join(' ');
      if (phrase1 === phrase2 && phrase1.length > 4) {
        repetitions += 0.5;
      }
    }
    
    return Math.round(repetitions);
  }

  private detectHesitations(transcription: string): number {
    const hesitationPatterns = /\b(well|um|uh|er|ah|hmm|you know|i mean|let me think|how do i put this)\b/gi;
    const matches = transcription.match(hesitationPatterns);
    
    // Look for long pauses indicated by multiple periods or dashes
    const pausePatterns = /\.{2,}|--+|\s{3,}/g;
    const pauseMatches = transcription.match(pausePatterns);
    
    return (matches ? matches.length : 0) + (pauseMatches ? pauseMatches.length * 0.5 : 0);
  }

  private analyzePauses(transcription: string, duration: number) {
    // Estimate pauses from punctuation and sentence structure
    const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const commaPatuses = (transcription.match(/,/g) || []).length;
    const dashPauses = (transcription.match(/--+/g) || []).length;
    
    const estimatedPauses = sentences.length + commaPatuses * 0.3 + dashPauses;
    const averagePauseLength = estimatedPauses > 0 ? (duration * 0.15) / estimatedPauses : 0;
    const pauseFrequency = estimatedPauses / (duration / 60); // pauses per minute
    
    // Strategic pauses are longer pauses that seem intentional
    const strategicPauses = Math.floor(sentences.length * 0.7);
    
    return {
      averagePauseLength: Math.round(averagePauseLength * 100) / 100,
      pauseFrequency: Math.round(pauseFrequency * 10) / 10,
      strategicPauses
    };
  }

  private calculateFluencyScore(
    wordCount: number,
    fillerCount: number,
    repetitions: number,
    hesitations: number,
    speechRate: number
  ): number {
    // Optimal speech rate for college interviews: 140-170 WPM
    const optimalRateMin = 140;
    const optimalRateMax = 170;
    
    // Rate score
    let rateScore = 100;
    if (speechRate < optimalRateMin) {
      rateScore = Math.max(60, 100 - (optimalRateMin - speechRate) * 1.5);
    } else if (speechRate > optimalRateMax) {
      rateScore = Math.max(60, 100 - (speechRate - optimalRateMax) * 1.2);
    }
    
    // Penalties
    const fillerPenalty = Math.min(25, (fillerCount / Math.max(1, wordCount)) * 800);
    const repetitionPenalty = Math.min(15, repetitions * 5);
    const hesitationPenalty = Math.min(20, hesitations * 4);
    
    // Bonus for good flow
    const flowBonus = (fillerCount === 0 && repetitions === 0) ? 5 : 0;
    
    const fluencyScore = Math.max(0, rateScore - fillerPenalty - repetitionPenalty - hesitationPenalty + flowBonus);
    return Math.round(fluencyScore);
  }

  private calculateVoiceConfidence(
    audioAnalysis: AudioAnalysisResult,
    speechRate: number,
    hesitations: number
  ): number {
    // Energy consistency indicates confidence
    const avgEnergy = this.calculateAverage(audioAnalysis.energy);
    const energyVariance = this.calculateVariance(audioAnalysis.energy);
    const energyScore = Math.min(100, Math.max(0, (avgEnergy * 500) - (energyVariance * 200)));
    
    // Pitch stability indicates confidence
    const pitchStability = this.calculatePitchStability(audioAnalysis.pitch);
    const pitchScore = pitchStability * 100;
    
    // Speech rate confidence
    let rateConfidence = 100;
    if (speechRate < 120 || speechRate > 200) {
      rateConfidence = 70;
    } else if (speechRate < 140 || speechRate > 180) {
      rateConfidence = 85;
    }
    
    // Hesitation penalty
    const hesitationPenalty = Math.min(30, hesitations * 8);
    
    const confidence = Math.max(0, (energyScore + pitchScore + rateConfidence) / 3 - hesitationPenalty);
    return Math.round(confidence);
  }

  private calculateDeliveryScore(
    speechRate: number,
    energyArray: number[],
    pauseAnalysis: any
  ): number {
    // Optimal pacing score
    let pacingScore = 100;
    if (speechRate < 130 || speechRate > 180) {
      pacingScore = 70;
    } else if (speechRate < 140 || speechRate > 170) {
      pacingScore = 85;
    }
    
    // Energy consistency for delivery
    const energyConsistency = 100 - (this.calculateVariance(energyArray) * 500);
    const energyScore = Math.min(100, Math.max(40, energyConsistency));
    
    // Pause effectiveness
    const pauseScore = Math.min(100, Math.max(60, 
      100 - Math.abs(pauseAnalysis.pauseFrequency - 8) * 5
    ));
    
    return Math.round((pacingScore + energyScore + pauseScore) / 3);
  }

  private calculateClarityScore(
    spectralCentroid: number[],
    zcr: number[],
    fillerCount: number,
    wordCount: number
  ): number {
    // Spectral centroid indicates clarity
    const avgSpectralCentroid = this.calculateAverage(spectralCentroid);
    const spectralScore = Math.min(100, Math.max(40, (avgSpectralCentroid / 2000) * 100));
    
    // Zero crossing rate indicates articulation
    const avgZCR = this.calculateAverage(zcr);
    const zcrScore = Math.min(100, Math.max(40, avgZCR * 2000));
    
    // Filler word penalty for clarity
    const fillerPenalty = Math.min(30, (fillerCount / Math.max(1, wordCount)) * 600);
    
    const clarityScore = Math.max(0, (spectralScore + zcrScore) / 2 - fillerPenalty);
    return Math.round(clarityScore);
  }

  private analyzePitch(pitchArray: number[]) {
    const validPitches = pitchArray.filter(p => p > 0);
    const averagePitch = validPitches.length > 0 ? this.calculateAverage(validPitches) : 0;
    const pitchVariation = validPitches.length > 0 ? this.calculateStandardDeviation(validPitches) : 0;
    const pitchStability = this.calculatePitchStability(pitchArray);
    
    return {
      averagePitch: Math.round(averagePitch),
      pitchVariation: Math.round(pitchVariation * 10) / 10,
      pitchStability: Math.round(pitchStability * 100)
    };
  }

  private analyzeEnergy(energyArray: number[]) {
    const averageEnergy = this.calculateAverage(energyArray);
    const energyVariance = this.calculateVariance(energyArray);
    const energyConsistency = Math.max(0, 100 - (energyVariance * 1000));
    
    const maxEnergy = Math.max(...energyArray);
    const minEnergy = Math.min(...energyArray);
    const dynamicRange = maxEnergy - minEnergy;
    
    return {
      averageEnergy: Math.round(averageEnergy * 1000) / 1000,
      energyConsistency: Math.round(energyConsistency),
      dynamicRange: Math.round(dynamicRange * 1000) / 1000
    };
  }

  private calculatePitchStability(pitchArray: number[]): number {
    const validPitches = pitchArray.filter(p => p > 0);
    if (validPitches.length < 2) return 0.5;
    
    const stdDev = this.calculateStandardDeviation(validPitches);
    const mean = this.calculateAverage(validPitches);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    
    // Lower coefficient of variation means more stability
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
  }

  private calculateAverage(array: number[]): number {
    if (array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  private calculateVariance(array: number[]): number {
    if (array.length === 0) return 0;
    const mean = this.calculateAverage(array);
    const squaredDiffs = array.map(val => Math.pow(val - mean, 2));
    return this.calculateAverage(squaredDiffs);
  }

  private calculateStandardDeviation(array: number[]): number {
    return Math.sqrt(this.calculateVariance(array));
  }

  private getDefaultMetrics(): VoiceMetrics {
    return {
      speechRate: 0,
      fluencyScore: 0,
      voiceConfidence: 0,
      deliveryScore: 0,
      clarityScore: 0,
      fillerWordCount: 0,
      pauseAnalysis: {
        averagePauseLength: 0,
        pauseFrequency: 0,
        strategicPauses: 0
      },
      pitchAnalysis: {
        averagePitch: 0,
        pitchVariation: 0,
        pitchStability: 0
      },
      energyAnalysis: {
        averageEnergy: 0,
        energyConsistency: 0,
        dynamicRange: 0
      }
    };
  }

  private calculateFrameEnergy(frame: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < frame.length; i++) {
      energy += frame[i] * frame[i];
    }
    return energy / frame.length;
  }

  private calculateSpectralCentroid(frame: Float32Array, sampleRate: number): number {
    const fft = this.calculateFFT(frame);
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < fft.length / 2; i++) {
      const magnitude = Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2);
      const frequency = (i * sampleRate) / frame.length;
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private calculateSpectralRolloff(frame: Float32Array, sampleRate: number): number {
    const fft = this.calculateFFT(frame);
    let totalEnergy = 0;
    
    for (let i = 0; i < fft.length / 2; i++) {
      const magnitude = Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2);
      totalEnergy += magnitude;
    }
    
    let energySum = 0;
    const threshold = 0.85 * totalEnergy;
    
    for (let i = 0; i < fft.length / 2; i++) {
      const magnitude = Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2);
      energySum += magnitude;
      if (energySum >= threshold) {
        return (i * sampleRate) / frame.length;
      }
    }
    
    return 0;
  }

  private calculateMFCC(frame: Float32Array): number[] {
    // Simplified MFCC calculation
    const numCoeffs = 13;
    const fft = this.calculateFFT(frame);
    const mfcc = new Array(numCoeffs).fill(0);
    
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

  private calculateZCR(frame: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < frame.length; i++) {
      if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / frame.length;
  }

  private calculateRMS(frame: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) {
      sum += frame[i] * frame[i];
    }
    return Math.sqrt(sum / frame.length);
  }

  private calculateFFT(data: Float32Array): Float32Array {
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
}

// Enhanced transcription service (keeping the existing implementation)
export class FastTranscription {
  private static readonly CHUNK_SIZE = 1024 * 16; // 16KB chunks
  private static readonly OVERLAP_SIZE = 1024 * 2; // 2KB overlap
  
  static async transcribeWithStreaming(audioBlob: Blob, apiKey: string): Promise<string> {
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.warn('OpenAI API key not configured');
      return '';
    }

    if (!audioBlob || audioBlob.size === 0) {
      console.warn('Invalid or empty audio blob');
      return '';
    }

    if (audioBlob.size < 1000) {
      console.warn('Audio blob too small for transcription');
      return '';
    }

    try {
      if (audioBlob.size < this.CHUNK_SIZE * 2) {
        return await this.directTranscription(audioBlob, apiKey);
      }
      return await this.chunkedTranscription(audioBlob, apiKey);
    } catch (error) {
      console.error('Transcription error:', error);
      
      if (error instanceof Error && error.message.includes('401')) {
        console.error('Invalid or expired OpenAI API key');
        throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
      }
      
      if (error instanceof Error && error.message.includes('400')) {
        console.error('Bad request to OpenAI API - likely invalid audio format or API key');
        throw new Error('Invalid audio format or API configuration. Please check your audio recording and API key.');
      }
      
      return '';
    }
  }

  private static async directTranscription(audioBlob: Blob, apiKey: string): Promise<string> {
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    let processedBlob = audioBlob;
    
    if (audioBlob.type.includes('webm')) {
      processedBlob = new Blob([audioBlob], { type: 'audio/webm' });
    }

    const formData = new FormData();
    formData.append('file', processedBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');
    formData.append('temperature', '0.2');

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
    const arrayBuffer = await audioBlob.arrayBuffer();
    const chunks = this.createAudioChunks(arrayBuffer);
    
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