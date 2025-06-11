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
            content: `You are an expert AI interviewer conducting a comprehensive ${setup.jobType} interview for a ${setup.experienceLevel} candidate in the ${setup.industry} industry. 

CRITICAL INTERVIEW GUIDELINES:
- Conduct THOROUGH interviews with 8-12 questions minimum
- Cover ALL major areas: background, behavioral, technical, situational, and role-specific questions
- Ask SPECIFIC follow-up questions that dig deeper into the candidate's actual responses
- When asking follow-ups, reference their exact words and ask for more details about what they mentioned
- Adapt difficulty based on performance but maintain comprehensive coverage
- Only conclude when you've thoroughly assessed the candidate across all dimensions

FOLLOW-UP STRATEGY:
- If they mention a specific technology, project, or experience, ask detailed questions about it
- If they give a high-level answer, ask for specific examples and details
- If they mention challenges or successes, dig into the specifics of how they handled it
- Reference their exact words when asking follow-ups (e.g., "You mentioned X, can you tell me more about...")

QUESTION TYPES TO COVER:
1. Small talk (1-2 questions)
2. Background and motivation (2-3 questions)
3. Behavioral/STAR method questions (3-4 questions)
4. Technical/role-specific questions (2-4 questions)
5. Situational/problem-solving (1-2 questions)
6. Follow-up questions based on their specific responses

Always respond with a JSON object:
{
  "question": "The interview question text",
  "type": "question_type",
  "category": "specific_category", 
  "difficulty": "easy|medium|hard",
  "reasoning": "Why this question was chosen and how it builds on previous responses"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
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
  
  // Add comprehensive interview context
  prompt += `INTERVIEW PROGRESS: Question ${previousResponses.length + 1} of planned 8-12 questions\n\n`;
  
  if (previousResponses.length > 0) {
    prompt += `PREVIOUS RESPONSES AND CONTEXT:\n`;
    previousResponses.forEach((response, index) => {
      const score = response.analysis?.score || 0;
      const confidence = response.analysis?.confidenceIndicators?.enthusiasm || 5;
      prompt += `Q${index + 1}: "${response.questionText || 'Previous question'}"\n`;
      prompt += `Response: "${response.response}"\n`;
      prompt += `Score: ${score}/10, Confidence: ${confidence}/10\n`;
      prompt += `Feedback: ${response.analysis?.feedback || 'No feedback'}\n\n`;
    });
    
    // Calculate performance metrics
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    prompt += `PERFORMANCE ANALYSIS:\n`;
    prompt += `- Average performance: ${avgScore.toFixed(1)}/10\n`;
    prompt += `- Total questions asked: ${previousResponses.length}\n`;
    prompt += `- Focus areas: ${aiState.focusAreas.join(', ') || 'General interview skills'}\n`;
    prompt += `- Question flow: ${aiState.questionFlow}\n\n`;
  }

  // Specific instructions based on question type
  if (questionType === 'small_talk') {
    prompt += `SMALL TALK INSTRUCTIONS:\n`;
    prompt += `Generate a warm, engaging question to build rapport and help the candidate feel comfortable.\n`;
    prompt += `Keep it professional but friendly. This should ease them into the interview.\n`;
  } 
  else if (questionType === 'follow_up') {
    const lastResponse = previousResponses[previousResponses.length - 1];
    if (lastResponse) {
      prompt += `FOLLOW-UP INSTRUCTIONS:\n`;
      prompt += `The candidate just said: "${lastResponse.response}"\n`;
      prompt += `Generate a specific follow-up question that:\n`;
      prompt += `- References something specific they mentioned in their response\n`;
      prompt += `- Asks for more details, examples, or clarification about what they said\n`;
      prompt += `- Digs deeper into their experience, process, or thinking\n`;
      prompt += `- Uses phrases like "You mentioned..." or "Tell me more about..." or "Can you elaborate on..."\n`;
      prompt += `- Builds directly on their actual words and content\n\n`;
      prompt += `Their performance on the last question was ${lastResponse.analysis?.score || 0}/10.\n`;
      if (lastResponse.analysis?.score < 6) {
        prompt += `Since they struggled, help them succeed by asking a more specific or easier follow-up.\n`;
      } else {
        prompt += `Since they did well, you can dig deeper or ask for more complex details.\n`;
      }
    }
  }
  else if (questionType === 'behavioral') {
    prompt += `BEHAVIORAL QUESTION INSTRUCTIONS:\n`;
    prompt += `Generate a behavioral question using the STAR method framework.\n`;
    prompt += `Focus on: leadership, teamwork, problem-solving, conflict resolution, or achievement.\n`;
    prompt += `Adjust difficulty based on their experience level and previous performance.\n`;
    if (previousResponses.length > 0) {
      const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
      if (avgScore < 6) {
        prompt += `Make this question more straightforward since they've been struggling.\n`;
      } else if (avgScore >= 8) {
        prompt += `Make this question more challenging since they're performing well.\n`;
      }
    }
  }
  else if (questionType === 'technical') {
    prompt += `TECHNICAL QUESTION INSTRUCTIONS:\n`;
    prompt += `Generate a technical question relevant to the ${setup.jobType} role.\n`;
    prompt += `Adjust complexity based on their experience level (${setup.experienceLevel}) and previous responses.\n`;
    prompt += `Focus on practical skills, problem-solving, or industry knowledge.\n`;
  }
  else if (questionType === 'situational') {
    prompt += `SITUATIONAL QUESTION INSTRUCTIONS:\n`;
    prompt += `Generate a hypothetical scenario question relevant to the role.\n`;
    prompt += `Present a realistic workplace situation they might encounter.\n`;
    prompt += `Ask how they would handle it, focusing on their thought process and approach.\n`;
  }

  // Interview conclusion logic - be more deliberate about when to end
  if (previousResponses.length >= 7) {
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    prompt += `\nINTERVIEW CONCLUSION CONSIDERATION:\n`;
    prompt += `We've asked ${previousResponses.length} questions with average score ${avgScore.toFixed(1)}/10.\n`;
    
    // Only suggest conclusion if we've covered enough ground AND performance is clear
    if (previousResponses.length >= 10 || (previousResponses.length >= 8 && (avgScore >= 8 || avgScore <= 4))) {
      prompt += `Consider if this should be a concluding question that wraps up the interview naturally.\n`;
      prompt += `If concluding, make it a final assessment question or ask about their questions for us.\n`;
    } else {
      prompt += `Continue the interview - we need more comprehensive coverage of their abilities.\n`;
      prompt += `Focus on areas we haven't fully explored yet.\n`;
    }
  } else {
    prompt += `\nCONTINUE INTERVIEW: We need more questions to thoroughly assess the candidate.\n`;
    prompt += `Ensure we cover all major competency areas before concluding.\n`;
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

  // For follow-up questions, reference the last response
  if (questionType === 'follow_up' && previousResponses.length > 0) {
    const lastResponse = previousResponses[previousResponses.length - 1];
    const responseText = lastResponse.response.toLowerCase();
    
    // Generate contextual follow-ups based on what they mentioned
    if (responseText.includes('project') || responseText.includes('built') || responseText.includes('developed')) {
      return {
        id: 'followup_project',
        text: `You mentioned working on a project. Can you walk me through the specific technologies you used and any challenges you encountered during development?`,
        type: 'follow_up',
        category: 'project_details',
        difficulty: 'medium'
      };
    } else if (responseText.includes('team') || responseText.includes('collaborate')) {
      return {
        id: 'followup_team',
        text: `You mentioned working with a team. Tell me more about your role in that team and how you handled any disagreements or conflicts that arose.`,
        type: 'follow_up',
        category: 'teamwork_details',
        difficulty: 'medium'
      };
    } else if (responseText.includes('challenge') || responseText.includes('difficult') || responseText.includes('problem')) {
      return {
        id: 'followup_challenge',
        text: `You mentioned facing a challenge. Can you break down your specific approach to solving it and what you learned from that experience?`,
        type: 'follow_up',
        category: 'problem_solving_details',
        difficulty: 'medium'
      };
    } else {
      return {
        id: 'followup_general',
        text: `That's interesting. Can you give me a specific example of what you just described and walk me through the details?`,
        type: 'follow_up',
        category: 'elaboration',
        difficulty: 'medium'
      };
    }
  }

  // Determine difficulty based on previous performance
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (previousResponses.length > 0) {
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    if (avgScore < 6) difficulty = 'easy';
    else if (avgScore >= 8) difficulty = 'hard';
  }

  // Comprehensive mock questions by industry and type
  const mockQuestions: Record<string, Record<string, Record<string, Question[]>>> = {
    'Technology': {
      'behavioral': {
        'easy': [
          {
            id: 'tech_beh_easy_1',
            text: 'Tell me about a time when you had to learn a new technology or programming language. How did you approach it?',
            type: 'behavioral',
            category: 'learning',
            difficulty: 'easy'
          },
          {
            id: 'tech_beh_easy_2',
            text: 'Describe a project you worked on that you\'re particularly proud of. What made it special?',
            type: 'behavioral',
            category: 'achievement',
            difficulty: 'easy'
          },
          {
            id: 'tech_beh_easy_3',
            text: 'Tell me about a time when you helped a colleague or teammate. What was the situation?',
            type: 'behavioral',
            category: 'collaboration',
            difficulty: 'easy'
          }
        ],
        'medium': [
          {
            id: 'tech_beh_med_1',
            text: 'Describe a situation where you had to work with a difficult team member. How did you handle it?',
            type: 'behavioral',
            category: 'teamwork',
            difficulty: 'medium'
          },
          {
            id: 'tech_beh_med_2',
            text: 'Tell me about a time when you had to meet a tight deadline. What was your approach?',
            type: 'behavioral',
            category: 'time_management',
            difficulty: 'medium'
          },
          {
            id: 'tech_beh_med_3',
            text: 'Describe a time when you had to debug a particularly challenging issue. Walk me through your process.',
            type: 'behavioral',
            category: 'problem_solving',
            difficulty: 'medium'
          }
        ],
        'hard': [
          {
            id: 'tech_beh_hard_1',
            text: 'Tell me about a time when you had to make a technical decision with incomplete information. How did you approach it?',
            type: 'behavioral',
            category: 'decision_making',
            difficulty: 'hard'
          },
          {
            id: 'tech_beh_hard_2',
            text: 'Describe a situation where you had to influence others to adopt a technical solution without having direct authority.',
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
            text: 'What programming languages and frameworks are you most comfortable with, and why do you prefer them?',
            type: 'technical',
            category: 'programming',
            difficulty: 'easy'
          },
          {
            id: 'tech_tech_easy_2',
            text: 'How do you typically approach testing your code? What tools or methods do you use?',
            type: 'technical',
            category: 'testing',
            difficulty: 'easy'
          }
        ],
        'medium': [
          {
            id: 'tech_tech_med_1',
            text: 'How would you explain the concept of APIs to a non-technical stakeholder?',
            type: 'technical',
            category: 'communication',
            difficulty: 'medium'
          },
          {
            id: 'tech_tech_med_2',
            text: 'Walk me through how you would optimize a slow-performing database query.',
            type: 'technical',
            category: 'optimization',
            difficulty: 'medium'
          }
        ],
        'hard': [
          {
            id: 'tech_tech_hard_1',
            text: 'How would you design a system to handle millions of concurrent users? What are the key considerations?',
            type: 'technical',
            category: 'system_design',
            difficulty: 'hard'
          },
          {
            id: 'tech_tech_hard_2',
            text: 'Explain how you would implement a real-time notification system. What technologies and patterns would you use?',
            type: 'technical',
            category: 'architecture',
            difficulty: 'hard'
          }
        ]
      },
      'situational': {
        'easy': [
          {
            id: 'tech_sit_easy_1',
            text: 'If you discovered a security vulnerability in production code, what would be your immediate steps?',
            type: 'situational',
            category: 'security',
            difficulty: 'easy'
          }
        ],
        'medium': [
          {
            id: 'tech_sit_med_1',
            text: 'Your team is split on whether to use Technology A or Technology B for a new project. How would you help resolve this?',
            type: 'situational',
            category: 'decision_making',
            difficulty: 'medium'
          }
        ],
        'hard': [
          {
            id: 'tech_sit_hard_1',
            text: 'You\'re leading a project that\'s behind schedule, and stakeholders are pressuring you to cut corners on testing. How do you handle this?',
            type: 'situational',
            category: 'leadership_pressure',
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

Interview Context:
- Question ${previousResponses.length + 1} of planned 8-12 question comprehensive interview
- Experience level: ${setup.experienceLevel}
- Previous performance: ${previousResponses.length > 0 ? 
  `Average score: ${(previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length).toFixed(1)}/10` 
  : 'First question'}

ANALYSIS REQUIREMENTS:
1. Score (1-10) based on relevance, specificity, structure, and depth
2. Constructive feedback that helps them improve
3. Confidence indicators assessment
4. Strategic next question type recommendation
5. Adaptive insights for interview progression

NEXT QUESTION STRATEGY:
- If response lacks detail or examples: suggest "follow_up" to dig deeper
- If performance is strong and we need technical assessment: suggest "technical"
- If we need behavioral examples: suggest "behavioral"
- If we need scenario-based assessment: suggest "situational"
- Only suggest conclusion after 8+ questions with comprehensive coverage

FOLLOW-UP LOGIC:
- If they mention specific technologies, projects, or experiences, recommend follow-up
- If answer is vague or high-level, recommend follow-up for specifics
- If they show expertise in one area, probe deeper with follow-up

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
            content: 'You are an expert interview coach analyzing candidate responses. Provide constructive, specific feedback that helps candidates improve while being encouraging and realistic. Focus on comprehensive interview coverage and strategic question progression.'
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
                             response.toLowerCase().includes('experience') ||
                             response.toLowerCase().includes('project') ||
                             response.toLowerCase().includes('worked on');
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
  
  // More deliberate question progression
  if (question.type === 'small_talk') {
    nextQuestionType = 'behavioral'; // Always move to behavioral after small talk
  } else if (previousResponses.length < 3) {
    // Early interview - focus on behavioral questions
    nextQuestionType = score < 6 ? 'follow_up' : 'behavioral';
  } else if (previousResponses.length < 6) {
    // Mid interview - mix behavioral and technical
    if (score < 5) {
      nextQuestionType = 'follow_up';
    } else if (score >= 7 && !previousResponses.some(r => r.questionType === 'technical')) {
      nextQuestionType = 'technical';
    } else {
      nextQuestionType = 'behavioral';
    }
  } else if (previousResponses.length < 8) {
    // Later interview - technical and situational
    if (score < 5) {
      nextQuestionType = 'follow_up';
    } else if (score >= 7) {
      nextQuestionType = Math.random() > 0.5 ? 'technical' : 'situational';
    } else {
      nextQuestionType = 'behavioral';
    }
  } else {
    // Final questions - wrap up or conclude
    if (avgScore >= 7 && previousResponses.length >= 8) {
      nextQuestionType = 'situational'; // Final challenging question
    } else if (score < 6) {
      nextQuestionType = 'follow_up';
    } else {
      nextQuestionType = 'behavioral';
    }
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
    },
    follow_up: {
      high: "Perfect! That additional detail really helps me understand your experience and approach.",
      medium: "Good elaboration. The extra context helps paint a clearer picture of your capabilities.",
      low: "Thank you for the additional information. Let's continue exploring your experience."
    },
    situational: {
      high: "Excellent problem-solving approach! You considered multiple factors and provided a thoughtful solution.",
      medium: "Good thinking! You showed a solid approach to handling this type of situation.",
      low: "That's a reasonable start. Consider thinking through the potential challenges and stakeholder impacts."
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
  
  // More deliberate interview conclusion logic
  if (previousResponses.length >= 8) {
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    const lastScore = previousResponses[previousResponses.length - 1]?.analysis?.score || 0;
    
    // Only conclude if we have comprehensive coverage AND clear performance assessment
    const hasGoodCoverage = previousResponses.length >= 10;
    const hasClearPerformance = (avgScore >= 8 && lastScore >= 7) || (avgScore <= 4 && lastScore <= 5);
    const hasMaxQuestions = previousResponses.length >= 12;
    
    if (hasMaxQuestions || (hasGoodCoverage && hasClearPerformance)) {
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
    
    // Enhanced question type logic
    if (lastResponse?.analysis?.score < 5) {
      questionType = 'follow_up'; // Always follow up on poor responses
    } else if (questionType === 'follow_up') {
      // Use the suggested type from analysis
      questionType = suggestedType || 'behavioral';
    }
  }

  // Add the question text to the response for better follow-up context
  const question = await generateDynamicQuestion(setup, previousResponses, aiState, questionType);
  
  // Store the question text in the response for follow-up reference
  if (previousResponses.length > 0) {
    const lastResponse = previousResponses[previousResponses.length - 1];
    lastResponse.questionText = question.text;
  }
  
  return question;
};

export const synthesizeSpeech = async (text: string): Promise<HTMLAudioElement | null> => {
  // Simulate API delay
  await delay(1000);
  
  // In UI mode, we don't actually synthesize speech
  // This is just a mock to simulate the delay
  return null;
};