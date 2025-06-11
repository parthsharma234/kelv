import { InterviewSetup, Question, AIInterviewerState } from '../types/interview';

// OpenAI API configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
const OPENAI_STT_URL = 'https://api.openai.com/v1/audio/transcriptions';

// Mock function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Question type classifications
export const QUESTION_TYPES = {
  SMALL_TALK: 'small_talk',
  BEHAVIORAL: 'behavioral', 
  TECHNICAL: 'technical',
  SITUATIONAL: 'situational',
  FOLLOW_UP: 'follow_up',
  CONVERSATIONAL: 'conversational'
} as const;

// Small talk questions to start the interview
const SMALL_TALK_QUESTIONS = [
  {
    id: 'st1',
    text: "Hi there! Thanks for joining me today. How are you feeling about this interview?",
    type: 'small_talk' as const,
    category: 'greeting',
    difficulty: 'easy' as const
  },
  {
    id: 'st2', 
    text: "Before we dive into the main questions, tell me a bit about what drew you to this field?",
    type: 'small_talk' as const,
    category: 'motivation',
    difficulty: 'easy' as const
  },
  {
    id: 'st3',
    text: "I see you're interested in working in {industry}. What's been the most exciting development in this space recently, in your opinion?",
    type: 'small_talk' as const,
    category: 'industry_interest',
    difficulty: 'easy' as const
  }
];

// Helper function to extract JSON from markdown code blocks
const extractJsonFromMarkdown = (content: string): string => {
  // Check if content is wrapped in markdown code blocks
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = content.match(jsonBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no markdown blocks found, return the content as-is
  return content.trim();
};

// Text-to-Speech using OpenAI TTS
export const synthesizeSpeech = async (text: string): Promise<HTMLAudioElement | null> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    // Simulate API delay for demo mode
    await delay(800);
    return null;
  }

  try {
    const response = await fetch(OPENAI_TTS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy', // Professional, friendly voice
        response_format: 'mp3',
        speed: 1.0
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Clean up the URL when audio finishes playing
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(audioUrl);
    });

    return audio;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    // Fallback to no audio
    await delay(800);
    return null;
  }
};

// Optimized Speech-to-Text using OpenAI Whisper
export const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    // Demo mode - return null to indicate no transcription
    return null;
  }

  // Validate audio blob
  if (!audioBlob || audioBlob.size === 0) {
    console.warn('Invalid or empty audio blob');
    return null;
  }

  // Check if audio blob is too small (less than 0.5 seconds of audio)
  if (audioBlob.size < 500) {
    console.warn('Audio blob too small for meaningful transcription');
    return null;
  }

  try {
    // Validate API key format
    if (!OPENAI_API_KEY.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    // Prepare form data with optimized settings
    const formData = new FormData();
    
    // Ensure proper file naming and type
    const audioFile = new File([audioBlob], 'recording.webm', { 
      type: 'audio/webm;codecs=opus' 
    });
    
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');
    formData.append('temperature', '0.1'); // Lower temperature for more accurate transcription
    formData.append('prompt', 'This is an interview response. Please transcribe accurately including any filler words or hesitations.');

    const response = await fetch(OPENAI_STT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI STT API Error:', errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid or expired OpenAI API key');
      } else if (response.status === 400) {
        throw new Error('Bad request - check audio format and API key');
      } else {
        throw new Error(`STT API error: ${response.status}`);
      }
    }

    const data = await response.json();
    const transcription = data.text?.trim() || '';
    
    // Return null if transcription is too short or empty
    if (transcription.length < 2) {
      console.warn('Transcription too short or empty');
      return null;
    }
    
    return transcription;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
};

// Enhanced Audio recording utilities with better error handling
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;

  async startRecording(): Promise<boolean> {
    try {
      // Request audio with optimized settings for speech
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for speech recognition
          channelCount: 1 // Mono audio
        } 
      });
      
      // Use the best available codec
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }
      
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      this.startTime = Date.now();
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      // Collect data more frequently for better quality
      this.mediaRecorder.start(250); // Collect data every 250ms
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

      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000; // Duration in seconds
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        });
        this.cleanup();
        resolve({ audioBlob, duration });
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.startTime = 0;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

// Comprehensive speech analysis function
export const analyzeSpeechComprehensively = async (
  audioBlob: Blob,
  transcription: string,
  duration: number
): Promise<any> => {
  // This would integrate with the speech analysis utilities
  // For now, return basic metrics based on transcription
  const words = transcription.split(/\s+/).filter(w => w.length > 0);
  const speechRate = (words.length / duration) * 60; // WPM
  
  return {
    timing: {
      totalDuration: duration,
      speechRate: speechRate,
      wordCount: words.length
    },
    confidence: {
      overallConfidence: Math.min(100, Math.max(30, speechRate * 0.5 + words.length * 2))
    },
    fluency: {
      fluencyScore: Math.min(100, Math.max(40, 100 - (transcription.match(/\b(um|uh|like)\b/gi)?.length || 0) * 10))
    },
    voice: {
      voiceStability: Math.random() * 30 + 70 // Placeholder
    }
  };
};

