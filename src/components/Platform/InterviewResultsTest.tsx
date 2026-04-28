import React from 'react';
import InterviewResults from './InterviewResults';

// Mock data representing a real complete session — Senior PM role, 3 questions
const mockMetrics = {
  overallScore: 74,
  contentScore: 81,
  deliveryScore: 68,
  presenceScore: 71,
  fillerWordCount: 8,
  wpm: 138,
  tonalVariety: 62,
  anxietyLevel: 28,
  pauseScore: 71,
  avgVolume: 68,
  volumeVariance: 32,
  speechRate: 'optimal' as const,
  articulationScore: 74,
  interruptions: 0,
  eyeContactEstimate: 72,
  dominantExpression: 'Determination',
  expressionBreakdown: {
    Determination: 42,
    Calmness: 28,
    Interest: 18,
    Anxiety: 12,
  },
  strengths: [
    { area: 'Structure', description: 'Used clear STAR framing on the cross-functional question — situation, action, and result were all present.', score: 82, severity: 'info' as const },
    { area: 'Specificity', description: 'Cited concrete numbers and outcomes in Q1 (two days early, Q4 window saved).', score: 78, severity: 'info' as const },
    { area: 'Composure', description: 'Tone stayed steady and confident throughout.', score: 74, severity: 'info' as const },
  ],
  weaknesses: [
    { area: 'Filler words', description: '"Like" and "um" appear 8 times — most concentrated in Q2 and Q3 where answers lose momentum.', score: 42, severity: 'warning' as const },
    { area: 'Weak closings', description: 'Answers trail off rather than landing on a strong outcome statement. Q3 ends with "maybe a good outcome" which undersells the result.', score: 50, severity: 'warning' as const },
    { area: 'Hedging language', description: '"Sort of", "kind of", "I think" appear in Q3 — these signal low confidence in decisions you actually owned.', score: 55, severity: 'info' as const },
  ],
  timeline: Array.from({ length: 24 }, (_, i) => ({
    timestamp: `${i * 20}s`,
    engagementScore: 60 + Math.sin(i * 0.5) * 20 + Math.random() * 10,
    confidenceScore: 58 + Math.cos(i * 0.4) * 15 + Math.random() * 12,
    faceConfidence: 0.65 + Math.sin(i * 0.3) * 0.2 + Math.random() * 0.1,
    voiceConfidence: 0.6 + Math.random() * 0.3,
    voiceEnergy: 55 + Math.random() * 35,
    dominantEmotion: i % 3 === 0 ? 'Determination' : i % 3 === 1 ? 'Calmness' : 'Interest',
    emotionIntensity: 0.5 + Math.random() * 0.4,
  })),
};

const mockTranscript = [
  { role: 'assistant' as const, content: 'Tell me about a time you led a cross-functional project under tight deadlines.', timestamp: new Date('2024-01-01T10:00:00'), isPartial: false },
  { role: 'user' as const, content: 'So um, at my last role at Acme Corp, I actually led like a three-month initiative to migrate our payment infrastructure. I coordinated with engineering, product, and legal across like five time zones. We hit every milestone and the migration went live two days early — which basically saved us the launch window for Q4.', timestamp: new Date('2024-01-01T10:01:30'), isPartial: false },
  { role: 'assistant' as const, content: "What's your approach to giving difficult feedback to a peer?", timestamp: new Date('2024-01-01T10:02:00'), isPartial: false },
  { role: 'user' as const, content: "I think the key is just being direct but not harsh. I usually open with context — like what I observed, not what I think it means — and then I ask a question to get their perspective before sharing mine. That way it becomes more of a conversation. I did this with a colleague who was consistently missing standup and it kind of cleared things up pretty quickly.", timestamp: new Date('2024-01-01T10:04:00'), isPartial: false },
  { role: 'assistant' as const, content: 'Describe a situation where you had to change your approach mid-project.', timestamp: new Date('2024-01-01T10:05:00'), isPartial: false },
  { role: 'user' as const, content: "Yeah so we were building a recommendation engine and about halfway through we realized the training data was really biased toward power users. We had to sort of pivot the whole modeling approach. I rallied the team, re-scoped the timeline, and we ended up with something that actually worked better for the 80% use case. It was stressful but maybe a good outcome.", timestamp: new Date('2024-01-01T10:07:00'), isPartial: false },
];

