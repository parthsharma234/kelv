import { ComputerVisionMetrics, computerVisionAnalyzer } from './computerVision';
import { AdvancedVoiceMetrics, advancedVoiceAnalyzer } from './advancedVoiceAnalytics';

// Combined Analytics Types
export interface SophisticatedAnalyticsResult {
  timestamp: number;
  overallScore: number;
  computerVision: ComputerVisionMetrics;
  voice: AdvancedVoiceMetrics;
  combinedInsights: {
    confidenceAlignment: number; // How well CV and voice confidence align
    engagementConsistency: number; // Consistency between visual and vocal engagement
    professionalPresence: number; // Combined professional presence score
    authenticityScore: number; // How authentic the performance appears
    interviewReadiness: number; // Overall readiness for real interviews
  };
  recommendations: {
    immediate: string[]; // Things to fix right now
    shortTerm: string[]; // Things to work on this session
    longTerm: string[]; // Things to develop over time
  };
  strengths: string[];
  concerns: string[];
}

export interface AnalyticsTimeline {
  timePoints: Array<{
    timestamp: number;
    overallScore: number;
    keyEvent?: string;
    insights?: string[];
  }>;
  trendAnalysis: {
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
    keyInfluencers: string[];
  };
}

// Sophisticated Analytics Engine
export class SophisticatedAnalyticsEngine {
  private analysisHistory: SophisticatedAnalyticsResult[] = [];
  private isActive: boolean = false;
  private analysisInterval: number | null = null;
  private callbacks: ((result: SophisticatedAnalyticsResult) => void)[] = [];

  constructor() {
    this.bindAnalyzers();
  }

  private bindAnalyzers(): void {
    // Set up real-time callbacks from individual analyzers
    advancedVoiceAnalyzer.onRealtimeUpdate((voiceMetrics) => {
      if (this.isActive) {
        this.performCombinedAnalysis(voiceMetrics);
      }
    });
  }

  startAnalysis(videoElement: HTMLVideoElement, audioStream: MediaStream): void {
    if (this.isActive) return;

    this.isActive = true;
    this.analysisHistory = [];

    // Start individual analyzers
    computerVisionAnalyzer.startAnalysis(videoElement);
    advancedVoiceAnalyzer.startRealtimeAnalysis(audioStream);

    // Start combined analysis loop
    this.analysisInterval = window.setInterval(() => {
      this.performPeriodicAnalysis();
    }, 1000); // Every second
  }

  stopAnalysis(): void {
    this.isActive = false;
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    computerVisionAnalyzer.stopAnalysis();
    advancedVoiceAnalyzer.stopRealtimeAnalysis();
  }

  private performCombinedAnalysis(voiceMetrics: AdvancedVoiceMetrics): void {
    const cvMetrics = computerVisionAnalyzer.getRealtimeMetrics();
    
    if (!cvMetrics) return;

    const result = this.analyzeCombinedMetrics(cvMetrics, voiceMetrics);
    this.analysisHistory.push(result);

    // Keep only last 5 minutes of data
    if (this.analysisHistory.length > 300) {
      this.analysisHistory = this.analysisHistory.slice(-300);
    }

    // Notify callbacks
    this.callbacks.forEach(callback => callback(result));
  }

  private performPeriodicAnalysis(): void {
    const cvMetrics = computerVisionAnalyzer.getRealtimeMetrics();
    const voiceMetrics = advancedVoiceAnalyzer.getAverageMetrics();

    if (!cvMetrics || !voiceMetrics) return;

    const result = this.analyzeCombinedMetrics(cvMetrics, voiceMetrics);
    
    // Only add if significantly different from last result
    const lastResult = this.analysisHistory[this.analysisHistory.length - 1];
    if (!lastResult || this.isSignificantChange(lastResult, result)) {
      this.analysisHistory.push(result);
      this.callbacks.forEach(callback => callback(result));
    }
  }

