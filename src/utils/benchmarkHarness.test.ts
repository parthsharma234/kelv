import { describe, expect, it } from 'vitest';
import { runScoringRegressionSuite } from './benchmarkHarness';
import { scoringRegressionFixtures } from './evaluationFixtures';

describe('runScoringRegressionSuite', () => {
  it('runs deterministic scoring fixtures through the backend pipeline', () => {
    const summary = runScoringRegressionSuite(scoringRegressionFixtures);

    expect(summary.total).toBe(scoringRegressionFixtures.length);
    expect(summary.failed).toBe(0);
    expect(summary.pass_rate).toBe(1);
    expect(summary.results.every((result) => result.result.signal_fusion)).toBe(true);
  });
});
