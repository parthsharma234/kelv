import { InterviewSetup, Question, InterviewResponse, AIInterviewerState } from '../types/interview';
import { synthesizeSpeechWithElevenLabs } from './elevenLabsTTS';
import { analyzeVerbalResponse } from './verbalFeedback';
import { getQuestions } from './questionBank';
import Sentiment from 'sentiment';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const MAX_ACTIVE_LISTENING_BULLETS = 2;

const basicFallbackSummaries = (answer: string): string[] => {
  const normalized = answer.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) {
    return [normalized.length > 160 ? `${normalized.slice(0, 157).trim()}…` : normalized];
  }
  return sentences.slice(0, MAX_ACTIVE_LISTENING_BULLETS).map(sentence => {
    const trimmed = sentence.trim();
    return trimmed.length > 160 ? `${trimmed.slice(0, 157).trim()}…` : trimmed;
  });
};

export async function summarizeCandidateTurn(
  answer: string,
  options: { question?: string; setup?: InterviewSetup } = {}
): Promise<string[]> {
  const trimmedAnswer = answer.replace(/\s+/g, ' ').trim();
  if (!trimmedAnswer) {
    return [];
  }

  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return basicFallbackSummaries(trimmedAnswer);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 180,
        messages: [
          {
            role: 'system',
            content: 'You capture concise active-listening notes during interviews. Respond with a JSON array containing 1-2 natural-language bullet strings (max 18 words each). Do not add commentary.'
          },
          {
            role: 'user',
            content: `Question: ${options.question ?? 'Unknown question'}\nIndustry: ${options.setup?.industry ?? 'Unknown'}\nRole: ${options.setup?.jobType ?? 'Unknown'}\n\nCandidate response:\n${trimmedAnswer}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    let bullets: string[] = [];
    try {
      bullets = JSON.parse(content);
      if (!Array.isArray(bullets)) {
        throw new Error('Invalid JSON structure');
      }
    } catch {
      bullets = content
        .split(/\n|•|-/)
        .map((entry: string) => entry.trim())
        .filter(Boolean);
    }

    const sanitized = bullets
      .map((entry: string) => entry.replace(/^[-•\s]+/, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, MAX_ACTIVE_LISTENING_BULLETS);

    if (sanitized.length === 0) {
      return basicFallbackSummaries(trimmedAnswer);
    }

    return sanitized;
  } catch (error) {
    console.warn('[summarizeCandidateTurn] Falling back to heuristic summary', error);
    return basicFallbackSummaries(trimmedAnswer);
  }
}

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

// Extract speech metrics using a lightweight in-file analysis
export async function extractSpeechMetrics(
  audioBlob: Blob,
  transcription: string,
  duration: number
) {
  try {
    const legacy = await extractSpeechMetricsOld(audioBlob, transcription, duration);

    if (!legacy) {
      throw new Error('Legacy speech metrics unavailable');
    }

    return {
      speechRate: legacy.speechRate,
      fluencyScore: legacy.fluencyScore,
      voiceConfidence: legacy.voiceConfidence,
      deliveryScore: legacy.delivery,
      clarityScore: legacy.clarity,
      fillerWordCount: legacy.fillerWordCount,
      pauseAnalysis: {
        averagePauseLength: 0,
        pauseFrequency: legacy.pauseRatio,
        strategicPauses: 0
      },
      pitchAnalysis: {
        averagePitch: legacy.estimatedPitch,
        pitchVariation: 0,
        pitchStability: 0
      },
      energyAnalysis: {
        averageEnergy: legacy.averageVolume,
        energyConsistency: 0,
        dynamicRange: 0
      },
      timestamp: Date.now(),
      fluency: legacy.fluencyScore / 10,
      delivery: legacy.delivery,
      clarity: legacy.clarity,
      duration: legacy.duration,
      vocalEnergy: Math.round(legacy.averageVolume * 100),
      sentimentPaceBalance: Math.round(
        Math.max(
          0,
          1 - Math.abs(analyzeVerbalResponse(transcription).sentiment - 0.5) * 2 - Math.abs(legacy.speechRate - 160) / 160
        ) * 100
      ),
      sentimentScore: (() => {
        const sentimentAnalyzer = new Sentiment();
        const sentimentResult = sentimentAnalyzer.analyze(transcription);
        return Math.max(-1, Math.min(1, sentimentResult.comparative));
      })()
    };
  } catch (error) {
    console.error('Error extracting speech metrics:', error);
    return {
      speechRate: 0,
      fluencyScore: 0,
      voiceConfidence: 0,
      deliveryScore: 0,
      clarityScore: 0,
      fillerWordCount: 0,
      pauseAnalysis: {
        averagePauseLength: 0,
        pauseFrequency: 0,
        strategicPauses: 0
      },
      pitchAnalysis: {
        averagePitch: 0,
        pitchVariation: 0,
        pitchStability: 0
      },
      energyAnalysis: {
        averageEnergy: 0,
        energyConsistency: 0,
        dynamicRange: 0
      },
      timestamp: Date.now(),
      fluency: 0,
      delivery: 0,
      clarity: 0,
      duration,
      sentimentScore: 0
    };
  }
}

// Enhanced speech metrics extraction (legacy basic implementation)
export async function extractSpeechMetricsOld(audioBlob: Blob, transcription: string, duration: number) {
  try {
    // Basic metrics from transcription
    const words = transcription.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Improved speech rate calculation
    // Ensure duration is in seconds and clamp to reasonable range
    // If duration is suspiciously small (< 1 second) or large (> 3600 seconds), assume it's in wrong units
    let safeDuration = duration;
    if (duration < 1) {
      // Duration might be in milliseconds, convert to seconds
      safeDuration = duration / 1000;
    } else if (duration > 3600) {
      // Duration might be in wrong units, assume it's reasonable
      safeDuration = Math.min(duration, 300); // Cap at 5 minutes
    }
    
    // Account for natural pauses and hesitations in speech
    safeDuration = Math.max(safeDuration * 0.88, safeDuration - 1.5);
    
    // Calculate WPM: (words / minutes) = (words / (seconds / 60)) = (words * 60) / seconds
    let speechRate = (wordCount * 60) / safeDuration;
    speechRate = Number(speechRate.toFixed(2)); // Limit to 2 decimal places
    
    // Clamp output to 60–250 WPM for realistic range
    speechRate = Math.max(60, Math.min(250, speechRate));
    
    
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
}

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
    'Retail': 'Customer-centric, fast-paced environment with focus on sales performance and customer satisfaction. Companies value interpersonal skills, product knowledge, and adaptability. Current challenges include e-commerce integration, omnichannel retail, and customer experience optimization.',
    'Government': 'Policy-driven, public service environment with emphasis on accountability, transparency, and regulatory compliance. Organizations value policy knowledge, stakeholder communication, and ethical decision-making. Current priorities include digital services, cost efficiency, and community engagement.',
    'Nonprofit': 'Mission-driven environment focused on social impact, fundraising, and community engagement. Organizations value resourcefulness, advocacy skills, and volunteer coordination. Current challenges include donor retention, impact measurement, and cross-sector partnerships.',
    'Hospitality': 'Service-oriented environment emphasizing guest experience, operational efficiency, and adaptability. Companies value customer service, crisis management, and cultural sensitivity. Current trends include personalization, contactless services, and sustainability.'
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
    'Consultant': 'Focus on problem-solving, client relationships, and strategic recommendations. Key skills include analysis, presentation, project management, and industry knowledge. Current priorities include digital transformation, change management, and value creation.',
    'Project Manager': 'Focus on planning, execution, and delivery of projects. Key skills include scheduling, stakeholder management, risk mitigation, and budgeting. Current priorities include agile adoption, cross-team coordination, and value delivery.',
    'Nurse': 'Focus on patient care, clinical expertise, and interdisciplinary collaboration. Key skills include assessment, medication administration, and patient advocacy. Current priorities include telehealth, staffing efficiency, and evidence-based practice.',
    'Teacher': 'Focus on student engagement, curriculum development, and assessment. Key skills include classroom management, lesson planning, and differentiated instruction. Current priorities include hybrid learning models, technology integration, and inclusive education.'
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
    'Nurse': {
      'Healthcare': [
        'What steps do you take to maintain accurate patient records?',
        'How do you prioritize care during a high-acuity shift?',
        'Can you explain proper protocol for medication reconciliation?'
      ]
    },
    'Teacher': {
      'Education': [
        'How do you assess student understanding in real time?',
        'What strategies do you use to engage students with different learning styles?',
        'How do you incorporate technology to enhance learning outcomes?'
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
    'Project Manager': {
      'Technology': [
        'How do you manage project scope changes without derailing timelines?',
        'What methods do you use for stakeholder communication?',
        'How do you run retrospectives to improve future sprints?'
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

  const bank = getQuestions(jobType, industry, 'technical');
  return questions[jobType]?.[industry] || bank || [
    'What are the key responsibilities of a ' + jobType + ' in ' + industry + '?',
    'How do you stay current with industry trends in ' + industry + '?',
    'What tools and technologies are essential for a ' + jobType + ' role?',
    'What are the main challenges facing ' + jobType + ' professionals in ' + industry + '?',
    'How do you measure success in a ' + jobType + ' role?'
  ];
};

// Resume-based question templates that keep the opening light and conversational (gentle)
const getResumeBasedQuestions = (
  _jobType: string,
  _industry: string,
  _experienceLevel: string
): string[] => {
  const templates = [
    'Before we dive in, what initially drew you to [role] in [industry]?',
    'At a high level, what aspects of your background feel most relevant to this [role]?',
    'What motivated you to pursue [role], and what keeps you excited about it?',
    'How would you describe your focus right now in [role] without getting into specific projects yet?',
    'What kind of work energizes you most day-to-day in [industry]?'
  ];

  return templates;
};

export const generateInterviewQuestions = async (
  setup: InterviewSetup
): Promise<Question[]> => {
  // Prefer a role/industry-specific opening question from the local question bank
  const bankQuestion =
    getQuestions(setup.jobType, setup.industry, 'behavioral')[0] ||
    getQuestions(setup.jobType, setup.industry, 'situational')[0];

  if (bankQuestion) {
    return [{ id: 'q1', text: bankQuestion, type: 'opening', difficulty: 'easy' }];
  }

  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error(
      'OpenAI API key is required for AI-generated questions. Please configure your API key to use the interview platform.'
    );
  }

  try {
    const prompt = `You are a seasoned ${setup.industry} hiring manager with 15+ years of experience interviewing for ${setup.jobType} roles. You know how to put candidates at ease and create a welcoming, conversational atmosphere.

INTERVIEW PERSONA:
- You're conducting a real interview for a ${setup.experienceLevel} ${setup.jobType} role at a leading ${setup.industry} company
- You genuinely want to get to know the candidate and help them show their best
- Your tone is warm, friendly, and professional—think of this as a two-way conversation, not an interrogation
- You ask thoughtful follow-ups and show curiosity about the candidate's journey
- You're looking for real stories, practical examples, and authentic enthusiasm

INDUSTRY CONTEXT FOR ${setup.industry}:
${getIndustryContext(setup.industry)}

ROLE-SPECIFIC KNOWLEDGE FOR ${setup.jobType}:
${getRoleContext(setup.jobType, setup.industry)}

EXPERIENCE LEVEL EXPECTATIONS:
${getExperienceLevelContext(setup.experienceLevel)}

TASK: Start the interview with a warm, gentle opening question that invites the candidate to share a high-level background or motivation. Avoid deep project walkthroughs. Keep it light and introductory. Speak with a natural, human voice (brief acknowledgements, contractions).

REQUIREMENTS:
1. RESUME-FOCUSED: Ask about their background, experience, or a specific skill
2. FRIENDLY GREETING: Begin with a welcoming, human introduction
3. CONTEXTUAL OPENING: Reference the specific role and industry
4. NATURAL FLOW: The question should feel like a real conversation starter
5. ROLE-SPECIFIC: Tailored to ${setup.jobType} and ${setup.industry}
6. EXPERIENCE-APPROPRIATE: Matches ${setup.experienceLevel} expectations
7. ENCOURAGING: Designed to help the candidate open up and feel comfortable
8. LIGHTWEIGHT: Do not ask for specific project deep-dives in the opening

RESUME-BASED QUESTION EXAMPLES (gentle):
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

    // Track question category coverage
    const categoryCounts = responses.reduce((acc: Record<string, number>, r) => {
      const q = globalQuestions.find(gq => gq.id === r.questionId);
      if (q?.type) acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});
    const targetCategories = ['behavioral', 'technical', 'situational'];
    const leastAskedCategory = targetCategories.reduce((min, cat) => {
      const count = categoryCounts[cat] ?? 0;
      const minCount = categoryCounts[min] ?? 0;
      return count < minCount ? cat : min;
    }, targetCategories[0]);

    // Determine if we should ask a technical question
    const questionTypesAsked = responses.map(r => {
      const question = globalQuestions.find(q => q.id === r.questionId);
      return question?.type || 'unknown';
    });
    
    const hasAskedTechnical = questionTypesAsked.includes('technical');
    const shouldAskTechnical = !hasAskedTechnical && responses.length >= 2 && !isStruggling;

    // Get role/industry question examples
    const technicalQuestions = getTechnicalQuestions(setup.jobType, setup.industry, setup.experienceLevel);
    const situationalExamples = getQuestions(setup.jobType, setup.industry, 'situational');

    const prompt = `You are a seasoned ${setup.industry} hiring manager continuing a real interview for a ${setup.experienceLevel} ${setup.jobType} position. Your goal is to keep the conversation flowing naturally, building on what the candidate has shared so far.

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

QUESTION COVERAGE:
${targetCategories.map(c => `- ${c}: ${categoryCounts[c] || 0}`).join('\\n')}

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
  `Consider asking a ${leastAskedCategory} question to balance coverage.${leastAskedCategory === 'situational' && situationalExamples.length ? '\nExample prompts:\n' + situationalExamples.slice(0,3).map(q => `- "${q}"`).join('\n') : ''}`
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
- Use a human voice: contractions, varied rhythm, brief acknowledgements ("makes sense", "got it")
- Reference specific details from their previous answers
- Ask for specific examples when they mention general concepts
- Probe deeper when they mention achievements or challenges
- Connect their experiences to the role requirements
- Ask one clear question at a time (avoid multi-part)

ADVANCED INTERVIEWING TECHNIQUES:

CANDIDATE PROFILE BUILDING:
- Build on emerging themes from previous responses
- Identify and explore unique perspectives or experiences
- Look for patterns in values, motivations, and decision-making
- Assess growth mindset and learning orientation

CONTEXTUAL CROSS-REFERENCING:
- "Earlier you mentioned [X], how does that connect to [current topic]?"
- "I'm noticing a pattern of [theme] in your responses. Is that accurate?"
- "Building on what you shared about [previous topic], how would you apply that to [new scenario]?"
- Reference specific examples or achievements they've mentioned

SOCRATIC QUESTIONING FOR DEEPER INSIGHT:
- "What led you to that approach/conclusion?"
- "How might someone who disagrees with you view this situation?"
- "What assumptions were you making in that situation?"
- "How has your thinking about this evolved over time?"
- "What would you do differently if faced with a similar situation?"

PERSONALIZED WRAP-UP PREPARATION:
- Identify key strengths to highlight in eventual summary
- Note areas for growth that could be addressed constructively
- Consider how their profile fits with role requirements
- Prepare to connect their unique value proposition to institutional needs

INDUSTRY-SPECIFIC FOCUS:
${getIndustryContext(setup.industry)}

ROLE-SPECIFIC KNOWLEDGE:
${getRoleContext(setup.jobType, setup.industry)}

TASK: Generate the next question that feels like a natural continuation of the conversation. If the interview is nearing its end (around 15 minutes), help wrap up with a friendly closing question or reflection, thanking the candidate and inviting any final thoughts or questions.

REQUIREMENTS:
1. NATURAL FLOW: Should connect logically to their previous answers
2. AUTHENTIC TONE: Sound like a real hiring manager, not a script
3. SPECIFIC PROBING: Reference specific details they mentioned
4. ROLE RELEVANCE: Relevant to ${setup.jobType} responsibilities
5. EXPERIENCE APPROPRIATE: Matches ${setup.experienceLevel} expectations
6. CONVERSATION BUILDING: Designed to encourage detailed, engaging responses
7. ADAPTIVE DIFFICULTY: ${isStruggling ? 'Keep it simple and supportive' : isPerformingWell ? 'Make it challenging and thought-provoking' : 'Use standard difficulty'}
${shouldAskTechnical ? '8. TECHNICAL FOCUS: Include a real technical question from the domain' : ''}

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
  previousResponses: InterviewResponse[],
  interviewType?: string
): Promise<any> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return getFallbackAnalysis(response, interviewType);
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

    // Determine if this is a focused interview
    const isFocusedInterview = !!interviewType;

    const prompt = `You are a senior ${setup.industry} hiring manager with 15+ years of experience evaluating candidates for ${setup.jobType} positions. You've interviewed hundreds of candidates and know exactly what separates top performers from average ones.

INTERVIEW CONTEXT:
- Position: ${setup.jobType}
- Industry: ${setup.industry}
- Experience Level: ${setup.experienceLevel}
- Question Type: ${question.type}
- Question Asked: "${question.text}"
 - Interview Type: ${isFocusedInterview ? `Focused Interview (${interviewType})` : 'Standard Interview'}

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

ADVANCED ANALYSIS TECHNIQUES:

CANDIDATE PROFILE BUILDING:
- Extract key themes, values, and motivations from this response
- Identify unique perspectives, experiences, or backgrounds
- Note patterns in communication style and thought processes
- Assess growth mindset and learning orientation indicators

CONTEXTUAL CROSS-REFERENCING:
${previousResponses.length > 0 ? `
Previous response themes to consider:
${previousResponses.slice(-3).map((r, i) => `${i + 1}. "${r.response.substring(0, 100)}..." (Score: ${r.analysis?.score || 'N/A'})`).join('\n')}

Look for consistency, evolution, or contradictions in themes, values, or examples mentioned.
` : 'This is the first response - establish baseline profile.'}

SOCRATIC EVALUATION:
- What assumptions might the candidate be making?
- What underlying values or principles are guiding their thinking?
- How might they respond to gentle challenges or alternative perspectives?
- What follow-up questions would reveal deeper insights?

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
7. REWRITE: Offer improved phrasings of the candidate's response

${isFocusedInterview ? `
FOCUSED INTERVIEW METRICS:
For this focused interview, provide scores (1-10) for these specific metrics:
- problem_solving: How well the candidate demonstrates analytical thinking and problem-solving approach
- communication: Clarity, structure, and effectiveness of communication
- depth: Level of detail, insight, and thoroughness in the response
- relevance: How well the response directly addresses the question and role requirements
` : `
COLLEGE INTERVIEW METRICS:
For this college interview, provide scores (1-10) for these specific metrics:
- authenticity: How genuine and honest the response feels
- passion: Level of enthusiasm and interest demonstrated
- clarity: How clear and well-structured the communication is
- specificity: Use of specific examples and concrete details
`}

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
  "culturalFit": "high|medium|low",
  "rewriteSuggestions": {
    "restructure": "Improved structure suggestion",
    "concise": "More concise version"
  }${isFocusedInterview ? `,
  "problem_solving": 1-10,
  "communication": 1-10,
  "depth": 1-10,
  "relevance": 1-10` : ''}
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
const getFallbackAnalysis = (response: string, interviewType?: string) => {
  const responseLength = response.length;
  const wordCount = response.trim().split(/\s+/).length;
  const hasSpecificExamples = /(example|instance|time|when|project|case)/i.test(response);
  const hasSTARStructure = /(situation|task|action|result|challenge|solution|outcome)/i.test(response);
  const hasQuantifiableResults = /(\d+%|\d+ percent|\$\d+|\d+ people|\d+ users|\d+ customers)/i.test(response);
  const showsEnthusiasm = /(excited|passionate|love|enjoy|thrilled|motivated|inspired)/i.test(response);
  const verbal = analyzeVerbalResponse(response);
  
  const isFocusedInterview = !!interviewType;
  
  // More realistic confidence scoring based on response quality
  let confidenceScore = 1;
  if (responseLength < 20) {
    // Very brief responses get very low confidence
    confidenceScore = 1;
  } else if (responseLength < 50) {
    // Short responses get low confidence
    confidenceScore = 2;
  } else if (responseLength < 100) {
    // Medium responses get moderate confidence
    confidenceScore = showsEnthusiasm ? 4 : 3;
  } else {
    // Longer responses get higher confidence, but still depend on content quality
    confidenceScore = showsEnthusiasm ? 6 : 4;
    if (hasSpecificExamples) confidenceScore += 1;
    if (hasSTARStructure) confidenceScore += 1;
    if (hasQuantifiableResults) confidenceScore += 1;
  }
  // Adjust confidence by verbal analysis (filler words and sentiment)
  confidenceScore -= verbal.fillerCount * 0.5;
  confidenceScore += (verbal.sentiment - 0.5) * 4;
  confidenceScore = Math.max(1, Math.min(10, Math.round(confidenceScore)));
  
  // Determine feedback and strengths based on response quality
  let feedback, strengths, areasForImprovement;
  if (responseLength < 20) {
    feedback = "The response was extremely brief and did not address the question. Please provide more detail about your background and interest, using specific examples to demonstrate your enthusiasm and understanding.";
    strengths = ["Concise"];
    areasForImprovement = ["Provide Much More Detail", "Address the Question Directly", "Include Specific Examples", "Show Enthusiasm and Interest"];
  } else if (responseLength < 50) {
    feedback = "The response was too brief and lacked detail. Try to provide specific examples and elaborate on your experience and interests.";
    strengths = ["Clear Communication"];
    areasForImprovement = ["Add Much More Detail", "Include Specific Examples", "Show More Enthusiasm"];
  } else {
    feedback = "Good response! Try to include more specific examples and quantifiable results to strengthen your answer.";
    strengths = ["Clear Communication", "Relevant Experience", "Professional Tone"];
    areasForImprovement = ["Add Specific Examples", "Include Quantifiable Results", "Provide More Detail"];
  }

  if (verbal.fillerCount > 0) {
    areasForImprovement.push('Reduce filler words');
  }
  if (verbal.sentiment < 0.4) {
    areasForImprovement.push('Maintain a calmer, more confident tone');
  }
  if (verbal.suggestions.length) {
    feedback += ` ${verbal.suggestions.join(' ')}`;
  }
  
  const baseAnalysis = {
    score: Math.min(10, Math.max(1, Math.floor(response.length / 20) + (wordCount > 5 ? 2 : 1))),
    feedback,
    strengths,
    areasForImprovement,
    confidence: confidenceScore,
    confidenceIndicators: {
      responseLength: responseLength,
      specificExamples: hasSpecificExamples,
      structuredAnswer: hasSTARStructure,
      enthusiasm: confidenceScore,
      quantifiableResults: hasQuantifiableResults
    },
    nextQuestionType: 'behavioral',
    performanceTrend: 'stable',
    roleAlignment: responseLength < 50 ? 'low' : 'medium',
    culturalFit: responseLength < 50 ? 'low' : 'medium',
    rewriteSuggestions: {
      restructure: '',
      concise: ''
    }
  };
  
  // Add specific metrics based on interview type
  if (isFocusedInterview) {
    return {
      ...baseAnalysis,
      problem_solving: Math.min(10, Math.max(1, responseLength < 20 ? 1 : Math.floor(response.length / 25) + 2)),
      communication: Math.min(10, Math.max(1, responseLength < 20 ? 1 : Math.floor(response.length / 20) + 1)),
      depth: responseLength < 20 ? 1 : (hasSpecificExamples ? 6 : 3),
      relevance: Math.min(10, Math.max(1, responseLength < 20 ? 1 : Math.floor(response.length / 30) + 2))
    };
  }

  return baseAnalysis;
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
    const technicalQuestions = getTechnicalQuestions(setup.jobType, setup.industry, setup.experienceLevel);

    const prompt = `You are a world-class ${setup.industry} hiring manager with 20+ years of experience interviewing top talent for ${setup.jobType} roles. You're known for asking sophisticated, thought-provoking questions that reveal true capability and potential.

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

1. **SOPHISTICATION**: Create questions that go beyond basic concepts - probe for deep understanding, strategic thinking, and real-world application
2. **RELEVANCE**: Every question must be directly relevant to the ${setup.jobType} role and ${setup.industry} industry
3. **PROGRESSION**: Start with moderately challenging questions, progressively increase complexity
4. **SPECIFICITY**: Include specific scenarios, technologies, frameworks, or business contexts relevant to the role
5. **DEPTH**: Questions should require 2-3 minutes to answer properly with examples and reasoning
6. **AUTHENTICITY**: Sound like questions a real senior hiring manager would ask, not textbook examples

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

EXAMPLES OF QUESTION SOPHISTICATION:

Instead of: "Tell me about a time you led a team"
Ask: "Describe a situation where you had to lead a cross-functional team through a major change initiative while managing competing stakeholder priorities and tight deadlines. How did you ensure alignment and maintain team momentum when initial resistance emerged?"

Instead of: "How would you design a chat system?"
Ask: "You're tasked with designing a real-time messaging platform for a global enterprise with 100,000+ employees across different time zones. Walk me through your architecture decisions for handling message delivery, user presence, file sharing, and ensuring sub-200ms latency worldwide while maintaining GDPR compliance."

Create questions at this level of sophistication and specificity.

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
      console.error('Failed to parse AI response:', questionsText);
      throw new Error('Failed to parse AI-generated focused questions');
    }
  } catch (error) {
    console.error('Error generating focused questions:', error);
    throw error;
  }
};

// College Interview System
interface CollegeInterviewSetup {
  schoolType: string;
  program: string;
  major: string;
  interviewMode: 'voice' | 'text';
}

// Generate college interview questions with comprehensive university context
export const generateCollegeInterviewQuestions = async (setup: CollegeInterviewSetup): Promise<Question[]> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required');
  }

  try {
    const prompt = createCollegeInterviewPrompt(setup);
    
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
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const questionsText = data.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    console.error('Error generating college interview questions:', error);
    throw error;
  }
};

// Create comprehensive college interview prompt
const createCollegeInterviewPrompt = (setup: CollegeInterviewSetup): string => {
  const universityContext = getUniversityContext(setup.schoolType);
  const programContext = getProgramContext(setup.program, setup.major);
  const interviewContext = getCollegeInterviewContext();

  return `You are an experienced college admissions officer conducting an undergraduate admission interview for a ${setup.schoolType} institution. You specialize in ${setup.program} programs, particularly ${setup.major}.

${universityContext}

${programContext}

${interviewContext}

CANDIDATE PROFILE:
- Applying for undergraduate admission
- Intended major: ${setup.major}
- Program area: ${setup.program}
- Institution type: ${setup.schoolType}
- Interview format: ${setup.interviewMode === 'voice' ? 'Live conversational interview (spoken responses)' : 'Structured written interview (typed responses)'}

INTERVIEW OBJECTIVES:
1. Assess genuine academic passion and intellectual curiosity beyond grades
2. Evaluate personal character, resilience, and emotional maturity
3. Understand authentic motivation for this specific school/program
4. Gauge potential positive impact on campus community and culture
5. Determine values alignment and cultural fit with institutional mission
6. Explore unique perspectives, experiences, and contributions they would bring
7. Assess communication skills and ability to think on their feet

QUESTION GENERATION STRATEGY:
Create a carefully sequenced interview that builds a comprehensive candidate profile and adapts dynamically:

**OPENING (Questions 1-2)**: Warm, accessible questions that help the student relax
- Start with broad, comfortable topics (background, interests)
- Build rapport and encourage natural conversation
- Assess basic communication skills and confidence
- Begin building candidate profile: interests, background, communication style

**EXPLORATION (Questions 3-6)**: Deeper dive into key areas with adaptive questioning
- Academic passion and intellectual engagement
- Personal growth through challenges or failures
- School knowledge and authentic interest ("Why us?")
- Values and character through specific experiences
- Use Socratic questioning to probe deeper into responses
- Cross-reference earlier answers to build coherent narrative

**INSIGHT (Questions 7-8)**: Sophisticated questions requiring deep reflection
- Future vision and goal articulation
- Ethical reasoning or hypothetical scenarios
- Unique perspectives and potential contributions
- Leadership philosophy or collaborative experiences
- Challenge assumptions with thoughtful follow-ups
- Reference candidate's earlier statements to explore consistency and growth

**CLOSING (Questions 9-10)**: Personalized wrap-up and forward-looking
- What questions do they have for you?
- Final chance to share something important
- Vision for their college experience
- Provide personalized summary of strengths and growth areas
- Connect their profile to institutional fit and next steps

QUESTION CRAFTING PRINCIPLES:

**For ${setup.interviewMode === 'voice' ? 'VOICE' : 'TEXT'} Mode:**
${setup.interviewMode === 'voice' ? 
`- Use natural, conversational language as if speaking aloud
- Keep questions concise enough to remember when spoken
- Include vocal cues like "Tell me about..." or "I'm curious about..."
- Create space for follow-up questions and natural dialogue
- Consider questions that invite storytelling and personal anecdotes` :
`- Craft questions that work well for thoughtful written responses
- Allow for more complex, multi-part questions that students can re-read
- Include questions that benefit from careful reflection and detailed answers
- Structure questions to encourage comprehensive, well-organized responses`}

**Content Requirements:**
1. **Specificity Over Generic**: Avoid cliché questions like "What's your greatest weakness?"
2. **Experience-Based**: Ask for specific examples and stories, not hypotheticals
3. **School-Specific**: Include questions that show research about your institution
4. **Growth-Oriented**: Focus on learning, development, and future potential
5. **Authentic Voice**: Sound like a genuine conversation, not an interrogation
6. **Socratic Method**: Use probing, open-ended questions that challenge assumptions and encourage deep reflection
7. **Cross-Referencing**: Reference earlier responses to build coherent narrative ("Earlier you mentioned X, how does that connect to Y?")
8. **Profile Building**: Continuously update understanding of candidate's interests, values, and potential fit

**Question Types to Include (8-10 total):**
- Academic passion and intellectual curiosity (2 questions)
- Personal experiences and character development (2-3 questions)
- School knowledge and genuine fit (1-2 questions)
- Future goals and vision (1-2 questions)
- Values, ethics, or community engagement (1-2 questions)
- Unique perspective or contribution (1 question)

**Excellence Indicators:**
✓ Questions feel natural and conversational
✓ Each question reveals something different about the candidate
✓ Progressive difficulty that builds confidence
✓ Opportunities for follow-up and deeper exploration
✓ Balance between challenging and supportive
✓ Authentic to your institution's values and culture

**Avoid:**
✗ Generic questions that could apply to any school
✗ Questions with obvious "right" answers
✗ Overly personal or inappropriate topics
✗ Questions that can be answered with simple yes/no
✗ Intimidating or gotcha-style questions

TONE AND STYLE:
- Warm, curious, and genuinely interested in the student as a person
- Professional but approachable, like a favorite professor or mentor
- Intellectually engaging without being overwhelming
- Encouraging of authentic self-expression and vulnerability
- Respectful of diverse backgrounds and experiences

FORMAT: Return as a JSON array of question objects with this structure:
[
  {
    "id": "q1",
    "text": "Interview question text (natural and conversational)",
    "type": "academic|personal|school_fit|values|future_goals|community|unique_perspective",
    "difficulty": "warm_up|moderate|challenging|reflective",
    "expectedDuration": "2-3 minutes",
    "followUpHints": ["Natural follow-up question based on likely responses"]
  }
]

EXAMPLE EXCELLENT QUESTIONS:
- "What's something you've learned recently outside of school that genuinely excited you?"
- "Can you tell me about a time when you had to advocate for something you believed in?"
- "What initially drew you to [specific program/major], and how has that interest evolved?"
- "If you could design your ideal learning experience at our university, what would it look like?"

Remember: This is a college ADMISSION interview focused on discovering the authentic person behind the application. Create questions that help students share their genuine selves while demonstrating their potential to thrive at your institution.`;
};

// Get university-specific context based on school type
const getUniversityContext = (schoolType: string): string => {
  const contexts = {
    'ivy-league': `
INSTITUTIONAL CONTEXT - IVY LEAGUE/ELITE UNIVERSITY:
You represent one of the most prestigious universities in the world (Harvard, Yale, Princeton, Stanford, MIT, Columbia, UPenn, Dartmouth, Brown, Cornell, etc.). Your institution:
- Has extremely selective admissions (5-10% acceptance rate)
- Values academic excellence, leadership, and exceptional achievement
- Seeks students who will become future leaders in their fields
- Emphasizes both intellectual rigor and well-rounded development
- Has a rich history, strong alumni network, and global reputation
- Expects demonstrated excellence in academics, extracurriculars, and character
- Looks for students who can handle rigorous coursework and contribute meaningfully to campus life

ADMISSION PHILOSOPHY: "We seek students who will thrive in our challenging academic environment while contributing unique perspectives and leadership to our community."`,

    'private': `
INSTITUTIONAL CONTEXT - PRIVATE UNIVERSITY:
You represent a high-quality private institution that:
- Offers personalized education with smaller class sizes
- Values close faculty-student relationships and mentorship
- Emphasizes both academic achievement and personal development
- Has strong alumni networks and career placement
- Seeks students who align with institutional values and mission
- Focuses on creating a tight-knit community of scholars
- Balances tradition with innovation in education

ADMISSION PHILOSOPHY: "We seek students who will take advantage of our personalized educational environment and contribute to our close-knit academic community."`,

    'public': `
INSTITUTIONAL CONTEXT - PUBLIC UNIVERSITY:
You represent a respected state university that:

- Serves a diverse student body from various backgrounds
- Offers excellent value and accessibility in higher education
- Has strong programs across multiple disciplines
- Values both in-state and out-of-state contributions
- Emphasizes practical application and real-world preparation
- Seeks students who will succeed in a dynamic, diverse environment
- Balances academic excellence with affordability and accessibility

ADMISSION PHILOSOPHY: "We seek students who will thrive in our diverse, dynamic environment while taking advantage of our comprehensive academic offerings."`,

    'liberal-arts': `
INSTITUTIONAL CONTEXT - LIBERAL ARTS COLLEGE:
You represent a prestigious liberal arts institution that:
- Emphasizes critical thinking, writing, and broad intellectual exploration
- Values small class sizes and close faculty mentorship
- Seeks intellectually curious students who love learning for its own sake
- Emphasizes discussion-based learning and collaborative inquiry
- Prepares students for graduate study and leadership across fields
- Values diversity of thought and interdisciplinary connections
- Creates lifelong learners and thoughtful citizens

ADMISSION PHILOSOPHY: "We seek intellectually curious students who embrace the liberal arts tradition of broad learning and deep thinking."`,

    'community': `
INSTITUTIONAL CONTEXT - COMMUNITY COLLEGE:
You represent a community college that:
- Serves students from diverse backgrounds and life stages
- Provides accessible, affordable education and career training
- Values practical skills alongside academic preparation
- Supports student success through comprehensive services
- Prepares students for transfer to four-year institutions or immediate career entry
- Emphasizes community engagement and local partnerships
- Welcomes students with varied educational goals

ADMISSION PHILOSOPHY: "We seek students committed to their educational goals and eager to engage with our supportive learning community."`
  };

  return contexts[schoolType as keyof typeof contexts] || contexts['public'];
};

// Get program-specific context
const getProgramContext = (program: string, major: string): string => {
  const programContexts = {
    'stem': `
PROGRAM FOCUS - STEM FIELDS:
Your program seeks students who:
- Demonstrate strong analytical and problem-solving abilities
- Show genuine curiosity about scientific inquiry and mathematical reasoning
- Have experience with research, labs, or independent projects
- Can work collaboratively on complex technical problems
- Understand the real-world applications of STEM fields
- Are prepared for rigorous coursework in mathematics and sciences
- Show potential for innovation and creative thinking in technical fields

MAJOR-SPECIFIC FOCUS (${major}):
${getStemMajorContext(major)}`,

    'business': `
PROGRAM FOCUS - BUSINESS/ECONOMICS:
Your program seeks students who:
- Demonstrate leadership potential and entrepreneurial thinking
- Show understanding of global markets and economic principles
- Have experience with teamwork, communication, and project management
- Can analyze complex problems and propose practical solutions
- Understand the role of business in society and ethical considerations
- Show quantitative skills and comfort with data analysis
- Demonstrate interest in innovation and strategic thinking

MAJOR-SPECIFIC FOCUS (${major}):
${getBusinessMajorContext(major)}`,

    'liberal-arts': `
PROGRAM FOCUS - LIBERAL ARTS:
Your program seeks students who:
- Love reading, writing, and intellectual discussion
- Can think critically about complex texts and ideas
- Show curiosity about human culture, history, and society
- Demonstrate strong communication and analytical skills
- Can make connections across different fields of knowledge
- Are prepared for rigorous reading and writing requirements
- Show interest in research and independent inquiry

MAJOR-SPECIFIC FOCUS (${major}):
${getLiberalArtsMajorContext(major)}`,

    'pre-med': `
PROGRAM FOCUS - PRE-MEDICAL:
Your program seeks students who:
- Show genuine commitment to serving others through medicine
- Demonstrate strong academic preparation in sciences
- Have meaningful healthcare or service experience
- Can handle the rigor of pre-medical coursework
- Show resilience, empathy, and ethical reasoning
- Understand the challenges and responsibilities of medical careers
- Have strong interpersonal and communication skills

MAJOR-SPECIFIC FOCUS (${major}):
${getPreMedMajorContext(major)}`,

    'pre-law': `


PROGRAM FOCUS - PRE-LAW:
Your program seeks students who:
- Demonstrate strong analytical and argumentative skills
- Show interest in justice, policy, and legal reasoning
- Have excellent writing and communication abilities
- Can think critically about complex social and ethical issues
- Show leadership and advocacy experience
- Understand the role of law in society
- Are prepared for rigorous reading and analytical coursework

MAJOR-SPECIFIC FOCUS (${major}):
${getPreLawMajorContext(major)}`,

    'arts': `
PROGRAM FOCUS - ARTS/CREATIVE:
Your program seeks students who:
- Demonstrate genuine artistic talent and creative vision
- Show commitment to their craft through sustained practice
- Can articulate their artistic influences and aspirations
- Are open to experimentation and creative risk-taking
- Understand the role of arts in culture and society
- Can balance creative work with academic rigor
- Show potential for artistic growth and development

MAJOR-SPECIFIC FOCUS (${major}):
${getArtsMajorContext(major)}`,

    'undecided': `
PROGRAM FOCUS - EXPLORATORY/UNDECIDED:
Your program seeks students who:
- Show intellectual curiosity across multiple fields
- Are comfortable with exploration and self-discovery
- Demonstrate openness to new ideas and experiences
- Can articulate their learning goals and interests
- Show potential for academic success across disciplines
- Are motivated to take advantage of diverse academic opportunities
- Have some sense of their strengths and interests, even if uncertain about major

MAJOR-SPECIFIC FOCUS (${major}):
Perfect for students who want to explore different fields before declaring a major, with strong academic advising and support for discovery.`
  };

  return programContexts[program as keyof typeof programContexts] || programContexts['undecided'];
};

// Helper functions for major-specific contexts
const getStemMajorContext = (major: string): string => {
  const contexts = {
    'computer-science': 'Coding experience, understanding of technology\'s impact, problem-solving through programming',
    'engineering': 'Design thinking, understanding of engineering principles, interest in solving real-world problems',
    'mathematics': 'Abstract reasoning, proof-writing experience, appreciation for mathematical beauty and applications',
    'physics': 'Experimental curiosity, understanding of natural phenomena, comfort with mathematical modeling',
    'chemistry': 'Laboratory experience, understanding of molecular processes, interest in chemical applications',
    'biology': 'Understanding of living systems, research experience, interest in biological applications',
    'data-science': 'Statistical thinking, programming skills, understanding of data\'s role in decision-making'
  };
  return contexts[major as keyof typeof contexts] || 'Strong analytical skills and scientific curiosity';
};

const getBusinessMajorContext = (major: string): string => {
  const contexts = {
    'business-admin': 'Leadership experience, understanding of organizational dynamics, strategic thinking',
    'economics': 'Analytical thinking about markets, understanding of economic principles, quantitative skills',
    'finance': 'Understanding of financial markets, quantitative analysis, interest in investment and risk',
    'marketing': 'Creative communication, understanding of consumer behavior, digital media experience',
    'accounting': 'Attention to detail, understanding of financial systems, analytical precision',
    'entrepreneurship': 'Innovation mindset, leadership experience, understanding of business creation'
  };
  return contexts[major as keyof typeof contexts] || 'Strong analytical and leadership skills';
};

const getLiberalArtsMajorContext = (major: string): string => {
  const contexts = {
    'english': 'Love of literature, strong writing skills, critical analysis of texts',
    'history': 'Understanding of historical processes, research skills, analytical writing',
    'philosophy': 'Logical reasoning, ethical thinking, comfort with abstract concepts',
    'psychology': 'Interest in human behavior, research methodology, empathy and insight',
    'sociology': 'Understanding of social structures, research skills, interest in social justice',
    'political-science': 'Interest in governance and policy, analytical skills, understanding of political processes'
  };
  return contexts[major as keyof typeof contexts] || 'Strong critical thinking and communication skills';
};

const getPreMedMajorContext = (major: string): string => {
  const contexts = {
    'biology-premed': 'Strong foundation in life sciences, research experience, understanding of biological systems',
    'chemistry-premed': 'Understanding of chemical processes in biology, laboratory skills, analytical thinking',
    'neuroscience': 'Interest in brain function, interdisciplinary thinking, research experience',
    'biochemistry': 'Understanding of molecular biology, strong chemistry background, research orientation',
    'public-health': 'Understanding of population health, interest in prevention and policy, community service'
  };
  return contexts[major as keyof typeof contexts] || 'Strong science foundation with commitment to healthcare';
};

const getPreLawMajorContext = (major: string): string => {
  const contexts = {
    'political-science-prelaw': 'Understanding of government and legal systems, analytical writing, policy interest',
    'criminal-justice': 'Understanding of legal processes, interest in justice and fairness, analytical thinking',
    'international-relations': 'Global perspective, understanding of international law, analytical skills',
    'philosophy-prelaw': 'Logical reasoning, ethical analysis, strong argumentative skills'
  };
  return contexts[major as keyof typeof contexts] || 'Strong analytical and argumentative skills';
};

const getArtsMajorContext = (major: string): string => {
  const contexts = {
    'fine-arts': 'Artistic vision, technical skills, understanding of art history and contemporary practice',
    'graphic-design': 'Visual communication skills, understanding of design principles, technical proficiency',
    'music': 'Musical talent, understanding of theory and performance, artistic dedication',
    'theater': 'Performance skills, understanding of dramatic literature, collaborative abilities',
    'film': 'Visual storytelling, understanding of film history and technique, creative vision',
    'creative-writing': 'Writing talent, understanding of literary forms, creative voice and vision'
  };
  return contexts[major as keyof typeof contexts] || 'Creative talent and artistic dedication';
};

// Get general college interview context
const getCollegeInterviewContext = (): string => {
  return `
COLLEGE INTERVIEW PHILOSOPHY:
Your goal is to discover the authentic person behind the application while creating a comfortable environment where students can showcase their best selves. This is NOT an interrogation but a meaningful conversation about their potential and fit.

INTERVIEW BEST PRACTICES:
- Create a welcoming atmosphere that puts students at ease
- Show genuine curiosity about their experiences and perspectives
- Ask follow-up questions that demonstrate active listening
- Balance structure with natural conversation flow
- Give students time to think and formulate thoughtful responses
- Look for potential and growth mindset, not just current achievements
- Remember this is mutual evaluation - they're assessing your school too

EFFECTIVE QUESTIONING TECHNIQUES:
- Use "Tell me about..." to invite storytelling
- Ask "What was that like for you?" to encourage reflection
- Follow interesting threads: "That's fascinating - can you say more about..."
- Probe for specifics: "Can you give me a concrete example?"
- Explore learning: "What did that experience teach you?"
- Connect to future: "How do you see that playing out in college?"
- **Socratic Probing**: "What assumptions are you making here?" "How did you come to that conclusion?"
- **Cross-Reference**: "Earlier you mentioned [X], how does that relate to what you're sharing now?"
- **Challenge Gently**: "Have you ever considered an alternative perspective on that?"
- **Build Profile**: Use responses to understand candidate's values, motivations, and potential contributions

KEY EVALUATION AREAS:

**INTELLECTUAL VITALITY (25%)**
- Genuine curiosity and love of learning
- Ability to think critically and ask good questions
- Engagement with ideas beyond grade requirements
- Academic passion that goes beyond career preparation

**PERSONAL CHARACTER (25%)**
- Self-awareness and emotional maturity
- Resilience and ability to learn from failure
- Integrity and ethical reasoning
- Empathy and consideration for others

**INSTITUTIONAL FIT (20%)**
- Knowledge of and genuine interest in your specific school
- Understanding of academic programs and opportunities
- Alignment with campus culture and values
- Realistic expectations about college experience

**CONTRIBUTION POTENTIAL (20%)**
- Leadership experience and potential
- Collaborative skills and teamwork
- Unique perspectives or experiences they bring
- Initiative and ability to make positive impact

**COMMUNICATION (10%)**
- Ability to articulate thoughts clearly
- Active listening and engagement in conversation
- Appropriate depth and insight in responses
- Comfort with intellectual discussion

**ADVANCED INTERVIEWING TECHNIQUES:**

**Candidate Profile Building**: Throughout the interview, continuously build and update a mental model of the candidate:
- Core values and motivations
- Academic passions and intellectual curiosities
- Leadership style and collaborative approach
- Unique experiences and perspectives
- Growth mindset and learning orientation
- Institutional fit indicators

**Contextual Cross-Referencing**: Actively reference and connect earlier responses:
- "You mentioned earlier that [X] was meaningful to you. How does that connect to your interest in [Y]?"
- "I'm hearing themes of [pattern] throughout our conversation. Is that accurate?"
- "Building on what you shared about [previous topic], how would you apply that thinking to [new scenario]?"

**Socratic Questioning for Deep Reflection**: 
- Challenge assumptions gently: "What led you to that conclusion?"
- Explore alternative perspectives: "How might someone who disagrees with you view this?"
- Probe underlying values: "What principles guided your decision-making there?"
- Encourage metacognition: "How has your thinking about this evolved over time?"

**Personalized Interview Conclusion**:
- Summarize key strengths observed during the conversation
- Identify specific growth opportunities and next steps
- Connect candidate's profile to institutional fit and potential contributions
- Provide encouraging, constructive feedback that feels personal and valuable

QUESTION CATEGORIES & PURPOSES:

**Academic Passion Questions** - Assess genuine intellectual engagement
- "What's the most interesting thing you've learned recently?"
- "Describe a time when you disagreed with something you read or were taught"
- "What questions keep you up at night thinking?"

**Personal Growth Questions** - Evaluate character and self-awareness  
- "Tell me about a time when you failed at something important to you"
- "What's something you've changed your mind about recently?"
- "Describe a challenge that helped you grow as a person"

**School Fit Questions** - Test genuine interest and research
- "What specifically draws you to our [program/campus/community]?"
- "How do you see yourself contributing to our campus community?"
- "What questions do you have about student life here?"

**Values & Ethics Questions** - Understand moral reasoning
- "Describe a time when you had to stand up for something you believed in"
- "Tell me about a leader you admire and why"
- "How do you handle disagreement with someone you respect?"

**Future Vision Questions** - Assess goals and planning
- "Where do you see yourself making an impact in 10 years?"
- "What kind of legacy do you want to leave?"
- "How do you think college will change you as a person?"

**Red Flags to Avoid:**
- Generic responses that could apply to any school
- Focus solely on prestige or rankings
- Inability to discuss challenges or growth
- Lack of intellectual curiosity beyond grades
- Poor knowledge of the institution despite claiming interest
- Inflexibility or closed-mindedness
- Inappropriate responses or lack of maturity

**Green Flags to Celebrate:**
- Specific, thoughtful responses showing real research
- Evidence of intellectual curiosity and independent thinking
- Growth mindset and learning from experiences
- Genuine enthusiasm for learning and contribution
- Self-awareness and emotional intelligence
- Authentic voice and personality coming through
- Questions that show serious consideration of fit
`;
};

// Analyze college interview responses with AI
export const analyzeCollegeInterviewResponse = async (
  question: any,
  response: string,
  setup: any
): Promise<any> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key is required');
  }

  try {
    const responseLength = response.length;
    const wordCount = response.split(' ').length;
    const hasSpecificExamples = /(example|instance|time|when|project|case|experience)/i.test(response);
    const hasPersonalReflection = /(learned|realized|discovered|grew|changed|developed)/i.test(response);
    const showsPassion = /(excited|passionate|love|enjoy|fascinated|inspired|motivated)/i.test(response);
    const mentionsSchool = new RegExp(setup.schoolType.replace('-', '|') + '|' + setup.program + '|' + setup.major, 'i').test(response);    const prompt = `You are an experienced college admissions officer evaluating a student's response to an admission interview question. Your goal is to provide constructive, encouraging feedback that helps students improve while recognizing their strengths.

INTERVIEW CONTEXT:
- Institution Type: ${setup.schoolType}
- Program: ${setup.program}
- Major: ${setup.major}
- Question Type: ${question.type}
- Question Asked: "${question.text}"
- Interview Format: ${setup.interviewMode === 'voice' ? 'Spoken conversation' : 'Written response'}

STUDENT RESPONSE:
"${response}"

RESPONSE ANALYSIS:
- Length: ${responseLength} characters, ${wordCount} words
- Contains specific examples: ${hasSpecificExamples ? 'Yes' : 'No'}
- Shows personal reflection: ${hasPersonalReflection ? 'Yes' : 'No'}
- Demonstrates passion/enthusiasm: ${showsPassion ? 'Yes' : 'No'}
- References school/program: ${mentionsSchool ? 'Yes' : 'No'}

EVALUATION FRAMEWORK FOR COLLEGE INTERVIEWS:

**AUTHENTICITY & VOICE (30%)**
- Genuine, personal tone that feels authentic to the student
- Real experiences and honest self-reflection
- Vulnerability and willingness to share meaningful experiences
- Avoids generic or "what they want to hear" responses
- Shows unique personality and perspective

**DEPTH & INSIGHT (25%)**
- Provides specific examples and concrete details
- Demonstrates self-awareness and personal growth
- Shows ability to reflect on experiences and extract meaning
- Goes beyond surface-level responses to deeper insights
- Connects experiences to broader themes or future goals

**INTELLECTUAL ENGAGEMENT (20%)**
- Shows genuine curiosity and love of learning
- Demonstrates critical thinking and analytical skills
- Connects academic interests to real-world applications
- Shows knowledge of and interest in the specific institution/program
- Exhibits growth mindset and intellectual humility

**COMMUNICATION SKILLS (15%)**
- Clear, organized, and articulate expression
- Appropriate depth and detail for the question
- ${setup.interviewMode === 'voice' ? 'Natural conversational flow and verbal fluency' : 'Well-structured written communication'}
- Engaging storytelling that holds listener's attention
- Professional yet personable tone

**INSTITUTIONAL FIT (10%)**
- Demonstrates research and genuine interest in the school
- Shows understanding of campus culture and values
- Articulates how they would contribute to the community
- Realistic expectations about the college experience
- Alignment between their goals and institutional offerings

ADVANCED ANALYSIS TECHNIQUES:

**CANDIDATE PROFILE BUILDING:**
- Extract core values and motivations revealed in this response
- Identify unique perspectives, experiences, or backgrounds
- Note patterns in thinking style and decision-making approach
- Assess evidence of growth mindset and resilience
- Consider how their story contributes to campus diversity

**SOCRATIC EVALUATION:**
- What underlying assumptions or values guide their thinking?
- How do they handle complexity, ambiguity, or challenge?
- What questions might reveal deeper insights about their character?
- How might they respond to intellectual challenges or alternative viewpoints?
- What does their response reveal about their readiness for college-level discourse?

**CROSS-REFERENCING POTENTIAL:**
- What themes or experiences could be explored in follow-up questions?
- How does this response connect to their stated academic interests?
- What aspects of their background deserve deeper exploration?
- Where might there be opportunities to assess consistency or growth?

**COMMUNICATION SKILLS (15%)**
- Clear, organized, and articulate expression
- Appropriate depth and detail for the question
- ${setup.interviewMode === 'voice' ? 'Natural conversational flow and verbal fluency' : 'Well-structured written communication'}
- Engaging storytelling that holds listener's attention
- Professional yet personable tone

**INSTITUTIONAL FIT (10%)**
- Demonstrates research and genuine interest in the school
- Shows understanding of campus culture and values
- Articulates how they would contribute to the community
- Realistic expectations about the college experience
- Alignment between their goals and institutional offerings

SCORING GUIDELINES:
- 9-10: Exceptional response that would impress any admissions officer
- 8: Strong response that clearly demonstrates college readiness
- 7: Good response with clear strengths and minor areas for improvement
- 6: Decent response that meets expectations but lacks distinction
- 5: Average response that needs development in key areas
- 3-4: Below average response with significant areas for improvement
- 1-2: Poor response that suggests lack of preparation or fit

FEEDBACK APPROACH:
- Lead with genuine strengths and positive observations
- Provide specific, actionable suggestions for improvement
- Encourage authentic self-expression over "perfect" answers
- Connect feedback to college admissions best practices
- Maintain an encouraging, developmental tone

Return a JSON object with this structure:
{
  "score": number (1-10, calibrated for college admission standards),
  "feedback": "Encouraging, specific feedback that highlights strengths and provides actionable improvement suggestions",
  "strengths": ["Specific strength with example", "Another strength", "Third strength"],
  "areasForImprovement": ["Specific, actionable improvement suggestion", "Another improvement area"],
  "authenticity": number (1-10, how genuine and personal the response feels),
  "passion": number (1-10, level of enthusiasm and engagement shown),
  "clarity": number (1-10, how well-organized and articulate the response is),
  "specificity": number (1-10, use of concrete examples and details),
  "schoolKnowledge": number (1-10, demonstration of research and genuine interest),
  "personalGrowth": number (1-10, evidence of self-awareness and development),
  "nextQuestionSuggestion": "Natural follow-up question that builds on their response"
}

Focus on being developmental rather than purely evaluative. Help this student improve while recognizing what they're doing well.

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
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response_api.ok) {
      throw new Error(`OpenAI API error: ${response_api.status}`);
    }

    const data = await response_api.json();
    const analysisText = data.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing college response:', error);
    throw error;
  }
};

// Generate follow-up questions for college interviews
export const generateCollegeFollowUp = async (
  setup: any,
  responses: any[],
  currentResponse: string
): Promise<any> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key is required');
  }

  try {
    const conversationContext = responses.slice(-2).map((r, index) => {
      const qNum = responses.length - 1 + index;
      return `Q${qNum}: ${r.questionText || 'Previous question'}
A${qNum}: ${r.response}`;
    }).join('\n\n');    const prompt = `You are an experienced college admissions officer conducting a warm, conversational interview for a ${setup.schoolType} institution. Based on what the student just shared, craft a natural follow-up question that shows you're actively listening and genuinely interested in their story.

INTERVIEW CONTEXT:
- Institution: ${setup.schoolType} 
- Program: ${setup.program}
- Major: ${setup.major}
- Interview Format: ${setup.interviewMode === 'voice' ? 'Live conversation (spoken)' : 'Structured interview (written)'}
- Interview Stage: Mid-conversation follow-up

RECENT CONVERSATION:
${conversationContext}

STUDENT'S LATEST RESPONSE: 
"${currentResponse}"

YOUR GOAL AS INTERVIEWER:
You want to help this student share their best self while gathering insights about their potential fit and contribution to your campus community. This follow-up should feel like a natural continuation of an engaging conversation.

ADVANCED FOLLOW-UP STRATEGIES:

**Candidate Profile Building:**
- Explore themes, values, or experiences that emerged in their response
- Understand their unique perspective or background more deeply
- Assess growth mindset, resilience, and learning orientation
- Identify potential contributions to campus community

**Contextual Cross-Referencing:**
- "Earlier you mentioned [X], and now you're talking about [Y] - how do these connect?"
- "I'm noticing a theme of [pattern] in what you've shared - is that something that drives you?"
- "This reminds me of what you said about [previous topic] - can you elaborate on that connection?"

**Socratic Questioning for Deeper Insight:**
- "What led you to that realization/approach?"
- "How has your thinking about this evolved?"
- "What assumptions were you making at the time?"
- "How might someone with a different perspective view that situation?"
- "What would you do differently if faced with a similar situation now?"

**Personalized Exploration:**
- Focus on what makes this student unique and interesting
- Explore experiences that reveal character, values, or potential
- Understand their authentic motivations and aspirations
- Assess genuine fit with your institution's culture and opportunities

FOLLOW-UP QUESTION PRINCIPLES:

**Natural Conversation Flow:**
- Reference something specific they just mentioned
- Show genuine curiosity about their experience
- Use warm, engaging language ("That's fascinating..." "I'm curious about...")
- Make it feel like you're truly interested, not interrogating

**Strategic Purpose:**
- Deepen understanding of their character, values, or motivations
- Explore specific examples when they mentioned general concepts
- Assess self-awareness, growth mindset, or reflection skills
- Understand their knowledge of or fit with your institution
- Reveal leadership potential, collaborative skills, or unique perspectives

**Question Types That Work Well:**
- "That sounds like it was really meaningful - what did that experience teach you about yourself?"
- "You mentioned [specific detail] - can you tell me more about how that shaped your thinking?"
- "I'm curious about [something they said] - what was that like for you?"
- "That's interesting - how do you see that experience connecting to what you hope to do here?"
- "It sounds like that was challenging - what did you learn from navigating that?"

**For ${setup.interviewMode === 'voice' ? 'VOICE' : 'TEXT'} Mode:**
${setup.interviewMode === 'voice' ? 
`- Keep the question conversational and natural to speak aloud
- Use tone that conveys genuine interest and warmth
- Make it easy to respond to in a flowing conversation
- Include verbal cues that show active listening` :
`- Craft questions that invite thoughtful, detailed written responses
- Allow for reflection and careful consideration
- Structure for clear, organized answers`}

**Avoid:**
- Generic questions that could follow any response
- Questions that put students on the defensive
- Multiple questions packed into one
- Questions that can be answered with simple yes/no
- Anything that feels like a test rather than genuine interest

Return a JSON object:
{
  "id": "follow_up_${responses.length + 1}",
  "text": "Your natural, engaging follow-up question that builds on their response",
  "type": "follow_up", 
  "category": "Follow-up",
  "followUpPotential": true,
  "reasoning": "Brief explanation of what this follow-up aims to explore based on their response",
  "profileInsights": "Key themes, values, or unique qualities emerging from their responses",
  "preparingWrapUp": "Notes for eventual personalized summary of their strengths and potential fit"
}

Make this feel like the kind of follow-up question a caring mentor or favorite teacher would ask - genuinely interested in understanding the student better.

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
        temperature: 0.8,
        max_tokens: 400,
      }),
    });

    if (!response_api.ok) {
      throw new Error(`OpenAI API error: ${response_api.status}`);
    }

    const data = await response_api.json();
    const questionText = data.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = questionText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating college follow-up:', error);
    throw error;
  }
};