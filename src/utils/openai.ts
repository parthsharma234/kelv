import { InterviewSetup, Question, AIInterviewerState } from '../types/interview';

// OpenAI API configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Mock function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Question type classifications
export const QUESTION_TYPES = {
  SMALL_TALK: 'small_talk',
  BEHAVIORAL: 'behavioral', 
  TECHNICAL: 'technical',
  SITUATIONAL: 'situational',
  FOLLOW_UP: 'follow_up'
} as const;

// AI Interviewer personalities
export const AI_PERSONALITIES = {
  FRIENDLY: 'friendly',
  FORMAL: 'formal', 
  CHALLENGING: 'challenging'
} as const;

// Small talk questions to start the interview
const SMALL_TALK_QUESTIONS = [
  {
    id: 'st1',
    text: "Hi there! Thanks for joining me today. How are you feeling about this interview?",
    type: 'small_talk' as const,
    category: 'greeting',
    difficulty: 'easy' as const
  },
  {
    id: 'st2', 
    text: "Before we dive into the technical questions, tell me a bit about what drew you to this field?",
    type: 'small_talk' as const,
    category: 'motivation',
    difficulty: 'easy' as const
  },
  {
    id: 'st3',
    text: "I see you're interested in working in {industry}. What's been the most exciting development in this space recently, in your opinion?",
    type: 'small_talk' as const,
    category: 'industry_interest',
    difficulty: 'easy' as const
  }
];

// Generate dynamic questions using GPT-4o
export const generateDynamicQuestion = async (
  setup: InterviewSetup,
  previousResponses: any[],
  aiState: AIInterviewerState,
  questionType: string
): Promise<Question> => {
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    // Fallback to mock questions if no API key
    return generateMockQuestion(setup, questionType, previousResponses);
  }

  try {
    const prompt = buildPrompt(setup, previousResponses, aiState, questionType);
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI interviewer conducting a ${setup.jobType} interview for a ${setup.experienceLevel} candidate in the ${setup.industry} industry. 

Your personality is ${aiState.currentPersonality}. Generate interview questions that are:
- Appropriate for the candidate's experience level
- Relevant to their target role and industry  
- Adaptive based on their previous responses
- Classified by type: ${Object.values(QUESTION_TYPES).join(', ')}

Always respond with a JSON object containing:
{
  "question": "The interview question text",
  "type": "question_type",
  "category": "specific_category", 
  "difficulty": "easy|medium|hard",
  "reasoning": "Why this question was chosen"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const questionData = JSON.parse(content);
    
    return {
      id: `ai_${Date.now()}`,
      text: questionData.question,
      type: questionData.type,
      category: questionData.category,
      difficulty: questionData.difficulty
    };

  } catch (error) {
    console.error('Error generating dynamic question:', error);
    // Fallback to mock question
    return generateMockQuestion(setup, questionType, previousResponses);
  }
};

const buildPrompt = (
  setup: InterviewSetup,
  previousResponses: any[],
  aiState: AIInterviewerState,
  questionType: string
): string => {
  let prompt = `Generate a ${questionType} interview question for a ${setup.jobType} position in ${setup.industry} for a ${setup.experienceLevel} candidate.\n\n`;
  
  if (previousResponses.length > 0) {
    prompt += `Previous responses analysis:\n`;
    previousResponses.forEach((response, index) => {
      prompt += `Q${index + 1}: ${response.analysis?.score || 'N/A'}/10 - ${response.analysis?.feedback || 'No feedback'}\n`;
    });
    
    prompt += `\nAdaptive considerations:\n`;
    prompt += `- Confidence level: ${aiState.adaptationLevel}/10\n`;
    prompt += `- Focus areas: ${aiState.focusAreas.join(', ')}\n`;
    prompt += `- Question flow: ${aiState.questionFlow}\n`;
  }

  if (questionType === 'small_talk') {
    prompt += `\nGenerate a warm, engaging small talk question to help the candidate feel comfortable and build rapport.`;
  } else if (questionType === 'follow_up') {
    prompt += `\nGenerate a follow-up question that digs deeper into their previous response.`;
  }

  return prompt;
};