  private analyzeCombinedMetrics(
    cvMetrics: ComputerVisionMetrics, 
    voiceMetrics: AdvancedVoiceMetrics
  ): SophisticatedAnalyticsResult {
    const timestamp = Date.now();

    // Calculate combined insights
    const combinedInsights = this.calculateCombinedInsights(cvMetrics, voiceMetrics);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(cvMetrics, voiceMetrics, combinedInsights);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(cvMetrics, voiceMetrics, combinedInsights);
    
    // Identify strengths and concerns
    const { strengths, concerns } = this.identifyStrengthsAndConcerns(cvMetrics, voiceMetrics, combinedInsights);

    return {
      timestamp,
      overallScore,
      computerVision: cvMetrics,
      voice: voiceMetrics,
      combinedInsights,
      recommendations,
      strengths,
      concerns
    };
  }

  private calculateCombinedInsights(
    cvMetrics: ComputerVisionMetrics, 
    voiceMetrics: AdvancedVoiceMetrics
  ): SophisticatedAnalyticsResult['combinedInsights'] {
    // Confidence alignment between visual and vocal cues
    const visualConfidence = cvMetrics.confidenceIndicators.facialConfidence;
    const vocalConfidence = voiceMetrics.emotional.confidence;
    const confidenceAlignment = 1 - Math.abs(visualConfidence - vocalConfidence);

    // Engagement consistency between visual and vocal indicators
    const visualEngagement = cvMetrics.overallEngagement;
    const vocalEngagement = voiceMetrics.emotional.engagement;
    const engagementConsistency = 1 - Math.abs(visualEngagement - vocalEngagement);

    // Combined professional presence
    const visualProfessionalism = cvMetrics.professionalismScore;
    const vocalProfessionalism = voiceMetrics.professional.credibility;
    const professionalPresence = (visualProfessionalism + vocalProfessionalism) / 2;

    // Authenticity score (how natural and genuine the performance appears)
    const authenticityScore = this.calculateAuthenticity(cvMetrics, voiceMetrics);

    // Interview readiness (overall preparedness for real interviews)
    const interviewReadiness = this.calculateInterviewReadiness(
      cvMetrics, voiceMetrics, confidenceAlignment, engagementConsistency
    );

    return {
      confidenceAlignment,
      engagementConsistency,
      professionalPresence,
      authenticityScore,
      interviewReadiness
    };
  }

  private calculateAuthenticity(
    cvMetrics: ComputerVisionMetrics, 
    voiceMetrics: AdvancedVoiceMetrics
  ): number {
    // Analyze micro-expressions vs. vocal emotions
    const facialExpressions = cvMetrics.facialExpressions.slice(-5);
    const avgHappiness = facialExpressions.reduce((sum, expr) => sum + expr.happiness, 0) / facialExpressions.length;
    const avgNervousness = facialExpressions.reduce((sum, expr) => sum + expr.nervousness, 0) / facialExpressions.length;
    
    const vocalEnthusiasm = voiceMetrics.emotional.enthusiasm;
    const vocalNervousness = voiceMetrics.emotional.nervousness;

    // Authentic performance has aligned emotional indicators
    const emotionalAlignment = 1 - Math.abs(avgHappiness - vocalEnthusiasm) - Math.abs(avgNervousness - vocalNervousness);
    
    // Natural variation indicates authenticity (not too perfect)
    const naturalVariation = this.calculateNaturalVariation(cvMetrics, voiceMetrics);
    
    // Micro-expression consistency
    const microExpressionConsistency = this.analyzeMicroExpressionConsistency(facialExpressions);

    return Math.max(0, Math.min(1, (emotionalAlignment * 0.4 + naturalVariation * 0.3 + microExpressionConsistency * 0.3)));
  }

