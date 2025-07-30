import { useEffect, useCallback, useRef } from 'react';
import { OpenAIRealtimeClient, TranscriptChunk, RealtimeConfig } from '../utils/openaiRealtime';
import { buildAdaptiveSystemPrompt, AdaptivePromptOptions, buildFollowUpPrompt, extractKeyTopics, getFocusedInterviewPrompt, getPersonalizedOpeningQuestion } from '../utils/promptTemplates';
import { InterviewSetup } from '../types/interview';
import { createRealtimeSession, updateRealtimeSession, saveTranscriptChunk, saveRealtimeInterviewSession, saveBehavioralInsight, saveBehavioralSummary, calculateBehavioralSummary } from '../utils/supabase-interview';
import { supabase } from '../lib/supabase';
import { useInterviewState } from './useInterviewState';
import { extractSpeechMetrics, analyzeResponse as analyzeResponseWithAI } from '../utils/openai';
import { pcmToWav } from '../utils/audio';
import { VoiceTimelinePoint } from '../utils/speechAnalysis';
import { usePostureAnalysis } from './usePostureAnalysis';

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
  setup: InterviewSetup & {
    interviewMode?: 'voice' | 'text';
  };
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
      return 30; // 30 minutes for standard interviews - more time for deep questions

    case 'focused':
      return 20;  // 20 minutes for focused interviews - enough for proper evaluation
    default:
      return 25; // Default fallback - adequate time for thorough interview
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
  // CV metrics for body posture, eye contact, hand movement, fidgeting
  const cvTimelineRef = useRef<Array<{
    timestamp: string;
    posture_score: number;
    eye_contact: boolean;
    hand_movement_score: number;
    fidgeting_score: number;
  }>>([]);
  const cvSummaryRef = useRef<{
    avgPosture: number;
    percentEyeContact: number;
    avgHandMovement: number;
    avgFidgeting: number;
    keyEvents: Array<{ type: string; timestamp: string }>;
  } | null>(null);
  const questionTimestampRef = useRef<number | null>(null);
  const responseTimesRef = useRef<number[]>([]);
  // Add a ref to store per-response segments for the voice timeline
  const voiceTimelineSegmentsRef = useRef<Array<{
    transcript: string;
    startTimestamp: number;
    endTimestamp: number;
    questionContext?: string;
  }>>([]);
