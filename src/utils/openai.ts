import { InterviewSetup, Question, InterviewResponse, AIInterviewerState } from '../types/interview';
import { synthesizeSpeechWithElevenLabs } from './elevenLabsTTS';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Audio recorder class for voice input
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(100); // Collect data every 100ms
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<{ audioBlob: Blob; duration: number } | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      const startTime = Date.now();
      
      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - startTime) / 1000;
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        resolve({ audioBlob, duration });
      };
      
      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

// Direct voice input to OpenAI
export const processVoiceInput = async (audioBlob: Blob): Promise<string> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.warn('OpenAI API key not configured');
    return '';
  }

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');
    formData.append('temperature', '0.1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Voice input processing error:', error);
    return '';
  }
};

// Enhanced speech metrics extraction
export const extractSpeechMetrics = async (audioBlob: Blob, transcription: string, duration: number) => {
  try {
    // Basic metrics from transcription
    const words = transcription.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Improved speech rate calculation
    // Account for natural pauses and hesitations in speech
    const effectiveDuration = Math.max(duration * 0.88, duration - 1.5); // Account for natural speech pauses
    const speechRate = Number(((wordCount / effectiveDuration) * 60).toFixed(2)); // Limit to 2 decimal places
    
    // Enhanced filler word detection
    const fillerWords = [
      'um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically', 'literally', 'right',
      'kind of', 'sort of', 'i mean', 'you see', 'i guess', 'i think', 'i feel', 'i believe'
    ];
    const fillerCount = words.filter(word => 
      fillerWords.includes(word.replace(/[.,!?]/g, '')) ||
      fillerWords.includes(word.replace(/[.,!?]/g, '') + ' ' + (words[words.indexOf(word) + 1] || ''))
    ).length;
    
    // Enhanced repetition detection
    let repetitions = 0;
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1]) {
        repetitions++;
      }
    }
    
    // Check for phrase repetitions
    for (let i = 2; i < words.length - 1; i++) {
      const phrase1 = words.slice(i - 2, i).join(' ');
      const phrase2 = words.slice(i, i + 2).join(' ');
      if (phrase1 === phrase2) {
        repetitions += 0.5;
      }
    }
    repetitions = Math.round(repetitions);
    
    // Improved pause analysis
    const expectedWords = (duration * 150) / 60; // 150 WPM is average
    const pauseRatio = Math.max(0, (expectedWords - wordCount) / expectedWords);
    
    // Audio analysis using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    
    // Calculate RMS (energy)
    let rmsSum = 0;
    for (let i = 0; i < channelData.length; i++) {
      rmsSum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(rmsSum / channelData.length);
    
    // Calculate pitch using autocorrelation
    const pitch = calculatePitch(channelData, audioBuffer.sampleRate);
    
    // Improved voice confidence calculation
    const energyScore = Math.min(100, rms * 2000);
    
    // Better rate scoring with realistic range
    let rateScore;
    if (speechRate >= 130 && speechRate <= 170) {
      rateScore = 100; // Perfect score for optimal range
    } else if (speechRate < 130) {
      rateScore = Math.max(0, 100 - (130 - speechRate) * 1.5);
    } else {
      rateScore = Math.max(0, 100 - (speechRate - 170) * 1.2);
    }
    
    const fillerPenalty = Math.min(40, (fillerCount / Math.max(1, wordCount)) * 1000);
    const voiceConfidence = Math.max(0, (energyScore + rateScore - fillerPenalty) / 2);
    
    // Improved fluency score
    const fluencyScore = Math.max(0, 100 - (fillerCount * 6) - (repetitions * 8) - (pauseRatio * 25));
    
    // Improved pace consistency
    const paceConsistency = Math.max(0, 100 - Math.abs(speechRate - 150) * 0.8);
    
    return {
      // Basic metrics
      duration,
      wordCount,
      speechRate,
      
      // Quality metrics
      voiceConfidence: Math.round(voiceConfidence),
      fluencyScore: Math.round(fluencyScore),
      paceConsistency: Math.round(paceConsistency),
      
      // Speech characteristics
      fillerWordCount: fillerCount,
      repetitionCount: repetitions,
      pauseRatio: Math.round(pauseRatio * 100),
      
      // Audio metrics
      averageVolume: Math.round(rms * 1000),
      estimatedPitch: Math.round(pitch),
      
      // Derived metrics
      clarity: Math.round(100 - (fillerCount / Math.max(1, wordCount)) * 100),
      confidence: Math.round(voiceConfidence),
      delivery: Math.round((fluencyScore + paceConsistency) / 2)
    };
  } catch (error) {
    console.error('Error extracting speech metrics:', error);
    return null;
  }
};

// Pitch calculation using autocorrelation
const calculatePitch = (data: Float32Array, sampleRate: number): number => {
  const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
  const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
  
  let bestPeriod = 0;
  let bestCorrelation = 0;
  
  for (let period = minPeriod; period < maxPeriod && period < data.length / 2; period++) {
    let correlation = 0;
    for (let i = 0; i < data.length - period; i++) {
      correlation += data[i] * data[i + period];
    }
    
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }
  
  return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
};

// Store questions globally to access them by ID
let globalQuestions: Question[] = [];

// Helper functions for interview context
const getIndustryContext = (industry: string): string => {
  const contexts: { [key: string]: string } = {
    'Technology': 'Fast-paced, innovation-driven environment with rapid technological changes. Companies value agility, continuous learning, and the ability to adapt to new technologies quickly. Current trends include AI/ML, cloud computing, cybersecurity, and remote work optimization.',
    'Healthcare': 'Highly regulated, patient-focused industry with emphasis on accuracy, compliance, and continuous improvement. Companies prioritize patient safety, data security, and evidence-based practices. Current challenges include digital transformation, telemedicine, and cost optimization.',
    'Finance': 'Regulated, risk-averse environment with focus on compliance, accuracy, and customer trust. Companies value analytical skills, attention to detail, and understanding of financial regulations. Current trends include fintech innovation, digital banking, and regulatory technology.',
    'Education': 'Student-centered environment with focus on learning outcomes, accessibility, and continuous improvement. Companies value communication skills, patience, and ability to adapt teaching methods. Current challenges include online learning, personalized education, and technology integration.',
    'Marketing': 'Creative, data-driven environment with focus on customer engagement and ROI. Companies value creativity, analytical skills, and understanding of consumer behavior. Current trends include digital marketing, personalization, and social media strategy.',
    'Consulting': 'Client-focused, problem-solving environment with emphasis on strategic thinking and communication. Companies value analytical skills, presentation abilities, and industry knowledge. Current challenges include digital transformation, remote consulting, and competitive differentiation.',
    'Manufacturing': 'Process-oriented, efficiency-focused environment with emphasis on quality control and continuous improvement. Companies value technical skills, problem-solving abilities, and safety awareness. Current trends include Industry 4.0, automation, and sustainable manufacturing.',
    'Retail': 'Customer-centric, fast-paced environment with focus on sales performance and customer satisfaction. Companies value interpersonal skills, product knowledge, and adaptability. Current challenges include e-commerce integration, omnichannel retail, and customer experience optimization.'
  };
  return contexts[industry] || 'Dynamic, competitive environment with focus on innovation, customer satisfaction, and continuous improvement. Companies value adaptability, problem-solving skills, and industry knowledge.';
};

