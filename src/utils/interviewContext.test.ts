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
    expect(context.dynamicVariables.interviewer_system_prompt).toContain('Push on constraints, tradeoffs, and what broke');
    expect(context.dynamicVariables.role).toBe('Senior Software Engineer');
    expect(context.blueprint.track).toBe('software_engineering');
    expect(context.blueprint.question_plan.some((question) => question.whiteboard_mode === 'system_design')).toBe(true);
    expect(context.interviewerSystemPrompt).toContain('VAGUE CLAIMS');
    expect(context.firstMessage).toBe("Hi, I'm Kelv. Before we get into the interview itself, how are you doing today?");
    expect(context.interviewerSystemPrompt).toContain('START: Your first message is always a human check-in');
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
        'About the role: Experienced Financial Advisor. Build client plans, explain investment tradeoffs, and support retirement planning.',
      resumeText: 'Built React dashboards, created Figma prototypes, and shipped UX research for SaaS products.'
    });

    expect(context.role).toBe('Financial Adviser');
    expect(context.industry).toBe('Finance');
    expect(context.blueprint.track).toBe('business_finance');
    expect(context.dynamicVariables.role).toBe('Financial Adviser');
    expect(context.interviewerSystemPrompt).toContain('FINANCE / ANALYTICAL');
    expect(context.interviewerSystemPrompt).toContain('Do not accept hypothetical answers to behavioral questions');
  });

  it('lets a non-UX job description dominate a UX-heavy resume', () => {
    const context = buildVoiceInterviewContext({
      jobDescription:
        'Position: Account Executive. Own pipeline generation, run discovery with customers, manage quota, and close enterprise accounts.',
      resumeText:
        'UX Designer with deep user research experience, Figma design systems work, product design case studies, and usability testing.'
    });

    expect(context.role).toBe('Account Executive');
    expect(context.blueprint.track).toBe('sales_customer_success');
    expect(context.blueprint.track).not.toBe('ux_design');
    expect(context.promptContext.jd_summary).toContain('Account Executive');
    expect(context.promptContext.resume_summary).toContain('UX Designer');
  });

  it('uses a single JD role keyword before falling back to a UX-heavy resume', () => {
    const context = buildVoiceInterviewContext({
      jobDescription:
        'This Financial Advisor role works with clients on retirement planning, portfolio allocation, and investment tradeoffs.',
      resumeText:
        'UX Designer with user research, Figma prototypes, product design, usability testing, and design systems.'
    });

    expect(context.role).toBe('Financial Adviser');
    expect(context.blueprint.track).toBe('business_finance');
  });

  it('extracts retail store associate roles from branded job descriptions', () => {
    const context = buildVoiceInterviewContext({
      jobDescription:
        'At adidas we have been challenging the status quo. We are calling all Store Associates who want to create what will be. Use your retail experience to exceed customer expectations and be a passionate adidas Brand ambassador.',
      resumeText:
        'Marketing club member with campaign planning, social media content, and brand research experience.'
    });

    expect(context.role).toBe('Store Associate');
    expect(context.industry).toBe('Retail');
    expect(context.role).not.toBe('Marketing Manager');
    expect(context.interviewerSystemPrompt).toContain('ROLE-SPECIFIC REGISTER');
  });
});
