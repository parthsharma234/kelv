import { HumeJobPrediction } from './humeBatchClient';
import { TranscriptMessage, StrengthWeakness } from './analyticsEngine';
import { IdealAnswerComparator } from './idealAnswerComparison';

// --- TYPES ---
export interface QuestionMetrics {
  questionId: string;
  questionNumber: number;
  questionText: string;
  answerText: string;
  questionTimestamp: Date;
  answerTimestamp: Date;

  // Scores (0-100)
  contentScore: number;
  deliveryScore: number;
  presenceScore: number;
  overallScore: number;

  // Voice Metrics
  wpm: number;
  fillerWordCount: number;
  weakWordCount: number;
  voiceConfidence: number; // 0-100
  tonalVariety: number; // 0-100

  // Content Quality
  starKeywordCount: number;
  numberCount: number;
  responseLength: number; // word count

  // Face Metrics
  faceConfidence: number; // 0-100
  anxietyLevel: number; // 0-100
  dominantExpression: string;

  // Feedback
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];

  // For ideal answer comparison (Phase 1 Feature 2)
  idealAnswerSimilarity?: number; // 0-100, added later
  missingKeyPoints?: string[]; // added later
}

export interface PerQuestionAnalysis {
  questions: QuestionMetrics[];
  strongestQuestion: QuestionMetrics | null;
  weakestQuestion: QuestionMetrics | null;
  averageScores: {
    content: number;
    delivery: number;
    presence: number;
    overall: number;
  };
}