const getRoleContext = (jobType: string, industry: string): string => {
  const roleContexts: { [key: string]: string } = {
    'Software Engineer': 'Focus on coding, problem-solving, and software development lifecycle. Key skills include programming languages, system design, debugging, and collaboration with cross-functional teams. Current priorities include cloud-native development, security, and scalable architecture.',
    'Data Scientist': 'Focus on data analysis, statistical modeling, and machine learning. Key skills include Python/R, SQL, statistical analysis, and data visualization. Current priorities include AI/ML implementation, big data processing, and predictive analytics.',
    'Product Manager': 'Focus on product strategy, user experience, and cross-functional leadership. Key skills include market research, user research, project management, and stakeholder communication. Current priorities include agile methodologies, user-centered design, and data-driven decision making.',
    'Marketing Manager': 'Focus on brand strategy, campaign management, and customer acquisition. Key skills include digital marketing, analytics, creative direction, and team leadership. Current priorities include digital transformation, personalization, and ROI optimization.',
    'Sales Representative': 'Focus on customer relationships, pipeline management, and revenue generation. Key skills include communication, negotiation, product knowledge, and CRM usage. Current priorities include consultative selling, digital sales tools, and customer success.',
    'HR Manager': 'Focus on talent acquisition, employee development, and organizational culture. Key skills include recruitment, performance management, compliance, and employee relations. Current priorities include remote work policies, diversity & inclusion, and employee engagement.',
    'Financial Analyst': 'Focus on financial modeling, data analysis, and strategic planning. Key skills include Excel, financial statements, forecasting, and business intelligence tools. Current priorities include automation, real-time reporting, and strategic financial planning.',
    'Operations Manager': 'Focus on process optimization, team management, and operational efficiency. Key skills include project management, data analysis, leadership, and problem-solving. Current priorities include digital transformation, supply chain optimization, and cost reduction.',
    'Designer': 'Focus on user experience, visual design, and creative problem-solving. Key skills include design tools, user research, prototyping, and design systems. Current priorities include user-centered design, accessibility, and design thinking methodologies.',
    'Consultant': 'Focus on problem-solving, client relationships, and strategic recommendations. Key skills include analysis, presentation, project management, and industry knowledge. Current priorities include digital transformation, change management, and value creation.'
  };
  return roleContexts[jobType] || `Focus on delivering value in ${industry} through expertise, collaboration, and continuous improvement. Key skills include industry knowledge, problem-solving, communication, and adaptability.`;
};

const getExperienceLevelContext = (experienceLevel: string): string => {
  const levelContexts: { [key: string]: string } = {
    'Entry Level': 'Looking for potential, learning ability, and foundational skills. Candidates should demonstrate enthusiasm, relevant coursework/projects, and willingness to learn. Focus on transferable skills, internships, and academic achievements.',
    'Mid Level': 'Looking for proven experience, specific achievements, and technical competence. Candidates should demonstrate quantifiable results, problem-solving abilities, and team collaboration. Focus on project outcomes, technical skills, and leadership potential.',
    'Senior Level': 'Looking for leadership experience, strategic thinking, and complex problem-solving. Candidates should demonstrate team management, strategic initiatives, and industry expertise. Focus on organizational impact, mentorship, and technical depth.',
    'Executive Level': 'Looking for vision, organizational leadership, and industry influence. Candidates should demonstrate strategic planning, team building, and business transformation. Focus on company growth, industry thought leadership, and board-level thinking.'
  };
  return levelContexts[experienceLevel] || 'Looking for appropriate experience level with relevant skills and achievements for the role.';
};

// Helper function to extract key topics from candidate responses
const extractKeyTopics = (text: string): string => {
  const commonTopics = [
    'project', 'team', 'leadership', 'problem', 'solution', 'technology', 'data', 'analysis',
    'customer', 'client', 'strategy', 'innovation', 'collaboration', 'communication', 'results',
    'achievement', 'challenge', 'learning', 'growth', 'management', 'development', 'research',
    'design', 'marketing', 'sales', 'finance', 'operations', 'quality', 'efficiency', 'improvement'
  ];
  
  const foundTopics = commonTopics.filter(topic => text.includes(topic));
  return foundTopics.slice(0, 3).join(', ') || 'general experience';
};

// Helper function to analyze performance trend
const getPerformanceTrend = (scores: number[]): string => {
  if (scores.length < 2) return 'stable';
  const recent = scores[scores.length - 1];
  const previous = scores[scores.length - 2];
  
  if (recent > previous + 1) return 'improving';
  if (recent < previous - 1) return 'declining';
  return 'stable';
};