const mockPostureData = {
  shoulderAlignment: 82,
  headPosition: 'centered' as const,
  overallScore: 77,
  timeInGoodPosture: 71,
};

const mockJobContext = {
  role: 'Senior Product Manager',
  industry: 'Technology',
  experienceLevel: 'Senior',
};

const mockPerQuestionAnalysis = {
  questions: [
    {
      questionId: 'q1', questionNumber: 1,
      questionText: 'Tell me about a time you led a cross-functional project under tight deadlines.',
      answerText: 'So um, at my last role at Acme Corp, I actually led like a three-month initiative to migrate our payment infrastructure. I coordinated with engineering, product, and legal across like five time zones. We hit every milestone and the migration went live two days early — which basically saved us the launch window for Q4.',
      responseLength: 52, wpm: 142, fillerWordCount: 3,
      overallScore: 81, contentScore: 85, deliveryScore: 76, presenceScore: 79, tonalVariety: 68,
      strengths: [
        { area: 'STAR structure', description: 'Clear situation, task, action, and result — hiring signal is readable in one pass.' },
        { area: 'Concrete outcome', description: 'Two days early + Q4 window saved is a specific, credible result.' },
      ],
      weaknesses: [
        { area: 'Filler words', description: '"Um" and "like" appear 3 times — they slow the opening of an otherwise strong answer.', severity: 'minor' as const },
      ],
    },
    {
      questionId: 'q2', questionNumber: 2,
      questionText: "What's your approach to giving difficult feedback to a peer?",
      answerText: "I think the key is just being direct but not harsh. I usually open with context — like what I observed, not what I think it means — and then I ask a question to get their perspective before sharing mine. That way it becomes more of a conversation. I did this with a colleague who was consistently missing standup and it kind of cleared things up pretty quickly.",
      responseLength: 61, wpm: 131, fillerWordCount: 2,
      overallScore: 76, contentScore: 72, deliveryScore: 79, presenceScore: 74, tonalVariety: 71,
      strengths: [
        { area: 'Empathy framing', description: 'Leads with observation rather than judgement — shows coaching instinct.' },
        { area: 'Process clarity', description: 'The listen-first approach is described concisely and is believable.' },
      ],
      weaknesses: [
        { area: 'Vague outcome', description: '"Cleared things up pretty quickly" — what exactly changed? State the behavior that improved.', severity: 'moderate' as const },
        { area: 'Opening hedge', description: '"I think the key is" — drop the qualifier and open with the method directly.', severity: 'minor' as const },
      ],
    },
    {
      questionId: 'q3', questionNumber: 3,
      questionText: 'Describe a situation where you had to change your approach mid-project.',
      answerText: "Yeah so we were building a recommendation engine and about halfway through we realized the training data was really biased toward power users. We had to sort of pivot the whole modeling approach. I rallied the team, re-scoped the timeline, and we ended up with something that actually worked better for the 80% use case. It was stressful but maybe a good outcome.",
      responseLength: 60, wpm: 144, fillerWordCount: 3,
      overallScore: 65, contentScore: 61, deliveryScore: 68, presenceScore: 62, tonalVariety: 55,
      strengths: [
        { area: 'Adaptability', description: 'The pivot decision is described clearly and the rationale (bias toward power users) is technically credible.' },
      ],
      weaknesses: [
        { area: 'Weak closing', description: '"Maybe a good outcome" directly undercuts a strong story. State the actual impact: usage, retention, error rate — pick one.', severity: 'critical' as const },
        { area: 'Ownership language', description: '"We had to sort of pivot" — you led this. "I redirected the modeling approach because..." is more accurate and more confident.', severity: 'moderate' as const },
      ],
    },
  ],
  averageScores: { content: 73, delivery: 74, presence: 72, overall: 74 },
  strongestQuestion: null as any,
  weakestQuestion: null as any,
};
mockPerQuestionAnalysis.strongestQuestion = mockPerQuestionAnalysis.questions[0];
mockPerQuestionAnalysis.weakestQuestion = mockPerQuestionAnalysis.questions[2];

