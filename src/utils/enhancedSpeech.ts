import { VoiceMetrics } from '../types/interview';

// Enhanced speech analysis configuration
interface SpeechAnalysisConfig {
  sampleRate: number;
  windowSize: number;
  hopLength: number;
  minSpeechDuration: number;
  silenceThreshold: number;
  fillerWords: string[];
}

const DEFAULT_CONFIG: SpeechAnalysisConfig = {
  sampleRate: 16000,
  windowSize: 1024,
  hopLength: 512,
  minSpeechDuration: 0.1, // 100ms
  silenceThreshold: 0.01,
  fillerWords: [
    'um', 'uh', 'er', 'ah', 'like', 'you know', 'so', 'well',
    'actually', 'basically', 'literally', 'right', 'okay', 'yeah'
  ]
};

// Advanced audio feature extraction
class AudioFeatureExtractor {
  private audioContext: AudioContext | null = null;
  private config: SpeechAnalysisConfig;

  constructor(config: SpeechAnalysisConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  private async initAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  async extractFeatures(audioBlob: Blob): Promise<{
    rms: number[];
    zcr: number[];
    spectralCentroid: number[];
    mfcc: number[][];
    pitch: number[];
    energy: number[];
  }> {
    const audioContext = await this.initAudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const frameCount = Math.floor((channelData.length - this.config.windowSize) / this.config.hopLength) + 1;
    
    const features = {
      rms: [] as number[],
      zcr: [] as number[],
      spectralCentroid: [] as number[],
      mfcc: [] as number[][],
      pitch: [] as number[],
      energy: [] as number[]
    };

    for (let i = 0; i < frameCount; i++) {
      const start = i * this.config.hopLength;
      const end = Math.min(start + this.config.windowSize, channelData.length);
      const frame = channelData.slice(start, end);
      
      features.rms.push(this.calculateRMS(frame));
      features.zcr.push(this.calculateZCR(frame));
      features.energy.push(this.calculateEnergy(frame));
      features.pitch.push(this.estimatePitch(frame));
      
      // For spectral features, we'd need FFT - simplified here
      features.spectralCentroid.push(this.estimateSpectralCentroid(frame));
      features.mfcc.push(this.estimateMFCC(frame));
    }

    return features;
  }

  private calculateRMS(frame: Float32Array): number {
    const sum = frame.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum / frame.length);
  }

  private calculateZCR(frame: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < frame.length; i++) {
      if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (2 * frame.length);
  }

  private calculateEnergy(frame: Float32Array): number {
    return frame.reduce((acc, val) => acc + val * val, 0);
  }

