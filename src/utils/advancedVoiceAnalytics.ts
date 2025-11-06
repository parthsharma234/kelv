import { VoiceMetrics } from '../types/interview';

// Advanced Voice Analytics Types
export interface AdvancedVoiceMetrics extends VoiceMetrics {
  // Prosodic features
  prosody: {
    intonationVariety: number;
    stressPatterns: number;
    rhythmConsistency: number;
    melodicRange: number;
  };
  
  // Emotional indicators
  emotional: {
    enthusiasm: number;
    nervousness: number;
    confidence: number;
    engagement: number;
    stress: number;
  };
  
  // Communication effectiveness
  communication: {
    articulation: number;
    projection: number;
    paceVariation: number;
    pauseEffectiveness: number;
    emphasis: number;
  };
  
  // Professional presence
  professional: {
    authorityLevel: number;
    credibility: number;
    persuasiveness: number;
    likeability: number;
  };
  
  // Real-time feedback scores
  realtime: {
    currentConfidence: number;
    currentClarity: number;
    currentEngagement: number;
    trendDirection: 'improving' | 'declining' | 'stable';
  };
}

export interface VoiceAnalysisSegment {
  startTime: number;
  endTime: number;
  transcript: string;
  metrics: AdvancedVoiceMetrics;
  feedback: {
    strengths: string[];
    improvements: string[];
    specificTips: string[];
    score: number;
  };
}

