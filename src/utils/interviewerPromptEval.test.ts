import { describe, expect, it } from 'vitest';
import { runDefaultPromptSmokeEval } from './interviewerPromptEval';

describe('interviewer prompt smoke eval', () => {
  it('passes realistic role, opening, pushback, and whiteboard prompt scenarios', () => {
    const results = runDefaultPromptSmokeEval();
    const failures = results.flatMap((result) =>
      result.failures.map((failure) => `${result.name}: ${failure}`)
    );

    expect(failures).toEqual([]);
    expect(results.map((result) => result.role)).toContain('Store Associate');
    expect(results.map((result) => result.role)).toContain('Account Executive');
    expect(results.map((result) => result.role)).toContain('Senior Software Engineer');
  });
});