  private estimatePitch(frame: Float32Array): number {
    // Simplified autocorrelation-based pitch estimation
    const minPeriod = Math.floor(this.config.sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(this.config.sampleRate / 80);  // 80 Hz min
    
    let maxCorr = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < frame.length - period; i++) {
        correlation += frame[i] * frame[i + period];
        count++;
      }
      
      correlation /= count;
      
      if (correlation > maxCorr) {
        maxCorr = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? this.config.sampleRate / bestPeriod : 0;
  }

  private estimateSpectralCentroid(frame: Float32Array): number {
    // Simplified spectral centroid estimation
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frame.length; i++) {
      const magnitude = Math.abs(frame[i]);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private estimateMFCC(frame: Float32Array): number[] {
    // Simplified MFCC estimation (normally requires mel-scale filterbank)
    const mfcc = [];
    const numCoeffs = 13;
    
    for (let i = 0; i < numCoeffs; i++) {
      let coeff = 0;
      for (let j = 0; j < frame.length; j++) {
        coeff += frame[j] * Math.cos((Math.PI * i * (j + 0.5)) / frame.length);
      }
      mfcc.push(coeff / frame.length);
    }
    
    return mfcc;
  }
}

// Enhanced speech metrics analyzer
export class EnhancedSpeechAnalyzer {
  private featureExtractor: AudioFeatureExtractor;
  private config: SpeechAnalysisConfig;

  constructor(config: SpeechAnalysisConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.featureExtractor = new AudioFeatureExtractor(config);
  }

  async analyzeVoiceMetrics(
    audioBlob: Blob,
    transcription: string,
    duration: number,
    timestamp: number,
    responseTimes?: number[]
  ): Promise<VoiceMetrics> {
    try {
      // Extract audio features
      const features = await this.featureExtractor.extractFeatures(audioBlob);
      
      // Calculate advanced metrics
      const speechRate = this.calculateAdvancedSpeechRate(transcription, duration, features);
      const fluency = this.calculateAdvancedFluency(features, transcription);
      const voiceConfidence = this.calculateAdvancedVoiceConfidence(features);
      const delivery = this.calculateAdvancedDelivery(features);
      const clarity = this.calculateAdvancedClarity(features, transcription);
      const fillerWordCount = this.calculateFillerWords(transcription);
      
      return {
      speechRate,
      fluency,
      fluencyScore: fluency * 10, // Convert 0-10 to 0-100 for legacy compatibility
      voiceConfidence,
      delivery,
      deliveryScore: delivery * 10, // Convert 0-10 to 0-100 for legacy compatibility
      clarity,
      clarityScore: clarity * 10, // Convert 0-10 to 0-100 for legacy compatibility
      fillerWordCount,
      timestamp,
      responseTime: responseTimes && responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0
    };
    } catch (error) {
      console.warn('Enhanced speech analysis failed, using fallback:', error);
      return this.getFallbackMetrics(transcription, duration, timestamp);
    }
  }

  private calculateAdvancedSpeechRate(
    transcription: string,
    duration: number,
    features: any
  ): number {
    const words = transcription.trim().split(/\s+/).filter(word => word.length > 0);
    if (duration === 0) {
      return 0;
    }
    const wordsPerMinute = (words.length / duration) * 60;
    
    // Adjust based on speech activity detection
    const speechActivity = this.detectSpeechActivity(features.energy, features.rms);
    const activeSpeechDuration = duration * speechActivity;
    
    if (activeSpeechDuration > 0) {
      const adjustedWPM = (words.length / activeSpeechDuration) * 60;
      return adjustedWPM;
    }
    
    return wordsPerMinute;
  }

  private calculateAdvancedFluency(
    features: any,
    transcription: string
  ): number {
    // Analyze pause patterns
    const pauseAnalysis = this.analyzePausePatterns(features.energy, features.rms);
    
    // Analyze pitch variation (prosody)
    const pitchVariation = this.calculatePitchVariation(features.pitch);
    
    // Analyze rhythm consistency
    const rhythmConsistency = this.calculateRhythmConsistency(features.energy);
    
    // Text-based fluency indicators
    const textFluency = this.analyzeTextFluency(transcription);
    
    // Combine metrics (weighted average)
    const fluencyScore = (
      pauseAnalysis * 0.3 +
      pitchVariation * 0.25 +
      rhythmConsistency * 0.25 +
      textFluency * 0.2
    );
    
    return Math.min(10, Math.max(1, fluencyScore));
  }

  private calculateAdvancedVoiceConfidence(features: any): number {
    // Analyze voice stability
    const voiceStability = this.calculateVoiceStability(features.pitch, features.rms);
    
    // Analyze energy consistency
    const energyConsistency = this.calculateEnergyConsistency(features.energy);
    
    // Analyze spectral consistency
    const spectralStability = this.calculateSpectralStability(features.spectralCentroid);
    
    // Combine metrics
    const confidenceScore = (
      voiceStability * 0.4 +
      energyConsistency * 0.35 +
      spectralStability * 0.25
    );
    
    return Math.min(10, Math.max(1, confidenceScore));
  }

  private calculateAdvancedDelivery(features: any): number {
    // Analyze dynamic range
    const dynamicRange = this.calculateDynamicRange(features.rms);
    
    // Analyze articulation clarity
    const articulation = this.calculateArticulation(features.zcr, features.spectralCentroid);
    
    // Analyze vocal emphasis patterns
    const emphasis = this.calculateEmphasisPatterns(features.energy, features.pitch);
    
    // Combine metrics
    const deliveryScore = (
      dynamicRange * 0.35 +
      articulation * 0.35 +
      emphasis * 0.3
    );
    
    return Math.min(10, Math.max(1, deliveryScore));
  }

  private calculateAdvancedClarity(features: any, transcription: string): number {
    // Analyze high-frequency content (consonant clarity)
    const consonantClarity = this.calculateConsonantClarity(features.zcr, features.spectralCentroid);
    
    // Analyze signal-to-noise ratio
    const snr = this.calculateSNR(features.rms, features.energy);
    
    // Text-based clarity (coherence, structure)
    const textClarity = this.analyzeTextClarity(transcription);
    
    // Combine metrics
    const clarityScore = (
      consonantClarity * 0.4 +
      snr * 0.3 +
      textClarity * 0.3
    );
    
    return Math.min(10, Math.max(1, clarityScore));
  }

  private calculateFillerWords(transcription: string): number {
    const words = transcription.toLowerCase().split(/\s+/);
    let fillerCount = 0;
    
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (this.config.fillerWords.includes(cleanWord)) {
        fillerCount++;
      }
    }
    
    return fillerCount;
  }

  // Helper methods for advanced analysis
  private detectSpeechActivity(energy: number[], rms: number[]): number {
    const threshold = this.config.silenceThreshold;
    let activeFrames = 0;
    
    for (let i = 0; i < energy.length; i++) {
      if (rms[i] > threshold) {
        activeFrames++;
      }
    }
    
    return energy.length > 0 ? activeFrames / energy.length : 0;
  }

  private analyzePausePatterns(energy: number[], rms: number[]): number {
    const silenceThreshold = this.config.silenceThreshold;
    const pauses: number[] = [];
    let currentPause = 0;
    
    for (let i = 0; i < rms.length; i++) {
      if (rms[i] < silenceThreshold) {
        currentPause++;
      } else {
        if (currentPause > 0) {
          pauses.push(currentPause);
          currentPause = 0;
        }
      }
    }
    
    if (pauses.length === 0) return 8; // No pauses detected
    
    const avgPauseLength = pauses.reduce((a, b) => a + b, 0) / pauses.length;
    const pauseVariability = this.calculateVariability(pauses);
    
    // Optimal pause length and consistency
    const optimalPauseScore = Math.max(1, 10 - Math.abs(avgPauseLength - 5) / 2);
    const consistencyScore = Math.max(1, 10 - pauseVariability * 2);
    
    return (optimalPauseScore + consistencyScore) / 2;
  }

  private calculatePitchVariation(pitch: number[]): number {
    if (pitch.length < 2) return 5;
    
    const validPitches = pitch.filter(p => p > 0);
    if (validPitches.length < 2) return 5;
    
    const mean = validPitches.reduce((a, b) => a + b, 0) / validPitches.length;
    const variance = validPitches.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / validPitches.length;
    const stdDev = Math.sqrt(variance);
    
    // Optimal pitch variation (not too monotone, not too erratic)
    const coefficientOfVariation = stdDev / mean;
    
    if (coefficientOfVariation < 0.05) return 3; // Too monotone
    if (coefficientOfVariation > 0.3) return 4;  // Too erratic
    
    return Math.min(10, 5 + coefficientOfVariation * 15);
  }

  private calculateRhythmConsistency(energy: number[]): number {
    if (energy.length < 10) return 5;
    
    // Analyze energy peaks to detect rhythm
    const peaks = this.findEnergyPeaks(energy);
    if (peaks.length < 3) return 5;
    
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    const consistency = 1 - this.calculateVariability(intervals);
    return Math.min(10, Math.max(1, consistency * 10));
  }

  private analyzeTextFluency(transcription: string): number {
    const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 1;
    
    let fluencyScore = 5;
    
    // Check for repetitions
    const words = transcription.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = 1 - (uniqueWords.size / words.length);
    fluencyScore -= repetitionRatio * 3;
    
    // Check sentence length variation
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const lengthVariation = this.calculateVariability(sentenceLengths);
    
    if (avgLength > 5 && avgLength < 20) fluencyScore += 1;
    if (lengthVariation > 0.2 && lengthVariation < 0.8) fluencyScore += 1;
    
    return Math.min(10, Math.max(1, fluencyScore));
  }

  private calculateVoiceStability(pitch: number[], rms: number[]): number {
    const validPitches = pitch.filter(p => p > 0);
    if (validPitches.length < 2) return 5;
    
    const pitchStability = 1 - this.calculateVariability(validPitches);
    const rmsStability = 1 - this.calculateVariability(rms);
    
    return Math.min(10, Math.max(1, (pitchStability + rmsStability) * 5));
  }

  private calculateEnergyConsistency(energy: number[]): number {
    if (energy.length < 2) return 5;
    
    const consistency = 1 - this.calculateVariability(energy);
    return Math.min(10, Math.max(1, consistency * 10));
  }

  private calculateSpectralStability(spectralCentroid: number[]): number {
    if (spectralCentroid.length < 2) return 5;
    
    const stability = 1 - this.calculateVariability(spectralCentroid);
    return Math.min(10, Math.max(1, stability * 10));
  }

  private calculateDynamicRange(rms: number[]): number {
    if (rms.length === 0) return 5;
    
    const max = Math.max(...rms);
    const min = Math.min(...rms);
    const range = max - min;
    
    // Optimal dynamic range
    if (range < 0.1) return 3; // Too flat
    if (range > 0.8) return 4; // Too extreme
    
    return Math.min(10, 5 + range * 5);
  }

  private calculateArticulation(zcr: number[], spectralCentroid: number[]): number {
    const avgZCR = zcr.reduce((a, b) => a + b, 0) / zcr.length;
    const avgSpectral = spectralCentroid.reduce((a, b) => a + b, 0) / spectralCentroid.length;
    
    // Higher ZCR and spectral centroid indicate better articulation
    const zcrScore = Math.min(10, avgZCR * 100);
    const spectralScore = Math.min(10, avgSpectral / 100);
    
    return (zcrScore + spectralScore) / 2;
  }

  private calculateEmphasisPatterns(energy: number[], pitch: number[]): number {
    const energyPeaks = this.findEnergyPeaks(energy);
    const pitchPeaks = this.findPitchPeaks(pitch);
    
    // Good emphasis has coordinated energy and pitch peaks
    const coordination = this.calculatePeakCoordination(energyPeaks, pitchPeaks);
    
    return Math.min(10, Math.max(1, coordination * 10));
  }

  private calculateConsonantClarity(zcr: number[], spectralCentroid: number[]): number {
    // High ZCR indicates good consonant production
    const avgZCR = zcr.reduce((a, b) => a + b, 0) / zcr.length;
    const zcrVariation = this.calculateVariability(zcr);
    
    const clarityScore = avgZCR * 50 + zcrVariation * 20;
    return Math.min(10, Math.max(1, clarityScore));
  }

  private calculateSNR(rms: number[], energy: number[]): number {
    if (rms.length === 0 || energy.length === 0) return 5;
    
    const avgRMS = rms.reduce((a, b) => a + b, 0) / rms.length;
    const avgEnergy = energy.reduce((a, b) => a + b, 0) / energy.length;
    
    const snr = avgEnergy > 0 ? avgRMS / Math.sqrt(avgEnergy) : 0;
    return Math.min(10, Math.max(1, snr * 100));
  }

  private analyzeTextClarity(transcription: string): number {
    const words = transcription.trim().split(/\s+/);
    if (words.length === 0) return 1;
    
    let clarityScore = 5;
    
    // Check for complete sentences
    const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) clarityScore += 1;
    
    // Check for proper capitalization
    const capitalizedSentences = sentences.filter(s => /^[A-Z]/.test(s.trim()));
    if (capitalizedSentences.length === sentences.length) clarityScore += 1;
    
    // Check word length distribution (avoid too many short words)
    const avgWordLength = words.reduce((acc, word) => acc + word.length, 0) / words.length;
    if (avgWordLength > 3 && avgWordLength < 8) clarityScore += 1;
    
    return Math.min(10, Math.max(1, clarityScore));
  }

