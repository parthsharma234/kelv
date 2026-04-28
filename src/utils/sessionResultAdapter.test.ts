import { describe, expect, it } from 'vitest';
import { buildSessionResultV2 } from './sessionResultAdapter';
import { AnalyticsEngine, TranscriptMessage } from './analyticsEngine';
import { PerQuestionAnalytics } from './perQuestionAnalytics';

const transcript: TranscriptMessage[] = [
  {
    id: 'q1',
    role: 'assistant',
    content: 'Tell me about a time you improved a process.',
    timestamp: '2026-04-26T10:00:00.000Z'
  },
  {
    id: 'a1',
    role: 'user',
    content: 'I led a reporting workflow redesign, automated manual checks, and reduced weekly turnaround by 60 percent.',
    timestamp: '2026-04-26T10:00:12.000Z'
  },
  {
    id: 'q2',
    role: 'assistant',
    content: 'What would you improve next time?',
    timestamp: '2026-04-26T10:00:36.000Z'
  },
  {
    id: 'a2',
    role: 'user',
    content: 'Maybe I would plan better and probably ask for feedback earlier.',
    timestamp: '2026-04-26T10:00:55.000Z'
  }
];

describe('buildSessionResultV2', () => {
  it('builds a canonical session result with reliability and practice plan', () => {
    const postureData = {
      shoulderAlignment: 84,
      headPosition: 'centered' as const,
      overallScore: 82,
      timeInGoodPosture: 80
    };
    const metrics = AnalyticsEngine.process({
      durationSecs: 90,
      transcript,
      role: 'Software Engineer',
      postureData
    });
    const perQuestionAnalysis = PerQuestionAnalytics.process(transcript, {
      postureData,
      overallMetrics: metrics
    });

    const result = buildSessionResultV2({
      transcript,
      duration: 90,
      metrics,
      perQuestionAnalysis,
      postureData,
      processingSource: 'test'
    });

    expect(result.processing_metadata.pipeline_version).toContain('kelv-session-v2');
    expect(result.transcript).toHaveLength(4);
    expect(result.per_question_results).toHaveLength(2);
    expect(result.recommended_drills.length).toBeGreaterThan(0);
    expect(result.signal_reliability.overall_confidence).toBeGreaterThan(0);
    expect(result.processing_metadata.transcript_vendor).toBe('elevenlabs');
  });

  it('marks low-reliability sessions with reason flags', () => {
    const metrics = AnalyticsEngine.process({
      durationSecs: 20,
      transcript: [transcript[0], transcript[1]]
    });
    const perQuestionAnalysis = PerQuestionAnalytics.process([transcript[0], transcript[1]], {
      overallMetrics: metrics
    });

    const result = buildSessionResultV2({
      transcript: [transcript[0], transcript[1]],
      duration: 20,
      metrics,
      perQuestionAnalysis
    });

    expect(result.signal_reliability.reason_flags).toContain('short_transcript');
    expect(result.signal_reliability.reason_flags).toContain('tracking_loss');
    expect(result.processing_metadata.used_fallback).toBe(true);
  });
});
