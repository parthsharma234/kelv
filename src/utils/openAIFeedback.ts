import OpenAI from 'openai';

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

export async function generateInterviewFeedback(
  transcriptPairs: TranscriptPair[],
  jobContext?: {
    role?: string;
    industry?: string;
    experienceLevel?: string;
  }
): Promise<InterviewFeedback> {
  const contextString = jobContext
    ? `The candidate is interviewing for a ${jobContext.role || 'professional'} role in ${jobContext.industry || 'general industry'} at ${jobContext.experienceLevel || 'mid-level'}.`
    : '';

  const transcriptFormatted = transcriptPairs
    .map(
      (pair) =>
        `Question ${pair.questionNumber}: "${pair.question}"\nAnswer: "${pair.answer}"`
    )
    .join('\n\n');

  const prompt = `You are an expert interview coach analyzing a mock interview. Provide actionable, specific feedback.

${contextString}

INTERVIEW TRANSCRIPT:
${transcriptFormatted}

Analyze each question-answer pair and provide structured feedback. Be direct and constructive. Focus on:
1. Content quality - Did they answer the actual question? Were specifics provided?
2. Structure - Did they use frameworks like STAR for behavioral questions?
3. Relevance - Did the answer demonstrate relevant experience?
4. Missed opportunities - What could they have included?

Respond in this exact JSON format:
{
  "overallSummary": "2-3 sentence executive summary of interview performance",
  "topStrengths": ["strength1", "strength2", "strength3"],
  "criticalImprovements": ["improvement1", "improvement2", "improvement3"],
  "questionFeedback": [
    {
      "questionNumber": 1,
      "overallAssessment": "Brief 1-2 sentence assessment of this answer",
      "contentAnalysis": {
        "score": 75,
        "strengths": ["what they did well"],
        "improvements": ["what they should improve"]
      },
      "deliveryNotes": "Notes on how the answer was structured/delivered",
      "suggestedAnswer": "A brief example of how they could have answered better (2-3 sentences)",
      "keyTakeaway": "Single most important thing to remember"
    }
  ],
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert interview coach. Provide specific, actionable feedback. Always respond in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    return JSON.parse(jsonMatch[0]) as InterviewFeedback;
  } catch (error) {
    console.error('OpenAI feedback error:', error);
    throw error;
  }
}

export async function generateSingleAnswerFeedback(
  question: string,
  answer: string,
  jobContext?: {
    role?: string;
    industry?: string;
  }
): Promise<QuestionFeedback> {
  const contextString = jobContext
    ? `Context: Interviewing for ${jobContext.role || 'a professional role'} in ${jobContext.industry || 'general industry'}.`
    : '';

  const prompt = `Analyze this interview answer and provide specific feedback.

${contextString}

Question: "${question}"
Answer: "${answer}"

Provide feedback in this JSON format:
{
  "questionNumber": 1,
  "overallAssessment": "Brief assessment",
  "contentAnalysis": {
    "score": 75,
    "strengths": ["strength1"],
    "improvements": ["improvement1"]
  },
  "deliveryNotes": "Notes on structure",
  "suggestedAnswer": "Better answer example",
  "keyTakeaway": "Most important thing"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach. Respond only in valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    return JSON.parse(jsonMatch[0]) as QuestionFeedback;
  } catch (error) {
    console.error('OpenAI single answer feedback error:', error);
    throw error;
  }
}