const mockSessionData = {
  metrics: mockMetrics,
  transcript: mockTranscript,
  duration: 480,
  perQuestionAnalysis: mockPerQuestionAnalysis,
  postureData: mockPostureData,
  jobContext: mockJobContext,
  voiceProvider: 'elevenlabs',
  practicePlan: [
    {
      drill_type: 'filler-reduction',
      weak_point: 'filler words under pressure',
      repetition_target: 5,
      completion_criteria: 'Less than 3 fillers per 90-second answer',
      priority: 'high' as const,
    },
    {
      drill_type: 'closing-impact',
      weak_point: 'answer endings',
      repetition_target: 3,
      completion_criteria: 'Every answer ends with a quantified outcome or named business impact',
      priority: 'medium' as const,
    },
  ],
  signalFusion: {
    voice: {
      audio_source: 'transcript_proxy',
      pace_score: 72,
      filler_control: 54,
      pause_control: 68,
      articulation_proxy: 75,
      clarity_score: 70,
      fluency_score: 66,
      flags: ['elevated_filler_rate', 'pace_in_range'],
    },
    vision: {
      posture_score: 77,
      head_centering: 82,
      visual_stability: 79,
      sample_coverage: 0.88,
      tracking_loss_rate: 0.04,
      sample_count: 214,
      flags: ['head_centered', 'shoulder_alignment_good'],
    },
    fused: {
      interview_readiness_signal: 'developing' as const,
      delivery_presence_score: 71,
      coaching_focus: [
        'Your structure and specificity are real strengths — the gap is in how you land answers.',
        'Hedging phrases ("maybe", "sort of") consistently undercut moments where you have a strong result to claim.',
        'Work on owning your decisions in the past tense: "I chose X because Y, and the result was Z."',
      ],
      reliability_weight: 0.72,
    },
  },
  signalReliability: {
    overall_confidence: 0.72,
    content_confidence: 0.81,
    delivery_confidence: 0.68,
    presence_confidence: 0.71,
    reason_flags: ['no_audio_recording', 'posture_partial'],
  },
  sessionResultV2: {
    overall_scores: { overall: 74, content: 81, delivery: 68, presence: 71 },
    signal_reliability: {
      overall_confidence: 0.72,
      content_confidence: 0.81,
      delivery_confidence: 0.68,
      presence_confidence: 0.71,
      reason_flags: ['no_audio_recording', 'posture_partial'],
    },
    signal_fusion: {
      voice: {
        audio_source: 'transcript_proxy',
        pace_score: 72,
        filler_control: 54,
        pause_control: 68,
        articulation_proxy: 75,
        clarity_score: 70,
        fluency_score: 66,
        flags: ['elevated_filler_rate'],
      },
      vision: {
        posture_score: 77,
        head_centering: 82,
        visual_stability: 79,
        sample_coverage: 0.88,
        tracking_loss_rate: 0.04,
        sample_count: 214,
        flags: ['head_centered'],
      },
      fused: {
        interview_readiness_signal: 'developing' as const,
        delivery_presence_score: 71,
        coaching_focus: [
          'Your structure and specificity are real strengths — the gap is in how you land answers.',
          'Hedging phrases ("maybe", "sort of") consistently undercut moments where you have a strong result to claim.',
          'Work on owning your decisions in the past tense: "I chose X because Y, and the result was Z."',
        ],
        reliability_weight: 0.72,
      },
    },
    recommended_drills: [
      {
        drill_type: 'filler-reduction',
        weak_point: 'filler words under pressure',
        repetition_target: 5,
        completion_criteria: 'Less than 3 fillers per 90-second answer',
        priority: 'high' as const,
      },
    ],
  },
};

const InterviewResultsTest: React.FC = () => (
  <InterviewResults
    sessionData={mockSessionData as any}
    onBack={() => window.history.back()}
  />
);

export default InterviewResultsTest;
