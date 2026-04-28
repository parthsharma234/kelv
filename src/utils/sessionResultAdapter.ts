import { InterviewMetrics, PostureAnalysisData, TranscriptMessage } from './analyticsEngine';
import { PerQuestionAnalysis, QuestionMetrics } from './perQuestionAnalytics';
import { buildSignalReliability, applyReliabilityAdjustment } from './signalReliability';
import { generatePracticePlan } from './practicePlan';
import { assertValidSessionResultV2, validateSessionResultV2 } from './sessionResultValidation';
import { buildKelvLensSignals } from './kelvLens';
import {
  InterviewCategory,
  QuestionEvaluation,
  SessionResultBuildInput,
  SessionResultV2
} from '../types/sessionResult';

const PIPELINE_VERSION = 'kelv-session-v2.0.0';

function isoTimestamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeTranscript(transcript: TranscriptMessage[]): SessionResultV2['transcript'] {
  return transcript
    .filter((entry) => entry && !entry.isPartial && entry.role !== 'system')
    .map((entry) => ({
      role: entry.role,
      content: entry.content,
      timestamp: isoTimestamp(entry.timestamp)
    }));
}

function inferCategory(question: QuestionMetrics): InterviewCategory | string {
  const text = `${question.questionText} ${question.answerText}`.toLowerCase();
  if (text.includes('technical') || text.includes('system') || text.includes('algorithm')) return 'technical';
  if (text.includes('lead') || text.includes('conflict') || text.includes('team')) return 'leadership';
  if (text.includes('would you') || text.includes('scenario') || text.includes('situation')) return 'situational';
  if (text.includes('explain') || text.includes('communicate')) return 'communication';
  return 'behavioral';
}

function evidenceGaps(question: QuestionMetrics): string[] {
  const gaps = question.weaknesses.map((weakness) => weakness.area);

  if (question.numberCount === 0) gaps.push('Missing measurable outcome');
  if (question.starKeywordCount === 0) gaps.push('Missing story structure');
  if (question.responseLength < 20) gaps.push('Answer too shallow');

  return Array.from(new Set(gaps)).slice(0, 4);
}

function nextRep(question: QuestionMetrics): string {
  const firstGap = evidenceGaps(question)[0];
  if (!firstGap) return 'Repeat this answer once more with the same structure and tighter ending.';
  return `Rewrite question ${question.questionNumber} with focus on: ${firstGap}.`;
}

function mapQuestionEvaluation(question: QuestionMetrics): QuestionEvaluation {
  return {
    question_id: question.questionId,
    category: inferCategory(question),
    content_score: question.contentScore,
    delivery_score: question.deliveryScore,
    presence_score: question.presenceScore,
    evidence_gaps: evidenceGaps(question),
    next_rep: nextRep(question)
  };
}

function postureSummary(postureData?: PostureAnalysisData): SessionResultV2['posture_summary'] {
  if (!postureData) return undefined;

  return {
    sample_count: postureData.sampleCount || postureData.samples?.length || 1,
    overall_score: postureData.overallScore,
    shoulder_alignment: postureData.shoulderAlignment,
    head_position: postureData.headPosition,
    time_in_good_posture: postureData.timeInGoodPosture
  };
}

export function buildSessionResultV2(input: SessionResultBuildInput): SessionResultV2 {
  const signalReliability = buildSignalReliability({
    duration: input.duration,
    transcript: input.transcript,
    metrics: input.metrics,
    postureData: input.postureData
  });

  const recommendedDrills = generatePracticePlan({
    perQuestionAnalysis: input.perQuestionAnalysis,
    metrics: input.metrics
  });
  const signalFusion = buildKelvLensSignals({
    duration: input.duration,
    metrics: input.metrics,
    voiceMetrics: input.voiceMetrics,
    postureData: input.postureData,
    reliability: signalReliability
  });

  const result: SessionResultV2 = {
    id: input.id,
    transcript: normalizeTranscript(input.transcript),
    timing: {
      duration_sec: input.duration || 0,
      speaking_rate_wpm: input.metrics.wpm,
      filler_word_count: input.metrics.fillerWordCount,
      hesitation_index: input.metrics.anxietyLevel
    },
    posture_summary: postureSummary(input.postureData),
    per_question_results: input.perQuestionAnalysis.questions.map(mapQuestionEvaluation),
    overall_scores: {
      content: applyReliabilityAdjustment(input.metrics.contentScore, signalReliability.content_confidence),
      delivery: applyReliabilityAdjustment(input.metrics.deliveryScore, signalReliability.delivery_confidence),
      presence: applyReliabilityAdjustment(input.metrics.presenceScore, signalReliability.presence_confidence),
      overall: applyReliabilityAdjustment(input.metrics.overallScore, signalReliability.overall_confidence)
    },
    recommended_drills: recommendedDrills,
    signal_reliability: signalReliability,
    signal_fusion: signalFusion,
    processing_metadata: {
      pipeline_version: PIPELINE_VERSION,
      transcript_vendor: input.transcriptVendor || 'elevenlabs',
      used_fallback: signalReliability.reason_flags.length > 0,
      reliability_flags: signalReliability.reason_flags,
      processing_source: input.processingSource || 'transcript-and-posture'
    }
  };

  assertValidSessionResultV2(result);
  return result;
}

export function extractSessionResultV2(data: any): SessionResultV2 | null {
  const result = data?.sessionResultV2 || data?.session_result_v2 || data?.session_metadata?.session_result_v2 || null;
  if (!result) return null;

  const validation = validateSessionResultV2(result);
  return validation.valid ? result : null;
}