// Generate conversational responses to candidate statements
export const generateConversationalResponse = async (
  candidateResponse: string,
  setup: InterviewSetup,
  previousResponses: any[]
): Promise<Question> => {
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return generateMockConversationalResponse(candidateResponse, setup, previousResponses);
  }

  try {
    const prompt = `
You are conducting a ${setup.jobType} interview for a ${setup.experienceLevel} candidate in ${setup.industry}.

The candidate just said: "${candidateResponse}"

Generate a natural, conversational response that:
1. ACKNOWLEDGES what they said specifically (reference their exact words)
2. Shows empathy or understanding for their situation
3. Transitions naturally into a relevant follow-up question
4. Maintains a warm, professional tone
5. Builds rapport while gathering more information

Examples of good conversational responses:
- "I can understand staying up all night - that shows real dedication! That kind of preparation tells me a lot about your work ethic. Speaking of dedication, can you tell me about a time when you went above and beyond on a project?"
- "That's really interesting that you mentioned [specific thing they said]. I'd love to hear more about that experience. What was the most challenging part of [what they mentioned]?"

Make it feel like a real conversation, not a robotic question sequence.

Respond with JSON:
{
  "question": "The conversational response and follow-up question",
  "type": "conversational",
  "category": "natural_flow",
  "difficulty": "medium",
  "reasoning": "Why this response builds on what they said"
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interviewer who creates natural, flowing conversations. You always acknowledge what candidates say and respond with empathy before transitioning to relevant questions. You make interviews feel like genuine conversations, not interrogations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const jsonContent = extractJsonFromMarkdown(content);
    const questionData = JSON.parse(jsonContent);
    
    return {
      id: `conv_${Date.now()}`,
      text: questionData.question,
      type: 'conversational',
      category: questionData.category,
      difficulty: questionData.difficulty
    };

  } catch (error) {
    console.error('Error generating conversational response:', error);
    return generateMockConversationalResponse(candidateResponse, setup, previousResponses);
  }
};

// Mock conversational responses
const generateMockConversationalResponse = (
  candidateResponse: string,
  setup: InterviewSetup,
  previousResponses: any[]
): Question => {
  const response = candidateResponse.toLowerCase();
  
  // Detect specific mentions and respond conversationally
  if (response.includes('stayed up') || response.includes('all night') || response.includes('nervous') || response.includes('anxious')) {
    return {
      id: 'conv_dedication',
      text: "I can really appreciate that level of preparation - staying up all night shows real dedication! That kind of commitment tells me a lot about your work ethic. Speaking of going the extra mile, can you tell me about a time when you went above and beyond on a project or task?",
      type: 'conversational',
      category: 'dedication_follow_up',
      difficulty: 'medium'
    };
  }
  
  if (response.includes('excited') || response.includes('passionate') || response.includes('love')) {
    return {
      id: 'conv_passion',
      text: "That enthusiasm really comes through! It's great to see someone who's genuinely passionate about their work. I'd love to hear more about what specifically excites you most about this field - what got you started on this path?",
      type: 'conversational',
      category: 'passion_follow_up',
      difficulty: 'easy'
    };
  }
  
  if (response.includes('challenging') || response.includes('difficult') || response.includes('struggle')) {
    return {
      id: 'conv_challenges',
      text: "I appreciate your honesty about the challenges - that shows good self-awareness. Every field has its difficulties, and how we handle them often defines our growth. Can you walk me through a specific challenging situation you've faced and how you approached solving it?",
      type: 'conversational',
      category: 'challenge_follow_up',
      difficulty: 'medium'
    };
  }
  
  if (response.includes('team') || response.includes('collaborate') || response.includes('work with others')) {
    return {
      id: 'conv_teamwork',
      text: "That's wonderful that you mentioned teamwork - collaboration is so important in most roles today. I'm curious about your experience working with different types of people. Can you tell me about a time when you had to work with someone who had a very different working style than you?",
      type: 'conversational',
      category: 'teamwork_follow_up',
      difficulty: 'medium'
    };
  }
  
  if (response.includes('learn') || response.includes('growth') || response.includes('develop')) {
    return {
      id: 'conv_learning',
      text: "I love hearing about people who are focused on learning and growth - that's such a valuable mindset! Continuous learning is crucial in today's fast-paced world. What's something new you've learned recently that you're particularly proud of?",
      type: 'conversational',
      category: 'learning_follow_up',
      difficulty: 'easy'
    };
  }
  
  // Default conversational response
  return {
    id: 'conv_general',
    text: "That's really interesting! I can tell you've put thought into this. Building on what you just shared, I'd love to dive a bit deeper. Can you give me a specific example that illustrates what you just mentioned?",
    type: 'conversational',
    category: 'general_follow_up',
    difficulty: 'medium'
  };
};

// Generate dynamic questions using GPT-4o
export const generateDynamicQuestion = async (
  setup: InterviewSetup,
  previousResponses: any[],
  aiState: AIInterviewerState,
  questionType: string
): Promise<Question> => {
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    // Fallback to mock questions if no API key
    return generateMockQuestion(setup, questionType, previousResponses);
  }

  try {
    const prompt = buildPrompt(setup, previousResponses, aiState, questionType);
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI interviewer conducting a comprehensive ${setup.jobType} interview for a ${setup.experienceLevel} candidate in the ${setup.industry} industry. 

CRITICAL INTERVIEW GUIDELINES:
- Create NATURAL, CONVERSATIONAL interviews that feel like real human interactions
- ALWAYS acknowledge and respond to what candidates actually say before asking new questions
- Show empathy, understanding, and genuine interest in their responses
- Build rapport through conversational bridges and transitions
- Conduct THOROUGH interviews with 8-12 questions minimum covering all competency areas
- Ask SPECIFIC follow-up questions that reference their exact words and dig deeper
- Adapt your personality and tone based on how they're responding

CONVERSATIONAL FLOW:
- Reference specific things they mentioned: "You mentioned X, that's really interesting..."
- Show empathy: "I can understand that..." "That must have been challenging..."
- Build bridges: "That reminds me of..." "Building on what you said..."
- Use natural transitions: "Speaking of..." "That's a great example, and it makes me curious about..."

QUESTION TYPES TO COVER:
1. Small talk and rapport building (1-2 questions)
2. Background and motivation (2-3 questions)  
3. Behavioral/STAR method questions (3-4 questions)
4. Technical/role-specific questions (2-4 questions)
5. Situational/problem-solving (1-2 questions)
6. Conversational follow-ups based on their specific responses

Always respond with a JSON object:
{
  "question": "The conversational interview question with natural acknowledgment",
  "type": "question_type",
  "category": "specific_category", 
  "difficulty": "easy|medium|hard",
  "reasoning": "Why this question builds naturally on the conversation"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Extract JSON from markdown code blocks if present
    const jsonContent = extractJsonFromMarkdown(content);
    const questionData = JSON.parse(jsonContent);
    
    return {
      id: `ai_${Date.now()}`,
      text: questionData.question,
      type: questionData.type,
      category: questionData.category,
      difficulty: questionData.difficulty
    };

  } catch (error) {
    console.error('Error generating dynamic question:', error);
    // Fallback to mock question
    return generateMockQuestion(setup, questionType, previousResponses);
  }
};

const buildPrompt = (
  setup: InterviewSetup,
  previousResponses: any[],
  aiState: AIInterviewerState,
  questionType: string
): string => {
  let prompt = `Generate a ${questionType} interview question for a ${setup.jobType} position in ${setup.industry} for a ${setup.experienceLevel} candidate.\n\n`;
  
  // Add comprehensive interview context
  prompt += `INTERVIEW PROGRESS: Question ${previousResponses.length + 1} of planned 8-12 questions\n\n`;
  
  if (previousResponses.length > 0) {
    prompt += `CONVERSATION HISTORY AND CONTEXT:\n`;
    previousResponses.forEach((response, index) => {
      const score = response.analysis?.score || 0;
      const confidence = response.analysis?.confidenceIndicators?.enthusiasm || 5;
      prompt += `Q${index + 1}: "${response.questionText || 'Previous question'}"\n`;
      prompt += `Their response: "${response.response}"\n`;
      prompt += `Performance: ${score}/10, Confidence: ${confidence}/10\n`;
      prompt += `Feedback: ${response.analysis?.feedback || 'No feedback'}\n\n`;
    });
    
    // Get the most recent response for conversational context
    const lastResponse = previousResponses[previousResponses.length - 1];
    prompt += `MOST RECENT RESPONSE TO ACKNOWLEDGE: "${lastResponse.response}"\n`;
    prompt += `IMPORTANT: Reference something specific from their last response to create natural conversation flow.\n\n`;
    
    // Calculate performance metrics
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    prompt += `PERFORMANCE ANALYSIS:\n`;
    prompt += `- Average performance: ${avgScore.toFixed(1)}/10\n`;
    prompt += `- Total questions asked: ${previousResponses.length}\n`;
    prompt += `- Focus areas: ${aiState.focusAreas.join(', ') || 'General interview skills'}\n`;
    prompt += `- Question flow: ${aiState.questionFlow}\n\n`;
  }

  // Specific instructions based on question type
  if (questionType === 'small_talk') {
    prompt += `SMALL TALK INSTRUCTIONS:\n`;
    prompt += `Generate a warm, engaging question to build rapport and help the candidate feel comfortable.\n`;
    prompt += `Keep it professional but friendly. This should ease them into the interview.\n`;
  } 
  else if (questionType === 'conversational') {
    const lastResponse = previousResponses[previousResponses.length - 1];
    if (lastResponse) {
      prompt += `CONVERSATIONAL RESPONSE INSTRUCTIONS:\n`;
      prompt += `The candidate just said: "${lastResponse.response}"\n`;
      prompt += `Create a natural, conversational response that:\n`;
      prompt += `- Acknowledges something specific they mentioned\n`;
      prompt += `- Shows understanding or empathy for their situation\n`;
      prompt += `- Transitions smoothly into a relevant follow-up question\n`;
      prompt += `- Feels like a natural conversation, not an interrogation\n`;
      prompt += `- References their exact words when possible\n\n`;
    }
  }
  else if (questionType === 'follow_up') {
    const lastResponse = previousResponses[previousResponses.length - 1];
    if (lastResponse) {
      prompt += `FOLLOW-UP INSTRUCTIONS:\n`;
      prompt += `The candidate just said: "${lastResponse.response}"\n`;
      prompt += `Generate a specific follow-up question that:\n`;
      prompt += `- References something specific they mentioned in their response\n`;
      prompt += `- Asks for more details, examples, or clarification about what they said\n`;
      prompt += `- Digs deeper into their experience, process, or thinking\n`;
      prompt += `- Uses conversational phrases like "You mentioned..." or "That's interesting, tell me more about..." or "I'm curious about..."\n`;
      prompt += `- Builds directly on their actual words and content\n`;
      prompt += `- Shows you were actively listening to their response\n\n`;
      prompt += `Their performance on the last question was ${lastResponse.analysis?.score || 0}/10.\n`;
      if (lastResponse.analysis?.score < 6) {
        prompt += `Since they struggled, help them succeed by asking a more specific or easier follow-up that builds their confidence.\n`;
      } else {
        prompt += `Since they did well, you can dig deeper or ask for more complex details.\n`;
      }
    }
  }
  else if (questionType === 'behavioral') {
    prompt += `BEHAVIORAL QUESTION INSTRUCTIONS:\n`;
    prompt += `Generate a behavioral question using the STAR method framework.\n`;
    prompt += `Focus on: leadership, teamwork, problem-solving, conflict resolution, or achievement.\n`;
    prompt += `Adjust difficulty based on their experience level and previous performance.\n`;
    if (previousResponses.length > 0) {
      const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
      const lastResponse = previousResponses[previousResponses.length - 1];
      prompt += `Start with a conversational acknowledgment of their previous response: "${lastResponse.response}"\n`;
      if (avgScore < 6) {
        prompt += `Make this question more straightforward since they've been struggling.\n`;
      } else if (avgScore >= 8) {
        prompt += `Make this question more challenging since they're performing well.\n`;
      }
    }
  }
  else if (questionType === 'technical') {
    prompt += `TECHNICAL QUESTION INSTRUCTIONS:\n`;
    prompt += `Generate a technical question relevant to the ${setup.jobType} role.\n`;
    prompt += `Adjust complexity based on their experience level (${setup.experienceLevel}) and previous responses.\n`;
    prompt += `Focus on practical skills, problem-solving, or industry knowledge.\n`;
    if (previousResponses.length > 0) {
      const lastResponse = previousResponses[previousResponses.length - 1];
      prompt += `Create a natural transition from their previous response: "${lastResponse.response}"\n`;
    }
  }
  else if (questionType === 'situational') {
    prompt += `SITUATIONAL QUESTION INSTRUCTIONS:\n`;
    prompt += `Generate a hypothetical scenario question relevant to the role.\n`;
    prompt += `Present a realistic workplace situation they might encounter.\n`;
    prompt += `Ask how they would handle it, focusing on their thought process and approach.\n`;
    if (previousResponses.length > 0) {
      const lastResponse = previousResponses[previousResponses.length - 1];
      prompt += `Build naturally from their previous response: "${lastResponse.response}"\n`;
    }
  }

  // Interview conclusion logic - be more deliberate about when to end
  if (previousResponses.length >= 7) {
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    prompt += `\nINTERVIEW CONCLUSION CONSIDERATION:\n`;
    prompt += `We've asked ${previousResponses.length} questions with average score ${avgScore.toFixed(1)}/10.\n`;
    
    // Only suggest conclusion if we've covered enough ground AND performance is clear
    if (previousResponses.length >= 10 || (previousResponses.length >= 8 && (avgScore >= 8 || avgScore <= 4))) {
      prompt += `Consider if this should be a concluding question that wraps up the interview naturally.\n`;
      prompt += `If concluding, make it a final assessment question or ask about their questions for us.\n`;
    } else {
      prompt += `Continue the interview - we need more comprehensive coverage of their abilities.\n`;
      prompt += `Focus on areas we haven't fully explored yet.\n`;
    }
  } else {
    prompt += `\nCONTINUE INTERVIEW: We need more questions to thoroughly assess the candidate.\n`;
    prompt += `Ensure we cover all major competency areas before concluding.\n`;
  }

  return prompt;
};