// Technical question database for different industries and roles
const getTechnicalQuestions = (jobType: string, industry: string, _experienceLevel: string): string[] => {
  const questions: { [key: string]: { [key: string]: string[] } } = {
    'Software Engineer': {
      'Technology': [
        'Can you explain the difference between a stack and a queue?',
        'What is the time complexity of binary search?',
        'How would you implement a hash table?',
        'Explain the concept of recursion with an example.',
        'What are the main differences between SQL and NoSQL databases?',
        'How does garbage collection work in Java?',
        'What is the difference between synchronous and asynchronous programming?',
        'Explain the concept of dependency injection.',
        'How would you optimize a slow database query?',
        'What is the difference between HTTP and HTTPS?',
        'Explain the concept of microservices architecture.',
        'How would you handle a memory leak in your application?',
        'What is the difference between REST and GraphQL?',
        'How do you implement authentication and authorization?',
        'Explain the concept of load balancing.'
      ]
    },
    'Data Scientist': {
      'Technology': [
        'What is the difference between supervised and unsupervised learning?',
        'Explain the concept of overfitting and how to prevent it.',
        'What is cross-validation and why is it important?',
        'How would you handle missing data in a dataset?',
        'Explain the difference between correlation and causation.',
        'What is the bias-variance tradeoff?',
        'How would you evaluate a classification model?',
        'Explain the concept of feature engineering.',
        'What is the difference between precision and recall?',
        'How would you deal with imbalanced classes in a dataset?',
        'Explain the concept of regularization in machine learning.',
        'How do you handle outliers in your data?',
        'What is the difference between bagging and boosting?',
        'Explain the concept of dimensionality reduction.',
        'How would you explain a complex model to a non-technical stakeholder?'
      ]
    },
    'Financial Analyst': {
      'Finance': [
        'What are the three main financial statements?',
        'How do you calculate the current ratio?',
        'What is the difference between EBITDA and net income?',
        'Explain the concept of present value.',
        'How do you calculate the weighted average cost of capital (WACC)?',
        'What is the difference between NPV and IRR?',
        'How do you perform a discounted cash flow analysis?',
        'What are the main types of financial ratios?',
        'How do you calculate return on equity (ROE)?',
        'What is the difference between GAAP and IFRS?',
        'How do you analyze a company\'s cash flow statement?',
        'What is the difference between working capital and cash flow?',
        'How do you calculate the debt-to-equity ratio?',
        'Explain the concept of beta in portfolio management.',
        'How would you value a company using comparable analysis?'
      ]
    },
    'Marketing Manager': {
      'Marketing': [
        'What are the 4 Ps of marketing?',
        'How do you calculate customer lifetime value (CLV)?',
        'What is the difference between B2B and B2C marketing?',
        'How do you measure marketing ROI?',
        'What are the main digital marketing channels?',
        'How do you conduct a competitive analysis?',
        'What is the difference between inbound and outbound marketing?',
        'How do you create a marketing persona?',
        'What are the key metrics for email marketing?',
        'How do you develop a content marketing strategy?',
        'How do you calculate conversion rate?',
        'What is the difference between organic and paid search?',
        'How do you measure brand awareness?',
        'What is the difference between reach and impressions?',
        'How would you optimize a marketing campaign for better performance?'
      ]
    },
    'Product Manager': {
      'Technology': [
        'How do you prioritize features in a product roadmap?',
        'What is the difference between a product requirement and a user story?',
        'How do you conduct user research?',
        'What is the difference between agile and waterfall methodologies?',
        'How do you measure product success?',
        'What is the difference between a feature and an epic?',
        'How do you handle competing stakeholder requirements?',
        'What is the difference between MVP and MLP?',
        'How do you conduct A/B testing?',
        'What is the difference between product-market fit and market-product fit?',
        'How do you define and measure KPIs for your product?',
        'What is the difference between user experience and user interface?',
        'How do you handle product launches?',
        'What is the difference between a product manager and a project manager?',
        'How do you gather and prioritize user feedback?'
      ]
    },
    'Sales Representative': {
      'Marketing': [
        'What is the difference between BANT and MEDDIC qualification frameworks?',
        'How do you handle price objections?',
        'What is the difference between consultative and transactional selling?',
        'How do you qualify a lead?',
        'What is the sales funnel and how do you optimize it?',
        'How do you handle competitor comparisons?',
        'What is the difference between inbound and outbound sales?',
        'How do you measure sales performance?',
        'What is the difference between a prospect and a lead?',
        'How do you build rapport with prospects?',
        'How do you calculate sales velocity?',
        'What is the difference between a sales quota and a sales target?',
        'How do you handle difficult customers?',
        'What is the difference between cold calling and warm calling?',
        'How do you use CRM systems effectively?'
      ]
    },
    'HR Manager': {
      'Consulting': [
        'How do you calculate employee turnover rate?',
        'What is the difference between exempt and non-exempt employees?',
        'How do you conduct a performance review?',
        'What are the main components of a compensation package?',
        'How do you handle workplace conflicts?',
        'What is the difference between HR and People Operations?',
        'How do you measure employee engagement?',
        'What are the key elements of a diversity and inclusion program?',
        'How do you develop an employee handbook?',
        'What is the difference between termination and layoff?',
        'How do you calculate cost per hire?',
        'What are the main types of employee benefits?',
        'How do you handle workplace investigations?',
        'What is the difference between onboarding and orientation?',
        'How do you develop a training and development program?'
      ]
    },
    'Operations Manager': {
      'Manufacturing': [
        'How do you calculate operational efficiency?',
        'What is the difference between lean and six sigma?',
        'How do you optimize supply chain management?',
        'What is the difference between quality control and quality assurance?',
        'How do you measure productivity?',
        'What is the concept of just-in-time inventory?',
        'How do you handle capacity planning?',
        'What is the difference between preventive and predictive maintenance?',
        'How do you calculate cycle time?',
        'What is the concept of continuous improvement?',
        'How do you manage vendor relationships?',
        'What is the difference between efficiency and effectiveness?',
        'How do you handle quality issues in production?',
        'What is the concept of total quality management?',
        'How do you optimize warehouse operations?'
      ]
    },
    'Designer': {
      'Technology': [
        'What is the difference between UX and UI design?',
        'How do you conduct user research?',
        'What is the design thinking process?',
        'How do you create a design system?',
        'What is the difference between wireframes and mockups?',
        'How do you measure design success?',
        'What is the concept of accessibility in design?',
        'How do you handle design feedback?',
        'What is the difference between responsive and adaptive design?',
        'How do you create user personas?',
        'What is the concept of information architecture?',
        'How do you conduct usability testing?',
        'What is the difference between visual design and interaction design?',
        'How do you handle design constraints?',
        'What is the concept of design sprints?'
      ]
    },
    'Consultant': {
      'Consulting': [
        'How do you structure a consulting engagement?',
        'What is the difference between strategy and operations consulting?',
        'How do you conduct a business analysis?',
        'What is the concept of change management?',
        'How do you measure consulting project success?',
        'What is the difference between internal and external consulting?',
        'How do you handle client relationships?',
        'What is the concept of stakeholder management?',
        'How do you develop recommendations?',
        'What is the difference between qualitative and quantitative analysis?',
        'How do you manage consulting project timelines?',
        'What is the concept of value proposition?',
        'How do you handle scope creep?',
        'What is the difference between consulting and advisory services?',
        'How do you measure ROI for consulting projects?'
      ]
    }
  };

  return questions[jobType]?.[industry] || [
    'What are the key responsibilities of a ' + jobType + ' in ' + industry + '?',
    'How do you stay current with industry trends in ' + industry + '?',
    'What tools and technologies are essential for a ' + jobType + ' role?',
    'What are the main challenges facing ' + jobType + ' professionals in ' + industry + '?',
    'How do you measure success in a ' + jobType + ' role?'
  ];
};

