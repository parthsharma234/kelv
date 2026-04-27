import { InterviewMetrics, PostureAnalysisData, TranscriptMessage } from './analyticsEngine';
import { SignalReliability } from '../types/sessionResult';

interface ReliabilityInput {
  duration: number;
  transcript: TranscriptMessage[];
  metrics: InterviewMetrics;
  postureData?: PostureAnalysisData;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function flagUnique(flags: string[]) {
  return Array.from(new Set(flags));
}

export function buildSignalReliability(input: ReliabilityInput): SignalReliability {
  const transcript = input.transcript.filter((entry) => entry && !entry.isPartial);
  const userMessages = transcript.filter((entry) => entry.role === 'user');
  const userWordCount = userMessages.reduce((sum, entry) => sum + entry.content.trim().split(/\s+/).filter(Boolean).length, 0);
  const flags: string[] = [];

  if (transcript.length < 4) flags.push('short_transcript');
  if (userWordCount < 40) flags.push('short_utterance');
  if (!input.postureData) flags.push('tracking_loss');
  if (input.metrics.wpm === 0) flags.push('speech_timing_missing');
  if (input.metrics.pauseScore < 45) flags.push('unstable_timing');
  if (input.postureData && input.postureData.overallScore < 45) flags.push('low_presence_signal');

  const contentConfidence = clamp(55 + Math.min(35, userWordCount / 3) - (transcript.length < 4 ? 20 : 0));
  const deliveryConfidence = clamp(
    76 -
    (input.metrics.wpm === 0 ? 30 : 0) -
    (input.metrics.pauseScore < 45 ? 16 : 0) -
    (input.metrics.fillerWordCount > 12 ? 8 : 0)
  );
  const presenceConfidence = input.postureData
    ? clamp(45 + input.postureData.overallScore * 0.45 + input.postureData.timeInGoodPosture * 0.2)
    : 42;

  const overallConfidence = Math.round(
    contentConfidence * 0.45 +
    deliveryConfidence * 0.35 +
    presenceConfidence * 0.2
  );

  const duration = Math.max(1, input.duration || 1);
  const windowSize = 30;
  const windows = Array.from({ length: Math.max(1, Math.ceil(duration / windowSize)) }, (_, index) => {
    const start = index * windowSize;
    const end = Math.min(duration, start + windowSize);
    const windowFlags = index === 0 && flags.includes('short_transcript') ? ['short_transcript'] : [];

    return {
      window_id: `w${index + 1}`,
      start_sec: start,
      end_sec: end,
      confidence: Math.max(0, Math.min(100, overallConfidence - windowFlags.length * 8)),
      reason_flags: windowFlags
    };
  });

  return {
    overall_confidence: overallConfidence,
    content_confidence: Math.round(contentConfidence),
    delivery_confidence: Math.round(deliveryConfidence),
    presence_confidence: Math.round(presenceConfidence),
    reason_flags: flagUnique(flags),
    windows
  };
}

export function applyReliabilityAdjustment(score: number, confidence: number): number {
  const reliabilityWeight = clamp(confidence, 35, 100) / 100;
  const conservativeBaseline = 55;
  return Math.round(score * reliabilityWeight + conservativeBaseline * (1 - reliabilityWeight));
}
