import { describe, expect, it } from 'vitest';
import { buildInterviewFeedbackPrompt } from './openAIFeedback';

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
      experienceLevel: 'mid',
      jobDescription: 'Own product discovery and customer research.'
    });

    expect(prompt).toContain('Reference question numbers');
    expect(prompt).toContain('Do not invent achievements');
    expect(prompt).toContain('Concrete drill with target reps');
    expect(prompt).toContain('Analyze only candidate answers');
    expect(prompt).toContain('"whatWorked"');
    expect(prompt).toContain('"toImprove"');
    expect(prompt).toContain('Q1: Tell me about a time');
  });
});