// Resume-based question templates
const getResumeBasedQuestions = (_jobType: string, _industry: string, _experienceLevel: string): string[] => {
  const templates = [
    "I see you have experience in [specific area]. Can you walk me through your most relevant project in that field?",
    "Your background shows [specific skill/technology]. How did you develop that expertise?",
    "I'm interested in your experience with [specific tool/technology]. What was your biggest challenge working with it?",
    "You've worked in [specific industry/role]. What drew you to this particular opportunity?",
    "Looking at your experience, what would you say is your strongest technical skill?",
    "I notice you have experience with [specific methodology]. How has that shaped your approach to [jobType]?",
    "Your background includes [specific achievement]. Can you tell me more about that?",
    "What aspects of your previous roles have best prepared you for this position?",
    "I'm curious about your transition from [previous experience] to [current focus]. What motivated that change?",
    "Based on your experience, what do you think sets you apart from other candidates for this role?"
  ];

  return templates;
};

export const generateInterviewQuestions = async (setup: InterviewSetup): Promise<Question[]> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key is required for AI-generated questions. Please configure your API key to use the interview platform.');
  }
    try {
    const prompt = `You are Alex Rodriguez, a seasoned ${setup.industry} hiring manager with 15+ years of experience interviewing for ${setup.jobType} roles. You have a warm, charismatic personality - you know how to put candidates at ease and create a welcoming, conversational atmosphere while asking sharp, insightful questions.

INTERVIEW PERSONA:
- You're Alex Rodriguez conducting a real interview for a ${setup.experienceLevel} ${setup.jobType} role at a leading ${setup.industry} company
- You genuinely want to get to know the candidate and help them show their best
- Your tone is warm, friendly, and professional—think of this as a two-way conversation, not an interrogation
- You ask thoughtful follow-ups and show genuine curiosity about the candidate's journey
- You're looking for real stories, practical examples, and authentic enthusiasm

INDUSTRY CONTEXT FOR ${setup.industry}:
${getIndustryContext(setup.industry)}

ROLE-SPECIFIC KNOWLEDGE FOR ${setup.jobType}:
${getRoleContext(setup.jobType, setup.industry)}

EXPERIENCE LEVEL EXPECTATIONS:
${getExperienceLevelContext(setup.experienceLevel)}

TASK: Start the interview with a warm, authentic opening question that invites the candidate to share their background, experience, or skills.

REQUIREMENTS:
1. RESUME-FOCUSED: Ask about their background, experience, or a specific skill
2. FRIENDLY GREETING: Begin with a welcoming, human introduction
3. CONTEXTUAL OPENING: Reference the specific role and industry
4. NATURAL FLOW: The question should feel like a real conversation starter
5. ROLE-SPECIFIC: Tailored to ${setup.jobType} and ${setup.industry}
6. EXPERIENCE-APPROPRIATE: Matches ${setup.experienceLevel} expectations
7. ENCOURAGING: Designed to help the candidate open up and feel comfortable

RESUME-BASED QUESTION EXAMPLES:
${getResumeBasedQuestions(setup.jobType, setup.industry, setup.experienceLevel).slice(0, 3).map(q => `- "${q}"`).join('\n')}

TECHNICAL QUESTION EXAMPLES (for later in interview):
${getTechnicalQuestions(setup.jobType, setup.industry, setup.experienceLevel).slice(0, 3).map(q => `- "${q}"`).join('\n')}

EXAMPLE STYLES (but create your own unique version):
- "Thanks for joining us today. I've reviewed your background and I'm really excited to learn more about your experience with [specific skill/technology]. What initially drew you to [industry/role] and what's been your most rewarding project so far?"
- "Welcome! I've been looking forward to this conversation. Your experience with [specific area] caught my attention. Walk me through how you got started in [field] and what's been your biggest achievement in that area?"
- "Great to meet you! I'm particularly interested in your journey to this point. What was the moment you realized [industry/role] was the right path for you, and how has that evolved?"

AVOID:
- Generic "tell me about yourself" questions
- Overly formal or robotic language
- Questions that don't relate to the specific role/industry
- Templates that sound rehearsed

Return ONLY this JSON format:
[
  {
    "id": "q1",
    "text": "Your authentic opening question that sounds like a real hiring manager",
    "type": "opening",
    "difficulty": "easy"
  }
]

No additional text - just the JSON array.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const questionsText = data.choices[0].message.content.trim();
    
    // Clean up the response to extract just the JSON
    const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    try {
      const questions = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(questions) || questions.length !== 1) {
        throw new Error('AI did not return exactly 1 questions');
      }
      
      // Store questions globally for reference
      globalQuestions = questions;
      
      return questions;
    } catch (parseError) {
      console.log(jsonMatch[0]);
      console.error('Failed to parse AI response:', questionsText);
      throw new Error('Failed to parse AI-generated questions');
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

export const generateNextQuestion = async (
  setup: InterviewSetup,
  responses: InterviewResponse[],
  _aiState: AIInterviewerState,
  _suggestedType?: string,
  interviewStartTime?: Date
): Promise<Question> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key is required for AI-generated questions');
  }

  // Time-based interview conclusion (approximately 15 minutes)
  const interviewDuration = interviewStartTime ? 
    (Date.now() - interviewStartTime.getTime()) / 1000 / 60 : 0; // minutes

  // Instead of abrupt ending, encourage a natural wrap-up after 15 minutes
  const shouldWrapUp = interviewDuration >= 15 || 
    (interviewDuration >= 10 && getAverageScore(responses) <= 4);

  if (shouldWrapUp) {
    // Use an allowed type (e.g., 'behavioral') for the closing question
    return {
      id: `q${responses.length + 1}`,
      text: `We've had a great conversation so far. Before we wrap up, is there anything else you'd like to share about your experience, or do you have any questions for me about the role or company?`,
      type: 'closing', // Now using the new allowed type
      difficulty: 'easy'
    };
  }

  try {
    // Get the last 3 Q&A pairs for context to understand conversation flow
    const recentContext = responses.slice(-3).map((r, index) => {
      const questionNum = responses.length - 2 + index;
      const question = getQuestionById(r.questionId);
      return `Q${questionNum + 1}: ${question} 
A${questionNum + 1}: ${r.response}`;
    }).join('\n\n');

    const currentQuestionNumber = responses.length + 1;

    // Analyze candidate's performance and interests
    const recentScores = responses.slice(-2).map(r => r.analysis?.score || 5);
    const averageRecentScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const candidateStrengths = responses.slice(-2).flatMap(r => r.analysis?.strengths || []);
    const areasOfInterest = responses.slice(-2).map(r => r.response).join(' ').toLowerCase();

    // Assess candidate intelligence/performance level for adaptive questioning
    const overallPerformance = getAverageScore(responses);
    const isStruggling = overallPerformance <= 4;
    const isPerformingWell = overallPerformance >= 7;

    // Determine if we should ask a technical question
    const questionTypesAsked = responses.map(r => {
      const question = globalQuestions.find(q => q.id === r.questionId);
      return question?.type || 'unknown';
    });
    
    const hasAskedTechnical = questionTypesAsked.includes('technical');
    const shouldAskTechnical = !hasAskedTechnical && responses.length >= 2 && !isStruggling;
    
    // Get technical questions for this role/industry
    const technicalQuestions = getTechnicalQuestions(setup.jobType, setup.industry, setup.experienceLevel);    const prompt = `You are Alex Rodriguez, a charismatic and insightful ${setup.industry} hiring manager. You're conducting a real interview for a ${setup.experienceLevel} ${setup.jobType} position. You have a warm, engaging personality but ask sharp, insightful questions. You make candidates feel comfortable while getting to the heart of their capabilities.

INTERVIEW CONTEXT:
- Question #${currentQuestionNumber} (no fixed limit—let the conversation flow naturally)
- Interview duration: ${interviewDuration.toFixed(1)} minutes
- Experience level: ${setup.experienceLevel}
- Role: ${setup.jobType}
- Industry: ${setup.industry}
- Recent performance: ${averageRecentScore.toFixed(1)}/10 average on last 2 questions
- Overall performance: ${overallPerformance.toFixed(1)}/10
- Candidate status: ${isStruggling ? 'Struggling—consider gentler questions' : isPerformingWell ? 'Performing well—feel free to go deeper' : 'Moderate—keep a balanced approach'}
- Technical questions asked: ${hasAskedTechnical ? 'Yes' : 'No'}

RECENT CONVERSATION:
${recentContext}

CANDIDATE ANALYSIS:
- Recent strengths: ${candidateStrengths.slice(0, 3).join(', ')}
- Areas of interest mentioned: ${extractKeyTopics(areasOfInterest)}
- Performance trend: ${getPerformanceTrend(recentScores)}

ADAPTIVE STRATEGY:
${isStruggling ? 
  'The candidate could use some encouragement. Ask clear, simple questions and help them feel comfortable.' :
  isPerformingWell ?
  'The candidate is doing great! Feel free to ask more challenging or thought-provoking questions.' :
  'Keep the questions balanced and engaging.'
}

${shouldAskTechnical ? `It's a good time to ask a technical question. Here are some examples for ${setup.jobType} in ${setup.industry}:
${technicalQuestions.slice(0, 5).map(q => `- "${q}"`).join('\n')}

Choose one of these or create a similar technical question that:
- Is appropriate for ${setup.experienceLevel} level
- Relates to the role requirements
- Can be answered in 2-3 minutes
- Tests practical knowledge, not just memorization` :
  'Continue with behavioral, situational, or follow-up questions based on the conversation.'
}

INTERVIEW STRATEGY:
- Build on interesting points from their previous answers
- Show curiosity and encourage them to elaborate
- Explore areas where they showed enthusiasm or expertise
- Keep the conversation natural and engaging
- Adapt question complexity to their performance
${shouldAskTechnical ? '- Include a technical question to assess role-specific knowledge' : ''}

QUESTION TYPES TO CONSIDER:
- behavioral: "Tell me about a time when..." (STAR method)
- technical: Role-specific skills, tools, or knowledge for ${setup.jobType}
- situational: "How would you handle..." (hypothetical scenarios)
- follow_up: "You mentioned [specific detail]—can you elaborate on..."
- problem_solving: "Walk me through how you would approach..."
- leadership: Team management, influence, or strategic thinking
- cultural_fit: Values, work style, and team collaboration

DIFFICULTY ADAPTATION:
- If struggling (score < 5): Ask very basic, supportive questions
- If moderate (score 5-7): Ask standard questions with some challenge
- If performing well (score > 7): Ask complex, strategic questions

NATURAL CONVERSATION TECHNIQUES:
- Use Alex's warm, conversational tone: "I'm curious about...", "What's your take on...", "That's interesting - tell me more about..."
- Keep questions concise and focused (1-2 sentences max)
- Reference specific details from their previous answers
- Ask for concrete examples when they mention general concepts
- Probe deeper on achievements or challenges they mention
- Connect their experiences to the role requirements naturally

INDUSTRY-SPECIFIC FOCUS:
${getIndustryContext(setup.industry)}

ROLE-SPECIFIC KNOWLEDGE:
${getRoleContext(setup.jobType, setup.industry)}

TASK: Generate the next question that feels like a natural continuation of the conversation. If the interview is nearing its end (around 15 minutes), help wrap up with a friendly closing question or reflection, thanking the candidate and inviting any final thoughts or questions.

REQUIREMENTS:
1. NATURAL FLOW: Connect logically to their previous answers using Alex's conversational style
2. CONCISE: Keep questions short and focused (1-2 sentences max)
3. AUTHENTIC: Sound like Alex having a real conversation, not conducting an interrogation
4. RELEVANT: Directly related to the ${setup.jobType} role
5. ENGAGING: Use Alex's warm but sharp questioning style

EXAMPLE STYLES:
- "You mentioned [specific project/achievement]—that sounds really interesting. Walk me through how you approached that challenge and what you learned from it?"
- "I'm curious about your experience with [specific skill/tool]. How have you used that in your previous roles, and what kind of results did you see?"
- "That's a great point about [specific detail]. How do you think that experience would translate to the challenges we face here in [industry/role]?"
- "You seem really passionate about [specific area]. What draws you to that, and how do you stay current with developments in that field?"
${shouldAskTechnical ? `- "${technicalQuestions[0]}"` : ''}

If the interview is wrapping up, offer a friendly closing question, thank the candidate for their time, and invite any final thoughts or questions.

Return ONLY this JSON format:
{
  "id": "q${currentQuestionNumber}",
  "text": "Your natural, conversational question that builds on the conversation (or a friendly closing if wrapping up)",
  "type": "behavioral|technical|situational|follow_up|problem_solving|leadership|cultural_fit|closing",
  "difficulty": "easy|medium|hard"
}

No additional text - just the JSON object.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const questionText = data.choices[0].message.content.trim();
    
    // Clean up the response to extract just the JSON
    const jsonMatch = questionText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    try {
      const question = JSON.parse(jsonMatch[0]);
      if (!question.id || !question.text || !question.type) {
        throw new Error('AI response missing required fields');
      }
      
      // Add the new question to global questions
      globalQuestions.push(question);
      
      return question;
    } catch (parseError) {
      console.error('Failed to parse AI response:', questionText);
      throw new Error('Failed to parse AI-generated question');
    }
  } catch (error) {
    console.error('Error generating next question:', error);
    if (error instanceof Error && error.message === 'INTERVIEW_COMPLETE') {
      throw error;
    }
    throw error;
  }
};