// Fallback mock question generator
const generateMockQuestion = (
  setup: InterviewSetup,
  questionType: string,
  previousResponses: any[]
): Question => {
  
  if (questionType === 'small_talk') {
    const randomSmallTalk = SMALL_TALK_QUESTIONS[Math.floor(Math.random() * SMALL_TALK_QUESTIONS.length)];
    return {
      ...randomSmallTalk,
      text: randomSmallTalk.text.replace('{industry}', setup.industry)
    };
  }

  // Mock questions by industry and type
  const mockQuestions: Record<string, Record<string, Question[]>> = {
    'Technology': {
      'behavioral': [
        {
          id: 'tech_beh_1',
          text: 'Tell me about a time when you had to learn a new technology quickly for a project.',
          type: 'behavioral',
          category: 'learning_agility',
          difficulty: 'medium'
        },
        {
          id: 'tech_beh_2', 
          text: 'Describe a situation where you had to debug a particularly challenging issue.',
          type: 'behavioral',
          category: 'problem_solving',
          difficulty: 'medium'
        }
      ],
      'technical': [
        {
          id: 'tech_tech_1',
          text: 'How would you optimize a database query that\'s running slowly?',
          type: 'technical',
          category: 'database_optimization',
          difficulty: 'hard'
        },
        {
          id: 'tech_tech_2',
          text: 'Explain the difference between REST and GraphQL APIs.',
          type: 'technical', 
          category: 'api_design',
          difficulty: 'medium'
        }
      ]
    },
    'Healthcare': {
      'behavioral': [
        {
          id: 'health_beh_1',
          text: 'Tell me about a time when you had to deliver difficult news to a patient or family member.',
          type: 'behavioral',
          category: 'communication',
          difficulty: 'hard'
        }
      ],
      'situational': [
        {
          id: 'health_sit_1',
          text: 'How would you handle a situation where a patient refuses treatment that you believe is necessary?',
          type: 'situational',
          category: 'patient_care',
          difficulty: 'hard'
        }
      ]
    }
  };

  const industryQuestions = mockQuestions[setup.industry] || mockQuestions['Technology'];
  const typeQuestions = industryQuestions[questionType] || industryQuestions['behavioral'] || [];
  
  if (typeQuestions.length === 0) {
    return {
      id: 'fallback_1',
      text: 'Tell me about yourself and what interests you about this role.',
      type: 'behavioral',
      category: 'general',
      difficulty: 'easy'
    };
  }

  return typeQuestions[Math.floor(Math.random() * typeQuestions.length)];
};

// Generate initial interview questions with small talk
export const generateInterviewQuestions = async (setup: InterviewSetup): Promise<Question[]> => {
  await delay(1500); // Simulate API delay
  
  const questions: Question[] = [];
  
  // Always start with small talk
  const smallTalkQuestion = SMALL_TALK_QUESTIONS[0];
  questions.push({
    ...smallTalkQuestion,
    text: smallTalkQuestion.text.replace('{industry}', setup.industry)
  });

  // Add a few more questions to start with
  const aiState: AIInterviewerState = {
    currentPersonality: 'friendly',
    adaptationLevel: 5,
    questionFlow: 'adaptive',
    focusAreas: []
  };

  // Generate follow-up small talk
  questions.push(await generateDynamicQuestion(setup, [], aiState, 'small_talk'));
  
  // Add initial behavioral question
  questions.push(await generateDynamicQuestion(setup, [], aiState, 'behavioral'));

  return questions;
};

// Analyze response with GPT-4o
export const analyzeResponse = async (
  question: Question,
  response: string,
  setup: InterviewSetup,
  previousResponses: any[] = []
): Promise<{
  score: number;
  feedback: string;
  followUpQuestion: string;
  strengths: string[];
  areasForImprovement: string[];
  confidenceIndicators: {
    responseLength: number;
    specificExamples: boolean;
    structuredAnswer: boolean;
    enthusiasm: number;
  };
  nextQuestionType: string;
  adaptiveInsights: {
    confidenceLevel: number;
    performanceLevel: number;
    suggestedFocus: string[];
  };
}> => {
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return generateMockAnalysis(question, response, setup);
  }

  try {
    const analysisPrompt = `
Analyze this interview response for a ${setup.jobType} position in ${setup.industry}:

Question (${question.type}): ${question.text}
Response: ${response}

Provide detailed analysis including:
1. Score (1-10)
2. Specific feedback
3. Confidence indicators
4. Suggested next question type
5. Adaptive insights for interview flow

Respond with JSON:
{
  "score": number,
  "feedback": "detailed feedback",
  "followUpQuestion": "specific follow-up question",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "confidenceIndicators": {
    "responseLength": number,
    "specificExamples": boolean,
    "structuredAnswer": boolean,
    "enthusiasm": number
  },
  "nextQuestionType": "suggested_type",
  "adaptiveInsights": {
    "confidenceLevel": number,
    "performanceLevel": number,
    "suggestedFocus": ["focus1", "focus2"]
  }
}`;

    const response_api = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach analyzing candidate responses. Provide constructive, specific feedback that helps candidates improve.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response_api.ok) {
      throw new Error(`OpenAI API error: ${response_api.status}`);
    }

    const data = await response_api.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return JSON.parse(content);

  } catch (error) {
    console.error('Error analyzing response:', error);
    return generateMockAnalysis(question, response, setup);
  }
};

