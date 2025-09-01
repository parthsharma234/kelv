export type ConversationStateName = 'greeting' | 'open' | 'follow_up' | 'closing';

export interface ConversationState {
  instructions: string;
  sample_phrases: string[];
  exitCriteria: { questions?: number; time?: number };
  next?: ConversationStateName;
  onKeyword?: Record<string, ConversationStateName>;
  onFollowUp?: ConversationStateName;
  onTimeout?: ConversationStateName;
}

export const conversationFlow: Record<ConversationStateName, ConversationState> = {
  greeting: {
    instructions: 'Begin with a friendly greeting and engage in small talk for 1–2 minutes before the interview starts.',
    sample_phrases: [
      'Hi, thanks for joining us today.',
      'Great to meet you—ready when you are.'
    ],
    exitCriteria: { time: 2 },
    next: 'open',
    onTimeout: 'open',
    onFollowUp: 'follow_up'
  },
  open: {
    instructions: 'Ask one question at a time based on interviewer direction.',
    sample_phrases: [
      'Could you walk me through that approach?',
      'What trade-offs did you consider?'
    ],
    exitCriteria: {},
    onKeyword: {
      'wrap up': 'closing',
      'no more questions': 'closing',
      'that is all': 'closing'
    },
    onFollowUp: 'follow_up'
  },
  follow_up: {
    instructions: 'Ask a focused follow-up, then return to the previous state.',
    sample_phrases: [
      'What was the outcome?',
      'Could you clarify that part?'
    ],
    exitCriteria: { questions: 1 }
  },
  closing: {
    instructions: 'Wrap up the interview, offer next steps, and call finish_session.',
    sample_phrases: [
      'Thanks for your time today—anything else you\'d like to add?',
      'Do you have any final questions before we finish?'
    ],
    exitCriteria: { time: 1 },
    onTimeout: 'closing'
  }
} as const;