// Fallback mock question generator
const generateMockQuestion = (
  setup: InterviewSetup,
  questionType: string,
  previousResponses: any[]
): Question => {
  
  if (questionType === 'small_talk') {
    const randomSmallTalk = SMALL_TALK_QUESTIONS[Math.floor(Math.random() * SMALL_TALK_QUESTIONS.length)];
    return {
      ...randomSmallTalk,
      text: randomSmallTalk.text.replace('{industry}', setup.industry)
    };
  }

  // For conversational responses, acknowledge what they said
  if (questionType === 'conversational' && previousResponses.length > 0) {
    const lastResponse = previousResponses[previousResponses.length - 1];
    return generateMockConversationalResponse(lastResponse.response, setup, previousResponses);
  }

  // For follow-up questions, reference the last response
  if (questionType === 'follow_up' && previousResponses.length > 0) {
    const lastResponse = previousResponses[previousResponses.length - 1];
    const responseText = lastResponse.response.toLowerCase();
    
    // Generate contextual follow-ups based on what they mentioned
    if (responseText.includes('stayed up') || responseText.includes('all night') || responseText.includes('nervous')) {
      return {
        id: 'followup_dedication',
        text: `I really appreciate that level of preparation - staying up all night shows real dedication! That kind of commitment tells me a lot about your work ethic. Speaking of going the extra mile, can you tell me about a time when you went above and beyond on a project?`,
        type: 'follow_up',
        category: 'dedication_follow_up',
        difficulty: 'medium'
      };
    } else if (responseText.includes('project') || responseText.includes('built') || responseText.includes('developed')) {
      return {
        id: 'followup_project',
        text: `That's really interesting that you mentioned working on a project. I'd love to hear more about that experience. Can you walk me through the specific technologies you used and any challenges you encountered during development?`,
        type: 'follow_up',
        category: 'project_details',
        difficulty: 'medium'
      };
    } else if (responseText.includes('team') || responseText.includes('collaborate')) {
      return {
        id: 'followup_team',
        text: `I love that you brought up teamwork - collaboration is so important in most roles today. Tell me more about your role in that team and how you handled any disagreements or conflicts that arose.`,
        type: 'follow_up',
        category: 'teamwork_details',
        difficulty: 'medium'
      };
    } else if (responseText.includes('challenge') || responseText.includes('difficult') || responseText.includes('problem')) {
      return {
        id: 'followup_challenge',
        text: `I appreciate your honesty about the challenges - that shows good self-awareness. Can you break down your specific approach to solving it and what you learned from that experience?`,
        type: 'follow_up',
        category: 'problem_solving_details',
        difficulty: 'medium'
      };
    } else {
      return {
        id: 'followup_general',
        text: `That's really interesting! I can tell you've put thought into this. Building on what you just shared, can you give me a specific example that illustrates what you just mentioned?`,
        type: 'follow_up',
        category: 'elaboration',
        difficulty: 'medium'
      };
    }
  }

  // Determine difficulty based on previous performance
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (previousResponses.length > 0) {
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    if (avgScore < 6) difficulty = 'easy';
    else if (avgScore >= 8) difficulty = 'hard';
  }

  // Add conversational transitions to behavioral questions
  if (questionType === 'behavioral' && previousResponses.length > 0) {
    const lastResponse = previousResponses[previousResponses.length - 1];
    const responseText = lastResponse.response.toLowerCase();
    
    if (responseText.includes('team') || responseText.includes('collaborate')) {
      return {
        id: 'behavioral_teamwork_transition',
        text: `That's great that you mentioned teamwork! Since collaboration seems important to you, I'd love to hear about a specific time when you had to work with a difficult team member. How did you handle that situation?`,
        type: 'behavioral',
        category: 'teamwork_transition',
        difficulty: difficulty
      };
    } else if (responseText.includes('learn') || responseText.includes('growth')) {
      return {
        id: 'behavioral_learning_transition',
        text: `I love hearing about people focused on learning and growth! That mindset is so valuable. Can you tell me about a time when you had to learn something completely new under pressure? How did you approach it?`,
        type: 'behavioral',
        category: 'learning_transition',
        difficulty: difficulty
      };
    }
  }

  // Comprehensive mock questions by industry and type
  const mockQuestions: Record<string, Record<string, Record<string, Question[]>>> = {
    'Technology': {
      'behavioral': {
        'easy': [
          {
            id: 'tech_beh_easy_1',
            text: 'Tell me about a time when you had to learn a new technology or programming language. How did you approach it?',
            type: 'behavioral',
            category: 'learning',
            difficulty: 'easy'
          },
          {
            id: 'tech_beh_easy_2',
            text: 'Describe a project you worked on that you\'re particularly proud of. What made it special?',
            type: 'behavioral',
            category: 'achievement',
            difficulty: 'easy'
          },
          {
            id: 'tech_beh_easy_3',
            text: 'Tell me about a time when you helped a colleague or teammate. What was the situation?',
            type: 'behavioral',
            category: 'collaboration',
            difficulty: 'easy'
          }
        ],
        'medium': [
          {
            id: 'tech_beh_med_1',
            text: 'Describe a situation where you had to work with a difficult team member. How did you handle it?',
            type: 'behavioral',
            category: 'teamwork',
            difficulty: 'medium'
          },
          {
            id: 'tech_beh_med_2',
            text: 'Tell me about a time when you had to meet a tight deadline. What was your approach?',
            type: 'behavioral',
            category: 'time_management',
            difficulty: 'medium'
          },
          {
            id: 'tech_beh_med_3',
            text: 'Describe a time when you had to debug a particularly challenging issue. Walk me through your process.',
            type: 'behavioral',
            category: 'problem_solving',
            difficulty: 'medium'
          }
        ],
        'hard': [
          {
            id: 'tech_beh_hard_1',
            text: 'Tell me about a time when you had to make a technical decision with incomplete information. How did you approach it?',
            type: 'behavioral',
            category: 'decision_making',
            difficulty: 'hard'
          },
          {
            id: 'tech_beh_hard_2',
            text: 'Describe a situation where you had to influence others to adopt a technical solution without having direct authority.',
            type: 'behavioral',
            category: 'leadership',
            difficulty: 'hard'
          }
        ]
      },
      'technical': {
        'easy': [
          {
            id: 'tech_tech_easy_1',
            text: 'What programming languages and frameworks are you most comfortable with, and why do you prefer them?',
            type: 'technical',
            category: 'programming',
            difficulty: 'easy'
          },
          {
            id: 'tech_tech_easy_2',
            text: 'How do you typically approach testing your code? What tools or methods do you use?',
            type: 'technical',
            category: 'testing',
            difficulty: 'easy'
          }
        ],
        'medium': [
          {
            id: 'tech_tech_med_1',
            text: 'How would you explain the concept of APIs to a non-technical stakeholder?',
            type: 'technical',
            category: 'communication',
            difficulty: 'medium'
          },
          {
            id: 'tech_tech_med_2',
            text: 'Walk me through how you would optimize a slow-performing database query.',
            type: 'technical',
            category: 'optimization',
            difficulty: 'medium'
          }
        ],
        'hard': [
          {
            id: 'tech_tech_hard_1',
            text: 'How would you design a system to handle millions of concurrent users? What are the key considerations?',
            type: 'technical',
            category: 'system_design',
            difficulty: 'hard'
          },
          {
            id: 'tech_tech_hard_2',
            text: 'Explain how you would implement a real-time notification system. What technologies and patterns would you use?',
            type: 'technical',
            category: 'architecture',
            difficulty: 'hard'
          }
        ]
      },
      'situational': {
        'easy': [
          {
            id: 'tech_sit_easy_1',
            text: 'If you discovered a security vulnerability in production code, what would be your immediate steps?',
            type: 'situational',
            category: 'security',
            difficulty: 'easy'
          }
        ],
        'medium': [
          {
            id: 'tech_sit_med_1',
            text: 'Your team is split on whether to use Technology A or Technology B for a new project. How would you help resolve this?',
            type: 'situational',
            category: 'decision_making',
            difficulty: 'medium'
          }
        ],
        'hard': [
          {
            id: 'tech_sit_hard_1',
            text: 'You\'re leading a project that\'s behind schedule, and stakeholders are pressuring you to cut corners on testing. How do you handle this?',
            type: 'situational',
            category: 'leadership_pressure',
            difficulty: 'hard'
          }
        ]
      }
    }
  };

  const industryQuestions = mockQuestions[setup.industry] || mockQuestions['Technology'];
  const typeQuestions = industryQuestions[questionType] || industryQuestions['behavioral'] || {};
  const difficultyQuestions = typeQuestions[difficulty] || typeQuestions['medium'] || [];
  
  if (difficultyQuestions.length === 0) {
    return {
      id: 'fallback_1',
      text: 'Tell me about yourself and what interests you about this role.',
      type: 'behavioral',
      category: 'general',
      difficulty: 'easy'
    };
  }

  return difficultyQuestions[Math.floor(Math.random() * difficultyQuestions.length)];
};

