import { InterviewCategory, InterviewLevel } from './sessionResult';

export type InterviewTrack =
  | 'software_engineering'
  | 'data_science'
  | 'product_management'
  | 'ux_design'
  | 'sales_customer_success'
  | 'business_finance'
  | 'general_professional';

export type WhiteboardMode = 'coding' | 'system_design' | 'product_case' | 'data_case';

export interface ScoringRubric {
  content: string[];
  delivery: string[];
  presence: string[];
}

export interface InterviewQuestionPlan {
  question_id: string;
  category: InterviewCategory;
  competency: string;
  lead_question: string;
  expected_evidence: string[];
  follow_up_triggers: string[];
  strong_answer_signals: string[];
  whiteboard_mode?: WhiteboardMode;
}

export interface FollowUpPolicy {
  ask_when: string[];
  move_on_when: string[];
  max_follow_ups_per_question: number;
}

export interface WhiteboardPolicy {
  enabled_modes: WhiteboardMode[];
  trigger_when: string[];
  expected_sections_by_mode: Record<WhiteboardMode, string[]>;
}

export interface InterviewBlueprint {
  blueprint_version: string;
  role: string;
  industry: string;
  level: InterviewLevel;
  track: InterviewTrack;
  interview_mix: InterviewCategory[];
  competencies: string[];
  question_plan: InterviewQuestionPlan[];
  follow_up_policy: FollowUpPolicy;
  whiteboard_policy: WhiteboardPolicy;
  scoring_rubric: ScoringRubric;
}

export interface WhiteboardToolRequest {
  request_id: string;
  tool_name: 'openWhiteboard' | 'captureWhiteboardState' | 'markWhiteboardMilestone' | 'closeWhiteboard';
  question_id?: string;
  mode?: WhiteboardMode;
  prompt?: string;
  constraints?: string[];
  expected_sections?: string[];
  milestone?: string;
  timestamp: string;
}
