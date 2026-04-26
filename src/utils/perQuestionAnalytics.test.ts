import { describe, expect, it } from 'vitest';
import { PerQuestionAnalytics } from './perQuestionAnalytics';
import { InterviewMetrics, TranscriptMessage } from './analyticsEngine';

const transcript: TranscriptMessage[] = [
  {
    id: 'q1',
    role: 'assistant',
    content: 'Walk me through a project where you showed leadership.',
    timestamp: '2026-04-26T10:00:00.000Z'
  },
  {
    id: 'a1',
    role: 'user',
    content: 'I led a three-person migration from spreadsheets to a dashboard workflow. I set the plan, assigned owners, and ran weekly checkpoints. We finished two weeks early and reduced reporting mistakes by 35 percent.',
    timestamp: '2026-04-26T10:00:15.000Z'
  },
  {
    id: 'q2',
    role: 'assistant',
    content: 'What is one weakness you are still working on?',
    timestamp: '2026-04-26T10:00:36.000Z'
  },
  {
    id: 'a2',
    role: 'user',
    content: 'Maybe I sometimes overthink things and kind of wait too long before deciding.',
    timestamp: '2026-04-26T10:00:52.000Z'
  }
];

const overallMetrics: InterviewMetrics = {
  overallScore: 78,
  contentScore: 81,
  deliveryScore: 74,
  presenceScore: 77,
  avgVolume: 62,
  volumeVariance: 18,
  speechRate: 'optimal',
  wpm: 132,
  fillerWordCount: 2,
  tonalVariety: 66,
  pauseScore: 82,
  articulationScore: 84,
  interruptions: 0,
  dominantExpression: 'Structured Answers',
  anxietyLevel: 22,
  eyeContactEstimate: 76,
  timeline: [],
  strengths: [],
  weaknesses: [],
  expressionBreakdown: {},
  benchmarks: {
    content: 80,
    delivery: 78,
    presence: 75,
    overall: 78,
    roleName: 'Software Engineer'
  }
};

describe('PerQuestionAnalytics', () => {
  it('segments transcript into question-answer pairs and ranks them', () => {
    const analysis = PerQuestionAnalytics.process(transcript, {
      postureData: {
        shoulderAlignment: 80,
        headPosition: 'centered',
        overallScore: 78,
        timeInGoodPosture: 75
      },
      overallMetrics
    });

    expect(analysis.questions).toHaveLength(2);
    expect(analysis.strongestQuestion?.questionNumber).toBe(1);
    expect(analysis.weakestQuestion?.questionNumber).toBe(2);
    expect(analysis.questions[0].contentScore).toBeGreaterThan(analysis.questions[1].contentScore);
    expect(analysis.averageScores.overall).toBeGreaterThan(0);
  });

  it('returns an empty analysis when no full pairs exist', () => {
    const analysis = PerQuestionAnalytics.process([
      {
        id: 'partial',
        role: 'assistant',
        content: 'Only a question is present.',
        timestamp: '2026-04-26T10:00:00.000Z'
      }
    ]);

    expect(analysis.questions).toHaveLength(0);
    expect(analysis.strongestQuestion).toBeNull();
    expect(analysis.averageScores.overall).toBe(0);
  });
});
