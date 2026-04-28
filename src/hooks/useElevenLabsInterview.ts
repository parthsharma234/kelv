import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Conversation,
  type ClientTools,
  type Conversation as ElevenLabsConversation,
  type DisconnectionDetails,
  type MessagePayload
} from '@elevenlabs/react';
import { TranscriptMessage } from '../utils/analyticsEngine';
import { buildVoiceInterviewContext } from '../utils/interviewContext';
import { WhiteboardMode, WhiteboardToolRequest } from '../types/interviewIntelligence';

interface UseElevenLabsInterviewOptions {
  onTranscriptUpdate?: (chunk: TranscriptMessage) => void;
  onError?: (error: string) => void;
  onWhiteboardTool?: (request: WhiteboardToolRequest) => void;
  userId?: string;
}

type InterviewStatus = 'idle' | 'connecting' | 'waiting_for_input' | 'interviewing' | 'processing' | 'completed' | 'error';
type ElevenLabsTransport = 'webrtc' | 'websocket';
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: {
      transcript?: string;
    };
  }>;
};

function createTranscriptMessage(role: TranscriptMessage['role'], content: string, isPartial = false): TranscriptMessage {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    role,
    content: content.trim(),
    timestamp: new Date(),
    isPartial
  };
}

export function useElevenLabsInterview({
  onTranscriptUpdate,
  onError,
  onWhiteboardTool,
  userId
}: UseElevenLabsInterviewOptions = {}) {
  const conversationRef = useRef<ElevenLabsConversation | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const volumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const connectedAtRef = useRef<number | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const partialAgentTextRef = useRef('');
  const evidenceMessageCountRef = useRef(0);
  const userEndedRef = useRef(false);
  const activeTransportRef = useRef<ElevenLabsTransport>('webrtc');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recognitionRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionActiveRef = useRef(false);
  const shouldRunRecognitionRef = useRef(false);
  const agentSpeakingRef = useRef(false);
  const awaitingCandidateEvidenceRef = useRef(false);
  const suppressProviderReplyRef = useRef(false);
  const lastAssistantMessageAtRef = useRef(0);
  const lastDebugAtRef = useRef<Record<string, number>>({});
  const lastInputVolumeRef = useRef(0);
  const recognitionRestartCountRef = useRef(0);

  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [inputVolume, setInputVolume] = useState(0);
  const [connectionTransport, setConnectionTransport] = useState<ElevenLabsTransport>('webrtc');
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [speechFallbackActive, setSpeechFallbackActive] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [whiteboardRequests, setWhiteboardRequests] = useState<WhiteboardToolRequest[]>([]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = new Date();
    stopTimer();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setDuration(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
      }
    }, 1000);
  }, [stopTimer]);

  const stopVolumeMeter = useCallback(() => {
    if (volumeTimerRef.current) {
      clearInterval(volumeTimerRef.current);
      volumeTimerRef.current = null;
    }
    setInputVolume(0);
  }, []);

  const startVolumeMeter = useCallback((conversation: ElevenLabsConversation) => {
    stopVolumeMeter();
    volumeTimerRef.current = setInterval(() => {
      try {
        const nextVolume = conversation.getInputVolume?.() ?? 0;
        const clampedVolume = Number.isFinite(nextVolume) ? Math.max(0, Math.min(1, nextVolume)) : 0;
        if (Math.abs(clampedVolume - lastInputVolumeRef.current) > 0.015) {
          lastInputVolumeRef.current = clampedVolume;
          setInputVolume(clampedVolume);
        }
        setIsUserSpeaking(clampedVolume > 0.035);
      } catch {
        setInputVolume(0);
      }
    }, 150);
  }, [stopVolumeMeter]);

  const stopSpeechFallback = useCallback(() => {
    shouldRunRecognitionRef.current = false;
    recognitionActiveRef.current = false;
    agentSpeakingRef.current = false;
    if (recognitionRestartTimerRef.current) {
      clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }
    recognitionRestartCountRef.current = 0;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setSpeechFallbackActive(false);
  }, []);

  const appendTranscript = useCallback((message: TranscriptMessage) => {
    if (!message.content) return;

    setTranscript((previous) => {
      if (message.isPartial) return previous;

      const normalizedContent = normalizeTranscriptContent(message.content);
      const messageTime = new Date(message.timestamp).getTime();
      const duplicateRecentMessage = previous.some((existing) =>
        existing.role === message.role &&
        normalizeTranscriptContent(existing.content) === normalizedContent &&
        Math.abs(messageTime - new Date(existing.timestamp).getTime()) < 8000
      );
      if (duplicateRecentMessage) return previous;
      if (message.role !== 'system') evidenceMessageCountRef.current += 1;

      const lastMessage = previous[previous.length - 1];
      const canMerge =
        lastMessage &&
        lastMessage.role === message.role &&
        !lastMessage.isPartial &&
        new Date(message.timestamp).getTime() - new Date(lastMessage.timestamp).getTime() < 2000;

      if (!canMerge) return [...previous, message];

      const updated = [...previous];
      updated[updated.length - 1] = {
        ...lastMessage,
        content: `${lastMessage.content} ${message.content}`.trim(),
        timestamp: message.timestamp
      };
      return updated;
    });

    onTranscriptUpdate?.(message);
  }, [onTranscriptUpdate]);

  const appendDebugMessage = useCallback((message: string) => {
    const throttleKey = getDebugThrottleKey(message);
    const now = Date.now();
    if (throttleKey) {
      const lastAt = lastDebugAtRef.current[throttleKey] || 0;
      if (now - lastAt < 2500) return;
      lastDebugAtRef.current[throttleKey] = now;
    }
    const line = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${message}`;
    setDebugMessages((previous) => [...previous.slice(-7), line]);
    if (import.meta.env.DEV) console.info('[ElevenLabs mic]', message);
  }, []);

  const submitFallbackTranscript = useCallback((content: string) => {
    const normalized = content.replace(/\s+/g, ' ').trim();
    if (normalized.length < 2) return;

    appendDebugMessage(`Browser speech final: "${normalized.slice(0, 80)}${normalized.length > 80 ? '...' : ''}"`);
    const message = createTranscriptMessage('user', normalized);
    appendTranscript(message);
    conversationRef.current?.sendUserMessage(normalized);
  }, [appendDebugMessage, appendTranscript]);

  const startSpeechFallback = useCallback(() => {
    const SpeechRecognitionImpl = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionImpl) {
      appendDebugMessage('Browser speech fallback unavailable in this browser.');
      return;
    }

    if (recognitionActiveRef.current || recognitionRef.current) return;

    try {
      const recognition = new SpeechRecognitionImpl();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcriptText = result?.[0]?.transcript || '';
          if (result?.isFinal) submitFallbackTranscript(transcriptText);
        }
      };
      recognition.onerror = (event) => {
        appendDebugMessage(`Browser speech error: ${event.error || event.message || 'unknown'}.`);
      };
      recognition.onend = () => {
        recognitionActiveRef.current = false;
        recognitionRef.current = null;
        setSpeechFallbackActive(false);
        if (!shouldRunRecognitionRef.current || agentSpeakingRef.current) return;
        recognitionRestartCountRef.current += 1;
        if (recognitionRestartCountRef.current > 4) {
          shouldRunRecognitionRef.current = false;
          setSpeechFallbackActive(false);
          appendDebugMessage('Browser speech fallback stopped after repeated restarts.');
          return;
        }
        const restartDelay = Math.min(5000, 1500 + recognitionRestartCountRef.current * 750);
        if (recognitionRestartTimerRef.current) clearTimeout(recognitionRestartTimerRef.current);
        recognitionRestartTimerRef.current = setTimeout(() => {
          startSpeechFallback();
        }, restartDelay);
      };

      shouldRunRecognitionRef.current = true;
      recognitionRef.current = recognition;
      recognition.start();
      recognitionActiveRef.current = true;
      setSpeechFallbackActive(true);
      appendDebugMessage('Browser speech fallback listening.');
    } catch (error) {
      recognitionActiveRef.current = false;
      recognitionRef.current = null;
      appendDebugMessage(`Browser speech fallback failed: ${formatError(error)}`);
    }
  }, [appendDebugMessage, status, submitFallbackTranscript]);

  const emitWhiteboardRequest = useCallback((toolName: WhiteboardToolRequest['tool_name'], parameters: Record<string, unknown>) => {
    const request: WhiteboardToolRequest = {
      request_id: `${toolName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tool_name: toolName,
      question_id: typeof parameters.question_id === 'string' ? parameters.question_id : undefined,
      mode: isWhiteboardMode(parameters.mode) ? parameters.mode : undefined,
      prompt: typeof parameters.prompt === 'string' ? parameters.prompt : undefined,
      constraints: Array.isArray(parameters.constraints) ? parameters.constraints.map(String) : undefined,
      expected_sections: Array.isArray(parameters.expected_sections) ? parameters.expected_sections.map(String) : undefined,
      milestone: typeof parameters.milestone === 'string' ? parameters.milestone : undefined,
      timestamp: new Date().toISOString()
    };

    setWhiteboardRequests((previous) => [...previous, request]);
    onWhiteboardTool?.(request);
    return request;
  }, [onWhiteboardTool]);

  const buildClientTools = useCallback((): ClientTools => ({
    openWhiteboard: (parameters) => {
      const request = emitWhiteboardRequest('openWhiteboard', parameters);
      return `Whiteboard opened for ${request.mode || 'structured reasoning'}.`;
    },
    captureWhiteboardState: (parameters) => {
      const request = emitWhiteboardRequest('captureWhiteboardState', parameters);
      return `Whiteboard capture requested for ${request.question_id || 'current question'}.`;
    },
    markWhiteboardMilestone: (parameters) => {
      const request = emitWhiteboardRequest('markWhiteboardMilestone', parameters);
      return `Whiteboard milestone recorded: ${request.milestone || 'progress noted'}.`;
    },
    closeWhiteboard: (parameters) => {
      emitWhiteboardRequest('closeWhiteboard', parameters);
      return 'Whiteboard closed.';
    }
  }), [emitWhiteboardRequest]);

  const handleMessage = useCallback((payload: MessagePayload) => {
    const content = payload?.message || '';
    if (!content.trim()) return;

    const role = payload.role === 'agent' || payload.source === 'ai' ? 'assistant' : 'user';
    if (role === 'user' && isLikelyTranscriptFragment(content)) {
      appendDebugMessage(`Ignored short user transcript fragment: "${content.trim()}".`);
      suppressProviderReplyRef.current = awaitingCandidateEvidenceRef.current;
      if (suppressProviderReplyRef.current) muteConversationOutput(conversationRef.current, true);
      conversationRef.current?.sendContextualUpdate(
        'The latest user transcript was an invalid partial fragment. Do not advance the interview; wait for a complete candidate answer.'
      );
      return;
    }

    if (role === 'assistant' && shouldSuppressAssistantMessage(lastAssistantMessageAtRef.current, awaitingCandidateEvidenceRef.current, suppressProviderReplyRef.current)) {
      appendDebugMessage(`Suppressed provider reply before valid candidate evidence; chars=${content.trim().length}.`);
      suppressProviderReplyRef.current = true;
      muteConversationOutput(conversationRef.current, true);
      window.setTimeout(() => muteConversationOutput(conversationRef.current, false), 1800);
      return;
    }

    appendDebugMessage(`Message event role=${role}; chars=${content.trim().length}.`);
    appendTranscript(createTranscriptMessage(role, content));

    if (role === 'user') {
      awaitingCandidateEvidenceRef.current = false;
      suppressProviderReplyRef.current = false;
      muteConversationOutput(conversationRef.current, false);
      setIsUserSpeaking(true);
      window.setTimeout(() => setIsUserSpeaking(false), 500);
    } else {
      partialAgentTextRef.current = '';
      awaitingCandidateEvidenceRef.current = true;
      suppressProviderReplyRef.current = false;
      lastAssistantMessageAtRef.current = Date.now();
    }
  }, [appendDebugMessage, appendTranscript, onError]);

  const handleProviderDisconnect = useCallback((details: DisconnectionDetails) => {
    stopTimer();
    stopVolumeMeter();
    stopSpeechFallback();
    setIsAISpeaking(false);
    setIsUserSpeaking(false);

    const elapsedMs = connectedAtRef.current ? Date.now() - connectedAtRef.current : 0;
    if (!userEndedRef.current) {
      const errorMessage = formatDisconnectionDetails(details, elapsedMs);
      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
      return;
    }

    setStatus('completed');
  }, [onError, stopSpeechFallback, stopTimer, stopVolumeMeter]);

  const startInterview = useCallback(async (jd?: string, res?: string, inputDeviceId?: string) => {
    try {
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
      if (!agentId) throw new Error('ElevenLabs agent ID not configured. Add VITE_ELEVENLABS_AGENT_ID to .env.');

      setStatus('connecting');
      setError(null);
      setDuration(0);
      setInputVolume(0);
      setTranscript([]);
      setDebugMessages([]);
      setWhiteboardRequests([]);
      evidenceMessageCountRef.current = 0;
      connectedAtRef.current = null;
      userEndedRef.current = false;
      agentSpeakingRef.current = false;
      awaitingCandidateEvidenceRef.current = false;
      suppressProviderReplyRef.current = false;
      lastAssistantMessageAtRef.current = 0;
      recognitionRestartCountRef.current = 0;

      if (jd) setJobDescription(jd);
      if (res) setResume(res);

      const interviewContext = buildVoiceInterviewContext({
        jobDescription: jd,
        resumeText: res,
        sessionPhase: 'opening'
      });

      const preferredTransport = getPreferredTransport();
      appendDebugMessage(`Starting ${preferredTransport} session; inputDeviceId=${inputDeviceId ? 'present' : 'default'}.`);
      const conversation = await startSessionWithFallback({
        agentId,
        preferredTransport,
        inputDeviceId,
        userId,
        interviewContext,
        clientTools: buildClientTools(),
        onTransportSelected: (transport) => {
          activeTransportRef.current = transport;
          setConnectionTransport(transport);
          appendDebugMessage(`Attempting ${transport} transport.`);
        },
        onTransportFailure: (transport, failure) => {
          appendDebugMessage(`${transport} startup failed: ${formatError(failure)}`);
        },
        callbacks: {
          onConnect: ({ conversationId }: { conversationId?: string }) => {
            conversationIdRef.current = conversationId || null;
            connectedAtRef.current = Date.now();
            setStatus('interviewing');
            appendDebugMessage(`Connected via ${activeTransportRef.current}; conversationId=${conversationId || 'unknown'}.`);
            conversationRef.current?.sendContextualUpdate(buildContextSyncMessage(interviewContext));
            appendDebugMessage(`Runtime context injected for ${interviewContext.role}; JD ${interviewContext.promptContext.jd_summary.length} chars, resume ${interviewContext.promptContext.resume_summary.length} chars.`);
            startTimer();
            if (shouldEnableBrowserSpeechFallback()) startSpeechFallback();
            else appendDebugMessage('Browser speech fallback disabled for stability.');
          },
          onDisconnect: handleProviderDisconnect,
          onMessage: handleMessage,
          onAudio: () => {
            if (suppressProviderReplyRef.current) {
              muteConversationOutput(conversationRef.current, true);
              return;
            }
            setIsAISpeaking(true);
            window.setTimeout(() => setIsAISpeaking(false), 800);
          },
          onVadScore: ({ vadScore }: { vadScore: number }) => {
            if (vadScore > 0.35) appendDebugMessage(`VAD detected speech score=${vadScore.toFixed(2)}.`);
            setIsUserSpeaking(vadScore > 0.35);
          },
          onError: (message: unknown) => {
            const errorMessage = typeof message === 'string'
              ? message
              : message instanceof Error
                ? message.message
                : 'ElevenLabs conversation error';
            appendDebugMessage(`SDK error on ${activeTransportRef.current}: ${errorMessage}`);
            setError(errorMessage);
            setStatus('error');
            onError?.(errorMessage);
          },
          onConversationMetadata: ({ conversation_id }: { conversation_id?: string }) => {
            conversationIdRef.current = conversation_id || conversationIdRef.current;
            appendDebugMessage(`Metadata received; conversation_id=${conversation_id || 'missing'}.`);
          },
          onAsrInitiationMetadata: (metadata: unknown) => {
            appendDebugMessage(`ASR metadata: ${formatCompactPayload(metadata)}.`);
          },
          onAgentChatResponsePart: (part: { text?: string; type?: 'start' | 'delta' | 'stop' }) => {
            if (part.type === 'start') partialAgentTextRef.current = '';
            if (part.type === 'delta') partialAgentTextRef.current += part.text || '';
            if (part.type === 'stop') partialAgentTextRef.current = '';
          },
          onDebug: (debug: unknown) => {
            const debugLabel = formatDebugPayload(debug);
            if (debugLabel) appendDebugMessage(debugLabel);
            if (import.meta.env.DEV) console.debug('[ElevenLabs]', debug);
          },
          onStatusChange: ({ status: sdkStatus }: { status: string }) => {
            appendDebugMessage(`SDK status=${sdkStatus} transport=${activeTransportRef.current}.`);
          },
          onModeChange: ({ mode }: { mode: 'speaking' | 'listening' }) => {
            agentSpeakingRef.current = mode === 'speaking';
            const shouldSuppressAudio = mode === 'speaking' && suppressProviderReplyRef.current;
            muteConversationOutput(conversationRef.current, shouldSuppressAudio);
            setIsAISpeaking(mode === 'speaking' && !shouldSuppressAudio);
            if (mode === 'speaking') {
              recognitionRef.current?.stop();
            } else {
              muteConversationOutput(conversationRef.current, false);
              suppressProviderReplyRef.current = false;
              setIsUserSpeaking(false);
              if (shouldEnableBrowserSpeechFallback()) startSpeechFallback();
            }
          }
        }
      });

      conversationRef.current = conversation;
      conversationIdRef.current = conversation.getId?.() || conversationIdRef.current;
      conversation.setMicMuted(false);
      muteConversationOutput(conversation, false);
      conversation.sendContextualUpdate(buildContextSyncMessage(interviewContext));
      startVolumeMeter(conversation);

      appendTranscript(createTranscriptMessage('system', `Context synced with Kelv via ElevenLabs (${activeTransportRef.current}).`));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start ElevenLabs interview';
      setError(errorMessage);
      setStatus('error');
      stopTimer();
      stopVolumeMeter();
      appendDebugMessage(`Start failed: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [appendDebugMessage, appendTranscript, buildClientTools, handleMessage, handleProviderDisconnect, onError, startSpeechFallback, startTimer, startVolumeMeter, stopTimer, stopVolumeMeter, userId]);
  const endInterview = useCallback(async () => {
    try {
      userEndedRef.current = true;
      await conversationRef.current?.endSession();
    } finally {
      stopTimer();
      stopVolumeMeter();
      stopSpeechFallback();
      setIsAISpeaking(false);
      setIsUserSpeaking(false);
      setStatus('completed');
    }
  }, [stopSpeechFallback, stopTimer, stopVolumeMeter]);

  const setMicMuted = useCallback((muted: boolean) => {
    conversationRef.current?.setMicMuted(muted);
  }, []);

  const submitDocuments = useCallback((jd: string, res: string) => {
    setJobDescription(jd);
    setResume(res);
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      stopVolumeMeter();
      stopSpeechFallback();
      conversationRef.current?.endSession().catch(() => undefined);
    };
  }, [stopSpeechFallback, stopTimer, stopVolumeMeter]);

  return {
    status,
    isAISpeaking,
    isUserSpeaking,
    transcript,
    error,
    duration,
    inputVolume,
    connectionTransport,
    debugMessages,
    speechFallbackActive,
    jobDescription,
    resume,
    hasDocuments: jobDescription.length > 0 && resume.length > 0,
    conversationId: conversationIdRef.current,
    whiteboardRequests,
    startInterview,
    endInterview,
    setMicMuted,
    submitDocuments,
    setJobDescription,
    setResume
  };
}

function isWhiteboardMode(value: unknown): value is WhiteboardMode {
  return value === 'coding' || value === 'system_design' || value === 'product_case' || value === 'data_case';
}

function buildContextSyncMessage(interviewContext: ReturnType<typeof buildVoiceInterviewContext>): string {
  return [
    'Use this as the active interview context. It overrides generic agent defaults.',
    `Role: ${interviewContext.role}`,
    `Industry: ${interviewContext.industry}`,
    `Level: ${interviewContext.experienceLevel}`,
    `Category: ${interviewContext.category}`,
    `Job description summary: ${interviewContext.promptContext.jd_summary}`,
    `Resume summary: ${interviewContext.promptContext.resume_summary}`,
    `Interview prompt: ${interviewContext.interviewerSystemPrompt}`,
    `Question plan: ${JSON.stringify(interviewContext.blueprint.question_plan)}`
  ].join('\n');
}

async function startSessionWithFallback({
  agentId,
  preferredTransport,
  inputDeviceId,
  userId,
  interviewContext,
  clientTools,
  callbacks,
  onTransportSelected,
  onTransportFailure
}: {
  agentId: string;
  preferredTransport: ElevenLabsTransport;
  inputDeviceId?: string;
  userId?: string;
  interviewContext: ReturnType<typeof buildVoiceInterviewContext>;
  clientTools: ClientTools;
  callbacks: Record<string, unknown>;
  onTransportSelected: (transport: ElevenLabsTransport) => void;
  onTransportFailure: (transport: ElevenLabsTransport, failure: unknown) => void;
}): Promise<ElevenLabsConversation> {
  const transports: ElevenLabsTransport[] = preferredTransport === 'webrtc'
    ? ['webrtc', 'websocket']
    : ['websocket', 'webrtc'];
  let lastError: unknown;

  for (const transport of transports) {
    try {
      onTransportSelected(transport);
      return await Conversation.startSession({
        agentId,
        connectionType: transport,
        textOnly: false,
        inputDeviceId: inputDeviceId || undefined,
        preferHeadphonesForIosDevices: transport === 'websocket',
        userId,
        dynamicVariables: interviewContext.dynamicVariables,
        overrides: {
          agent: {
            prompt: { prompt: interviewContext.interviewerSystemPrompt },
            firstMessage: interviewContext.firstMessage,
            language: 'en'
          }
        },
        clientTools,
        ...callbacks
      });
    } catch (error) {
      lastError = error;
      onTransportFailure(transport, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All ElevenLabs transports failed to start.');
}

function getPreferredTransport(): ElevenLabsTransport {
  const savedTransport = window.localStorage.getItem('kelv.elevenlabs.transport');
  if (savedTransport === 'webrtc' || savedTransport === 'websocket') return savedTransport;
  return import.meta.env.VITE_ELEVENLABS_TRANSPORT === 'webrtc' ? 'webrtc' : 'websocket';
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

function shouldEnableBrowserSpeechFallback(): boolean {
  return import.meta.env.VITE_ENABLE_BROWSER_ASR_FALLBACK === 'true' || window.localStorage.getItem('kelv.browserAsr') === 'true';
}

function normalizeTranscriptContent(content: string): string {
  return content.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isLikelyTranscriptFragment(content: string): boolean {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) return true;
  if (normalized.length <= 3) return true;
  if (/^[\W_]+$/.test(normalized)) return true;
  const wordCount = normalized.split(' ').filter(Boolean).length;
  return normalized.length < 8 && wordCount <= 1;
}

function shouldSuppressAssistantMessage(lastAssistantMessageAt: number, awaitingCandidateEvidence: boolean, suppressProviderReply: boolean): boolean {
  if (suppressProviderReply) return true;
  if (!awaitingCandidateEvidence) return false;
  const looksLikeSameAssistantTurn = Date.now() - lastAssistantMessageAt < 2500;
  return !looksLikeSameAssistantTurn;
}

function muteConversationOutput(conversation: ElevenLabsConversation | null, muted: boolean): void {
  try {
    conversation?.setVolume?.({ volume: muted ? 0 : 1 });
  } catch {
    // Output muting is a guardrail; SDK volume failures should not crash the interview.
  }
}

function formatDebugPayload(debug: unknown): string | null {
  if (!debug || typeof debug !== 'object') return null;
  const payload = debug as { type?: unknown; message?: unknown };
  const type = typeof payload.type === 'string' ? payload.type : null;
  if (!type) return null;
  if (type === 'conversation_initiation_client_data') return 'Sent conversation initiation payload.';
  if (type === 'audio_element_ready') return 'Agent output audio element ready.';
  if (type === 'send_message_error') return `Send message error: ${formatError(payload.message)}`;
  return `Debug event: ${type}.`;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function formatCompactPayload(payload: unknown): string {
  try {
    const text = JSON.stringify(payload);
    return text.length > 140 ? `${text.slice(0, 140)}...` : text;
  } catch {
    return String(payload);
  }
}

function getDebugThrottleKey(message: string): string | null {
  if (message.startsWith('VAD detected speech score=')) return 'vad';
  if (message.startsWith('Message event role=')) return 'message-event';
  if (message.startsWith('Browser speech error:')) return 'browser-speech-error';
  if (message === 'Browser speech fallback listening.') return 'browser-speech-listening';
  return null;
}

function formatDisconnectionDetails(details: DisconnectionDetails, elapsedMs: number): string {
  if (details.reason === 'error') {
    const close = details.closeCode ? ` close=${details.closeCode}` : '';
    const closeReason = details.closeReason ? ` reason=${details.closeReason}` : '';
    return `ElevenLabs disconnected with an error after ${Math.round(elapsedMs / 1000)}s: ${details.message || 'unknown error'}${close}${closeReason}`;
  }

  if (details.reason === 'agent') {
    const close = details.closeCode ? ` close=${details.closeCode}` : '';
    const closeReason = details.closeReason ? ` reason=${details.closeReason}` : '';
    return `ElevenLabs ended before the interview produced transcript evidence after ${Math.round(elapsedMs / 1000)}s.${close}${closeReason}`;
  }

  return `ElevenLabs session ended before the interview produced transcript evidence after ${Math.round(elapsedMs / 1000)}s.`;
}
