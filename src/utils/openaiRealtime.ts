// src/utils/openaiRealtime.ts

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Load interview prompts from text files
const loadPrompt = async (filename: string): Promise<string> => {
  try {
    const response = await fetch(`/src/prompts/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load prompt: ${filename}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading prompt ${filename}:`, error);
    // Fallback to basic prompts if file loading fails
    const fallbackPrompts: Record<string, string> = {
      'standard-interview.txt': 'You are a professional interviewer conducting a job interview. Be warm, encouraging, and ask thoughtful follow-up questions.',
      'focused-interview.txt': 'You are a technical interviewer conducting a focused interview. Ask challenging technical questions and dive deep into expertise.',
      'college-interview.txt': 'You are a college admissions officer conducting an interview. Be encouraging and help students showcase their best qualities.'
    };
    return fallbackPrompts[filename] || 'You are a professional interviewer.';
  }
};

class RealtimeOpenAIService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording: boolean = false;
  private isConnected: boolean = false;
  private isProcessing: boolean = false;
  private isSpeaking: boolean = false;
  private audioChunks: Blob[] = [];
  private processingQueue: Promise<void> = Promise.resolve();
  private currentInterviewType: 'standard' | 'focused' | 'college' = 'standard';
  private focusedInterviewSubtype: string | null = null;
  
  // Interview state management
  private interviewState: 'not-started' | 'in-progress' | 'ended' = 'not-started';
  private timeLimit: number = 30; // Default 30 minutes
  private timeRemaining: number = 30;
  private timeLimitTimer: NodeJS.Timeout | null = null;
  
  // Time caps for different interview types (in minutes)
  private readonly TIME_CAPS = {
    standard: 30,
    college: 10,
    focused: {
      technical: 5,
      behavioral: 4,
      situational: 4,
      resume: 3,
      leadership: 5,
      caseStudy: 8,
      systemDesign: 10,
      leadershipAssessment: 8,
      culturalFit: 4,
      communication: 4,
      problemSolving: 4,
      salaryNegotiation: 3,
      closing: 2
    }
  };
  
  // Callbacks
  private onTranscriptionUpdate: ((text: string, speaker: 'user' | 'assistant') => void) | null = null;
  private onAIResponse: ((text: string) => void) | null = null;
  private onError: ((error: Error) => void) | null = null;
  private onStatusChange: ((status: 'connecting' | 'connected' | 'disconnected') => void) | null = null;
  private onStateChange: ((state: { isProcessing: boolean; isSpeaking: boolean; isListening: boolean }) => void) | null = null;
  private onInterviewStateChange: ((state: { 
    interviewState: 'not-started' | 'in-progress' | 'ended';
    timeRemaining: number;
    timeLimit: number;
  }) => void) | null = null;
  
  // Interview context
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  // Advanced interview intelligence (ported from openai.ts)
  private interviewSetup: any = null;
  private questionCount: number = 0;
  private interviewStartTime: Date | null = null;
  private performanceScores: number[] = [];
  private previousResponses: any[] = [];
  private candidateProfile: {
    strengths: string[];
    interests: string[];
    communicationStyle: string;
    performanceTrend: 'improving' | 'declining' | 'stable';
    enthusiasmAreas: string[];
    technicalSkills: string[];
    leadershipStyle: string;
  } = {
    strengths: [],
    interests: [],
    communicationStyle: 'unknown',
    performanceTrend: 'stable',
    enthusiasmAreas: [],
    technicalSkills: [],
    leadershipStyle: 'unknown'
  };

  // Advanced context tracking
  private shouldAskTechnicalNext: boolean = false;
  private lastTechnicalQuestion: number = 0;
  private referencedTopics: string[] = [];
  private conversationThemes: string[] = [];

  constructor() {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not set. Please add VITE_OPENAI_API_KEY to your .env file.');
    }
  }

  async connect(
    onTranscriptionUpdate: (text: string, speaker: 'user' | 'assistant') => void,
    onAIResponse: (text: string) => void,
    onError: (error: Error) => void,
    onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void,
    onStateChange: (state: { isProcessing: boolean; isSpeaking: boolean; isListening: boolean }) => void,
    onInterviewStateChange: (state: { 
      interviewState: 'not-started' | 'in-progress' | 'ended';
      timeRemaining: number;
      timeLimit: number;
    }) => void,
    interviewType: 'standard' | 'focused' | 'college' = 'standard',
    focusedSubtype?: string
  ) {
    this.onTranscriptionUpdate = onTranscriptionUpdate;
    this.onAIResponse = onAIResponse;
    this.onError = onError;
    this.onStatusChange = onStatusChange;
    this.onStateChange = onStateChange;
    this.onInterviewStateChange = onInterviewStateChange;
    this.currentInterviewType = interviewType;
    this.focusedInterviewSubtype = focusedSubtype || null;

    if (!OPENAI_API_KEY) {
      this.onError?.(new Error('OpenAI API key is not configured'));
      return;
    }

    try {
      this.onStatusChange?.('connecting');
      
      // Set time limit based on interview type
      this.setTimeLimit();
      
      // Initialize audio recording
      await this.initializeAudio();
      
      // Load interview prompt from text file
      const promptFilename = `${interviewType}-interview.txt`;
      const interviewPrompt = await loadPrompt(promptFilename);
      
      // Initialize conversation with interview prompt
      this.conversationHistory = [
        { role: 'assistant', content: interviewPrompt }
      ];
      
      this.isConnected = true;
      this.interviewState = 'not-started';
      this.onStatusChange?.('connected');
      this.updateInterviewState();
      
      // Send welcome message but don't start audio yet
      await this.sendWelcomeMessage();
      
    } catch (error) {
      this.onError?.(error as Error);
      this.onStatusChange?.('disconnected');
    }
  }

  private async initializeAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      this.audioContext = new AudioContext();
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.processAudioChunks();
      };
      
    } catch (error) {
      throw new Error(`Failed to initialize audio: ${error}`);
    }
  }

  async startRecording() {
    if (!this.mediaRecorder || !this.isConnected) {
      this.onError?.(new Error('Service not connected or audio not initialized'));
      return;
    }
    
    if (this.isRecording) return;
    
    this.audioChunks = [];
    this.mediaRecorder.start(1000); // Collect audio every 1 second
    this.isRecording = true;
  }

  async stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) return;
    
    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  private updateState() {
    this.onStateChange?.({
      isProcessing: this.isProcessing,
      isSpeaking: this.isSpeaking,
      isListening: this.isRecording && !this.isProcessing && !this.isSpeaking
    });
  }

  private async processAudioChunks() {
    if (this.audioChunks.length === 0) return;
    
    // Add to processing queue to handle multiple recordings
    this.processingQueue = this.processingQueue.then(async () => {
      try {
        this.isProcessing = true;
        this.updateState();
        
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const transcription = await this.transcribeAudio(audioBlob);
        
        if (transcription.trim()) {
          this.onTranscriptionUpdate?.(transcription, 'user');
          this.conversationHistory.push({ role: 'user', content: transcription });
          
          // Get AI response with emotion
          const aiResponse = await this.getAIResponse();
          if (aiResponse) {
            this.isProcessing = false;
            this.isSpeaking = true;
            this.updateState();
            
            this.onAIResponse?.(aiResponse);
            this.conversationHistory.push({ role: 'assistant', content: aiResponse });
            
            // Simulate speaking time based on response length (rough estimate)
            const speakingTime = Math.max(2000, aiResponse.length * 50); // ~50ms per character
            
            setTimeout(() => {
              this.isSpeaking = false;
              this.updateState();
            }, speakingTime);
          }
        } else {
          this.isProcessing = false;
          this.updateState();
        }
      } catch (error) {
        this.isProcessing = false;
        this.isSpeaking = false;
        this.updateState();
        this.onError?.(error as Error);
      }
    });
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    return await response.text();
  }

  private async getAIResponse(): Promise<string> {
    // Start interview timer if this is the first response
    if (!this.interviewStartTime) {
      this.interviewStartTime = new Date();
    }

    // Analyze the user's last response
    const lastUserMessage = this.conversationHistory.filter(msg => msg.role === 'user').pop();
    if (lastUserMessage) {
      const responseScore = this.analyzeResponseQuality(lastUserMessage.content);
      this.performanceScores.push(responseScore);
      this.updateCandidateProfile(lastUserMessage.content, responseScore);
      this.previousResponses.push({
        content: lastUserMessage.content,
        score: responseScore,
        timestamp: new Date()
      });
    }

    // Generate adaptive, context-aware prompt
    const adaptivePrompt = this.getAdaptivePromptContext();
    
    // Add sophisticated interview logic
    const interviewState = this.getDetailedInterviewState();
    const shouldWrapUp = this.shouldWrapUpInterview();
    
    let systemPrompt = '';
    
    if (shouldWrapUp) {
      systemPrompt = this.getWrapUpPrompt();
    } else {
      systemPrompt = this.getAdvancedInterviewPrompt(adaptivePrompt, interviewState);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory.slice(-6) // Last 6 messages for context
        ],
        max_tokens: 300,
        temperature: 0.8, // Higher temperature for more personality
        presence_penalty: 0.6, // Encourage variety in responses
        frequency_penalty: 0.3 // Reduce repetition
      }),
    });

    if (!response.ok) {
      throw new Error(`AI response failed: ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || '';
    
    // Track question progression
    this.questionCount++;
    
    // Update conversation themes based on AI response
    this.updateConversationThemes(aiMessage);
    
    return aiMessage;
  }

  private async sendOpeningMessage() {
    let message = '';
    
    if (this.currentInterviewType === 'focused' && this.focusedInterviewSubtype) {
      const focusedOpenings = {
        technical: "Hello, I'm Kelv, your technical interviewer today. I'm looking forward to exploring your technical expertise and problem-solving approach. Let's start with your background - can you walk me through a recent technical challenge you've worked on and how you approached solving it?",
        behavioral: "Good day, I'm Kelv. Today we'll be focusing on behavioral scenarios and your past experiences. I'm interested in understanding how you handle various workplace situations. To begin, tell me about a time when you had to overcome a significant challenge at work.",
        situational: "Hello, I'm Kelv. In this session, we'll explore how you approach hypothetical workplace scenarios. I want to understand your decision-making process and problem-solving methodology. Let's start - how do you typically approach complex problems when you don't have all the information you need?",
        resume: "Good afternoon, I'm Kelv. Today we'll be diving deep into your professional background and experiences. I'd like to understand the story behind your career progression. Can you walk me through your professional journey and what motivated your key career decisions?",
        leadership: "Hello, I'm Kelv, and I'll be assessing your leadership capabilities today. Leadership comes in many forms, and I'm interested in understanding your approach. Tell me about a time when you had to lead a team or project through a difficult situation.",
        caseStudy: "Good day, I'm Kelv. Today we'll work through business case scenarios together. I want to see how you analyze complex business problems and develop solutions. Are you ready to dive into a challenging case study?",
        systemDesign: "Hello, I'm Kelv. Today we'll be exploring system design and architecture thinking. I'm interested in understanding how you approach building scalable systems. Let's start with a design question - how would you design a system to handle millions of users?",
        leadershipAssessment: "Good afternoon, I'm Kelv. This is an advanced leadership assessment where we'll explore complex management scenarios. I want to understand your strategic thinking and leadership philosophy. Tell me about your approach to building and motivating high-performing teams.",
        culturalFit: "Hello, I'm Kelv. Today we'll be discussing values, work style, and cultural alignment. I want to understand what drives you and how you work best. What kind of work environment brings out your best performance?",
        communication: "Good day, I'm Kelv. We'll be focusing on communication skills and your ability to articulate complex ideas clearly. Can you explain a complex technical concept or project to me as if I were a non-technical stakeholder?",
        problemSolving: "Hello, I'm Kelv. Today we'll work through various problem-solving scenarios and logical challenges. I'm interested in seeing your thought process. Let's start with a problem - how would you approach figuring out how many tennis balls fit in a school bus?",
        salaryNegotiation: "Good afternoon, I'm Kelv. Today we'll be discussing compensation, negotiation, and understanding your value proposition. Let's talk about how you approach salary discussions and what factors are most important to you in a compensation package.",
        closing: "Hello, I'm Kelv. We'll be practicing how to effectively close interviews and engage with interviewers. This is about leaving a strong final impression. What questions would you typically ask an interviewer to demonstrate your genuine interest in a role?"
      };
      
      message = focusedOpenings[this.focusedInterviewSubtype as keyof typeof focusedOpenings] || 
                "Hello, I'm Kelv. Let's begin this focused interview session.";
    } else {
      const standardOpenings = {
        standard: "Hello, I'm Kelv, and I'll be conducting your interview today. I'm looking forward to learning about your background, skills, and experience. Let's start with you telling me about yourself and what brings you here today.",
        college: "Good day, I'm Kelv. I'm here to learn about you as a person and understand what makes you a great fit for our institution. Tell me about yourself - what are your passions, and what do you hope to achieve through your education here?"
      };
      
      message = standardOpenings[this.currentInterviewType as keyof typeof standardOpenings] || standardOpenings.standard;
    }
    
    // Set speaking state for opening message
    this.isSpeaking = true;
    this.updateState();
    
    this.onAIResponse?.(message);
    this.conversationHistory.push({ role: 'assistant', content: message });
    
    // Simulate speaking time for opening message
    setTimeout(() => {
      this.isSpeaking = false;
      this.updateState();
    }, message.length * 50);
  }

  disconnect() {
    this.isConnected = false;
    this.onStatusChange?.('disconnected');
    
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    // Clear callbacks
    this.onTranscriptionUpdate = null;
    this.onAIResponse = null;
    this.onError = null;
    this.onStatusChange = null;
    
    // Clear conversation
    this.conversationHistory = [];
    this.audioChunks = [];
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }

  getCurrentState() {
    return {
      isProcessing: this.isProcessing,
      isSpeaking: this.isSpeaking,
      isListening: this.isRecording && !this.isProcessing && !this.isSpeaking
    };
  }

  private async startRealtimeAudio() {
    if (!this.mediaRecorder || !this.isConnected) {
      throw new Error('Audio not initialized or service not connected');
    }
    
    // Start continuous recording with shorter intervals for real-time processing
    this.audioChunks = [];
    this.isRecording = true;
    this.updateState(); // Update state to show listening
    
    // Use shorter time slices for more responsive real-time processing
    this.mediaRecorder.start(500); // Process audio every 500ms
    
    console.log('Real-time audio processing started');
  }

  // Time and interview state management methods
  private setTimeLimit() {
    if (this.currentInterviewType === 'standard') {
      this.timeLimit = this.TIME_CAPS.standard;
    } else if (this.currentInterviewType === 'college') {
      this.timeLimit = this.TIME_CAPS.college;
    } else if (this.currentInterviewType === 'focused' && this.focusedInterviewSubtype) {
      this.timeLimit = this.TIME_CAPS.focused[this.focusedInterviewSubtype as keyof typeof this.TIME_CAPS.focused] || 5;
    } else {
      this.timeLimit = 30; // Default fallback
    }
    
    this.timeRemaining = this.timeLimit;
  }

  private updateInterviewState() {
    this.onInterviewStateChange?.({
      interviewState: this.interviewState,
      timeRemaining: this.timeRemaining,
      timeLimit: this.timeLimit
    });
  }

  private startTimer() {
    if (this.timeLimitTimer) {
      clearInterval(this.timeLimitTimer);
    }
    
    this.timeLimitTimer = setInterval(() => {
      this.timeRemaining = Math.max(0, this.timeRemaining - (1/60)); // Decrease by 1 second (1/60 minute)
      this.updateInterviewState();
      
      if (this.timeRemaining <= 0) {
        this.endInterview();
      }
    }, 1000); // Update every second
  }

  private async sendWelcomeMessage() {
    let message = '';
    
    if (this.currentInterviewType === 'focused' && this.focusedInterviewSubtype) {
      const focusedWelcomes = {
        technical: `Hello, I'm Kelv, your AI interview assistant. I'm here to help you practice technical interviews. We have ${this.timeLimit} minutes for this technical deep-dive session. When you're ready to begin, click the "Start Interview" button and we'll explore your technical expertise together.`,
        behavioral: `Hello, I'm Kelv. I'm here to help you practice behavioral interview questions. We have ${this.timeLimit} minutes to work on your behavioral responses and storytelling techniques. Click "Start Interview" when you're ready to begin.`,
        situational: `Hello, I'm Kelv. Today we'll practice situational interview scenarios. We have ${this.timeLimit} minutes to work through various workplace challenges. Click "Start Interview" when you're ready to dive into these scenarios.`,
        resume: `Hello, I'm Kelv. I'm here to help you practice discussing your background and experience. We have ${this.timeLimit} minutes to work on articulating your professional story. Click "Start Interview" when you're ready to begin.`,
        leadership: `Hello, I'm Kelv. Today we'll focus on leadership scenarios and your management experience. We have ${this.timeLimit} minutes to explore your leadership capabilities. Click "Start Interview" when you're ready to start.`,
        caseStudy: `Hello, I'm Kelv. I'm here to help you practice case study interviews. We have ${this.timeLimit} minutes to work through business scenarios together. Click "Start Interview" when you're ready to begin.`,
        systemDesign: `Hello, I'm Kelv. Today we'll practice system design interviews. We have ${this.timeLimit} minutes to explore architecture and scalability challenges. Click "Start Interview" when you're ready to start designing.`,
        leadershipAssessment: `Hello, I'm Kelv. This is an advanced leadership assessment session. We have ${this.timeLimit} minutes to explore complex management scenarios. Click "Start Interview" when you're ready to begin.`,
        culturalFit: `Hello, I'm Kelv. Today we'll focus on cultural fit and values alignment. We have ${this.timeLimit} minutes to explore your work style and values. Click "Start Interview" when you're ready to start.`,
        communication: `Hello, I'm Kelv. We'll be practicing communication skills and presentation abilities. We have ${this.timeLimit} minutes to work on articulating complex ideas clearly. Click "Start Interview" when you're ready to begin.`,
        problemSolving: `Hello, I'm Kelv. Today we'll work through problem-solving challenges and logical thinking exercises. We have ${this.timeLimit} minutes for this session. Click "Start Interview" when you're ready to start solving problems.`,
        salaryNegotiation: `Hello, I'm Kelv. We'll be practicing salary negotiation and compensation discussions. We have ${this.timeLimit} minutes to work on these important skills. Click "Start Interview" when you're ready to begin.`,
        closing: `Hello, I'm Kelv. Today we'll practice how to effectively close interviews and ask engaging questions. We have ${this.timeLimit} minutes for this session. Click "Start Interview" when you're ready to start.`
      };
      
      message = focusedWelcomes[this.focusedInterviewSubtype as keyof typeof focusedWelcomes] || 
                `Hello, I'm Kelv. We have ${this.timeLimit} minutes for this focused interview session. Click "Start Interview" when you're ready to begin.`;
    } else {
      const standardWelcomes = {
        standard: `Hello, I'm Kelv, your AI interview assistant. I'm here to help you practice your interview skills. We have ${this.timeLimit} minutes for this comprehensive interview session. When you're ready to begin, click the "Start Interview" button and we'll start practicing together.`,
        college: `Hello, I'm Kelv. I'm here to help you practice for college interviews. We have ${this.timeLimit} minutes for this session where we'll explore your academic interests, goals, and what makes you unique. Click "Start Interview" when you're ready to share your story.`
      };
      
      message = standardWelcomes[this.currentInterviewType as keyof typeof standardWelcomes] || standardWelcomes.standard;
    }
    this.onAIResponse?.(message);
    this.conversationHistory.push({ role: 'assistant', content: message });
  }

  // Public method to start the interview
  async startInterview() {
    if (this.interviewState !== 'not-started' || !this.isConnected) {
      this.onError?.(new Error('Cannot start interview: not in correct state'));
      return;
    }

    try {
      this.interviewState = 'in-progress';
      this.interviewStartTime = new Date();
      this.startTimer();
      this.updateInterviewState();
      
      // Send opening message and start audio
      await this.sendOpeningMessage();
      await this.startRealtimeAudio();
      
    } catch (error) {
      this.onError?.(error as Error);
    }
  }

  // Public method to end the interview
  endInterview() {
    if (this.interviewState !== 'in-progress') return;
    
    this.interviewState = 'ended';
    this.isRecording = false;
    
    if (this.timeLimitTimer) {
      clearInterval(this.timeLimitTimer);
      this.timeLimitTimer = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    this.updateInterviewState();
    this.updateState();
    
    // Send closing message
    this.sendClosingMessage();
  }

  private async sendClosingMessage() {
    const closingMessage = `Thank you for this interview session. You demonstrated strong responses throughout our conversation. Your interview session has now ended. Feel free to review the transcript and practice again anytime to continue improving your skills.`;
    
    this.isSpeaking = true;
    this.updateState();
    
    this.onAIResponse?.(closingMessage);
    this.conversationHistory.push({ role: 'assistant', content: closingMessage });
    
    setTimeout(() => {
      this.isSpeaking = false;
      this.updateState();
    }, closingMessage.length * 50);
  }

  // Public getters for interview state
  getInterviewState() {
    return this.interviewState;
  }

  getTimeRemaining() {
    return this.timeRemaining;
  }

  getTimeLimit() {
    return this.timeLimit;
  }

  // Industry and role context functions (from openai.ts)
  private getIndustryContext(industry: string): string {
    const contexts: { [key: string]: string } = {
      'Technology': 'Fast-paced, innovation-driven environment with rapid technological changes. Companies value agility, continuous learning, and the ability to adapt to new technologies quickly.',
      'Healthcare': 'Highly regulated, patient-focused industry with emphasis on accuracy, compliance, and continuous improvement.',
      'Finance': 'Regulated, risk-averse environment with focus on compliance, accuracy, and customer trust.',
      // Add more as needed
    };
    return contexts[industry] || 'Dynamic, competitive environment with focus on innovation and continuous improvement.';
  }

  private getRoleContext(jobType: string, industry: string): string {
    const roleContexts: { [key: string]: string } = {
      'Software Engineer': 'Focus on coding, problem-solving, and software development lifecycle. Key skills include programming languages, system design, debugging.',
      'Data Scientist': 'Focus on data analysis, statistical modeling, and machine learning. Key skills include Python/R, SQL, statistical analysis.',
      // Add more as needed
    };
    return roleContexts[jobType] || `Focus on delivering value in ${industry} through expertise and collaboration.`;
  }

  private analyzeResponseQuality(text: string): number {
    // Simplified analysis (can be enhanced)
    const hasSpecificExamples = /(example|instance|time|when|project|case)/i.test(text);
    const hasQuantifiableResults = /(\d+%|\d+ percent|\$\d+|\d+ people)/i.test(text);
    const hasSTARStructure = /(situation|task|action|result|challenge|solution)/i.test(text);
    const wordCount = text.split(' ').length;
    
    let score = 5; // Base score
    if (hasSpecificExamples) score += 1;
    if (hasQuantifiableResults) score += 1;
    if (hasSTARStructure) score += 1;
    if (wordCount > 50) score += 1;
    if (wordCount > 100) score += 1;
    
    return Math.min(10, Math.max(1, score));
  }

  private updateCandidateProfile(response: string, score: number) {
    this.performanceScores.push(score);
    
    // Extract interests and themes
    const interests = this.extractKeyTopics(response.toLowerCase());
    this.candidateProfile.interests = [...new Set([...this.candidateProfile.interests, ...interests])];
    
    // Update performance trend
    if (this.performanceScores.length >= 2) {
      const recent = this.performanceScores.slice(-2);
      if (recent[1] > recent[0] + 1) {
        this.candidateProfile.performanceTrend = 'improving';
      } else if (recent[1] < recent[0] - 1) {
        this.candidateProfile.performanceTrend = 'declining';
      } else {
        this.candidateProfile.performanceTrend = 'stable';
      }
    }
  }

  private extractKeyTopics(text: string): string[] {
    const commonTopics = [
      'project', 'team', 'leadership', 'problem', 'solution', 'technology', 'data',
      'customer', 'strategy', 'innovation', 'collaboration', 'results', 'achievement'
    ];
    return commonTopics.filter(topic => text.includes(topic));
  }

  private getAdaptivePromptContext(): string {
    const avgScore = this.performanceScores.length > 0 
      ? this.performanceScores.reduce((sum, score) => sum + score, 0) / this.performanceScores.length
      : 5;
    
    const isStruggling = avgScore <= 4;
    const isPerformingWell = avgScore >= 7;
    const shouldAskTechnical = this.questionCount >= 2 && !isStruggling && !this.hasAskedTechnical();
    
    const interviewDuration = this.interviewStartTime 
      ? (Date.now() - this.interviewStartTime.getTime()) / 1000 / 60 
      : 0;

    return `
ADAPTIVE INTERVIEW CONTEXT:
- Question #${this.questionCount + 1}
- Interview duration: ${interviewDuration.toFixed(1)} minutes
- Average performance: ${avgScore.toFixed(1)}/10
- Performance trend: ${this.candidateProfile.performanceTrend}
- Candidate status: ${isStruggling ? 'Struggling—use gentler questions' : isPerformingWell ? 'Performing well—go deeper' : 'Moderate—balanced approach'}
- Technical questions needed: ${shouldAskTechnical ? 'Yes' : 'No'}
- Key interests: ${this.candidateProfile.interests.slice(0, 3).join(', ')}

RECENT CONVERSATION THEMES:
${this.conversationHistory.slice(-4).map((msg) => `${msg.role}: ${msg.content.substring(0, 100)}...`).join('\n')}

ADAPTIVE STRATEGY:
${isStruggling ? 
  'The candidate could use encouragement. Ask clear, supportive questions.' :
  isPerformingWell ?
  'The candidate is excelling! Ask challenging, thought-provoking questions.' :
  'Keep questions balanced and engaging.'
}

${shouldAskTechnical ? 'It\'s time for a technical question to assess role-specific knowledge.' : ''}

INDUSTRY CONTEXT:
${this.interviewSetup ? this.getIndustryContext(this.interviewSetup.industry) : ''}

ROLE REQUIREMENTS:
${this.interviewSetup ? this.getRoleContext(this.interviewSetup.jobType, this.interviewSetup.industry) : ''}
`;
  }

  private hasAskedTechnical(): boolean {
    return this.conversationHistory.some(msg => 
      msg.role === 'assistant' && 
      /(technical|code|system|architecture|programming)/i.test(msg.content)
    );
  }

  // Advanced interview intelligence methods (ported from openai.ts)
  
  private getDetailedInterviewState() {
    const avgScore = this.performanceScores.length > 0 
      ? this.performanceScores.reduce((sum, score) => sum + score, 0) / this.performanceScores.length 
      : 5;
    
    const isStruggling = avgScore < 5;
    const isPerformingWell = avgScore > 7;
    const timeElapsed = this.interviewStartTime 
      ? (new Date().getTime() - this.interviewStartTime.getTime()) / 1000 / 60 
      : 0;
    
    // Should ask technical question based on timing and flow
    const questionsSinceTechnical = this.questionCount - this.lastTechnicalQuestion;
    this.shouldAskTechnicalNext = questionsSinceTechnical >= 3 && 
      this.questionCount >= 2 && 
      this.currentInterviewType !== 'college';
    
    return {
      avgScore,
      isStruggling,
      isPerformingWell,
      timeElapsed,
      shouldAskTechnical: this.shouldAskTechnicalNext,
      questionCount: this.questionCount,
      conversationDepth: this.referencedTopics.length
    };
  }

  private shouldWrapUpInterview(): boolean {
    const timeElapsed = this.interviewStartTime 
      ? (new Date().getTime() - this.interviewStartTime.getTime()) / 1000 / 60 
      : 0;
    
    // Wrap up conditions based on interview type
    const wrapUpTime = {
      standard: 15,
      focused: 12,
      college: 10
    }[this.currentInterviewType] || 15;
    
    return timeElapsed >= wrapUpTime || this.questionCount >= 8;
  }

  private getWrapUpPrompt(): string {
    const candidateStrengths = this.candidateProfile.strengths.join(', ') || 'their thoughtful responses';
    
    return `You are Kelv, a professional AI interviewer wrapping up a successful interview.

INTERVIEW SUMMARY:
- Questions asked: ${this.questionCount}
- Performance trend: ${this.candidateProfile.performanceTrend}
- Key strengths noticed: ${candidateStrengths}
- Communication style: ${this.candidateProfile.communicationStyle}

Your task is to:
1. Thank the candidate professionally for their time
2. Highlight 1-2 specific strengths you noticed during the conversation
3. Give them constructive feedback about their interview performance
4. Ask if they have any final questions about the role/company
5. End on a positive, professional note

Be genuine, specific, and encouraging while maintaining professionalism. Show that you were actively listening and provide meaningful feedback based on their responses.

Example approach: "Thank you for taking the time to speak with me today. I was particularly impressed by [specific example from their responses]. Your [specific strength] came through clearly in your answers. Based on our conversation, I can see you have strong [relevant skills]. Do you have any questions for me about the role or our organization?"`;
  }

  private getAdvancedInterviewPrompt(adaptivePrompt: string, interviewState: any): string {
    const roleContext = this.getCurrentRoleContext();
    const industryContext = this.getCurrentIndustryContext();
    
    // Create focused interview context based on subtype
    let focusedContext = '';
    if (this.currentInterviewType === 'focused' && this.focusedInterviewSubtype) {
      const focusedPrompts = {
        technical: `
TECHNICAL INTERVIEW FOCUS:
- Assess technical knowledge, problem-solving approach, and coding abilities
- Ask about system design, algorithms, data structures, and technical trade-offs
- Dive deep into their technical experience and methodology
- Challenge them with technical scenarios relevant to the role
- Evaluate their ability to explain technical concepts clearly`,

        behavioral: `
BEHAVIORAL INTERVIEW FOCUS:
- Use STAR method (Situation, Task, Action, Result) framework
- Focus on past experiences and how they handled specific situations
- Assess leadership, teamwork, conflict resolution, and decision-making
- Ask about challenges overcome, failures learned from, and achievements
- Evaluate cultural fit and working style`,

        situational: `
SITUATIONAL INTERVIEW FOCUS:
- Present hypothetical workplace scenarios and challenges
- Assess problem-solving methodology and decision-making process
- Focus on how they would handle difficult situations
- Evaluate crisis management and adaptation skills
- Test judgment and ethical reasoning`,

        resume: `
RESUME-FOCUSED INTERVIEW:
- Deep dive into their professional background and experiences
- Ask about career transitions, motivations, and decision points
- Explore gaps, achievements, and key projects in detail
- Assess how their experience aligns with current role requirements
- Understand their career progression and future goals`,

        leadership: `
LEADERSHIP INTERVIEW FOCUS:
- Assess leadership style, team management, and influence skills
- Ask about team building, motivation techniques, and difficult conversations
- Explore conflict resolution and performance management experience
- Evaluate strategic thinking and vision-setting abilities
- Focus on examples of leading through change or adversity`,

        caseStudy: `
CASE STUDY INTERVIEW FOCUS:
- Present business scenarios requiring analysis and solution development
- Assess analytical thinking, structured problem-solving, and business acumen
- Evaluate ability to work with incomplete information and make assumptions
- Test communication of complex ideas and recommendation development
- Focus on strategic thinking and implementation considerations`,

        systemDesign: `
SYSTEM DESIGN INTERVIEW FOCUS:
- Assess architecture design skills and scalability thinking
- Ask about system components, data flow, and technology choices
- Evaluate understanding of trade-offs, bottlenecks, and optimization
- Test knowledge of distributed systems, databases, and infrastructure
- Focus on real-world implementation challenges and solutions`,

        leadershipAssessment: `
ADVANCED LEADERSHIP ASSESSMENT:
- Evaluate executive-level thinking and strategic decision-making
- Assess organizational change management and transformation skills
- Focus on stakeholder management and cross-functional leadership
- Test vision-setting, culture-building, and long-term planning abilities
- Evaluate handling of complex business challenges and ethical dilemmas`,

        culturalFit: `
CULTURAL FIT ASSESSMENT:
- Assess alignment with company values and working style
- Explore what motivates them and their ideal work environment
- Evaluate team collaboration and communication preferences
- Focus on adaptability, learning orientation, and growth mindset
- Test alignment with company mission and long-term vision`,

        communication: `
COMMUNICATION SKILLS ASSESSMENT:
- Evaluate clarity, conciseness, and effectiveness of communication
- Ask them to explain complex topics to different audiences
- Assess presentation skills and ability to influence others
- Test active listening and question-asking abilities
- Focus on written and verbal communication across various contexts`,

        problemSolving: `
PROBLEM-SOLVING ASSESSMENT:
- Present logic puzzles, analytical challenges, and brain teasers
- Assess structured thinking and methodical approach to problems
- Evaluate creativity and ability to think outside the box
- Test persistence and handling of ambiguous situations
- Focus on thought process rather than just final answers`,

        salaryNegotiation: `
SALARY NEGOTIATION PRACTICE:
- Practice discussing compensation expectations and requirements
- Assess knowledge of market rates and value proposition
- Evaluate negotiation skills and professional communication
- Focus on total compensation understanding (salary, benefits, equity)
- Test ability to justify salary requests with concrete value`,

        closing: `
INTERVIEW CLOSING PRACTICE:
- Practice asking thoughtful questions about the role and company
- Assess ability to demonstrate genuine interest and enthusiasm
- Evaluate research preparation and company knowledge
- Focus on leaving a positive final impression
- Test follow-up and next steps communication`
      };
      
      focusedContext = focusedPrompts[this.focusedInterviewSubtype as keyof typeof focusedPrompts] || '';
    }
    
    return `You are Kelv, a professional AI interviewer conducting an advanced interview.

${adaptivePrompt}

CURRENT INTERVIEW STATE:
- Question #${this.questionCount}
- Performance trend: ${this.candidateProfile.performanceTrend}
- Average score: ${interviewState.avgScore.toFixed(1)}/10
- Should ask technical: ${interviewState.shouldAskTechnical}
- Time elapsed: ${interviewState.timeElapsed.toFixed(1)} minutes

${focusedContext}

CONTEXT AWARENESS:
${roleContext}
${industryContext}

CONVERSATION THEMES IDENTIFIED:
${this.conversationThemes.slice(-3).join(', ') || 'Getting to know the candidate'}

ADAPTIVE STRATEGY:
${interviewState.isStruggling ? 
  'The candidate could use encouragement. Ask supportive questions and help them feel comfortable.' :
  interviewState.isPerformingWell ?
  'The candidate is excelling! Ask more challenging or thought-provoking questions.' :
  'Maintain balanced, engaging questions.'
}

${interviewState.shouldAskTechnical ? 
  `Now is a good time for a technical question! Ask something relevant to their role that tests practical knowledge.` :
  'Continue with behavioral, situational, or follow-up questions.'
}

PERSONALIZED APPROACH:
- Reference specific details from their previous answers
- Build on topics that sparked their enthusiasm
- Show genuine curiosity about their experiences
- Connect their background to role requirements

Your response should:
1. Feel natural and conversational (not scripted)
2. Reference something specific they mentioned earlier
3. Probe deeper into interesting areas
4. ${interviewState.shouldAskTechnical ? 'Include a relevant technical question' : 'Focus on behavioral/situational aspects'}
5. Match their communication style and energy level
6. Maintain professional, encouraging demeanor

Keep responses to 2-3 sentences max. Be engaging but focused!`;
  }

  private getCurrentRoleContext(): string {
    if (this.interviewSetup?.jobType && this.interviewSetup?.industry) {
      return this.getRoleContext(this.interviewSetup.jobType, this.interviewSetup.industry);
    }
    return `Focus on skills relevant to their target role: problem-solving, communication, technical aptitude, and cultural fit.`;
  }

  private getCurrentIndustryContext(): string {
    if (this.interviewSetup?.industry) {
      return this.getIndustryContext(this.interviewSetup.industry);
    }
    return `Consider industry-specific challenges, trends, and required competencies.`;
  }

  private updateConversationThemes(aiMessage: string) {
    // Extract themes from AI message to track conversation flow
    const themes = [];
    if (aiMessage.toLowerCase().includes('technical')) themes.push('technical discussion');
    if (aiMessage.toLowerCase().includes('leadership')) themes.push('leadership');
    if (aiMessage.toLowerCase().includes('team')) themes.push('teamwork');
    if (aiMessage.toLowerCase().includes('project')) themes.push('project experience');
    if (aiMessage.toLowerCase().includes('challenge')) themes.push('problem solving');
    
    this.conversationThemes.push(...themes);
    
    // Keep only recent themes
    if (this.conversationThemes.length > 10) {
      this.conversationThemes = this.conversationThemes.slice(-10);
    }
  }

  // Initialize interview setup (can be called from outside)
  public setInterviewSetup(setup: any) {
    this.interviewSetup = setup;
  }

  // Set focused interview subtype (for focused interviews)
  public setFocusedInterviewSubtype(subtype: string) {
    this.focusedInterviewSubtype = subtype;
    // Update time limit when subtype is set
    this.setTimeLimit();
  }
}

export const realtimeOpenAIService = new RealtimeOpenAIService();
