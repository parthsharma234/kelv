import {
  FollowUpPolicy,
  InterviewBlueprint,
  InterviewQuestionPlan,
  InterviewTrack,
  WhiteboardMode,
  WhiteboardPolicy
} from '../types/interviewIntelligence';
import { InterviewCategory, InterviewLevel, InterviewPromptContext } from '../types/sessionResult';

const BLUEPRINT_VERSION = 'kelv-interview-blueprint-v1.0.0';

const BASE_FOLLOW_UP_POLICY: FollowUpPolicy = {
  ask_when: [
    'The answer does not include a concrete situation, action, and result.',
    'The candidate makes a claim without measurable proof, scope, ownership, or tradeoffs.',
    'A technical answer misses constraints, edge cases, testing, failure handling, or complexity.',
    'A case answer misses assumptions, success metrics, prioritization, or user/business impact.',
    'The answer is generic, too short, contradicted by earlier context, or avoids the question.'
  ],
  move_on_when: [
    'The candidate gives specific evidence that maps to the competency and rubric.',
    'One strong follow-up has already clarified the missing evidence.',
    'The candidate is struggling and coverage across other categories is more valuable.',
    'Session pacing would be hurt by another probe.'
  ],
  max_follow_ups_per_question: 2
};

const WHITEBOARD_POLICY: WhiteboardPolicy = {
  enabled_modes: ['coding', 'system_design', 'product_case', 'data_case'],
  trigger_when: [
    'The question requires visual decomposition, structured tradeoff analysis, or step-by-step reasoning.',
    'The candidate asks to think through an architecture, algorithm, product flow, metric tree, or data pipeline.',
    'The interviewer needs to evaluate reasoning process instead of only the final verbal answer.'
  ],
  expected_sections_by_mode: {
    coding: ['Problem restatement', 'Approach', 'Edge cases', 'Complexity', 'Tests'],
    system_design: ['Requirements', 'API/data model', 'Architecture', 'Bottlenecks', 'Tradeoffs'],
    product_case: ['Goal', 'Users', 'Options', 'Metrics', 'Risks'],
    data_case: ['Question', 'Data needed', 'Method', 'Validation', 'Business readout']
  }
};

export function buildInterviewBlueprint(context: InterviewPromptContext): InterviewBlueprint {
  const track = inferInterviewTrack(context.role, context.industry);
  const questionPlan = buildQuestionPlan(track, context.level);
  const interviewMix = Array.from(new Set(questionPlan.map((question) => question.category)));

  return {
    blueprint_version: BLUEPRINT_VERSION,
    role: context.role,
    industry: context.industry,
    level: context.level,
    track,
    interview_mix: interviewMix,
    competencies: buildCompetencies(track, context.level),
    question_plan: questionPlan,
    follow_up_policy: BASE_FOLLOW_UP_POLICY,
    whiteboard_policy: WHITEBOARD_POLICY,
    scoring_rubric: {
      content: [
        'Answers are specific, role-relevant, and grounded in evidence.',
        'Behavioral answers show situation, action, ownership, result, and learning.',
        'Technical/case answers show constraints, alternatives, tradeoffs, validation, and clear conclusions.'
      ],
      delivery: [
        'Answers are concise enough to follow but detailed enough to be credible.',
        'Candidate manages pace, pauses intentionally, and avoids filler-heavy rambling.',
        'Candidate accepts challenge without becoming defensive.'
      ],
      presence: [
        'Candidate stays composed under follow-up pressure.',
        'Candidate maintains steady posture and professional screen presence.',
        'Candidate communicates with audience awareness and structured thinking.'
      ]
    }
  };
}

export function summarizeBlueprintForPrompt(blueprint: InterviewBlueprint): string {
  const questions = blueprint.question_plan
    .map((question, index) => {
      const whiteboard = question.whiteboard_mode ? ` Whiteboard mode: ${question.whiteboard_mode}.` : '';
      return `${index + 1}. [${question.category}] ${question.lead_question} Competency: ${question.competency}. Expected evidence: ${question.expected_evidence.join('; ')}.${whiteboard}`;
    })
    .join('\n');

  return [
    `Blueprint version: ${blueprint.blueprint_version}`,
    `Track: ${blueprint.track}`,
    `Interview mix: ${blueprint.interview_mix.join(', ')}`,
    `Competencies: ${blueprint.competencies.join(', ')}`,
    'Question plan:',
    questions,
    `Follow-up rule: ask when ${blueprint.follow_up_policy.ask_when.join(' | ')}`,
    `Move-on rule: move on when ${blueprint.follow_up_policy.move_on_when.join(' | ')}`,
    `Whiteboard triggers: ${blueprint.whiteboard_policy.trigger_when.join(' | ')}`
  ].join('\n');
}

