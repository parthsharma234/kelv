import { PostureAnalysisData, TranscriptMessage } from './analyticsEngine';

export interface ScoringRegressionFixture {
  id: string;
  label: string;
  role: string;
  durationSecs: number;
  transcript: TranscriptMessage[];
  postureData?: PostureAnalysisData;
  expected: {
    minOverall: number;
    maxOverall: number;
    requiredReliabilityFlags?: string[];
    requiredDrillTypes?: string[];
  };
}

export const scoringRegressionFixtures: ScoringRegressionFixture[] = [
  {
    id: 'strong-behavioral-proof',
    label: 'Strong behavioral answer with quantified proof',
    role: 'Product Manager',
    durationSecs: 110,
    transcript: [
      {
        id: 'q1',
        role: 'assistant',
        content: 'Tell me about a time you influenced a team without authority.',
        timestamp: '2026-04-26T10:00:00.000Z'
      },
      {
        id: 'a1',
        role: 'user',
        content:
          'In my last project, two teams disagreed on launch scope. I set up a 30 minute tradeoff review, mapped customer impact against engineering cost, and proposed a phased release. We launched the highest-impact workflow first and reduced support tickets by 22 percent in the first month.',
        timestamp: '2026-04-26T10:00:16.000Z'
      },
      {
        id: 'q2',
        role: 'assistant',
        content: 'What would you do differently?',
        timestamp: '2026-04-26T10:01:00.000Z'
      },
      {
        id: 'a2',
        role: 'user',
        content:
          'I would bring customer success into the review earlier. That would have helped us prioritize the rollout messaging before the launch date.',
        timestamp: '2026-04-26T10:01:12.000Z'
      }
    ],
    postureData: {
      shoulderAlignment: 88,
      headPosition: 'centered',
      overallScore: 84,
      timeInGoodPosture: 86
    },
    expected: {
      minOverall: 65,
      maxOverall: 92
    }
  },
  {
    id: 'thin-answer-no-proof',
    label: 'Thin answer with no measurable proof',
    role: 'Software Engineer',
    durationSecs: 45,
    transcript: [
      {
        id: 'q1',
        role: 'assistant',
        content: 'Describe a technical challenge you solved.',
        timestamp: '2026-04-26T10:00:00.000Z'
      },
      {
        id: 'a1',
        role: 'user',
        content: 'I had a bug and I fixed it. It was kind of hard but I figured it out.',
        timestamp: '2026-04-26T10:00:18.000Z'
      }
    ],
    expected: {
      minOverall: 35,
      maxOverall: 68,
      requiredReliabilityFlags: ['short_transcript', 'tracking_loss'],
      requiredDrillTypes: ['answer-structure', 'evidence-building', 'focused-answer-rewrite']
    }
  },
  {
    id: 'delivery-drift',
    label: 'Good content with rushed delivery and posture drift',
    role: 'Sales Representative',
    durationSecs: 55,
    transcript: [
      {
        id: 'q1',
        role: 'assistant',
        content: 'How do you handle a skeptical customer?',
        timestamp: '2026-04-26T10:00:00.000Z'
      },
      {
        id: 'a1',
        role: 'user',
        content:
          'I start by asking what feels risky, then I repeat the concern back and show the exact proof point that maps to it. In one pilot I used call data and implementation timelines to unblock a buyer, which helped us close a six figure renewal.',
        timestamp: '2026-04-26T10:00:09.000Z'
      }
    ],
    postureData: {
      shoulderAlignment: 54,
      headPosition: 'forward',
      overallScore: 50,
      timeInGoodPosture: 34
    },
    expected: {
      minOverall: 48,
      maxOverall: 84,
      requiredReliabilityFlags: ['short_transcript']
    }
  }
];
