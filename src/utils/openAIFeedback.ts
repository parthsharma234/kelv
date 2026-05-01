import OpenAI from 'openai';
import { InterviewMetrics } from './analyticsEngine';
import { PerQuestionAnalysis } from './perQuestionAnalytics';
import { PracticePlan, VoiceCvSignalFusion } from '../types/sessionResult';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface QuestionFeedback {
  questionNumber: number;
  question: string;
  answer: string;
  shortDiagnosis: string;
  whatWorked: CoachingItem[];
  toImprove: CoachingItem[];
  suggestedAnswerSkeleton?: string;
  nextRep?: string;
  scores?: {
    content?: number;
    delivery?: number;
    presence?: number;
    overall?: number;
  };
}

export interface CoachingItem {
  area: string;
  note: string;
  evidence?: string;
  nextRep?: string;
}

export interface InterviewFeedback {
  overallSummary: string;
  topStrengths: string[];
  criticalImprovements: string[];
  questionFeedback: QuestionFeedback[];
  nextSteps: string[];
}

interface TranscriptPair {
  question: string;
  answer: string;
  questionNumber: number;
}

interface JobContext {
  role?: string;
  industry?: string;
  experienceLevel?: string;
  jobDescription?: string;
}

export interface CoachSignalContext {
  metrics?: InterviewMetrics;
  perQuestionAnalysis?: PerQuestionAnalysis | null;
  practicePlan?: PracticePlan[];
  signalFusion?: VoiceCvSignalFusion | null;
}

export async function generateInterviewFeedback(
  transcriptPairs: TranscriptPair[],
  jobContext?: JobContext,
  signalContext: CoachSignalContext = {}
): Promise<InterviewFeedback> {
  if (transcriptPairs.length === 0) {
    return {
      overallSummary: '',
      topStrengths: [],
      criticalImprovements: [],
      questionFeedback: [],
      nextSteps: []
    };
  }

  const prompt = buildInterviewFeedbackPrompt(transcriptPairs, jobContext, signalContext);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are Kelv, a direct interview coach. Return strict JSON only. Use evidence from the transcript and do not invent facts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.35,
      max_tokens: 3400,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return sanitizeInterviewFeedback(JSON.parse(content), transcriptPairs);
  } catch (error) {
    console.warn('OpenAI feedback unavailable.', error);
    throw error;
  }
}

export async function generateSingleAnswerFeedback(
  question: string,
  answer: string,
  jobContext?: Pick<JobContext, 'role' | 'industry'>
): Promise<QuestionFeedback> {
  const feedback = await generateInterviewFeedback(
    [{ question, answer, questionNumber: 1 }],
    jobContext
  );

  return feedback.questionFeedback[0];
}

export function buildInterviewFeedbackPrompt(
  transcriptPairs: TranscriptPair[],
  jobContext?: JobContext,
  signalContext: CoachSignalContext = {}
): string {
  const contextString = jobContext
    ? `Target role: ${jobContext.role || 'professional role'} | Industry: ${jobContext.industry || 'general'} | Level: ${jobContext.experienceLevel || 'mid-level'}\nJob description context: ${truncate(jobContext.jobDescription || '', 1800) || 'not provided'}`
    : 'Target role context was not provided.';

  return `Analyze this mock interview like a serious hiring coach. The output must be useful enough that the candidate knows exactly what to rehearse next.

Rules:
- Be specific, not motivational.
- Reference question numbers.
- Use transcript evidence. Do not invent achievements, metrics, employers, tools, or motivations.
- Analyze only candidate answers. Never treat Kelv's question text as the candidate's answer.
- Separate answer content from delivery/presence.
- Prioritize the 1-2 issues that would most change the hiring signal.
- For suggested answer skeletons, use the candidate's existing facts only. If facts are missing, provide a fill-in structure with brackets.
- Do not say "good job" or generic praise.
- Each question must include concrete "whatWorked" and "toImprove" items tied to that exact question and answer.

${contextString}

TRANSCRIPT:
${formatTranscript(transcriptPairs)}

KELV SIGNALS:
${formatSignalContext(signalContext)}

Return only JSON in this exact shape:
{
  "overallSummary": "2-3 sentences: hiring-signal diagnosis, biggest blocker, and highest-leverage practice focus.",
  "topStrengths": [
    "Q# evidence-backed strength with why it matters",
    "Q# evidence-backed strength with why it matters",
    "Q# evidence-backed strength with why it matters"
  ],
  "criticalImprovements": [
    "Priority 1: specific behavior to change and why",
    "Priority 2: specific behavior to change and why",
    "Priority 3: specific behavior to change and why"
  ],
  "questionFeedback": [
    {
      "questionNumber": 1,
      "question": "Exact interviewer question.",
      "answer": "Exact candidate answer.",
      "shortDiagnosis": "Direct diagnosis of this answer's hiring signal.",
      "whatWorked": [
        {
          "area": "Speech Clarity",
          "note": "Specific positive observation.",
          "evidence": "Short phrase or metric from this answer."
        }
      ],
      "toImprove": [
        {
          "area": "Specificity",
          "note": "Specific correction for this role and answer.",
          "evidence": "What was missing or weak.",
          "nextRep": "One action to rehearse next."
        }
      ],
      "suggestedAnswerSkeleton": "A tighter 3-5 sentence structure using only known facts, or bracketed placeholders when facts are missing.",
      "nextRep": "One correction to apply on the next attempt.",
      "scores": {
        "content": 75,
        "delivery": 70,
        "presence": 68,
        "overall": 72
      }
    }
  ],
  "nextSteps": [
    "Concrete drill with target reps and pass condition",
    "Concrete drill with target reps and pass condition",
    "Concrete drill with target reps and pass condition"
  ]
}`;
}