function inferInterviewTrack(role: string, industry: string): InterviewTrack {
  const source = `${role} ${industry}`.toLowerCase();

  if (/\b(software|frontend|backend|full stack|developer|engineer|platform|mobile|devops|cloud)\b/.test(source)) {
    return 'software_engineering';
  }
  if (/\b(data scientist|machine learning|analytics|ml engineer|ai engineer|modeling|data analyst)\b/.test(source)) {
    return 'data_science';
  }
  if (/\b(product manager|product management|growth product|program manager)\b/.test(source)) {
    return 'product_management';
  }
  if (/\b(ux|ui|product designer|design|researcher|figma)\b/.test(source)) {
    return 'ux_design';
  }
  if (/\b(sales|account executive|customer success|support|solutions consultant)\b/.test(source)) {
    return 'sales_customer_success';
  }
  if (/\b(finance|business analyst|consulting|investment|operations|strategy)\b/.test(source)) {
    return 'business_finance';
  }

  return 'general_professional';
}

function buildCompetencies(track: InterviewTrack, level: InterviewLevel): string[] {
  const leadership = level === 'senior' || level === 'executive' ? ['influence', 'decision quality', 'team leverage'] : ['ownership'];
  const byTrack: Record<InterviewTrack, string[]> = {
    software_engineering: ['problem solving', 'technical depth', 'system tradeoffs', 'testing discipline', ...leadership],
    data_science: ['statistical thinking', 'data judgment', 'model tradeoffs', 'business translation', ...leadership],
    product_management: ['product sense', 'prioritization', 'metrics', 'execution judgment', ...leadership],
    ux_design: ['user empathy', 'research judgment', 'design rationale', 'collaboration', ...leadership],
    sales_customer_success: ['discovery', 'objection handling', 'customer judgment', 'communication', ...leadership],
    business_finance: ['structured analysis', 'risk judgment', 'stakeholder communication', 'business impact', ...leadership],
    general_professional: ['ownership', 'communication', 'problem solving', 'adaptability', ...leadership]
  };

  return Array.from(new Set(byTrack[track]));
}

function buildQuestionPlan(track: InterviewTrack, level: InterviewLevel): InterviewQuestionPlan[] {
  const core = [
    behavioralQuestion('b1', 'Tell me about a project where you had to create impact under real constraints.'),
    resumeQuestion(),
    situationalQuestion(level),
    companyFitQuestion()
  ];

  const roleSpecific: Record<InterviewTrack, InterviewQuestionPlan[]> = {
    software_engineering: [
      technicalQuestion('t1', 'Walk me through a technical system or feature you built and the tradeoffs you made.', 'technical_depth'),
      whiteboardQuestion('w1', 'Design a reliable service for a feature in this role. Think through requirements, API shape, bottlenecks, and failure modes.', 'system_design'),
      whiteboardQuestion('w2', 'Solve a coding problem verbally: choose a data structure, explain edge cases, and outline tests.', 'coding')
    ],
    data_science: [
      technicalQuestion('t1', 'Describe a model, experiment, or analysis where your first approach was not good enough.', 'technical_depth'),
      whiteboardQuestion('w1', 'Design a data analysis plan to answer a business question for this role.', 'data_case')
    ],
    product_management: [
      whiteboardQuestion('w1', 'Pick a product in this industry and improve it for one user segment. Define goal, options, metrics, and risks.', 'product_case'),
      situationalQuestion(level, 'A key stakeholder disagrees with your priority call. What do you do?')
    ],
    ux_design: [
      technicalQuestion('t1', 'Walk me through a design decision where research changed your direction.', 'technical_depth'),
      whiteboardQuestion('w1', 'Sketch a research and design plan for onboarding a first-time user.', 'product_case')
    ],
    sales_customer_success: [
      communicationQuestion('c1', 'Role-play discovery: how would you uncover the real pain behind a vague customer request?'),
      situationalQuestion(level, 'A high-value customer is frustrated and your product cannot solve everything they want. What do you do?')
    ],
    business_finance: [
      whiteboardQuestion('w1', 'Build a structured business case for entering a new market. Talk through assumptions, risks, and decision criteria.', 'data_case'),
      technicalQuestion('t1', 'Tell me about an analysis where the numbers did not point to an obvious decision.', 'technical_depth')
    ],
    general_professional: [
      communicationQuestion('c1', 'Tell me about a time you had to explain a complex idea to someone outside your domain.')
    ]
  };

  return [...core.slice(0, 2), ...roleSpecific[track], ...core.slice(2)].map((question, index) => ({
    ...question,
    question_id: `${question.question_id}-${index + 1}`
  }));
}