// Generate initial interview questions with small talk
export const generateInterviewQuestions = async (setup: InterviewSetup): Promise<Question[]> => {
  await delay(1000); // Reduced delay
  
  const questions: Question[] = [];
  
  // Always start with small talk
  const smallTalkQuestion = SMALL_TALK_QUESTIONS[0];
  questions.push({
    ...smallTalkQuestion,
    text: smallTalkQuestion.text.replace('{industry}', setup.industry)
  });

  return questions;
};

// Analyze response with GPT-4o
export const analyzeResponse = async (
  question: Question,
  response: string,
  setup: InterviewSetup,
  previousResponses: any[] = []
): Promise<{
  score: number;
  feedback: string;
  followUpQuestion: string;
  strengths: string[];
  areasForImprovement: string[];
  confidenceIndicators: {
    responseLength: number;
    specificExamples: boolean;
    structuredAnswer: boolean;
    enthusiasm: number;
  };
  nextQuestionType: string;
  adaptiveInsights: {
    confidenceLevel: number;
    performanceLevel: number;
    suggestedFocus: string[];
  };
}> => {
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return generateMockAnalysis(question, response, setup, previousResponses);
  }

  try {
    const analysisPrompt = `
Analyze this interview response for a ${setup.jobType} position in ${setup.industry}:

Question (${question.type}): ${question.text}
Response: ${response}

Interview Context:
- Question ${previousResponses.length + 1} of planned 8-12 question comprehensive interview
- Experience level: ${setup.experienceLevel}
- Previous performance: ${previousResponses.length > 0 ? 
  `Average score: ${(previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length).toFixed(1)}/10` 
  : 'First question'}

ANALYSIS REQUIREMENTS:
1. Score (1-10) based on relevance, specificity, structure, and depth
2. Constructive feedback that helps them improve
3. Confidence indicators assessment
4. Strategic next question type recommendation
5. Adaptive insights for interview progression

CONVERSATIONAL NEXT QUESTION STRATEGY:
- If response reveals interesting details: suggest "conversational" to acknowledge and build rapport
- If response lacks detail or examples: suggest "follow_up" to dig deeper
- If performance is strong and we need technical assessment: suggest "technical"
- If we need behavioral examples: suggest "behavioral"
- If we need scenario-based assessment: suggest "situational"
- Only suggest conclusion after 8+ questions with comprehensive coverage

CONVERSATIONAL FLOW PRIORITY:
- Always prioritize natural conversation flow over rigid question types
- If they mention something personal or emotional (stress, excitement, challenges), suggest "conversational"
- If they share specific experiences or projects, suggest "follow_up" to explore details
- Build rapport before diving into harder technical or behavioral questions

Respond with JSON:
{
  "score": number,
  "feedback": "detailed constructive feedback",
  "followUpQuestion": "specific follow-up question if needed",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "confidenceIndicators": {
    "responseLength": number,
    "specificExamples": boolean,
    "structuredAnswer": boolean,
    "enthusiasm": number
  },
  "nextQuestionType": "suggested_type",
  "adaptiveInsights": {
    "confidenceLevel": number,
    "performanceLevel": number,
    "suggestedFocus": ["focus1", "focus2"]
  }
}`;

    const response_api = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach analyzing candidate responses. Provide constructive, specific feedback that helps candidates improve while being encouraging and realistic. Focus on comprehensive interview coverage, natural conversation flow, and strategic question progression that builds rapport.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response_api.ok) {
      throw new Error(`OpenAI API error: ${response_api.status}`);
    }

    const data = await response_api.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Extract JSON from markdown code blocks if present
    const jsonContent = extractJsonFromMarkdown(content);
    return JSON.parse(jsonContent);

  } catch (error) {
    console.error('Error analyzing response:', error);
    return generateMockAnalysis(question, response, setup, previousResponses);
  }
};