function formatTranscript(transcriptPairs: TranscriptPair[]): string {
  return transcriptPairs
    .map((pair) => `Q${pair.questionNumber}: ${pair.question}\nA${pair.questionNumber}: ${pair.answer}`)
    .join('\n\n');
}

function formatSignalContext(signalContext: CoachSignalContext): string {
  const metrics = signalContext.metrics;
  const perQuestion = signalContext.perQuestionAnalysis;
  const drills = signalContext.practicePlan || [];
  const lens = signalContext.signalFusion;

  return JSON.stringify({
    overall_scores: metrics ? {
      overall: metrics.overallScore,
      content: metrics.contentScore,
      delivery: metrics.deliveryScore,
      presence: metrics.presenceScore,
      wpm: metrics.wpm,
      filler_words: metrics.fillerWordCount,
      hesitation: metrics.anxietyLevel
    } : null,
    weakest_question: perQuestion?.weakestQuestion ? {
      questionNumber: perQuestion.weakestQuestion.questionNumber,
      score: perQuestion.weakestQuestion.overallScore,
      weaknesses: perQuestion.weakestQuestion.weaknesses.map((weakness) => weakness.area)
    } : null,
    strongest_question: perQuestion?.strongestQuestion ? {
      questionNumber: perQuestion.strongestQuestion.questionNumber,
      score: perQuestion.strongestQuestion.overallScore
    } : null,
    recommended_drills: drills.map((drill) => ({
      weak_point: drill.weak_point,
      drill_type: drill.drill_type,
      repetition_target: drill.repetition_target,
      completion_criteria: drill.completion_criteria
    })),
    kelv_lens: lens ? {
      readiness: lens.fused.interview_readiness_signal,
      delivery_presence_score: lens.fused.delivery_presence_score,
      coaching_focus: lens.fused.coaching_focus,
      voice_flags: lens.voice.flags,
      vision_flags: lens.vision.flags
    } : null
  }, null, 2);
}

function sanitizeInterviewFeedback(
  value: any,
  transcriptPairs: TranscriptPair[]
): InterviewFeedback {
  return {
    overallSummary: stringOrFallback(value?.overallSummary, ''),
    topStrengths: stringArrayOrFallback(value?.topStrengths, [], 3),
    criticalImprovements: stringArrayOrFallback(value?.criticalImprovements, [], 3),
    questionFeedback: Array.isArray(value?.questionFeedback) && value.questionFeedback.length > 0
      ? value.questionFeedback.map((feedback: any, index: number) =>
        sanitizeQuestionFeedback(feedback, transcriptPairs[index] || transcriptPairs[0])
      )
      : [],
    nextSteps: stringArrayOrFallback(value?.nextSteps, [], 3)
  };
}

function sanitizeQuestionFeedback(value: any, pair: TranscriptPair): QuestionFeedback {
  const scores = value?.scores || {};
  return {
    questionNumber: Number.isFinite(value?.questionNumber) ? value.questionNumber : pair.questionNumber,
    question: stringOrFallback(value?.question, pair.question),
    answer: stringOrFallback(value?.answer, pair.answer),
    shortDiagnosis: stringOrFallback(value?.shortDiagnosis, ''),
    whatWorked: coachingItemsOrFallback(value?.whatWorked, []),
    toImprove: coachingItemsOrFallback(value?.toImprove, []),
    suggestedAnswerSkeleton: optionalString(value?.suggestedAnswerSkeleton),
    nextRep: optionalString(value?.nextRep),
    scores: {
      content: optionalScore(scores.content ?? value?.contentAnalysis?.score),
      delivery: optionalScore(scores.delivery),
      presence: optionalScore(scores.presence),
      overall: optionalScore(scores.overall)
    },
  };
}

function coachingItemsOrFallback(value: unknown, fallback: CoachingItem[]): CoachingItem[] {
  if (!Array.isArray(value)) return fallback;
  const clean = value
    .map((item) => ({
      area: typeof item?.area === 'string' ? item.area.trim() : '',
      note: typeof item?.note === 'string' ? item.note.trim() : '',
      evidence: optionalString(item?.evidence),
      nextRep: optionalString(item?.nextRep)
    }))
    .filter((item) => item.area && item.note);
  return clean.length > 0 ? clean.slice(0, 4) : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function optionalScore(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? clamp(numeric) : undefined;
}

function stringOrFallback(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function stringArrayOrFallback(value: unknown, fallback: string[], limit: number): string[] {
  if (!Array.isArray(value)) return fallback;
  const clean = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return clean.length > 0 ? clean.slice(0, limit) : fallback;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function truncate(value: string, maxLength: number): string {
  const clean = value.trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}...` : clean;
}
