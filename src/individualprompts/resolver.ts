import { InterviewSetup } from '../types/interview';

const modules = import.meta.glob('./**/*.ts', { eager: true }) as Record<string, any>;

function slugify(input: string): string {
  return (input || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function coerceText(mod: any): string | undefined {
  const v = mod?.default ?? mod?.system ?? mod?.prompt;
  return typeof v === 'string' ? v : undefined;
}

export function resolveIndividualPrompt(setup: InterviewSetup): string | undefined {
  const roleSlug = slugify(setup.jobType);
  const industrySlug = slugify(setup.industry);
  const specificPath = `./${industrySlug}/${roleSlug}.ts`;
  console.log(`[Kelv] Resolving prompt for industry: ${industrySlug}, role: ${roleSlug}`);
  console.log(`[Kelv] Attempting to load prompt from: ${specificPath}`);
  const mod = modules[specificPath];
  const text = coerceText(mod);
  if (text) {
    console.log(`[Kelv] Successfully loaded prompt for ${industrySlug}/${roleSlug}`);
  } else {
    console.warn(`[Kelv] No individual prompt found for ${industrySlug}/${roleSlug}.`);
  }
  return text?.trim() || undefined;
}

export type {};


