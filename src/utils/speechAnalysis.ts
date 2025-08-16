// Advanced Speech Analysis Utilities for College Interview Voice Metrics
// Focused on high-quality voice metrics for college interview feedback

import { analyzeVerbalResponse } from './verbalFeedback';
import Sentiment from 'sentiment';
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
  vocalEnergy?: number; // 0-100 scaled average energy
  sentimentPaceBalance?: number; // 0-100 balance of sentiment and pace
  timestamp: number;         // When this analysis was taken
  duration: number;          // Duration of the analyzed segment
  sentimentScore: number; // Normalized sentiment score from -1 (negative) to 1 (positive)
}

export interface VoiceTimelinePoint {
  timestamp: number;
  metrics: VoiceMetrics;
  feedback: ActionableFeedback;
  questionContext?: string;
}

export interface ActionableFeedback {
  overall: string;
  strengths: string[];
  improvements: string[];
  specificTips: string[];
  score: number;
  category: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  confidenceTips?: string[];
}

export interface AudioAnalysisResult {
  pitch: number[];
  energy: number[];
  spectralCentroid: number[];
  spectralRolloff: number[];
  mfcc: number[][];
  zcr: number[];
  rms: number[];
  // New for steadiness and prosody details
  jitter?: number;   // pitch period variability
  shimmer?: number;  // amplitude variability
  silenceSegments?: Array<{ start: number; end: number; duration: number }>;
}

export class AdvancedSpeechAnalyzer {
  private audioContext: AudioContext;
  private voiceTimeline: VoiceTimelinePoint[] = [];

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Enhanced method for real-time voice analysis with actual audio
  async analyzeRealtimeAudio(
    audioBuffer: ArrayBuffer,
    transcription: string,
    timestamp: number,
    questionContext?: string
  ): Promise<VoiceTimelinePoint> {
    try {
      // Decode audio buffer
      const audioContextForAnalysis = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioData = await audioContextForAnalysis.decodeAudioData(audioBuffer.slice(0));
      const duration = audioData.duration;
      
      // Perform comprehensive audio analysis
      const metrics = await this.analyzeAudioBuffer(audioData, transcription, timestamp, duration);
      const feedback = this.generateActionableFeedback(metrics, transcription, questionContext);
      
      const timelinePoint: VoiceTimelinePoint = {
        timestamp,
        metrics,
        feedback,
        questionContext
      };
      
      this.voiceTimeline.push(timelinePoint);
      return timelinePoint;
    } catch (error) {
      console.error('Error analyzing realtime audio:', error);
      // Fallback to transcription-only analysis
      return this.analyzeVoiceSegment(new Blob(), transcription, 0, timestamp, questionContext);
    }
  }

  // Enhanced audio buffer analysis
  private async analyzeAudioBuffer(
    audioBuffer: AudioBuffer,
    transcription: string,
    timestamp: number,
    duration: number
  ): Promise<VoiceMetrics> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Advanced audio feature extraction
    const audioFeatures = this.extractAdvancedAudioFeatures(channelData, sampleRate);
    const speechPatterns = this.analyzeSpeechPatterns(transcription, duration);
    
    // Calculate comprehensive metrics
    const speechRate = speechPatterns.speechRate;
    const fillerWordCount = speechPatterns.fillerWordCount;
    
    // Enhanced fluency calculation with audio features
    const fluencyScore = this.calculateEnhancedFluencyScore(
      speechPatterns,
      audioFeatures,
      fillerWordCount
    );
    
    // Enhanced voice confidence with pitch and energy analysis
    const voiceConfidence = this.calculateEnhancedVoiceConfidence(
      audioFeatures,
      speechRate,
      speechPatterns.hesitations
    );
    
    // Enhanced delivery score with timing analysis
    const deliveryScore = this.calculateEnhancedDeliveryScore(
      speechRate,
      audioFeatures,
      speechPatterns.pauseAnalysis
    );
    
    // Enhanced clarity score with spectral analysis
    const clarityScore = this.calculateEnhancedClarityScore(
      audioFeatures,
      fillerWordCount,
      speechPatterns.wordCount
    );
    
    // Advanced pitch analysis
    const pitchAnalysis = this.analyzeAdvancedPitch(audioFeatures.pitch, sampleRate);
    
