import { InterviewMetrics, PostureAnalysisData } from './analyticsEngine';
import { PracticePlan } from '../types/sessionResult';

export interface PracticeAttempt {
  id: string;
  completed_at: string;
  metrics: Pick<InterviewMetrics, 'wpm' | 'fillerWordCount' | 'contentScore' | 'deliveryScore' | 'presenceScore'>;
  postureData?: PostureAnalysisData;
  hasMetricOrOutcome?: boolean;
  hasStarStructure?: boolean;
  usedFramingSentence?: boolean;
}

export interface PracticePlanProgress {
  weak_point: string;
  drill_type: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_reps: number;
  required_reps: number;
  completion_ratio: number;
  evidence: string[];
  next_repetition_prompt: string;
}

export function evaluatePracticePlanProgress(
  plan: PracticePlan,
  attempts: PracticeAttempt[]
): PracticePlanProgress {
  const passingAttempts = attempts.filter((attempt) => attemptPassesDrill(plan.drill_type, attempt));
  const completedReps = Math.min(plan.repetition_target, passingAttempts.length);
  const status = completedReps >= plan.repetition_target
    ? 'completed'
    : attempts.length > 0
      ? 'in_progress'
      : 'not_started';

  return {
    weak_point: plan.weak_point,
    drill_type: plan.drill_type,
    status,
    completed_reps: completedReps,
    required_reps: plan.repetition_target,
    completion_ratio: plan.repetition_target === 0
      ? 1
      : Number((completedReps / plan.repetition_target).toFixed(2)),
    evidence: passingAttempts.map((attempt) => evidenceFor(plan.drill_type, attempt)),
    next_repetition_prompt: nextPrompt(plan, status)
  };
}

function attemptPassesDrill(drillType: string, attempt: PracticeAttempt): boolean {
  switch (drillType) {
    case 'delivery-control':
      return attempt.metrics.wpm >= 110 && attempt.metrics.wpm <= 160 && attempt.metrics.fillerWordCount <= 2;
    case 'evidence-building':
      return attempt.hasMetricOrOutcome === true || attempt.metrics.contentScore >= 78;
    case 'answer-structure':
      return attempt.hasStarStructure === true || attempt.metrics.contentScore >= 75;
    case 'presence-reset':
      return Boolean(
        attempt.postureData &&
        attempt.postureData.overallScore >= 75 &&
        attempt.postureData.headPosition === 'centered'
      );
    case 'pressure-recovery':
      return attempt.usedFramingSentence === true && attempt.metrics.deliveryScore >= 70;
    case 'focused-answer-rewrite':
      return attempt.metrics.contentScore >= 72 && attempt.metrics.deliveryScore >= 68;
    case 'baseline-session':
      return attempt.metrics.contentScore > 0 || attempt.metrics.deliveryScore > 0 || attempt.metrics.presenceScore > 0;
    default:
      return false;
  }
}

function evidenceFor(drillType: string, attempt: PracticeAttempt): string {
  switch (drillType) {
    case 'delivery-control':
      return `${attempt.metrics.wpm} WPM with ${attempt.metrics.fillerWordCount} fillers`;
    case 'presence-reset':
      return `posture ${attempt.postureData?.overallScore ?? 0}, head ${attempt.postureData?.headPosition ?? 'unknown'}`;
    case 'evidence-building':
      return `content score ${attempt.metrics.contentScore} with measurable evidence`;
    case 'answer-structure':
      return `content score ${attempt.metrics.contentScore} with structured answer`;
    case 'pressure-recovery':
      return `delivery score ${attempt.metrics.deliveryScore} with framing sentence`;
    default:
      return `content ${attempt.metrics.contentScore}, delivery ${attempt.metrics.deliveryScore}`;
  }
}

function nextPrompt(plan: PracticePlan, status: PracticePlanProgress['status']): string {
  if (status === 'completed') {
    return 'Drill complete. Run a full mock interview to confirm the skill transfers.';
  }

  switch (plan.drill_type) {
    case 'delivery-control':
      return 'Repeat the answer at 110-160 WPM with no more than 2 fillers.';
    case 'evidence-building':
      return 'Rewrite the answer with one metric, scope marker, or concrete outcome.';
    case 'answer-structure':
      return 'Answer again using situation, action, and result in that order.';
    case 'presence-reset':
      return 'Reset shoulders, center your head, then answer for 60 seconds.';
    case 'pressure-recovery':
      return 'Start with a framing sentence, then give the details.';
    default:
      return plan.completion_criteria;
  }
}
