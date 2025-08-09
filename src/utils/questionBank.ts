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
  'Data Scientist': {
    Technology: {
      technical: [
        'Given an unsorted array of integers, return the k most frequent elements and discuss the algorithmic complexity.',
        'How would you design and evaluate an experiment to test a new recommendation algorithm?',
        'Write a SQL query to compute the 7-day rolling average of signups for each product.',
        'Describe how you would handle missing values and outliers before training a predictive model.'
      ],
      situational: [
        'Tell me about a time you deployed a model that later underperformed. How did you diagnose and fix the issue?',
        'Describe a project where you had to communicate complex findings to a non-technical audience.',
        'Share an example of collaborating with engineers or product teams to productionize a data pipeline.'
      ]
    },
    Finance: {
      technical: [
        'How would you detect fraudulent transactions using machine learning? Which features would you engineer?',
        'Write a SQL query to compute the exposure of a portfolio given positions and market prices.',
        'Explain the differences between ARIMA and LSTM models for time-series forecasting.'
      ],
      situational: [
        'Describe a time you balanced model accuracy with regulatory explainability requirements.',
        'Tell me about working with traders or risk analysts to integrate your analysis into decision-making.'
      ]
    }
  },
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
  'Sales Representative': {
    Sales: {
      technical: [
        'How do you prioritize leads in your pipeline and which tools support this?',
        'Walk me through your approach to researching a prospect before a cold call.'
      ],
      situational: [
        'Describe a time you revived a stalled deal and closed it.',
        'Tell me about handling a difficult negotiation where the client pushed back on price.'
      ]
    }
  },
  'Business Analyst': {
    Consulting: {
      technical: [
        'How do you translate vague client requirements into clear analytical objectives?',
        'Describe the steps to build a dashboard for tracking monthly revenue by region.'
      ],
      situational: [
        'Tell me about a time your analysis changed an important business decision.',
        'Describe a situation where stakeholders disagreed on metrics and how you resolved it.'
      ]
    }
  },
  'Customer Support Specialist': {
    Technology: {
      technical: [
        'Which tools or ticketing systems have you used to manage customer inquiries?',
        'How do you define and track first-response and resolution times?'
      ],
      situational: [
        'Share an example of diffusing an escalated customer complaint.',
        'Describe a time you collaborated with product teams to resolve a recurring support issue.'
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

