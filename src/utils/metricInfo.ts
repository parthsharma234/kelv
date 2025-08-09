export type MetricKey =
  | 'lighting'
  | 'eyeContact'
  | 'facialExpressiveness'
  | 'headPositionStability'
  | 'framing'
  | 'blinkRate'
  | 'distance'
  | 'offFrame'
  | 'confidence';

interface MetricDetails {
  title: string;
  whyItMatters: string;
  howItIsMeasured: string;
  idealRange?: string;
  perceptionImpact?: string;
}

const detailsMap: Record<MetricKey, MetricDetails> = {
  lighting: {
    title: 'Lighting',
    whyItMatters:
      'Good front-facing light makes your facial expressions visible and reduces harsh shadows that can feel unprofessional.',
    howItIsMeasured:
      'We estimate average frame brightness and normalize it to a 0–1 scale, favoring even, front-facing illumination.',
    idealRange: 'Target 0.6–0.8 for natural indoor lighting without overexposure.',
    perceptionImpact: 'Clear visibility increases perceived confidence and credibility.'
  },
  eyeContact: {
    title: 'Eye Contact',
    whyItMatters:
      'Consistent eye contact signals attention and confidence, and helps build trust in interviews.',
    howItIsMeasured:
      'We analyze face center relative to the frame center. More centered alignment yields higher eye contact scores.',
    idealRange: 'Aim for > 0.7 on average.',
    perceptionImpact: 'Better eye contact improves trust and engagement.'
  },
  facialExpressiveness: {
    title: 'Facial Expressiveness',
    whyItMatters:
      'Visible expressions make your communication warmer and more engaging, avoiding a flat affect.',
    howItIsMeasured:
      'We compare frame differences within the face region across time as a proxy for micro-expressions and movement.',
    idealRange: 'Balanced: 0.4–0.7 is usually best (not static, not exaggerated).',
    perceptionImpact: 'Expressiveness supports clarity, enthusiasm, and rapport.'
  },
  headPositionStability: {
    title: 'Head Position Stability',
    whyItMatters:
      'Stable head positioning prevents distraction and conveys composure in responses.',
    howItIsMeasured:
      'We track changes of the face center across frames and reduce the score when movement is high.',
    idealRange: 'Aim for > 0.7 during answers; minor nods and emphasis are fine.',
    perceptionImpact: 'Stability reinforces perceived confidence and professionalism.'
  },
  framing: {
    title: 'Framing',
    whyItMatters:
      'Centered composition with appropriate headroom is easier to watch and feels deliberate and professional.',
    howItIsMeasured:
      'We assess offset of the face box from frame center to compute a normalized framing score.',
    idealRange: 'Keep your face centered with a little headroom (score > 0.7).',
    perceptionImpact: 'Good framing signals attention to detail and presence.'
  },
  blinkRate: {
    title: 'Blink Rate',
    whyItMatters:
      'Natural blinking is important—too little looks like staring; too much suggests stress or fatigue.',
    howItIsMeasured:
      'We estimate blink frequency using brightness changes in the eye region over time.',
    idealRange: 'Roughly 10–20 blinks/minute (score 0.4–0.8).',
    perceptionImpact: 'Natural blink rate keeps your gaze relaxed and engaging.'
  },
  distance: {
    title: 'Distance to Camera',
    whyItMatters:
      'Proper distance ensures your face is clear and proportionate, improving clarity and connection.',
    howItIsMeasured:
      'We compare the face area to the total frame area; ~10% face coverage typically looks best.',
    idealRange: '~10% of frame area (score > 0.7).',
    perceptionImpact: 'Balanced distance helps the interviewer read your expressions comfortably.'
  },
  offFrame: {
    title: 'Off-Frame Time',
    whyItMatters:
      'Leaving the frame breaks connection and can look disengaged. Stay centered to maintain presence.',
    howItIsMeasured:
      'We detect when the face box exits a central “safe zone.” Higher time off-frame lowers the score.',
    idealRange: '< 10% of the time off-frame.',
    perceptionImpact: 'Staying in frame consistently maintains attention and rapport.'
  },
  confidence: {
    title: 'Posture Confidence',
    whyItMatters:
      'Open, upright posture with squared shoulders increases perceived confidence and credibility.',
    howItIsMeasured:
      'We estimate vertical centering of the face and steadiness as a proxy for strong posture.',
    idealRange: 'Aim for > 0.7 and minimize slouching or leaning.',
    perceptionImpact: 'Confident posture supports authority and clarity.'
  }
};

export function getMetricDetails(key: MetricKey): MetricDetails {
  return detailsMap[key];
}

