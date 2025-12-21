import { HumeJobPrediction } from './humeBatchClient';

// --- TYPES ---
export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string; // Handle both serialization forms
  isPartial?: boolean;
}

export interface TimeSeriesPoint {
  timestamp: string;
  voiceConfidence: number;
  faceConfidence: number;
  dominantEmotion: string;
  emotionIntensity: number;
}

export interface StrengthWeakness {
  area: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp?: string;
}

export interface InterviewMetrics {
  // Core Scores (0-100, HONEST)
  overallScore: number;
  contentScore: number;
  deliveryScore: number;
  presenceScore: number;

  // Voice Metrics
  avgVolume: number;
  volumeVariance: number;
  speechRate: 'too_slow' | 'optimal' | 'too_fast';
  wpm: number;
  fillerWordCount: number;
  tonalVariety: number; // 0-100 (Monotone -> Dynamic)
  pauseScore: number; // 0-100 (Bad -> Good)
  articulationScore: number; // 0-100
  interruptions: number;

  // Face Metrics
  dominantExpression: string;
  anxietyLevel: number;
  eyeContactEstimate: number;

  // Timeline for charts
  timeline: TimeSeriesPoint[];

  // Critical Feedback
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];

  // Raw data for deep dive
  expressionBreakdown: Record<string, number>;
}

