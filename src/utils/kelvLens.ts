import { InterviewMetrics, PostureAnalysisData } from './analyticsEngine';
import { VoiceMetrics } from '../types/interview';
import { SignalReliability, VoiceCvSignalFusion } from '../types/sessionResult';

interface KelvLensInput {
  duration: number;
  metrics: InterviewMetrics;
  voiceMetrics?: VoiceMetrics;
  postureData?: PostureAnalysisData;
  reliability: SignalReliability;
}

const ENGINE_VERSION = 'kelv-lens-v1.0.0';

export function buildKelvLensSignals({
  duration,
  metrics,
  voiceMetrics,
  postureData,
  reliability
}: KelvLensInput): VoiceCvSignalFusion {
  const audioSource: VoiceCvSignalFusion['voice']['audio_source'] = voiceMetrics ? 'recording_blob' : 'transcript_proxy';
  const voiceFlags = buildVoiceFlags(metrics, voiceMetrics);
  const visionDiagnostics = buildVisionDiagnostics(duration, postureData);
  const visionFlags = buildVisionFlags(postureData, reliability, visionDiagnostics.sampleCoverage);

  const speechRate = voiceMetrics?.speechRate || metrics.wpm;
  const fillerCount = voiceMetrics?.fillerWordCount ?? metrics.fillerWordCount;
  const paceScore = scorePace(speechRate);
  const fillerControl = clamp(100 - fillerCount * 8);
  const pauseControl = metrics.pauseScore;
  const clarityScore = clamp(voiceMetrics?.clarityScore ?? (voiceMetrics?.clarity ? voiceMetrics.clarity * 10 : metrics.articulationScore));
  const fluencyScore = clamp(voiceMetrics?.fluencyScore ?? (voiceMetrics?.fluency ? voiceMetrics.fluency * 10 : metrics.pauseScore));
  const articulationProxy = weightedAverage([
    [metrics.articulationScore, 0.55],
    [clarityScore, 0.45]
  ]);
  const vocalVarietyProxy = voiceMetrics
    ? weightedAverage([
      [voiceMetrics.deliveryScore ?? voiceMetrics.delivery * 10, 0.5],
      [voiceMetrics.voiceConfidence * 10, 0.3],
      [metrics.tonalVariety, 0.2]
    ])
    : metrics.tonalVariety;
  const voiceConfidence = weightedAverage([
    [paceScore, 0.24],
    [fillerControl, 0.22],
    [pauseControl, 0.16],
    [articulationProxy, 0.18],
    [fluencyScore, 0.1],
    [vocalVarietyProxy, 0.1]
  ]);

  const postureScore = postureData?.overallScore ?? 50;
  const shoulderAlignment = postureData?.shoulderAlignment ?? 50;
  const headCentering = postureData
    ? postureData.headPosition === 'centered'
      ? 100
      : postureData.headPosition === 'forward'
        ? 55
        : 35
    : 45;
  const visualStability = postureData?.timeInGoodPosture ?? 45;
  const visionConfidence = postureData
    ? weightedAverage([
      [postureScore, 0.42],
      [shoulderAlignment, 0.24],
      [headCentering, 0.2],
      [visualStability, 0.1],
      [visionDiagnostics.sampleCoverage * 100, 0.04]
    ])
    : 42;

  const reliabilityWeight = clamp(reliability.overall_confidence) / 100;
  const deliveryPresenceScore = Math.round(
    (voiceConfidence * 0.62 + visionConfidence * 0.38) * reliabilityWeight +
    55 * (1 - reliabilityWeight)
  );

  return {
    engine_version: ENGINE_VERSION,
    voice: {
      audio_source: audioSource,
      pace_score: Math.round(paceScore),
      filler_control: Math.round(fillerControl),
      pause_control: Math.round(pauseControl),
      articulation_proxy: Math.round(articulationProxy),
      clarity_score: Math.round(clarityScore),
      fluency_score: Math.round(fluencyScore),
      vocal_variety_proxy: Math.round(vocalVarietyProxy),
      confidence: Math.round(voiceConfidence),
      flags: voiceFlags
    },
    vision: {
      posture_score: Math.round(postureScore),
      shoulder_alignment: Math.round(shoulderAlignment),
      head_centering: Math.round(headCentering),
      visual_stability: Math.round(visualStability),
      sample_count: visionDiagnostics.sampleCount,
      sample_coverage: Number(visionDiagnostics.sampleCoverage.toFixed(2)),
      tracking_loss_rate: Number(visionDiagnostics.trackingLossRate.toFixed(2)),
      confidence: Math.round(visionConfidence),
      flags: visionFlags
    },
    fused: {
      delivery_presence_score: deliveryPresenceScore,
      interview_readiness_signal: readinessSignal(deliveryPresenceScore, reliabilityWeight),
      coaching_focus: coachingFocus({ metrics, postureData, voiceFlags, visionFlags }),
      reliability_weight: Number(reliabilityWeight.toFixed(2))
    }
  };
}

