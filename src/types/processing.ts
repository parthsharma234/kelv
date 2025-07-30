// Types for interview session processing status
export type InterviewProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface InterviewProcessingMetadata {
  startTime?: string;
  endTime?: string;
  currentStep?: string;
  progress?: number;
  error?: string;
}
