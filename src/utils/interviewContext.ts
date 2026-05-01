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
  ['Store Associate', ['store associate', 'store associates', 'retail associate', 'retail sales associate', 'retail experience', 'customer expectations', 'brand ambassador']],
  ['Software Engineer', ['software engineer', 'frontend', 'backend', 'full stack', 'developer', 'programmer']],
  ['Data Scientist', ['data scientist', 'machine learning', 'ml engineer', 'analytics', 'modeling']],
  ['Product Manager', ['product manager', 'product management', 'roadmap', 'user stories']],
  ['Financial Adviser', ['financial adviser', 'financial advisor', 'wealth advisor', 'wealth adviser', 'investment advisor', 'investment adviser']],
  ['UX Designer', ['ux designer', 'product designer', 'user research', 'figma']],
  ['Marketing Manager', ['marketing manager', 'marketing campaign', 'campaign strategy', 'brand marketing', 'growth marketing']],
  ['Sales Representative', ['sales representative', 'account executive', 'pipeline', 'quota']],
  ['Business Analyst', ['business analyst', 'requirements', 'stakeholder analysis']],
  ['Project Manager', ['project manager', 'scrum master', 'delivery manager']]
];

const INDUSTRY_KEYWORDS: Array<[string, string[]]> = [
  ['Technology', ['software', 'saas', 'cloud', 'api', 'platform', 'developer', 'data']],
  ['Finance', ['finance', 'financial', 'banking', 'fintech', 'investment', 'trading']],
  ['Healthcare', ['healthcare', 'health', 'clinical', 'patient', 'medical']],
  ['Education', ['education', 'student', 'learning', 'school', 'curriculum']],
  ['Retail', ['retail', 'store', 'stores', 'customer', 'customers', 'consumer', 'merchandising', 'brand ambassador']],
  ['Consulting', ['consulting', 'client engagement', 'advisory']],
  ['Government', ['government', 'public sector', 'policy']]
];

