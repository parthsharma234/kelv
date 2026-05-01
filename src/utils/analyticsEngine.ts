// --- TYPES ---
export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  isPartial?: boolean;
}

export interface PostureAnalysisData {
  shoulderAlignment: number;
  headPosition: 'centered' | 'forward' | 'tilted';
  overallScore: number;
  timeInGoodPosture: number;
  sampleCount?: number;
  samples?: Array<{
    timestamp: number;
    elapsedSeconds: number;
    metrics: {
      shoulderAlignment: number;
      headPosition: 'centered' | 'forward' | 'tilted';
      isGoodPosture: boolean;
      confidence: number;
      timestamp: number;
      keypoints?: Array<{
        name: string;
        x: number;
        y: number;
        score: number;
      }>;
      geometry?: {
        shoulderTiltDeg: number;
        headOffsetPct: number;
        torsoLeanDeg: number;
        shoulderWidthPct: number;
      };
    };
  }>;
}

export interface AnalyticsInput {
  durationSecs: number;
  transcript: TranscriptMessage[];
  role?: string;
  postureData?: PostureAnalysisData;
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
  overallScore: number;
  contentScore: number;
  deliveryScore: number;
  presenceScore: number;

  avgVolume: number;
  volumeVariance: number;
  speechRate: 'too_slow' | 'optimal' | 'too_fast';
  wpm: number;
  fillerWordCount: number;
  tonalVariety: number;
  pauseScore: number;
  articulationScore: number;
  interruptions: number;

  dominantExpression: string;
  anxietyLevel: number;
  eyeContactEstimate: number;

  timeline: TimeSeriesPoint[];
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  expressionBreakdown: Record<string, number>;

  benchmarks?: {
    content: number;
    delivery: number;
    presence: number;
    overall: number;
    roleName: string;
  };
}

interface QuestionPair {
  question: TranscriptMessage;
  answer: TranscriptMessage;
}