  // Utility methods
  private calculateVariability(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? stdDev / mean : 0;
  }

  private findEnergyPeaks(energy: number[]): number[] {
    const peaks: number[] = [];
    const threshold = Math.max(...energy) * 0.3;
    
    for (let i = 1; i < energy.length - 1; i++) {
      if (energy[i] > energy[i - 1] && energy[i] > energy[i + 1] && energy[i] > threshold) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  private findPitchPeaks(pitch: number[]): number[] {
    const validPitches = pitch.map((p, i) => ({ value: p, index: i })).filter(p => p.value > 0);
    if (validPitches.length === 0) return [];
    
    const peaks: number[] = [];
    const threshold = Math.max(...validPitches.map(p => p.value)) * 0.8;
    
    for (let i = 1; i < validPitches.length - 1; i++) {
      const current = validPitches[i];
      const prev = validPitches[i - 1];
      const next = validPitches[i + 1];
      
      if (current.value > prev.value && current.value > next.value && current.value > threshold) {
        peaks.push(current.index);
      }
    }
    
    return peaks;
  }

  private calculatePeakCoordination(energyPeaks: number[], pitchPeaks: number[]): number {
    if (energyPeaks.length === 0 || pitchPeaks.length === 0) return 0.5;
    
    let coordinated = 0;
    const tolerance = 5; // frames
    
    for (const energyPeak of energyPeaks) {
      for (const pitchPeak of pitchPeaks) {
        if (Math.abs(energyPeak - pitchPeak) <= tolerance) {
          coordinated++;
          break;
        }
      }
    }
    
    return coordinated / Math.max(energyPeaks.length, pitchPeaks.length);
  }

  private getFallbackMetrics(transcription: string, duration: number, timestamp: number): VoiceMetrics {
    const words = transcription.trim().split(/\s+/).filter(word => word.length > 0);
    const wordsPerMinute = duration > 0 ? (words.length / duration) * 60 : 0;
    
    const speechRate = Math.min(10, Math.max(1, wordsPerMinute / 20));
    const fluency = Math.min(10, Math.max(1, words.length / 10));
    const voiceConfidence = Math.min(10, Math.max(1, transcription.length / 20));
    const delivery = Math.min(10, Math.max(1, words.length / 8));
    const clarity = Math.min(10, Math.max(1, transcription.length / 15));
    
    return {
      speechRate,
      fluency,
      fluencyScore: fluency * 10, // Convert 0-10 to 0-100 for legacy compatibility
      voiceConfidence,
      delivery,
      deliveryScore: delivery * 10, // Convert 0-10 to 0-100 for legacy compatibility
      clarity,
      clarityScore: clarity * 10, // Convert 0-10 to 0-100 for legacy compatibility
      fillerWordCount: this.calculateFillerWords(transcription),
      timestamp
    };
  }
}

// Export the main analyzer instance
export const enhancedSpeechAnalyzer = new EnhancedSpeechAnalyzer();

// Export for realtime integration
export async function analyzeEnhancedVoiceMetrics(
  audioBlob: Blob,
  transcription: string,
  duration: number,
  timestamp: number = Date.now(),
  responseTimes?: number[]
): Promise<VoiceMetrics> {
  return enhancedSpeechAnalyzer.analyzeVoiceMetrics(audioBlob, transcription, duration, timestamp, responseTimes);
}