function buildVoiceFlags(metrics: InterviewMetrics, voiceMetrics?: VoiceMetrics): string[] {
  const flags: string[] = [];

  if (metrics.wpm < 110) flags.push('pace_too_slow');
  if (metrics.wpm > 160) flags.push('pace_too_fast');
  if (metrics.fillerWordCount > 5) flags.push('high_filler_load');
  if (metrics.pauseScore < 60) flags.push('pause_instability');
  if (metrics.tonalVariety < 45) flags.push('low_vocal_variety');
  if (metrics.articulationScore < 65) flags.push('articulation_risk');
  if (!voiceMetrics) flags.push('audio_blob_unavailable');
  if (voiceMetrics?.voiceConfidence && voiceMetrics.voiceConfidence < 5) flags.push('low_voice_stability');
  if (voiceMetrics?.clarityScore && voiceMetrics.clarityScore < 65) flags.push('low_audio_clarity');
  if (voiceMetrics?.fluencyScore && voiceMetrics.fluencyScore < 65) flags.push('low_audio_fluency');

  return flags;
}

function buildVisionFlags(
  postureData: PostureAnalysisData | undefined,
  reliability: SignalReliability,
  sampleCoverage: number
): string[] {
  const flags: string[] = [];

  if (!postureData) flags.push('no_pose_samples');
  if (postureData && sampleCoverage < 0.5) flags.push('low_pose_sample_coverage');
  if (postureData && postureData.overallScore < 65) flags.push('posture_drift');
  if (postureData?.headPosition === 'forward') flags.push('head_forward');
  if (postureData?.headPosition === 'tilted') flags.push('head_tilt');
  if (postureData && postureData.timeInGoodPosture < 60) flags.push('low_good_posture_time');
  if (reliability.reason_flags.includes('tracking_loss')) flags.push('tracking_loss');

  return Array.from(new Set(flags));
}

function buildVisionDiagnostics(duration: number, postureData?: PostureAnalysisData) {
  const sampleCount = postureData?.sampleCount ?? postureData?.samples?.length ?? (postureData ? 1 : 0);
  const expectedSamples = Math.max(1, Math.ceil(Math.max(duration || 1, 1) / 10));
  const sampleCoverage = clamp(sampleCount / expectedSamples, 0, 1);
  const samples = postureData?.samples || [];
  const lowConfidenceSamples = samples.filter((sample) => sample.metrics.confidence < 0.45).length;
  const trackingLossRate = samples.length > 0
    ? clamp(lowConfidenceSamples / samples.length, 0, 1)
    : postureData
      ? 0.5
      : 1;

  return {
    sampleCount,
    sampleCoverage,
    trackingLossRate
  };
}

function coachingFocus({
  metrics,
  postureData,
  voiceFlags,
  visionFlags
}: {
  metrics: InterviewMetrics;
  postureData?: PostureAnalysisData;
  voiceFlags: string[];
  visionFlags: string[];
}): string[] {
  const focus: string[] = [];

  if (voiceFlags.includes('pace_too_fast')) focus.push('Slow down and add a half-second pause before impact points.');
  if (voiceFlags.includes('pace_too_slow')) focus.push('Increase answer energy and move to the action faster.');
  if (voiceFlags.includes('high_filler_load')) focus.push('Replace filler words with silent pauses.');
  if (metrics.pauseScore < 60) focus.push('Use a framing sentence when you need time to think.');
  if (visionFlags.includes('posture_drift')) focus.push('Reset shoulders before each answer.');
  if (postureData?.headPosition !== undefined && postureData.headPosition !== 'centered') {
    focus.push('Keep head centered and camera at eye level.');
  }
  if (visionFlags.includes('no_pose_samples')) focus.push('Run the session with camera enabled for stronger presence scoring.');

  return Array.from(new Set(focus)).slice(0, 4);
}

function readinessSignal(
  deliveryPresenceScore: number,
  reliabilityWeight: number
): VoiceCvSignalFusion['fused']['interview_readiness_signal'] {
  if (reliabilityWeight < 0.55) return 'limited';
  if (deliveryPresenceScore >= 76) return 'strong';
  return 'developing';
}

function scorePace(wpm: number): number {
  if (wpm >= 110 && wpm <= 160) return 92;
  if (wpm < 110) return clamp(92 - (110 - wpm) * 0.9, 35, 92);
  return clamp(92 - (wpm - 160) * 0.8, 35, 92);
}

function weightedAverage(values: Array<[number, number]>): number {
  const totalWeight = values.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight === 0) return 0;
  return values.reduce((sum, [value, weight]) => sum + clamp(value) * weight, 0) / totalWeight;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
