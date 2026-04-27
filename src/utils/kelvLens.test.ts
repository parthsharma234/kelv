import { describe, expect, it } from 'vitest';
import { AnalyticsEngine, TranscriptMessage } from './analyticsEngine';
import { buildSignalReliability } from './signalReliability';
import { buildKelvLensSignals } from './kelvLens';

const transcript: TranscriptMessage[] = [
  {
    id: 'q1',
    role: 'assistant',
    content: 'Tell me about a time you handled conflict.',
    timestamp: '2026-04-26T10:00:00.000Z'
  },
  {
    id: 'a1',
    role: 'user',
    content: 'I aligned two teammates on scope, clarified the deadline, and we shipped the first release two days early.',
    timestamp: '2026-04-26T10:00:10.000Z'
  }
];

describe('buildKelvLensSignals', () => {
  it('fuses local voice and vision signals into a readiness signal', () => {
    const postureData = {
      shoulderAlignment: 88,
      headPosition: 'centered' as const,
      overallScore: 84,
      timeInGoodPosture: 86
    };
    const metrics = AnalyticsEngine.process({
      durationSecs: 60,
      transcript,
      postureData
    });
    const reliability = buildSignalReliability({
      duration: 60,
      transcript,
      metrics,
      postureData
    });

    const lens = buildKelvLensSignals({ duration: 60, metrics, postureData, reliability });

    expect(lens.engine_version).toContain('kelv-lens');
    expect(lens.voice.audio_source).toBe('transcript_proxy');
    expect(lens.voice.confidence).toBeGreaterThan(0);
    expect(lens.vision.confidence).toBeGreaterThan(0);
    expect(lens.vision.sample_count).toBe(1);
    expect(lens.fused.delivery_presence_score).toBeGreaterThan(0);
    expect(['strong', 'developing', 'limited']).toContain(lens.fused.interview_readiness_signal);
  });

  it('uses recording-backed voice metrics when available', () => {
    const metrics = AnalyticsEngine.process({
      durationSecs: 45,
      transcript
    });
    const reliability = buildSignalReliability({
      duration: 45,
      transcript,
      metrics
    });

    const lens = buildKelvLensSignals({
      duration: 45,
      metrics,
      reliability,
      voiceMetrics: {
        speechRate: 128,
        fluency: 7,
        fluencyScore: 70,
        voiceConfidence: 8,
        delivery: 7,
        deliveryScore: 70,
        clarity: 8,
        clarityScore: 80,
        fillerWordCount: 1,
        timestamp: Date.now(),
        duration: 45
      }
    });

    expect(lens.voice.audio_source).toBe('recording_blob');
    expect(lens.voice.clarity_score).toBe(80);
    expect(lens.voice.flags).not.toContain('audio_blob_unavailable');
  });

  it('flags missing CV signal without failing the voice path', () => {
    const metrics = AnalyticsEngine.process({
      durationSecs: 45,
      transcript
    });
    const reliability = buildSignalReliability({
      duration: 45,
      transcript,
      metrics
    });

    const lens = buildKelvLensSignals({ duration: 45, metrics, reliability });

    expect(lens.vision.flags).toContain('no_pose_samples');
    expect(lens.vision.flags).toContain('tracking_loss');
    expect(lens.voice.confidence).toBeGreaterThan(0);
  });
});
