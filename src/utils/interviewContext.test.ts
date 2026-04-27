import { describe, expect, it } from 'vitest';
import { buildVapiInterviewContext } from './interviewContext';

describe('buildVapiInterviewContext', () => {
  it('derives a role-aware technical interviewer context from JD and resume text', () => {
    const context = buildVapiInterviewContext({
      jobDescription:
        'Job Title: Senior Software Engineer. Build cloud APIs, own system design, and improve platform reliability for a fintech product.',
      resumeText:
        'Built TypeScript services, shipped React dashboards, and reduced latency by 35% for payments workflows.'
    });

    expect(context.role).toBe('Senior Software Engineer');
    expect(context.industry).toBe('Technology');
    expect(context.experienceLevel).toBe('senior');
    expect(context.category).toBe('technical');
    expect(context.variableValues.interviewer_system_prompt).toContain('Probe for constraints');
    expect(context.variableValues.role).toBe('Senior Software Engineer');
  });

  it('falls back to stable defaults when documents are thin', () => {
    const context = buildVapiInterviewContext({
      jobDescription: 'General interview practice.',
      resumeText: ''
    });

    expect(context.role).toBe('Professional Candidate');
    expect(context.industry).toBe('General');
    expect(context.experienceLevel).toBe('mid');
    expect(context.variableValues.job_description).toBe('General interview practice.');
  });
});
