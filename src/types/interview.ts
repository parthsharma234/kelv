export interface InterviewSetup {
  industry: string;
  jobType: string;
  experienceLevel: string;
  interviewMode: 'voice' | 'text';
}

export interface Question {
  id: string;
  text: string;
  type: 'opening' | 'small_talk' | 'behavioral' | 'technical' | 'situational' | 'follow_up' | 'problem_solving' | 'leadership' | 'cultural_fit' | 'caseStudy' | 'systemDesign' | 'leadershipAssessment';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  followUp?: string;
}

export interface SpeechMetrics {
  // Audio quality metrics
  audioQuality: {
    signalToNoiseRatio: number;
    clarity: number;
    volume: number;
  };
  
  // Speech timing metrics
  timing: {
    totalDuration: number;
    speechDuration: number;
    pauseDuration: number;
    speechRate: number; // words per minute
    pauseFrequency: number;
    averagePauseLength: number;
  };
  
  // Voice characteristics
  voice: {
    fundamentalFrequency: number; // pitch
    pitchVariation: number;
    intensity: number;
    voiceStability: number;
  };
  
  // Fluency metrics
  fluency: {
    fillerWords: number;
    repetitions: number;
    selfCorrections: number;
    hesitations: number;
    fluencyScore: number; // 0-100
  };
  
  // Confidence indicators
  confidence: {
    voiceConfidence: number; // 0-100
    speechClarity: number;
    paceConsistency: number;
    overallConfidence: number;
  };
  
  // Emotional analysis
  emotion: {
    energy: number;
    stress: number;
    enthusiasm: number;
    nervousness: number;
  };
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
  audioBlob?: Blob; // Store audio for speech analysis
  speechMetrics?: SpeechMetrics; // Detailed speech analysis
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
      quantifiableResults: boolean;
    };
    nextQuestionType?: string;
    performanceTrend?: string;
    roleAlignment?: string;
    culturalFit?: string;
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
  speechMetricsAverage?: {
    overallConfidence: number;
    fluencyScore: number;
    speechRate: number;
    voiceStability: number;
  };
}

export interface AIInterviewerState {
  currentPersonality: 'friendly' | 'formal' | 'challenging';
  adaptationLevel: number; // How much to adapt based on responses
  questionFlow: 'linear' | 'adaptive' | 'branching';
  focusAreas: string[]; // Areas to focus on based on performance
}