// --- ANALYTICS ENGINE ---
export class AnalyticsEngine {
  private static readonly BIN_SIZE = 5;
  private static readonly FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'well', 'literally', 'mean', 'right'];
  private static readonly WEAK_WORDS = ['maybe', 'i think', 'kind of', 'sort of', 'probably', 'perhaps', 'stuff', 'things'];
  private static readonly STAR_KEYWORDS = ['situation', 'task', 'action', 'result', 'outcome', 'challenge', 'solved', 'achieved', 'led'];

  static process({
    durationSecs,
    transcript,
    role,
    postureData
  }: AnalyticsInput): InterviewMetrics {
    const cleanTranscript = (transcript || []).filter(
      (message) => message && !message.isPartial && typeof message.content === 'string' && message.content.trim().length > 0
    );

    const userMessages = cleanTranscript.filter((message) => message.role === 'user');
    const questionPairs = this.segmentTranscript(cleanTranscript);

    if (userMessages.length === 0) {
      return this.generateEmpty(role);
    }

    let fillerCount = 0;
    let weakWordCount = 0;
    let starKeywordCount = 0;
    let quantifiedAnswerCount = 0;
    let userWordCount = 0;
    let totalSentences = 0;

    const responseLengths: number[] = [];
    const responseLatencies: number[] = [];
    const perAnswerDeliveryScores: number[] = [];
    const perAnswerPresenceScores: number[] = [];

    questionPairs.forEach((pair) => {
      const content = pair.answer.content || '';
      const words = this.getWords(content);
      const responseLength = words.length;
      const responseLatencySec = Math.max(
        1,
        (new Date(pair.answer.timestamp).getTime() - new Date(pair.question.timestamp).getTime()) / 1000
      );

      responseLengths.push(responseLength);
      responseLatencies.push(responseLatencySec);
      userWordCount += responseLength;
      totalSentences += this.countSentences(content);

      fillerCount += this.countMatches(content, this.FILLER_WORDS);
      weakWordCount += this.countPhraseMatches(content, this.WEAK_WORDS);
      starKeywordCount += this.countPhraseMatches(content, this.STAR_KEYWORDS);

      if (/\d/.test(content)) {
        quantifiedAnswerCount += 1;
      }

      perAnswerDeliveryScores.push(
        this.scoreDeliveryProxy({
          responseLength,
          responseLatencySec,
          fillerCount: this.countMatches(content, this.FILLER_WORDS),
          weakWordCount: this.countPhraseMatches(content, this.WEAK_WORDS)
        })
      );

      perAnswerPresenceScores.push(
        this.scorePresenceProxy({
          postureData,
          responseLatencySec,
          fillerCount: this.countMatches(content, this.FILLER_WORDS)
        })
      );
    });

    if (questionPairs.length === 0) {
      userMessages.forEach((message) => {
        const words = this.getWords(message.content || '');
        userWordCount += words.length;
        responseLengths.push(words.length);
        fillerCount += this.countMatches(message.content, this.FILLER_WORDS);
        weakWordCount += this.countPhraseMatches(message.content, this.WEAK_WORDS);
        starKeywordCount += this.countPhraseMatches(message.content, this.STAR_KEYWORDS);
        if (/\d/.test(message.content)) {
          quantifiedAnswerCount += 1;
        }
      });
    }

    const totalUserWindowSeconds = responseLatencies.reduce((sum, value) => sum + value, 0);
    const fallbackWindowSeconds = Math.max(durationSecs * 0.45, 1);
    const wpmBaseSeconds = totalUserWindowSeconds > 0 ? totalUserWindowSeconds : fallbackWindowSeconds;
    const wpm = Math.max(0, Math.min(220, Math.round((userWordCount / Math.max(1, wpmBaseSeconds)) * 60)));

    let speechRate: 'too_slow' | 'optimal' | 'too_fast' = 'optimal';
    if (wpm < 110) speechRate = 'too_slow';
    if (wpm > 160) speechRate = 'too_fast';

    const pausesOver5s = responseLatencies.filter((seconds) => seconds > 5).length;
    const pausesOver10s = responseLatencies.filter((seconds) => seconds > 10).length;
    const avgResponseLength = responseLengths.length > 0 ? this.average(responseLengths) : 0;
    const responseLengthVariance = this.variance(responseLengths);
    const cadenceVariance = avgResponseLength > 0 ? Math.sqrt(responseLengthVariance) / avgResponseLength : 0;

    const tonalVariety = Math.max(
      25,
      Math.min(
        95,
        Math.round(
          48 +
          cadenceVariance * 35 +
          Math.min(12, totalSentences) +
          (speechRate === 'optimal' ? 8 : 0) -
          Math.min(20, fillerCount * 1.5)
        )
      )
    );

    const articulationScore = Math.max(20, Math.min(100, Math.round(92 - fillerCount * 4 - weakWordCount * 3)));
    const pauseScore = Math.max(15, Math.min(100, Math.round(100 - pausesOver5s * 10 - pausesOver10s * 10)));

    let contentScoreRaw = 62;
    contentScoreRaw += avgResponseLength > 55 ? 14 : avgResponseLength > 28 ? 8 : avgResponseLength < 12 ? -18 : 0;
    contentScoreRaw += Math.min(14, starKeywordCount * 2);
    contentScoreRaw += Math.min(15, quantifiedAnswerCount * 4);
    contentScoreRaw -= weakWordCount * 3;
    contentScoreRaw -= fillerCount * 1.5;
    const contentScore = Math.max(0, Math.min(100, Math.round(contentScoreRaw)));

    let deliveryScoreRaw = this.average(perAnswerDeliveryScores);
    deliveryScoreRaw += speechRate === 'optimal' ? 8 : -8;
    deliveryScoreRaw += (tonalVariety - 50) * 0.18;
    deliveryScoreRaw += (articulationScore - 60) * 0.2;
    deliveryScoreRaw -= pausesOver10s * 6;
    const deliveryScore = Math.max(0, Math.min(100, Math.round(deliveryScoreRaw)));

    let presenceScoreRaw = this.average(perAnswerPresenceScores);
    if (postureData) {
      const headPositionBonus = postureData.headPosition === 'centered' ? 6 : postureData.headPosition === 'forward' ? -4 : -8;
      presenceScoreRaw =
        postureData.overallScore * 0.55 +
        postureData.timeInGoodPosture * 0.3 +
        postureData.shoulderAlignment * 0.15 +
        headPositionBonus;
    }
    const presenceScore = Math.max(0, Math.min(100, Math.round(presenceScoreRaw)));

    const hesitationLevel = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          fillerCount * 6 +
          weakWordCount * 7 +
          pausesOver10s * 12 +
          Math.max(0, 120 - wpm) * 0.12
        )
      )
    );

    const eyeContactEstimate = postureData
      ? Math.max(
        25,
        Math.min(
          100,
          Math.round(
            postureData.overallScore * 0.45 +
            postureData.timeInGoodPosture * 0.35 +
            (postureData.headPosition === 'centered' ? 20 : postureData.headPosition === 'forward' ? 8 : 4)
          )
        )
      )
      : Math.max(45, Math.min(80, Math.round(60 - pausesOver10s * 3 + (speechRate === 'optimal' ? 6 : 0))));

    const overallScore = Math.round(contentScore * 0.45 + deliveryScore * 0.35 + presenceScore * 0.2);

    const timeline = this.buildTimeline({
      durationSecs,
      questionPairs,
      postureData,
      defaultVoiceConfidence: deliveryScore / 100,
      defaultFaceConfidence: presenceScore / 100
    });

    const expressionBreakdown = {
      'Structured Answers': Math.min(100, Math.round((starKeywordCount / Math.max(1, questionPairs.length || userMessages.length)) * 24)),
      'Quantified Impact': Math.min(100, Math.round((quantifiedAnswerCount / Math.max(1, questionPairs.length || userMessages.length)) * 100)),
      'Clean Delivery': articulationScore,
      'Steady Posture': postureData?.timeInGoodPosture ?? Math.max(35, presenceScore - 8),
      'Fast Recovery': pauseScore,
      'Hedging Language': Math.max(0, Math.min(100, weakWordCount * 12))
    };

    const dominantExpression = Object.entries(expressionBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Structured Answers';

    const strengths: StrengthWeakness[] = [];
    const weaknesses: StrengthWeakness[] = [];

    if (speechRate === 'optimal') {
      strengths.push({
        area: 'Speaking Pace',
        description: `Pacing stayed in a strong range at ${wpm} WPM.`,
        severity: 'info'
      });
    } else if (speechRate === 'too_fast') {
      weaknesses.push({
        area: 'Speaking Pace',
        description: `Pace ran fast at ${wpm} WPM. Slow down enough for key points to land.`,
        severity: 'warning'
      });
    } else {
      weaknesses.push({
        area: 'Speaking Pace',
        description: `Pace landed slow at ${wpm} WPM. Answer with more forward energy.`,
        severity: 'warning'
      });
    }

    if (fillerCount === 0) {
      strengths.push({
        area: 'Speech Clarity',
        description: 'No filler words were detected in the completed transcript.',
        severity: 'info'
      });
    } else if (fillerCount > 5) {
      weaknesses.push({
        area: 'Filler Words',
        description: `Detected ${fillerCount} fillers. Replace them with a short silent pause.`,
        severity: fillerCount > 9 ? 'critical' : 'warning'
      });
    }

    if (quantifiedAnswerCount > 0) {
      strengths.push({
        area: 'Quantification',
        description: `You used measurable proof in ${quantifiedAnswerCount} answer${quantifiedAnswerCount === 1 ? '' : 's'}.`,
        severity: 'info'
      });
    } else {
      weaknesses.push({
        area: 'Proof Of Impact',
        description: 'Answers need more numbers, scope, or concrete outcomes to feel credible.',
        severity: 'warning'
      });
    }

    if (starKeywordCount > 0) {
      strengths.push({
        area: 'Structure',
        description: 'Your answers showed signs of organized, story-based thinking.',
        severity: 'info'
      });
    } else {
      weaknesses.push({
        area: 'Structure',
        description: 'Behavioral answers need a clearer situation-action-result arc.',
        severity: 'warning'
      });
    }

    if (postureData) {
      if (postureData.overallScore >= 75) {
        strengths.push({
          area: 'Presence',
          description: 'Posture stayed steady enough to support a confident screen presence.',
          severity: 'info'
        });
      } else {
        weaknesses.push({
          area: 'Presence',
          description: 'Posture drifted during the session. Sit taller and keep your head centered.',
          severity: 'warning'
        });
      }
    } else {
      weaknesses.push({
        area: 'Presence Data',
        description: 'Visual presence signals were limited, so this score leans on transcript timing only.',
        severity: 'info'
      });
    }

    if (pausesOver10s > 0) {
      weaknesses.push({
        area: 'Recovery Time',
        description: `There were ${pausesOver10s} long delays before answers. Buy time out loud instead of going silent.`,
        severity: pausesOver10s > 1 ? 'critical' : 'warning'
      });
    } else {
      strengths.push({
        area: 'Flow',
        description: 'You kept the conversation moving without major dead air.',
        severity: 'info'
      });
    }

    return {
      overallScore,
      contentScore,
      deliveryScore,
      presenceScore,
      avgVolume: Math.max(25, Math.min(95, Math.round(45 + tonalVariety * 0.35))),
      volumeVariance: Math.max(0, Math.min(100, Math.round(cadenceVariance * 100))),
      speechRate,
      wpm,
      fillerWordCount: fillerCount,
      tonalVariety,
      pauseScore,
      articulationScore,
      interruptions: 0,
      dominantExpression,
      anxietyLevel: hesitationLevel,
      eyeContactEstimate,
      timeline,
      strengths,
      weaknesses,
      expressionBreakdown,
      benchmarks: this.getBenchmarks(role)
    };
  }

  static getBenchmarks(role?: string): InterviewMetrics['benchmarks'] {
    const roleBenchmarks: Record<string, { content: number; delivery: number; presence: number; overall: number }> = {
      'Software Engineer': { content: 85, delivery: 75, presence: 68, overall: 78 },
      'Manager': { content: 80, delivery: 84, presence: 84, overall: 82 },
      'Executive': { content: 85, delivery: 88, presence: 90, overall: 87 },
      'Customer Support': { content: 75, delivery: 85, presence: 80, overall: 80 },
      'Sales': { content: 80, delivery: 90, presence: 85, overall: 85 },
      Default: { content: 80, delivery: 78, presence: 75, overall: 78 }
    };

    const key = role && roleBenchmarks[role] ? role : 'Default';

    return {
      ...roleBenchmarks[key],
      roleName: key === 'Default' && role ? role : key
    };
  }

  static generateEmpty(role?: string): InterviewMetrics {
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
      dominantExpression: 'No Data',
      anxietyLevel: 0,
      eyeContactEstimate: 0,
      timeline: [],
      strengths: [],
      weaknesses: [{
        area: 'Analysis Failed',
        description: 'Could not process interview data from the completed session.',
        severity: 'critical'
      }],
      expressionBreakdown: {},
      benchmarks: this.getBenchmarks(role)
    };
  }

  private static segmentTranscript(transcript: TranscriptMessage[]): QuestionPair[] {
    const pairs: QuestionPair[] = [];
    let pendingQuestion: TranscriptMessage | null = null;

    for (const message of transcript) {
      if (message.role === 'assistant') {
        pendingQuestion = message;
        continue;
      }

      if (message.role === 'user' && pendingQuestion) {
        pairs.push({ question: pendingQuestion, answer: message });
        pendingQuestion = null;
      }
    }

    return pairs;
  }

  private static buildTimeline({
    durationSecs,
    questionPairs,
    postureData,
    defaultVoiceConfidence,
    defaultFaceConfidence
  }: {
    durationSecs: number;
    questionPairs: QuestionPair[];
    postureData?: PostureAnalysisData;
    defaultVoiceConfidence: number;
    defaultFaceConfidence: number;
  }): TimeSeriesPoint[] {
    const bins = Math.max(1, Math.ceil(Math.max(durationSecs, 30) / this.BIN_SIZE));
    const faceConfidenceBase = postureData
      ? Math.max(0.35, Math.min(0.98, postureData.overallScore / 100))
      : Math.max(0.45, Math.min(0.9, defaultFaceConfidence));

    return Array.from({ length: bins }, (_, index) => {
      const startTime = index * this.BIN_SIZE;
      const minutes = Math.floor(startTime / 60);
      const seconds = startTime % 60;

      const pairIndex = questionPairs.length === 0
        ? -1
        : Math.min(questionPairs.length - 1, Math.floor((index / bins) * questionPairs.length));

      let voiceConfidence = defaultVoiceConfidence;
      let dominantEmotion = 'Steady';
      let emotionIntensity = defaultVoiceConfidence;

      if (pairIndex >= 0) {
        const answer = questionPairs[pairIndex].answer.content;
        const fillerCount = this.countMatches(answer, this.FILLER_WORDS);
        const weakWordCount = this.countPhraseMatches(answer, this.WEAK_WORDS);
        const responseLength = this.getWords(answer).length;
        const responseLatencySec = Math.max(
          1,
          (new Date(questionPairs[pairIndex].answer.timestamp).getTime() - new Date(questionPairs[pairIndex].question.timestamp).getTime()) / 1000
        );

        const deliveryScore = this.scoreDeliveryProxy({
          responseLength,
          responseLatencySec,
          fillerCount,
          weakWordCount
        });

        voiceConfidence = Math.max(0.3, Math.min(0.95, deliveryScore / 100));
        dominantEmotion = deliveryScore >= 75 ? 'Strong Answer' : deliveryScore >= 55 ? 'Steady Answer' : 'Hesitant Answer';
        emotionIntensity = voiceConfidence;
      }

      return {
        timestamp: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        voiceConfidence,
        faceConfidence: faceConfidenceBase,
        dominantEmotion,
        emotionIntensity
      };
    });
  }

  private static scoreDeliveryProxy({
    responseLength,
    responseLatencySec,
    fillerCount,
    weakWordCount
  }: {
    responseLength: number;
    responseLatencySec: number;
    fillerCount: number;
    weakWordCount: number;
  }): number {
    let score = 68;

    score += responseLength >= 30 ? 8 : responseLength < 12 ? -16 : 0;
    score += responseLatencySec <= 4 ? 8 : responseLatencySec <= 8 ? 0 : -10;
    score -= fillerCount * 4;
    score -= weakWordCount * 3;

    return Math.max(20, Math.min(95, Math.round(score)));
  }

  private static scorePresenceProxy({
    postureData,
    responseLatencySec,
    fillerCount
  }: {
    postureData?: PostureAnalysisData;
    responseLatencySec: number;
    fillerCount: number;
  }): number {
    if (postureData) {
      const headBonus = postureData.headPosition === 'centered' ? 6 : postureData.headPosition === 'forward' ? -4 : -8;
      return Math.max(
        25,
        Math.min(
          98,
          Math.round(
            postureData.overallScore * 0.55 +
            postureData.timeInGoodPosture * 0.25 +
            postureData.shoulderAlignment * 0.2 +
            headBonus -
            Math.max(0, responseLatencySec - 8) * 1.5 -
            fillerCount * 0.8
          )
        )
      );
    }

    return Math.max(35, Math.min(80, Math.round(62 - Math.max(0, responseLatencySec - 8) * 2 - fillerCount * 1.2)));
  }

  private static getWords(content: string): string[] {
    return (content || '').trim().split(/\s+/).filter(Boolean);
  }

  private static countMatches(content: string, phrases: string[]): number {
    return phrases.reduce((total, phrase) => {
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = content.match(regex);
      return total + (matches ? matches.length : 0);
    }, 0);
  }

  private static countPhraseMatches(content: string, phrases: string[]): number {
    const lowered = (content || '').toLowerCase();
    return phrases.reduce((total, phrase) => total + (lowered.includes(phrase) ? 1 : 0), 0);
  }

  private static countSentences(content: string): number {
    const sentences = (content || '').split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
    return Math.max(1, sentences.length);
  }

  private static average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private static variance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.average(values);
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  }
}
