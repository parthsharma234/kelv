import { useEffect, useCallback, useRef } from 'react';
import { OpenAIRealtimeClient, TranscriptChunk, RealtimeConfig } from '../utils/openaiRealtime';
import { buildAdaptiveSystemPrompt, AdaptivePromptOptions, buildFollowUpPrompt, extractKeyTopics, getFocusedInterviewPrompt } from '../utils/promptTemplates';
import { InterviewSetup } from '../types/interview';
import { createRealtimeSession, updateRealtimeSession, saveTranscriptChunk, saveRealtimeInterviewSession } from '../utils/supabase-interview';
import { supabase } from '../lib/supabase';
import { useInterviewState } from './useInterviewState';
import { extractSpeechMetrics, analyzeResponse as analyzeResponseWithAI } from '../utils/openai';
import { pcmToWav } from '../utils/audio';
import { VoiceTimelinePoint, ActionableFeedback, generateActionableFeedback } from '../utils/speechAnalysis';

// Simple interface for speech metrics in realtime interviews
interface SpeechMetricEntry {
  questionId?: string;
  metrics: any;
}

// Generate a simple UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface UseRealtimeInterviewOptions {
  setup: InterviewSetup;
  interviewType?: string;
  focusedType?: string; // Add focused interview type
  mediaStream?: MediaStream | null; // Allow null values
  onComplete?: (sessionData: any) => void;
  onError?: (error: string) => void;
}

// Get interview duration based on type
const getInterviewDuration = (interviewType?: string): number => {
  switch (interviewType) {
    case 'standard':
      return 20; // 20 minutes for standard interviews
    case 'focused':
      return 8;  // Default focused interview duration
    default:
      return 15; // Default fallback
  }
};

