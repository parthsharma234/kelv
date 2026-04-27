import { describe, expect, it } from 'vitest';
import {
  buildDeterministicInterviewFeedback,
  buildInterviewFeedbackPrompt
} from './openAIFeedback';

const transcriptPairs = [
  {
    questionNumber: 1,
    question: 'Tell me about a time you improved a process.',
    answer: 'I led a reporting workflow redesign and reduced weekly turnaround by 60 percent.'
  },
  {
    questionNumber: 2,
    question: 'What would you improve next time?',
    answer: 'I think I would communicate better and ask for feedback earlier.'
  }
];

describe('openAIFeedback coaching contract', () => {
  it('builds a prompt that forces evidence-based, drill-oriented feedback', () => {
    const prompt = buildInterviewFeedbackPrompt(transcriptPairs, {
      role: 'Product Manager',
      industry: 'Technology',
      experienceLevel: 'mid'
    });

    expect(prompt).toContain('Reference question numbers');
    expect(prompt).toContain('Do not invent achievements');
    expect(prompt).toContain('Concrete drill with target reps');
    expect(prompt).toContain('Q1: Tell me about a time');
  });

  it('returns usable deterministic feedback without an API response', () => {
    const feedback = buildDeterministicInterviewFeedback(transcriptPairs, {
      role: 'Product Manager'
    });

    expect(feedback.overallSummary).toContain('Product Manager');
    expect(feedback.questionFeedback).toHaveLength(2);
    expect(feedback.criticalImprovements.length).toBeGreaterThan(0);
    expect(feedback.nextSteps[0]).toContain('Rewrite');
  });
});
