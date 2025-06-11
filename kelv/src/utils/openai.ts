import { InterviewSetup, Question } from '../types/interview';

// Mock function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock interview questions based on setup
const mockQuestions: Record<string, Question[]> = {
  'software_engineering': [
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
  'data_science': [
    {
      id: 'q1',
      text: 'Walk me through your approach to a complex data analysis problem.',
      type: 'behavioral'
    },
    {
      id: 'q2',
      text: 'How do you ensure the quality and reliability of your data?',
      type: 'behavioral'
    },
    {
      id: 'q3',
      text: 'Explain the difference between supervised and unsupervised learning.',
      type: 'technical'
    },
    {
      id: 'q4',
      text: 'How would you handle missing or corrupted data in a dataset?',
      type: 'technical'
    },
    {
      id: 'q5',
      text: 'Describe a situation where you had to communicate complex data insights to non-technical stakeholders.',
      type: 'situational'
    }
  ]
};

export const generateInterviewQuestions = async (setup: InterviewSetup): Promise<Question[]> => {
  // Simulate API delay
  await delay(1500);
  
  // Return mock questions based on industry
  const questions = mockQuestions[setup.industry] || mockQuestions['software_engineering'];
  
  // Adjust number of questions based on experience level
  const questionCount = setup.experienceLevel === 'senior' ? 5 : 3;
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
  
  // Mock analysis response
  return {
    score: Math.floor(Math.random() * 4) + 7, // Random score between 7-10
    feedback: "Good response! You demonstrated clear communication and relevant experience. Consider adding more specific examples to strengthen your answer.",
    followUpQuestion: "Could you elaborate on a specific example from your experience?",
    strengths: [
      "Clear communication",
      "Relevant experience",
      "Good structure"
    ],
    areasForImprovement: [
      "Add more specific examples",
      "Include measurable outcomes",
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