export const analyzeResponse = async (
  question: Question,
  response: string,
  setup: InterviewSetup,
  previousResponses: InterviewResponse[]
): Promise<any> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return getFallbackAnalysis(response);
  }

  try {
    // Get context from previous responses for comparison
    const previousScores = previousResponses.map(r => r.analysis?.score || 5);
    const averagePreviousScore = previousScores.length > 0 ? 
      previousScores.reduce((sum, score) => sum + score, 0) / previousScores.length : 5;
    
    const responseLength = response.length;
    const wordCount = response.split(' ').length;
    const hasSpecificExamples = /(example|instance|time|when|project|case)/i.test(response);
    const hasQuantifiableResults = /(\d+%|\d+ percent|\$\d+|\d+ people|\d+ users|\d+ customers)/i.test(response);
    const hasSTARStructure = /(situation|task|action|result|challenge|solution|outcome)/i.test(response);
    const showsEnthusiasm = /(excited|passionate|love|enjoy|thrilled|motivated|inspired)/i.test(response);

    const prompt = `You are Alex Rodriguez, a senior ${setup.industry} hiring manager with 15+ years of experience evaluating candidates for ${setup.jobType} positions. You have a warm, encouraging personality but provide sharp, actionable feedback. You've interviewed hundreds of candidates and know exactly what separates top performers from average ones.

INTERVIEW CONTEXT:
- Position: ${setup.jobType}
- Industry: ${setup.industry}
- Experience Level: ${setup.experienceLevel}
- Question Type: ${question.type}
- Question Asked: "${question.text}"

CANDIDATE RESPONSE:
"${response}"

RESPONSE ANALYSIS METRICS:
- Length: ${responseLength} characters, ${wordCount} words
- Specific examples mentioned: ${hasSpecificExamples ? 'Yes' : 'No'}
- Quantifiable results: ${hasQuantifiableResults ? 'Yes' : 'No'}
- STAR structure elements: ${hasSTARStructure ? 'Yes' : 'No'}
- Enthusiasm indicators: ${showsEnthusiasm ? 'Yes' : 'No'}
- Previous performance: ${averagePreviousScore.toFixed(1)}/10 average

EVALUATION CRITERIA FOR ${setup.experienceLevel} ${setup.jobType}:

CONTENT QUALITY (40%):
- Relevance to the question asked
- Specificity and detail level
- Use of concrete examples and quantifiable results
- Demonstration of role-specific knowledge
- Industry awareness and current trends

COMMUNICATION SKILLS (30%):
- Clarity and structure of response
- Professional tone and confidence
- Ability to articulate complex ideas
- Storytelling and narrative flow
- Appropriate level of detail for ${setup.experienceLevel}

EXPERIENCE ALIGNMENT (20%):
- Match between experience level and response sophistication
- Demonstration of expected competencies
- Evidence of growth and learning
- Transferable skills and adaptability

CULTURAL FIT (10%):
- Enthusiasm and passion for the role/industry
- Values alignment with company culture
- Team collaboration indicators
- Problem-solving approach

SCORING RUBRIC FOR ${setup.experienceLevel}:
9-10: Exceptional - Specific examples, quantifiable results, clear structure, highly relevant, shows deep understanding
7-8: Strong - Good examples, clear relevance, well-structured, demonstrates competence
5-6: Adequate - Some examples, relevant but missing depth, basic structure, meets minimum expectations
3-4: Weak - Vague, lacks examples, poor structure, not well-suited for level
1-2: Poor - Very brief, irrelevant, inappropriate, or shows lack of preparation

INDUSTRY-SPECIFIC ASSESSMENT:
${getIndustryContext(setup.industry)}

ROLE-SPECIFIC EVALUATION:
${getRoleContext(setup.jobType, setup.industry)}

TASK: Provide a concise, actionable evaluation as a hiring manager would give.

ANALYSIS REQUIREMENTS:
1. CONCISE: Keep feedback focused and to the point (2-3 sentences max)
2. ACTIONABLE: Provide specific, practical improvement suggestions
3. BALANCED: Highlight what worked well AND what needs improvement
4. RELEVANT: Connect feedback directly to the role and question asked
5. ENCOURAGING: Be constructive and supportive, but also critical
6. CAPITALIZATION: Use proper title case for all strength and improvement items (e.g., "Technical Problem Solving", "Clear Communication")

Return ONLY this JSON format:
{
  "score": 1-10,
  "feedback": "Concise, balanced feedback (2-3 sentences) highlighting what worked well and providing 1-2 specific actionable improvements.",
  "strengths": ["Specific Strength 1", "Specific Strength 2", "Specific Strength 3"],
  "areasForImprovement": ["Specific Improvement Area 1", "Specific Improvement Area 2"],
  "confidenceIndicators": {
    "responseLength": ${responseLength},
    "specificExamples": ${hasSpecificExamples},
    "structuredAnswer": ${hasSTARStructure},
    "enthusiasm": ${showsEnthusiasm ? 8 : 5},
    "quantifiableResults": ${hasQuantifiableResults}
  },
  "nextQuestionType": "behavioral|technical|situational|follow_up|problem_solving|leadership|cultural_fit|closing",
  "performanceTrend": "${averagePreviousScore > 0 ? (averagePreviousScore > 5 ? 'improving' : 'stable') : 'new'}",
  "roleAlignment": "high|medium|low",
  "culturalFit": "high|medium|low"
}

No additional text - just the JSON object.`;

    const response_api = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response_api.ok) {
      throw new Error(`OpenAI API error: ${response_api.status}`);
    }

    const data = await response_api.json();
    const analysisText = data.choices[0].message.content.trim();
    
    // Clean up the response to extract just the JSON
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getFallbackAnalysis(response);
    }
    
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', analysisText);
      return getFallbackAnalysis(response);
    }
  } catch (error) {
    console.error('Error analyzing response:', error);
    return getFallbackAnalysis(response);
  }
};