  private calculateInterviewReadiness(
    cvMetrics: ComputerVisionMetrics,
    voiceMetrics: AdvancedVoiceMetrics,
    confidenceAlignment: number,
    engagementConsistency: number
  ): number {
    // Key factors for interview readiness
    const eyeContactScore = cvMetrics.confidenceIndicators.eyeContactConfidence;
    const postureScore = cvMetrics.confidenceIndicators.postureConfidence;
    const voiceConfidenceScore = voiceMetrics.emotional.confidence;
    const communicationScore = voiceMetrics.communication.articulation;
    const professionalScore = voiceMetrics.professional.authorityLevel;
    const stressManagement = 1 - voiceMetrics.emotional.stress;

    // Weighted combination of critical interview factors
    return (
      eyeContactScore * 0.2 +
      postureScore * 0.15 +
      voiceConfidenceScore * 0.2 +
      communicationScore * 0.15 +
      professionalScore * 0.15 +
      stressManagement * 0.1 +
      confidenceAlignment * 0.05
    );
  }

  private calculateOverallScore(
    cvMetrics: ComputerVisionMetrics,
    voiceMetrics: AdvancedVoiceMetrics,
    combinedInsights: SophisticatedAnalyticsResult['combinedInsights']
  ): number {
    // Sophisticated scoring algorithm
    const visualScore = (
      cvMetrics.overallEngagement * 0.3 +
      cvMetrics.professionalismScore * 0.3 +
      cvMetrics.confidenceIndicators.eyeContactConfidence * 0.2 +
      cvMetrics.confidenceIndicators.postureConfidence * 0.2
    );

    const voiceScore = (
      voiceMetrics.emotional.confidence * 0.25 +
      voiceMetrics.communication.articulation * 0.2 +
      voiceMetrics.professional.credibility * 0.2 +
      voiceMetrics.prosody.intonationVariety * 0.15 +
      voiceMetrics.emotional.engagement * 0.2
    );

    const combinedScore = (
      combinedInsights.confidenceAlignment * 0.2 +
      combinedInsights.engagementConsistency * 0.2 +
      combinedInsights.professionalPresence * 0.3 +
      combinedInsights.authenticityScore * 0.15 +
      combinedInsights.interviewReadiness * 0.15
    );

    // Weighted final score
    return (visualScore * 0.35 + voiceScore * 0.45 + combinedScore * 0.2);
  }

  private generateRecommendations(
    cvMetrics: ComputerVisionMetrics,
    voiceMetrics: AdvancedVoiceMetrics,
    combinedInsights: SophisticatedAnalyticsResult['combinedInsights']
  ): SophisticatedAnalyticsResult['recommendations'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate feedback (fix right now)
    if (cvMetrics.confidenceIndicators.eyeContactConfidence < 0.5) {
      immediate.push("Look directly at the camera more frequently");
    }
    if (voiceMetrics.communication.projection < 0.4) {
      immediate.push("Speak louder and project your voice more");
    }
    if (voiceMetrics.emotional.nervousness > 0.7) {
      immediate.push("Take a deep breath and slow down your speech");
    }
    if (cvMetrics.confidenceIndicators.postureConfidence < 0.6) {
      immediate.push("Sit up straighter and align your shoulders");
    }

    // Short-term improvements (this session)
    if (voiceMetrics.prosody.intonationVariety < 0.6) {
      shortTerm.push("Vary your pitch and tone to sound more engaging");
    }
    if (voiceMetrics.communication.pauseEffectiveness < 0.6) {
      shortTerm.push("Use strategic pauses for emphasis and clarity");
    }
    if (combinedInsights.confidenceAlignment < 0.7) {
      shortTerm.push("Align your facial expressions with your vocal confidence");
    }
    if (voiceMetrics.professional.persuasiveness < 0.7) {
      shortTerm.push("Use more authoritative language and vocal patterns");
    }

    // Long-term development
    if (voiceMetrics.professional.authorityLevel < 0.7) {
      longTerm.push("Develop a more authoritative speaking style through practice");
    }
    if (combinedInsights.authenticityScore < 0.7) {
      longTerm.push("Work on natural, authentic expression of emotions");
    }
    if (voiceMetrics.communication.emphasis < 0.6) {
      longTerm.push("Practice vocal emphasis techniques for key points");
    }
    if (cvMetrics.professionalismScore < 0.7) {
      longTerm.push("Develop consistent professional body language habits");
    }

    return { immediate, shortTerm, longTerm };
  }

