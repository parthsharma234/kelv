import { describe, expect, it } from 'vitest';
import { evaluatePracticePlanProgress } from './practicePlanProgress';
import { PracticePlan } from '../types/sessionResult';

const deliveryPlan: PracticePlan = {
  weak_point: 'Filler Words',
  drill_type: 'delivery-control',
  repetition_target: 2,
  completion_criteria: 'Complete 2 clean delivery reps.',
  priority: 'high'
};

describe('evaluatePracticePlanProgress', () => {
  it('marks a drill completed when enough reps meet criteria', () => {
    const progress = evaluatePracticePlanProgress(deliveryPlan, [
      {
        id: 'rep-1',
        completed_at: '2026-04-26T10:00:00.000Z',
        metrics: { wpm: 130, fillerWordCount: 1, contentScore: 70, deliveryScore: 80, presenceScore: 75 }
      },
      {
        id: 'rep-2',
        completed_at: '2026-04-26T10:05:00.000Z',
        metrics: { wpm: 145, fillerWordCount: 2, contentScore: 72, deliveryScore: 82, presenceScore: 76 }
      }
    ]);

    expect(progress.status).toBe('completed');
    expect(progress.completed_reps).toBe(2);
    expect(progress.completion_ratio).toBe(1);
  });

  it('keeps a drill in progress when reps miss criteria', () => {
    const progress = evaluatePracticePlanProgress(deliveryPlan, [
      {
        id: 'rep-1',
        completed_at: '2026-04-26T10:00:00.000Z',
        metrics: { wpm: 190, fillerWordCount: 4, contentScore: 70, deliveryScore: 60, presenceScore: 75 }
      }
    ]);

    expect(progress.status).toBe('in_progress');
    expect(progress.completed_reps).toBe(0);
    expect(progress.next_repetition_prompt).toContain('110-160 WPM');
  });
});
