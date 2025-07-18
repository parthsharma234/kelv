import { useState, useCallback, useRef } from 'react';
import { TranscriptChunk } from '../utils/openaiRealtime';

// Generate a simple UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface RealtimeInterviewState {
  status: 'idle' | 'connecting' | 'connected' | 'interviewing' | 'paused' | 'completed' | 'error' | 'processing';
  transcript: TranscriptChunk[];
  currentQuestion: string;
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  isRecording: boolean;
  error: string | null;
  sessionId: string | null;
  duration: number;
  questionCount: number;
}

export function useInterviewState() {
  const [state, setState] = useState<RealtimeInterviewState>({
    status: 'idle',
    transcript: [],
    currentQuestion: '',
    isAISpeaking: false,
    isUserSpeaking: false,
    isRecording: false,
    error: null,
    sessionId: null,
    duration: 0,
    questionCount: 0,
  });

  const assistantTextBuffer = useRef<string>('');
  const userTextBuffer = useRef<string>('');
  const assistantChunkIdRef = useRef<string | null>(null);

  const setStatus = useCallback((status: RealtimeInterviewState['status']) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, status: error ? 'error' : prev.status, error }));
  }, []);

  const setSessionId = useCallback((sessionId: string) => {
    setState(prev => ({ ...prev, sessionId }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setState(prev => ({ ...prev, duration }));
  }, []);

  const setRecording = useCallback((isRecording: boolean) => {
    setState(prev => ({ ...prev, isRecording }));
  }, []);

  const setSpeakerStatus = useCallback((speaker: 'ai' | 'user', isSpeaking: boolean) => {
    if (speaker === 'ai') {
      setState(prev => ({ ...prev, isAISpeaking: isSpeaking }));
    } else {
      setState(prev => ({ ...prev, isUserSpeaking: isSpeaking }));
    }
  }, []);

  const processTranscriptChunk = useCallback((chunk: TranscriptChunk) => {
    setState(prev => {
      const newTranscript = [...prev.transcript];
      const existingChunkIndex = newTranscript.findIndex(t => t.id === chunk.id);

      if (existingChunkIndex !== -1) {
        newTranscript[existingChunkIndex] = chunk;
      } else {
        newTranscript.push(chunk);
      }

      // Update current question if it's a final assistant chunk
      const newCurrentQuestion = (chunk.speaker === 'assistant' && !chunk.isPartial)
        ? chunk.text
        : prev.currentQuestion;
        
      const newQuestionCount = (chunk.speaker === 'assistant' && !chunk.isPartial)
        ? prev.questionCount + 1
        : prev.questionCount;

      return {
        ...prev,
        transcript: newTranscript,
        currentQuestion: newCurrentQuestion,
        questionCount: newQuestionCount,
      };
    });
  }, []);
  
  const handleAssistantResponse = useCallback((textDelta: string, isFinal: boolean) => {
    assistantTextBuffer.current += textDelta;

    if (!assistantChunkIdRef.current) {
      assistantChunkIdRef.current = `assistant-partial-${generateUUID()}`;
    }

    const chunk: TranscriptChunk = {
      id: assistantChunkIdRef.current,
      speaker: 'assistant',
      text: assistantTextBuffer.current,
      timestamp: Date.now(),
      isPartial: !isFinal,
    };
    processTranscriptChunk(chunk);

    if (isFinal) {
      assistantTextBuffer.current = '';
      assistantChunkIdRef.current = null;
    }
  }, [processTranscriptChunk]);

  const handleUserTranscript = useCallback((textDelta: string, isFinal: boolean) => {
    userTextBuffer.current += textDelta;
    
    const chunkId = state.sessionId ? `user-partial-${state.sessionId}` : `user-partial-${Date.now()}`;

    // Show partial transcript in real-time
    const partialChunk: TranscriptChunk = {
      id: chunkId,
      speaker: 'user',
      text: userTextBuffer.current,
      timestamp: Date.now(),
      isPartial: true,
    };
    processTranscriptChunk(partialChunk);

    if (isFinal) {
      const finalTranscript = userTextBuffer.current.trim();
      if (finalTranscript) {
        const finalChunk: TranscriptChunk = {
          id: chunkId, // Use the same ID to replace the partial one
          speaker: 'user',
          text: finalTranscript,
          timestamp: Date.now(),
          isPartial: false,
        };
        processTranscriptChunk(finalChunk);
      }
      userTextBuffer.current = '';
    }
  }, [processTranscriptChunk, state.sessionId]);


  return {
    state,
    setState,
    setStatus,
    setError,
    setSessionId,
    setDuration,
    setRecording,
    setSpeakerStatus,
    processTranscriptChunk,
    handleAssistantResponse,
    handleUserTranscript,
  };
}
