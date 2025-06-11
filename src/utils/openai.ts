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
    text: "Before we dive into the main questions, tell me a bit about what drew you to this field?",
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

// Helper function to extract JSON from markdown code blocks
const extractJsonFromMarkdown = (content: string): string => {
  // Check if content is wrapped in markdown code blocks
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = content.match(jsonBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no markdown blocks found, return the content as-is
  return content.trim();
};

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

Your goal is to create a realistic interview experience that:
- Adapts difficulty based on candidate performance
- Asks follow-up questions when responses are weak
- Concludes naturally when appropriate (typically after 5-8 questions)
- Maintains a professional but friendly tone

Generate interview questions that are:
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
  "reasoning": "Why this question was chosen based on previous responses"
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

    // Extract JSON from markdown code blocks if present
    const jsonContent = extractJsonFromMarkdown(content);
    const questionData = JSON.parse(jsonContent);
    
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
      const score = response.analysis?.score || 0;
      const confidence = response.analysis?.confidenceIndicators?.enthusiasm || 5;
      prompt += `Q${index + 1}: Score ${score}/10, Confidence ${confidence}/10 - ${response.analysis?.feedback || 'No feedback'}\n`;
    });
    
    prompt += `\nAdaptive considerations:\n`;
    prompt += `- Average performance: ${previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length}/10\n`;
    prompt += `- Focus areas: ${aiState.focusAreas.join(', ') || 'General interview skills'}\n`;
    prompt += `- Question flow: ${aiState.questionFlow}\n`;
    
    // Determine if interview should conclude
    if (previousResponses.length >= 5) {
      const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
      if (avgScore >= 7 || previousResponses.length >= 8) {
        prompt += `\nIMPORTANT: Consider if this should be a concluding question. The interview has covered ${previousResponses.length} questions with average score ${avgScore.toFixed(1)}/10.\n`;
      }
    }
  }

  if (questionType === 'small_talk') {
    prompt += `\nGenerate a warm, engaging small talk question to help the candidate feel comfortable and build rapport.`;
  } else if (questionType === 'follow_up') {
    const lastResponse = previousResponses[previousResponses.length - 1];
    prompt += `\nGenerate a follow-up question that digs deeper into their previous response: "${lastResponse?.response}". The candidate scored ${lastResponse?.analysis?.score || 0}/10 on this response.`;
  } else if (questionType === 'behavioral') {
    prompt += `\nGenerate a behavioral question using the STAR method framework. Adjust difficulty based on previous performance.`;
  } else if (questionType === 'technical') {
    prompt += `\nGenerate a technical question relevant to the ${setup.jobType} role. Adjust complexity based on experience level and previous responses.`;
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

  // Determine difficulty based on previous performance
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (previousResponses.length > 0) {
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    if (avgScore < 6) difficulty = 'easy';
    else if (avgScore >= 8) difficulty = 'hard';
  }

  // Mock questions by industry and type
  const mockQuestions: Record<string, Record<string, Record<string, Question[]>>> = {
    'Technology': {
      'behavioral': {
        'easy': [
          {
            id: 'tech_beh_easy_1',
            text: 'Tell me about a time when you had to learn something new for work or school.',
            type: 'behavioral',
            category: 'learning',
            difficulty: 'easy'
          },
          {
            id: 'tech_beh_easy_2',
            text: 'Describe a project you worked on that you\'re proud of.',
            type: 'behavioral',
            category: 'achievement',
            difficulty: 'easy'
          }
        ],
        'medium': [
          {
            id: 'tech_beh_med_1',
            text: 'Tell me about a time when you had to work with a difficult team member.',
            type: 'behavioral',
            category: 'teamwork',
            difficulty: 'medium'
          },
          {
            id: 'tech_beh_med_2',
            text: 'Describe a situation where you had to meet a tight deadline.',
            type: 'behavioral',
            category: 'time_management',
            difficulty: 'medium'
          }
        ],
        'hard': [
          {
            id: 'tech_beh_hard_1',
            text: 'Tell me about a time when you had to make a difficult decision with limited information.',
            type: 'behavioral',
            category: 'decision_making',
            difficulty: 'hard'
          },
          {
            id: 'tech_beh_hard_2',
            text: 'Describe a situation where you had to influence others without having direct authority.',
            type: 'behavioral',
            category: 'leadership',
            difficulty: 'hard'
          }
        ]
      },
      'technical': {
        'easy': [
          {
            id: 'tech_tech_easy_1',
            text: 'What programming languages are you most comfortable with?',
            type: 'technical',
            category: 'programming',
            difficulty: 'easy'
          }
        ],
        'medium': [
          {
            id: 'tech_tech_med_1',
            text: 'How would you explain APIs to a non-technical person?',
            type: 'technical',
            category: 'communication',
            difficulty: 'medium'
          }
        ],
        'hard': [
          {
            id: 'tech_tech_hard_1',
            text: 'How would you design a system to handle millions of concurrent users?',
            type: 'technical',
            category: 'system_design',
            difficulty: 'hard'
          }
        ]
      }
    }
  };

  const industryQuestions = mockQuestions[setup.industry] || mockQuestions['Technology'];
  const typeQuestions = industryQuestions[questionType] || industryQuestions['behavioral'] || {};
  const difficultyQuestions = typeQuestions[difficulty] || typeQuestions['medium'] || [];
  
  if (difficultyQuestions.length === 0) {
    return {
      id: 'fallback_1',
      text: 'Tell me about yourself and what interests you about this role.',
      type: 'behavioral',
      category: 'general',
      difficulty: 'easy'
    };
  }

  return difficultyQuestions[Math.floor(Math.random() * difficultyQuestions.length)];
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
    return generateMockAnalysis(question, response, setup, previousResponses);
  }

  try {
    const analysisPrompt = `
Analyze this interview response for a ${setup.jobType} position in ${setup.industry}:

Question (${question.type}): ${question.text}
Response: ${response}

Previous performance context:
${previousResponses.length > 0 ? 
  `- Total questions answered: ${previousResponses.length}
  - Average score so far: ${(previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length).toFixed(1)}/10` 
  : '- This is the first question'}

Provide detailed analysis including:
1. Score (1-10) based on relevance, specificity, and structure
2. Constructive feedback
3. Confidence indicators
4. Suggested next question type (small_talk, behavioral, technical, situational, follow_up)
5. Adaptive insights for interview flow

Consider:
- If this is small talk, be encouraging and focus on building confidence
- If performance is consistently low, suggest easier questions or follow-ups
- If performance is strong, suggest more challenging questions
- After 5+ questions with good performance, consider concluding

Respond with JSON:
{
  "score": number,
  "feedback": "detailed constructive feedback",
  "followUpQuestion": "specific follow-up question if needed",
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
            content: 'You are an expert interview coach analyzing candidate responses. Provide constructive, specific feedback that helps candidates improve while being encouraging and realistic.'
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

    // Extract JSON from markdown code blocks if present
    const jsonContent = extractJsonFromMarkdown(content);
    return JSON.parse(jsonContent);

  } catch (error) {
    console.error('Error analyzing response:', error);
    return generateMockAnalysis(question, response, setup, previousResponses);
  }
};

// Mock analysis for fallback
const generateMockAnalysis = (
  question: Question,
  response: string,
  setup: InterviewSetup,
  previousResponses: any[]
) => {
  const responseLength = response.length;
  const hasSpecificExamples = response.toLowerCase().includes('example') || 
                             response.toLowerCase().includes('instance') ||
                             response.toLowerCase().includes('time when') ||
                             response.toLowerCase().includes('experience');
  const hasMetrics = /\d+/.test(response);
  const hasStructure = response.includes('first') || response.includes('then') || response.includes('finally') || response.includes('initially');
  
  let baseScore = question.type === 'small_talk' ? 7 : 5; // Be more generous with small talk
  if (responseLength > 150) baseScore += 1;
  if (hasSpecificExamples) baseScore += 2;
  if (hasMetrics) baseScore += 1;
  if (hasStructure) baseScore += 1;
  
  const score = Math.min(10, baseScore);
  const enthusiasm = Math.min(10, Math.max(3, Math.floor(responseLength / 20) + (hasSpecificExamples ? 2 : 0)));
  
  // Determine next question type based on performance and interview progress
  let nextQuestionType = 'behavioral';
  const avgScore = previousResponses.length > 0 
    ? previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length 
    : score;
  
  if (question.type === 'small_talk') {
    nextQuestionType = score >= 6 ? 'behavioral' : 'small_talk';
  } else if (previousResponses.length >= 4) {
    // Consider concluding after 5+ questions
    if (avgScore >= 7) {
      nextQuestionType = 'situational'; // Final challenging question
    } else if (score < 6) {
      nextQuestionType = 'follow_up';
    } else {
      nextQuestionType = 'behavioral';
    }
  } else if (score < 5) {
    nextQuestionType = 'follow_up';
  } else if (score >= 8 && question.type === 'behavioral') {
    nextQuestionType = 'technical';
  }

  const feedbackMessages = {
    small_talk: {
      high: "Great start! You seem comfortable and engaged. I can tell you're ready for the main interview questions.",
      medium: "Good! You're warming up nicely. Let's continue building that confidence.",
      low: "Thanks for sharing! Let's take a moment to get more comfortable before we dive deeper."
    },
    behavioral: {
      high: "Excellent response! You provided specific details and showed clear impact. This demonstrates strong experience.",
      medium: "Good answer! You shared relevant experience. Consider adding more specific examples and measurable outcomes.",
      low: "I appreciate you sharing that. Could you provide a more specific example with details about what you did and the results?"
    },
    technical: {
      high: "Outstanding technical knowledge! You explained complex concepts clearly and showed deep understanding.",
      medium: "Good technical understanding. Consider providing more specific examples or diving deeper into implementation details.",
      low: "That's a start. Let's explore this topic further with a more specific example or simpler approach."
    }
  };

  const questionTypeKey = question.type as keyof typeof feedbackMessages;
  const scoreLevel = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';
  const baseFeedback = feedbackMessages[questionTypeKey]?.[scoreLevel] || feedbackMessages.behavioral[scoreLevel];

  return {
    score,
    feedback: baseFeedback,
    followUpQuestion: hasSpecificExamples ? 
      "That's a great example. Can you tell me about the specific impact or outcome of your actions?" :
      "Could you provide a specific example from your experience to illustrate that point?",
    strengths: [
      hasSpecificExamples ? "Provided specific examples" : "Clear communication",
      hasStructure ? "Well-structured response" : "Relevant experience shared",
      hasMetrics ? "Included measurable results" : "Good understanding of the topic"
    ],
    areasForImprovement: [
      !hasSpecificExamples ? "Add more specific examples" : "Include more context about challenges",
      !hasMetrics ? "Include measurable outcomes" : "Expand on lessons learned",
      !hasStructure ? "Use structured approach (STAR method)" : "Connect more directly to role requirements"
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
  
  // Determine if interview should conclude
  if (previousResponses.length >= 5) {
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    const lastScore = previousResponses[previousResponses.length - 1]?.analysis?.score || 0;
    
    // Conclude if we have good performance and sufficient questions, or if we've reached max questions
    if ((avgScore >= 7 && lastScore >= 6) || previousResponses.length >= 8) {
      throw new Error('INTERVIEW_COMPLETE'); // Signal to complete interview
    }
  }
  
  // Determine question type based on interview flow and performance
  let questionType = suggestedType || 'behavioral';
  
  if (previousResponses.length === 0) {
    questionType = 'small_talk';
  } else {
    const lastResponse = previousResponses[previousResponses.length - 1];
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    
    // If last response was poor, provide follow-up or easier question
    if (lastResponse?.analysis?.score < 5) {
      questionType = 'follow_up';
    } else if (avgScore < 6 && previousResponses.length >= 2) {
      // If overall performance is low, stick to behavioral or provide easier questions
      questionType = 'behavioral';
    } else if (avgScore >= 8 && previousResponses.length >= 3) {
      // If performance is strong, escalate to technical or situational
      questionType = Math.random() > 0.5 ? 'technical' : 'situational';
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