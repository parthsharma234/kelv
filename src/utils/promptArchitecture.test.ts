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

    expect(prompt).toContain('hiring panel');
    expect(prompt).toContain('ownership');
    expect(prompt).toContain('leadership');
  });

  it('keeps level and category defaults deterministic', () => {
    expect(normalizeInterviewLevel('intern')).toBe('entry');
    expect(normalizeInterviewLevel('VP')).toBe('executive');
    expect(normalizeInterviewCategory(undefined, 'Account Executive')).toBe('leadership');
  });
});
