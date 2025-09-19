export type ConversationStateName = 'small_talk' | 'warm_up' | 'core' | 'closing';

export interface ConversationState {
  instructions: string;
  sample_phrases: string[];
  exitCriteria: { questions?: number; time?: number };
  next?: ConversationStateName;
  onTimeout?: ConversationStateName;
  followUpInstruction?: string;
}

export const conversationFlow: Record<ConversationStateName, ConversationState> = {
  small_talk: {
    instructions:
      'Phase 1 (0-2m): Build rapport with industry-aware small talk. Mirror their energy, reference live trends, and listen for role/tech keywords. Transition with a gentle time cue when you're ready to shift into warm-up questions.',
    sample_phrases: [
      'Hi, I'm Kelv - how's your day going? Has {industry trend} been keeping you busy?',
      'What's been top-of-mind in your world lately? I've been hearing a lot about {industry signal}.',
      'Before we dive in, how are things going with {candidate-mentioned context if any}?'
    ],
    exitCriteria: { time: 2 },
    next: 'warm_up',
    onTimeout: 'warm_up'
  },
  warm_up: {
    instructions:
      'Phase 2 (2-4m): Shift into warm-up questions that surface recent projects, responsibilities, and terminology. Keep it conversational, acknowledge their answers, and tee up the deeper dive with a time-aware bridge (e.g., "We've got about 15 minutes left, so let's explore...").',
    sample_phrases: [
      'Tell me about a recent project that really captures what you do day-to-day.',
      'What challenges have you been navigating recently in {detected industry or role}?',
      'How has {trend/regulation} affected the work you've been leading?'
    ],
    exitCriteria: { time: 2 },
    next: 'core',
    onTimeout: 'core',
    followUpInstruction:
      'If you need a quick probe, ask a single follow-up that links to the warm-up detail, then return to your planned transition.'
  },
  core: {
    instructions:
      'Phase 3 (4-17m): Lead with realistic, industry-grounded scenarios or technical probes. Reference the scenario playbook, incorporate candidate-provided context, and keep enforcing timeboxes. At ~15 minutes, note the remaining time and start guiding toward wrap-up.',
    sample_phrases: [
      'You mentioned {tool/process}. Let's walk through how you'd handle {realistic scenario tied to their industry}.',
      'Imagine {candidate company or domain} hits {live industry challenge}. How would you approach it?',
      'Earlier you talked about {detail}. How did you measure success or manage constraints there?'
    ],
    exitCriteria: { time: 13 },
    next: 'closing',
    onTimeout: 'closing',
    followUpInstruction:
      'Use targeted follow-ups ("How did you handle compliance there?") to probe depth, but keep them concise and grounded in the candidate's example.'
  },
  closing: {
    instructions:
      'Phase 4 (17-20m): Acknowledge the remaining minutes, cover logistics (timeline, expectations), invite final questions, and end with the mandated closing line before calling finish_session().',
    sample_phrases: [
      'We're in the last few minutes; what questions do you have about the process or team?',
      'Given what we discussed, how are you thinking about {role/industry-specific factor such as compliance reviews or go-to-market timing}?',
      'Before we wrap, is there anything you'd like to highlight that we haven't covered?'
    ],
    exitCriteria: { time: 3 },
    onTimeout: 'closing'
  }
} as const;
