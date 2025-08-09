export type VoiceMetricKey =
  | 'Speech Rate'
  | 'Fluency'
  | 'Voice Confidence'
  | 'Delivery'
  | 'Clarity'
  | 'Filler Words';

interface VoiceMetricDetails {
  title: string;
  whyItMatters: string;
  howItIsMeasured: string;
  idealRange?: string;
  perceptionImpact?: string;
}

const voiceDetailsMap: Record<VoiceMetricKey, VoiceMetricDetails> = {
  'Speech Rate': {
    title: 'Speech Rate',
    whyItMatters: 'Balanced pacing improves comprehension and confidence perception.',
    howItIsMeasured: 'Estimated words per minute (WPM) derived from transcript timing and token counts.',
    idealRange: 'Approx. 140–170 WPM for interviews.',
    perceptionImpact: 'Too fast can feel anxious; too slow can feel uncertain.'
  },
  'Fluency': {
    title: 'Fluency',
    whyItMatters: 'Smooth delivery keeps attention and conveys clarity of thought.',
    howItIsMeasured: 'Temporal gaps, filler density, and restart frequency across responses.',
    idealRange: 'Higher is better; aim for consistent rhythm with minimal stalls.',
    perceptionImpact: 'Fluent delivery feels persuasive and confident.'
  },
  'Voice Confidence': {
    title: 'Voice Confidence',
    whyItMatters: 'Steady tone and projection influence perceived authority.',
    howItIsMeasured: 'Prosody features such as amplitude stability, pitch variability, and emphasis patterns (when available).',
    idealRange: 'Higher is better; aim for steady, grounded projection.',
    perceptionImpact: 'Confident tone signals credibility and poise.'
  },
  'Delivery': {
    title: 'Delivery',
    whyItMatters: 'Rhythm, emphasis, and structure affect how memorable your answers are.',
    howItIsMeasured: 'Composite of pacing consistency, prosody, and turn-level coherence.',
    idealRange: 'Higher is better; aim for consistent energy and clear emphasis.',
    perceptionImpact: 'Strong delivery elevates even simple content.'
  },
  'Clarity': {
    title: 'Clarity',
    whyItMatters: 'Clear articulation and succinct language boost understanding.',
    howItIsMeasured: 'Transcript readability, ambiguity markers, and articulation proxies.',
    idealRange: 'Higher is better; aim for concise, specific statements.',
    perceptionImpact: 'Clear speech feels professional and trustworthy.'
  },
  'Filler Words': {
    title: 'Filler Words',
    whyItMatters: 'Excessive fillers distract and reduce perceived expertise.',
    howItIsMeasured: 'Counts of common fillers (e.g., “um”, “uh”, “like”) normalized per minute.',
    idealRange: 'Lower is better; aim for minimal fillers.',
    perceptionImpact: 'Fewer fillers enhance polish and confidence.'
  }
};

export function getVoiceMetricDetails(key: VoiceMetricKey): VoiceMetricDetails {
  return voiceDetailsMap[key];
}

