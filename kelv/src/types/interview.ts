export interface InterviewSetup {
  industry: string;
  jobType: string;
  experienceLevel: 'junior' | 'mid' | 'senior';
}

export interface Question {
  id: string;
  text: string;
  type: 'behavioral' | 'technical' | 'situational';
  followUp?: string;
}

export interface InterviewSession {
  setup: InterviewSetup;
  questions: Question[];
  currentQuestionIndex: number;
  isActive: boolean;
  startTime?: Date;
}