  private identifyStrengthsAndConcerns(
    cvMetrics: ComputerVisionMetrics,
    voiceMetrics: AdvancedVoiceMetrics,
    combinedInsights: SophisticatedAnalyticsResult['combinedInsights']
  ): { strengths: string[]; concerns: string[] } {
    const strengths: string[] = [];
    const concerns: string[] = [];

    // Identify strengths (scores > 0.8)
    if (cvMetrics.confidenceIndicators.eyeContactConfidence > 0.8) {
      strengths.push("Excellent eye contact and visual engagement");
    }
    if (voiceMetrics.emotional.confidence > 0.8) {
      strengths.push("Strong vocal confidence and authority");
    }
    if (voiceMetrics.communication.articulation > 0.8) {
      strengths.push("Clear and articulate speech delivery");
    }
    if (voiceMetrics.professional.credibility > 0.8) {
      strengths.push("High professional credibility and presence");
    }
    if (combinedInsights.confidenceAlignment > 0.8) {
      strengths.push("Excellent alignment between visual and vocal confidence");
    }
    if (voiceMetrics.prosody.intonationVariety > 0.8) {
      strengths.push("Engaging and varied vocal intonation");
    }
    if (cvMetrics.professionalismScore > 0.8) {
      strengths.push("Strong professional visual presence");
    }

    // Identify concerns (scores < 0.5)
    if (cvMetrics.confidenceIndicators.eyeContactConfidence < 0.5) {
      concerns.push("Poor eye contact - look at camera more directly");
    }
    if (voiceMetrics.emotional.nervousness > 0.6) {
      concerns.push("High nervousness detected in voice patterns");
    }
    if (voiceMetrics.communication.projection < 0.5) {
      concerns.push("Voice projection too weak - speak louder");
    }
    if (combinedInsights.confidenceAlignment < 0.5) {
      concerns.push("Misalignment between visual and vocal confidence");
    }
    if (voiceMetrics.emotional.stress > 0.6) {
      concerns.push("High stress levels affecting voice quality");
    }
    if (cvMetrics.confidenceIndicators.postureConfidence < 0.5) {
      concerns.push("Poor posture affecting professional presence");
    }
    if (voiceMetrics.professional.authorityLevel < 0.5) {
      concerns.push("Lack of vocal authority and leadership presence");
    }

    return { strengths, concerns };
  }

  private calculateNaturalVariation(
    cvMetrics: ComputerVisionMetrics,
    voiceMetrics: AdvancedVoiceMetrics
  ): number {
    // Natural performance has some variation, not robotic perfection
    const facialVariation = this.calculateFacialVariation(cvMetrics.facialExpressions.slice(-10));
    const voiceVariation = this.calculateVoiceVariation(voiceMetrics);
    
    // Optimal variation is moderate (not too flat, not too erratic)
    const optimalFacialVariation = facialVariation > 0.1 && facialVariation < 0.4 ? 1 : 0.5;
    const optimalVoiceVariation = voiceVariation > 0.1 && voiceVariation < 0.3 ? 1 : 0.5;
    
    return (optimalFacialVariation + optimalVoiceVariation) / 2;
  }

  private analyzeMicroExpressionConsistency(expressions: any[]): number {
    if (expressions.length < 3) return 0.7;
    
    let consistencyScore = 0;
    const emotions = ['happiness', 'confidence', 'nervousness', 'engagement'];
    
    emotions.forEach(emotion => {
      const values = expressions.map(expr => expr[emotion]);
      const variation = this.calculateVariationCoefficient(values);
      
      // Moderate variation is good (shows natural expression)
      if (variation > 0.1 && variation < 0.3) {
        consistencyScore += 1;
      } else {
        consistencyScore += 0.5;
      }
    });
    
    return consistencyScore / emotions.length;
  }

  private calculateFacialVariation(expressions: any[]): number {
    if (expressions.length < 2) return 0.2;
    
    const emotions = ['happiness', 'confidence', 'nervousness', 'engagement'];
    let totalVariation = 0;
    
    emotions.forEach(emotion => {
      const values = expressions.map(expr => expr[emotion]);
      totalVariation += this.calculateVariationCoefficient(values);
    });
    
    return totalVariation / emotions.length;
  }