export function useRealtimeInterview({
  setup,
  interviewType,
  focusedType,
  mediaStream,
  onComplete,
  onError
}: UseRealtimeInterviewOptions) {
  const maxDuration = getInterviewDuration(interviewType); // Get duration in minutes
  
  const {
    state,
    setStatus,
    setError,
    setSessionId,
    setDuration,
    setRecording,
    setSpeakerStatus,
    processTranscriptChunk,
    handleAssistantResponse,
    handleUserTranscript,
  } = useInterviewState();

  const clientRef = useRef<OpenAIRealtimeClient | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const performanceScoresRef = useRef<number[]>([]);
  const candidateResponsesRef = useRef<string[]>([]);
  const speechMetricsRef = useRef<SpeechMetricEntry[]>([]);
  const currentQuestionRef = useRef<string>('');
  const questionTimestampRef = useRef<number | null>(null);
  const responseTimesRef = useRef<number[]>([]);
  // Add a ref to store per-response segments for the voice timeline
  const voiceTimelineSegmentsRef = useRef<Array<{
    transcript: string;
    startTimestamp: number;
    endTimestamp: number;
    questionContext?: string;
  }>>([]);
  // Add a ref to collect transcript chunks for the current user response
  const currentUserChunksRef = useRef<TranscriptChunk[]>([]);

  // Generate adaptive system prompt
  const generateAdaptiveInstructions = useCallback((
    questionCount: number = 1,
    duration: number = 0,
    recentScores: number[] = [],
    overallPerformance: number = 5
  ) => {
    const options: AdaptivePromptOptions = {
      setup,
      recentScores,
      overallPerformance,
      interviewDuration: duration,
      questionCount,
      shouldWrapUp: duration >= maxDuration || (duration >= maxDuration * 0.8 && overallPerformance <= 4)
    };
    return buildAdaptiveSystemPrompt(options);
  }, [setup, maxDuration]);

  // Update the AI's behavior based on candidate performance
  const updateInterviewerBehavior = useCallback((
    candidateResponse: string,
    estimatedScore: number = 5
  ) => {
    // Store the response and score for adaptive behavior
    candidateResponsesRef.current.push(candidateResponse);
    performanceScoresRef.current.push(estimatedScore);
    
    // Calculate metrics for adaptive prompting
    const recentScores = performanceScoresRef.current.slice(-3);
    const overallPerformance = performanceScoresRef.current.length > 0 ?
      performanceScoresRef.current.reduce((sum, score) => sum + score, 0) / performanceScoresRef.current.length : 5;
    
    const duration = startTimeRef.current ? 
      (Date.now() - startTimeRef.current.getTime()) / 1000 / 60 : 0;

    // Extract insights for context-aware follow-ups
    const recentContext = candidateResponsesRef.current.slice(-2).join(' ');
    const candidateStrengths = ['communication', 'problem-solving']; // Could be enhanced with AI analysis
    const areasOfInterest = extractKeyTopics(recentContext);
    const performanceLevel = overallPerformance <= 4 ? 'struggling' : overallPerformance >= 7 ? 'excellent' : 'moderate';

    // Generate follow-up prompt for more contextual responses
    const followUpPrompt = buildFollowUpPrompt(
      recentContext,
      candidateStrengths,
      areasOfInterest,
      performanceLevel
    );

    // Update the system prompt with adaptive behavior
    const updatedInstructions = generateAdaptiveInstructions(
      state.questionCount + 1,
      duration,
      recentScores,
      overallPerformance
    );

    // Send the updated instructions to the AI
    if (clientRef.current) {
      clientRef.current.updateSystemPrompt(updatedInstructions);
      
      // Also send context as a user message to influence the next question
      setTimeout(() => {
        clientRef.current?.sendUserMessage(
          `[INTERNAL CONTEXT FOR NEXT QUESTION: ${followUpPrompt}]`
        );
      }, 500);
    }
  }, [generateAdaptiveInstructions, state.questionCount]);

  const handleCompleteTranscriptChunk = useCallback(async (chunk: TranscriptChunk) => {
    // Save complete chunks to Supabase
    if (state.sessionId) {
      saveTranscriptChunk({
        id: generateUUID(), // Ensure a new UUID for each chunk
        session_id: state.sessionId,
        speaker: chunk.speaker,
        text: chunk.text,
        timestamp: chunk.timestamp,
        is_partial: false,
      }).catch(error => {
        console.error(`Failed to save transcript chunk for speaker ${chunk.speaker}:`, error);
      });
    }

    // Track current question context for voice analysis
    if (chunk.speaker === 'assistant' && chunk.text.trim().endsWith('?')) {
      currentQuestionRef.current = chunk.text;
      questionTimestampRef.current = chunk.timestamp;
    }

    // Collect user transcript chunks for accurate timing
    if (chunk.speaker === 'user') {
      currentUserChunksRef.current.push(chunk);
    }

    // Analyze user responses for adaptive behavior and voice metrics
    if (chunk.speaker === 'user' && chunk.text.trim().length > 10) {
      const responseLength = chunk.text.split(' ').length;
      const hasKeywords = ['experience', 'project', 'team', 'challenge', 'solution'].some(
        keyword => chunk.text.toLowerCase().includes(keyword)
      );
      const estimatedScore = Math.min(10, Math.max(3, 
        (responseLength > 20 ? 7 : 5) + (hasKeywords ? 2 : 0)
      ));
      updateInterviewerBehavior(chunk.text, estimatedScore);

      // --- Voice Timeline Segmentation (fixed timestamps) ---
      // Use the first and last chunk timestamps for this response
      const userChunks = [...currentUserChunksRef.current];
      if (userChunks.length > 0) {
        const startTimestamp = userChunks[0].timestamp;
        const endTimestamp = userChunks[userChunks.length - 1].timestamp;
        voiceTimelineSegmentsRef.current.push({
          transcript: userChunks.map(c => c.text).join(' '),
          startTimestamp,
          endTimestamp,
          questionContext: currentQuestionRef.current || undefined
        });
      }
      currentUserChunksRef.current = [];
      // --- End Voice Timeline Segmentation ---
    }
  }, [state.sessionId, updateInterviewerBehavior, setup.interviewMode]);


  // Initialize realtime client with adaptive prompting
  const initializeClient = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    // Use focused prompt for focused interviews, otherwise use adaptive prompt
    const instructions = focusedType ? 
      getFocusedInterviewPrompt(focusedType, setup) :
      generateAdaptiveInstructions();

    const config: Partial<RealtimeConfig> = {
      voice: 'alloy',
      instructions,
      modalities: setup.interviewMode === 'voice' ? ['text', 'audio'] : ['text'],
      temperature: focusedType ? 0.6 : 0.7 // Minimum temperature for realtime API is 0.6
    };

    try {
      clientRef.current = new OpenAIRealtimeClient(
        import.meta.env.VITE_OPENAI_API_KEY,
        config,
        mediaStream || undefined // Pass the media stream to avoid creating multiple streams, convert null to undefined
      );

      // Set up event listeners
      clientRef.current.on('connection.opened', () => {
        setStatus('interviewing');
        startTimeRef.current = new Date();
        // Start the timer after connection is established
        const startTime = Date.now();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        
        // Send initial greeting message to start the interview with small talk (skip for focused interviews)
        setTimeout(() => {
          if (focusedType) {
            // For focused interviews, start immediately with direct instruction
            const directInstruction = `Start the interview immediately. This is a focused ${focusedType} interview session. Follow your instructions precisely - be direct, efficient, and get straight to the relevant questions. No small talk needed.`;
            clientRef.current?.createResponse(directInstruction);
          } else {
            // For regular interviews, use the full small talk approach
            const currentTime = new Date();
            const hour = currentTime.getHours();
            const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
            const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
            
            // More human, contextual greetings
            const humanGreetings = [
              // Time-based natural greetings
              hour < 10 ? "Good morning! I hope you've had a chance to grab some coffee or tea." : 
              hour < 12 ? "Good morning! How's your day shaping up so far?" :
              hour < 17 ? "Good afternoon! I hope you're having a good day." :
              hour < 20 ? "Good evening! How has your day been?" :
              "Good evening! I hope I'm not keeping you too late.",
              
              // Day-specific greetings
              isWeekend ? `Happy ${dayOfWeek}! I appreciate you taking time on the weekend for this.` :
              dayOfWeek === 'Monday' ? "Happy Monday! How are you starting your week?" :
              dayOfWeek === 'Friday' ? "Happy Friday! Almost to the weekend - how are you feeling?" :
              `Happy ${dayOfWeek}! How's your week going so far?`,
              
              // Weather/mood based (more conversational)
              "Hi there! Thanks for joining me today. How are you feeling right now?",
              "Hello! I'm really looking forward to our conversation. How has your day been treating you?",
              "Hey! Great to meet you. Are you somewhere comfortable to chat?",
              "Hi! I hope you're doing well today. How are you feeling about our conversation?",
              
              // Energy/casual greetings
              "Hello there! I'm excited to get to know you better. How's everything going on your end?",
              "Hi! Thanks for making time to chat with me. What's been the highlight of your day so far?",
              "Good to see you! I hope you're having a nice day. How are you doing?",
              "Hello! I really appreciate you being here. How are you feeling today?"
            ];
            
            const selectedGreeting = humanGreetings[Math.floor(Math.random() * humanGreetings.length)];
            
            // More conversational follow-up prompts
            const conversationalPrompts = [
              "I'm curious - what's your energy level like today? Are you a morning person or more of an afternoon person?",
              "Before we dive in, I'm always curious - what's something good that's happened to you recently?",
              "I like to start by getting a sense of how you're feeling. Any nerves, excitement, or just ready to jump in?",
              "Tell me, what's been keeping you busy lately? Work, projects, life in general?",
              "I'm interested to know - where are you joining me from today? Somewhere cozy I hope!",
              "What's your vibe right now? Feeling confident, a little nervous, excited? All totally normal!",
              "I always like to check in - how has your week been going so far?",
              "Before we get started, what's one thing you're looking forward to this week?"
            ];
            
            const followUpPrompt = conversationalPrompts[Math.floor(Math.random() * conversationalPrompts.length)];
            
            const veryHumanSmallTalkInstruction = `Start with this natural greeting: "${selectedGreeting}"

Wait for their response, then continue with genuine curiosity by asking: "${followUpPrompt}"

Be super conversational and human-like:
- React authentically to what they share (if they mention being tired, acknowledge it; if excited, match their energy)
- Use natural speech patterns with filler words occasionally ("you know," "I mean," "that's interesting")
- Ask follow-up questions based on what they tell you (if they mention coffee, ask about their coffee preference; if they mention being busy, ask what's keeping them busy)
- Share brief, appropriate observations or relate to their experience ("I'm definitely more of a morning person myself" or "Monday can be tough!")
- Use casual language and contractions ("I'm," "you're," "that's," "what's")
- Show genuine interest in their answers - don't just ask and move on

Take 2-3 minutes for this natural conversation. Let it flow organically. When it feels natural, transition with something like:
- "Well, I'm really excited to learn more about you and your background..."
- "This has been great getting to know you a bit! So let's dive into..."
- "I love that! Okay, so let's talk about your experience..."

Remember: Be genuinely human, not scripted. Listen actively and respond like a real person having a real conversation would.`;
            
            clientRef.current?.createResponse(veryHumanSmallTalkInstruction);
          }
        }, 1000);
        
        // Auto-start audio recording in voice mode
        if (setup.interviewMode === 'voice') {
          setTimeout(() => {
            clientRef.current?.startAudioRecording();
          }, 1500); // Slightly longer delay to ensure connection is fully ready
        }
      });

      clientRef.current.on('connection.closed', () => {
        setStatus('idle');
      });

      clientRef.current.on('error', (error: Error) => {
        const errorMessage = error.message || 'Connection error';
        console.error('[Realtime] Connection Error:', error);
        setError(errorMessage);
        onError?.(errorMessage);
      });

      clientRef.current.on('transcript.update', (chunk: TranscriptChunk) => {
        if (chunk.speaker === 'user') {
          handleUserTranscript(chunk.text, !chunk.isPartial);
        } else if (chunk.speaker === 'assistant') {
          // Use handleAssistantResponse for AI text, which manages buffering
          handleAssistantResponse(chunk.text, !chunk.isPartial);
        }

        // Save complete chunks to the database
        if (!chunk.isPartial) {
          handleCompleteTranscriptChunk(chunk);
        }
      });

      clientRef.current.on('input_audio_buffer.speech_started', () => {
        setSpeakerStatus('user', true);
        if (questionTimestampRef.current) {
          const responseTime = (Date.now() - questionTimestampRef.current) / 1000;
          responseTimesRef.current.push(responseTime);
          questionTimestampRef.current = null; // Reset for next question
        }
        // Handle interruption - stop AI audio playback
        if (clientRef.current) {
          clientRef.current.stopPlayback();
        }
      });

      clientRef.current.on('input_audio_buffer.speech_stopped', () => {
        setSpeakerStatus('user', false);
      });

      clientRef.current.on('response.created', () => {
        setSpeakerStatus('ai', true);
      });

      clientRef.current.on('response.done', () => {
        setSpeakerStatus('ai', false);
        // Finalize any buffered text for the assistant's response
        handleAssistantResponse('', true);
      });

      clientRef.current.on('response.audio.delta', (event: any) => {
        // Store audio chunks for voice analysis
        if (event.delta) {
          // Audio delta is handled by the OpenAI client internally
          // We'll retrieve audio chunks directly from the client when needed
        }
      });

      clientRef.current.on('input_audio_buffer.committed', () => {
        // User audio is committed, we can analyze it
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize client';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [
    setup, 
    mediaStream, 
    generateAdaptiveInstructions, 
    onError, 
    focusedType, 
    setStatus, 
    setError, 
    setDuration, 
    setSpeakerStatus, 
    handleAssistantResponse, 
    handleUserTranscript,
    handleCompleteTranscriptChunk
  ]);

  // Start timer
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, [setDuration]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Parse transcript into structured Q&A pairs for analysis
  const parseTranscriptIntoQAPairs = useCallback(async (transcriptChunks: TranscriptChunk[]) => {
    const questions: Array<{ id: string; text: string; category: string; type?: string }> = [];
    const responses: Array<{ questionId: string; response: string; analysis: any }> = [];

    const SMALL_TALK_PHRASES = [
      'how are you',
      "how's your day",
      'your day been',
      'what’s up',
      'how have you been'
    ];

    const classifyQuestion = (text: string, index: number): string => {
      const q = text.toLowerCase();
      if (index < 2 && SMALL_TALK_PHRASES.some(p => q.includes(p))) {
        return 'small_talk';
      }
      if (/tell me about|describe a time|give me an example|have you ever|situation|challenge|conflict|time when/.test(q)) {
        return 'behavioral';
      }
      if (/technical|code|algorithm|programming|data structure|complexity|system design/.test(q)) {
        return 'technical';
      }
      if (/goal|future|career|plan|five year/.test(q)) {
        return 'goals';
      }
      if (/team|collaborat|coworker|work with others/.test(q)) {
        return 'teamwork';
      }
      if (/why do you want|company|culture|fit|values/.test(q)) {
        return 'fit';
      }
      return 'behavioral';
    };

    // Convert transcript chunks to text and group by speaker
    let currentQuestion = '';
    let currentQuestionId = '';
    let currentResponse = '';
    let isCollectingResponse = false;

    for (let i = 0; i < transcriptChunks.length; i++) {
      const chunk = transcriptChunks[i];

      if (chunk.speaker === 'assistant') {
        // If we were collecting a response, save it before starting new question
        if (isCollectingResponse && currentResponse.trim() && currentQuestionId) {
          const prevQuestion = questions.find(q => q.id === currentQuestionId);
          const analysis = await analyzeResponseWithAI(
            { text: currentQuestion, type: prevQuestion?.category || 'behavioral', id: `q${Date.now()}` },
            currentResponse.trim(),
            'jobType' in setup ? setup : {
              jobType: 'General',
              experienceLevel: 'Mid-level',
              industry: 'Technology',
              interviewMode: setup.interviewMode
            },
            [],
            focusedType || 'default'
          );
          responses.push({
            questionId: currentQuestionId,
            response: currentResponse.trim(),
            analysis
          });
          currentResponse = '';
          isCollectingResponse = false;
        }

        // Start new question
        currentQuestion = chunk.text.trim();
        currentQuestionId = `q_${questions.length + 1}_${Date.now()}`;

        const category = classifyQuestion(currentQuestion, questions.length);
        questions.push({
          id: currentQuestionId,
          text: currentQuestion,
          category,
          type: category
        });

      } else if (chunk.speaker === 'user' && currentQuestionId) {
        // Collect user response
        currentResponse += ' ' + chunk.text;
        isCollectingResponse = true;
      }
    }

    // Handle the last response if exists
    if (isCollectingResponse && currentResponse.trim() && currentQuestionId) {
      const prevQuestion = questions.find(q => q.id === currentQuestionId);
      const analysis = await analyzeResponseWithAI(
        { text: currentQuestion, type: prevQuestion?.category || 'behavioral', id: `q${Date.now()}` },
        currentResponse.trim(),
        'jobType' in setup ? setup : {
          jobType: 'General',
          experienceLevel: 'Mid-level',
          industry: 'Technology',
          interviewMode: setup.interviewMode
        },
        [],
        focusedType || 'default'
      );
      responses.push({
        questionId: currentQuestionId,
        response: currentResponse.trim(),
        analysis
      });
    }

    return { questions, responses };
  }, [setup, focusedType]);

  // Public interface methods
  const startInterview = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);
      // Generate session ID
      const newSessionId = `realtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      // Create realtime session in Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await createRealtimeSession({
            session_id: newSessionId,
            user_id: user.id,
            setup,
            interview_type: interviewType,
            start_time: new Date().toISOString(),
            status: 'active',
            model_type: 'gpt-4o-realtime-preview',
            total_duration: 0,
            question_count: 0
          });
        }
      } catch (supabaseError) {
        console.error('Failed to create realtime session in Supabase:', supabaseError);
        // Continue with interview even if Supabase fails
      }

      // Initialize and connect client
      initializeClient();
      await clientRef.current?.connect();
      // Interview will start after connection.opened event
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start interview';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [initializeClient, onError, setup, interviewType, setStatus, setError, setSessionId]);

  const pauseInterview = useCallback(async () => {
    if (clientRef.current?.isCurrentlyRecording()) {
      clientRef.current.stopAudioRecording();
    }
    setStatus('paused');
    setRecording(false);
    stopTimer();
    
    // Update session status in Supabase
    if (state.sessionId) {
      try {
        await updateRealtimeSession(state.sessionId, {
          status: 'paused',
          total_duration: state.duration,
          question_count: state.questionCount
        });
      } catch (supabaseError) {
        console.error('Failed to update realtime session status to paused:', supabaseError);
      }
    }
  }, [stopTimer, state.sessionId, state.duration, state.questionCount, setStatus, setRecording]);

  const resumeInterview = useCallback(async () => {
    setStatus('interviewing');
    startTimer();
    
    // Update session status in Supabase
    if (state.sessionId) {
      try {
        await updateRealtimeSession(state.sessionId, {
          status: 'active'
        });
      } catch (supabaseError) {
        console.error('Failed to update realtime session status to active:', supabaseError);
      }
    }
  }, [startTimer, state.sessionId, setStatus]);

  const getSpeechMetrics = useCallback(() => {
    return speechMetricsRef.current;
  }, []);

  const resetSpeechMetrics = useCallback(() => {
    speechMetricsRef.current = [];
  }, []);

  const processVoiceAnalytics = useCallback(async (): Promise<SpeechMetricEntry[] | null> => {
    if (setup.interviewMode !== 'voice' || !clientRef.current) {
      return null;
    }

    try {
      const allAudioChunks = clientRef.current.getAllAudioChunks();
      if (allAudioChunks.length === 0) {
        console.warn('No audio chunks recorded for post-interview analysis.');
        return null;
      }

      // Combine all ArrayBuffer chunks into a single Float32Array
      const totalLength = allAudioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
      const combinedBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of allAudioChunks) {
        combinedBuffer.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }
      const combinedPcm = new Float32Array(combinedBuffer.buffer);

      // Convert the raw PCM data to a WAV file
      const fullAudioBlob = pcmToWav(combinedPcm, 16000); // Assuming 16kHz sample rate
      const fullTranscription = state.transcript.filter(t => t.speaker === 'user').map(t => t.text).join(' ');
      const duration = state.duration;

            const metrics = await extractSpeechMetrics(fullAudioBlob, fullTranscription, duration, responseTimesRef.current);

      return metrics ? [{ questionId: 'summary', metrics }] : [];
    } catch (error) {
      console.error('Error processing voice analytics:', error);
      return null;
    }
  }, [setup.interviewMode, state.transcript, state.duration]);

  const endInterview = useCallback(async () => {
    stopTimer();
    setStatus('processing');
    
    try {
      let voiceMetrics: SpeechMetricEntry[] | null = null;
      let voiceTimeline: VoiceTimelinePoint[] = [];
      try {
        voiceMetrics = await processVoiceAnalytics();
      } catch (error) {
        console.error('Error during voice analytics processing:', error);
        // Continue without voice metrics if processing fails
      }

      // --- Voice Timeline Metrics Extraction ---
      if (setup.interviewMode === 'voice' && clientRef.current) {
        const allAudioChunks = clientRef.current.getAllAudioChunks();
        const sampleRate = 24000;
        // Flatten all audio chunks into a single Float32Array
        let totalSamples = 0;
        for (const arr of allAudioChunks) totalSamples += arr.byteLength / 2;
        const fullAudio = new Float32Array(totalSamples);
        let offset = 0;
        for (const arr of allAudioChunks) {
          const view = new DataView(arr);
          for (let i = 0; i < arr.byteLength; i += 2) {
            fullAudio[offset++] = view.getInt16(i, true) / 32768;
          }
        }
        // Interview start time
        const interviewStart = startTimeRef.current ? startTimeRef.current.getTime() : (voiceTimelineSegmentsRef.current[0]?.startTimestamp || 0);
        // If >5 segments, use per-response segmentation
        if (voiceTimelineSegmentsRef.current.length > 5) {
          for (const segment of voiceTimelineSegmentsRef.current) {
            const segStartSec = (segment.startTimestamp - interviewStart) / 1000;
            const segEndSec = (segment.endTimestamp - interviewStart) / 1000;
            const startSample = Math.max(0, Math.floor(segStartSec * sampleRate));
            const endSample = Math.min(fullAudio.length, Math.ceil(segEndSec * sampleRate));
            const segmentAudio = fullAudio.slice(startSample, endSample);
            const segmentBlob = pcmToWav(segmentAudio, sampleRate);
            let metrics = null;
            try {
              metrics = await extractSpeechMetrics(segmentBlob, segment.transcript, segEndSec - segStartSec);
              if (metrics && typeof metrics.duration === 'undefined') {
                metrics.duration = segEndSec - segStartSec;
              }
            } catch (err) {
              console.error('Failed to extract metrics for segment', segment, err);
            }
            if (metrics) {
              metrics = { ...metrics, duration: segEndSec - segStartSec } as import('../utils/speechAnalysis').VoiceMetrics;
              let feedback: ActionableFeedback = {
                overall: '', strengths: [], improvements: [], specificTips: [], score: 0, category: 'fair'
              };
              try {
                feedback = generateActionableFeedback(metrics, segment.transcript, segment.questionContext);
              } catch {}
              voiceTimeline.push({
                timestamp: segment.endTimestamp,
                metrics,
                feedback,
                questionContext: segment.questionContext
              });
            }
          }
        } else {
          // <=5 segments: segment into 5-second windows
          // Gather all user transcript chunks
          const allUserChunks = state.transcript.filter((c: any) => c.speaker === 'user');
          if (!allUserChunks.length) return;
          const firstTs = allUserChunks[0].timestamp;
          const lastTs = allUserChunks[allUserChunks.length - 1].timestamp;
          const totalDurationSec = Math.ceil((lastTs - firstTs) / 1000);
          const numWindows = Math.max(1, Math.ceil(totalDurationSec / 5));
          for (let i = 0; i < numWindows; i++) {
            const windowStart = firstTs + i * 5000;
            const windowEnd = windowStart + 5000;
            // Get transcript in this window
            const windowChunks = allUserChunks.filter(c => c.timestamp >= windowStart && c.timestamp < windowEnd);
            if (!windowChunks.length) continue;
            const transcript = windowChunks.map(c => c.text).join(' ');
            const segStartSec = (windowStart - interviewStart) / 1000;
            const segEndSec = (windowEnd - interviewStart) / 1000;
            const startSample = Math.max(0, Math.floor(segStartSec * sampleRate));
            const endSample = Math.min(fullAudio.length, Math.ceil(segEndSec * sampleRate));
            const segmentAudio = fullAudio.slice(startSample, endSample);
            const segmentBlob = pcmToWav(segmentAudio, sampleRate);
            let metrics = null;
            try {
              metrics = await extractSpeechMetrics(segmentBlob, transcript, segEndSec - segStartSec);
              if (metrics && typeof metrics.duration === 'undefined') {
                metrics.duration = segEndSec - segStartSec;
              }
            } catch (err) {
              console.error('Failed to extract metrics for 5s segment', err);
            }
            if (metrics) {
              metrics = { ...metrics, duration: segEndSec - segStartSec } as import('../utils/speechAnalysis').VoiceMetrics;
              let feedback: ActionableFeedback = {
                overall: '', strengths: [], improvements: [], specificTips: [], score: 0, category: 'fair'
              };
              try {
                feedback = generateActionableFeedback(metrics, transcript, undefined);
              } catch {}
              voiceTimeline.push({
                timestamp: windowEnd,
                metrics,
                feedback,
                questionContext: undefined
              });
            }
          }
        }
      }
      // --- End Voice Timeline Metrics Extraction ---

      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      
      setStatus('completed');
      
      // Update realtime session in Supabase with final data
      if (state.sessionId) {
        try {
          await updateRealtimeSession(state.sessionId, {
            end_time: new Date().toISOString(),
            status: 'completed',
            total_duration: state.duration,
            question_count: state.questionCount
          });

          // Parse transcript into structured Q&A pairs for analysis
          const { questions, responses } = await parseTranscriptIntoQAPairs(state.transcript);
          
          // Calculate overall score from responses
          const overallScore = responses.length > 0 
            ? Math.round(responses.reduce((sum: number, r: any) => sum + r.analysis.score, 0) / responses.length * 10)
            : 70;
          
          // Prepare session data for completion
          const finalSpeechMetrics = voiceMetrics || getSpeechMetrics();
          
          const sessionData = {
            sessionId: state.sessionId,
            setup,
            transcript: state.transcript,
            duration: state.duration,
            questionCount: state.questionCount,
            questionsAnswered: responses.length,
            overallScore,
            questions, // Add structured questions
            responses, // Add structured responses with analysis
            interviewType,
            focusedType,
            completedAt: new Date().toISOString(),
            speechMetrics: finalSpeechMetrics,
            voice_metrics_summary: finalSpeechMetrics.length > 0 ? finalSpeechMetrics[0].metrics : null,
            responseTimes: responseTimesRef.current,
            voiceTimeline // <-- Add the timeline here
          };

          // Save structured interview data for viewing in recent interviews
          try {
            await saveRealtimeInterviewSession(sessionData);
          } catch (saveError) {
            console.error('Failed to save realtime interview session:', saveError);
            // Continue even if save fails
          }

          onComplete?.(sessionData);
        } catch (supabaseError) {
          console.error('Failed to update realtime session in Supabase:', supabaseError);
          // Continue with completion even if Supabase fails
          const fallbackData = {
            sessionId: state.sessionId,
            setup,
            transcript: state.transcript,
            duration: state.duration,
            questionCount: state.questionCount,
            interviewType,
            focusedType,
            completedAt: new Date().toISOString(),
            speechMetrics: getSpeechMetrics(),
            voiceTimeline
          };
          
          onComplete?.(fallbackData);
        }
      } else {
        console.warn('No session ID found, calling onComplete with minimal data...');
        const minimalData = {
          setup,
          transcript: state.transcript,
          duration: state.duration,
          questionCount: state.questionCount,
          interviewType,
          focusedType,
          completedAt: new Date().toISOString(),
          speechMetrics: getSpeechMetrics(),
          voiceTimeline
        };
        
        onComplete?.(minimalData);
      }
    } catch (error) {
      console.error('Unhandled error in endInterview, calling onComplete with fallback data to prevent UI freeze:', error);
      const fallbackData = {
        setup,
        transcript: state.transcript,
        duration: state.duration,
        questionCount: state.questionCount,
        interviewType,
        focusedType,
        completedAt: new Date().toISOString(),
        speechMetrics: getSpeechMetrics(),
        error: 'An unexpected error occurred during interview finalization.',
        voiceTimeline: []
      };
      
      onComplete?.(fallbackData);
    }
  }, [state.sessionId, state.transcript, state.duration, state.questionCount, setup, interviewType, focusedType, onComplete, stopTimer, setStatus, getSpeechMetrics, processVoiceAnalytics]);

  const startRecording = useCallback(async () => {
    if (!clientRef.current || state.status !== 'interviewing') {
      return false;
    }

    try {
      const started = await clientRef.current.startAudioRecording();
      if (started) {
        setRecording(true);
      }
      return started;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }, [state.status, setRecording]);

  const stopRecording = useCallback(() => {
    if (!clientRef.current) {
      return;
    }

    clientRef.current.stopAudioRecording();
    setRecording(false);
  }, [setRecording]);

  const sendTextMessage = useCallback((message: string) => {
    if (!clientRef.current || !message.trim()) {
      return;
    }

    clientRef.current.sendUserMessage(message);
    
    // Manually add user message to transcript for text-based interviews
    if (setup.interviewMode === 'text') {
        const userChunk: TranscriptChunk = {
            id: `user-text-${generateUUID()}`,
            speaker: 'user',
            text: message,
            timestamp: Date.now(),
            isPartial: false,
        };
        processTranscriptChunk(userChunk);
        handleCompleteTranscriptChunk(userChunk);
    }
  }, [setup.interviewMode, processTranscriptChunk, handleCompleteTranscriptChunk]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Reset voice analysis
      resetSpeechMetrics();
    };
  }, [resetSpeechMetrics]);

  return {
    state,
    client: clientRef.current,
    maxDuration, // Export the duration limit
    startInterview,
    pauseInterview,
    resumeInterview,
    endInterview,
    startRecording,
    stopRecording,
    sendTextMessage,
    getSpeechMetrics,
    resetSpeechMetrics
  };
}