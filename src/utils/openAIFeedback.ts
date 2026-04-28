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
  overallAssessment: string;
  contentAnalysis: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  deliveryNotes: string;
  suggestedAnswer: string;
  keyTakeaway: string;
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
    return buildDeterministicInterviewFeedback(transcriptPairs, jobContext, signalContext);
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

    return sanitizeInterviewFeedback(JSON.parse(content), transcriptPairs, jobContext, signalContext);
  } catch (error) {
    console.warn('OpenAI feedback unavailable; using deterministic Kelv feedback.', error);
    return buildDeterministicInterviewFeedback(transcriptPairs, jobContext, signalContext);
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
    ? `Target role: ${jobContext.role || 'professional role'} | Industry: ${jobContext.industry || 'general'} | Level: ${jobContext.experienceLevel || 'mid-level'}`
    : 'Target role context was not provided.';

  return `Analyze this mock interview like a serious hiring coach. The output must be useful enough that the candidate knows exactly what to rehearse next.

Rules:
- Be specific, not motivational.
- Reference question numbers.
- Use transcript evidence. Do not invent achievements, metrics, employers, tools, or motivations.
- Separate answer content from delivery/presence.
- Prioritize the 1-2 issues that would most change the hiring signal.
- For suggested answers, rewrite with the candidate's existing facts only. If facts are missing, provide a fill-in structure with brackets.
- Do not say "good job" or generic praise.

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
      "overallAssessment": "Direct diagnosis of this answer's hiring signal.",
      "contentAnalysis": {
        "score": 75,
        "strengths": ["Specific transcript-backed strength"],
        "improvements": ["Specific transcript-backed improvement"]
      },
      "deliveryNotes": "Pacing, filler, hesitation, or presence note tied to available signals.",
      "suggestedAnswer": "A tighter 3-5 sentence version using only known facts, or a bracketed structure if facts are missing.",
      "keyTakeaway": "One correction to apply on the next rep."
    }
  ],
  "nextSteps": [
    "Concrete drill with target reps and pass condition",
    "Concrete drill with target reps and pass condition",
    "Concrete drill with target reps and pass condition"
  ]
}`;
}

export function buildDeterministicInterviewFeedback(
  transcriptPairs: TranscriptPair[],
  jobContext?: JobContext,
  signalContext: CoachSignalContext = {}
): InterviewFeedback {
  const questionFeedback = transcriptPairs.map((pair) =>
    buildDeterministicQuestionFeedback(pair, signalContext)
  );
  const weakest = signalContext.perQuestionAnalysis?.weakestQuestion;
  const strongest = signalContext.perQuestionAnalysis?.strongestQuestion;
  const primaryDrill = signalContext.practicePlan?.[0];
  const role = jobContext?.role || 'the target role';

  return {
    overallSummary:
      transcriptPairs.length === 0
        ? 'Kelv needs at least one complete question-answer exchange before it can coach the session.'
        : `For ${role}, the current signal is strongest when the answer includes concrete action and weakest when evidence or structure stays thin. The highest-leverage next rep is ${primaryDrill?.weak_point ? primaryDrill.weak_point.toLowerCase() : weakest ? `question ${weakest.questionNumber}` : 'adding measurable proof to the weakest answer'}.`,
    topStrengths: uniqueFirst([
      strongest ? `Q${strongest.questionNumber}: strongest answer by score because it gave the clearest hiring signal.` : '',
      ...questionFeedback.flatMap((feedback) => feedback.contentAnalysis.strengths),
      signalContext.metrics?.fillerWordCount === 0 ? 'Delivery stayed clean with no transcript-detected filler words.' : ''
    ], 3),
    criticalImprovements: uniqueFirst([
      primaryDrill ? `Priority 1: ${primaryDrill.completion_criteria}` : '',
      weakest ? `Priority 2: rebuild Q${weakest.questionNumber}; it is the lowest-scoring answer.` : '',
      ...questionFeedback.flatMap((feedback) => feedback.contentAnalysis.improvements),
      ...(signalContext.signalFusion?.fused.coaching_focus || [])
    ], 3),
    questionFeedback,
    nextSteps: buildNextSteps(primaryDrill, weakest?.questionNumber)
  };
}