export function buildVoiceInterviewContext(input: InterviewContextInput): VoiceInterviewContext {
  const role = input.role?.trim() || inferRole(input.jobDescription, input.resumeText);
  const industry = input.industry?.trim() || inferIndustry(input.jobDescription, input.resumeText, role);
  const experienceLevel = input.experienceLevel || inferExperienceLevel(input.jobDescription, input.resumeText);
  const company = extractCompany(input.jobDescription);
  const resumeHighlights = extractResumeHighlights(input.resumeText);

  const promptContext = buildInterviewPromptContext({
    role,
    industry,
    experienceLevel,
    category: input.category,
    resumeText: input.resumeText,
    jobDescription: input.jobDescription,
    sessionPhase: input.sessionPhase || 'opening',
    company,
    resumeHighlights
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
      company: promptContext.company || '',
      job_description: promptContext.jd_summary,
      resume: promptContext.resume_summary,
      resume_highlights: promptContext.resume_highlights || '',
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
    "Hi, I'm Kelv.",
    "Before we get into the interview itself, how are you doing today?"
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

function inferRoleFromText(text?: string, minimumScore = 1): string | null {
  const source = normalize(text || '');
  if (!source) return null;

  let bestMatch: { role: string; score: number } | null = null;

  for (const [role, keywords] of ROLE_KEYWORDS) {
    const score = keywords.reduce((total, keyword) => total + countKeywordMatches(source, keyword), 0);
    if (score >= minimumScore && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { role, score };
    }
  }

  return bestMatch?.role || null;
}

function inferIndustry(jobDescription?: string, resumeText?: string, role?: string): string {
  const jdIndustry = inferIndustryFromText(`${role || ''} ${jobDescription || ''}`);
  if (jdIndustry) return jdIndustry;

  const resumeIndustry = inferIndustryFromText(resumeText);
  if (resumeIndustry) return resumeIndustry;

  return 'General';
}

function inferIndustryFromText(text?: string): string | null {
  const source = normalize(text || '');
  if (!source) return null;

  let bestMatch: { industry: string; score: number } | null = null;

  for (const [industry, keywords] of INDUSTRY_KEYWORDS) {
    const score = keywords.reduce((total, keyword) => total + countKeywordMatches(source, keyword), 0);
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { industry, score };
    }
  }

  return bestMatch?.industry || null;
}

function inferExperienceLevel(jobDescription?: string, resumeText?: string): string {
  const jdLevel = inferExperienceLevelFromText(jobDescription);
  if (jdLevel) return jdLevel;

  return inferExperienceLevelFromText(resumeText) || 'Mid Level';
}

function inferExperienceLevelFromText(text?: string): string | null {
  const source = normalize(text || '');
  if (!source) return null;

  if (/\b(executive|director|vp|vice president|head of)\b/.test(source)) return 'Executive Level';
  if (/\b(senior|staff|principal|lead|6\+|7\+|8\+|10\+)\b/.test(source)) return 'Senior Level';
  if (/\b(entry|junior|intern|new grad|0-2|0 to 2|1\+)\b/.test(source)) return 'Entry Level';

  return null;
}

function extractExplicitRole(jobDescription?: string): string | null {
  if (!jobDescription) return null;

  const patterns = [
    /\bcalling all\s+([A-Z][A-Za-z/&\-\s]{3,70}?)(?:\s+who|\s+that|\s+to|\s*$)/i,
    /\bkind of\s+([A-Z][A-Za-z/&\-\s]{3,70}?)\s+we are looking for/i,
    /^\s*([A-Z][A-Za-z/&\-\s]{3,70})\s+(?:job description|role description|position overview)\b/im,
    /\b(?:job title|title|role|position|opening)\s*[:\-]\s*([^\n\r.]+)/i,
    /\b(?:about the role|about this role|the opportunity)\s*[:\-]\s*([^\n\r.]+)/i,
    /\b(?:we|we're|we are|our team is|the company is)\s+(?:currently\s+)?(?:hiring|seeking|looking for|recruiting)\s+(?:an?|the)?\s*([^\n\r.]{4,90})/i
  ];

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    const value = match?.[1]?.trim();
    if (!value) continue;

    const role = cleanRole(value);
    if (role) return role;
  }

  return null;
}

function cleanRole(value: string): string {
  const cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/^(?:an?|the)\s+/i, '')
    .replace(/^(?:experienced|qualified|skilled|talented|motivated|customer-facing|client-facing|all)\s+/i, '')
    .replace(/\b(to join|to build|to support|to manage|to lead|who will|with experience|for our team).*$/i, '')
    .trim()
    .slice(0, 70);

  const canonicalAlias = canonicalizeExactKnownRole(cleaned);
  if (canonicalAlias) return canonicalAlias;
  if (isCleanTitle(cleaned)) return cleaned;

  return canonicalizeKnownRole(cleaned) || cleaned;
}

function isCleanTitle(value: string): boolean {
  return /^[A-Z][A-Za-z/&-]*(?:\s+[A-Z][A-Za-z/&-]*){0,5}$/.test(value);
}

function canonicalizeKnownRole(value: string): string | null {
  const source = normalize(value);
  for (const [role, keywords] of ROLE_KEYWORDS) {
    if (keywords.some((keyword) => source.includes(keyword))) {
      return role;
    }
  }

  return null;
}

function canonicalizeExactKnownRole(value: string): string | null {
  const source = normalize(value);
  for (const [role, keywords] of ROLE_KEYWORDS) {
    if (role === 'Store Associate' && ['store associate', 'store associates'].includes(source)) {
      return role;
    }
    if (role === 'Financial Adviser' && keywords.some((keyword) => source === keyword) && source !== normalize(role)) {
      return role;
    }
  }

  return null;
}

function countKeywordMatches(source: string, keyword: string): number {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return source.match(new RegExp(`\\b${escapedKeyword}\\b`, 'g'))?.length || 0;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function extractCompany(jobDescription?: string): string | undefined {
  if (!jobDescription?.trim()) return undefined;

  const patterns = [
    // "at adidas we are..." / "here at CVS..."
    /\b(?:here\s+at|at)\s+([A-Z][A-Za-z0-9&.\s'-]{1,40}?)(?:\s+we|\s+you|\s+our|\s*,|\s*\.)/i,
    // "CVS Health is looking for..."
    /^([A-Z][A-Za-z0-9&.\s'-]{1,40}?)\s+(?:is\s+)?(?:hiring|looking|seeking|recruiting)/m,
    // "Job Title at CompanyName" or "Role — CompanyName"
    /(?:at|@)\s+([A-Z][A-Za-z0-9&.\s'-]{1,40}?)(?:\s*[,\n]|\s+is|\s+we|\s*$)/m,
    // "[Company] believes / [Company] offers / [Company] provides"
    /^([A-Z][A-Za-z0-9&.'-]{1,30})\s+(?:believes|offers|provides|is a|was founded|operates)/m,
  ];

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    const raw = match?.[1]?.trim();
    if (!raw || raw.length < 2) continue;
    // Filter out generic words that aren't company names
    const lower = raw.toLowerCase();
    if (/^(the|our|we|this|a|an|your|that|which|who|all|every|each)$/i.test(raw)) continue;
    if (lower.includes('candidate') || lower.includes('applicant') || lower.includes('associate')) continue;
    return raw.replace(/\s+/g, ' ').trim();
  }

  return undefined;
}

export function extractResumeHighlights(resumeText?: string): string | undefined {
  if (!resumeText?.trim()) return undefined;

  const lines = resumeText.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  const employers: string[] = [];
  const achievements: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Job entry lines: contain a date range pattern (e.g. "2021 – 2023", "Jan 2020 - Present")
    const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d{2}|19\d{2})\b.{0,20}\b(20\d{2}|present|current|now)\b/i.test(line);
    if (hasDate) {
      const cleaned = line
        .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\w\s,]*?(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|present|current|now)\b/gi, '')
        .replace(/\b(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|present|current|now)\b/gi, '')
        .replace(/[|•·,]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned.length > 2 && cleaned.length < 100) {
        employers.push(cleaned);
      }
      continue;
    }

    // Achievement bullets: start with bullet/dash and contain a number or % or $
    if (/^[•\-*▸◆]\s/.test(line) && /[\d%$]/.test(line)) {
      const clean = line.replace(/^[•\-*▸◆]\s*/, '').trim();
      if (clean.length > 10 && clean.length < 150) {
        achievements.push(clean);
      }
    }
  }

  const parts: string[] = [];
  if (employers.length > 0) {
    parts.push(`Employers/roles on resume: ${employers.slice(0, 4).join(' | ')}`);
  }
  if (achievements.length > 0) {
    parts.push(`Notable achievements: ${achievements.slice(0, 3).join(' | ')}`);
  }

  return parts.length > 0 ? parts.join('. ') : undefined;
}
