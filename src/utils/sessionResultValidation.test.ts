import { describe, expect, it } from 'vitest';
import { validateSessionResultV2 } from './sessionResultValidation';
import { SessionResultV2 } from '../types/sessionResult';

const validResult: SessionResultV2 = {
  transcript: [
    {
      role: 'assistant',
      content: 'Tell me about a project.',
      timestamp: '2026-04-26T10:00:00.000Z'
    },
    {
      role: 'user',
      content: 'I shipped a dashboard and improved activation by 18%.',
      timestamp: '2026-04-26T10:00:12.000Z'
    }
  ],
  timing: {
    duration_sec: 90,
    speaking_rate_wpm: 135,
    filler_word_count: 2,
    hesitation_index: 12
  },
  per_question_results: [
    {
      question_id: 'q1',
      category: 'behavioral',
      content_score: 78,
      delivery_score: 72,
      presence_score: 80,
      evidence_gaps: [],
      next_rep: 'Repeat with a tighter ending.'
    }
  ],
  overall_scores: {
    content: 78,
    delivery: 72,
    presence: 80,
    overall: 77
  },
  recommended_drills: [],
  signal_reliability: {
    overall_confidence: 80,
    content_confidence: 90,
    delivery_confidence: 70,
    presence_confidence: 70,
    reason_flags: [],
    windows: []
  },
  processing_metadata: {
    pipeline_version: 'kelv-session-v2.0.0',
    transcript_vendor: 'vapi',
    used_fallback: false,
    reliability_flags: [],
    processing_source: 'test'
  }
};

describe('validateSessionResultV2', () => {
  it('accepts a complete SessionResultV2 payload', () => {
    const validation = validateSessionResultV2(validResult);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('rejects invalid score and metadata payloads', () => {
    const invalid = {
      ...validResult,
      overall_scores: {
        ...validResult.overall_scores,
        overall: 140
      },
      processing_metadata: {
        ...validResult.processing_metadata,
        transcript_vendor: 'hume'
      }
    };

    const validation = validateSessionResultV2(invalid);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('overall_scores.overall must be 0-100');
    expect(validation.errors).toContain('processing_metadata.transcript_vendor is invalid');
  });
});