// Mock analysis for fallback
const generateMockAnalysis = (
  question: Question,
  response: string,
  setup: InterviewSetup
) => {
  const responseLength = response.length;
  const hasSpecificExamples = response.toLowerCase().includes('example') || 
                             response.toLowerCase().includes('instance') ||
                             response.toLowerCase().includes('time when');
  const hasMetrics = /\d+/.test(response);
  const hasStructure = response.includes('first') || response.includes('then') || response.includes('finally');
  
  let baseScore = 5;
  if (responseLength > 150) baseScore += 1;
  if (hasSpecificExamples) baseScore += 2;
  if (hasMetrics) baseScore += 1;
  if (hasStructure) baseScore += 1;
  
  const score = Math.min(10, baseScore);
  const enthusiasm = responseLength > 100 ? Math.min(10, Math.floor(responseLength / 20)) : 5;
  
  // Determine next question type based on performance
  let nextQuestionType = 'behavioral';
  if (question.type === 'small_talk') {
    nextQuestionType = score >= 7 ? 'behavioral' : 'small_talk';
  } else if (question.type === 'behavioral' && score >= 8) {
    nextQuestionType = 'technical';
  } else if (score < 6) {
    nextQuestionType = 'follow_up';
  }

  return {
    score,
    feedback: `${score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : 'Fair'} response! ${hasSpecificExamples ? 'Great use of specific examples.' : 'Consider adding more specific examples.'} ${hasStructure ? 'Well-structured answer.' : 'Try using a structured approach like STAR method.'}`,
    followUpQuestion: hasSpecificExamples ? 
      "That's a great example. Can you tell me about the specific impact or outcome of your actions?" :
      "Could you provide a specific example from your experience to illustrate that point?",
    strengths: [
      hasSpecificExamples ? "Specific examples provided" : "Clear communication",
      hasStructure ? "Well-structured response" : "Relevant experience shared",
      hasMetrics ? "Quantifiable results mentioned" : "Good understanding of the topic"
    ],
    areasForImprovement: [
      !hasSpecificExamples ? "Add more specific examples" : "Include more context",
      !hasMetrics ? "Include measurable outcomes" : "Expand on impact",
      !hasStructure ? "Use structured approach (STAR method)" : "Connect more to role requirements"
    ],
    confidenceIndicators: {
      responseLength,
      specificExamples: hasSpecificExamples,
      structuredAnswer: hasStructure,
      enthusiasm
    },
    nextQuestionType,
    adaptiveInsights: {
      confidenceLevel: Math.min(10, Math.floor(enthusiasm * 0.8 + (score * 0.2))),
      performanceLevel: score,
      suggestedFocus: score < 6 ? ['communication', 'examples'] : score < 8 ? ['structure', 'impact'] : ['advanced_scenarios']
    }
  };
};

// Generate next question based on adaptive analysis
export const generateNextQuestion = async (
  setup: InterviewSetup,
  previousResponses: any[],
  aiState: AIInterviewerState,
  suggestedType?: string
): Promise<Question> => {
  
  // Determine question type based on interview flow
  let questionType = suggestedType || 'behavioral';
  
  if (previousResponses.length === 0) {
    questionType = 'small_talk';
  } else if (previousResponses.length === 1 && previousResponses[0].analysis?.score < 6) {
    questionType = 'small_talk'; // More warm-up needed
  } else if (previousResponses.length >= 2) {
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    
    if (avgScore >= 8) {
      questionType = Math.random() > 0.5 ? 'technical' : 'situational';
    } else if (avgScore >= 6) {
      questionType = 'behavioral';
    } else {
      questionType = 'follow_up';
    }
  }

  return await generateDynamicQuestion(setup, previousResponses, aiState, questionType);
};

export const synthesizeSpeech = async (text: string): Promise<HTMLAudioElement | null> => {
  // Simulate API delay
  await delay(1000);
  
  // In UI mode, we don't actually synthesize speech
  // This is just a mock to simulate the delay
  return null;
};