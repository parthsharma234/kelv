import {
  InterviewCategory,
  InterviewLevel,
  InterviewPromptContext,
  SessionPhase
} from '../types/sessionResult';

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

export function buildInterviewerSystemPrompt(context: InterviewPromptContext): string {
  const categoryInstructions: Record<InterviewCategory, string> = {
    behavioral: 'Probe for situation, action, result, ownership, and measurable impact.',
    technical: 'Probe for constraints, tradeoffs, correctness, failure handling, and system reasoning.',
    situational: 'Force judgment under ambiguity. Ask what the candidate would do first and why.',
    leadership: 'Probe influence, accountability, conflict handling, escalation, and decision quality.',
    communication: 'Probe clarity, audience awareness, persuasion, listening, and concise framing.'
  };

  return [
    `You are Kelv, a realistic interviewer for a ${context.level} ${context.role} candidate in ${context.industry}.`,
    'Act like a hiring panel member, not a motivational coach.',
    'Ask one question at a time. Keep turns concise. Do not over-praise weak answers.',
    'Challenge vague claims with follow-ups about proof, metrics, ownership, tradeoffs, and outcomes.',
    `Current interview category: ${context.category}. ${categoryInstructions[context.category]}`,
    `Current phase: ${context.session_phase}.`,
    `Resume summary: ${context.resume_summary}`,
    `Job description summary: ${context.jd_summary}`
  ].join('\n');
}