// --- PER-QUESTION ANALYTICS ENGINE ---
export class PerQuestionAnalytics {
  private static readonly FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'well', 'literally', 'mean', 'right'];
  private static readonly WEAK_WORDS = ['maybe', 'i think', 'kind of', 'sort of', 'probably', 'perhaps', 'stuff', 'things'];
  private static readonly STAR_KEYWORDS = ['situation', 'task', 'action', 'result', 'outcome', 'challenge', 'solved', 'achieved', 'led'];

  /**
   * Main entry point: Process interview data and generate per-question metrics
   */
  static process(
    humeData: HumeJobPrediction[],
    transcript: TranscriptMessage[]
  ): PerQuestionAnalysis {
    // Step 1: Segment transcript into Q&A pairs
    const questionPairs = this.segmentTranscript(transcript);

    if (questionPairs.length === 0) {
      return {
        questions: [],
        strongestQuestion: null,
        weakestQuestion: null,
        averageScores: { content: 0, delivery: 0, presence: 0, overall: 0 }
      };
    }

    // Step 2: Extract Hume predictions
    const predictions = humeData[0]?.results?.predictions[0]?.models;

    // Step 3: Process each question
    const questions: QuestionMetrics[] = questionPairs.map((pair, index) =>
      this.processQuestion(pair, index + 1, predictions)
    );

    // Step 4: Identify strongest/weakest
    const sortedByScore = [...questions].sort((a, b) => b.overallScore - a.overallScore);
    const strongestQuestion = sortedByScore[0] || null;
    const weakestQuestion = sortedByScore[sortedByScore.length - 1] || null;

    // Step 5: Calculate averages
    const averageScores = this.calculateAverages(questions);

    return {
      questions,
      strongestQuestion,
      weakestQuestion,
      averageScores
    };
  }

  /**
   * Segment transcript into question-answer pairs
   */
  private static segmentTranscript(transcript: TranscriptMessage[]): Array<{
    question: TranscriptMessage;
    answer: TranscriptMessage;
  }> {
    const pairs: Array<{ question: TranscriptMessage; answer: TranscriptMessage }> = [];

    for (let i = 0; i < transcript.length - 1; i++) {
      const current = transcript[i];
      const next = transcript[i + 1];

      // Look for assistant (question) followed by user (answer)
      if (current.role === 'assistant' && next.role === 'user') {
        pairs.push({
          question: current,
          answer: next
        });
      }
    }

    return pairs;
  }

  /**
   * Process a single question-answer pair
   */
  private static processQuestion(
    pair: { question: TranscriptMessage; answer: TranscriptMessage },
    questionNumber: number,
    predictions: any
  ): QuestionMetrics {
    const { question, answer } = pair;

    // Content Analysis
    const content = answer.content || '';
    const words = content.toLowerCase().split(/\s+/);
    const responseLength = words.length;

    // Filler words
    let fillerCount = 0;
    this.FILLER_WORDS.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) fillerCount += matches.length;
    });

    // Weak words
    let weakWordCount = 0;
    this.WEAK_WORDS.forEach(word => {
      if (content.toLowerCase().includes(word)) weakWordCount++;
    });

    // STAR keywords
    let starKeywordCount = 0;
    this.STAR_KEYWORDS.forEach(word => {
      if (content.toLowerCase().includes(word)) starKeywordCount++;
    });

    // Numbers/quantification
    const numberCount = (/\d+/.test(content)) ? 1 : 0;

    // WPM calculation
    const answerTimestamp = new Date(answer.timestamp).getTime();
    const questionTimestamp = new Date(question.timestamp).getTime();
    const durationSec = Math.max(1, (answerTimestamp - questionTimestamp) / 1000);
    const wpm = Math.round((responseLength / durationSec) * 60);

    // Get Hume predictions for this specific time range
    const humeMetrics = this.getHumeMetricsForTimeRange(predictions);

    // Calculate Scores
    const contentScore = this.calculateContentScore(
      responseLength,
      starKeywordCount,
      numberCount,
      weakWordCount,
      fillerCount
    );

    const deliveryScore = this.calculateDeliveryScore(
      humeMetrics.voiceConfidence,
      wpm,
      humeMetrics.tonalVariety
    );

    const presenceScore = this.calculatePresenceScore(
      humeMetrics.faceConfidence,
      humeMetrics.anxietyLevel
    );

    const overallScore = Math.round(
      contentScore * 0.4 + deliveryScore * 0.3 + presenceScore * 0.3
    );

    // Generate Feedback
    const { strengths, weaknesses } = this.generateFeedback({
      wpm,
      fillerCount,
      weakWordCount,
      starKeywordCount,
      numberCount,
      responseLength,
      anxietyLevel: humeMetrics.anxietyLevel,
      tonalVariety: humeMetrics.tonalVariety
    });

    // Ideal Answer Comparison
    const idealAnswer = IdealAnswerComparator.findIdealAnswer(question.content);
    let idealAnswerSimilarity: number | undefined;
    let missingKeyPoints: string[] | undefined;

    if (idealAnswer) {
      const comparison = IdealAnswerComparator.compareAnswer(answer.content, idealAnswer);
      idealAnswerSimilarity = comparison.similarityScore;
      missingKeyPoints = comparison.missingKeyPoints;
    }

    return {
      questionId: question.id,
      questionNumber,
      questionText: question.content,
      answerText: answer.content,
      questionTimestamp: new Date(question.timestamp),
      answerTimestamp: new Date(answer.timestamp),
      contentScore,
      deliveryScore,
      presenceScore,
      overallScore,
      wpm,
      fillerWordCount: fillerCount,
      weakWordCount,
      voiceConfidence: humeMetrics.voiceConfidence,
      tonalVariety: humeMetrics.tonalVariety,
      starKeywordCount,
      numberCount,
      responseLength,
      faceConfidence: humeMetrics.faceConfidence,
      anxietyLevel: humeMetrics.anxietyLevel,
      dominantExpression: humeMetrics.dominantExpression,
      strengths,
      weaknesses,
      idealAnswerSimilarity,
      missingKeyPoints
    };
  }

  /**
   * Extract Hume metrics for a specific time range
   * Note: Currently analyzes all predictions; time-based filtering to be added
   */
  private static getHumeMetricsForTimeRange(
    predictions: any
  ): {
    voiceConfidence: number;
    faceConfidence: number;
    anxietyLevel: number;
    tonalVariety: number;
    dominantExpression: string;
  } {
    if (!predictions) {
      return {
        voiceConfidence: 50,
        faceConfidence: 50,
        anxietyLevel: 0,
        tonalVariety: 50,
        dominantExpression: 'Neutral'
      };
    }

    const voiceScores: number[] = [];
    const faceScores: number[] = [];
    let anxietySum = 0;
    let anxietyCount = 0;
    const tonalScores: number[] = [];
    const expressionCounts: Record<string, number> = {};

    // Process Face predictions
    if (predictions.face?.grouped_predictions) {
      predictions.face.grouped_predictions.forEach((group: any) => {
        group.predictions.forEach((pred: any) => {
          const emotions = this.mapEmotions(pred.emotions);

          // Face confidence
          const positive = (emotions['Joy'] || 0) + (emotions['Calmness'] || 0) + (emotions['Interest'] || 0);
          const negative = (emotions['Anxiety'] || 0) + (emotions['Confusion'] || 0) + (emotions['Distress'] || 0);
          faceScores.push(Math.max(0, Math.min(1, 0.5 + (positive - negative))));

          // Anxiety
          anxietySum += (emotions['Anxiety'] || 0) + (emotions['Fear'] || 0) + (emotions['Distress'] || 0);
          anxietyCount++;

          // Track dominant expression
          const dominant = pred.emotions.sort((a: any, b: any) => b.score - a.score)[0];
          if (dominant) {
            expressionCounts[dominant.name] = (expressionCounts[dominant.name] || 0) + 1;
          }
        });
      });
    }

    // Process Prosody predictions
    if (predictions.prosody?.grouped_predictions) {
      predictions.prosody.grouped_predictions.forEach((group: any) => {
        group.predictions.forEach((pred: any) => {
          const emotions = this.mapEmotions(pred.emotions);

          // Voice confidence
          const confidence = (emotions['Confidence'] || 0) + (emotions['Determination'] || 0);
          const doubt = (emotions['Anxiety'] || 0) + (emotions['Awkwardness'] || 0);
          voiceScores.push(Math.max(0, Math.min(1, 0.5 + (confidence - doubt))));

          // Tonal variety
          const tone = (emotions['Excitement'] || 0) + (emotions['Interest'] || 0) - (emotions['Boredom'] || 0);
          tonalScores.push(tone);
        });
      });
    }

    // Find dominant expression
    const dominantExpression = Object.entries(expressionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral';

    return {
      voiceConfidence: Math.round(this.average(voiceScores) * 100),
      faceConfidence: Math.round(this.average(faceScores) * 100),
      anxietyLevel: Math.round((anxietyCount > 0 ? anxietySum / anxietyCount : 0) * 100),
      tonalVariety: Math.round((this.average(tonalScores) + 1) * 50),
      dominantExpression
    };
  }

  /**
   * Calculate content quality score
   */
  private static calculateContentScore(
    responseLength: number,
    starKeywordCount: number,
    numberCount: number,
    weakWordCount: number,
    fillerCount: number
  ): number {
    let score = 70; // Base score

    // Length penalty/bonus
    if (responseLength > 40) score += 10;
    else if (responseLength < 10) score -= 20;

    // STAR structure
    score += starKeywordCount * 2;

    // Quantification
    score += numberCount * 3;

    // Weak language penalty
    score -= weakWordCount * 2;

    // Filler penalty
    score -= fillerCount;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate delivery score
   */
  private static calculateDeliveryScore(
    voiceConfidence: number,
    wpm: number,
    tonalVariety: number
  ): number {
    let score = voiceConfidence;

    // Pace penalty
    if (wpm < 110 || wpm > 160) score -= 15;

    // Tonal variety bonus/penalty
    if (tonalVariety > 70) score += 10;
    else if (tonalVariety < 40) score -= 10;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate presence score
   */
  private static calculatePresenceScore(
    faceConfidence: number,
    anxietyLevel: number
  ): number {
    let score = faceConfidence;

    // Anxiety penalty
    score -= anxietyLevel * 0.8;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Generate strengths and weaknesses for a question
   */
  private static generateFeedback(data: {
    wpm: number;
    fillerCount: number;
    weakWordCount: number;
    starKeywordCount: number;
    numberCount: number;
    responseLength: number;
    anxietyLevel: number;
    tonalVariety: number;
  }): { strengths: StrengthWeakness[]; weaknesses: StrengthWeakness[] } {
    const strengths: StrengthWeakness[] = [];
    const weaknesses: StrengthWeakness[] = [];

    // Pace
    if (data.wpm >= 110 && data.wpm <= 160) {
      strengths.push({
        area: 'Pacing',
        description: `Good speaking pace (${data.wpm} WPM)`,
        severity: 'info'
      });
    } else if (data.wpm > 160) {
      weaknesses.push({
        area: 'Too Fast',
        description: `${data.wpm} WPM - slow down for clarity`,
        severity: 'warning'
      });
    } else {
      weaknesses.push({
        area: 'Too Slow',
        description: `${data.wpm} WPM - increase energy`,
        severity: 'warning'
      });
    }

    // Fillers
    if (data.fillerCount === 0) {
      strengths.push({
        area: 'Clean Speech',
        description: 'No filler words detected',
        severity: 'info'
      });
    } else if (data.fillerCount > 3) {
      weaknesses.push({
        area: 'Filler Words',
        description: `${data.fillerCount} fillers - use pauses instead`,
        severity: data.fillerCount > 5 ? 'critical' : 'warning'
      });
    }

    // STAR method
    if (data.starKeywordCount > 0) {
      strengths.push({
        area: 'Structure',
        description: 'Used STAR framework keywords',
        severity: 'info'
      });
    }

    // Quantification
    if (data.numberCount > 0) {
      strengths.push({
        area: 'Data-Driven',
        description: 'Included specific metrics',
        severity: 'info'
      });
    } else {
      weaknesses.push({
        area: 'Quantification',
        description: 'Add numbers to prove impact',
        severity: 'warning'
      });
    }

    // Weak words
    if (data.weakWordCount > 1) {
      weaknesses.push({
        area: 'Weak Language',
        description: `Avoid hedging ("I think", "maybe")`,
        severity: 'warning'
      });
    }

    // Response length
    if (data.responseLength < 10) {
      weaknesses.push({
        area: 'Too Brief',
        description: 'Expand your answer with examples',
        severity: 'critical'
      });
    }

    // Anxiety
    if (data.anxietyLevel > 30) {
      weaknesses.push({
        area: 'Visible Tension',
        description: 'Facial analysis detected anxiety',
        severity: 'warning'
      });
    } else {
      strengths.push({
        area: 'Calm Presence',
        description: 'Maintained composure',
        severity: 'info'
      });
    }

    // Tonal variety
    if (data.tonalVariety > 70) {
      strengths.push({
        area: 'Dynamic Voice',
        description: 'Good vocal variety',
        severity: 'info'
      });
    } else if (data.tonalVariety < 40) {
      weaknesses.push({
        area: 'Monotone',
        description: 'Vary your pitch for emphasis',
        severity: 'warning'
      });
    }

    return { strengths, weaknesses };
  }

  /**
   * Calculate average scores across all questions
   */
  private static calculateAverages(questions: QuestionMetrics[]): {
    content: number;
    delivery: number;
    presence: number;
    overall: number;
  } {
    if (questions.length === 0) {
      return { content: 0, delivery: 0, presence: 0, overall: 0 };
    }

    const sum = questions.reduce(
      (acc, q) => ({
        content: acc.content + q.contentScore,
        delivery: acc.delivery + q.deliveryScore,
        presence: acc.presence + q.presenceScore,
        overall: acc.overall + q.overallScore
      }),
      { content: 0, delivery: 0, presence: 0, overall: 0 }
    );

    const count = questions.length;

    return {
      content: Math.round(sum.content / count),
      delivery: Math.round(sum.delivery / count),
      presence: Math.round(sum.presence / count),
      overall: Math.round(sum.overall / count)
    };
  }

  // --- UTILITY FUNCTIONS ---

  private static mapEmotions(emotions: { name: string; score: number }[]): Record<string, number> {
    const map: Record<string, number> = {};
    emotions.forEach(e => { map[e.name] = e.score; });
    return map;
  }

  private static average(arr: number[]): number {
    if (arr.length === 0) return 0.5; // Default to neutral
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}
