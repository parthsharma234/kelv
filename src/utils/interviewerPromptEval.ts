import { buildVoiceInterviewContext } from './interviewContext';

export interface PromptSmokeScenario {
  name: string;
  jobDescription: string;
  resumeText: string;
  expectedRole: string;
  expectedIndustry?: string;
  requiredPromptRules: string[];
  forbiddenPromptSnippets?: string[];
}

export interface PromptSmokeResult {
  name: string;
  passed: boolean;
  role: string;
  failures: string[];
}

export const defaultPromptSmokeScenarios: PromptSmokeScenario[] = [
  {
    name: 'adidas-store-associate',
    jobDescription:
      'At adidas we are calling all Store Associates who want to create what will be. Use your retail experience to exceed customer expectations and be a passionate adidas Brand ambassador.',
    resumeText:
      'Marketing club member with campaign planning, social content, customer events, and brand research experience.',
    expectedRole: 'Store Associate',
    expectedIndustry: 'Retail',
    requiredPromptRules: [
      'BACKGROUND_ANCHOR',
      'RETAIL / SERVICE / HOSPITALITY',
      'NO EXPERIENCE / FIRST JOB',
      '"FIRST JOB AT [COMPANY]"',
      'ONE QUESTION AT A TIME'
    ],
    forbiddenPromptSnippets: [
      'what part of the role are you most interested in'
    ]
  },
  {
    name: 'candidate-pushback-recovery',
    jobDescription:
      'Position: Account Executive. Own pipeline generation, discovery calls, customer objections, and quota attainment.',
    resumeText:
      'UX Designer with research, Figma prototypes, and usability studies for SaaS products.',
    expectedRole: 'Account Executive',
    requiredPromptRules: [
      'IF THEY PUSH BACK ON SMALL TALK',
      'BACKGROUND_ANCHOR',
      'FOLLOW-UPS',
      'SALES / BIZ DEV'
    ]
  },
  {
    name: 'technical-whiteboard',
    jobDescription:
      'Job Title: Senior Software Engineer. Build cloud APIs, own system design, and improve platform reliability.',
    resumeText:
      'Built TypeScript services, React dashboards, queue workers, and reduced latency by 35%.',
    expectedRole: 'Senior Software Engineer',
    expectedIndustry: 'Technology',
    requiredPromptRules: [
      'tradeoffs and failures',
      'Question plan:',
      'TIMING'
    ]
  }
];

export function evaluatePromptSmokeScenario(scenario: PromptSmokeScenario): PromptSmokeResult {
  const context = buildVoiceInterviewContext({
    jobDescription: scenario.jobDescription,
    resumeText: scenario.resumeText,
    sessionPhase: 'opening'
  });
  const prompt = context.interviewerSystemPrompt;
  const failures: string[] = [];

  if (context.role !== scenario.expectedRole) {
    failures.push(`Expected role ${scenario.expectedRole}, got ${context.role}.`);
  }

  if (scenario.expectedIndustry && context.industry !== scenario.expectedIndustry) {
    failures.push(`Expected industry ${scenario.expectedIndustry}, got ${context.industry}.`);
  }

  if (context.firstMessage !== "Hi, I'm Kelv. Before we get into the interview itself, how are you doing today?") {
    failures.push('First message does not preserve the controlled check-in.');
  }

  for (const rule of scenario.requiredPromptRules) {
    if (!prompt.includes(rule)) failures.push(`Missing prompt rule: ${rule}`);
  }

  for (const snippet of scenario.forbiddenPromptSnippets || []) {
    if (prompt.includes(snippet)) failures.push(`Forbidden prompt snippet still present: ${snippet}`);
  }

  if (!prompt.includes('I\'ve got your resume')) {
    failures.push('Prompt does not include a natural opening bridge from check-in to first question.');
  }

  if (!context.blueprint.question_plan[0]?.lead_question.includes('resume and this job description')) {
    failures.push('First planned question is not anchored in resume and JD.');
  }

  return {
    name: scenario.name,
    passed: failures.length === 0,
    role: context.role,
    failures
  };
}

export function runDefaultPromptSmokeEval(): PromptSmokeResult[] {
  return defaultPromptSmokeScenarios.map(evaluatePromptSmokeScenario);
}