  private calculateVoiceVariation(voiceMetrics: AdvancedVoiceMetrics): number {
    // Calculate variation in voice characteristics
    const prosodyVariation = (
      voiceMetrics.prosody.intonationVariety +
      voiceMetrics.prosody.melodicRange
    ) / 2;
    
    const emotionalVariation = voiceMetrics.emotional.engagement;
    
    return (prosodyVariation + emotionalVariation) / 2;
  }

  private calculateVariationCoefficient(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return mean > 0 ? Math.sqrt(variance) / mean : 0;
  }

  private isSignificantChange(
    lastResult: SophisticatedAnalyticsResult,
    newResult: SophisticatedAnalyticsResult
  ): boolean {
    const scoreDifference = Math.abs(newResult.overallScore - lastResult.overallScore);
    const timeDifference = newResult.timestamp - lastResult.timestamp;
    
    // Significant if score changed by >5% or >10 seconds have passed
    return scoreDifference > 0.05 || timeDifference > 10000;
  }

  // Public API methods
  onAnalysisUpdate(callback: (result: SophisticatedAnalyticsResult) => void): void {
    this.callbacks.push(callback);
  }

  removeAnalysisCallback(callback: (result: SophisticatedAnalyticsResult) => void): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  getAnalysisHistory(): SophisticatedAnalyticsResult[] {
    return [...this.analysisHistory];
  }

  getAnalyticsTimeline(): AnalyticsTimeline {
    const timePoints = this.analysisHistory.map(result => ({
      timestamp: result.timestamp,
      overallScore: result.overallScore,
      keyEvent: this.identifyKeyEvent(result),
      insights: result.recommendations.immediate.slice(0, 2)
    }));

    const trendAnalysis = this.analyzeTrend();

    return { timePoints, trendAnalysis };
  }

  private identifyKeyEvent(result: SophisticatedAnalyticsResult): string | undefined {
    // Identify significant events in the analysis
    if (result.concerns.length > 3) return 'Multiple concerns detected';
    if (result.strengths.length > 4) return 'Strong performance period';
    if (result.combinedInsights.interviewReadiness > 0.9) return 'Interview-ready performance';
    if (result.combinedInsights.authenticityScore < 0.4) return 'Authenticity concern';
    
    return undefined;
  }

  private analyzeTrend(): AnalyticsTimeline['trendAnalysis'] {
    if (this.analysisHistory.length < 10) {
      return {
        direction: 'stable',
        confidence: 0.5,
        keyInfluencers: []
      };
    }

    const recent = this.analysisHistory.slice(-10);
    const earlier = this.analysisHistory.slice(-20, -10);

    const recentAvg = recent.reduce((sum, result) => sum + result.overallScore, 0) / recent.length;
    const earlierAvg = earlier.length > 0 ? 
      earlier.reduce((sum, result) => sum + result.overallScore, 0) / earlier.length : 
      recentAvg;

    const difference = recentAvg - earlierAvg;
    const confidence = Math.min(1, Math.abs(difference) * 10); // Higher confidence for larger changes

    let direction: 'improving' | 'declining' | 'stable';
    if (difference > 0.05) direction = 'improving';
    else if (difference < -0.05) direction = 'declining';
    else direction = 'stable';

    // Identify key influencers
    const keyInfluencers = this.identifyTrendInfluencers(recent, earlier);

    return { direction, confidence, keyInfluencers };
  }