export const synthesizeSpeech = async (text: string): Promise<HTMLAudioElement | null> => {
  // Use ElevenLabs TTS with Mark voice (professional male) and Flash v2.5
  return await synthesizeSpeechWithElevenLabs(text);
};

// Helper functions
const getFallbackAnalysis = (response: string) => {
  const responseLength = response.length;
  const hasSpecificExamples = /(example|instance|time|when|project|case)/i.test(response);
  const hasSTARStructure = /(situation|task|action|result|challenge|solution|outcome)/i.test(response);
  const hasQuantifiableResults = /(\d+%|\d+ percent|\$\d+|\d+ people|\d+ users|\d+ customers)/i.test(response);
  const showsEnthusiasm = /(excited|passionate|love|enjoy|thrilled|motivated|inspired)/i.test(response);
    return {
    score: Math.min(10, Math.max(1, Math.floor(response.length / 20) + 3)),
    feedback: "Good response! Try to include more specific examples and quantifiable results to strengthen your answer.",
    strengths: ["Clear Communication", "Relevant Experience", "Professional Tone"],
    areasForImprovement: ["Add Specific Examples", "Include Quantifiable Results", "Provide More Detail"],
    confidenceIndicators: {
      responseLength: responseLength,
      specificExamples: hasSpecificExamples,
      structuredAnswer: hasSTARStructure,
      enthusiasm: showsEnthusiasm ? 7 : 5,
      quantifiableResults: hasQuantifiableResults
    },
    nextQuestionType: 'behavioral',
    performanceTrend: 'stable',
    roleAlignment: 'medium',
    culturalFit: 'medium'
  };
};

