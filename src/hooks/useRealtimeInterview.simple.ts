interface UseRealtimeInterviewOptions {
  setup: any;
  interviewType?: string;
  onComplete?: (sessionData: any) => void;
  onError?: (error: string) => void;
}

export function useRealtimeInterview(options: UseRealtimeInterviewOptions) {
  return {
    state: {
      status: 'idle' as const,
      transcript: [],
      currentQuestion: '',
      isAISpeaking: false,
      isUserSpeaking: false,
      isRecording: false,
      error: null,
      sessionId: null,
      duration: 0,
      questionCount: 0
    },
    startInterview: async () => {},
    pauseInterview: () => {},
    resumeInterview: () => {},
    endInterview: async () => {},
    startRecording: async () => false,
    stopRecording: () => {},
    sendTextMessage: (message: string) => {}
  };
}

export interface RealtimeInterviewState {
  status: 'idle' | 'connecting' | 'connected' | 'interviewing' | 'paused' | 'completed' | 'error';
  transcript: any[];
  currentQuestion: string;
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  isRecording: boolean;
  error: string | null;
  sessionId: string | null;
  duration: number;
  questionCount: number;
}
