import {
  InterviewCategory,
  InterviewLevel,
  InterviewPromptContext,
  SessionPhase
} from '../types/sessionResult';
import { InterviewBlueprint } from '../types/interviewIntelligence';
import { summarizeBlueprintForPrompt } from './interviewBlueprint';

interface PromptContextInput {
  role?: string;
  industry?: string;
  experienceLevel?: string;
  category?: string;
  resumeText?: string;
  jobDescription?: string;
  sessionPhase?: string;
}

const CATEGORY_KEYWORDS: Array<[InterviewCategory, string[]]> = [
  ['coding', ['coding', 'algorithm', 'data structure', 'leetcode']],
  ['system_design', ['system design', 'distributed', 'architecture', 'scalability']],
  ['data_case', ['data scientist', 'machine learning', 'analytics', 'experiment', 'model']],
  ['product_case', ['product manager', 'roadmap', 'product sense', 'metrics', 'prioritization']],
  ['resume_deep_dive', ['resume', 'background', 'experience']],
  ['technical', ['software', 'engineer', 'developer', 'data', 'system', 'technical', 'architecture']],
  ['leadership', ['lead', 'manager', 'director', 'executive', 'principal']],
  ['situational', ['customer', 'support', 'operations', 'service', 'hospitality']],
  ['communication', ['sales', 'marketing', 'account', 'client', 'presentation']],
  ['behavioral', []]
];

export function normalizeInterviewLevel(value?: string): InterviewLevel {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('executive') || normalized.includes('director') || normalized.includes('vp')) return 'executive';
  if (normalized.includes('senior') || normalized.includes('lead') || normalized.includes('principal')) return 'senior';
  if (normalized.includes('entry') || normalized.includes('junior') || normalized.includes('intern')) return 'entry';
  return 'mid';
}

export function normalizeInterviewCategory(value?: string, role?: string): InterviewCategory {
  const normalized = `${value || ''} ${role || ''}`.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return 'behavioral';
}

export function normalizeSessionPhase(value?: string): SessionPhase {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('calibration')) return 'calibration';
  if (normalized.includes('pressure')) return 'pressure';
  if (normalized.includes('candidate')) return 'candidate_questions';
  if (normalized.includes('close')) return 'close';
  if (normalized.includes('opening')) return 'opening';
  return 'core';
}

export function summarizeContext(text?: string, maxChars = 900): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Not provided';
  return clean.length > maxChars ? `${clean.slice(0, maxChars - 3)}...` : clean;
}

export function buildInterviewPromptContext(input: PromptContextInput): InterviewPromptContext {
  const role = input.role?.trim() || 'General Candidate';
  const industry = input.industry?.trim() || 'General';

  return {
    role,
    industry,
    level: normalizeInterviewLevel(input.experienceLevel),
    category: normalizeInterviewCategory(input.category, role),
    resume_summary: summarizeContext(input.resumeText),
    jd_summary: summarizeContext(input.jobDescription),
    session_phase: normalizeSessionPhase(input.sessionPhase)
  };
}

export function buildInterviewerSystemPrompt(context: InterviewPromptContext, blueprint?: InterviewBlueprint): string {
  const categoryInstructions: Record<InterviewCategory, string> = {
    behavioral: 'Probe for situation, action, result, ownership, and measurable impact.',
    technical: 'Probe for constraints, tradeoffs, correctness, failure handling, and system reasoning.',
    technical_depth: 'Probe for technical depth, root causes, alternatives, validation, and production tradeoffs.',
    coding: 'Ask the candidate to reason out loud about approach, edge cases, complexity, and tests before finalizing.',
    system_design: 'Require requirements, scale assumptions, API/data model, architecture, bottlenecks, and tradeoffs.',
    product_case: 'Require goal, user segment, options, prioritization criteria, metrics, and risks.',
    data_case: 'Require question framing, data requirements, method, validation, caveats, and business readout.',
    situational: 'Force judgment under ambiguity. Ask what the candidate would do first and why.',
    leadership: 'Probe influence, accountability, conflict handling, escalation, and decision quality.',
    communication: 'Probe clarity, audience awareness, persuasion, listening, and concise framing.',
    resume_deep_dive: 'Probe claims on the resume until ownership, scope, artifacts, and outcomes are clear.',
    company_fit: 'Probe motivation, role understanding, first-90-day thinking, and company awareness.',
    candidate_questions: 'Answer concisely as an interviewer, then ask whether the candidate has another question.'
  };

  const basePrompt = [
    `You are Kelv, a realistic interviewer for a ${context.level} ${context.role} candidate in ${context.industry}.`,
    'Act like a hiring panel member, but speak like a real person instead of reading a script.',
    'Sound like a thoughtful human interviewer: calm, direct, conversational, and a little warm. Do not sound like a script.',
    'Use natural phrasing, contractions when appropriate, and short transitions like "Got it", "That helps", or "Let me push on that".',
    'Reference the role, JD, and resume naturally. Avoid generic interview questions when the candidate context gives you a sharper angle.',
    'Avoid stiff phrases like "excellent response" or "thank you for sharing" unless the candidate actually gave a strong answer.',
    'Ask one question at a time. Keep turns concise. Do not over-praise weak answers or repeat the interview rules.',
    'Do not interrupt after a few words. Wait for a complete answer before moving on unless the candidate clearly stops.',
    'If the transcript looks like a tiny fragment such as "uh", "yes", "I", or one incomplete phrase, treat it as partial audio and wait.',
    'If the transcript is "...", ".", punctuation-only, or clearly not an answer, do not advance the interview. Wait for the candidate or ask them to repeat once.',
    'Challenge vague claims with follow-ups about proof, metrics, ownership, tradeoffs, and outcomes.',
    'Use structured-interview discipline: ask planned lead questions, use consistent probes, and evaluate against evidence instead of vibes.',
    'Adapt follow-ups to answer quality. If the candidate is vague, ask for evidence. If the candidate is strong, raise difficulty or move to the next competency.',
    'For technical, case, architecture, or data questions, invite the candidate to use the whiteboard when visual reasoning would help.',
    `Current interview category: ${context.category}. ${categoryInstructions[context.category]}`,
    `Current phase: ${context.session_phase}.`,
    `Resume summary: ${context.resume_summary}`,
    `Job description summary: ${context.jd_summary}`
  ];

  if (blueprint) {
    basePrompt.push('Interview blueprint:', summarizeBlueprintForPrompt(blueprint));
  }

  return basePrompt.join('\n');
}