// Mock analysis for fallback
const generateMockAnalysis = (
  question: Question,
  response: string,
  setup: InterviewSetup,
  previousResponses: any[]
) => {
  const responseLength = response.length;
  const responseText = response.toLowerCase();
  const hasSpecificExamples = responseText.includes('example') || 
                             responseText.includes('instance') ||
                             responseText.includes('time when') ||
                             responseText.includes('experience') ||
                             responseText.includes('project') ||
                             responseText.includes('worked on');
  const hasMetrics = /\d+/.test(response);
  const hasStructure = response.includes('first') || response.includes('then') || response.includes('finally') || response.includes('initially');
  
  let baseScore = question.type === 'small_talk' ? 7 : 5; // Be more generous with small talk
  if (responseLength > 150) baseScore += 1;
  if (hasSpecificExamples) baseScore += 2;
  if (hasMetrics) baseScore += 1;
  if (hasStructure) baseScore += 1;
  
  const score = Math.min(10, baseScore);
  const enthusiasm = Math.min(10, Math.max(3, Math.floor(responseLength / 20) + (hasSpecificExamples ? 2 : 0)));
  
  // Determine next question type based on conversational flow
  let nextQuestionType = 'behavioral';
  const avgScore = previousResponses.length > 0 
    ? previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length 
    : score;
  
  // Prioritize conversational flow
  if (responseText.includes('stayed up') || responseText.includes('all night') || 
      responseText.includes('nervous') || responseText.includes('excited') ||
      responseText.includes('passionate') || responseText.includes('challenging')) {
    nextQuestionType = 'conversational'; // Acknowledge their emotional state
  } else if (question.type === 'small_talk') {
    nextQuestionType = 'conversational'; // Build rapport after small talk
  } else if (previousResponses.length < 3) {
    // Early interview - focus on building rapport and behavioral questions
    nextQuestionType = score < 6 ? 'follow_up' : 'conversational';
  } else if (previousResponses.length < 6) {
    // Mid interview - mix conversational, behavioral and technical
    if (score < 5) {
      nextQuestionType = 'follow_up';
    } else if (score >= 7 && !previousResponses.some(r => r.questionType === 'technical')) {
      nextQuestionType = 'technical';
    } else {
      nextQuestionType = Math.random() > 0.5 ? 'conversational' : 'behavioral';
    }
  } else if (previousResponses.length < 8) {
    // Later interview - technical and situational with conversational bridges
    if (score < 5) {
      nextQuestionType = 'follow_up';
    } else if (score >= 7) {
      nextQuestionType = Math.random() > 0.3 ? 'technical' : 'situational';
    } else {
      nextQuestionType = 'conversational';
    }
  } else {
    // Final questions - wrap up or conclude
    if (avgScore >= 7 && previousResponses.length >= 8) {
      nextQuestionType = 'situational'; // Final challenging question
    } else if (score < 6) {
      nextQuestionType = 'follow_up';
    } else {
      nextQuestionType = 'conversational';
    }
  }

  const feedbackMessages = {
    small_talk: {
      high: "Great start! You seem comfortable and engaged. I can tell you're ready for the main interview questions.",
      medium: "Good! You're warming up nicely. Let's continue building that confidence.",
      low: "Thanks for sharing! Let's take a moment to get more comfortable before we dive deeper."
    },
    conversational: {
      high: "I really appreciate your openness and the details you shared. That gives me great insight into who you are.",
      medium: "Thank you for sharing that with me. It's helpful to understand your perspective and experience.",
      low: "I appreciate you being open about that. Let's continue exploring your background and experience."
    },
    behavioral: {
      high: "Excellent response! You provided specific details and showed clear impact. This demonstrates strong experience.",
      medium: "Good answer! You shared relevant experience. Consider adding more specific examples and measurable outcomes.",
      low: "I appreciate you sharing that. Could you provide a more specific example with details about what you did and the results?"
    },
    technical: {
      high: "Outstanding technical knowledge! You explained complex concepts clearly and showed deep understanding.",
      medium: "Good technical understanding. Consider providing more specific examples or diving deeper into implementation details.",
      low: "That's a start. Let's explore this topic further with a more specific example or simpler approach."
    },
    follow_up: {
      high: "Perfect! That additional detail really helps me understand your experience and approach.",
      medium: "Good elaboration. The extra context helps paint a clearer picture of your capabilities.",
      low: "Thank you for the additional information. Let's continue exploring your experience."
    },
    situational: {
      high: "Excellent problem-solving approach! You considered multiple factors and provided a thoughtful solution.",
      medium: "Good thinking! You showed a solid approach to handling this type of situation.",
      low: "That's a reasonable start. Consider thinking through the potential challenges and stakeholder impacts."
    }
  };

  const questionTypeKey = question.type as keyof typeof feedbackMessages;
  const scoreLevel = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';
  const baseFeedback = feedbackMessages[questionTypeKey]?.[scoreLevel] || feedbackMessages.behavioral[scoreLevel];

  return {
    score,
    feedback: baseFeedback,
    followUpQuestion: hasSpecificExamples ? 
      "That's a great example. Can you tell me about the specific impact or outcome of your actions?" :
      "Could you provide a specific example from your experience to illustrate that point?",
    strengths: [
      hasSpecificExamples ? "Provided specific examples" : "Clear communication",
      hasStructure ? "Well-structured response" : "Relevant experience shared",
      hasMetrics ? "Included measurable results" : "Good understanding of the topic"
    ],
    areasForImprovement: [
      !hasSpecificExamples ? "Add more specific examples" : "Include more context about challenges",
      !hasMetrics ? "Include measurable outcomes" : "Expand on lessons learned",
      !hasStructure ? "Use structured approach (STAR method)" : "Connect more directly to role requirements"
    ],
    confidenceIndicators: {
      responseLength,
      specificExamples: hasSpecificExamples,
      structuredAnswer: hasStructure,
      enthusiasm
    },
    nextQuestionType,
    adaptiveInsights: {
      confidenceLevel: Math.min(10, Math.floor(enthusiasm * 0.8 + (score * 0.2))),
      performanceLevel: score,
      suggestedFocus: score < 6 ? ['communication', 'examples'] : score < 8 ? ['structure', 'impact'] : ['advanced_scenarios']
    }
  };
};