  private identifyTrendInfluencers(recent: SophisticatedAnalyticsResult[], earlier: SophisticatedAnalyticsResult[]): string[] {
    const influencers: string[] = [];
    
    if (recent.length === 0 || earlier.length === 0) return influencers;

    // Calculate average changes in key metrics
    const recentAvgs = this.calculateAverageMetrics(recent);
    const earlierAvgs = this.calculateAverageMetrics(earlier);

    // Identify metrics with significant changes
    const metrics = [
      { name: 'Eye Contact', recent: recentAvgs.eyeContact, earlier: earlierAvgs.eyeContact },
      { name: 'Voice Confidence', recent: recentAvgs.voiceConfidence, earlier: earlierAvgs.voiceConfidence },
      { name: 'Professional Presence', recent: recentAvgs.professionalPresence, earlier: earlierAvgs.professionalPresence },
      { name: 'Communication Clarity', recent: recentAvgs.communication, earlier: earlierAvgs.communication },
      { name: 'Emotional Engagement', recent: recentAvgs.engagement, earlier: earlierAvgs.engagement }
    ];

    metrics.forEach(metric => {
      const change = metric.recent - metric.earlier;
      if (Math.abs(change) > 0.1) {
        const direction = change > 0 ? 'improved' : 'declined';
        influencers.push(`${metric.name} ${direction}`);
      }
    });

    return influencers.slice(0, 3); // Top 3 influencers
  }

  private calculateAverageMetrics(results: SophisticatedAnalyticsResult[]): any {
    const count = results.length;
    
    return {
      eyeContact: results.reduce((sum, r) => sum + r.computerVision.confidenceIndicators.eyeContactConfidence, 0) / count,
      voiceConfidence: results.reduce((sum, r) => sum + r.voice.emotional.confidence, 0) / count,
      professionalPresence: results.reduce((sum, r) => sum + r.combinedInsights.professionalPresence, 0) / count,
      communication: results.reduce((sum, r) => sum + r.voice.communication.articulation, 0) / count,
      engagement: results.reduce((sum, r) => sum + r.voice.emotional.engagement, 0) / count
    };
  }

  getFinalAnalysisReport(): {
    summary: SophisticatedAnalyticsResult;
    timeline: AnalyticsTimeline;
    detailedInsights: string[];
  } {
    if (this.analysisHistory.length === 0) {
      throw new Error('No analysis data available');
    }

    // Calculate overall summary from entire session
    const summary = this.calculateSessionSummary();
    const timeline = this.getAnalyticsTimeline();
    const detailedInsights = this.generateDetailedInsights();

    return { summary, timeline, detailedInsights };
  }

  private calculateSessionSummary(): SophisticatedAnalyticsResult {
    const allResults = this.analysisHistory;
    const count = allResults.length;

    // Average all metrics across the session
    const avgCvMetrics = this.averageComputerVisionMetrics(allResults.map(r => r.computerVision));
    const avgVoiceMetrics = this.averageVoiceMetrics(allResults.map(r => r.voice));
    const avgCombinedInsights = this.averageCombinedInsights(allResults.map(r => r.combinedInsights));

    const overallScore = allResults.reduce((sum, r) => sum + r.overallScore, 0) / count;
    const allStrengths = [...new Set(allResults.flatMap(r => r.strengths))];
    const allConcerns = [...new Set(allResults.flatMap(r => r.concerns))];

    // Generate final recommendations
    const recommendations = this.generateFinalRecommendations(avgCvMetrics, avgVoiceMetrics, avgCombinedInsights);

    return {
      timestamp: Date.now(),
      overallScore,
      computerVision: avgCvMetrics,
      voice: avgVoiceMetrics,
      combinedInsights: avgCombinedInsights,
      recommendations,
      strengths: allStrengths.slice(0, 5),
      concerns: allConcerns.slice(0, 5)
    };
  }

  private averageComputerVisionMetrics(metrics: ComputerVisionMetrics[]): ComputerVisionMetrics {
    const count = metrics.length;
    
    return {
      facialExpressions: metrics.flatMap(m => m.facialExpressions),
      eyeTracking: metrics.flatMap(m => m.eyeTracking),
      posture: metrics.flatMap(m => m.posture),
      overallEngagement: metrics.reduce((sum, m) => sum + m.overallEngagement, 0) / count,
      professionalismScore: metrics.reduce((sum, m) => sum + m.professionalismScore, 0) / count,
      confidenceIndicators: {
        facialConfidence: metrics.reduce((sum, m) => sum + m.confidenceIndicators.facialConfidence, 0) / count,
        postureConfidence: metrics.reduce((sum, m) => sum + m.confidenceIndicators.postureConfidence, 0) / count,
        eyeContactConfidence: metrics.reduce((sum, m) => sum + m.confidenceIndicators.eyeContactConfidence, 0) / count,
        gestureConfidence: metrics.reduce((sum, m) => sum + m.confidenceIndicators.gestureConfidence, 0) / count,
      }
    };
  }