// --- ANALYTICS ENGINE ---
export class AnalyticsEngine {
  private static readonly BIN_SIZE = 5; // Granular 5-second bins
  private static readonly FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'well', 'literally', 'mean', 'right'];
  private static readonly WEAK_WORDS = ['maybe', 'i think', 'kind of', 'sort of', 'probably', 'perhaps', 'stuff', 'things'];
  private static readonly STAR_KEYWORDS = ['situation', 'task', 'action', 'result', 'outcome', 'challenge', 'solved', 'achieved', 'led'];

  static process(
    data: HumeJobPrediction[],
    durationSecs: number,
    transcript: TranscriptMessage[]
  ): InterviewMetrics {
    const predictions = data[0]?.results?.predictions[0]?.models;
    if (!predictions) return this.generateEmpty();

    const bins = Math.max(1, Math.ceil(durationSecs / this.BIN_SIZE));
    const timeline: TimeSeriesPoint[] = [];
    const allFaceEmotions: Record<string, number[]> = {};
    const allVoiceScores: number[] = [];
    const allFaceScores: number[] = [];
    const tonalScores: number[] = [];

    // --- FACE PROCESSING ---
    let anxietySum = 0, anxietyCount = 0;
    if (predictions.face?.grouped_predictions) {
      predictions.face.grouped_predictions.forEach(group => {
        group.predictions.forEach(pred => {
          const emotions = this.mapEmotions(pred.emotions);

          // Track all emotions
          pred.emotions.forEach(e => {
            if (!allFaceEmotions[e.name]) allFaceEmotions[e.name] = [];
            allFaceEmotions[e.name].push(e.score);
          });

          // Anxiety tracking
          anxietySum += (emotions['Anxiety'] || 0) + (emotions['Fear'] || 0) + (emotions['Distress'] || 0) + (emotions['Confusion'] || 0);
          anxietyCount++;

          // Face confidence: positive vs negative
          const positive = (emotions['Joy'] || 0) + (emotions['Calmness'] || 0) + (emotions['Interest'] || 0) + (emotions['Determination'] || 0);
          const negative = (emotions['Anxiety'] || 0) + (emotions['Confusion'] || 0) + (emotions['Distress'] || 0) + (emotions['Boredom'] || 0);
          allFaceScores.push(Math.max(0, Math.min(1, 0.5 + (positive - negative))));
        });
      });
    }

    // --- PROSODY PROCESSING ---
    let volumeSum = 0, volumeSq = 0, prosodyCount = 0;
    if (predictions.prosody?.grouped_predictions) {
      predictions.prosody.grouped_predictions.forEach(group => {
        group.predictions.forEach(pred => {
          const emotions = this.mapEmotions(pred.emotions);
          const confidence = (emotions['Confidence'] || 0) + (emotions['Determination'] || 0);
          const doubt = (emotions['Anxiety'] || 0) + (emotions['Awkwardness'] || 0) + (emotions['Embarrassment'] || 0);
          const score = Math.max(0, Math.min(1, 0.5 + (confidence - doubt)));
          allVoiceScores.push(score);

          // Tonal Variety Proxy: Inverse of Boredom/Tiredness, plus Excitement
          const tone = (emotions['Excitement'] || 0) + (emotions['Interest'] || 0) - (emotions['Boredom'] || 0);
          tonalScores.push(tone);

          // Volume proxy from emotional intensity (sum of top 3 emotions)
          const sorted = pred.emotions.sort((a,b) => b.score - a.score);
          const intensity = (sorted[0]?.score || 0) + (sorted[1]?.score || 0);
          volumeSum += intensity;
          volumeSq += intensity * intensity;
          prosodyCount++;
        });
      });
    }

    // --- TRANSCRIPT ANALYSIS (Filler Words & Content) ---
    let fillerCount = 0;
    let userWordCount = 0;
    let weakWordCount = 0;
    let starKeywordCount = 0;
    let numberCount = 0; 
    
    // Pause Analysis
    let pausesOver3s = 0;
    let pausesOver5s = 0;

    const userMessages = transcript.filter(t => t.role === 'user');
    
    // Convert strings to dates for calculation
    const userTimestamps = userMessages.map(m => new Date(m.timestamp).getTime());

    for (let i = 0; i < userMessages.length; i++) {
        const msg = userMessages[i];
        const content = msg.content || '';
        const words = content.toLowerCase().split(/\s+/);
        userWordCount += words.length;

        // Fillers
        this.FILLER_WORDS.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = content.match(regex);
            if (matches) fillerCount += matches.length;
        });

        // Weak words
        this.WEAK_WORDS.forEach(word => {
            if (content.toLowerCase().includes(word)) weakWordCount++;
        });

        // STAR keywords
        this.STAR_KEYWORDS.forEach(word => {
            if (content.toLowerCase().includes(word)) starKeywordCount++;
        });

        // Quantification
        if (/\d+/.test(content)) numberCount++;
        
         // Pause Check (Gap between previous message end estimate and this start)
        if (i > 0) {
            const prevTime = userTimestamps[i-1];
            // Estimate duration of PREV msg: 150 WPM = 2.5 words/sec
            const prevWords = userMessages[i-1].content.split(' ').length;
            const prevDurationMs = (prevWords / 2.5) * 1000;
            const gap = userTimestamps[i] - (prevTime + prevDurationMs);
            
            // Only count gaps that likely contain "thinking silence" (and not just AI speaking)
            // This is tricky without AI timestamps. We will assume gaps > 5s are thinking pauses if AI response is short.
            // Simplified: Just detect Long Pauses > 5s as potential "Blanking Out"
            if (gap > 5000) pausesOver5s++;
            else if (gap > 3000) pausesOver3s++;
        }
    }

    // Accurate WPM Calculation using timestamps
    let wpm = 0;
    if (userMessages.length >= 2) {
      const start = new Date(userMessages[0].timestamp).getTime();
      const end = new Date(userMessages[userMessages.length - 1].timestamp).getTime();
      const durationMin = (end - start) / 1000 / 60;
      if (durationMin > 0.1) {
        wpm = userWordCount / durationMin;
      }
    } else {
       wpm = (userWordCount / Math.max(1, durationSecs * 0.4)) * 60; 
    }
    wpm = Math.min(250, Math.max(0, Math.round(wpm)));

    let speechRate: 'too_slow' | 'optimal' | 'too_fast' = 'optimal';
    if (wpm < 110) speechRate = 'too_slow';
    else if (wpm > 160) speechRate = 'too_fast';

    // --- BUILD TIMELINE (5s Bins) ---
    for (let i = 0; i < bins; i++) {
      const startTime = i * this.BIN_SIZE;
      const minutes = Math.floor(startTime / 60);
      const seconds = startTime % 60;

      const vStart = Math.floor((i / bins) * allVoiceScores.length);
      const vEnd = Math.floor(((i + 1) / bins) * allVoiceScores.length);
      const voiceConf = this.averageSlice(allVoiceScores, vStart, vEnd);

      const fStart = Math.floor((i / bins) * allFaceScores.length);
      const fEnd = Math.floor(((i + 1) / bins) * allFaceScores.length);
      const faceConf = this.averageSlice(allFaceScores, fStart, fEnd);

      let dominantEmotion = 'Neutral';
      let maxScore = 0;
      Object.entries(allFaceEmotions).forEach(([emotion, scores]) => {
         const eStart = Math.floor((i / bins) * scores.length);
         const eEnd = Math.floor(((i + 1) / bins) * scores.length);
         const avg = this.averageSlice(scores, eStart, eEnd);
         if (avg > maxScore) {
           maxScore = avg;
           dominantEmotion = emotion;
         }
      });

      timeline.push({
        timestamp: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        voiceConfidence: voiceConf || 0.5,
        faceConfidence: faceConf || 0.5,
        dominantEmotion,
        emotionIntensity: maxScore
      });
    }

    // --- CALCULATE SCORES (HONEST) ---
    const avgVoice = this.average(allVoiceScores);
    const avgFace = this.average(allFaceScores);
    const avgAnxiety = anxietyCount > 0 ? anxietySum / anxietyCount : 0;
    const avgVolume = prosodyCount > 0 ? volumeSum / prosodyCount : 0.5;
    const volumeVariance = prosodyCount > 1 ? (volumeSq / prosodyCount) - (avgVolume * avgVolume) : 0;
    const avgTonalVariety = this.average(tonalScores); 

    // Articulation (Proxy): Ratio of unique words vs fillers. 
    // High filler count = Low articulation.
    const articulationScore = Math.max(0, 100 - (fillerCount * 5) - (weakWordCount * 2));
    
    // Pause Score: Penalize for >5s freezes
    const pauseScore = Math.max(0, 100 - (pausesOver5s * 20));

    // 1. Content Score
    const avgResponseLength = userMessages.length > 0 ? userWordCount / userMessages.length : 0;
    let contentScoreRaw = 70; 
    contentScoreRaw += (avgResponseLength > 40 ? 10 : avgResponseLength < 10 ? -20 : 0); 
    contentScoreRaw += (starKeywordCount * 2); 
    contentScoreRaw += (numberCount * 3); 
    contentScoreRaw -= (weakWordCount * 2); 
    contentScoreRaw -= (fillerCount); 
    const contentScore = Math.min(100, Math.max(0, Math.round(contentScoreRaw)));

    // 2. Delivery Score
    let deliveryScoreRaw = avgVoice * 100;
    deliveryScoreRaw -= (speechRate !== 'optimal' ? 15 : 0);
    deliveryScoreRaw += (avgTonalVariety > 0 ? 10 : -10); 
    deliveryScoreRaw -= (pausesOver5s * 10); // Penalty for blanking
    const deliveryScore = Math.min(100, Math.max(0, Math.round(deliveryScoreRaw)));

    // 3. Presence Score
    let presenceScoreRaw = avgFace * 100;
    presenceScoreRaw -= (avgAnxiety * 80); 
    const presenceScore = Math.min(100, Math.max(0, Math.round(presenceScoreRaw)));

    // Overall
    const overallScore = Math.round(contentScore * 0.4 + deliveryScore * 0.3 + presenceScore * 0.3);

    // --- EXPRESSION BREAKDOWN ---
    const expressionBreakdown: Record<string, number> = {};
    Object.entries(allFaceEmotions).forEach(([emotion, scores]) => {
      expressionBreakdown[emotion] = scores.reduce((a, b) => a + b, 0) / scores.length * 100;
    });
    const sortedExpressions = Object.entries(expressionBreakdown).sort((a, b) => b[1] - a[1]);
    const dominantExpression = sortedExpressions[0]?.[0] || 'Neutral';

    // --- GENERATE DETAILED FEEDBACK ---
    const strengths: StrengthWeakness[] = [];
    const weaknesses: StrengthWeakness[] = [];

    // Voice & Delivery
    if (speechRate === 'too_fast') weaknesses.push({ area: 'Speaking Pace', description: `Fast pace (${wpm} WPM). Slow down to give your points impact.`, severity: 'warning' });
    else if (speechRate === 'too_slow') weaknesses.push({ area: 'Speaking Pace', description: `Slow pace (${wpm} WPM). Increase energy to maintain engagement.`, severity: 'warning' });
    else strengths.push({ area: 'Speaking Pace', description: `Great cadence (${wpm} WPM). Clear and easy to follow.`, severity: 'info' });

    if (fillerCount > 0) {
        const severity = fillerCount > 6 ? 'critical' : 'warning';
        weaknesses.push({ area: 'Filler Words', description: `Detected ${fillerCount} fillers ("um", "like"). Pause silently instead to sound more executive.`, severity });
    } else {
        strengths.push({ area: 'Clean Speech', description: 'Zero filler words detected. Highly professional polish.', severity: 'info' });
    }
    
    // Pause Feedback
    if (pausesOver5s > 0) weaknesses.push({ area: 'Dead Air', description: `Detected ${pausesOver5s} long pauses (>5s). If you need time to think, say "That's a great question, let me consider..."`, severity: 'critical' });
    else strengths.push({ area: 'Flow', description: 'Maintained a steady flow of conversation without awkward silences.', severity: 'info' });

    if (avgTonalVariety < -0.1) weaknesses.push({ area: 'Monotone Delivery', description: 'Voice lacks variety. vary your pitch to emphasize key points.', severity: 'warning' });
    else strengths.push({ area: 'Dynamic Tone', description: 'Good vocal variety keeps the listener engaged.', severity: 'info' });

    // Content Quality
    if (numberCount > 0) strengths.push({ area: 'Data Driven', description: `Used numbers/metrics ${numberCount} times to quantify achievements. Excellent.`, severity: 'info' });
    else weaknesses.push({ area: 'Quantification', description: 'Answers lacked specific metrics. Use numbers (%) to prove your impact.', severity: 'warning' });

    if (starKeywordCount > 0) strengths.push({ area: 'Structure', description: 'Used STAR method keywords (Situation, Task, Result). Structured thinking detected.', severity: 'info' });
    
    if (weakWordCount > 2) weaknesses.push({ area: 'Assertiveness', description: `Used weak language (${weakWordCount} times: "I think", "maybe"). Be definitive.`, severity: 'warning' });

    // Presence
    if (avgAnxiety > 0.25) weaknesses.push({ area: 'Visible Discomfort', description: 'Facial analysis detected tension/anxiety. Smile more to build rapport.', severity: 'critical' });
    else strengths.push({ area: 'Executive Presence', description: 'Maintained a calm, confident facial composition.', severity: 'info' });

    return {
      overallScore,
      contentScore,
      deliveryScore,
      presenceScore,
      avgVolume: Math.round(avgVolume * 100),
      volumeVariance: Math.round(volumeVariance * 100),
      speechRate,
      wpm,
      fillerWordCount: fillerCount,
      tonalVariety: Math.round((avgTonalVariety + 1) * 50),
      // New Metrics
      pauseScore,
      articulationScore,
      interruptions: 0, // Placeholder for now, difficult without AI timestamps
      dominantExpression,
      anxietyLevel: Math.round(avgAnxiety * 100),
      eyeContactEstimate: Math.min(100, Math.round(avgFace * 120)),
      timeline,
      strengths,
      weaknesses,
      expressionBreakdown
    };
  }

  private static mapEmotions(emotions: { name: string; score: number }[]): Record<string, number> {
    const map: Record<string, number> = {};
    emotions.forEach(e => { map[e.name] = e.score; });
    return map;
  }

  private static average(arr: number[]) {
      if (arr.length === 0) return 0;
      return arr.reduce((a,b) => a+b, 0) / arr.length;
  }

  private static averageSlice(arr: number[], start: number, end: number) {
      const slice = arr.slice(start, Math.max(start + 1, end));
      return this.average(slice);
  }

  static generateEmpty(): InterviewMetrics {
    return {
      overallScore: 0,
      contentScore: 0,
      deliveryScore: 0,
      presenceScore: 0,
      avgVolume: 0,
      volumeVariance: 0,
      speechRate: 'optimal',
      wpm: 0,
      fillerWordCount: 0,
      tonalVariety: 0,
      pauseScore: 0,
      articulationScore: 0,
      interruptions: 0,
      dominantExpression: 'Unknown',
      anxietyLevel: 0,
      eyeContactEstimate: 0,
      timeline: [],
      strengths: [],
      weaknesses: [{ area: 'Analysis Failed', description: 'Could not process interview data.', severity: 'critical' }],
      expressionBreakdown: {}
    };
  }
}
