import {
  buildInterviewPromptContext,
  buildInterviewerSystemPrompt
} from './promptArchitecture';
import { InterviewCategory, InterviewLevel, InterviewPromptContext } from '../types/sessionResult';

interface InterviewContextInput {
  role?: string;
  industry?: string;
  experienceLevel?: string;
  category?: string;
  jobDescription?: string;
  resumeText?: string;
  sessionPhase?: string;
}

export interface VapiInterviewContext {
  role: string;
  industry: string;
  experienceLevel: InterviewLevel;
  category: InterviewCategory;
  promptContext: InterviewPromptContext;
  interviewerSystemPrompt: string;
  variableValues: Record<string, string>;
}

const ROLE_KEYWORDS: Array<[string, string[]]> = [
  ['Software Engineer', ['software engineer', 'frontend', 'backend', 'full stack', 'developer', 'programmer']],
  ['Data Scientist', ['data scientist', 'machine learning', 'ml engineer', 'analytics', 'modeling']],
  ['Product Manager', ['product manager', 'product management', 'roadmap', 'user stories']],
  ['UX Designer', ['ux designer', 'product designer', 'user research', 'figma']],
  ['Marketing Manager', ['marketing manager', 'campaign', 'brand', 'growth marketing']],
  ['Sales Representative', ['sales representative', 'account executive', 'pipeline', 'quota']],
  ['Business Analyst', ['business analyst', 'requirements', 'stakeholder analysis']],
  ['Project Manager', ['project manager', 'scrum master', 'delivery manager']]
];

const INDUSTRY_KEYWORDS: Array<[string, string[]]> = [
  ['Technology', ['software', 'saas', 'cloud', 'api', 'platform', 'developer', 'data']],
  ['Finance', ['finance', 'financial', 'banking', 'fintech', 'investment', 'trading']],
  ['Healthcare', ['healthcare', 'health', 'clinical', 'patient', 'medical']],
  ['Education', ['education', 'student', 'learning', 'school', 'curriculum']],
  ['Retail', ['retail', 'ecommerce', 'consumer', 'merchandising']],
  ['Consulting', ['consulting', 'client engagement', 'advisory']],
  ['Government', ['government', 'public sector', 'policy']]
];

export function buildVapiInterviewContext(input: InterviewContextInput): VapiInterviewContext {
  const role = input.role?.trim() || inferRole(input.jobDescription, input.resumeText);
  const industry = input.industry?.trim() || inferIndustry(input.jobDescription, input.resumeText);
  const experienceLevel = input.experienceLevel || inferExperienceLevel(input.jobDescription, input.resumeText);

  const promptContext = buildInterviewPromptContext({
    role,
    industry,
    experienceLevel,
    category: input.category,
    resumeText: input.resumeText,
    jobDescription: input.jobDescription,
    sessionPhase: input.sessionPhase || 'opening'
  });
  const interviewerSystemPrompt = buildInterviewerSystemPrompt(promptContext);

  return {
    role: promptContext.role,
    industry: promptContext.industry,
    experienceLevel: promptContext.level,
    category: promptContext.category,
    promptContext,
    interviewerSystemPrompt,
    variableValues: {
      user_name: 'Candidate',
      role: promptContext.role,
      industry: promptContext.industry,
      experience_level: promptContext.level,
      interview_category: promptContext.category,
      session_phase: promptContext.session_phase,
      job_description: promptContext.jd_summary,
      resume: promptContext.resume_summary,
      interviewer_system_prompt: interviewerSystemPrompt
    }
  };
}

function inferRole(jobDescription?: string, resumeText?: string): string {
  const source = normalize(`${jobDescription || ''} ${resumeText || ''}`);
  const explicitRole = extractExplicitRole(jobDescription);

  if (explicitRole) return explicitRole;

  for (const [role, keywords] of ROLE_KEYWORDS) {
    if (keywords.some((keyword) => source.includes(keyword))) {
      return role;
    }
  }

  return 'Professional Candidate';
}

function inferIndustry(jobDescription?: string, resumeText?: string): string {
  const source = normalize(`${jobDescription || ''} ${resumeText || ''}`);

  for (const [industry, keywords] of INDUSTRY_KEYWORDS) {
    if (keywords.some((keyword) => source.includes(keyword))) {
      return industry;
    }
  }

  return 'General';
}

function inferExperienceLevel(jobDescription?: string, resumeText?: string): string {
  const source = normalize(`${jobDescription || ''} ${resumeText || ''}`);

  if (/\b(executive|director|vp|vice president|head of)\b/.test(source)) return 'Executive Level';
  if (/\b(senior|staff|principal|lead|6\+|7\+|8\+|10\+)\b/.test(source)) return 'Senior Level';
  if (/\b(entry|junior|intern|new grad|0-2|0 to 2|1\+)\b/.test(source)) return 'Entry Level';

  return 'Mid Level';
}

function extractExplicitRole(jobDescription?: string): string | null {
  if (!jobDescription) return null;

  const patterns = [
    /\b(?:job title|title|role|position)\s*[:\-]\s*([^\n\r.]+)/i,
    /\bwe are (?:hiring|seeking|looking for)\s+(?:an?|the)?\s*([^\n\r.]{4,70})/i
  ];

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return cleanRole(value);
  }

  return null;
}

function cleanRole(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\b(to join|who will|with experience|for our team).*$/i, '')
    .trim()
    .slice(0, 70);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}
