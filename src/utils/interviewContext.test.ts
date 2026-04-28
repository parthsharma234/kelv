import { describe, expect, it } from 'vitest';
import { buildVoiceInterviewContext } from './interviewContext';

describe('buildVoiceInterviewContext', () => {
  it('derives a role-aware technical interviewer context from JD and resume text', () => {
    const context = buildVoiceInterviewContext({
      jobDescription:
        'Job Title: Senior Software Engineer. Build cloud APIs, own system design, and improve platform reliability for a fintech product.',
      resumeText:
        'Built TypeScript services, shipped React dashboards, and reduced latency by 35% for payments workflows.'
    });

    expect(context.role).toBe('Senior Software Engineer');
    expect(context.industry).toBe('Technology');
    expect(context.experienceLevel).toBe('senior');
    expect(context.category).toBe('technical');
    expect(context.dynamicVariables.interviewer_system_prompt).toContain('Probe for constraints');
    expect(context.dynamicVariables.role).toBe('Senior Software Engineer');
    expect(context.blueprint.track).toBe('software_engineering');
    expect(context.blueprint.question_plan.some((question) => question.whiteboard_mode === 'system_design')).toBe(true);
  });

  it('falls back to stable defaults when documents are thin', () => {
    const context = buildVoiceInterviewContext({
      jobDescription: 'General interview practice.',
      resumeText: ''
    });

    expect(context.role).toBe('Professional Candidate');
    expect(context.industry).toBe('General');
    expect(context.experienceLevel).toBe('mid');
    expect(context.dynamicVariables.job_description).toBe('General interview practice.');
  });

  it('infers financial adviser role context from finance job descriptions', () => {
    const context = buildVoiceInterviewContext({
      jobDescription:
        'We are hiring a Financial Adviser to build client plans, explain investment tradeoffs, and support retirement planning.',
      resumeText: 'Completed finance coursework and advised student organizations on budgeting.'
    });

    expect(context.role).toBe('Financial Adviser');
    expect(context.industry).toBe('Finance');
    expect(context.firstMessage).toContain('Financial Adviser');
    expect(context.interviewerSystemPrompt).toContain('Reference the role, JD, and resume naturally');
  });
});
