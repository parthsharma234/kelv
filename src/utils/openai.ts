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

// Store questions globally to access them by ID
let globalQuestions: Question[] = [];

export const generateInterviewQuestions = async (setup: InterviewSetup): Promise<Question[]> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key is required for AI-generated questions. Please configure your API key to use the interview platform.');
  }

  try {
    const prompt = `You are an expert ${setup.industry} hiring manager conducting a professional interview for a ${setup.experienceLevel} ${setup.jobType} position.

Create exactly an initial interview question that will start a natural, engaging conversation:

1. OPENING QUESTION: A warm, professional greeting that helps the candidate feel comfortable while gathering relevant information about their background and motivation for this specific ${setup.jobType} role in ${setup.industry}.

REQUIREMENTS:
- Questions must sound like they come from a real ${setup.industry} hiring manager
- Tailor complexity and technical depth to ${setup.experienceLevel} level
- Use natural, conversational language that flows well
- Make questions specific to ${setup.jobType} role and ${setup.industry} industry
- Avoid generic templates - make them feel authentic and purposeful
- Questions should encourage detailed, story-based responses

EXPERIENCE LEVEL GUIDELINES:
- Entry Level: Focus on potential, learning ability, and relevant projects/internships
- Mid Level: Focus on specific achievements, problem-solving, and team collaboration
- Senior Level: Focus on leadership, strategic thinking, and complex project management
- Executive Level: Focus on vision, organizational impact, and industry expertise

Return ONLY a JSON array with this exact format:
[
  {
    "id": "q1",
    "text": "Your opening question here - should be warm and engaging",
    "type": "small_talk",
    "difficulty": "easy"
  },
]

No additional text, explanations, or formatting - just the JSON array.`;

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
  aiState: AIInterviewerState,
  suggestedType?: string
): Promise<Question> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key is required for AI-generated questions');
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
    // Get the last 2 Q&A pairs for context
    const recentContext = responses.slice(-2).map((r, index) => {
      const questionNum = responses.length - 1 + index;
      return `Q${questionNum + 1}: ${getQuestionById(r.questionId)} 
A${questionNum + 1}: ${r.response}`;
    }).join('\n\n');

    const currentQuestionNumber = responses.length + 1;
    const totalQuestions = responses.length + 1;

    // Analyze what types of questions have been asked
    const questionTypesAsked = responses.map(r => {
      const question = globalQuestions.find(q => q.id === r.questionId);
      return question?.type || 'unknown';
    });

    const prompt = `You are a ${setup.industry} hiring manager continuing an interview for a ${setup.experienceLevel} ${setup.jobType} position.

INTERVIEW CONTEXT:
- Current question: #${currentQuestionNumber}
- Total questions asked so far: ${totalQuestions}
- Target: 8-12 total questions
- Experience level: ${setup.experienceLevel}
- Role: ${setup.jobType}
- Industry: ${setup.industry}
- Question types already covered: ${questionTypesAsked.join(', ')}

RECENT CONVERSATION:
${recentContext}

INSTRUCTIONS:
Generate the next interview question that:
1. Flows naturally from the candidate's previous responses
2. Explores NEW competencies not yet thoroughly covered
3. Is appropriate for a ${setup.experienceLevel} ${setup.jobType} candidate in ${setup.industry}
4. Sounds like a real question a hiring manager would ask
5. ${suggestedType ? `Focuses on ${suggestedType} aspects` : 'Covers unexplored areas relevant to the role'}
6. Builds on or follows up on interesting points from previous answers

QUESTION TYPES TO VARY (choose what hasn't been covered much):
- behavioral: Past experience and situations using STAR method
- technical: Role-specific skills, tools, and knowledge for ${setup.jobType}
- situational: Hypothetical scenarios relevant to ${setup.industry}
- follow_up: Deeper dive into previous answers or clarifications

DIFFICULTY LEVELS:
- easy: Basic questions, relationship building
- medium: Standard interview questions requiring examples
- hard: Complex scenarios, strategic thinking, leadership challenges

INDUSTRY-SPECIFIC FOCUS FOR ${setup.industry}:
Make sure the question is relevant to current ${setup.industry} challenges and ${setup.jobType} responsibilities.

Return ONLY this JSON format:
{
  "id": "q${currentQuestionNumber}",
  "text": "Your natural, conversational question here that a real hiring manager would ask",
  "type": "behavioral|technical|situational|follow_up",
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
        temperature: 0.9,
        max_tokens: 500,
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
    const prompt = `You are an expert ${setup.industry} hiring manager analyzing a candidate's response for a ${setup.experienceLevel} ${setup.jobType} position.

QUESTION ASKED: ${question.text}
CANDIDATE RESPONSE: ${response}

CONTEXT:
- Position: ${setup.jobType}
- Industry: ${setup.industry}
- Experience Level: ${setup.experienceLevel}
- Question Type: ${question.type}

Analyze this response and provide detailed, constructive feedback as JSON:

{
  "score": 1-10,
  "feedback": "Specific, actionable feedback focusing on content quality, structure, and relevance to the ${setup.jobType} role",
  "strengths": ["specific strength 1", "specific strength 2"],
  "areasForImprovement": ["specific improvement area 1", "specific improvement area 2"],
  "confidenceIndicators": {
    "responseLength": ${response.length},
    "specificExamples": true/false,
    "structuredAnswer": true/false,
    "enthusiasm": 1-10
  },
  "nextQuestionType": "behavioral|technical|situational|follow_up"
}

SCORING CRITERIA FOR ${setup.experienceLevel} LEVEL:
- 9-10: Exceptional answer with specific examples, clear structure, highly relevant to ${setup.jobType}
- 7-8: Strong answer with good examples and clear relevance to the role
- 5-6: Adequate answer but missing depth, examples, or role relevance
- 3-4: Weak answer, vague, or not well-suited to ${setup.experienceLevel} level
- 1-2: Poor answer, very brief, irrelevant, or inappropriate for the role

Focus on:
- Relevance to ${setup.jobType} role and ${setup.industry} industry
- Use of specific examples and quantifiable results
- Communication clarity and professional structure
- Demonstration of skills expected at ${setup.experienceLevel} level
- Evidence of understanding ${setup.industry} challenges`;

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
        max_tokens: 600,
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
        voice: 'echo', // Professional and clear voice
        speed: 0.9, // Slightly slower for better clarity
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

// Helper functions
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

const getQuestionById = (questionId: string): string => {
  const question = globalQuestions.find(q => q.id === questionId);
  return question?.text || "Previous question";
};

// Export function to update global questions
export const updateGlobalQuestions = (questions: Question[]) => {
  globalQuestions = [...questions];
};