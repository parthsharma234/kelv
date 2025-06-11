import { InterviewSetup, Question } from '../types/interview';

// Mock function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock interview questions based on setup
const mockQuestions: Record<string, Question[]> = {
  'Technology': [
    {
      id: 'q1',
      text: 'Tell me about a challenging project you worked on and how you overcame obstacles.',
      type: 'behavioral'
    },
    {
      id: 'q2',
      text: 'How do you handle technical disagreements with team members?',
      type: 'behavioral'
    },
    {
      id: 'q3',
      text: 'Explain the concept of dependency injection and its benefits.',
      type: 'technical'
    },
    {
      id: 'q4',
      text: 'How would you design a scalable microservices architecture?',
      type: 'technical'
    },
    {
      id: 'q5',
      text: 'Describe a situation where you had to make a difficult technical decision.',
      type: 'situational'
    }
  ],
  'Healthcare': [
    {
      id: 'q1',
      text: 'How do you handle high-pressure situations in a healthcare environment?',
      type: 'behavioral'
    },
    {
      id: 'q2',
      text: 'Describe a time when you had to communicate complex medical information to a patient.',
      type: 'behavioral'
    },
    {
      id: 'q3',
      text: 'What protocols would you follow for patient safety?',
      type: 'technical'
    },
    {
      id: 'q4',
      text: 'How do you stay updated with the latest medical practices?',
      type: 'technical'
    },
    {
      id: 'q5',
      text: 'Describe a situation where you had to work with a difficult colleague.',
      type: 'situational'
    }
  ],
  'Finance': [
    {
      id: 'q1',
      text: 'Walk me through your approach to financial risk assessment.',
      type: 'behavioral'
    },
    {
      id: 'q2',
      text: 'How do you ensure accuracy in financial reporting?',
      type: 'behavioral'
    },
    {
      id: 'q3',
      text: 'Explain the difference between NPV and IRR.',
      type: 'technical'
    },
    {
      id: 'q4',
      text: 'How would you value a company using multiple methods?',
      type: 'technical'
    },
    {
      id: 'q5',
      text: 'Describe a time when you had to present financial data to non-financial stakeholders.',
      type: 'situational'
    }
  ]
};

export const generateInterviewQuestions = async (setup: InterviewSetup): Promise<Question[]> => {
  // Simulate API delay
  await delay(1500);
  
  // Return mock questions based on industry
  const questions = mockQuestions[setup.industry] || mockQuestions['Technology'];
  
  // Adjust number of questions based on experience level
  const questionCount = setup.experienceLevel.includes('Senior') || setup.experienceLevel.includes('Executive') ? 5 : 3;
  return questions.slice(0, questionCount);
};

export const analyzeResponse = async (
  question: Question,
  response: string,
  setup: InterviewSetup
): Promise<{
  score: number;
  feedback: string;
  followUpQuestion: string;
  strengths: string[];
  areasForImprovement: string[];
}> => {
  // Simulate API delay
  await delay(2000);
  
  // Mock analysis response with some variation based on response length and content
  const responseLength = response.length;
  const hasSpecificExamples = response.toLowerCase().includes('example') || response.toLowerCase().includes('instance');
  const hasMetrics = /\d+/.test(response);
  
  let baseScore = 6;
  if (responseLength > 200) baseScore += 1;
  if (hasSpecificExamples) baseScore += 1;
  if (hasMetrics) baseScore += 1;
  
  const score = Math.min(10, baseScore + Math.floor(Math.random() * 2));
  
  return {
    score,
    feedback: `${score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : 'Fair'} response! You demonstrated clear communication and relevant experience. ${hasSpecificExamples ? 'Great use of specific examples.' : 'Consider adding more specific examples to strengthen your answer.'} ${hasMetrics ? 'Good inclusion of measurable outcomes.' : 'Including quantifiable results would enhance your response.'}`,
    followUpQuestion: "Could you elaborate on a specific challenge you faced in that situation and how you overcame it?",
    strengths: [
      "Clear communication",
      hasSpecificExamples ? "Specific examples provided" : "Structured approach",
      hasMetrics ? "Quantifiable results mentioned" : "Relevant experience shared"
    ],
    areasForImprovement: [
      !hasSpecificExamples ? "Add more specific examples" : "Include more context",
      !hasMetrics ? "Include measurable outcomes" : "Expand on impact",
      "Connect more directly to the role requirements"
    ]
  };
};

export const synthesizeSpeech = async (text: string): Promise<HTMLAudioElement | null> => {
  // Simulate API delay
  await delay(1000);
  
  // In UI mode, we don't actually synthesize speech
  // This is just a mock to simulate the delay
  return null;
};