const getAverageScore = (responses: InterviewResponse[]): number => {
  const scores = responses.map(r => r.analysis?.score || 5);
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const getQuestionById = (questionId: string): string => {
  const question = globalQuestions.find(q => q.id === questionId);
  return question?.text || "Previous question";
};

// Export function to update global questions
export const updateGlobalQuestions = (questions: Question[]) => {
  globalQuestions = [...questions];
};

// Generate focused questions for specific interview types
export const generateFocusedQuestions = async (interviewType: string, setup: InterviewSetup): Promise<Question[]> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key is required for AI-generated questions.');
  }

  try {
    const interviewConfig = {
      technical: {
        title: 'Technical Questions',
        description: 'Practice coding, system design, and technical concepts',
        duration: 5,
        maxQuestions: 6,
        focus: 'advanced technical skills, system architecture, coding challenges, and deep technical knowledge'
      },
      behavioral: {
        title: 'Behavioral Questions',
        description: 'Master the STAR method and leadership scenarios',
        duration: 4,
        maxQuestions: 5,
        focus: 'leadership experiences, challenging situations, team dynamics, and measurable achievements'
      },
      situational: {
        title: 'Situational Questions',
        description: 'Handle workplace challenges and problem-solving',
        duration: 4,
        maxQuestions: 5,
        focus: 'complex workplace scenarios, ethical dilemmas, crisis management, and strategic decision-making'
      },
      resume: {
        title: 'Resume Questions',
        description: 'Articulate your background and experience effectively',
        duration: 3,
        maxQuestions: 4,
        focus: 'career transitions, skill development, achievements quantification, and professional growth'
      },
      leadership: {
        title: 'Leadership Questions',
        description: 'Demonstrate leadership and management skills',
        duration: 5,
        maxQuestions: 5,
        focus: 'executive presence, organizational impact, change management, and strategic leadership'
      },
      caseStudy: {
        title: 'Case Study Interviews',
        description: 'Practice business and technical case scenarios',
        duration: 8,
        maxQuestions: 3,
        focus: 'complex business analysis, market strategy, profitability frameworks, and data-driven decision making'
      },
      systemDesign: {
        title: 'System Design Interviews',
        description: 'Master architecture and scalability discussions',
        duration: 10,
        maxQuestions: 2,
        focus: 'large-scale system architecture, performance optimization, scalability challenges, and technical trade-offs'
      },
      leadershipAssessment: {
        title: 'Leadership Assessment',
        description: 'Advanced management and executive scenarios',
        duration: 8,
        maxQuestions: 4,
        focus: 'executive decision-making, organizational transformation, stakeholder management, and strategic vision'
      },
      culturalFit: {
        title: 'Cultural Fit',
        description: 'Assess values, team fit, and alignment with company mission',
        duration: 4,
        maxQuestions: 5,
        focus: 'value alignment, collaboration style, adaptability, and cultural integration'
      },
      communication: {
        title: 'Communication',
        description: 'Practice presentation and explaining complex ideas',
        duration: 4,
        maxQuestions: 4,
        focus: 'executive communication, complex idea explanation, stakeholder presentation, and persuasive messaging'
      },
      problemSolving: {
        title: 'Problem Solving',
        description: 'Logic puzzles, brainteasers, and structured thinking',
        duration: 4,
        maxQuestions: 5,
        focus: 'analytical reasoning, creative problem-solving, logical frameworks, and innovative thinking'
      },
      salaryNegotiation: {
        title: 'Salary Negotiation',
        description: 'Practice negotiating offers and discussing compensation',
        duration: 3,
        maxQuestions: 4,
        focus: 'compensation discussions, offer negotiation, value articulation, and strategic positioning'
      },
      closing: {
        title: 'Closing/Wrap-up',
        description: 'How to end interviews and ask questions back',
        duration: 2,
        maxQuestions: 3,
        focus: 'strategic questioning, interview closure, relationship building, and next steps positioning'
      }
    };

    const config = interviewConfig[interviewType as keyof typeof interviewConfig];
    const technicalQuestions = getTechnicalQuestions(setup.jobType, setup.industry, setup.experienceLevel);    const prompt = `You are Alex Rodriguez, a charismatic and insightful ${setup.industry} hiring manager with 20+ years of experience. You're known for your warm yet sharp interviewing style - you make candidates feel comfortable while asking penetrating questions that reveal their true potential. You have a slight sense of humor and genuine curiosity about people.

INTERVIEW CONTEXT:
- TYPE: ${config.title} (Focused Session)
- TARGET: ${setup.experienceLevel} ${setup.jobType} in ${setup.industry}
- FOCUS: ${config.focus}
- DURATION: ${config.duration} minutes
- QUESTIONS NEEDED: ${config.maxQuestions}

CANDIDATE PROFILE:
- Experience Level: ${setup.experienceLevel}
- Role: ${setup.jobType}
- Industry: ${setup.industry}
- Interview Mode: ${setup.interviewMode}

INDUSTRY EXPERTISE:
${getIndustryContext(setup.industry)}

ROLE-SPECIFIC REQUIREMENTS:
${getRoleContext(setup.jobType, setup.industry)}

EXPERIENCE LEVEL CALIBRATION:
${getExperienceLevelContext(setup.experienceLevel)}

QUESTION GENERATION REQUIREMENTS:

1. **CONVERSATIONAL TONE**: Write questions in Alex's warm, engaging style - use "I'm curious about...", "What's your take on...", "Tell me about a time..."
2. **CONCISE & FOCUSED**: Questions should be 1-2 sentences max, clear and to the point
3. **RELEVANT**: Directly related to ${setup.jobType} in ${setup.industry}
4. **PROGRESSIVE**: Build complexity gradually
5. **AUTHENTIC**: Sound like a real conversation, not an interrogation

${interviewType === 'technical' ? `
TECHNICAL FOCUS AREAS:
- Advanced technical concepts for ${setup.jobType}
- System design and architecture challenges
- Real-world problem-solving scenarios
- Technology stack decision-making
- Performance optimization and scaling
- Best practices and trade-off analysis

TECHNICAL QUESTION INSPIRATION (create unique variations):
${technicalQuestions.slice(0, 8).map(q => `- "${q}"`).join('\n')}

Create questions that test:
- Deep technical understanding beyond memorization
- Practical application of concepts
- Decision-making in technical scenarios
- Ability to explain complex topics clearly
- Trade-off analysis and optimization thinking` : ''}

${interviewType === 'behavioral' ? `
BEHAVIORAL FOCUS AREAS:
- Leadership in challenging situations
- Impact and measurable results
- Cross-functional collaboration
- Innovation and change management
- Conflict resolution and difficult conversations
- Strategic thinking and long-term planning

Question should probe for:
- Specific examples with quantifiable outcomes
- Leadership approach and philosophy
- Handling of complex stakeholder dynamics
- Decision-making under pressure
- Growth mindset and learning from failures` : ''}

${interviewType === 'situational' ? `
SITUATIONAL FOCUS AREAS:
- Complex workplace scenarios requiring strategic thinking
- Ethical dilemmas and tough decisions
- Crisis management and rapid response
- Cross-functional collaboration challenges
- Resource constraints and prioritization
- Change management and organizational dynamics

Create scenarios that are:
- Realistic for ${setup.jobType} in ${setup.industry}
- Complex enough to require strategic thinking
- Open-ended to allow for multiple approaches
- Test both analytical and interpersonal skills` : ''}

${interviewType === 'leadership' ? `
LEADERSHIP FOCUS AREAS:
- Executive presence and influence without authority
- Organizational transformation and change leadership
- Strategic vision and long-term planning
- Team building and talent development
- Stakeholder management and communication
- Performance management and difficult conversations

Probe for:
- Leadership philosophy and approach
- Handling of complex organizational challenges
- Building high-performing teams
- Strategic decision-making
- Influence and persuasion skills` : ''}

${interviewType === 'systemDesign' ? `
SYSTEM DESIGN FOCUS AREAS:
- Large-scale distributed system architecture
- Performance, scalability, and reliability trade-offs
- Database design and data modeling
- API design and microservices architecture
- Load balancing, caching, and optimization
- Security, monitoring, and operational concerns

Create scenarios that require:
- End-to-end system thinking
- Technology choice justification
- Scalability planning (millions of users)
- Real-world constraints and trade-offs
- Operational and maintenance considerations` : ''}

${interviewType === 'caseStudy' ? `
CASE STUDY FOCUS AREAS:
- Business strategy and market analysis
- Profitability and growth frameworks
- Competitive analysis and positioning
- Data analysis and insights generation
- Strategic recommendations and implementation
- Risk assessment and mitigation

Present cases that involve:
- Complex business scenarios relevant to ${setup.industry}
- Multiple stakeholders and competing priorities
- Data interpretation and strategic insights
- Market dynamics and competitive forces
- Financial analysis and business metrics` : ''}

${interviewType === 'problemSolving' ? `
PROBLEM SOLVING FOCUS AREAS:
- Complex analytical reasoning challenges
- Creative thinking and innovative approaches
- Structured problem-solving frameworks
- Logic puzzles requiring step-by-step thinking
- Mathematical reasoning and estimation
- Pattern recognition and abstract thinking

Create problems that:
- Require systematic thinking and clear logic
- Test analytical reasoning, not technical knowledge
- Allow for creative and innovative approaches
- Build in complexity that matches ${setup.experienceLevel} level
- Focus on thinking process, not just correct answers` : ''}

DIFFICULTY CALIBRATION:
- Entry-level: Focus on foundational concepts, basic scenarios, learning orientation
- Mid-level: Moderate complexity, some leadership elements, cross-functional collaboration
- Senior-level: Complex strategic scenarios, organizational impact, advanced technical depth
- Executive-level: Strategic vision, organizational transformation, industry-level thinking

OUTPUT FORMAT:
Return ONLY a JSON array with exactly ${config.maxQuestions} questions:

[
  {
    "id": "fq1",
    "text": "Your sophisticated, role-specific question here",
    "type": "${interviewType}",
    "difficulty": "medium|hard"
  }
]

EXAMPLES OF ALEX'S QUESTIONING STYLE:

Instead of: "Describe a situation where you had to lead a cross-functional team through a major change initiative while managing competing stakeholder priorities and tight deadlines."
Alex asks: "Tell me about a time you had to get different teams on the same page when everyone wanted different things. How'd you make it work?"

Instead of: "Walk me through your architecture decisions for handling message delivery, user presence, file sharing, and ensuring sub-200ms latency worldwide while maintaining GDPR compliance."
Alex asks: "If you had to build a chat system for thousands of users, what's the first technical challenge you'd tackle and why?"

Keep Alex's questions short, conversational, and focused on one key concept per question.

Generate exactly ${config.maxQuestions} questions. No additional text - just the JSON array.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const questionsText = data.choices[0].message.content.trim();
    
    // Clean up the response to extract just the JSON
    const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    try {
      const questions = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(questions) || questions.length !== config.maxQuestions) {
        throw new Error(`AI did not return exactly ${config.maxQuestions} questions`);
      }
      
      // Store questions globally for reference
      globalQuestions = [...globalQuestions, ...questions];
      
      return questions;
    } catch (parseError) {
      console.log(jsonMatch[0]);
      console.error('Failed to parse AI response:', questionsText);
      throw new Error('Failed to parse AI-generated focused questions');
    }
  } catch (error) {
    console.error('Error generating focused questions:', error);
    throw error;
  }
};