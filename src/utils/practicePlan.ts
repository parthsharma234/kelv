import { PerQuestionAnalysis, QuestionMetrics } from './perQuestionAnalytics';
import { InterviewMetrics, StrengthWeakness } from './analyticsEngine';
import { PracticePlan } from '../types/sessionResult';

interface PracticePlanInput {
  perQuestionAnalysis: PerQuestionAnalysis;
  metrics: InterviewMetrics;
  priorWeaknesses?: string[];
}

function normalizeWeakness(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function pickPrimaryGap(question: QuestionMetrics | null, metrics: InterviewMetrics): StrengthWeakness | null {
  const questionWeakness = question?.weaknesses?.[0];
  if (questionWeakness) return questionWeakness;
  return metrics.weaknesses?.[0] || null;
}

function mapGapToDrillType(gap: string): string {
  const normalized = normalizeWeakness(gap);
  if (normalized.includes('pace') || normalized.includes('filler') || normalized.includes('cadence')) return 'delivery-control';
  if (normalized.includes('proof') || normalized.includes('specific') || normalized.includes('quant')) return 'evidence-building';
  if (normalized.includes('structure') || normalized.includes('depth')) return 'answer-structure';
  if (normalized.includes('presence') || normalized.includes('posture')) return 'presence-reset';
  if (normalized.includes('recovery') || normalized.includes('hesitation')) return 'pressure-recovery';
  return 'focused-answer-rewrite';
}

function completionCriteria(drillType: string): string {
  const criteria: Record<string, string> = {
    'delivery-control': 'Complete 3 answers at 110-160 WPM with 2 or fewer filler words each.',
    'evidence-building': 'Rewrite 3 answers with one metric, scope marker, or concrete outcome in each.',
    'answer-structure': 'Complete 3 STAR answers with clear situation, action, and result.',
    'presence-reset': 'Complete 2 timed answers with posture score above 75 and centered head position.',
    'pressure-recovery': 'Answer 3 follow-ups using a framing sentence before details.',
    'focused-answer-rewrite': 'Rewrite the weakest answer into a concise 60-90 second version.'
  };

  return criteria[drillType] || criteria['focused-answer-rewrite'];
}

export function generatePracticePlan({
  perQuestionAnalysis,
  metrics,
  priorWeaknesses = []
}: PracticePlanInput): PracticePlan[] {
  const weakestQuestion = perQuestionAnalysis.weakestQuestion;
  const primaryGap = pickPrimaryGap(weakestQuestion, metrics);

  if (!primaryGap) {
    return [{
      weak_point: 'Build a complete baseline',
      drill_type: 'baseline-session',
      repetition_target: 1,
      completion_criteria: 'Run one full interview with at least 3 complete question-answer pairs.',
      priority: 'medium'
    }];
  }

  const repeatedGap = priorWeaknesses
    .map(normalizeWeakness)
    .includes(normalizeWeakness(primaryGap.area));
  const drillType = mapGapToDrillType(primaryGap.area);

  return [{
    weak_point: primaryGap.area,
    drill_type: drillType,
    repetition_target: repeatedGap ? 5 : 3,
    completion_criteria: completionCriteria(drillType),
    source_question_id: weakestQuestion?.questionId,
    source_question_number: weakestQuestion?.questionNumber,
    priority: primaryGap.severity === 'critical' || repeatedGap ? 'high' : 'medium'
  }];
}