function behavioralQuestion(questionId: string, leadQuestion: string): InterviewQuestionPlan {
  return {
    question_id: questionId,
    category: 'behavioral',
    competency: 'ownership and impact',
    lead_question: leadQuestion,
    expected_evidence: ['specific context', 'candidate-owned action', 'measurable result', 'reflection'],
    follow_up_triggers: ['no metric', 'unclear ownership', 'missing result', 'generic team claim'],
    strong_answer_signals: ['clear stakes', 'specific actions', 'tradeoff', 'quantified outcome']
  };
}

function technicalQuestion(questionId: string, leadQuestion: string, category: InterviewCategory): InterviewQuestionPlan {
  return {
    question_id: questionId,
    category,
    competency: 'technical reasoning',
    lead_question: leadQuestion,
    expected_evidence: ['constraints', 'alternatives', 'tradeoffs', 'failure handling', 'validation'],
    follow_up_triggers: ['no constraints', 'no edge cases', 'no tests', 'no complexity or risk discussion'],
    strong_answer_signals: ['reasoned tradeoffs', 'failure-aware design', 'clear validation path']
  };
}

function whiteboardQuestion(questionId: string, leadQuestion: string, category: InterviewCategory): InterviewQuestionPlan {
  const modeByCategory: Record<string, WhiteboardMode> = {
    coding: 'coding',
    system_design: 'system_design',
    product_case: 'product_case',
    data_case: 'data_case'
  };

  return {
    ...technicalQuestion(questionId, leadQuestion, category),
    whiteboard_mode: modeByCategory[category] || 'system_design'
  };
}

function resumeQuestion(): InterviewQuestionPlan {
  return {
    question_id: 'r1',
    category: 'resume_deep_dive',
    competency: 'resume credibility',
    lead_question: 'Choose one experience from your resume that best proves you can do this role. What happened and what did you personally own?',
    expected_evidence: ['resume-specific example', 'personal contribution', 'scope', 'result'],
    follow_up_triggers: ['resume detail is vague', 'ownership unclear', 'impact missing'],
    strong_answer_signals: ['specific artifact', 'clear scope', 'credible outcome']
  };
}

function situationalQuestion(level: InterviewLevel, override?: string): InterviewQuestionPlan {
  return {
    question_id: 's1',
    category: 'situational',
    competency: level === 'senior' || level === 'executive' ? 'judgment under ambiguity' : 'prioritization',
    lead_question: override || 'Imagine you are behind on a high-visibility deliverable and the requirements are changing. What do you do first?',
    expected_evidence: ['first action', 'communication path', 'risk management', 'decision rationale'],
    follow_up_triggers: ['no first step', 'no stakeholder plan', 'no prioritization criteria'],
    strong_answer_signals: ['calm triage', 'clear escalation', 'explicit tradeoff']
  };
}

function communicationQuestion(questionId: string, leadQuestion: string): InterviewQuestionPlan {
  return {
    question_id: questionId,
    category: 'communication',
    competency: 'communication and audience awareness',
    lead_question: leadQuestion,
    expected_evidence: ['audience framing', 'listening', 'clear structure', 'adaptation'],
    follow_up_triggers: ['too abstract', 'no audience adaptation', 'no outcome'],
    strong_answer_signals: ['concise framing', 'checks for understanding', 'clear next step']
  };
}

function companyFitQuestion(): InterviewQuestionPlan {
  return {
    question_id: 'f1',
    category: 'company_fit',
    competency: 'motivation and role fit',
    lead_question: 'Why this role, and what would make your first 90 days successful?',
    expected_evidence: ['role-specific motivation', 'success criteria', 'learning plan', 'business awareness'],
    follow_up_triggers: ['generic motivation', 'no 90-day plan', 'no connection to role'],
    strong_answer_signals: ['specific role match', 'clear ramp plan', 'company-aware priorities']
  };
}
