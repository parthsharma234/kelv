import { describe, expect, it } from 'vitest';
import {
  buildInterviewerSystemPrompt,
  buildInterviewPromptContext,
  normalizeInterviewCategory,
  normalizeInterviewLevel
} from './promptArchitecture';

describe('promptArchitecture', () => {
  it('normalizes role context into a prompt contract', () => {
    const context = buildInterviewPromptContext({
      role: 'Senior Software Engineer',
      industry: 'Technology',
      experienceLevel: 'Senior',
      jobDescription: 'Own backend architecture and system reliability.',
      resumeText: 'Built distributed systems and led migrations.'
    });

    expect(context.level).toBe('senior');
    expect(context.category).toBe('technical');
    expect(context.jd_summary).toContain('backend architecture');
    expect(context.resume_summary).toContain('distributed systems');
  });

  it('builds an interviewer prompt with category-specific pressure', () => {
    const context = buildInterviewPromptContext({
      role: 'Customer Support Manager',
      industry: 'Hospitality',
      experienceLevel: 'Manager',
      category: 'leadership'
    });

    const prompt = buildInterviewerSystemPrompt(context);

    expect(prompt).toContain('experienced hiring manager who has done this hundreds of times');
    expect(prompt).toContain('genuinely evaluating whether this person can do the job');
    expect(prompt).toContain('Do not linger. Do not praise.');
    expect(prompt).toContain('WEAK ANSWERS: Be calmly direct');
    expect(prompt).toContain('"I need something more concrete');
    expect(prompt).toContain('what did you personally do?');
    expect(prompt).toContain('NEVER start a sentence with');
    expect(prompt).toContain('START: Your first message is always a human check-in');
    expect(prompt).toContain('Do not announce that you are starting the interview');
    expect(prompt).not.toContain('what part of the role are you most interested in');
    expect(prompt).toContain('Speak like a real person on a video call');
    expect(prompt).toContain('I need the actual example, not the summary version');
    expect(prompt).toContain('Do not accept hypothetical answers to behavioral questions');
    expect(prompt).toContain('BACKGROUND_ANCHOR');
    expect(prompt).toContain('leadership');
  });

  it('keeps level and category defaults deterministic', () => {
    expect(normalizeInterviewLevel('intern')).toBe('entry');
    expect(normalizeInterviewLevel('VP')).toBe('executive');
    expect(normalizeInterviewCategory(undefined, 'Account Executive')).toBe('leadership');
  });
});
