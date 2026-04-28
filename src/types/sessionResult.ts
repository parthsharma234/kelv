import { InterviewMetrics, PostureAnalysisData, TranscriptMessage } from '../utils/analyticsEngine';
import { PerQuestionAnalysis } from '../utils/perQuestionAnalytics';
import { VoiceMetrics } from './interview';

export type InterviewLevel = 'entry' | 'mid' | 'senior' | 'executive';
export type InterviewCategory =
  | 'behavioral'
  | 'technical'
  | 'technical_depth'
  | 'coding'
  | 'system_design'
  | 'product_case'
  | 'data_case'
  | 'situational'
  | 'leadership'
  | 'communication'
  | 'resume_deep_dive'
  | 'company_fit'
  | 'candidate_questions';
export type SessionPhase = 'opening' | 'calibration' | 'core' | 'pressure' | 'candidate_questions' | 'close';

export interface InterviewPromptContext {
  role: string;
  industry: string;
  level: InterviewLevel;
  category: InterviewCategory;
  resume_summary: string;
  jd_summary: string;
  session_phase: SessionPhase;
}

export interface QuestionEvaluation {
  question_id: string;
  category: InterviewCategory | string;
  content_score: number;
  delivery_score: number;
  presence_score: number;
  evidence_gaps: string[];
  next_rep: string;
}

export interface PracticePlan {
  weak_point: string;
  drill_type: string;
  repetition_target: number;
  completion_criteria: string;
  source_question_id?: string;
  source_question_number?: number;
  priority: 'low' | 'medium' | 'high';
}

export interface ReliabilityWindow {
  window_id: string;
  start_sec: number;
  end_sec: number;
  confidence: number;
  reason_flags: string[];
}

export interface SignalReliability {
  overall_confidence: number;
  content_confidence: number;
  delivery_confidence: number;
  presence_confidence: number;
  reason_flags: string[];
  windows: ReliabilityWindow[];
}

export interface VoiceCvSignalFusion {
  engine_version: string;
  voice: {
    audio_source: 'recording_blob' | 'transcript_proxy';
    pace_score: number;
    filler_control: number;
    pause_control: number;
    articulation_proxy: number;
    clarity_score: number;
    fluency_score: number;
    vocal_variety_proxy: number;
    confidence: number;
    flags: string[];
  };
  vision: {
    posture_score: number;
    shoulder_alignment: number;
    head_centering: number;
    visual_stability: number;
    sample_count: number;
    sample_coverage: number;
    tracking_loss_rate: number;
    confidence: number;
    flags: string[];
  };
  fused: {
    delivery_presence_score: number;
    interview_readiness_signal: 'strong' | 'developing' | 'limited';
    coaching_focus: string[];
    reliability_weight: number;
  };
}

export interface SessionResultV2 {
  id?: string;
  transcript: Array<{
    role: 'assistant' | 'user' | 'system';
    content: string;
    timestamp: string;
  }>;
  timing: {
    duration_sec: number;
    speaking_rate_wpm?: number;
    filler_word_count?: number;
    hesitation_index?: number;
  };
  posture_summary?: {
    sample_count: number;
    overall_score: number;
    shoulder_alignment: number;
    head_position: 'centered' | 'forward' | 'tilted';
    time_in_good_posture: number;
  };
  per_question_results: QuestionEvaluation[];
  overall_scores: {
    content: number;
    delivery: number;
    presence: number;
    overall: number;
  };
  recommended_drills: PracticePlan[];
  signal_reliability: SignalReliability;
  signal_fusion?: VoiceCvSignalFusion;
  processing_metadata: {
    pipeline_version: string;
    transcript_vendor: 'openai' | 'self_hosted_whisper' | 'hybrid' | 'vapi' | 'elevenlabs';
    used_fallback: boolean;
    reliability_flags: string[];
    processing_source: string;
  };
}

export interface SessionResultBuildInput {
  id?: string;
  transcript: TranscriptMessage[];
  duration: number;
  metrics: InterviewMetrics;
  voiceMetrics?: VoiceMetrics;
  perQuestionAnalysis: PerQuestionAnalysis;
  postureData?: PostureAnalysisData;
  jobContext?: {
    role?: string;
    industry?: string;
    experienceLevel?: string;
    jobDescription?: string;
    resumeSummary?: string;
  };
  processingSource?: string;
  transcriptVendor?: SessionResultV2['processing_metadata']['transcript_vendor'];
}
