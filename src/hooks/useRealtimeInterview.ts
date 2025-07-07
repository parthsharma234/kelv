// src/hooks/useRealtimeInterview.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeOpenAIService } from '../utils/openaiRealtime';

export interface TranscriptEntry {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const useRealtimeInterview = (
  interviewType: 'standard' | 'focused' | 'college' = 'standard',
  interviewSetup?: any,
  focusedSubtype?: string
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [aiState, setAiState] = useState({ isProcessing: false, isSpeaking: false, isListening: false });
  const [interviewState, setInterviewState] = useState<{
    interviewState: 'not-started' | 'in-progress' | 'ended';
    timeRemaining: number;
    timeLimit: number;
  }>({ interviewState: 'not-started', timeRemaining: 30, timeLimit: 30 });
  const isConnecting = useRef(false);

  const handleTranscriptionUpdate = useCallback((text: string, speaker: 'user' | 'assistant') => {
    const mappedSpeaker = speaker === 'assistant' ? 'ai' : 'user';
    setTranscript(prev => {
      // Check if this is an update to the last user message
      const lastEntry = prev[prev.length - 1];
      if (lastEntry?.speaker === mappedSpeaker && mappedSpeaker === 'user') {
        // Update the last user entry
        return [...prev.slice(0, -1), { 
          speaker: mappedSpeaker, 
          text, 
          timestamp: new Date() 
        }];
      } else {
        // Add new entry
        return [...prev, { 
          speaker: mappedSpeaker, 
          text, 
          timestamp: new Date() 
        }];
      }
    });
  }, []);

  const handleAIResponse = useCallback((text: string) => {
    setTranscript(prev => [...prev, { 
      speaker: 'ai', 
      text, 
      timestamp: new Date() 
    }]);
  }, []);

  const handleError = useCallback((error: Error) => {
    setError(error);
    setConnectionStatus('disconnected');
    setIsConnected(false);
    console.error('Real-time interview error:', error);
  }, []);

  const handleStatusChange = useCallback((status: 'connecting' | 'connected' | 'disconnected') => {
    setConnectionStatus(status);
    setIsConnected(status === 'connected');
    
    // In real-time mode, recording starts automatically when connected
    if (status === 'connected') {
      setIsRecording(true);
    } else {
      setIsRecording(false);
    }
  }, []);

  const handleStateChange = useCallback((state: { isProcessing: boolean; isSpeaking: boolean; isListening: boolean }) => {
    setAiState(state);
    setIsRecording(state.isListening);
  }, []);

  const handleInterviewStateChange = useCallback((state: { 
    interviewState: 'not-started' | 'in-progress' | 'ended';
    timeRemaining: number;
    timeLimit: number;
  }) => {
    setInterviewState(state);
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting.current || isConnected) return;
    
    isConnecting.current = true;
    setError(null);
    
    try {
      // Set interview setup if provided
      if (interviewSetup) {
        realtimeOpenAIService.setInterviewSetup(interviewSetup);
      }
      
      // Set focused subtype if provided
      if (focusedSubtype && interviewType === 'focused') {
        realtimeOpenAIService.setFocusedInterviewSubtype(focusedSubtype);
      }
      
      await realtimeOpenAIService.connect(
        handleTranscriptionUpdate,
        handleAIResponse,
        handleError,
        handleStatusChange,
        handleStateChange,
        handleInterviewStateChange,
        interviewType,
        focusedSubtype
      );
    } catch (error) {
      handleError(error as Error);
    } finally {
      isConnecting.current = false;
    }
  }, [handleTranscriptionUpdate, handleAIResponse, handleError, handleStatusChange, handleStateChange, handleInterviewStateChange, interviewType, isConnected, interviewSetup, focusedSubtype]);

  const disconnect = useCallback(() => {
    realtimeOpenAIService.disconnect();
    setIsConnected(false);
    setIsRecording(false);
    setConnectionStatus('disconnected');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startInterview = useCallback(async () => {
    await realtimeOpenAIService.startInterview();
  }, []);

  const endInterview = useCallback(() => {
    realtimeOpenAIService.endInterview();
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [interviewType]); // Reconnect if interview type changes

  return {
    // State
    isConnected,
    isRecording,
    transcript,
    error,
    connectionStatus,
    
    // Interview State
    interviewState: interviewState.interviewState,
    timeRemaining: interviewState.timeRemaining,
    timeLimit: interviewState.timeLimit,
    
    // AI State
    isProcessing: aiState.isProcessing,
    isSpeaking: aiState.isSpeaking,
    isListening: aiState.isListening,
    
    // Actions
    connect,
    disconnect,
    clearError,
    startInterview,
    endInterview,
    
    // Computed
    isConnecting: connectionStatus === 'connecting',
    conversationHistory: realtimeOpenAIService.getConversationHistory(),
  };
};