function buildDeterministicQuestionFeedback(
  pair: TranscriptPair,
  signalContext: CoachSignalContext
): QuestionFeedback {
  const questionMetrics = signalContext.perQuestionAnalysis?.questions.find(
    (question) => question.questionNumber === pair.questionNumber
  );
  const answer = pair.answer || '';
  const wordCount = countWords(answer);
  const hasMetric = /\b\d+(\.\d+)?%?\b|percent|revenue|cost|users|customers|tickets|latency|hours|days|weeks|months/i.test(answer);
  const hasStructure = /\b(situation|task|action|result|first|second|finally|because|therefore|challenge|outcome|led|built|shipped)\b/i.test(answer);
  const score = questionMetrics?.contentScore ?? scoreAnswer({ wordCount, hasMetric, hasStructure });

  const improvements = [
    hasMetric
      ? 'Tie the measurable result directly to your own decision or action.'
      : 'Add a measurable result, scale marker, or before-after outcome.',
    hasStructure
      ? 'Make the final takeaway more explicit so the interviewer knows why it matters.'
      : 'Use a clear situation-action-result arc instead of a loose explanation.',
    wordCount < 35
      ? 'Add enough context and stakes for the answer to feel credible.'
      : 'Cut setup and spend more time on action, tradeoff, and result.'
  ];

  return {
    questionNumber: pair.questionNumber,
    overallAssessment:
      score >= 78
        ? 'This answer has a usable hiring signal; the next improvement is sharper ending and cleaner proof of ownership.'
        : score >= 62
          ? 'This answer is workable but not yet memorable; it needs clearer evidence and a stronger result.'
          : 'This answer would likely feel underdeveloped to an interviewer because the proof and structure are thin.',
    contentAnalysis: {
      score: Math.round(score),
      strengths: uniqueFirst([
        hasStructure ? 'The answer shows a visible story structure.' : '',
        hasMetric ? 'The answer includes concrete proof or scale.' : '',
        wordCount >= 45 ? 'The answer gives enough material to evaluate.' : 'The answer is concise and can be rebuilt quickly.'
      ], 2),
      improvements: uniqueFirst(improvements, 3)
    },
    deliveryNotes: deliveryNote(questionMetrics, signalContext),
    suggestedAnswer: suggestedAnswerSkeleton(pair, hasMetric, hasStructure),
    keyTakeaway: hasMetric && hasStructure
      ? 'Keep the structure, then make your personal ownership unmistakable.'
      : 'The next rep needs a clearer story arc plus one concrete proof point.'
  };
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
  transcriptPairs: TranscriptPair[],
  jobContext?: JobContext,
  signalContext: CoachSignalContext = {}
): InterviewFeedback {
  const fallback = buildDeterministicInterviewFeedback(transcriptPairs, jobContext, signalContext);

  return {
    overallSummary: stringOrFallback(value?.overallSummary, fallback.overallSummary),
    topStrengths: stringArrayOrFallback(value?.topStrengths, fallback.topStrengths, 3),
    criticalImprovements: stringArrayOrFallback(value?.criticalImprovements, fallback.criticalImprovements, 3),
    questionFeedback: Array.isArray(value?.questionFeedback) && value.questionFeedback.length > 0
      ? value.questionFeedback.map((feedback: any, index: number) => sanitizeQuestionFeedback(feedback, fallback.questionFeedback[index] || fallback.questionFeedback[0]))
      : fallback.questionFeedback,
    nextSteps: stringArrayOrFallback(value?.nextSteps, fallback.nextSteps, 3)
  };
}

function sanitizeQuestionFeedback(value: any, fallback: QuestionFeedback): QuestionFeedback {
  return {
    questionNumber: Number.isFinite(value?.questionNumber) ? value.questionNumber : fallback.questionNumber,
    overallAssessment: stringOrFallback(value?.overallAssessment, fallback.overallAssessment),
    contentAnalysis: {
      score: clamp(Number(value?.contentAnalysis?.score ?? fallback.contentAnalysis.score)),
      strengths: stringArrayOrFallback(value?.contentAnalysis?.strengths, fallback.contentAnalysis.strengths, 1),
      improvements: stringArrayOrFallback(value?.contentAnalysis?.improvements, fallback.contentAnalysis.improvements, 1)
    },
    deliveryNotes: stringOrFallback(value?.deliveryNotes, fallback.deliveryNotes),
    suggestedAnswer: stringOrFallback(value?.suggestedAnswer, fallback.suggestedAnswer),
    keyTakeaway: stringOrFallback(value?.keyTakeaway, fallback.keyTakeaway)
  };
}

function buildNextSteps(primaryDrill?: PracticePlan, weakestQuestionNumber?: number): string[] {
  return [
    primaryDrill
      ? `${primaryDrill.drill_type}: ${primaryDrill.completion_criteria}`
      : 'Rewrite the weakest answer with situation, action, and result.',
    weakestQuestionNumber
      ? `Record 3 reps of Q${weakestQuestionNumber}; keep the answer between 60 and 90 seconds.`
      : 'Record 3 reps of the weakest answer; keep each between 60 and 90 seconds.',
    'After each rep, add one missing proof point: metric, scope, stakeholder, or outcome.'
  ];
}

function deliveryNote(
  questionMetrics: PerQuestionAnalysis['questions'][number] | undefined,
  signalContext: CoachSignalContext
): string {
  if (questionMetrics) {
    return `Q${questionMetrics.questionNumber} delivery: ${questionMetrics.wpm} WPM, ${questionMetrics.fillerWordCount} fillers, presence ${questionMetrics.presenceScore}/100.`;
  }

  const metrics = signalContext.metrics;
  if (!metrics) return 'Delivery signal is limited; judge this answer mainly on structure and evidence.';
  return `Session delivery: ${metrics.wpm} WPM, ${metrics.fillerWordCount} fillers, pause score ${metrics.pauseScore}/100.`;
}

function suggestedAnswerSkeleton(
  pair: TranscriptPair,
  hasMetric: boolean,
  hasStructure: boolean
): string {
  const setup = hasStructure
    ? 'Keep the story structure, but compress it:'
    : 'Use this structure:';
  const proof = hasMetric
    ? 'name the metric and connect it to what you personally did.'
    : 'add [metric/scope/outcome] before the final sentence.';

  return `${setup} "The situation was [specific context]. I owned [specific action/tradeoff]. The result was [measurable outcome], and the reason it matters is [business or team impact]." For Q${pair.questionNumber}, ${proof}`;
}

function scoreAnswer({
  wordCount,
  hasMetric,
  hasStructure
}: {
  wordCount: number;
  hasMetric: boolean;
  hasStructure: boolean;
}): number {
  return clamp(42 + Math.min(wordCount, 120) * 0.18 + (hasMetric ? 16 : 0) + (hasStructure ? 14 : 0));
}

function stringOrFallback(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function stringArrayOrFallback(value: unknown, fallback: string[], limit: number): string[] {
  if (!Array.isArray(value)) return fallback;
  const clean = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return clean.length > 0 ? clean.slice(0, limit) : fallback;
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function uniqueFirst(values: string[], limit: number): string[] {
  const results: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const clean = value.trim();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    results.push(clean);
    if (results.length >= limit) break;
  }

  return results;
}
