import { describe, expect, it } from 'vitest';
import { AnalyticsEngine, TranscriptMessage } from './analyticsEngine';

const buildTranscript = (): TranscriptMessage[] => [
  {
    id: 'q1',
    role: 'assistant',
    content: 'Tell me about a time you improved a process.',
    timestamp: '2026-04-26T10:00:00.000Z'
  },
  {
    id: 'a1',
    role: 'user',
    content: 'In my last internship, I owned a reporting workflow that was taking two days each week. I mapped the bottlenecks, automated the manual steps with Python, and cut the turnaround time by 60 percent. That let the team publish updates the same day and gave leadership cleaner weekly data.',
    timestamp: '2026-04-26T10:00:18.000Z'
  },
  {
    id: 'q2',
    role: 'assistant',
    content: 'Describe a time you handled conflict on a team.',
    timestamp: '2026-04-26T10:00:42.000Z'
  },
  {
    id: 'a2',
    role: 'user',
    content: 'Two engineers disagreed on scope. I brought both into one review, clarified the real deadline, proposed a smaller first release, and documented the tradeoffs. We shipped on time and avoided rework.',
    timestamp: '2026-04-26T10:00:56.000Z'
  }
];

describe('AnalyticsEngine', () => {
  it('scores transcript and posture data without any Hume dependency', () => {
    const metrics = AnalyticsEngine.process({
      durationSecs: 120,
      transcript: buildTranscript(),
      role: 'Software Engineer',
      postureData: {
        shoulderAlignment: 88,
        headPosition: 'centered',
        overallScore: 84,
        timeInGoodPosture: 82
      }
    });

    expect(metrics.overallScore).toBeGreaterThan(0);
    expect(metrics.contentScore).toBeGreaterThan(70);
    expect(metrics.deliveryScore).toBeGreaterThan(50);
    expect(metrics.presenceScore).toBeGreaterThan(70);
    expect(metrics.timeline.length).toBeGreaterThan(0);
    expect(metrics.benchmarks?.roleName).toBe('Software Engineer');
    expect(metrics.strengths.some((item) => item.area === 'Quantification')).toBe(true);
  });

  it('returns an empty result when no user transcript is available', () => {
    const metrics = AnalyticsEngine.process({
      durationSecs: 60,
      transcript: [
        {
          id: 'system-only',
          role: 'assistant',
          content: 'Welcome to Kelv.',
          timestamp: '2026-04-26T10:00:00.000Z'
        }
      ]
    });

    expect(metrics.overallScore).toBe(0);
    expect(metrics.weaknesses[0]?.area).toBe('Analysis Failed');
  });
});