    // Advanced energy analysis
    const energyAnalysis = this.analyzeAdvancedEnergy(audioFeatures.energy);
const sentimentAnalyzer = new Sentiment();
const sentimentResult = sentimentAnalyzer.analyze(transcription);
const sentimentScore = Math.max(-1, Math.min(1, sentimentResult.comparative));

return {
  speechRate,
  fluencyScore,
  voiceConfidence,
  deliveryScore,
  clarityScore,
  fillerWordCount,
  pauseAnalysis: speechPatterns.pauseAnalysis,
  pitchAnalysis,
  energyAnalysis,
  timestamp,
  duration,
  sentimentScore
};
  }

  // Extract advanced audio features from real audio data
  private extractAdvancedAudioFeatures(channelData: Float32Array, sampleRate: number) {
    const frameSize = 1024;
    const hopSize = 512;
    const features = {
      pitch: [] as number[],
      energy: [] as number[],
      spectralCentroid: [] as number[],
      spectralRolloff: [] as number[],
      mfcc: [] as number[][],
      zcr: [] as number[],
      rms: [] as number[],
      spectralFlux: [] as number[],
      fundamentalFrequency: [] as number[]
    };
    
    // Process audio in overlapping frames
    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      
      // Extract features for this frame
      const energy = this.calculateFrameEnergy(frame);
      const spectralCentroid = this.calculateSpectralCentroid(frame, sampleRate);
      const spectralRolloff = this.calculateSpectralRolloff(frame, sampleRate);
      const mfcc = this.calculateMFCC(frame);
      const zcr = this.calculateZCR(frame);
      const rms = this.calculateRMS(frame);
      const pitch = this.calculatePitchYIN(frame, sampleRate); // More accurate pitch detection
      const fundamentalFreq = this.calculateFundamentalFrequency(frame, sampleRate);
      
      features.energy.push(energy);
      features.spectralCentroid.push(spectralCentroid);
      features.spectralRolloff.push(spectralRolloff);
      features.mfcc.push(mfcc);
      features.zcr.push(zcr);
      features.rms.push(rms);
      features.pitch.push(pitch);
      features.fundamentalFrequency.push(fundamentalFreq);
      
      // Calculate spectral flux (measure of spectral change)
      if (i > 0) {
        const prevFrame = channelData.slice(i - hopSize, i - hopSize + frameSize);
        const spectralFlux = this.calculateSpectralFlux(prevFrame, frame);
        features.spectralFlux.push(spectralFlux);
      }
    }
    
    // Compute jitter and shimmer over voiced frames
    const voicedPitches = features.pitch.filter(p => p > 50);
    let jitter = 0;
    if (voicedPitches.length > 2) {
      const periods = [] as number[];
      for (let i = 1; i < voicedPitches.length; i++) {
        periods.push(1 / voicedPitches[i]);
      }
      let num = 0; let den = 0;
      for (let i = 1; i < periods.length; i++) {
        num += Math.abs(periods[i] - periods[i - 1]);
        den += periods[i];
      }
      jitter = den > 0 ? (num / (periods.length - 1)) / (den / periods.length) : 0;
    }
    // Shimmer via RMS variability
    let shimmer = 0;
    if (features.rms.length > 2) {
      let num = 0; let den = 0;
      for (let i = 1; i < features.rms.length; i++) {
        num += Math.abs(features.rms[i] - features.rms[i - 1]);
        den += features.rms[i];
      }
      shimmer = den > 0 ? (num / (features.rms.length - 1)) / (den / features.rms.length) : 0;
    }
    // Silence segmentation based on energy threshold
    const silences: Array<{ start: number; end: number; duration: number }> = [];
    const frameDur = (1024 /* frameSize */) / sampleRate;
    const thresh = Math.max(0.02, this.calculateAverage(features.rms) * 0.3);
    let inSilence = false; let start = 0;
    for (let i = 0; i < features.rms.length; i++) {
      const isSilent = features.rms[i] < thresh;
      if (!inSilence && isSilent) { inSilence = true; start = i * frameDur; }
      else if (inSilence && !isSilent) {
        const end = i * frameDur; const dur = end - start; if (dur > 0.15) silences.push({ start, end, duration: dur });
        inSilence = false;
      }
    }
    if (inSilence) {
      const end = features.rms.length * frameDur; const dur = end - start; if (dur > 0.15) silences.push({ start, end, duration: dur });
    }

    (features as any).jitter = jitter;
    (features as any).shimmer = shimmer;
    (features as any).silenceSegments = silences;

    return features;
  }

  // YIN algorithm for more accurate pitch detection
  private calculatePitchYIN(frame: Float32Array, sampleRate: number): number {
    const yinBuffer = new Float32Array(frame.length / 2);
    const threshold = 0.15;
    
    // Calculate difference function
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      let sum = 0;
      for (let i = 0; i < yinBuffer.length; i++) {
        const delta = frame[i] - frame[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }
    
    // Calculate cumulative mean normalized difference
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] *= tau / runningSum;
    }
    
    // Find the first minimum below threshold
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      if (yinBuffer[tau] < threshold) {
        // Parabolic interpolation for better accuracy
        let betterTau = tau;
        if (tau > 0 && tau < yinBuffer.length - 1) {
          const x0 = yinBuffer[tau - 1];
          const x1 = yinBuffer[tau];
          const x2 = yinBuffer[tau + 1];
          betterTau = tau + (x2 - x0) / (2 * (2 * x1 - x2 - x0));
        }
        return sampleRate / betterTau;
      }
    }
    
    return 0; // No pitch detected
  }

  // Calculate fundamental frequency using harmonic analysis
  private calculateFundamentalFrequency(frame: Float32Array, sampleRate: number): number {
    const fft = this.calculateFFT(frame);
    const spectrum = new Float32Array(fft.length / 2);
    
    // Calculate magnitude spectrum
    for (let i = 0; i < spectrum.length; i++) {
      const real = fft[i * 2];
      const imag = fft[i * 2 + 1];
      spectrum[i] = Math.sqrt(real * real + imag * imag);
    }
    
    // Find peaks in the spectrum
    const peaks = this.findSpectralPeaks(spectrum);
    
    // Identify fundamental frequency as the lowest significant peak
    const frequencyResolution = sampleRate / frame.length;
    let fundamentalFreq = 0;
    let maxMagnitude = 0;
    
    for (const peak of peaks) {
      const frequency = peak * frequencyResolution;
      if (frequency >= 80 && frequency <= 400 && spectrum[peak] > maxMagnitude) {
        fundamentalFreq = frequency;
        maxMagnitude = spectrum[peak];
      }
    }
    
    return fundamentalFreq;
  }

  // Find peaks in spectral data
  private findSpectralPeaks(spectrum: Float32Array): number[] {
    const peaks: number[] = [];
    const threshold = Math.max(...spectrum) * 0.1; // 10% of max magnitude
    
    for (let i = 1; i < spectrum.length - 1; i++) {
      if (spectrum[i] > spectrum[i - 1] && 
          spectrum[i] > spectrum[i + 1] && 
          spectrum[i] > threshold) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  // Calculate spectral flux (measure of spectral change)
  private calculateSpectralFlux(prevFrame: Float32Array, currentFrame: Float32Array): number {
    const fft1 = this.calculateFFT(prevFrame);
    const fft2 = this.calculateFFT(currentFrame);
    
    let flux = 0;
    for (let i = 0; i < Math.min(fft1.length, fft2.length); i += 2) {
      const mag1 = Math.sqrt(fft1[i] * fft1[i] + fft1[i + 1] * fft1[i + 1]);
      const mag2 = Math.sqrt(fft2[i] * fft2[i] + fft2[i + 1] * fft2[i + 1]);
      const diff = mag2 - mag1;
      flux += diff > 0 ? diff : 0; // Only positive changes
    }
    
    return flux;
  }

  // Enhanced fluency calculation with audio features
  private calculateEnhancedFluencyScore(
    speechPatterns: any,
    audioFeatures: any,
    fillerWordCount: number
  ): number {
    const baseScore = this.calculateFluencyScore(
      speechPatterns.wordCount,
      fillerWordCount,
      speechPatterns.repetitions,
      speechPatterns.hesitations,
      speechPatterns.speechRate
    );
    
    // Audio-based adjustments
    const energyConsistency = this.calculateStandardDeviation(audioFeatures.energy);
    const energyBonus = energyConsistency < 0.3 ? 10 : energyConsistency < 0.5 ? 5 : 0;
    
    // Spectral flux consistency (smooth transitions)
    const fluxConsistency = this.calculateStandardDeviation(audioFeatures.spectralFlux || []);
    const fluxBonus = fluxConsistency < 0.2 ? 5 : 0;
    
    return Math.min(100, baseScore + energyBonus + fluxBonus);
  }

  // Enhanced voice confidence with advanced audio analysis
  private calculateEnhancedVoiceConfidence(
    audioFeatures: any,
    speechRate: number,
    hesitations: number
  ): number {
    const baseScore = this.calculateVoiceConfidence(audioFeatures, speechRate, hesitations);
    
    // Pitch stability indicates confidence
    const pitchStability = 100 - (this.calculateStandardDeviation(audioFeatures.pitch) * 2);
    const pitchBonus = pitchStability > 80 ? 10 : pitchStability > 60 ? 5 : 0;
    
    // Consistent fundamental frequency indicates steady voice
    const fundamentalConsistency = 100 - (this.calculateStandardDeviation(audioFeatures.fundamentalFrequency) * 3);
    const fundamentalBonus = fundamentalConsistency > 85 ? 5 : 0;
    
    // Strong energy levels indicate confidence
    const avgEnergy = this.calculateAverage(audioFeatures.energy);
    const energyBonus = avgEnergy > 0.3 ? 10 : avgEnergy > 0.2 ? 5 : 0;
    
    return Math.min(100, baseScore + pitchBonus + fundamentalBonus + energyBonus);
  }

  // Enhanced delivery score with timing analysis
  private calculateEnhancedDeliveryScore(
    speechRate: number,
    audioFeatures: any,
    pauseAnalysis: any
  ): number {
    const baseScore = this.calculateDeliveryScore(speechRate, audioFeatures.energy, pauseAnalysis);
    
    // Analyze rhythm and pacing through energy patterns
    const energyPeaks = this.findEnergyPeaks(audioFeatures.energy);
    const rhythmScore = this.analyzeRhythm(energyPeaks);
    const rhythmBonus = rhythmScore > 0.7 ? 10 : rhythmScore > 0.5 ? 5 : 0;
    
    // Spectral centroid consistency indicates good articulation
    const centroidConsistency = 100 - (this.calculateStandardDeviation(audioFeatures.spectralCentroid) / 100);
    const articulationBonus = centroidConsistency > 80 ? 5 : 0;
    
    return Math.min(100, baseScore + rhythmBonus + articulationBonus);
  }

  // Enhanced clarity score with spectral analysis
  private calculateEnhancedClarityScore(
    audioFeatures: any,
    fillerWordCount: number,
    wordCount: number
  ): number {
    const baseScore = this.calculateClarityScore(
      audioFeatures.spectralCentroid,
      audioFeatures.zcr,
      fillerWordCount,
      wordCount
    );
    
    // High-frequency content indicates clear articulation
    const avgSpectralRolloff = this.calculateAverage(audioFeatures.spectralRolloff);
    const clarityBonus = avgSpectralRolloff > 4000 ? 10 : avgSpectralRolloff > 3000 ? 5 : 0;
    
    // Consistent MFCC features indicate clear speech
    const mfccConsistency = this.analyzeMFCCConsistency(audioFeatures.mfcc);
    const mfccBonus = mfccConsistency > 0.8 ? 5 : 0;
    
    return Math.min(100, baseScore + clarityBonus + mfccBonus);
  }

  // Analyze rhythm patterns in speech
  private analyzeRhythm(energyPeaks: number[]): number {
    if (energyPeaks.length < 3) return 0;
    
    const intervals = [];
    for (let i = 1; i < energyPeaks.length; i++) {
      intervals.push(energyPeaks[i] - energyPeaks[i - 1]);
    }
    
    const avgInterval = this.calculateAverage(intervals);
    const intervalVariance = this.calculateVariance(intervals);
    
    // Good rhythm has consistent intervals
    return Math.max(0, 1 - (intervalVariance / (avgInterval * avgInterval)));
  }

  // Find energy peaks for rhythm analysis
  private findEnergyPeaks(energy: number[]): number[] {
    const peaks: number[] = [];
    const threshold = this.calculateAverage(energy) * 1.2;
    
    for (let i = 1; i < energy.length - 1; i++) {
      if (energy[i] > energy[i - 1] && 
          energy[i] > energy[i + 1] && 
          energy[i] > threshold) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  // Analyze MFCC consistency for speech clarity
  private analyzeMFCCConsistency(mfccFrames: number[][]): number {
    if (mfccFrames.length < 2) return 0;
    
    let totalConsistency = 0;
    const numCoefficients = mfccFrames[0].length;
    
    for (let coeff = 0; coeff < numCoefficients; coeff++) {
      const coeffValues = mfccFrames.map(frame => frame[coeff]);
      const variance = this.calculateVariance(coeffValues);
      const mean = this.calculateAverage(coeffValues);
      const consistency = Math.max(0, 1 - (variance / (mean * mean + 1)));
      totalConsistency += consistency;
    }
    
    return totalConsistency / numCoefficients;
  }

  // Get the complete voice timeline for the interview
  getVoiceTimeline(): VoiceTimelinePoint[] {
    return [...this.voiceTimeline];
  }

  // Reset timeline for new interview
  resetTimeline(): void {
    this.voiceTimeline = [];
  }

  // Generate comprehensive feedback based on voice metrics
  private generateActionableFeedback(
    metrics: VoiceMetrics, 
    transcription: string,
    questionContext?: string
  ): ActionableFeedback {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const specificTips: string[] = [];
    
    // Analyze speech rate
    if (metrics.speechRate >= 140 && metrics.speechRate <= 180) {
      strengths.push("Perfect speaking pace - clear and engaging");
    } else if (metrics.speechRate < 120) {
      improvements.push("Speaking pace is too slow");
      specificTips.push("Try to speak a bit faster to maintain interviewer engagement");
    } else if (metrics.speechRate > 200) {
      improvements.push("Speaking too quickly");
      specificTips.push("Slow down and take deliberate pauses between key points");
    }

    // Analyze fluency
    if (metrics.fluencyScore >= 80) {
      strengths.push("Excellent fluency and smooth delivery");
    } else if (metrics.fluencyScore >= 60) {
      improvements.push("Some hesitation in speech flow");
      specificTips.push("Practice your key points beforehand to reduce hesitation");
    } else {
      improvements.push("Significant disfluency affecting clarity");
      specificTips.push("Take a breath before answering and organize your thoughts");
    }

    // Analyze voice confidence
    if (metrics.voiceConfidence >= 75) {
      strengths.push("Strong, confident vocal presence");
    } else if (metrics.voiceConfidence >= 50) {
      improvements.push("Voice could project more confidence");
      specificTips.push("Speak from your diaphragm and maintain steady volume");
    } else {
      improvements.push("Voice lacks confidence and authority");
      specificTips.push("Practice power poses before speaking and focus on breathing deeply");
    }

    // Analyze filler words
    const fillerRatio = metrics.fillerWordCount / (transcription.split(' ').length || 1);
    if (fillerRatio < 0.02) {
      strengths.push("Minimal use of filler words - very professional");
    } else if (fillerRatio < 0.05) {
      improvements.push("Some filler words present");
      specificTips.push("Replace 'um' and 'uh' with brief pauses for better impact");
    } else {
      improvements.push("Too many filler words disrupting message clarity");
      specificTips.push("Practice speaking more slowly to reduce filler word dependency");
    }

    // Analyze energy and pitch variation
    if (metrics.energyAnalysis.dynamicRange > 0.3 && metrics.pitchAnalysis.pitchVariation > 0.2) {
      strengths.push("Great vocal variety and engaging delivery");
    } else if (metrics.energyAnalysis.dynamicRange < 0.15) {
      improvements.push("Voice lacks energy and enthusiasm");
      specificTips.push("Vary your tone and energy level to emphasize key points");
    }

    // Analyze pauses
    if (metrics.pauseAnalysis.strategicPauses > 2) {
      strengths.push("Good use of strategic pauses for emphasis");
    } else if (metrics.pauseAnalysis.averagePauseLength > 2.0) {
      improvements.push("Pauses are too long, affecting flow");
      specificTips.push("Keep pauses brief (1-2 seconds) to maintain momentum");
    }

    // Calculate overall score and category
    const overallScore = Math.round(
      (metrics.fluencyScore + metrics.voiceConfidence + metrics.deliveryScore + metrics.clarityScore) / 4
    );

    let category: ActionableFeedback['category'];
    let overall: string;

    if (overallScore >= 85) {
      category = 'excellent';
      overall = "Outstanding vocal performance! Your voice projects confidence and professionalism.";
    } else if (overallScore >= 70) {
      category = 'good';
      overall = "Good vocal performance with room for minor improvements.";
    } else if (overallScore >= 55) {
      category = 'fair';
      overall = "Fair vocal performance. Focus on the suggested improvements to strengthen your delivery.";
    } else {
      category = 'needs_improvement';
      overall = "Your vocal delivery needs significant improvement. Practice the specific tips to build confidence.";
    }

    // Add context-specific feedback
    if (questionContext) {
      if (questionContext.toLowerCase().includes('leadership')) {
        specificTips.push("For leadership questions, project authority through steady, measured speech");
      } else if (questionContext.toLowerCase().includes('technical')) {
        specificTips.push("For technical answers, speak clearly and pause after complex concepts");
      } else if (questionContext.toLowerCase().includes('behavioral')) {
        specificTips.push("Use vocal variety to make your stories more engaging and memorable");
      }
    }

    return {
      overall,
      strengths,
      improvements,
      specificTips,
      score: overallScore,
      category
    };
  }

  async analyzeVoiceMetrics(audioBlob: Blob, transcription: string, duration: number, timestamp: number): Promise<VoiceMetrics> {
    try {
      // If no audio data is available, analyze based on transcription only
      if (audioBlob.size === 0) {
        return this.analyzeFromTranscriptionOnly(transcription, duration, timestamp);
      }

      // Analyze audio features if audio is available
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
const sentimentAnalyzer = new Sentiment();
const sentimentResult = sentimentAnalyzer.analyze(transcription);
const sentimentScore = Math.max(-1, Math.min(1, sentimentResult.comparative));
      
      return {
        speechRate,
        fluencyScore,
        voiceConfidence,
        deliveryScore,
        clarityScore,
        fillerWordCount,
        pauseAnalysis: speechPatterns.pauseAnalysis,
        pitchAnalysis,
        energyAnalysis,
        timestamp,
        duration,
        sentimentScore
      };
    } catch (error) {
      console.error('Error analyzing voice metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  // Analyze voice metrics based on transcription only (fallback when no audio available)
  private analyzeFromTranscriptionOnly(transcription: string, duration: number, timestamp: number): VoiceMetrics {
    const words = transcription.split(' ').filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Calculate speech rate
    const speechRate = duration > 0 ? (wordCount / duration) * 60 : 0;
    
    // Analyze filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically'];
    const fillerWordCount = words.filter(word => 
      fillerWords.includes(word.toLowerCase().replace(/[.,!?]/g, ''))
    ).length;
    
    // Calculate metrics based on transcription analysis
    const fillerRatio = wordCount > 0 ? fillerWordCount / wordCount : 0;
    
    // Estimate fluency based on filler ratio and response length
    const fluencyScore = Math.max(0, Math.min(100, 
      100 - (fillerRatio * 50) + Math.min(wordCount / 20, 1) * 20
    ));
    
    // Estimate confidence based on word choice and length
    const confidenceWords = ['confident', 'certain', 'definitely', 'absolutely', 'strong', 'successful'];
    const uncertainWords = ['maybe', 'perhaps', 'possibly', 'might', 'unsure', 'probably'];
    
    const confidenceBoosts = words.filter(word => 
      confidenceWords.some(cw => word.toLowerCase().includes(cw))
    ).length;
    const uncertaintyPenalties = words.filter(word => 
      uncertainWords.some(uw => word.toLowerCase().includes(uw))
    ).length;
    
    const voiceConfidence = Math.max(0, Math.min(100,
      70 + (confidenceBoosts * 5) - (uncertaintyPenalties * 10) - (fillerRatio * 30)
    ));
    
    // Estimate delivery score
    const deliveryScore = Math.max(0, Math.min(100,
      (speechRate >= 120 && speechRate <= 180 ? 80 : 60) + 
      (wordCount > 10 ? 15 : 0) + 
      (fillerRatio < 0.05 ? 15 : 0) - 
      (fillerRatio * 40)
    ));
    
    // Estimate clarity based on sentence structure
    const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
    const clarityScore = Math.max(0, Math.min(100,
      80 + (avgSentenceLength > 5 && avgSentenceLength < 20 ? 15 : -10) - (fillerRatio * 30)
    ));
    
    const sentimentAnalyzer = new Sentiment();
const sentimentResult = sentimentAnalyzer.analyze(transcription);
const sentimentScore = Math.max(-1, Math.min(1, sentimentResult.comparative));
return {
      speechRate,
      fluencyScore,
      voiceConfidence,
      deliveryScore,
      clarityScore,
      fillerWordCount,
      pauseAnalysis: {
        averagePauseLength: 1.0, // Estimated
        pauseFrequency: Math.max(0, sentences.length - 1),
        strategicPauses: Math.floor(sentences.length / 2)
      },
      pitchAnalysis: {
        averagePitch: 150, // Default estimate
        pitchVariation: 0.3,
        pitchStability: 0.7
      },
      energyAnalysis: {
        averageEnergy: 0.6,
        energyConsistency: 0.8,
        dynamicRange: 0.4
      },
      timestamp,
      duration,
      sentimentScore
    };
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
    let speechRate: number;
    
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
    speechRate = Math.round((wordCount * 60 / safeDuration) * 10) / 10;
speechRate = Math.max(80, Math.min(220, speechRate));

console.log('Initial speech rate:', speechRate);

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
    
    const totalPauseDuration = pauseAnalysis.averagePauseLength * pauseAnalysis.pauseFrequency;
const effectiveDuration = Math.max(safeDuration - totalPauseDuration, wordCount / 4);
speechRate = (wordCount * 60) / effectiveDuration;
speechRate = Math.round(speechRate * 10) / 10;
speechRate = Math.max(80, Math.min(220, speechRate));
console.log('Adjusted speech rate with pauses:', speechRate);

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
      },
      timestamp: Date.now(),
      duration: 0,
      sentimentScore: 0
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

  // Main method for real-time voice analysis (fallback for when no audio buffer is available)
  async analyzeVoiceSegment(
    audioBlob: Blob, 
    transcription: string, 
    duration: number, 
    timestamp: number,
    questionContext?: string
  ): Promise<VoiceTimelinePoint> {
    const metrics = await this.analyzeVoiceMetrics(audioBlob, transcription, duration, timestamp);
    const feedback = this.generateActionableFeedback(metrics, transcription, questionContext);
    
    const timelinePoint: VoiceTimelinePoint = {
      timestamp,
      metrics,
      feedback,
      questionContext
    };
    
    this.voiceTimeline.push(timelinePoint);
    return timelinePoint;
  }

  // Advanced pitch analysis
  private analyzeAdvancedPitch(pitchArray: number[], sampleRate: number) {
    const validPitches = pitchArray.filter(p => p > 0 && p < sampleRate / 2);
    
    if (validPitches.length === 0) {
      return {
        averagePitch: 0,
        pitchVariation: 0,
        pitchStability: 0
      };
    }
    
    const averagePitch = this.calculateAverage(validPitches);
    const pitchStdDev = this.calculateStandardDeviation(validPitches);
    const pitchVariation = pitchStdDev / averagePitch;
    const pitchStability = Math.max(0, 100 - (pitchVariation * 100));
    
    return {
      averagePitch,
      pitchVariation,
      pitchStability
    };
  }

  // Advanced energy analysis
  private analyzeAdvancedEnergy(energyArray: number[]) {
    if (energyArray.length === 0) {
      return {
        averageEnergy: 0,
        energyConsistency: 0,
        dynamicRange: 0
      };
    }
    
    const averageEnergy = this.calculateAverage(energyArray);
    const energyStdDev = this.calculateStandardDeviation(energyArray);
    const energyConsistency = Math.max(0, 100 - (energyStdDev / averageEnergy * 100));
    const dynamicRange = Math.max(...energyArray) - Math.min(...energyArray);
    
    return {
      averageEnergy,
      energyConsistency,
      dynamicRange
    };
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

// Exported feedback generator for use with enhanced metrics
export function generateActionableFeedback(
  metrics: VoiceMetrics,
  transcription: string,
  questionContext?: string
): ActionableFeedback {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const specificTips: string[] = [];
  const confidenceTips: string[] = [];

  // --- Speech Rate ---
  let speechRateMsg = '';
  if (metrics.speechRate >= 140 && metrics.speechRate <= 180) {
    strengths.push("Perfect speaking pace - ideal rhythm for interviews.");
    speechRateMsg = "Your pace is excellent. Keep maintaining this rhythm for clear communication.";
  } else if (metrics.speechRate < 120) {
    improvements.push("Your speaking pace is a bit slow.");
    specificTips.push("Try to speak a bit faster to maintain interviewer engagement.");
    speechRateMsg = "Try to increase your pace slightly to sound more engaged and confident.";
  } else if (metrics.speechRate > 200) {
    improvements.push("You're speaking a bit too quickly.");
    specificTips.push("Slow down and take deliberate pauses between key points.");
    speechRateMsg = "Try to slow down a little to ensure your message is clear and easy to follow.";
  } else {
    speechRateMsg = "Your pace is generally good, but monitor for consistency throughout the interview.";
  }

  // --- Fluency ---
  let fluencyMsg = '';
  if (metrics.fluencyScore >= 80) {
    strengths.push("Excellent fluency and smooth delivery.");
    fluencyMsg = "Your speech flows smoothly, which helps keep the listener engaged.";
  } else if (metrics.fluencyScore >= 60) {
    improvements.push("Some hesitation in your speech flow.");
    specificTips.push("Practice your key points beforehand to reduce hesitation.");
    fluencyMsg = "Work on reducing minor hesitations for an even smoother delivery.";
  } else {
    improvements.push("Significant disfluency affecting clarity.");
    specificTips.push("Take a breath before answering and organize your thoughts.");
    fluencyMsg = "Focus on organizing your thoughts before speaking to improve your fluency.";
  }

  // --- Voice Confidence ---
  let confidenceMsg = '';
  if (metrics.voiceConfidence >= 75) {
    strengths.push("Strong, confident vocal presence.");
    confidenceMsg = "You sound confident and assertive, which is great for interviews.";
  } else if (metrics.voiceConfidence >= 50) {
    improvements.push("Your voice could project more confidence.");
    specificTips.push("Speak from your diaphragm and maintain steady volume.");
    confidenceMsg = "Try to project your voice a bit more to convey confidence.";
  } else {
    improvements.push("Your voice lacks confidence and authority.");
    specificTips.push("Practice power poses before speaking and focus on breathing deeply.");
    confidenceMsg = "Practice power poses and deep breathing to boost your vocal confidence.";
  }

  // --- Filler Words ---
  const fillerRatio = metrics.fillerWordCount / (transcription.split(' ').length || 1);
  let fillerMsg = '';
  if (fillerRatio < 0.02) {
    strengths.push("Minimal use of filler words - very professional.");
    fillerMsg = "You use very few filler words, which makes your speech sound polished.";
  } else if (fillerRatio < 0.05) {
    improvements.push("Some filler words present.");
    specificTips.push("Replace 'um' and 'uh' with brief pauses for better impact.");
    fillerMsg = "Try to reduce filler words further for an even more professional impression.";
  } else {
    improvements.push("Too many filler words disrupting message clarity.");
    specificTips.push("Practice speaking more slowly to reduce filler word dependency.");
    fillerMsg = "Focus on pausing instead of using filler words to improve clarity.";
  }

  // --- Energy and Pitch Variation ---
  let energyMsg = '';
  if (metrics.energyAnalysis.dynamicRange > 0.3 && metrics.pitchAnalysis.pitchVariation > 0.2) {
    strengths.push("Great vocal variety and engaging delivery.");
    energyMsg = "Your vocal variety keeps the listener engaged. Well done!";
  } else if (metrics.energyAnalysis.dynamicRange < 0.15) {
    improvements.push("Voice lacks energy and enthusiasm.");
    specificTips.push("Vary your tone and energy level to emphasize key points.");
    energyMsg = "Try to add more energy and variation to your voice to keep your audience interested.";
    confidenceTips.push('Increase vocal energy to project confidence.');
  } else {
    energyMsg = "Aim for a bit more vocal variety to make your delivery even more engaging.";
  }

  // --- Pauses ---
  let pauseMsg = '';
  if (metrics.pauseAnalysis.strategicPauses > 2) {
    strengths.push("Good use of strategic pauses for emphasis.");
    pauseMsg = "You use pauses effectively to emphasize key points.";
  } else if (metrics.pauseAnalysis.averagePauseLength > 2.0) {
    improvements.push("Pauses are too long, affecting flow.");
    specificTips.push("Keep pauses brief (1-2 seconds) to maintain momentum.");
    pauseMsg = "Try to keep your pauses shorter to maintain a steady flow.";
  } else {
    pauseMsg = "Consider using strategic pauses to highlight important ideas.";
  }

  // --- Sentiment to Pace Balance ---
  const verbal = analyzeVerbalResponse(transcription);
  const sentimentPaceBalance = Math.max(0, 1 - Math.abs(verbal.sentiment - 0.5) * 2 - Math.abs(metrics.speechRate - 160) / 160);
  metrics.sentimentPaceBalance = Math.round(sentimentPaceBalance * 100);
  metrics.vocalEnergy = metrics.vocalEnergy ?? Math.round(metrics.energyAnalysis.averageEnergy * 100);
  if (sentimentPaceBalance < 0.5) {
    confidenceTips.push('Balance your positive tone with a steady pace.');
  }
  if ((metrics.vocalEnergy || 0) < 40) {
    confidenceTips.push('Speak with more vocal energy to sound confident.');
  }

  // --- Compose overall message ---
  let overall = '';
  const improvementMsgs = [speechRateMsg, fluencyMsg, confidenceMsg, fillerMsg, energyMsg, pauseMsg].filter(Boolean);

  // If mostly strengths, give a positive summary
  if (improvements.length === 0) {
    overall = "Excellent vocal performance! You demonstrate strong communication skills across all key areas.";
  } else if (improvements.length <= 2) {
    overall = `Great job overall. Here are a few areas to focus on: ${improvementMsgs.join(' ')}`;
  } else {
    overall = `Priority Improvements: ${improvementMsgs.join(' ')}`;
  }

  // --- Score and category ---
  const overallScore = Math.round(
    (metrics.fluencyScore + metrics.voiceConfidence + metrics.deliveryScore + metrics.clarityScore) / 4
  );

  let category: ActionableFeedback['category'];
  if (overallScore >= 85) {
    category = 'excellent';
  } else if (overallScore >= 70) {
    category = 'good';
  } else if (overallScore >= 55) {
    category = 'fair';
  } else {
    category = 'needs_improvement';
  }

  // --- Context-specific tips ---
  if (questionContext) {
    if (questionContext.toLowerCase().includes('leadership')) {
      specificTips.push("For leadership questions, project authority through steady, measured speech.");
    } else if (questionContext.toLowerCase().includes('technical')) {
      specificTips.push("For technical answers, speak clearly and pause after complex concepts.");
    } else if (questionContext.toLowerCase().includes('behavioral')) {
      specificTips.push("Use vocal variety to make your stories more engaging and memorable.");
    }
  }

  return {
    overall,
    strengths,
    improvements,
    specificTips,
    score: overallScore,
    category,
    confidenceTips
  };
}