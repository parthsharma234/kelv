import { InterviewSetup, Question, InterviewResponse, AIInterviewerState } from '../types/interview';

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
    const speechRate = (wordCount / duration) * 60; // words per minute
    
    // Filler word detection
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically', 'literally', 'right'];
    const fillerCount = words.filter(word => 
      fillerWords.includes(word.replace(/[.,!?]/g, ''))
    ).length;
    
    // Repetition detection
    let repetitions = 0;
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1]) {
        repetitions++;
      }
    }
    
    // Pause analysis (estimate from speech rate)
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
    
    // Voice confidence based on multiple factors
    const energyScore = Math.min(100, rms * 2000);
    const rateScore = Math.max(0, 100 - Math.abs(speechRate - 150) * 2);
    const fillerPenalty = Math.min(50, fillerCount * 10);
    const voiceConfidence = Math.max(0, (energyScore + rateScore - fillerPenalty) / 2);
    
    // Fluency score
    const fluencyScore = Math.max(0, 100 - (fillerCount * 8) - (repetitions * 12) - (pauseRatio * 30));
    
    // Pace consistency (simplified)
    const paceConsistency = Math.max(0, 100 - Math.abs(speechRate - 150));
    
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
      clarity: Math.round(100 - (fillerCount / wordCount) * 100),
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

export const generateInterviewQuestions = async (setup: InterviewSetup): Promise<Question[]> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return getFallbackQuestions(setup);
  }

  try {
    const prompt = `Generate 2 initial interview questions for a ${setup.experienceLevel} ${setup.jobType} position in ${setup.industry}. 

Start with:
1. One small talk/warm-up question to help the candidate feel comfortable
2. One behavioral question using the STAR method

Format as JSON array with objects containing: id, text, type, difficulty.
Types: small_talk, behavioral, technical, situational
Difficulties: easy, medium, hard

Make questions realistic and industry-appropriate.`;

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const questionsText = data.choices[0].message.content;
    
    try {
      const questions = JSON.parse(questionsText);
      return Array.isArray(questions) ? questions : getFallbackQuestions(setup);
    } catch {
      return getFallbackQuestions(setup);
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    return getFallbackQuestions(setup);
  }
};

export const generateNextQuestion = async (
  setup: InterviewSetup,
  responses: InterviewResponse[],
  aiState: AIInterviewerState,
  suggestedType?: string
): Promise<Question> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return getFallbackNextQuestion(responses.length);
  }

  // Determine if interview should end (8-12 questions based on performance)
  const shouldEnd = responses.length >= 8 && (
    responses.length >= 12 || 
    (responses.length >= 10 && getAverageScore(responses) < 6)
  );

  if (shouldEnd) {
    throw new Error('INTERVIEW_COMPLETE');
  }

  try {
    const lastResponse = responses[responses.length - 1];
    const conversationContext = responses.slice(-2).map(r => 
      `Q: ${getQuestionText(r.questionId)} A: ${r.response}`
    ).join('\n');

    const prompt = `You are conducting an interview for a ${setup.experienceLevel} ${setup.jobType} in ${setup.industry}.

Current conversation context:
${conversationContext}

Interview progress: ${responses.length + 1} questions asked
Target: 8-12 questions total

Generate the next question that:
1. Flows naturally from the conversation
2. ${suggestedType ? `Focuses on ${suggestedType} aspects` : 'Explores different competencies'}
3. Adapts to the candidate's responses
4. Maintains professional interview flow

Question types to vary: behavioral, technical, situational, follow_up
Difficulties: easy, medium, hard

Return JSON: {"id": "q${responses.length + 2}", "text": "question", "type": "type", "difficulty": "difficulty"}`;

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
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const questionText = data.choices[0].message.content;
    
    try {
      const question = JSON.parse(questionText);
      return question;
    } catch {
      return getFallbackNextQuestion(responses.length);
    }
  } catch (error) {
    console.error('Error generating next question:', error);
    if (error instanceof Error && error.message === 'INTERVIEW_COMPLETE') {
      throw error;
    }
    return getFallbackNextQuestion(responses.length);
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
    const prompt = `Analyze this interview response for a ${setup.experienceLevel} ${setup.jobType} position:

Question: ${question.text}
Response: ${response}

Provide analysis as JSON:
{
  "score": 1-10,
  "feedback": "constructive feedback",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "confidenceIndicators": {
    "responseLength": ${response.length},
    "specificExamples": boolean,
    "structuredAnswer": boolean,
    "enthusiasm": 1-10
  },
  "nextQuestionType": "suggested_type"
}

Focus on content quality, structure, and relevance to the role.`;

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
        max_tokens: 500,
      }),
    });

    if (!response_api.ok) {
      throw new Error(`OpenAI API error: ${response_api.status}`);
    }

    const data = await response_api.json();
    const analysisText = data.choices[0].message.content;
    
    try {
      return JSON.parse(analysisText);
    } catch {
      return getFallbackAnalysis(response);
    }
  } catch (error) {
    console.error('Error analyzing response:', error);
    return getFallbackAnalysis(response);
  }
};

export const synthesizeSpeech = async (text: string): Promise<HTMLAudioElement | null> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return audio;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    return null;
  }
};

// Fallback functions
const getFallbackQuestions = (setup: InterviewSetup): Question[] => [
  {
    id: 'q1',
    text: `Hi! Thanks for taking the time to interview with us today. To start off, could you tell me a bit about yourself and what drew you to apply for this ${setup.jobType} position?`,
    type: 'small_talk',
    difficulty: 'easy'
  },
  {
    id: 'q2',
    text: `Can you describe a challenging project you worked on and how you overcame the obstacles you faced?`,
    type: 'behavioral',
    difficulty: 'medium'
  }
];

const getFallbackNextQuestion = (questionCount: number): Question => {
  const questions = [
    {
      id: `q${questionCount + 1}`,
      text: "What motivates you in your work, and how do you stay engaged during challenging periods?",
      type: 'behavioral',
      difficulty: 'medium'
    },
    {
      id: `q${questionCount + 1}`,
      text: "Describe a time when you had to work with a difficult team member. How did you handle the situation?",
      type: 'behavioral',
      difficulty: 'medium'
    },
    {
      id: `q${questionCount + 1}`,
      text: "Where do you see yourself in 5 years, and how does this role fit into your career goals?",
      type: 'situational',
      difficulty: 'easy'
    }
  ];
  
  return questions[questionCount % questions.length];
};

const getFallbackAnalysis = (response: string) => ({
  score: Math.min(10, Math.max(1, Math.floor(response.length / 20) + 3)),
  feedback: "Good response! Try to include more specific examples to strengthen your answer.",
  strengths: ["Clear communication", "Relevant experience"],
  areasForImprovement: ["Add specific examples", "Provide more detail"],
  confidenceIndicators: {
    responseLength: response.length,
    specificExamples: response.includes('example') || response.includes('time'),
    structuredAnswer: response.length > 50,
    enthusiasm: 7
  },
  nextQuestionType: 'behavioral'
});

const getAverageScore = (responses: InterviewResponse[]): number => {
  const scores = responses.map(r => r.analysis?.score || 5);
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const getQuestionText = (questionId: string): string => {
  // This would need to be implemented to get question text by ID
  return "Previous question";
};