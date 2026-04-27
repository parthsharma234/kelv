import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { buildVapiInterviewContext } from '../utils/interviewContext';

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isPartial: boolean;
}

interface UseVapiInterviewOptions {
  onTranscriptUpdate?: (chunk: TranscriptMessage) => void;
  onError?: (error: string) => void;
  onComplete?: (data: any) => void;
}

type InterviewStatus = 'idle' | 'connecting' | 'waiting_for_input' | 'interviewing' | 'processing' | 'completed' | 'error';

export function useVapiInterview({
  onTranscriptUpdate,
  onError,
  onComplete,
}: UseVapiInterviewOptions = {}) {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const callIdRef = useRef<string | null>(null);

  // Initialize Vapi client lazily (not on mount)
  const initializeVapi = useCallback(() => {
    if (vapiRef.current) return vapiRef.current;

    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error('[Vapi] No public key found in VITE_VAPI_PUBLIC_KEY');
      throw new Error('Vapi public key not configured');
    }

    const vapi = new Vapi(publicKey);

    // Set up event listeners
    vapi.on('call-start', () => {
      console.log('[Vapi] Call started');
      setStatus('interviewing');
      startTimeRef.current = new Date();
      
      // Start timer
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
        }
      }, 1000);
    });

    vapi.on('call-end', () => {
      console.log('[Vapi] Call ended');
      setStatus('completed');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // REMOVED: Premature onComplete call. 
      // VapiInterviewSession handles this after ensuring recorder stopped.
    });

    vapi.on('speech-start', () => {
      setIsAISpeaking(true);
    });

    vapi.on('speech-end', () => {
      setIsAISpeaking(false);
    });

    vapi.on('message', (message: any) => {
      if (message.type === 'transcript') {
        const newRole = message.role === 'assistant' ? 'assistant' : 'user';
        
        if (!message.transcriptType || message.transcriptType !== 'partial') {
          // Final transcript - check if we should merge with previous message
          setTranscript(prev => {
            const lastMsg = prev[prev.length - 1];
            const now = new Date();
            
            // Merge if same speaker and within 2 seconds
            if (lastMsg && 
                lastMsg.role === newRole && 
                !lastMsg.isPartial &&
                (now.getTime() - new Date(lastMsg.timestamp).getTime()) < 2000) {
              // Merge with previous message
              const updated = [...prev];
              updated[prev.length - 1] = {
                ...lastMsg,
                content: lastMsg.content + ' ' + message.transcript,
                timestamp: now, // Update timestamp to latest
              };
              return updated;
            } else {
              // Add as new message
              const chunk: TranscriptMessage = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                content: message.transcript,
                role: newRole,
                timestamp: now,
                isPartial: false,
              };
              return [...prev, chunk];
            }
          });
        }
        
        onTranscriptUpdate?.({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: message.transcript,
          role: newRole,
          timestamp: new Date(),
          isPartial: message.transcriptType === 'partial',
        });
        
        // Detect user speaking
        if (message.role === 'user') {
          setIsUserSpeaking(true);
          setTimeout(() => setIsUserSpeaking(false), 500);
        }
      }

      if (message.type === 'error') {
        console.error('[Vapi] Error:', message);
        setError(message.message || 'An error occurred');
        onError?.(message.message || 'An error occurred');
      }
    });

    vapi.on('error', (err: any) => {
      console.error('[Vapi] Error event:', err);
      setError(err.message || 'Connection error');
      setStatus('error');
      onError?.(err.message || 'Connection error');
    });

    vapiRef.current = vapi;
    return vapi;
  }, [onComplete, onError, onTranscriptUpdate, transcript, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const pendingContextRef = useRef<{ jd: string; resume: string } | null>(null);

  // Start the interview with delayed context injection
  const startInterview = useCallback(async (jd?: string, res?: string) => {
    try {
      setStatus('connecting');
      setError(null);
      setTranscript([]);

      // Store documents
      if (jd) setJobDescription(jd);
      if (res) setResume(res);
      
      // Store in ref to send on call-start
      if (jd || res) {
        pendingContextRef.current = { jd: jd || '', resume: res || '' };
      }

      const vapi = initializeVapi();
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      
      if (!assistantId) throw new Error('No assistant ID found');

      const interviewContext = buildVapiInterviewContext({
        jobDescription: jd,
        resumeText: res,
        sessionPhase: 'opening'
      });

      console.log('[Vapi] Starting call with dynamic variables...');

      // Start with dynamic variables for the saved Vapi assistant template.
      const call = await vapi.start(assistantId, {
        variableValues: interviewContext.variableValues
      });

      vapi.send({
        type: 'add-message',
        message: {
          role: 'system',
          content: interviewContext.interviewerSystemPrompt
        }
      } as any);
      
      callIdRef.current = call?.id || null;
      console.log('[Vapi] Call initiated');

      // Add local verification to transcript
      const systemMsg: TranscriptMessage = {
        id: `sys_${Date.now()}`,
        role: 'system',
        content: '✓ Context synced with Kelv',
        timestamp: new Date(),
        isPartial: false
      };
      setTranscript(prev => [...prev, systemMsg]);

    } catch (err) {
      console.error('[Vapi] Failed to start:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start interview';
      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
    }
  }, [initializeVapi, onError]);

  // Handle call-start
  useEffect(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    const handleCallStart = () => {
      console.log('[Vapi] Call started');
    };

    vapi.on('call-start', handleCallStart);
    return () => {
      vapi.off('call-start', handleCallStart);
    };
  }, []);

  // End the interview
  const endInterview = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStatus('completed');
  }, []);

  // Submit documents (manual triggers if needed)
  const submitDocuments = useCallback((jd: string, res: string) => {
    setJobDescription(jd);
    setResume(res);
  }, []);

  // Check if documents are submitted
  const hasDocuments = jobDescription.length > 0 && resume.length > 0;

  return {
    // State
    status,
    isAISpeaking,
    isUserSpeaking,
    transcript,
    error,
    duration,
    jobDescription,
    resume,
    hasDocuments,
    
    // Actions
    startInterview,
    endInterview,
    submitDocuments,
    setJobDescription,
    setResume,
  };
}