// Advanced Voice Analytics Engine
export class AdvancedVoiceAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isAnalyzing: boolean = false;
  private analysisHistory: AdvancedVoiceMetrics[] = [];
  private currentSegment: VoiceAnalysisSegment | null = null;
  private segmentStartTime: number = 0;
  private realtimeCallbacks: ((metrics: AdvancedVoiceMetrics) => void)[] = [];

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100
      });
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  async startRealtimeAnalysis(stream: MediaStream): Promise<void> {
    if (!this.audioContext || this.isAnalyzing) return;

    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      
      // Configure analyser for detailed frequency analysis
      this.analyser.fftSize = 4096;
      this.analyser.smoothingTimeConstant = 0.3;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      
      source.connect(this.analyser);
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isAnalyzing = true;
      this.segmentStartTime = Date.now();
      
      // Start real-time analysis loop
      this.realtimeAnalysisLoop();
      
    } catch (error) {
      console.error('Failed to start voice analysis:', error);
    }
  }

  stopRealtimeAnalysis(): void {
    this.isAnalyzing = false;
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    this.dataArray = null;
  }

  private realtimeAnalysisLoop(): void {
    if (!this.isAnalyzing || !this.analyser || !this.dataArray) return;

    // Get frequency and time domain data
    this.analyser.getByteFrequencyData(this.dataArray);
    const timeData = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(timeData);

    // Perform comprehensive analysis
    const metrics = this.analyzeAudioFrame(this.dataArray, timeData);
    
    // Store in history
    this.analysisHistory.push(metrics);
    
    // Keep only last 5 minutes of data (at 10Hz = 3000 samples)
    if (this.analysisHistory.length > 3000) {
      this.analysisHistory = this.analysisHistory.slice(-3000);
    }

    // Notify callbacks with real-time metrics
    this.realtimeCallbacks.forEach(callback => callback(metrics));

    // Continue analysis loop
    setTimeout(() => this.realtimeAnalysisLoop(), 100); // 10Hz analysis rate
  }

  private analyzeAudioFrame(frequencyData: Uint8Array, timeData: Uint8Array): AdvancedVoiceMetrics {
    const timestamp = Date.now();
    
    // Basic metrics
    const volume = this.calculateVolume(timeData);
    const pitch = this.estimatePitch(timeData);
    const spectralCentroid = this.calculateSpectralCentroid(frequencyData);
    const spectralRolloff = this.calculateSpectralRolloff(frequencyData);
    const zeroCrossingRate = this.calculateZeroCrossingRate(timeData);
    
    // Advanced prosodic analysis
    const prosody = this.analyzeProsody(frequencyData, timeData, pitch);
    
    // Emotional state analysis
    const emotional = this.analyzeEmotionalState(frequencyData, timeData, volume, pitch);
    
    // Communication effectiveness
    const communication = this.analyzeCommunicationEffectiveness(frequencyData, timeData, volume);
    
    // Professional presence indicators
    const professional = this.analyzeProfessionalPresence(volume, pitch, spectralCentroid);
    
    // Real-time feedback
    const realtime = this.generateRealtimeFeedback();

    // Calculate traditional metrics for compatibility
    const speechRate = this.estimateSpeechRate(volume);
    const fluency = this.calculateFluency(zeroCrossingRate, volume);
    const voiceConfidence = emotional.confidence;
    const delivery = communication.projection;
    const clarity = communication.articulation;

    return {
      // Traditional metrics
      speechRate,
      fluency,
      fluencyScore: fluency * 100,
      voiceConfidence,
      delivery,
      deliveryScore: delivery * 100,
      clarity,
      clarityScore: clarity * 100,
      fillerWordCount: 0, // Would need transcript analysis
      timestamp,
      duration: 0.1, // 100ms frame
      
      // Advanced metrics
      prosody,
      emotional,
      communication,
      professional,
      realtime
    };
  }

  private calculateVolume(timeData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / timeData.length);
  }

  private estimatePitch(timeData: Uint8Array): number {
    // Autocorrelation-based pitch detection
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
    
    let maxCorrelation = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period <= maxPeriod && period < timeData.length / 2; period++) {
      let correlation = 0;
      for (let i = 0; i < timeData.length - period; i++) {
        correlation += timeData[i] * timeData[i + period];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  private calculateSpectralCentroid(frequencyData: Uint8Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      weightedSum += i * frequencyData[i];
      magnitudeSum += frequencyData[i];
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private calculateSpectralRolloff(frequencyData: Uint8Array): number {
    const totalEnergy = frequencyData.reduce((sum, val) => sum + val, 0);
    const threshold = totalEnergy * 0.85;
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      cumulativeEnergy += frequencyData[i];
      if (cumulativeEnergy >= threshold) {
        return i / frequencyData.length;
      }
    }
    
    return 1;
  }

  private calculateZeroCrossingRate(timeData: Uint8Array): number {
    let crossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 128) !== (timeData[i - 1] >= 128)) {
        crossings++;
      }
    }
    return crossings / timeData.length;
  }

  private analyzeProsody(frequencyData: Uint8Array, timeData: Uint8Array, pitch: number): AdvancedVoiceMetrics['prosody'] {
    // Analyze prosodic features for natural speech patterns
    const recentPitches = this.analysisHistory.slice(-20).map(m => this.extractPitchFromHistory(m));
    
    const intonationVariety = this.calculateIntonationVariety(recentPitches);
    const stressPatterns = this.analyzeStressPatterns(frequencyData, timeData);
    const rhythmConsistency = this.calculateRhythmConsistency();
    const melodicRange = this.calculateMelodicRange(recentPitches);

    return {
      intonationVariety,
      stressPatterns,
      rhythmConsistency,
      melodicRange
    };
  }

  private analyzeEmotionalState(frequencyData: Uint8Array, timeData: Uint8Array, volume: number, pitch: number): AdvancedVoiceMetrics['emotional'] {
    // Analyze emotional indicators from voice characteristics
    const highFreqEnergy = this.calculateHighFrequencyEnergy(frequencyData);
    const lowFreqEnergy = this.calculateLowFrequencyEnergy(frequencyData);
    const voiceShakiness = this.calculateVoiceShakiness(timeData);
    const pitchStability = this.calculatePitchStability();

    const enthusiasm = Math.min(1, Math.max(0, (highFreqEnergy * 0.4 + volume * 0.4 + pitch / 300 * 0.2)));
    const nervousness = Math.min(1, Math.max(0, (voiceShakiness * 0.5 + (1 - pitchStability) * 0.3 + highFreqEnergy * 0.2)));
    const confidence = Math.min(1, Math.max(0, (pitchStability * 0.4 + volume * 0.3 + lowFreqEnergy * 0.3)));
    const engagement = Math.min(1, Math.max(0, (enthusiasm * 0.5 + confidence * 0.3 + (1 - nervousness) * 0.2)));
    const stress = Math.min(1, Math.max(0, (nervousness * 0.6 + voiceShakiness * 0.4)));

    return {
      enthusiasm,
      nervousness,
      confidence,
      engagement,
      stress
    };
  }

  private analyzeCommunicationEffectiveness(frequencyData: Uint8Array, timeData: Uint8Array, volume: number): AdvancedVoiceMetrics['communication'] {
    const articulation = this.calculateArticulation(frequencyData);
    const projection = Math.min(1, volume * 2); // Voice projection
    const paceVariation = this.calculatePaceVariation();
    const pauseEffectiveness = this.analyzePauseEffectiveness();
    const emphasis = this.calculateEmphasis(frequencyData, volume);

    return {
      articulation,
      projection,
      paceVariation,
      pauseEffectiveness,
      emphasis
    };
  }

  private analyzeProfessionalPresence(volume: number, pitch: number, spectralCentroid: number): AdvancedVoiceMetrics['professional'] {
    // Analyze professional voice characteristics
    const optimalPitchRange = pitch >= 85 && pitch <= 255; // Professional speaking range
    const consistentVolume = volume > 0.1 && volume < 0.8; // Not too quiet or loud
    const clearArticulation = spectralCentroid > 0.3; // Clear consonants

    const authorityLevel = Math.min(1, Math.max(0, 
      (optimalPitchRange ? 0.4 : 0.2) + 
      (consistentVolume ? 0.3 : 0.1) + 
      (clearArticulation ? 0.3 : 0.1)
    ));

    const credibility = Math.min(1, Math.max(0,
      authorityLevel * 0.5 + 
      (this.calculateSpeechConsistency() * 0.3) +
      (this.calculateVocalStability() * 0.2)
    ));

    const persuasiveness = Math.min(1, Math.max(0,
      credibility * 0.4 +
      (this.calculateEmotionalResonance() * 0.3) +
      (this.calculateRhetoricEffectiveness() * 0.3)
    ));

    const likeability = Math.min(1, Math.max(0,
      (this.calculateWarmth() * 0.4) +
      (this.calculateApproachability() * 0.3) +
      (this.calculateAuthenticity() * 0.3)
    ));

    return {
      authorityLevel,
      credibility,
      persuasiveness,
      likeability
    };
  }

  private generateRealtimeFeedback(): AdvancedVoiceMetrics['realtime'] {
    if (this.analysisHistory.length < 10) {
      return {
        currentConfidence: 0.7,
        currentClarity: 0.7,
        currentEngagement: 0.7,
        trendDirection: 'stable'
      };
    }

    const recent = this.analysisHistory.slice(-10);
    const earlier = this.analysisHistory.slice(-20, -10);

    const currentConfidence = recent.reduce((sum, m) => sum + (m as any).emotional?.confidence || 0.7, 0) / recent.length;
    const currentClarity = recent.reduce((sum, m) => sum + (m as any).communication?.articulation || 0.7, 0) / recent.length;
    const currentEngagement = recent.reduce((sum, m) => sum + (m as any).emotional?.engagement || 0.7, 0) / recent.length;

    // Calculate trend
    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
    if (earlier.length > 0) {
      const earlierAvg = earlier.reduce((sum, m) => sum + (m.voiceConfidence || 0.7), 0) / earlier.length;
      const recentAvg = recent.reduce((sum, m) => sum + (m.voiceConfidence || 0.7), 0) / recent.length;
      
      if (recentAvg > earlierAvg + 0.1) trendDirection = 'improving';
      else if (recentAvg < earlierAvg - 0.1) trendDirection = 'declining';
    }

    return {
      currentConfidence,
      currentClarity,
      currentEngagement,
      trendDirection
    };
  }

  // Helper methods for advanced analysis
  private calculateIntonationVariety(pitches: number[]): number {
    if (pitches.length < 5) return 0.5;
    
    const mean = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
    const variance = pitches.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pitches.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    // Optimal variety is around 0.15-0.25
    return Math.min(1, Math.max(0, 1 - Math.abs(coefficientOfVariation - 0.2) * 5));
  }

  private analyzeStressPatterns(frequencyData: Uint8Array, timeData: Uint8Array): number {
    // Analyze stress patterns in speech
    const energy = this.calculateVolume(timeData);
    const highFreqRatio = this.calculateHighFrequencyRatio(frequencyData);
    
    // Good stress patterns have moderate energy variation and clear emphasis
    return Math.min(1, Math.max(0, energy * 0.6 + highFreqRatio * 0.4));
  }

  private calculateRhythmConsistency(): number {
    if (this.analysisHistory.length < 20) return 0.7;
    
    const recentVolumes = this.analysisHistory.slice(-20).map(m => this.extractVolumeFromHistory(m));
    const intervals = this.findSpeechIntervals(recentVolumes);
    
    if (intervals.length < 3) return 0.7;
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return Math.min(1, Math.max(0, 1 - Math.sqrt(variance) / avgInterval));
  }

  private calculateMelodicRange(pitches: number[]): number {
    if (pitches.length < 5) return 0.5;
    
    const validPitches = pitches.filter(p => p > 0);
    if (validPitches.length < 3) return 0.5;
    
    const min = Math.min(...validPitches);
    const max = Math.max(...validPitches);
    const range = max - min;
    
    // Optimal range for professional speech
    const optimalRange = 100; // Hz
    return Math.min(1, Math.max(0, 1 - Math.abs(range - optimalRange) / optimalRange));
  }

  private calculateHighFrequencyEnergy(frequencyData: Uint8Array): number {
    const highFreqStart = Math.floor(frequencyData.length * 0.6);
    let highFreqSum = 0;
    
    for (let i = highFreqStart; i < frequencyData.length; i++) {
      highFreqSum += frequencyData[i];
    }
    
    const totalEnergy = frequencyData.reduce((sum, val) => sum + val, 0);
    return totalEnergy > 0 ? highFreqSum / totalEnergy : 0;
  }

  private calculateLowFrequencyEnergy(frequencyData: Uint8Array): number {
    const lowFreqEnd = Math.floor(frequencyData.length * 0.3);
    let lowFreqSum = 0;
    
    for (let i = 0; i < lowFreqEnd; i++) {
      lowFreqSum += frequencyData[i];
    }
    
    const totalEnergy = frequencyData.reduce((sum, val) => sum + val, 0);
    return totalEnergy > 0 ? lowFreqSum / totalEnergy : 0;
  }

  private calculateVoiceShakiness(timeData: Uint8Array): number {
    // Detect voice tremor or shakiness
    let shakiness = 0;
    const windowSize = 10;
    
    for (let i = windowSize; i < timeData.length - windowSize; i++) {
      let localVariance = 0;
      for (let j = -windowSize; j <= windowSize; j++) {
        const sample = (timeData[i + j] - 128) / 128;
        localVariance += sample * sample;
      }
      localVariance /= (windowSize * 2 + 1);
      shakiness += localVariance;
    }
    
    return Math.min(1, shakiness / (timeData.length - windowSize * 2));
  }

  private calculatePitchStability(): number {
    if (this.analysisHistory.length < 10) return 0.8;
    
    const recentPitches = this.analysisHistory.slice(-10).map(m => this.extractPitchFromHistory(m));
    const validPitches = recentPitches.filter(p => p > 0);
    
    if (validPitches.length < 3) return 0.8;
    
    const mean = validPitches.reduce((sum, p) => sum + p, 0) / validPitches.length;
    const variance = validPitches.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / validPitches.length;
    const stability = 1 - (Math.sqrt(variance) / mean);
    
    return Math.min(1, Math.max(0, stability));
  }

  private calculateArticulation(frequencyData: Uint8Array): number {
    // High-frequency content indicates good consonant articulation
    const highFreqEnergy = this.calculateHighFrequencyEnergy(frequencyData);
    const spectralFlatness = this.calculateSpectralFlatness(frequencyData);
    
    return Math.min(1, Math.max(0, highFreqEnergy * 0.7 + spectralFlatness * 0.3));
  }

  private calculatePaceVariation(): number {
    if (this.analysisHistory.length < 20) return 0.5;
    
    const recentVolumes = this.analysisHistory.slice(-20).map(m => this.extractVolumeFromHistory(m));
    const speechSegments = this.identifySpeechSegments(recentVolumes);
    
    if (speechSegments.length < 3) return 0.5;
    
    const segmentLengths = speechSegments.map(seg => seg.length);
    const avgLength = segmentLengths.reduce((sum, len) => sum + len, 0) / segmentLengths.length;
    const variance = segmentLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / segmentLengths.length;
    
    // Good pace variation has moderate variance
    const normalizedVariance = Math.sqrt(variance) / avgLength;
    return Math.min(1, Math.max(0, 1 - Math.abs(normalizedVariance - 0.3) * 2));
  }

  private analyzePauseEffectiveness(): number {
    if (this.analysisHistory.length < 30) return 0.7;
    
    const recentVolumes = this.analysisHistory.slice(-30).map(m => this.extractVolumeFromHistory(m));
    const pauses = this.identifyPauses(recentVolumes);
    
    if (pauses.length === 0) return 0.3; // No pauses is bad
    
    const avgPauseLength = pauses.reduce((sum, pause) => sum + pause.length, 0) / pauses.length;
    const optimalPauseLength = 5; // 500ms
    
    return Math.min(1, Math.max(0, 1 - Math.abs(avgPauseLength - optimalPauseLength) / optimalPauseLength));
  }

  private calculateEmphasis(frequencyData: Uint8Array, volume: number): number {
    // Analyze vocal emphasis patterns
    const energyVariation = this.calculateEnergyVariation();
    const spectralContrast = this.calculateSpectralContrast(frequencyData);
    
    return Math.min(1, Math.max(0, energyVariation * 0.6 + spectralContrast * 0.4));
  }

  // Professional presence helper methods
  private calculateSpeechConsistency(): number {
    if (this.analysisHistory.length < 20) return 0.7;
    
    const recentMetrics = this.analysisHistory.slice(-20);
    const volumes = recentMetrics.map(m => this.extractVolumeFromHistory(m));
    const pitches = recentMetrics.map(m => this.extractPitchFromHistory(m));
    
    const volumeConsistency = 1 - this.calculateVariationCoefficient(volumes);
    const pitchConsistency = 1 - this.calculateVariationCoefficient(pitches.filter(p => p > 0));
    
    return (volumeConsistency + pitchConsistency) / 2;
  }

  private calculateVocalStability(): number {
    return this.calculatePitchStability();
  }

  private calculateEmotionalResonance(): number {
    if (this.analysisHistory.length < 10) return 0.6;
    
    const recent = this.analysisHistory.slice(-10);
    const emotionalVariety = this.calculateEmotionalVariety(recent);
    const emotionalAppropriate = this.calculateEmotionalAppropriateness(recent);
    
    return (emotionalVariety + emotionalAppropriate) / 2;
  }

  private calculateRhetoricEffectiveness(): number {
    // Analyze rhetorical patterns in speech
    const emphasisPatterns = this.analyzeEmphasisPatterns();
    const pauseStrategic = this.analyzeStrategicPauses();
    const buildupPatterns = this.analyzeBuildupPatterns();
    
    return (emphasisPatterns + pauseStrategic + buildupPatterns) / 3;
  }

  private calculateWarmth(): number {
    if (this.analysisHistory.length < 10) return 0.6;
    
    const recent = this.analysisHistory.slice(-10);
    const avgEnthusiasm = recent.reduce((sum, m) => sum + ((m as any).emotional?.enthusiasm || 0.6), 0) / recent.length;
    const voiceWarmth = this.calculateVoiceWarmth();
    
    return (avgEnthusiasm + voiceWarmth) / 2;
  }

  private calculateApproachability(): number {
    const pitchApproachability = this.calculatePitchApproachability();
    const paceApproachability = this.calculatePaceApproachability();
    const tonalApproachability = this.calculateTonalApproachability();
    
    return (pitchApproachability + paceApproachability + tonalApproachability) / 3;
  }

  private calculateAuthenticity(): number {
    // Analyze naturalness and authenticity of speech patterns
    const naturalPauses = this.analyzeNaturalPauses();
    const speechNaturalness = this.calculateSpeechNaturalness();
    const emotionalAuthenticity = this.calculateEmotionalAuthenticity();
    
    return (naturalPauses + speechNaturalness + emotionalAuthenticity) / 3;
  }

  // Utility methods
  private extractPitchFromHistory(metrics: any): number {
    return metrics.pitch || metrics.fundamental || 150; // Default pitch
  }

  private extractVolumeFromHistory(metrics: any): number {
    return metrics.volume || metrics.energy || 0.3; // Default volume
  }

  private calculateVariationCoefficient(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return mean > 0 ? Math.sqrt(variance) / mean : 0;
  }

  private calculateSpectralFlatness(frequencyData: Uint8Array): number {
    // Measure spectral flatness (indicates noise vs. tonal content)
    let geometricMean = 1;
    let arithmeticMean = 0;
    let validBins = 0;
    
    for (let i = 1; i < frequencyData.length; i++) {
      if (frequencyData[i] > 0) {
        geometricMean *= Math.pow(frequencyData[i], 1 / frequencyData.length);
        arithmeticMean += frequencyData[i];
        validBins++;
      }
    }
    
    arithmeticMean /= validBins;
    
    return validBins > 0 && arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
  }

  private calculateHighFrequencyRatio(frequencyData: Uint8Array): number {
    const highFreqStart = Math.floor(frequencyData.length * 0.7);
    const highFreqEnergy = frequencyData.slice(highFreqStart).reduce((sum, val) => sum + val, 0);
    const totalEnergy = frequencyData.reduce((sum, val) => sum + val, 0);
    
    return totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
  }

  private findSpeechIntervals(volumes: number[]): number[] {
    const threshold = 0.1;
    const intervals: number[] = [];
    let currentInterval = 0;
    let inSpeech = false;
    
    volumes.forEach(volume => {
      if (volume > threshold) {
        if (!inSpeech) {
          inSpeech = true;
          currentInterval = 1;
        } else {
          currentInterval++;
        }
      } else {
        if (inSpeech) {
          intervals.push(currentInterval);
          inSpeech = false;
          currentInterval = 0;
        }
      }
    });
    
    return intervals;
  }

  private identifySpeechSegments(volumes: number[]): Array<{ start: number; length: number }> {
    const threshold = 0.1;
    const segments: Array<{ start: number; length: number }> = [];
    let currentStart = -1;
    
    volumes.forEach((volume, index) => {
      if (volume > threshold && currentStart === -1) {
        currentStart = index;
      } else if (volume <= threshold && currentStart !== -1) {
        segments.push({ start: currentStart, length: index - currentStart });
        currentStart = -1;
      }
    });
    
    return segments;
  }

  private identifyPauses(volumes: number[]): Array<{ start: number; length: number }> {
    const threshold = 0.05;
    const pauses: Array<{ start: number; length: number }> = [];
    let currentStart = -1;
    
    volumes.forEach((volume, index) => {
      if (volume <= threshold && currentStart === -1) {
        currentStart = index;
      } else if (volume > threshold && currentStart !== -1) {
        const length = index - currentStart;
        if (length > 2) { // Minimum pause length
          pauses.push({ start: currentStart, length });
        }
        currentStart = -1;
      }
    });
    
    return pauses;
  }

  private calculateEnergyVariation(): number {
    if (this.analysisHistory.length < 10) return 0.5;
    
    const recentVolumes = this.analysisHistory.slice(-10).map(m => this.extractVolumeFromHistory(m));
    return this.calculateVariationCoefficient(recentVolumes);
  }

  private calculateSpectralContrast(frequencyData: Uint8Array): number {
    // Calculate contrast between different frequency bands
    const lowBand = frequencyData.slice(0, Math.floor(frequencyData.length * 0.3));
    const midBand = frequencyData.slice(Math.floor(frequencyData.length * 0.3), Math.floor(frequencyData.length * 0.7));
    const highBand = frequencyData.slice(Math.floor(frequencyData.length * 0.7));
    
    const lowEnergy = lowBand.reduce((sum, val) => sum + val, 0) / lowBand.length;
    const midEnergy = midBand.reduce((sum, val) => sum + val, 0) / midBand.length;
    const highEnergy = highBand.reduce((sum, val) => sum + val, 0) / highBand.length;
    
    const maxEnergy = Math.max(lowEnergy, midEnergy, highEnergy);
    const minEnergy = Math.min(lowEnergy, midEnergy, highEnergy);
    
    return maxEnergy > 0 ? (maxEnergy - minEnergy) / maxEnergy : 0;
  }

  // Additional sophisticated analysis methods
  private calculateEmotionalVariety(metrics: any[]): number {
    const emotions = ['enthusiasm', 'confidence', 'engagement'];
    let totalVariety = 0;
    
    emotions.forEach(emotion => {
      const values = metrics.map(m => m.emotional?.[emotion] || 0.5);
      totalVariety += this.calculateVariationCoefficient(values);
    });
    
    return Math.min(1, totalVariety / emotions.length);
  }

  private calculateEmotionalAppropriateness(metrics: any[]): number {
    // Analyze if emotional expression is appropriate for interview context
    const avgConfidence = metrics.reduce((sum, m) => sum + (m.emotional?.confidence || 0.5), 0) / metrics.length;
    const avgEnthusiasm = metrics.reduce((sum, m) => sum + (m.emotional?.enthusiasm || 0.5), 0) / metrics.length;
    const avgNervousness = metrics.reduce((sum, m) => sum + (m.emotional?.nervousness || 0.3), 0) / metrics.length;
    
    // For interviews: moderate-high confidence, moderate enthusiasm, low nervousness
    const confidenceScore = avgConfidence > 0.6 ? 1 : avgConfidence / 0.6;
    const enthusiasmScore = avgEnthusiasm > 0.4 && avgEnthusiasm < 0.8 ? 1 : 1 - Math.abs(avgEnthusiasm - 0.6) * 2;
    const nervousnessScore = avgNervousness < 0.4 ? 1 : 1 - (avgNervousness - 0.4) * 2;
    
    return (confidenceScore + enthusiasmScore + nervousnessScore) / 3;
  }

  private analyzeEmphasisPatterns(): number {
    // Analyze strategic use of vocal emphasis
    if (this.analysisHistory.length < 20) return 0.6;
    
    const recentVolumes = this.analysisHistory.slice(-20).map(m => this.extractVolumeFromHistory(m));
    const emphasisPoints = this.findEmphasisPoints(recentVolumes);
    
    // Good emphasis has 2-4 emphasis points per 20 samples (2 seconds)
    const optimalEmphasis = emphasisPoints.length >= 2 && emphasisPoints.length <= 4;
    return optimalEmphasis ? 0.9 : 0.5;
  }

  private analyzeStrategicPauses(): number {
    if (this.analysisHistory.length < 30) return 0.6;
    
    const recentVolumes = this.analysisHistory.slice(-30).map(m => this.extractVolumeFromHistory(m));
    const pauses = this.identifyPauses(recentVolumes);
    
    // Strategic pauses are 3-8 frames long (300-800ms)
    const strategicPauses = pauses.filter(pause => pause.length >= 3 && pause.length <= 8);
    const pauseRatio = pauses.length > 0 ? strategicPauses.length / pauses.length : 0;
    
    return Math.min(1, pauseRatio);
  }

  private analyzeBuildupPatterns(): number {
    // Analyze crescendo/diminuendo patterns in speech
    if (this.analysisHistory.length < 15) return 0.6;
    
    const recentVolumes = this.analysisHistory.slice(-15).map(m => this.extractVolumeFromHistory(m));
    let buildupScore = 0;
    
    // Look for gradual volume increases followed by decreases
    for (let i = 5; i < recentVolumes.length - 5; i++) {
      const before = recentVolumes.slice(i - 5, i);
      const after = recentVolumes.slice(i, i + 5);
      
      const beforeTrend = this.calculateTrend(before);
      const afterTrend = this.calculateTrend(after);
      
      if (beforeTrend > 0.1 && afterTrend < -0.1) {
        buildupScore += 1;
      }
    }
    
    return Math.min(1, buildupScore / 5);
  }

  private calculateVoiceWarmth(): number {
    // Analyze vocal warmth characteristics
    if (this.analysisHistory.length < 10) return 0.6;
    
    const recent = this.analysisHistory.slice(-10);
    const avgLowFreq = recent.reduce((sum, m) => sum + (this.extractLowFreqFromHistory(m) || 0.5), 0) / recent.length;
    const pitchWarmth = recent.reduce((sum, m) => {
      const pitch = this.extractPitchFromHistory(m);
      // Warmer voices have moderate pitch (not too high or low)
      return sum + (pitch > 100 && pitch < 200 ? 1 : 0.5);
    }, 0) / recent.length;
    
    return (avgLowFreq + pitchWarmth) / 2;
  }

  private calculatePitchApproachability(): number {
    if (this.analysisHistory.length < 10) return 0.6;
    
    const recentPitches = this.analysisHistory.slice(-10).map(m => this.extractPitchFromHistory(m));
    const avgPitch = recentPitches.reduce((sum, p) => sum + p, 0) / recentPitches.length;
    
    // Approachable pitch range: 120-180 Hz for most people
    return avgPitch > 120 && avgPitch < 180 ? 1 : Math.max(0, 1 - Math.abs(avgPitch - 150) / 150);
  }

  private calculatePaceApproachability(): number {
    // Moderate pace is more approachable
    const currentPace = this.estimateCurrentPace();
    const optimalPace = 150; // WPM
    
    return Math.max(0, 1 - Math.abs(currentPace - optimalPace) / optimalPace);
  }

  private calculateTonalApproachability(): number {
    // Analyze tonal qualities that make speech approachable
    if (this.analysisHistory.length < 10) return 0.6;
    
    const recent = this.analysisHistory.slice(-10);
    const tonalVariety = this.calculateIntonationVariety(recent.map(m => this.extractPitchFromHistory(m)));
    const tonalWarmth = this.calculateVoiceWarmth();
    
    return (tonalVariety + tonalWarmth) / 2;
  }

  private analyzeNaturalPauses(): number {
    if (this.analysisHistory.length < 20) return 0.7;
    
    const recentVolumes = this.analysisHistory.slice(-20).map(m => this.extractVolumeFromHistory(m));
    const pauses = this.identifyPauses(recentVolumes);
    
    // Natural pauses occur at appropriate intervals and lengths
    const naturalPauses = pauses.filter(pause => 
      pause.length >= 2 && pause.length <= 10 // 200ms to 1s
    );
    
    return pauses.length > 0 ? naturalPauses.length / pauses.length : 0.7;
  }

  private calculateSpeechNaturalness(): number {
    // Analyze overall naturalness of speech patterns
    const rhythmNaturalness = this.calculateRhythmConsistency();
    const pitchNaturalness = this.calculatePitchNaturalness();
    const paceNaturalness = this.calculatePaceNaturalness();
    
    return (rhythmNaturalness + pitchNaturalness + paceNaturalness) / 3;
  }

  private calculateEmotionalAuthenticity(): number {
    // Analyze if emotional expression seems genuine
    if (this.analysisHistory.length < 15) return 0.7;
    
    const recent = this.analysisHistory.slice(-15);
    const emotionalConsistency = this.calculateEmotionalConsistency(recent);
    const emotionalGradualness = this.calculateEmotionalGradualness(recent);
    
    return (emotionalConsistency + emotionalGradualness) / 2;
  }

  // Additional helper methods
  private findEmphasisPoints(volumes: number[]): number[] {
    const threshold = Math.max(...volumes) * 0.8;
    return volumes.map((vol, index) => vol > threshold ? index : -1).filter(index => index !== -1);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    let trend = 0;
    for (let i = 1; i < values.length; i++) {
      trend += values[i] - values[i - 1];
    }
    
    return trend / (values.length - 1);
  }

  private extractLowFreqFromHistory(metrics: any): number {
    return metrics.lowFreqEnergy || 0.5;
  }

  private estimateSpeechRate(volume: number): number {
    // Estimate speech rate based on volume and recent history
    if (this.analysisHistory.length < 10) return 150; // Default WPM

    const recentVolumes = this.analysisHistory.slice(-10).map(m => this.extractVolumeFromHistory(m));
    const activeSpeechFrames = recentVolumes.filter(vol => vol > 0.15).length;

    // Estimate WPM based on speech activity density
    // Typical: 1 word per ~0.4 seconds, each frame is 0.1s
    const estimatedWords = activeSpeechFrames * 0.1 / 0.4;
    const timeSpan = 1; // 1 second window
    return Math.min(200, Math.max(80, (estimatedWords / timeSpan) * 60));
  }

  private calculateFluency(zeroCrossingRate: number, volume: number): number {
    // Fluency based on smoothness of speech and zero-crossing rate
    // Higher zero-crossing rate indicates smoother transitions
    const smoothness = Math.min(1, zeroCrossingRate / 0.5);

    // Speech activity indicates confidence in speaking
    const activity = Math.min(1, volume / 0.5);

    // Combine factors
    return (smoothness * 0.6 + activity * 0.4);
  }

  private estimateCurrentPace(): number {
    // Estimate words per minute based on speech activity
    if (this.analysisHistory.length < 20) return 150;
    
    const recentVolumes = this.analysisHistory.slice(-20).map(m => this.extractVolumeFromHistory(m));
    const speechFrames = recentVolumes.filter(vol => vol > 0.1).length;
    const timeSpan = 2; // 2 seconds of data
    
    // Rough estimation: 1 word per 0.4 seconds of active speech
    const estimatedWords = speechFrames * 0.1 / 0.4; // 0.1s per frame
    return (estimatedWords / timeSpan) * 60;
  }

  private calculatePitchNaturalness(): number {
    if (this.analysisHistory.length < 10) return 0.7;
    
    const recentPitches = this.analysisHistory.slice(-10).map(m => this.extractPitchFromHistory(m));
    const pitchRange = Math.max(...recentPitches) - Math.min(...recentPitches);
    
    // Natural pitch range for conversation: 50-150 Hz
    return pitchRange > 50 && pitchRange < 150 ? 1 : Math.max(0, 1 - Math.abs(pitchRange - 100) / 100);
  }

  private calculatePaceNaturalness(): number {
    const currentPace = this.estimateCurrentPace();
    // Natural conversational pace: 140-180 WPM
    return currentPace > 140 && currentPace < 180 ? 1 : Math.max(0, 1 - Math.abs(currentPace - 160) / 160);
  }

  private calculateEmotionalConsistency(metrics: any[]): number {
    const emotions = ['confidence', 'enthusiasm', 'engagement'];
    let consistencyScore = 0;
    
    emotions.forEach(emotion => {
      const values = metrics.map(m => m.emotional?.[emotion] || 0.5);
      const variation = this.calculateVariationCoefficient(values);
      consistencyScore += Math.max(0, 1 - variation * 2); // Penalize high variation
    });
    
    return consistencyScore / emotions.length;
  }

  private calculateEmotionalGradualness(metrics: any[]): number {
    // Emotions should change gradually, not abruptly
    const emotions = ['confidence', 'enthusiasm', 'nervousness'];
    let gradualScore = 0;
    
    emotions.forEach(emotion => {
      const values = metrics.map(m => m.emotional?.[emotion] || 0.5);
      let abruptChanges = 0;
      
      for (let i = 1; i < values.length; i++) {
        if (Math.abs(values[i] - values[i - 1]) > 0.3) {
          abruptChanges++;
        }
      }
      
      gradualScore += Math.max(0, 1 - abruptChanges / values.length);
    });
    
    return gradualScore / emotions.length;
  }

  // Public API methods
  onRealtimeUpdate(callback: (metrics: AdvancedVoiceMetrics) => void): void {
    this.realtimeCallbacks.push(callback);
  }

  removeRealtimeCallback(callback: (metrics: AdvancedVoiceMetrics) => void): void {
    this.realtimeCallbacks = this.realtimeCallbacks.filter(cb => cb !== callback);
  }

  getAnalysisHistory(): AdvancedVoiceMetrics[] {
    return [...this.analysisHistory];
  }

  getAverageMetrics(): AdvancedVoiceMetrics | null {
    if (this.analysisHistory.length === 0) return null;
    
    // Calculate averages across all metrics
    const count = this.analysisHistory.length;
    const averaged = this.analysisHistory.reduce((acc, metrics) => {
      // Combine all metrics
      return {
        speechRate: acc.speechRate + metrics.speechRate,
        fluency: acc.fluency + metrics.fluency,
        voiceConfidence: acc.voiceConfidence + metrics.voiceConfidence,
        delivery: acc.delivery + metrics.delivery,
        clarity: acc.clarity + metrics.clarity,
        fillerWordCount: acc.fillerWordCount + metrics.fillerWordCount,
        // Add advanced metrics
        prosody: {
          intonationVariety: acc.prosody.intonationVariety + (metrics as any).prosody.intonationVariety,
          stressPatterns: acc.prosody.stressPatterns + (metrics as any).prosody.stressPatterns,
          rhythmConsistency: acc.prosody.rhythmConsistency + (metrics as any).prosody.rhythmConsistency,
          melodicRange: acc.prosody.melodicRange + (metrics as any).prosody.melodicRange,
        },
        emotional: {
          enthusiasm: acc.emotional.enthusiasm + (metrics as any).emotional.enthusiasm,
          nervousness: acc.emotional.nervousness + (metrics as any).emotional.nervousness,
          confidence: acc.emotional.confidence + (metrics as any).emotional.confidence,
          engagement: acc.emotional.engagement + (metrics as any).emotional.engagement,
          stress: acc.emotional.stress + (metrics as any).emotional.stress,
        },
        communication: {
          articulation: acc.communication.articulation + (metrics as any).communication.articulation,
          projection: acc.communication.projection + (metrics as any).communication.projection,
          paceVariation: acc.communication.paceVariation + (metrics as any).communication.paceVariation,
          pauseEffectiveness: acc.communication.pauseEffectiveness + (metrics as any).communication.pauseEffectiveness,
          emphasis: acc.communication.emphasis + (metrics as any).communication.emphasis,
        },
        professional: {
          authorityLevel: acc.professional.authorityLevel + (metrics as any).professional.authorityLevel,
          credibility: acc.professional.credibility + (metrics as any).professional.credibility,
          persuasiveness: acc.professional.persuasiveness + (metrics as any).professional.persuasiveness,
          likeability: acc.professional.likeability + (metrics as any).professional.likeability,
        }
      };
    }, {
      speechRate: 0, fluency: 0, voiceConfidence: 0, delivery: 0, clarity: 0, fillerWordCount: 0,
      prosody: { intonationVariety: 0, stressPatterns: 0, rhythmConsistency: 0, melodicRange: 0 },
      emotional: { enthusiasm: 0, nervousness: 0, confidence: 0, engagement: 0, stress: 0 },
      communication: { articulation: 0, projection: 0, paceVariation: 0, pauseEffectiveness: 0, emphasis: 0 },
      professional: { authorityLevel: 0, credibility: 0, persuasiveness: 0, likeability: 0 }
    });

    // Divide by count to get averages
    return {
      speechRate: averaged.speechRate / count,
      fluency: averaged.fluency / count,
      fluencyScore: (averaged.fluency / count) * 100,
      voiceConfidence: averaged.voiceConfidence / count,
      delivery: averaged.delivery / count,
      deliveryScore: (averaged.delivery / count) * 100,
      clarity: averaged.clarity / count,
      clarityScore: (averaged.clarity / count) * 100,
      fillerWordCount: averaged.fillerWordCount / count,
      timestamp: Date.now(),
      duration: count * 0.1, // Total duration
      
      prosody: {
        intonationVariety: averaged.prosody.intonationVariety / count,
        stressPatterns: averaged.prosody.stressPatterns / count,
        rhythmConsistency: averaged.prosody.rhythmConsistency / count,
        melodicRange: averaged.prosody.melodicRange / count,
      },
      emotional: {
        enthusiasm: averaged.emotional.enthusiasm / count,
        nervousness: averaged.emotional.nervousness / count,
        confidence: averaged.emotional.confidence / count,
        engagement: averaged.emotional.engagement / count,
        stress: averaged.emotional.stress / count,
      },
      communication: {
        articulation: averaged.communication.articulation / count,
        projection: averaged.communication.projection / count,
        paceVariation: averaged.communication.paceVariation / count,
        pauseEffectiveness: averaged.communication.pauseEffectiveness / count,
        emphasis: averaged.communication.emphasis / count,
      },
      professional: {
        authorityLevel: averaged.professional.authorityLevel / count,
        credibility: averaged.professional.credibility / count,
        persuasiveness: averaged.professional.persuasiveness / count,
        likeability: averaged.professional.likeability / count,
      },
      realtime: this.generateRealtimeFeedback()
    };
  }

  clearAnalysisHistory(): void {
    this.analysisHistory = [];
  }
}

// Export singleton instance
export const advancedVoiceAnalyzer = new AdvancedVoiceAnalyzer();