// Generate next question based on adaptive analysis
export const generateNextQuestion = async (
  setup: InterviewSetup,
  previousResponses: any[],
  aiState: AIInterviewerState,
  suggestedType?: string
): Promise<Question> => {
  
  // More deliberate interview conclusion logic
  if (previousResponses.length >= 8) {
    const avgScore = previousResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / previousResponses.length;
    const lastScore = previousResponses[previousResponses.length - 1]?.analysis?.score || 0;
    
    // Only conclude if we have comprehensive coverage AND clear performance assessment
    const hasGoodCoverage = previousResponses.length >= 10;
    const hasClearPerformance = (avgScore >= 8 && lastScore >= 7) || (avgScore <= 4 && lastScore <= 5);
    const hasMaxQuestions = previousResponses.length >= 12;
    
    if (hasMaxQuestions || (hasGoodCoverage && hasClearPerformance)) {
      throw new Error('INTERVIEW_COMPLETE'); // Signal to complete interview
    }
  }
  
  // Determine question type based on interview flow and performance
  let questionType = suggestedType || 'behavioral';
  
  if (previousResponses.length === 0) {
    questionType = 'small_talk';
  } else {
    const lastResponse = previousResponses[previousResponses.length - 1];
    
    // Enhanced question type logic with conversational priority
    if (lastResponse?.analysis?.score < 5) {
      questionType = 'follow_up'; // Always follow up on poor responses
    } else if (questionType === 'conversational') {
      // For conversational responses, generate a conversational question
      return await generateConversationalResponse(lastResponse.response, setup, previousResponses);
    }
  }

  // Store the question text in the response for follow-up reference
  const question = await generateDynamicQuestion(setup, previousResponses, aiState, questionType);
  
  return question;
};