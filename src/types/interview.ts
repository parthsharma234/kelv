export interface InterviewSetup {
  industry: string;
  jobType: string;
  experienceLevel: string;
  interviewMode: 'voice' | 'text';
}

export interface Question {
  id: string;
  text: string;
  type: 'small_talk' | 'behavioral' | 'technical' | 'situational' | 'follow_up';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
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
  aiPersonality: 'friendly' | 'formal' | 'challenging';
  adaptiveState: {
    confidenceLevel: number; // 1-10
    performanceLevel: number; // 1-10
    communicationStyle: 'concise' | 'detailed' | 'storytelling';
    strugglingAreas: string[];
    strongAreas: string[];
  };
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
    confidenceIndicators: {
      responseLength: number;
      specificExamples: boolean;
      structuredAnswer: boolean;
      enthusiasm: number; // 1-10
    };
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

export interface AIInterviewerState {
  currentPersonality: 'friendly' | 'formal' | 'challenging';
  adaptationLevel: number; // How much to adapt based on responses
  questionFlow: 'linear' | 'adaptive' | 'branching';
  focusAreas: string[]; // Areas to focus on based on performance
}