  private averageVoiceMetrics(metrics: AdvancedVoiceMetrics[]): AdvancedVoiceMetrics {
    const count = metrics.length;
    
    // Average all the complex nested metrics
    const avgMetrics = metrics.reduce((acc, m) => ({
      speechRate: acc.speechRate + m.speechRate,
      fluency: acc.fluency + m.fluency,
      voiceConfidence: acc.voiceConfidence + m.voiceConfidence,
      delivery: acc.delivery + m.delivery,
      clarity: acc.clarity + m.clarity,
      fillerWordCount: acc.fillerWordCount + m.fillerWordCount,
      prosody: {
        intonationVariety: acc.prosody.intonationVariety + m.prosody.intonationVariety,
        stressPatterns: acc.prosody.stressPatterns + m.prosody.stressPatterns,
        rhythmConsistency: acc.prosody.rhythmConsistency + m.prosody.rhythmConsistency,
        melodicRange: acc.prosody.melodicRange + m.prosody.melodicRange,
      },
      emotional: {
        enthusiasm: acc.emotional.enthusiasm + m.emotional.enthusiasm,
        nervousness: acc.emotional.nervousness + m.emotional.nervousness,
        confidence: acc.emotional.confidence + m.emotional.confidence,
        engagement: acc.emotional.engagement + m.emotional.engagement,
        stress: acc.emotional.stress + m.emotional.stress,
      },
      communication: {
        articulation: acc.communication.articulation + m.communication.articulation,
        projection: acc.communication.projection + m.communication.projection,
        paceVariation: acc.communication.paceVariation + m.communication.paceVariation,
        pauseEffectiveness: acc.communication.pauseEffectiveness + m.communication.pauseEffectiveness,
        emphasis: acc.communication.emphasis + m.communication.emphasis,
      },
      professional: {
        authorityLevel: acc.professional.authorityLevel + m.professional.authorityLevel,
        credibility: acc.professional.credibility + m.professional.credibility,
        persuasiveness: acc.professional.persuasiveness + m.professional.persuasiveness,
        likeability: acc.professional.likeability + m.professional.likeability,
      }
    }), {
      speechRate: 0, fluency: 0, voiceConfidence: 0, delivery: 0, clarity: 0, fillerWordCount: 0,
      prosody: { intonationVariety: 0, stressPatterns: 0, rhythmConsistency: 0, melodicRange: 0 },
      emotional: { enthusiasm: 0, nervousness: 0, confidence: 0, engagement: 0, stress: 0 },
      communication: { articulation: 0, projection: 0, paceVariation: 0, pauseEffectiveness: 0, emphasis: 0 },
      professional: { authorityLevel: 0, credibility: 0, persuasiveness: 0, likeability: 0 }
    });

    // Divide by count and add required fields
    return {
      speechRate: avgMetrics.speechRate / count,
      fluency: avgMetrics.fluency / count,
      fluencyScore: (avgMetrics.fluency / count) * 100,
      voiceConfidence: avgMetrics.voiceConfidence / count,
      delivery: avgMetrics.delivery / count,
      deliveryScore: (avgMetrics.delivery / count) * 100,
      clarity: avgMetrics.clarity / count,
      clarityScore: (avgMetrics.clarity / count) * 100,
      fillerWordCount: avgMetrics.fillerWordCount / count,
      timestamp: Date.now(),
      duration: count * 0.1,
      
      prosody: {
        intonationVariety: avgMetrics.prosody.intonationVariety / count,
        stressPatterns: avgMetrics.prosody.stressPatterns / count,
        rhythmConsistency: avgMetrics.prosody.rhythmConsistency / count,
        melodicRange: avgMetrics.prosody.melodicRange / count,
      },
      emotional: {
        enthusiasm: avgMetrics.emotional.enthusiasm / count,
        nervousness: avgMetrics.emotional.nervousness / count,
        confidence: avgMetrics.emotional.confidence / count,
        engagement: avgMetrics.emotional.engagement / count,
        stress: avgMetrics.emotional.stress / count,
      },
      communication: {
        articulation: avgMetrics.communication.articulation / count,
        projection: avgMetrics.communication.projection / count,
        paceVariation: avgMetrics.communication.paceVariation / count,
        pauseEffectiveness: avgMetrics.communication.pauseEffectiveness / count,
        emphasis: avgMetrics.communication.emphasis / count,
      },
      professional: {
        authorityLevel: avgMetrics.professional.authorityLevel / count,
        credibility: avgMetrics.professional.credibility / count,
        persuasiveness: avgMetrics.professional.persuasiveness / count,
        likeability: avgMetrics.professional.likeability / count,
      },
      realtime: {
        currentConfidence: avgMetrics.emotional.confidence / count,
        currentClarity: avgMetrics.communication.articulation / count,
        currentEngagement: avgMetrics.emotional.engagement / count,
        trendDirection: 'stable'
      }
    };
  }

