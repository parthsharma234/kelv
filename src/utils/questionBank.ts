export type QuestionCategory = 'technical' | 'situational' | 'behavioral';

interface RoleIndustryQuestions {
  [role: string]: {
    [industry: string]: {
      technical?: string[];
      situational?: string[];
      behavioral?: string[];
    };
  };
}

export const QUESTION_BANK: RoleIndustryQuestions = {
  'Software Engineer': {
    Technology: {
      technical: [
        'How do you design scalable microservices?',
        'Explain the trade-offs between SQL and NoSQL in recent projects.',
        'How would you monitor performance in a cloud-native application?'
      ],
      situational: [
        'Describe a time you resolved a production outage under pressure.',
        'Walk me through how you handled conflicting code review feedback.'
      ]
    },
    Finance: {
      technical: [
        'How do you ensure security and compliance in fintech applications?',
        'What challenges have you faced integrating with legacy banking systems?'
      ],
      situational: [
        'Tell me about a time you balanced shipping speed with regulatory requirements.'
      ]
    }
  },
  'Marketing Manager': {
    Marketing: {
      technical: [
        'Which attribution models do you rely on and why?',
        'How do you segment audiences for multichannel campaigns?'
      ],
      situational: [
        'Describe a campaign that underperformed. How did you adapt?',
        'Tell me about a time you aligned sales and marketing goals.'
      ]
    },
    Retail: {
      technical: [
        'How do you leverage in-store data to inform digital strategy?'
      ],
      situational: [
        'Share an example of handling a sudden shift in consumer behavior.'
      ]
    }
  },
  Nurse: {
    Healthcare: {
      technical: [
        'How do you stay current with evidence-based practices?',
        'What protocols do you follow for medication administration safety?'
      ],
      situational: [
        'Describe a time you advocated for a patient\'s needs.',
        'Tell me about handling a conflict with a physician or family member.'
      ]
    }
  },
  Teacher: {
    Education: {
      technical: [
        'How do you incorporate formative assessment into daily lessons?',
        'What learning management systems have you used effectively?'
      ],
      situational: [
        'Share a time you adapted instruction for diverse learning styles.',
        'Describe how you handled a challenging classroom behavior situation.'
      ]
    }
  }
};

export function getQuestions(role: string, industry: string, category: QuestionCategory): string[] {
  return QUESTION_BANK[role]?.[industry]?.[category] || [];
}

