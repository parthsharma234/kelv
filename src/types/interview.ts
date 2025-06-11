export interface InterviewSetup {
  industry: string;
  jobType: string;
  experienceLevel: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'behavioral' | 'technical' | 'situational';
  followUp?: string;
}

export interface InterviewSession {
  id: string;
  setup: InterviewSetup;
  questions: Question[];
  currentQuestionIndex: number;
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
  responses: InterviewResponse[];
}

export interface InterviewResponse {
  questionId: string;
  response: string;
  analysis?: {
    score: number;
    feedback: string;
    followUpQuestion?: string;
    strengths: string[];
    areasForImprovement: string[];
  };
  timestamp: Date;
}

export interface InterviewHistory {
  id: string;
  date: Date;
  setup: InterviewSetup;
  overallScore: number;
  duration: number;
  questionsAnswered: number;
  status: 'completed' | 'incomplete';
}