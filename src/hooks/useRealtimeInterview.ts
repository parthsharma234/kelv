import { useEffect, useCallback, useRef } from 'react';
import { HumeRealtimeClient, TranscriptChunk, HumeConfig } from '../utils/humeRealtime';
import { InterviewSetup } from '../types/interview';
import { createRealtimeSession, updateRealtimeSession, saveTranscriptChunk, saveRealtimeInterviewSession } from '../utils/supabase-interview';
import { supabase } from '../lib/supabase';
import { useInterviewState } from '../hooks/useInterviewState';

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
  mediaStream?: MediaStream | null;
  onComplete?: (sessionData: any) => void;
  onError?: (error: string) => void;
}

// Interview duration: 20 minutes for all interviews
const INTERVIEW_DURATION_MINUTES = 20;

export function useRealtimeInterview({
  setup,
  mediaStream,
  onComplete,
  onError,
}: UseRealtimeInterviewOptions) {
  const {
    state,
    setStatus,
    setError,
    setSessionId,
    setDuration,
    setRecording,
    setSpeakerStatus,
    setProsody,
    processTranscriptChunk,
    handleAssistantResponse,
    handleUserTranscript,
  } = useInterviewState();

  const clientRef = useRef<HumeRealtimeClient | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const statusRef = useRef(state.status);
  
  // Sync ref with state
  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  // Initialize Hume client
  const initializeClient = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    try {
      // Map experience level to simple format
      const experienceLevelMap: Record<string, string> = {
        'Entry Level (0-2 years)': 'entry',
        'Mid Level (3-5 years)': 'mid',
        'Senior Level (6-10 years)': 'senior',
        'Executive Level (10+ years)': 'executive'
      };
      const experienceLevel = experienceLevelMap[setup.experienceLevel] || 'mid';

      // Get industry from setup
      const industry = setup.industry || 'Technology';

      const humeConfig: Partial<HumeConfig> = {
        configId: import.meta.env.VITE_HUME_CONFIG_ID,
        variables: {
          industry: industry,
          job_type: setup.jobType || 'Software Engineer',
          experience_level: experienceLevel
        }
      };

      clientRef.current = new HumeRealtimeClient(
        import.meta.env.VITE_HUME_API_KEY,
        humeConfig,
        mediaStream || undefined
      );

      // Set up event listeners
      clientRef.current.on('connection.opened', () => {
        console.log('[Realtime] Connection opened, setting status to interviewing');
        setStatus('interviewing');
        startTimeRef.current = new Date();

        // Start the timer
        const startTime = Date.now();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        // The Hume config already has the system prompt and greeting behavior
        // We do NOT send anything here to avoid duplicate prompts

        // Auto-start audio recording in voice mode
        if (setup.interviewMode === 'voice') {
          setTimeout(() => {
            console.log('[Realtime] Starting audio recording...');
            clientRef.current?.startAudioRecording();
          }, 500);
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

        // Ensure we are in interviewing state if we receive transcripts
        // Use ref to avoid stale closure issues
        if (statusRef.current !== 'interviewing' && statusRef.current !== 'completed') {
          console.log('[Realtime] Received transcript while not interviewing, forcing state to interviewing');
          setStatus('interviewing');
          if (!startTimeRef.current) {
            startTimeRef.current = new Date();
            startTimer();
          }
        }

        if (chunk.speaker === 'user') {
          handleUserTranscript(chunk.text, !chunk.isPartial);
        } else if (chunk.speaker === 'assistant') {
          handleAssistantResponse(chunk.text, !chunk.isPartial);
        }

        // Save complete chunks to the database
        if (!chunk.isPartial && state.sessionId) {
          saveTranscriptChunk({
            id: generateUUID(),
            session_id: state.sessionId,
            speaker: chunk.speaker,
            text: chunk.text,
            timestamp: chunk.timestamp,
            is_partial: false,
          }).catch(error => {
            console.error(`Failed to save transcript chunk:`, error);
          });
        }
      });

      clientRef.current.on('input_audio_buffer.speech_started', () => {
        setSpeakerStatus('user', true);
        // Stop AI audio playback on interruption
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
        handleAssistantResponse('', true);
      });

      clientRef.current.on('assistant_prosody', (data: any) => {
        if (data.models && data.models.prosody && data.models.prosody.scores) {
          const scores = data.models.prosody.scores;
          // Find the emotion with the highest score
          let maxScore = 0;
          let maxEmotion = '';
          
          for (const [emotion, score] of Object.entries(scores)) {
            if (typeof score === 'number' && score > maxScore) {
              maxScore = score;
              maxEmotion = emotion;
            }
          }
          
          if (maxEmotion) {
            setProsody({ name: maxEmotion, score: maxScore });
          }
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize client';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [
    setup,
    mediaStream,
    onError,
    setStatus,
    setError,
    setDuration,
    setSpeakerStatus,
    setProsody,
    handleAssistantResponse,
    handleUserTranscript,
    state.sessionId,
    state.status
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

  // Parse transcript into structured Q&A pairs
  const parseTranscriptIntoQAPairs = useCallback(async (transcriptChunks: TranscriptChunk[]) => {
    const questions: Array<{ id: string; text: string; category: string }> = [];
    const responses: Array<{ questionId: string; response: string; analysis?: any }> = [];

    let currentQuestion = '';
    let currentQuestionId = '';
    let currentResponse = '';
    let isCollectingResponse = false;

    for (let i = 0; i < transcriptChunks.length; i++) {
      const chunk = transcriptChunks[i];

      if (chunk.speaker === 'assistant') {
        // Save previous response if exists
        if (isCollectingResponse && currentResponse.trim() && currentQuestionId) {
          responses.push({
            questionId: currentQuestionId,
            response: currentResponse.trim()
          });
          currentResponse = '';
          isCollectingResponse = false;
        }

        // Start new question
        currentQuestion = chunk.text.trim();
        currentQuestionId = `q_${questions.length + 1}_${Date.now()}`;

        questions.push({
          id: currentQuestionId,
          text: currentQuestion,
          category: 'behavioral'
        });

      } else if (chunk.speaker === 'user' && currentQuestionId) {
        currentResponse += ' ' + chunk.text;
        isCollectingResponse = true;
      }
    }

    // Handle the last response
    if (isCollectingResponse && currentResponse.trim() && currentQuestionId) {
      responses.push({
        questionId: currentQuestionId,
        response: currentResponse.trim()
      });
    }

    return { questions, responses };
  }, []);

  // Start interview
  const startInterview = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);

      const newSessionId = `realtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      // Create session in Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await createRealtimeSession({
            session_id: newSessionId,
            user_id: user.id,
            setup,
            interview_type: 'standard',
            start_time: new Date().toISOString(),
            status: 'active',
            model_type: 'hume-evi',
            total_duration: 0,
            question_count: 0
          });
        }
      } catch (supabaseError) {
        console.error('Failed to create session in Supabase:', supabaseError);
      }

      // Initialize and connect client
      initializeClient();

      if (!clientRef.current) {
        throw new Error('Failed to initialize AI client. Please check your API keys.');
      }

      // Connect with timeout
      const connectionPromise = clientRef.current.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timed out. Please check your internet connection and try again.')), 15000);
      });

      await Promise.race([connectionPromise, timeoutPromise]);

    } catch (error) {
      console.error('Error starting interview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start interview';
      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
    }
  }, [initializeClient, onError, setup, setStatus, setError, setSessionId]);

  // Pause interview
  const pauseInterview = useCallback(async () => {
    if (clientRef.current?.isCurrentlyRecording()) {
      clientRef.current.stopAudioRecording();
    }
    setStatus('paused');
    setRecording(false);
    stopTimer();

    if (state.sessionId) {
      try {
        await updateRealtimeSession(state.sessionId, {
          status: 'paused',
          total_duration: state.duration,
          question_count: state.questionCount
        });
      } catch (supabaseError) {
        console.error('Failed to update session status:', supabaseError);
      }
    }
  }, [stopTimer, state.sessionId, state.duration, state.questionCount, setStatus, setRecording]);

  // Resume interview
  const resumeInterview = useCallback(async () => {
    setStatus('interviewing');
    startTimer();

    if (state.sessionId) {
      try {
        await updateRealtimeSession(state.sessionId, {
          status: 'active'
        });
      } catch (supabaseError) {
        console.error('Failed to update session status:', supabaseError);
      }
    }
  }, [startTimer, state.sessionId, setStatus]);

  // End interview
  const endInterview = useCallback(async () => {
    console.log('Ending interview...');
    stopTimer();
    setStatus('processing');

    try {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }

      setStatus('completed');

      // Update session in Supabase
      if (state.sessionId) {
        try {
          await updateRealtimeSession(state.sessionId, {
            end_time: new Date().toISOString(),
            status: 'completed',
            total_duration: state.duration,
            question_count: state.questionCount
          });

          // Parse transcript into Q&A pairs
          const { questions, responses } = await parseTranscriptIntoQAPairs(state.transcript);

          // Calculate score (simple average)
          const overallScore = responses.length > 0 ? 70 : 50;

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
            interviewType: 'standard',
            completedAt: new Date().toISOString(),
          };

          // Save structured interview data
          try {
            await saveRealtimeInterviewSession(sessionData);
          } catch (saveError) {
            console.error('Failed to save interview session:', saveError);
          }

          onComplete?.(sessionData);
        } catch (supabaseError) {
          console.error('Failed to update session:', supabaseError);

          // Fallback data
          const fallbackData = {
            sessionId: state.sessionId,
            setup,
            transcript: state.transcript,
            duration: state.duration,
            questionCount: state.questionCount,
            interviewType: 'standard',
            completedAt: new Date().toISOString(),
          };

          onComplete?.(fallbackData);
        }
      } else {
        // No session ID - minimal data
        const minimalData = {
          setup,
          transcript: state.transcript,
          duration: state.duration,
          questionCount: state.questionCount,
          interviewType: 'standard',
          completedAt: new Date().toISOString(),
        };

        onComplete?.(minimalData);
      }
    } catch (error) {
      console.error('Error ending interview:', error);
      const fallbackData = {
        setup,
        transcript: state.transcript,
        duration: state.duration,
        questionCount: state.questionCount,
        interviewType: 'standard',
        completedAt: new Date().toISOString(),
        error: 'An unexpected error occurred during interview finalization.',
      };

      onComplete?.(fallbackData);
    }
  }, [state.sessionId, state.transcript, state.duration, state.questionCount, setup, onComplete, stopTimer, setStatus, parseTranscriptIntoQAPairs]);

  // Recording controls
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
    }
  }, [setup.interviewMode, processTranscriptChunk]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    state,
    client: clientRef.current,
    maxDuration: INTERVIEW_DURATION_MINUTES,
    startInterview,
    pauseInterview,
    resumeInterview,
    endInterview,
    startRecording,
    stopRecording,
    sendTextMessage,
  };
}