  private averageCombinedInsights(insights: SophisticatedAnalyticsResult['combinedInsights'][]): SophisticatedAnalyticsResult['combinedInsights'] {
    const count = insights.length;
    
    return {
      confidenceAlignment: insights.reduce((sum, i) => sum + i.confidenceAlignment, 0) / count,
      engagementConsistency: insights.reduce((sum, i) => sum + i.engagementConsistency, 0) / count,
      professionalPresence: insights.reduce((sum, i) => sum + i.professionalPresence, 0) / count,
      authenticityScore: insights.reduce((sum, i) => sum + i.authenticityScore, 0) / count,
      interviewReadiness: insights.reduce((sum, i) => sum + i.interviewReadiness, 0) / count,
    };
  }

  private generateFinalRecommendations(
    cvMetrics: ComputerVisionMetrics,
    voiceMetrics: AdvancedVoiceMetrics,
    combinedInsights: SophisticatedAnalyticsResult['combinedInsights']
  ): SophisticatedAnalyticsResult['recommendations'] {
    // Generate comprehensive final recommendations
    return this.generateRecommendations(cvMetrics, voiceMetrics, combinedInsights);
  }

  private generateDetailedInsights(): string[] {
    const insights: string[] = [];
    
    if (this.analysisHistory.length === 0) return insights;

    const summary = this.calculateSessionSummary();
    
    // Generate insights based on overall performance
    if (summary.overallScore > 0.8) {
      insights.push("Outstanding interview performance with strong professional presence across all metrics.");
    } else if (summary.overallScore > 0.6) {
      insights.push("Good interview performance with several areas of strength and room for targeted improvement.");
    } else {
      insights.push("Interview performance shows potential but requires focused practice in key areas.");
    }

    // Add specific insights based on strengths and concerns
    if (summary.strengths.length > summary.concerns.length) {
      insights.push(`Your key strengths include ${summary.strengths.slice(0, 2).join(' and ')}.`);
    }
    
    if (summary.concerns.length > 0) {
      insights.push(`Primary areas for improvement: ${summary.concerns.slice(0, 2).join(' and ')}.`);
    }

    // Add trend insights
    const timeline = this.getAnalyticsTimeline();
    if (timeline.trendAnalysis.direction === 'improving') {
      insights.push("Your performance showed consistent improvement throughout the session.");
    } else if (timeline.trendAnalysis.direction === 'declining') {
      insights.push("Performance declined during the session - consider fatigue or stress management.");
    }

    return insights;
  }

  clearHistory(): void {
    this.analysisHistory = [];
    computerVisionAnalyzer.clearHistory();
    advancedVoiceAnalyzer.clearAnalysisHistory();
  }
}

// Export singleton instance
export const sophisticatedAnalyticsEngine = new SophisticatedAnalyticsEngine();