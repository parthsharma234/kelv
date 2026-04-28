import { SessionResultV2 } from '../types/sessionResult';

export interface SessionResultValidation {
  valid: boolean;
  errors: string[];
}

const VALID_TRANSCRIPT_ROLES = new Set(['assistant', 'user', 'system']);
const VALID_TRANSCRIPT_VENDORS = new Set(['openai', 'self_hosted_whisper', 'hybrid', 'vapi', 'elevenlabs']);

export function validateSessionResultV2(value: unknown): SessionResultValidation {
  const errors: string[] = [];
  const result = value as Partial<SessionResultV2> | null | undefined;

  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['SessionResultV2 must be an object'] };
  }

  if (!Array.isArray(result.transcript)) {
    errors.push('transcript must be an array');
  } else {
    result.transcript.forEach((entry, index) => {
      if (!VALID_TRANSCRIPT_ROLES.has(entry?.role)) {
        errors.push(`transcript[${index}].role is invalid`);
      }
      if (!entry?.content || typeof entry.content !== 'string') {
        errors.push(`transcript[${index}].content is required`);
      }
      if (!isIsoDate(entry?.timestamp)) {
        errors.push(`transcript[${index}].timestamp must be an ISO date string`);
      }
    });
  }

  if (!result.timing || typeof result.timing !== 'object') {
    errors.push('timing is required');
  } else if (!isNonNegativeNumber(result.timing.duration_sec)) {
    errors.push('timing.duration_sec must be a non-negative number');
  }

  validateScoreObject(result.overall_scores, 'overall_scores', errors);

  if (!Array.isArray(result.per_question_results)) {
    errors.push('per_question_results must be an array');
  } else {
    result.per_question_results.forEach((question, index) => {
      if (!question?.question_id) errors.push(`per_question_results[${index}].question_id is required`);
      if (!isScore(question?.content_score)) errors.push(`per_question_results[${index}].content_score must be 0-100`);
      if (!isScore(question?.delivery_score)) errors.push(`per_question_results[${index}].delivery_score must be 0-100`);
      if (!isScore(question?.presence_score)) errors.push(`per_question_results[${index}].presence_score must be 0-100`);
      if (!Array.isArray(question?.evidence_gaps)) errors.push(`per_question_results[${index}].evidence_gaps must be an array`);
      if (!question?.next_rep) errors.push(`per_question_results[${index}].next_rep is required`);
    });
  }

  if (!Array.isArray(result.recommended_drills)) {
    errors.push('recommended_drills must be an array');
  }

  if (!result.signal_reliability || typeof result.signal_reliability !== 'object') {
    errors.push('signal_reliability is required');
  } else {
    if (!isScore(result.signal_reliability.overall_confidence)) errors.push('signal_reliability.overall_confidence must be 0-100');
    if (!isScore(result.signal_reliability.content_confidence)) errors.push('signal_reliability.content_confidence must be 0-100');
    if (!isScore(result.signal_reliability.delivery_confidence)) errors.push('signal_reliability.delivery_confidence must be 0-100');
    if (!isScore(result.signal_reliability.presence_confidence)) errors.push('signal_reliability.presence_confidence must be 0-100');
    if (!Array.isArray(result.signal_reliability.reason_flags)) errors.push('signal_reliability.reason_flags must be an array');
    if (!Array.isArray(result.signal_reliability.windows)) errors.push('signal_reliability.windows must be an array');
  }

  if (result.signal_fusion) {
    if (!result.signal_fusion.engine_version) errors.push('signal_fusion.engine_version is required');
    if (!['recording_blob', 'transcript_proxy'].includes(result.signal_fusion.voice?.audio_source || '')) {
      errors.push('signal_fusion.voice.audio_source is invalid');
    }
    if (!isScore(result.signal_fusion.voice?.confidence)) errors.push('signal_fusion.voice.confidence must be 0-100');
    if (!isScore(result.signal_fusion.voice?.clarity_score)) errors.push('signal_fusion.voice.clarity_score must be 0-100');
    if (!isScore(result.signal_fusion.voice?.fluency_score)) errors.push('signal_fusion.voice.fluency_score must be 0-100');
    if (!isScore(result.signal_fusion.vision?.confidence)) errors.push('signal_fusion.vision.confidence must be 0-100');
    if (!isUnitInterval(result.signal_fusion.vision?.sample_coverage)) errors.push('signal_fusion.vision.sample_coverage must be 0-1');
    if (!isUnitInterval(result.signal_fusion.vision?.tracking_loss_rate)) errors.push('signal_fusion.vision.tracking_loss_rate must be 0-1');
    if (!isScore(result.signal_fusion.fused?.delivery_presence_score)) {
      errors.push('signal_fusion.fused.delivery_presence_score must be 0-100');
    }
    if (!['strong', 'developing', 'limited'].includes(result.signal_fusion.fused?.interview_readiness_signal || '')) {
      errors.push('signal_fusion.fused.interview_readiness_signal is invalid');
    }
    if (!Array.isArray(result.signal_fusion.fused?.coaching_focus)) {
      errors.push('signal_fusion.fused.coaching_focus must be an array');
    }
  }

  if (!result.processing_metadata || typeof result.processing_metadata !== 'object') {
    errors.push('processing_metadata is required');
  } else {
    if (!result.processing_metadata.pipeline_version) errors.push('processing_metadata.pipeline_version is required');
    if (!VALID_TRANSCRIPT_VENDORS.has(result.processing_metadata.transcript_vendor || '')) {
      errors.push('processing_metadata.transcript_vendor is invalid');
    }
    if (typeof result.processing_metadata.used_fallback !== 'boolean') {
      errors.push('processing_metadata.used_fallback must be boolean');
    }
    if (!Array.isArray(result.processing_metadata.reliability_flags)) {
      errors.push('processing_metadata.reliability_flags must be an array');
    }
    if (!result.processing_metadata.processing_source) {
      errors.push('processing_metadata.processing_source is required');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidSessionResultV2(value: unknown): asserts value is SessionResultV2 {
  const validation = validateSessionResultV2(value);
  if (!validation.valid) {
    throw new Error(`Invalid SessionResultV2: ${validation.errors.join('; ')}`);
  }
}

function validateScoreObject(
  scores: Partial<SessionResultV2['overall_scores']> | undefined,
  label: string,
  errors: string[]
): void {
  if (!scores || typeof scores !== 'object') {
    errors.push(`${label} is required`);
    return;
  }

  for (const key of ['content', 'delivery', 'presence', 'overall'] as const) {
    if (!isScore(scores[key])) {
      errors.push(`${label}.${key} must be 0-100`);
    }
  }
}

function isScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return !Number.isNaN(new Date(value).getTime());
}
