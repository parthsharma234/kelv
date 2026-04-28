import {
  buildInterviewPromptContext,
  buildInterviewerSystemPrompt
} from './promptArchitecture';
import { InterviewCategory, InterviewLevel, InterviewPromptContext } from '../types/sessionResult';
import { InterviewBlueprint } from '../types/interviewIntelligence';
import { buildInterviewBlueprint, summarizeBlueprintForPrompt } from './interviewBlueprint';

interface InterviewContextInput {
  role?: string;
  industry?: string;
  experienceLevel?: string;
  category?: string;
  jobDescription?: string;
  resumeText?: string;
  sessionPhase?: string;
}

export interface VoiceInterviewContext {
  role: string;
  industry: string;
  experienceLevel: InterviewLevel;
  category: InterviewCategory;
  promptContext: InterviewPromptContext;
  blueprint: InterviewBlueprint;
  interviewerSystemPrompt: string;
  dynamicVariables: Record<string, string>;
  firstMessage: string;
}

const ROLE_KEYWORDS: Array<[string, string[]]> = [
  ['Software Engineer', ['software engineer', 'frontend', 'backend', 'full stack', 'developer', 'programmer']],
  ['Data Scientist', ['data scientist', 'machine learning', 'ml engineer', 'analytics', 'modeling']],
  ['Product Manager', ['product manager', 'product management', 'roadmap', 'user stories']],
  ['Financial Adviser', ['financial adviser', 'financial advisor', 'wealth advisor', 'wealth adviser', 'investment advisor', 'investment adviser']],
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

export function buildVoiceInterviewContext(input: InterviewContextInput): VoiceInterviewContext {
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
  const blueprint = buildInterviewBlueprint(promptContext);
  const interviewerSystemPrompt = buildInterviewerSystemPrompt(promptContext, blueprint);

  return {
    role: promptContext.role,
    industry: promptContext.industry,
    experienceLevel: promptContext.level,
    category: promptContext.category,
    promptContext,
    blueprint,
    interviewerSystemPrompt,
    firstMessage: buildFirstMessage(promptContext),
    dynamicVariables: {
      user_name: 'Candidate',
      role: promptContext.role,
      industry: promptContext.industry,
      experience_level: promptContext.level,
      interview_category: promptContext.category,
      session_phase: promptContext.session_phase,
      job_description: promptContext.jd_summary,
      resume: promptContext.resume_summary,
      interviewer_system_prompt: interviewerSystemPrompt,
      interview_blueprint: summarizeBlueprintForPrompt(blueprint),
      question_plan: JSON.stringify(blueprint.question_plan),
      follow_up_policy: JSON.stringify(blueprint.follow_up_policy),
      whiteboard_policy: JSON.stringify(blueprint.whiteboard_policy),
      kelv_voice_model_recommendation: 'eleven_flash_v2'
    }
  };
}

function buildFirstMessage(context: InterviewPromptContext): string {
  return [
    `Hi, I'm Kelv. We'll run this like a real ${context.role} interview.`,
    "I'll keep it to one question at a time and ask follow-ups when I need clearer evidence.",
    'To start, walk me through one experience that best shows you can do this role. What did you personally own?'
  ].join(' ');
}

function inferRole(jobDescription?: string, resumeText?: string): string {
  const explicitRole = extractExplicitRole(jobDescription);

  if (explicitRole) return explicitRole;

  const jdRole = inferRoleFromText(jobDescription);
  if (jdRole) return jdRole;

  const resumeRole = inferRoleFromText(resumeText);
  if (resumeRole) return resumeRole;

  return 'Professional Candidate';
}

function inferRoleFromText(text?: string): string | null {
  const source = normalize(text || '');
  if (!source) return null;

  for (const [role, keywords] of ROLE_KEYWORDS) {
    if (keywords.some((keyword) => source.includes(keyword))) {
      return role;
    }
  }

  return null;
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
    .replace(/\b(to join|to build|to support|to manage|to lead|who will|with experience|for our team).*$/i, '')
    .trim()
    .slice(0, 70);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}