const { startAnalysis, fetchAnalysisResult, fetchTimelineData } = usePostureAnalysis();
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

  // 🧠 INSANE BEHAVIORAL ANALYSIS: Enhanced AI Interviewer Behavior
  const updateInterviewerBehavior = useCallback((
    candidateResponse: string,
    estimatedScore: number = 5,
    responseTime: number = 0
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

    // 🧠 SOPHISTICATED BEHAVIORAL ANALYSIS
    const recentContext = candidateResponsesRef.current.slice(-2).join(' ');
    const candidateStrengths = extractKeyTopics(recentContext).split(', ').filter(s => s.length > 0);
    const areasOfInterest = extractKeyTopics(recentContext);
    const performanceLevel = overallPerformance <= 4 ? 'struggling' : overallPerformance >= 7 ? 'excellent' : 'moderate';

    // 🧠 ADVANCED BEHAVIORAL INSIGHTS FOR RESULTS
    const behavioralInsights = {
      response: candidateResponse,
      score: estimatedScore,
      responseTime: responseTime,
      confidence: analyzeConfidence(candidateResponse),
      engagement: analyzeEngagement(candidateResponse),
      communicationStyle: analyzeCommunicationStyle(candidateResponse),
      stressIndicators: analyzeStressIndicators(candidateResponse),
      timestamp: Date.now(),
      questionContext: currentQuestionRef.current || 'Unknown question'
    };

    // Store behavioral insights for results/feedback
    if (!(window as any).behavioralInsights) {
      (window as any).behavioralInsights = [];
    }
    (window as any).behavioralInsights.push(behavioralInsights);

    // Save behavioral insight to Supabase
    if (state.sessionId) {
      saveBehavioralInsight({
        session_id: state.sessionId,
        response: candidateResponse,
        score: estimatedScore,
        response_time: responseTime,
        confidence: behavioralInsights.confidence,
        engagement: behavioralInsights.engagement,
        communication_style: behavioralInsights.communicationStyle,
        stress_indicators: behavioralInsights.stressIndicators,
        question_context: behavioralInsights.questionContext,
        timestamp: behavioralInsights.timestamp
      }).catch(error => {
        console.error('Failed to save behavioral insight:', error);
      });
    }

    // Generate sophisticated follow-up prompt
    const followUpPrompt = buildFollowUpPrompt(
      recentContext,
      candidateStrengths,
      areasOfInterest,
      performanceLevel
    );

    // Update the system prompt with sophisticated behavioral model
    const updatedInstructions = generateAdaptiveInstructions(
      state.questionCount + 1,
      duration,
      recentScores,
      overallPerformance
    );

    // Send the updated instructions to the AI
    if (clientRef.current) {
      clientRef.current.updateSystemPrompt(updatedInstructions);
      
      // Send sophisticated behavioral context for next question
      setTimeout(() => {
        clientRef.current?.sendUserMessage(
          `[SOPHISTICATED BEHAVIORAL CONTEXT: ${followUpPrompt}]`
        );
      }, 500);
    }
  }, [generateAdaptiveInstructions, state.questionCount]);

  // 🧠 BEHAVIORAL ANALYSIS HELPER FUNCTIONS
  const analyzeConfidence = (response: string): 'high' | 'medium' | 'low' => {
    const confidenceWords = ['definitely', 'absolutely', 'certainly', 'clearly', 'obviously', 'without a doubt'];
    const hesitationWords = ['um', 'uh', 'well', 'maybe', 'i think', 'probably', 'sort of', 'kind of', 'i guess', 'not sure', 'hmm'];
    
    const hasConfidence = confidenceWords.some(word => response.toLowerCase().includes(word));
    const hasHesitation = hesitationWords.some(word => response.toLowerCase().includes(word));
    
    if (hasConfidence && !hasHesitation) return 'high';
    if (hasHesitation && !hasConfidence) return 'low';
    return 'medium';
  };

  const analyzeEngagement = (response: string): 'high' | 'medium' | 'low' => {
    const positiveWords = ['excited', 'love', 'passionate', 'great', 'amazing', 'wonderful', 'fantastic', 'interesting'];
    const positiveCount = positiveWords.filter(word => response.toLowerCase().includes(word)).length;
    const hasExclamation = response.includes('!');
    const wordCount = response.split(' ').length;
    
    if (positiveCount > 2 || hasExclamation) return 'high';
    if (positiveCount > 0 || wordCount > 30) return 'medium';
    return 'low';
  };

  const analyzeCommunicationStyle = (response: string): 'structured' | 'conversational' | 'formal' | 'casual' => {
    const hasStructure = response.includes('.') && response.includes(',');
    const isFormal = response.includes('therefore') || response.includes('furthermore') || response.includes('additionally');
    const isCasual = response.includes('you know') || response.includes('like') || response.includes('basically');
    
    if (isFormal) return 'formal';
    if (isCasual) return 'casual';
    if (hasStructure) return 'structured';
    return 'conversational';
  };

  const analyzeStressIndicators = (response: string): boolean => {
    const hesitationWords = ['um', 'uh', 'well', 'maybe', 'i think', 'probably', 'sort of', 'kind of', 'i guess', 'not sure', 'hmm'];
    const hasHesitation = hesitationWords.some(word => response.toLowerCase().includes(word));
    const wordCount = response.split(' ').length;
    const hasStressWords = response.toLowerCase().includes('nervous') || response.toLowerCase().includes('stress');
    
    return hasHesitation || wordCount < 10 || hasStressWords;
  };

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

    // 🧠 SOPHISTICATED BEHAVIORAL ANALYSIS for user responses
    if (chunk.speaker === 'user' && chunk.text.trim().length > 10) {
      const responseLength = chunk.text.split(' ').length;
      const hasKeywords = ['experience', 'project', 'team', 'challenge', 'solution'].some(
        keyword => chunk.text.toLowerCase().includes(keyword)
      );
      const estimatedScore = Math.min(10, Math.max(3, 
        (responseLength > 20 ? 7 : 5) + (hasKeywords ? 2 : 0)
      ));
      
      // Calculate response time for sophisticated analysis
      const responseTime = questionTimestampRef.current ? 
        (Date.now() - questionTimestampRef.current) / 1000 : 0;
      
      updateInterviewerBehavior(chunk.text, estimatedScore, responseTime);

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
            // For regular interviews, use professional direct approach
            const professionalOpeningInstruction = `You are conducting a professional interview tailored specifically for a ${setup.experienceLevel} ${setup.jobType} candidate in the ${setup.industry} industry. Start immediately with this personalized greeting:

"Hi, I'm [Interviewer Name] from Kelv AI. Thank you for joining us today for this ${setup.experienceLevel} ${setup.jobType} interview in the ${setup.industry} industry. I'll be conducting a comprehensive evaluation covering your background, technical skills, and behavioral experiences relevant to ${setup.jobType} roles. Let's begin."

Then immediately ask your first substantive question tailored to their specific profile:

${getPersonalizedOpeningQuestion(setup.jobType, setup.experienceLevel, setup.industry)}

CRITICAL INSTRUCTIONS - TAILORED EVALUATION:
- NO small talk or casual conversation
- NO questions about energy levels, feelings, or personal life  
- Get straight to professional evaluation tailored to ${setup.experienceLevel} ${setup.jobType} in ${setup.industry}
- This is a ${maxDuration}-minute interview - every minute counts
- You must cover: Background (2-3 min) → Technical (8-10 min) → Behavioral (8-10 min) → Situational (5-7 min)
- Ask ${setup.experienceLevel}-appropriate questions with ${setup.industry}-specific context
- Focus on ${setup.jobType}-relevant competencies and experiences
- Don't accept surface-level answers - probe for specific examples
- This is a professional evaluation, not a friendly chat

Begin the interview now with professional authority and focus on ${setup.jobType}-specific substantive questions.`;
            
            clientRef.current?.createResponse(professionalOpeningInstruction);
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
        console.log(`[Realtime] Transcript Update (${chunk.speaker}):`, chunk);
        
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
        console.log('[Realtime] Response Done (AI)');
        setSpeakerStatus('ai', false);
        // Finalize any buffered text for the assistant's response
        handleAssistantResponse('', true);
      });

      clientRef.current.on('response.audio.delta', (event: any) => {
        // Store audio chunks for voice analysis
        if (event.delta) {
          // Audio delta is handled by the OpenAI client internally
          // We'll retrieve audio chunks directly from the client when needed
          console.log('Audio delta received from assistant');
        }
      });

      clientRef.current.on('input_audio_buffer.committed', () => {
        // User audio is committed, we can analyze it
        console.log('[Realtime] User audio committed');
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
    const questions: Array<{ id: string; text: string; category: string }> = [];
    const responses: Array<{ questionId: string; response: string; analysis: any }> = [];
    
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
          try {
            // Add timeout to prevent hanging
            const analysisPromise = analyzeResponseWithAI(
              { text: currentQuestion, type: 'behavioral', id: `q${Date.now()}` },
              currentResponse.trim(),
              {
                jobType: 'jobType' in setup ? setup.jobType : 'General',
                experienceLevel: 'experienceLevel' in setup ? setup.experienceLevel : 'Mid-level',
                industry: 'industry' in setup ? setup.industry : 'Technology',
                interviewMode: 'interviewMode' in setup ? setup.interviewMode : 'voice'
              },
              [],
              focusedType || 'default'
            );
            
            // Add 10-second timeout to prevent hanging
            const analysis = await Promise.race([
              analysisPromise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Analysis timeout')), 30000)
              )
            ]);
            
            responses.push({
              questionId: currentQuestionId,
              response: currentResponse.trim(),
              analysis: analysis
            });
          } catch (error) {
            console.error('Failed to analyze response:', error);
            // Add a default analysis to prevent breaking the flow
            responses.push({
              questionId: currentQuestionId,
              response: currentResponse.trim(),
              analysis: {
                score: 7,
                clarity: 7,
                relevance: 7,
                depth: 7,
                confidence: 7,
                structure: 7,
                strengths: ['Response provided'],
                improvements: ['Could provide more detail'],
                overall: 'Good response with room for improvement'
              }
            });
          }
          currentResponse = '';
          isCollectingResponse = false;
        }
        
        // Start new question
        currentQuestion = chunk.text.trim();
        currentQuestionId = `q_${questions.length + 1}_${Date.now()}`;
        
        // Determine category based on question content
        let category = 'behavioral';
        const questionLower = currentQuestion.toLowerCase();
        if (questionLower.includes('technical') || questionLower.includes('code') ||
            questionLower.includes('algorithm') || questionLower.includes('programming')) {
          category = 'technical';
        } else if (questionLower.includes('situation') || questionLower.includes('challenge') ||
                   questionLower.includes('conflict') || questionLower.includes('time when')) {
          category = 'situational';
        } else if (questionLower.includes('goal') || questionLower.includes('future') ||
                   questionLower.includes('career') || questionLower.includes('plan')) {
          category = 'goals';
        } else if (questionLower.includes('team') || questionLower.includes('collaboration')) {
          category = 'teamwork';
        }
        
        questions.push({
          id: currentQuestionId,
          text: currentQuestion,
          category: category
        });
        
      } else if (chunk.speaker === 'user' && currentQuestionId) {
        // Collect user response
        currentResponse += ' ' + chunk.text;
        isCollectingResponse = true;
      }
    }
    
    // Handle the last response if exists
    if (isCollectingResponse && currentResponse.trim() && currentQuestionId) {
      try {
        // Add timeout to prevent hanging
        const analysisPromise = analyzeResponseWithAI(
          { text: currentQuestion, type: 'behavioral', id: `q${Date.now()}` },
          currentResponse.trim(),
          {
            jobType: 'jobType' in setup ? setup.jobType : 'General',
            experienceLevel: 'experienceLevel' in setup ? setup.experienceLevel : 'Mid-level',
            industry: 'industry' in setup ? setup.industry : 'Technology',
            interviewMode: 'interviewMode' in setup ? setup.interviewMode : 'voice'
          },
          [],
          focusedType || 'default'
        );
        
        // Add 10-second timeout to prevent hanging
        const analysis = await Promise.race([
          analysisPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analysis timeout')), 30000)
          )
        ]);
        
        responses.push({
          questionId: currentQuestionId,
          response: currentResponse.trim(),
          analysis: analysis
        });
      } catch (error) {
        console.error('Failed to analyze final response:', error);
        // Add a default analysis to prevent breaking the flow
        responses.push({
          questionId: currentQuestionId,
          response: currentResponse.trim(),
          analysis: {
            score: 7,
            clarity: 7,
            relevance: 7,
            depth: 7,
            confidence: 7,
            structure: 7,
            strengths: ['Response provided'],
            improvements: ['Could provide more detail'],
            overall: 'Good response with room for improvement'
          }
        });
      }
    }
    
    return { questions, responses };
  }, []);

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
      if (state.sessionId) {
  console.log('Starting computer vision analysis for session:', state.sessionId);
  startAnalysis(state.sessionId, (window as any).videoUrl || '');
}
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

      console.log('Processing voice analytics post-interview...');
            const metrics = await extractSpeechMetrics(fullAudioBlob, fullTranscription, duration, responseTimesRef.current);

      console.log('Post-interview voice metrics:', metrics);
      return metrics ? [{ questionId: 'summary', metrics }] : [];
    } catch (error) {
      console.error('Error processing voice analytics:', error);
      return null;
    }
  }, [setup.interviewMode, state.transcript, state.duration]);

  const endInterview = useCallback(async () => {
    console.log('Ending realtime interview...');
    stopTimer();
    setStatus('processing');

    // Add a timeout to the entire endInterview process
    const endInterviewTimeout = setTimeout(() => {
      console.error('End interview process timed out after 45 seconds');
      // Force completion with fallback data
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
        voiceTimeline: [],
        behavioralInsights: (window as any).behavioralInsights || [],
        behavioralSummary: null
      };
      onComplete?.(fallbackData);
    }, 45000);

    try {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      setStatus('completed');

      // Run analytics in parallel with explicit types
      type VoiceResult = { voiceMetrics: SpeechMetricEntry[] | null; voiceTimeline: VoiceTimelinePoint[] };
      type QAResult = { questions: any[]; responses: any[] };
      type BehavioralResult = { behavioralSummary: any };
      type CVResult = { cvSummary: any; cvTimeline: any[] };

      const analyticsPromises: [Promise<VoiceResult>, Promise<QAResult>, Promise<BehavioralResult>, Promise<CVResult>] = [
        // Voice analytics
        (async () => {
          let voiceMetrics: SpeechMetricEntry[] | null = null;
          let voiceTimeline: VoiceTimelinePoint[] = [];
          if (setup.interviewMode === 'voice' && clientRef.current) {
            const allAudioChunks = clientRef.current.getAllAudioChunks();
            if (allAudioChunks.length > 0) {
              try {
                voiceMetrics = await processVoiceAnalytics();
                if (voiceTimelineSegmentsRef.current.length > 0) {
                  const segmentsToProcess = voiceTimelineSegmentsRef.current.slice(0, 3);
                  for (const segment of segmentsToProcess) {
                    try {
                      const duration = (segment.endTimestamp - segment.startTimestamp) / 1000;
                      const wordCount = segment.transcript.split(' ').length;
                      const wordsPerMinute = (wordCount / duration) * 60;
                      const metrics: import('../utils/speechAnalysis').VoiceMetrics = {
                        speechRate: wordsPerMinute,
                        fluencyScore: Math.min(100, Math.max(0, (wordCount / duration) * 20)),
                        voiceConfidence: Math.min(100, Math.max(0, wordCount * 2)),
                        deliveryScore: Math.min(100, Math.max(0, duration * 10)),
                        clarityScore: Math.min(100, Math.max(0, wordsPerMinute * 2)),
                        fillerWordCount: 0,
                        pauseAnalysis: { averagePauseLength: 0.5, pauseFrequency: 2, strategicPauses: 1 },
                        pitchAnalysis: { averagePitch: 220, pitchVariation: 50, pitchStability: 80 },
                        energyAnalysis: { averageEnergy: 0.7, energyConsistency: 0.8, dynamicRange: 0.6 },
                        timestamp: segment.endTimestamp,
                        duration: duration
                      };
                      const feedback: import('../utils/speechAnalysis').ActionableFeedback = {
                        overall: `Good response with ${wordCount} words in ${duration.toFixed(1)}s`,
                        strengths: ['Clear communication', 'Good pace'],
                        improvements: ['Could elaborate more'],
                        specificTips: ['Try to provide more specific examples'],
                        score: Math.round((metrics.fluencyScore + metrics.voiceConfidence + metrics.deliveryScore) / 3),
                        category: 'good'
                      };
                      voiceTimeline.push({
                        timestamp: segment.endTimestamp,
                        metrics,
                        feedback,
                        questionContext: segment.questionContext
                      });
                    } catch (err) {
                      console.error('Failed to process voice timeline segment:', err);
                    }
                  }
                }
              } catch (error) {
                console.error('Error during voice analytics processing:', error);
              }
            }
          }
          return { voiceMetrics, voiceTimeline };
        })(),
        // Q&A parsing
        (async () => {
          let questions: any[] = [];
          let responses: any[] = [];
          try {
            const completionPromise = (async () => {
              const result = await parseTranscriptIntoQAPairs(state.transcript);
              return result;
            })();
            const result = await Promise.race([
              completionPromise,
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Completion timeout')), 60000))
            ]) as { questions: any[]; responses: any[] };
            questions = result.questions;
            responses = result.responses;
          } catch (error) {
            console.error('Failed to parse transcript into Q&A pairs:', error);
          }
          return { questions, responses };
        })(),
        // Behavioral summary
        (async () => {
          let behavioralSummary: any = null;
          try {
            const behavioralInsights = (window as any).behavioralInsights || [];
            if (behavioralInsights.length > 0) {
              behavioralSummary = calculateBehavioralSummary(behavioralInsights);
              if (state.sessionId) {
                await saveBehavioralSummary({ session_id: state.sessionId, ...behavioralSummary });
              }
            }
          } catch (behavioralError) {
            console.error('Failed to calculate/save behavioral summary:', behavioralError);
          }
          return { behavioralSummary };
        })(),
        // CV metrics
        (async () => {
          let cvSummary: any = null;
          let cvTimeline: any[] = [];
          try {
            const analysisResult = state.sessionId ? await fetchAnalysisResult(state.sessionId) : null;
            const timelineData = state.sessionId ? await fetchTimelineData(state.sessionId) : [];
            cvSummary = analysisResult ? {
              avgPosture: analysisResult.avg_posture_score,
              percentEyeContact: analysisResult.eye_contact_percentage,
              avgHandMovement: analysisResult.avg_hand_movement_score,
              avgFidgeting: analysisResult.avg_fidgeting_score,
              keyEvents: analysisResult.top_posture_moments?.map((moment: any) => ({ type: moment.description, timestamp: moment.timestamp })) || []
            } : null;
            cvTimeline = timelineData ? timelineData.map((point: any) => ({
              timestamp: point.timestamp_ms.toString(),
              posture_score: point.posture_score,
              eye_contact: point.eye_contact,
              hand_movement_score: point.hand_movement_score,
              fidgeting_score: point.fidgeting_score
            })) : [];
          } catch (cvError) {
            console.error('Failed to fetch CV metrics:', cvError);
          }
          return { cvSummary, cvTimeline };
        })()
      ];

      // Wait for all analytics (with Promise.allSettled to avoid blocking on any single failure)
      const [voiceResultRaw, qaResultRaw, behavioralResultRaw, cvResultRaw] = await Promise.allSettled(analyticsPromises).then(results => results.map(r => (r.status === 'fulfilled' ? r.value : undefined)));

      // Type guards for each result
      const voiceResult: VoiceResult = (voiceResultRaw && typeof voiceResultRaw === 'object' && 'voiceMetrics' in voiceResultRaw && 'voiceTimeline' in voiceResultRaw)
        ? voiceResultRaw as VoiceResult : { voiceMetrics: getSpeechMetrics(), voiceTimeline: [] };
      const qaResult: QAResult = (qaResultRaw && typeof qaResultRaw === 'object' && 'questions' in qaResultRaw && 'responses' in qaResultRaw)
        ? qaResultRaw as QAResult : { questions: [], responses: [] };
      const behavioralResult: BehavioralResult = (behavioralResultRaw && typeof behavioralResultRaw === 'object' && 'behavioralSummary' in behavioralResultRaw)
        ? behavioralResultRaw as BehavioralResult : { behavioralSummary: null };
      const cvResult: CVResult = (cvResultRaw && typeof cvResultRaw === 'object' && 'cvSummary' in cvResultRaw && 'cvTimeline' in cvResultRaw)
        ? cvResultRaw as CVResult : { cvSummary: null, cvTimeline: [] };

      // Compose session data
      const voiceMetrics = voiceResult.voiceMetrics || getSpeechMetrics();
      const voiceTimeline = voiceResult.voiceTimeline || [];
      const questions = qaResult.questions || [];
      const responses = qaResult.responses || [];
      const behavioralSummary = behavioralResult.behavioralSummary || null;
      const cvSummary = cvResult.cvSummary || null;
      const cvTimeline: any[] = cvResult.cvTimeline || [];

      // Calculate overall score from responses
      const overallScore = responses.length > 0 
        ? Math.round(responses.reduce((sum: number, r: any) => sum + (r.analysis?.score || 7), 0) / responses.length * 10)
        : 70;

      // Calculate consistent voice metrics summary from timeline data
      let voiceMetricsSummary = null;
      if (voiceTimeline && voiceTimeline.length > 0) {
        const allMetrics = voiceTimeline.map((point: any) => point.metrics);
        voiceMetricsSummary = {
          speechRate: Math.round(allMetrics.reduce((sum: any, m: any) => sum + (m.speechRate || 0), 0) / allMetrics.length),
          fluencyScore: Math.round(allMetrics.reduce((sum: any, m: any) => sum + (m.fluencyScore || 0), 0) / allMetrics.length),
          voiceConfidence: Math.round(allMetrics.reduce((sum: any, m: any) => sum + (m.voiceConfidence || 0), 0) / allMetrics.length),
          deliveryScore: Math.round(allMetrics.reduce((sum: any, m: any) => sum + (m.deliveryScore || 0), 0) / allMetrics.length),
          clarityScore: Math.round(allMetrics.reduce((sum: any, m: any) => sum + (m.clarityScore || 0), 0) / allMetrics.length),
          fillerWordCount: Math.round(allMetrics.reduce((sum: any, m: any) => sum + (m.fillerWordCount || 0), 0) / allMetrics.length),
          fluency: Math.round(allMetrics.reduce((sum: any, m: any) => sum + ((m as any).fluency || 0), 0) / allMetrics.length),
          delivery: Math.round(allMetrics.reduce((sum: any, m: any) => sum + ((m as any).delivery || 0), 0) / allMetrics.length),
          clarity: Math.round(allMetrics.reduce((sum: any, m: any) => sum + ((m as any).clarity || 0), 0) / allMetrics.length)
        };
      } else if (voiceMetrics.length > 0) {
        voiceMetricsSummary = voiceMetrics[0].metrics;
      }

      // Aggregate actionable feedback from voiceTimeline
      let voiceRecommendations = null;
      if (voiceTimeline && voiceTimeline.length > 0) {
        const allImprovements = Array.from(new Set(voiceTimeline.flatMap((pt: any) => pt.feedback.improvements || [])));
        const allStrengths = Array.from(new Set(voiceTimeline.flatMap((pt: any) => pt.feedback.strengths || [])));
        const allSpecificTips = Array.from(new Set(voiceTimeline.flatMap((pt: any) => pt.feedback.specificTips || [])));
        let summary = '';
        let minScore = Infinity;
        for (const pt of voiceTimeline) {
          if (typeof pt.feedback.score === 'number' && pt.feedback.score < minScore) {
            minScore = pt.feedback.score;
            summary = pt.feedback.overall;
          }
        }
        if (!summary && voiceTimeline.length > 0) {
          summary = voiceTimeline[voiceTimeline.length - 1].feedback.overall;
        }
        voiceRecommendations = {
          priorityImprovements: allImprovements,
          strengths: allStrengths,
          areasForImprovement: allImprovements,
          specificTips: allSpecificTips,
          summary,
        };
      }

      const sessionData = {
        sessionId: state.sessionId,
        setup,
        transcript: state.transcript,
        duration: state.duration,
        questionCount: state.questionCount,
        questionsAnswered: responses.length,
        overallScore,
        questions,
        responses,
        interviewType,
        focusedType,
        completedAt: new Date().toISOString(),
        speechMetrics: voiceMetrics,
        voice_metrics_summary: voiceMetricsSummary,
        responseTimes: responseTimesRef.current,
        voiceTimeline,
        voiceRecommendations,
        behavioralInsights: (window as any).behavioralInsights || [],
        behavioralSummary,
        showVideo: typeof window !== 'undefined' && (window as any).showVideo === true,
        videoUrl: typeof window !== 'undefined' ? (window as any).videoUrl || '' : '',
        cvTimeline,
        cvSummary
      };

      try {
        await saveRealtimeInterviewSession(sessionData);
      } catch (saveError) {
        console.error('Failed to save realtime interview session:', saveError);
      }

      clearTimeout(endInterviewTimeout);
      onComplete?.(sessionData);
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
      clearTimeout(endInterviewTimeout);
      onComplete?.(fallbackData);
    }
  }, [state.sessionId, state.transcript, state.duration, state.questionCount, setup, interviewType, focusedType, onComplete, stopTimer, setStatus, getSpeechMetrics, processVoiceAnalytics, parseTranscriptIntoQAPairs]);

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
