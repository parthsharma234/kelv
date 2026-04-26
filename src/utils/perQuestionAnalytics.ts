import { IdealAnswerComparator } from './idealAnswerComparison';
import { InterviewMetrics, PostureAnalysisData, StrengthWeakness, TranscriptMessage } from './analyticsEngine';

export interface QuestionMetrics {
  questionId: string;
  questionNumber: number;
  questionText: string;
  answerText: string;
  questionTimestamp: Date;
  answerTimestamp: Date;
  contentScore: number;
  deliveryScore: number;
  presenceScore: number;
  overallScore: number;
  wpm: number;
  fillerWordCount: number;
  weakWordCount: number;
  voiceConfidence: number;
  tonalVariety: number;
  starKeywordCount: number;
  numberCount: number;
  responseLength: number;
  faceConfidence: number;
  anxietyLevel: number;
  dominantExpression: string;
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  idealAnswerSimilarity?: number;
  missingKeyPoints?: string[];
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

interface QuestionPair {
  question: TranscriptMessage;
  answer: TranscriptMessage;
}

interface PerQuestionOptions {
  postureData?: PostureAnalysisData;
  overallMetrics?: InterviewMetrics;
}

export class PerQuestionAnalytics {
  private static readonly FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'well', 'literally', 'mean', 'right'];
  private static readonly WEAK_WORDS = ['maybe', 'i think', 'kind of', 'sort of', 'probably', 'perhaps', 'stuff', 'things'];
  private static readonly STAR_KEYWORDS = ['situation', 'task', 'action', 'result', 'outcome', 'challenge', 'solved', 'achieved', 'led'];

  static process(
    transcript: TranscriptMessage[],
    options: PerQuestionOptions = {}
  ): PerQuestionAnalysis {
    const questionPairs = this.segmentTranscript(transcript);

    if (questionPairs.length === 0) {
      return {
        questions: [],
        strongestQuestion: null,
        weakestQuestion: null,
        averageScores: { content: 0, delivery: 0, presence: 0, overall: 0 }
      };
    }

    const questions = questionPairs.map((pair, index) =>
      this.processQuestion(pair, index + 1, options)
    );

    const sortedByScore = [...questions].sort((a, b) => b.overallScore - a.overallScore);

    return {
      questions,
      strongestQuestion: sortedByScore[0] || null,
      weakestQuestion: sortedByScore[sortedByScore.length - 1] || null,
      averageScores: this.calculateAverages(questions)
    };
  }

  private static segmentTranscript(transcript: TranscriptMessage[]): QuestionPair[] {
    const pairs: QuestionPair[] = [];

    for (let index = 0; index < transcript.length - 1; index += 1) {
      const current = transcript[index];
      const next = transcript[index + 1];

      if (current.role === 'assistant' && next.role === 'user') {
        pairs.push({ question: current, answer: next });
      }
    }

    return pairs;
  }

  private static processQuestion(
    pair: QuestionPair,
    questionNumber: number,
    options: PerQuestionOptions
  ): QuestionMetrics {
    const content = pair.answer.content || '';
    const words = this.getWords(content);
    const responseLength = words.length;
    const responseLatencySec = Math.max(
      1,
      (new Date(pair.answer.timestamp).getTime() - new Date(pair.question.timestamp).getTime()) / 1000
    );

    const fillerCount = this.countMatches(content, this.FILLER_WORDS);
    const weakWordCount = this.countPhraseMatches(content, this.WEAK_WORDS);
    const starKeywordCount = this.countPhraseMatches(content, this.STAR_KEYWORDS);
    const numberCount = /\d/.test(content) ? 1 : 0;

    const wpm = Math.max(0, Math.min(220, Math.round((responseLength / responseLatencySec) * 60)));
    const tonalVariety = this.estimateCadenceVariety({
      content,
      fillerCount,
      responseLatencySec,
      overallMetrics: options.overallMetrics
    });

    const voiceConfidence = this.calculateVoiceConfidence({
      responseLength,
      responseLatencySec,
      fillerCount,
      weakWordCount,
      tonalVariety
    });

    const faceConfidence = this.calculateFaceConfidence({
      postureData: options.postureData,
      responseLatencySec,
      overallMetrics: options.overallMetrics
    });

    const hesitationLevel = Math.max(
      0,
      Math.min(100, Math.round(fillerCount * 10 + weakWordCount * 12 + Math.max(0, responseLatencySec - 8) * 4))
    );

    const contentScore = this.calculateContentScore({
      responseLength,
      starKeywordCount,
      numberCount,
      weakWordCount,
      fillerCount
    });

    const deliveryScore = this.calculateDeliveryScore({
      voiceConfidence,
      wpm,
      tonalVariety,
      fillerCount,
      responseLatencySec
    });

    const presenceScore = this.calculatePresenceScore({
      faceConfidence,
      hesitationLevel,
      postureData: options.postureData
    });

    const overallScore = Math.round(contentScore * 0.45 + deliveryScore * 0.35 + presenceScore * 0.2);

    const { strengths, weaknesses } = this.generateFeedback({
      wpm,
      fillerCount,
      weakWordCount,
      starKeywordCount,
      numberCount,
      responseLength,
      hesitationLevel,
      tonalVariety,
      postureData: options.postureData
    });

    const idealAnswer = IdealAnswerComparator.findIdealAnswer(pair.question.content);
    let idealAnswerSimilarity: number | undefined;
    let missingKeyPoints: string[] | undefined;

    if (idealAnswer) {
      const comparison = IdealAnswerComparator.compareAnswer(pair.answer.content, idealAnswer);
      idealAnswerSimilarity = comparison.similarityScore;
      missingKeyPoints = comparison.missingKeyPoints;
    }

    return {
      questionId: pair.question.id,
      questionNumber,
      questionText: pair.question.content,
      answerText: pair.answer.content,
      questionTimestamp: new Date(pair.question.timestamp),
      answerTimestamp: new Date(pair.answer.timestamp),
      contentScore,
      deliveryScore,
      presenceScore,
      overallScore,
      wpm,
      fillerWordCount: fillerCount,
      weakWordCount,
      voiceConfidence,
      tonalVariety,
      starKeywordCount,
      numberCount,
      responseLength,
      faceConfidence,
      anxietyLevel: hesitationLevel,
      dominantExpression: hesitationLevel > 45 ? 'Hesitant' : contentScore >= 75 ? 'Structured' : 'Developing',
      strengths,
      weaknesses,
      idealAnswerSimilarity,
      missingKeyPoints
    };
  }

  private static calculateContentScore({
    responseLength,
    starKeywordCount,
    numberCount,
    weakWordCount,
    fillerCount
  }: {
    responseLength: number;
    starKeywordCount: number;
    numberCount: number;
    weakWordCount: number;
    fillerCount: number;
  }): number {
    let score = 62;

    score += responseLength > 50 ? 15 : responseLength > 28 ? 8 : responseLength < 12 ? -18 : 0;
    score += starKeywordCount * 3;
    score += numberCount * 6;
    score -= weakWordCount * 4;
    score -= fillerCount * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private static calculateDeliveryScore({
    voiceConfidence,
    wpm,
    tonalVariety,
    fillerCount,
    responseLatencySec
  }: {
    voiceConfidence: number;
    wpm: number;
    tonalVariety: number;
    fillerCount: number;
    responseLatencySec: number;
  }): number {
    let score = voiceConfidence;

    if (wpm < 110 || wpm > 160) score -= 10;
    if (tonalVariety > 70) score += 6;
    if (tonalVariety < 45) score -= 8;
    score -= fillerCount * 3;
    score -= Math.max(0, responseLatencySec - 8) * 1.5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private static calculatePresenceScore({
    faceConfidence,
    hesitationLevel,
    postureData
  }: {
    faceConfidence: number;
    hesitationLevel: number;
    postureData?: PostureAnalysisData;
  }): number {
    let score = faceConfidence - hesitationLevel * 0.25;

    if (postureData?.headPosition === 'centered') score += 4;
    if (postureData?.headPosition === 'tilted') score -= 4;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private static calculateVoiceConfidence({
    responseLength,
    responseLatencySec,
    fillerCount,
    weakWordCount,
    tonalVariety
  }: {
    responseLength: number;
    responseLatencySec: number;
    fillerCount: number;
    weakWordCount: number;
    tonalVariety: number;
  }): number {
    let score = 65;

    score += responseLength >= 30 ? 8 : responseLength < 12 ? -15 : 0;
    score += responseLatencySec <= 4 ? 8 : responseLatencySec <= 8 ? 0 : -8;
    score += tonalVariety > 65 ? 4 : tonalVariety < 45 ? -4 : 0;
    score -= fillerCount * 4;
    score -= weakWordCount * 3;

    return Math.max(20, Math.min(95, Math.round(score)));
  }

  private static calculateFaceConfidence({
    postureData,
    responseLatencySec,
    overallMetrics
  }: {
    postureData?: PostureAnalysisData;
    responseLatencySec: number;
    overallMetrics?: InterviewMetrics;
  }): number {
    if (postureData) {
      const headPositionBonus = postureData.headPosition === 'centered' ? 6 : postureData.headPosition === 'forward' ? -3 : -6;
      return Math.max(
        25,
        Math.min(
          98,
          Math.round(
            postureData.overallScore * 0.55 +
            postureData.timeInGoodPosture * 0.25 +
            postureData.shoulderAlignment * 0.2 +
            headPositionBonus -
            Math.max(0, responseLatencySec - 8) * 1.2
          )
        )
      );
    }

    const fallback = overallMetrics?.presenceScore ?? 62;
    return Math.max(35, Math.min(85, Math.round(fallback - Math.max(0, responseLatencySec - 8) * 1.5)));
  }

  private static estimateCadenceVariety({
    content,
    fillerCount,
    responseLatencySec,
    overallMetrics
  }: {
    content: string;
    fillerCount: number;
    responseLatencySec: number;
    overallMetrics?: InterviewMetrics;
  }): number {
    const sentenceCount = Math.max(1, content.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean).length);
    const avgSentenceLength = this.getWords(content).length / sentenceCount;
    const sessionBaseline = overallMetrics?.tonalVariety ?? 58;

    const score = sessionBaseline * 0.4 +
      Math.min(25, avgSentenceLength * 0.7) +
      Math.min(12, sentenceCount * 3) -
      fillerCount * 2 -
      Math.max(0, responseLatencySec - 8) * 1.2;

    return Math.max(25, Math.min(95, Math.round(score)));
  }

  private static generateFeedback(data: {
    wpm: number;
    fillerCount: number;
    weakWordCount: number;
    starKeywordCount: number;
    numberCount: number;
    responseLength: number;
    hesitationLevel: number;
    tonalVariety: number;
    postureData?: PostureAnalysisData;
  }): { strengths: StrengthWeakness[]; weaknesses: StrengthWeakness[] } {
    const strengths: StrengthWeakness[] = [];
    const weaknesses: StrengthWeakness[] = [];

    if (data.wpm >= 110 && data.wpm <= 160) {
      strengths.push({
        area: 'Pacing',
        description: `Answer pace stayed healthy at ${data.wpm} WPM.`,
        severity: 'info'
      });
    } else if (data.wpm > 160) {
      weaknesses.push({
        area: 'Pacing',
        description: `${data.wpm} WPM felt rushed. Leave more room between points.`,
        severity: 'warning'
      });
    } else {
      weaknesses.push({
        area: 'Pacing',
        description: `${data.wpm} WPM felt too slow. Get to the point faster.`,
        severity: 'warning'
      });
    }

    if (data.fillerCount === 0) {
      strengths.push({
        area: 'Speech Clarity',
        description: 'No filler words showed up in this answer.',
        severity: 'info'
      });
    } else if (data.fillerCount > 2) {
      weaknesses.push({
        area: 'Filler Words',
        description: `${data.fillerCount} fillers weakened this answer's authority.`,
        severity: data.fillerCount > 5 ? 'critical' : 'warning'
      });
    }

    if (data.starKeywordCount > 0) {
      strengths.push({
        area: 'Structure',
        description: 'You framed this answer like a real story, not a loose summary.',
        severity: 'info'
      });
    } else {
      weaknesses.push({
        area: 'Structure',
        description: 'This answer needs a clearer setup, action, and result flow.',
        severity: 'warning'
      });
    }

    if (data.numberCount > 0) {
      strengths.push({
        area: 'Specificity',
        description: 'You backed the answer with concrete evidence or scope.',
        severity: 'info'
      });
    } else {
      weaknesses.push({
        area: 'Specificity',
        description: 'Add one metric or concrete outcome to make the answer more believable.',
        severity: 'warning'
      });
    }

    if (data.weakWordCount > 1) {
      weaknesses.push({
        area: 'Hedging',
        description: 'Too much soft language made this answer sound less certain than it should.',
        severity: 'warning'
      });
    }

    if (data.responseLength < 10) {
      weaknesses.push({
        area: 'Depth',
        description: 'The answer was too brief to prove judgment or impact.',
        severity: 'critical'
      });
    } else if (data.responseLength > 35) {
      strengths.push({
        area: 'Depth',
        description: 'You gave yourself enough room to show context and action.',
        severity: 'info'
      });
    }

    if (data.postureData?.overallScore && data.postureData.overallScore >= 75) {
      strengths.push({
        area: 'Presence',
        description: 'Posture stayed steady enough to support the answer.',
        severity: 'info'
      });
    }

    if (data.hesitationLevel > 40) {
      weaknesses.push({
        area: 'Hesitation',
        description: 'The answer took too long to settle. Buy time with a framing sentence instead of silence.',
        severity: 'warning'
      });
    }

    if (data.tonalVariety > 70) {
      strengths.push({
        area: 'Cadence',
        description: 'The answer had enough variation to avoid sounding flat.',
        severity: 'info'
      });
    } else if (data.tonalVariety < 45) {
      weaknesses.push({
        area: 'Cadence',
        description: 'The answer felt flat. Vary emphasis between setup, action, and result.',
        severity: 'warning'
      });
    }

    return { strengths, weaknesses };
  }

  private static calculateAverages(questions: QuestionMetrics[]) {
    const totals = questions.reduce(
      (acc, question) => ({
        content: acc.content + question.contentScore,
        delivery: acc.delivery + question.deliveryScore,
        presence: acc.presence + question.presenceScore,
        overall: acc.overall + question.overallScore
      }),
      { content: 0, delivery: 0, presence: 0, overall: 0 }
    );

    const count = questions.length;

    return {
      content: Math.round(totals.content / count),
      delivery: Math.round(totals.delivery / count),
      presence: Math.round(totals.presence / count),
      overall: Math.round(totals.overall / count)
    };
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
}
