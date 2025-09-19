import { useEffect, useCallback, useRef } from 'react';
import { OpenAIRealtimeClient, TranscriptChunk, RealtimeConfig } from '../utils/openaiRealtime';
import { conversationFlow, ConversationStateName } from '../utils/conversationFlow';
import { InterviewSetup } from '../types/interview';
import { createRealtimeSession, updateRealtimeSession, saveTranscriptChunk, saveRealtimeInterviewSession } from '../utils/supabase-interview';
import { supabase } from '../lib/supabase';
import { useInterviewState } from './useInterviewState';
import { extractSpeechMetrics, analyzeResponse as analyzeResponseWithAI, summarizeCandidateTurn } from '../utils/openai';
import { pcmToWav } from '../utils/audio';
import { VoiceTimelinePoint, ActionableFeedback, generateActionableFeedback } from '../utils/speechAnalysis';
import masterPrompt from "../masterprompt/masterPrompt";
import { detectFocusAndSeniority } from '../utils/specialization';
import { SessionLogger } from '../utils/sessionLogger';

// Simple interface for speech metrics in realtime interviews
interface SpeechMetrics {
  [key: string]: unknown;
  confidenceTips?: string[];
}

interface SpeechMetricEntry {
  questionId?: string;
  metrics: SpeechMetrics;
}

// Generate a simple UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const classifyQuestionCategory = (text: string): string => {
  const q = text.toLowerCase();
  if (/describe a time|tell me about|give me an example|have you ever|situation|challenge/.test(q)) return 'behavioral';
  if (/technical|code|algorithm|programming|data structure|system design/.test(q)) return 'technical';
  if (/scenario|how would you|what would you do/.test(q)) return 'situational';
  if (/why do you want|company|culture|fit|values/.test(q)) return 'fit';
  return 'general';
};

const QUESTION_TIME_LIMITS: Record<ConversationStateName, { default: number; byCategory?: Record<string, number> }> = {
  small_talk: { default: 0 },
  warm_up: { default: 3, byCategory: { behavioral: 3, situational: 4, general: 3 } },
  core: { default: 4, byCategory: { technical: 5, situational: 4, behavioral: 3, fit: 3, general: 4 } },
  closing: { default: 2, byCategory: { fit: 2, general: 2 } }
};

const formatTimePrompt = (state: ConversationStateName, minutes: number, category?: string): string => {
  const suffix = minutes === 1 ? 'minute' : 'minutes';
  if (state === 'warm_up') {
    return `Feel free to take about ${minutes} ${suffix} to walk me through it.`;
  }
  if (state === 'core' && category === 'technical') {
    return `Take around ${minutes} ${suffix} here—thinking aloud is welcome.`;
  }
  if (state === 'closing') {
    return `Let's keep this to about ${minutes} ${suffix}.`;
  }
  return `Take up to ${minutes} ${suffix} for this one.`;
};

const getQuestionTimeLimitFor = (state: ConversationStateName, category?: string | null): number => {
  const config = QUESTION_TIME_LIMITS[state];
  if (!config) return 0;
  if (category && config.byCategory?.[category]) {
    return config.byCategory[category];
  }
  return config.default;
};

const getElapsedMinutes = (start: Date | null): number => {
  if (!start) return 0;
  return Math.floor((Date.now() - start.getTime()) / 60000);
};

interface UseRealtimeInterviewOptions {
  setup: InterviewSetup;
  interviewType?: string;
  focusedType?: string; // Add focused interview type
  mediaStream?: MediaStream | null; // Allow null values
  onComplete?: (sessionData: any) => void;
  onError?: (error: string) => void;
  onEscalation?: (reason: string) => void;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
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
  onError,
  onEscalation,
  experienceLevel
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
    handleAssistantResponse: baseHandleAssistantResponse,
    handleUserTranscript,
  } = useInterviewState();

  const initialFocusDetection = detectFocusAndSeniority([], { setup });

  const clientRef = useRef<OpenAIRealtimeClient | null>(null);
  const stateRef = useRef(state);
  // A/B testing flag for prompt strategy (A = current adaptive prompt, B = softer/gentle variant)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const experienceRef = useRef(experienceLevel || setup.experienceLevel);
  const speechMetricsRef = useRef<SpeechMetricEntry[]>([]);
  const currentQuestionRef = useRef<string>('');
  const currentQuestionCategoryRef = useRef<string>('general');
  const questionTimestampRef = useRef<number | null>(null);
  const responseTimesRef = useRef<number[]>([]);
  const endInterviewRef = useRef<() => void>();
  const categoryCountsRef = useRef<Record<string, number>>({});
  const categoryStruggleCountsRef = useRef<Record<string, number>>({});
  // Small-talk control
  const smallTalkNeededRef = useRef<boolean>(true);
  const smallTalkTurnsRef = useRef<number>(0);
  // Add a ref to store per-response segments for the voice timeline
  const voiceTimelineSegmentsRef = useRef<Array<{
    transcript: string;
    startTimestamp: number;
    endTimestamp: number;
    questionContext?: string;
  }>>([]);
  // Add a ref to collect transcript chunks for the current user response
  const currentUserChunksRef = useRef<TranscriptChunk[]>([]);
  const currentStateRef = useRef<ConversationStateName>('small_talk');
  const questionsInStateRef = useRef<number>(0);
  const stateStartRef = useRef<number>(Date.now());
  const currentPromptRef = useRef<string>(masterPrompt);
  const phaseOverlayRef = useRef<string>('');
  const loggerRef = useRef(new SessionLogger());
  const focusRef = useRef<string>(initialFocusDetection.focus);
  const seniorityRef = useRef<'junior'|'mid'|'senior'>(initialFocusDetection.seniority);
  const initialResponsesRef = useRef<string[]>([]);
  const focusDeterminedRef = useRef<boolean>(false);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerStateRef = useRef<{ limitMinutes: number; extended: boolean } | null>(null);
  const recentNotesRef = useRef<Array<{ content: string; createdAt: number }>>([]);
  const lastSummarizedHashRef = useRef<string | null>(null);
  const lastUserSpeechTimestampRef = useRef<number>(0);

  const pruneRecentNotes = useCallback(() => {
    const now = Date.now();
    recentNotesRef.current = recentNotesRef.current
      .filter(note => now - note.createdAt <= 15 * 60 * 1000)
      .slice(-4);
  }, []);

  const composeInstruction = useCallback(() => {
    pruneRecentNotes();
    const notes = recentNotesRef.current;
    const noteBlock = notes.length
      ? `\n\n[Recent Candidate Takeaways]\n${notes.map(note => `- ${note.content}`).join('\n')}`
      : '';
    const exp = experienceRef.current;
    const elapsed = getElapsedMinutes(startTimeRef.current);
    const focus = focusRef.current;
    const seniority = seniorityRef.current;
    const basePrompt = currentPromptRef.current || masterPrompt;
    const overlay = phaseOverlayRef.current ? `\n\n${phaseOverlayRef.current}` : '';
    return `${basePrompt}${overlay}${noteBlock}\n\n[Experience: ${exp}] [Elapsed: ${elapsed}m] [Focus: ${focus}] [Seniority: ${seniority}]`;
  }, [pruneRecentNotes]);

  const pushInstruction = useCallback((overlay?: string) => {
    if (typeof overlay === 'string') {
      phaseOverlayRef.current = overlay;
    }
    if (!clientRef.current) return;
    const instructions = composeInstruction();
    clientRef.current.sendEvent('session.update', { session: { instructions } });
  }, [composeInstruction]);

  const addActiveListeningNotes = useCallback((notes: string[]) => {
    if (!notes.length) return;
    const cleaned = notes.map(note => note.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!cleaned.length) return;
    const now = Date.now();
    const existing = new Set(recentNotesRef.current.map(note => note.content));
    const toAppend = cleaned.filter(note => !existing.has(note));
    if (!toAppend.length) return;
    recentNotesRef.current = [
      ...recentNotesRef.current,
      ...toAppend.map(content => ({ content, createdAt: now }))
    ];
    pruneRecentNotes();
    pushInstruction();
  }, [pruneRecentNotes, pushInstruction]);

  const transitionState = useCallback((next?: ConversationStateName) => {
    if (!next) return;
    currentStateRef.current = next;
    questionsInStateRef.current = 0;
    stateStartRef.current = Date.now();
    const cfg = conversationFlow[next];
    pushInstruction(cfg.instructions);
  }, [pushInstruction]);

  const handleQuestionTimerExpired = useCallback(() => {
    const timerState = questionTimerStateRef.current;
    if (!timerState) return;

    const lastSpokeAgo = lastUserSpeechTimestampRef.current
      ? Date.now() - lastUserSpeechTimestampRef.current
      : Number.POSITIVE_INFINITY;

    if (!timerState.extended && lastSpokeAgo < 15000) {
      timerState.extended = true;
      questionTimerStateRef.current = timerState;
      clientRef.current?.createResponse('No rush—take another minute if you need to finish your thought.');
      questionTimerRef.current = setTimeout(handleQuestionTimerExpired, 60000);
      return;
    }

    clientRef.current?.createResponse("Let's pause there and move to the next topic.");
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    questionTimerStateRef.current = null;

    const stateName = currentStateRef.current;
    const state = conversationFlow[stateName];
    if (!state) return;

    const elapsedInPhase = (Date.now() - stateStartRef.current) / 60000;

    if (stateName === 'small_talk' || stateName === 'warm_up') {
      if (state.next) {
        transitionState(state.next);
      }
      return;
    }

    if (stateName === 'core') {
      const phaseLimit = state.exitCriteria.time;
      if (phaseLimit && elapsedInPhase >= phaseLimit) {
        if (state.next) {
          transitionState(state.next);
        }
      } else {
        pushInstruction();
      }
      return;
    }

    if (state.next && state.exitCriteria.time && elapsedInPhase >= state.exitCriteria.time) {
      transitionState(state.next);
    }
  }, [pushInstruction, transitionState]);

  const triggerEscalation = useCallback((reason: string) => {
    if (clientRef.current) {
      clientRef.current.createResponse('Ending our session now.');
      clientRef.current.sendEvent('session.update', {
        session: { instructions: 'finish_session' }
      });
    }
    endInterviewRef.current?.();
    if (onEscalation) onEscalation(reason);
  }, [onEscalation]);

  const requestFollowUp = useCallback((text: string) => {
    const state = conversationFlow[currentStateRef.current];
    const followUpBlock = state.followUpInstruction
      ? `${state.instructions}\n\n[Follow-up Reminder] ${state.followUpInstruction}`
      : state.instructions;
    pushInstruction(followUpBlock);
    clientRef.current?.createResponse(text);
  }, [pushInstruction]);

  const checkEscalation = useCallback((text: string) => {
    const lower = text.toLowerCase();
    if (/harass|abuse|threat/.test(lower)) {
      triggerEscalation('harassment');
    } else if (/human|escalate|supervisor/.test(lower)) {
      triggerEscalation('user_request');
    }
  }, [triggerEscalation]);

  const handleAssistantResponseWithFlow = useCallback((text: string, isFinal: boolean) => {
    baseHandleAssistantResponse(text, isFinal);
    if (isFinal && text.includes('I do not provide feedback, hints, or solutions')) {
      loggerRef.current.log({ timestamp: Date.now(), type: 'refusal', text });
    }
    if (isFinal) {
      questionsInStateRef.current += 1;
      const state = conversationFlow[currentStateRef.current];
      if (state.exitCriteria.questions && questionsInStateRef.current >= state.exitCriteria.questions) {
        if (state.next) {
          transitionState(state.next);
        }
      } else if (currentStateRef.current === 'closing') {
        endInterviewRef.current?.();
      }
    }
  }, [baseHandleAssistantResponse, transitionState]);

  // Keep a ref to the latest state for event listener closures
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Phase management based on timing
  const manageInterviewPhases = useCallback((duration: number) => {
    const minutes = duration / 60;
    if (minutes >= maxDuration) {
      if (clientRef.current) {
        clientRef.current.createResponse('That concludes the interviewer-only session. Thank you.');
        clientRef.current.sendEvent('session.update', { session: { instructions: 'finish_session' } });
      }
      endInterviewRef.current?.();
      return;
    }
    const state = conversationFlow[currentStateRef.current];
    if (state.exitCriteria.time) {
      const elapsed = (Date.now() - stateStartRef.current) / 60000;
      if (elapsed >= state.exitCriteria.time) {
        const next = state.onTimeout || state.next;
        transitionState(next);
      }
    }
  }, [maxDuration, transitionState]);

  // Generate adaptive system prompt
  // Static prompt usage – no adaptive system prompt builders

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
      currentQuestionCategoryRef.current = classifyQuestionCategory(chunk.text);
      categoryCountsRef.current[currentQuestionCategoryRef.current] =
        (categoryCountsRef.current[currentQuestionCategoryRef.current] || 0) + 1;
      questionTimestampRef.current = chunk.timestamp;
      loggerRef.current.log({ timestamp: chunk.timestamp, type: 'question', text: chunk.text });
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      questionTimerStateRef.current = null;
      const limitMinutes = getQuestionTimeLimitFor(currentStateRef.current, currentQuestionCategoryRef.current);
      if (limitMinutes > 0) {
        questionTimerStateRef.current = { limitMinutes, extended: false };
        const timePrompt = formatTimePrompt(currentStateRef.current, limitMinutes, currentQuestionCategoryRef.current);
        clientRef.current?.createResponse(timePrompt);
        questionTimerRef.current = setTimeout(handleQuestionTimerExpired, limitMinutes * 60000);
      }
    }

    // Collect user transcript chunks for accurate timing
    if (chunk.speaker === 'user') {
      currentUserChunksRef.current.push(chunk);
      loggerRef.current.log({ timestamp: chunk.timestamp, type: 'answer', text: chunk.text });
      initialResponsesRef.current.push(chunk.text);
      if (initialResponsesRef.current.length > 6) {
        initialResponsesRef.current.shift();
      }
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      questionTimerStateRef.current = null;
      if (!focusDeterminedRef.current && initialResponsesRef.current.length >= 2) {
        const { focus, seniority } = detectFocusAndSeniority(initialResponsesRef.current, { setup });
        focusRef.current = focus;
        seniorityRef.current = seniority;
        focusDeterminedRef.current = true;
        pushInstruction();
      }
    }

    // Analyze user responses for voice metrics
    if (chunk.speaker === 'user' && chunk.text.trim().length > 10) {
      const userChunks = [...currentUserChunksRef.current];
      if (userChunks.length > 0) {
        const startTimestamp = userChunks[0].timestamp;
        const endTimestamp = userChunks[userChunks.length - 1].timestamp;
        const combinedAnswer = userChunks.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
        voiceTimelineSegmentsRef.current.push({
          transcript: combinedAnswer,
          startTimestamp,
          endTimestamp,
          questionContext: currentQuestionRef.current || undefined
        });
        const answerHash = `${currentQuestionRef.current}|${combinedAnswer}`;
        if (
          combinedAnswer &&
          combinedAnswer.split(' ').length >= 8 &&
          currentStateRef.current !== 'small_talk' &&
          answerHash !== lastSummarizedHashRef.current
        ) {
          try {
            const notes = await summarizeCandidateTurn(combinedAnswer, {
              question: currentQuestionRef.current,
              setup
            });
            if (notes.length) {
              addActiveListeningNotes(notes);
              lastSummarizedHashRef.current = answerHash;
            }
          } catch (error) {
            console.error('Failed to summarize candidate response', error);
          }
        }
      }
      currentUserChunksRef.current = [];
    }

    // Evaluate dynamic transitions based on user input
    if (chunk.speaker === 'user') {
      const stateCfg = conversationFlow[currentStateRef.current];
      if (stateCfg.onKeyword) {
        const lower = chunk.text.toLowerCase();
        for (const [keyword, next] of Object.entries(stateCfg.onKeyword)) {
          if (lower.includes(keyword)) {
            transitionState(next);
            break;
          }
        }
      }
    }
  }, [
    state.sessionId,
    setup,
    setup.interviewMode,
    transitionState,
    pushInstruction,
    handleQuestionTimerExpired,
    addActiveListeningNotes
  ]);


  // Initialize realtime client with adaptive prompting
  const initializeClient = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    const baseInstructions = masterPrompt;

    currentPromptRef.current = baseInstructions;
    phaseOverlayRef.current = '';
    const instructions = composeInstruction();

    const config: Partial<RealtimeConfig> = {
      voice: 'alloy',
      instructions,
      modalities: setup.interviewMode === 'voice' ? ['text', 'audio'] : ['text'],
      temperature: focusedType ? 0.6 : 0.65 // Slightly reduced for more natural phrasing
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
        smallTalkNeededRef.current = !focusedType; // Needed for non-focused
        smallTalkTurnsRef.current = 0;
        startTimer();
        transitionState(currentStateRef.current);

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

            // Gentle opening: prefer light, high-level question over project deep-dive
            const humanOpeners = [
              `What first pulled you toward ${setup.jobType}?`,
              `What about ${setup.industry} has kept you curious lately?`,
              `If you had to pick one theme in your work recently, what would it be?`,
              `What part of your day-to-day right now energizes you most?`
            ];
            const openingQuestion = humanOpeners[Math.floor(Math.random() * humanOpeners.length)];

            // Conversational bridge: if user small-talk was minimal, soften the transition
            const bridgeInstruction = `After this brief chat, acknowledge their response naturally (e.g., "Makes sense"). Then ease into a single, casual opener (avoid stacked questions): "${openingQuestion}".`;

            const veryHumanSmallTalkInstruction = `Start with this natural greeting: "${selectedGreeting}"

Wait for their response, then continue with genuine curiosity by asking: "${followUpPrompt}"

Be super conversational and human-like:
- React authentically to what they share (if they mention being tired, acknowledge it; if excited, match their energy)
- Use natural speech patterns with filler words occasionally ("you know," "I mean," "that's interesting")
- Ask follow-up questions based on what they tell you (if they mention coffee, ask about their coffee preference; if they mention being busy, ask what's keeping them busy)
- Share brief, appropriate observations or relate to their experience ("I'm definitely more of a morning person myself" or "Monday can be tough!")
- Use casual language and contractions ("I'm," "you're," "that's," "what's")
- Show genuine interest in their answers - don't just ask and move on

Take about 2 minutes for this natural conversation. Let it flow organically. When it feels natural, transition with something like:
- "Well, I'm really excited to learn more about you and your background..."
- "This has been great getting to know you a bit! So let's dive into..."
- "I love that! Okay, so let's talk about your experience..."

${bridgeInstruction}

Remember: Be genuinely human, not scripted. Listen actively and respond like a real person having a real conversation would.

[TIMING CONTEXT]: You are in the SMALL TALK phase (0-2 minutes). Focus on building rapport and natural conversation. The system will automatically guide you to transition to interview questions after roughly 2 minutes of genuine conversation.`;
            
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
          lastUserSpeechTimestampRef.current = Date.now();
          handleUserTranscript(chunk.text, !chunk.isPartial);
          if (!chunk.isPartial) {
            checkEscalation(chunk.text);
          }
          // Small-talk persistence: if early and reply is minimal, force another small-talk follow-up
          try {
            const minutesSinceStart = startTimeRef.current ? (Date.now() - startTimeRef.current.getTime()) / 60000 : 0;
            if (!chunk.isPartial && minutesSinceStart < 2.5 && smallTalkNeededRef.current) {
              const t = (chunk.text || '').trim().toLowerCase();
              const isLowContent = t.length <= 8 || /^(no|nah|ok|okay|fine|good|yep|yup|sure|idk|i don't know|hmm|lol|not really|i dunno)$/.test(t);
              if (isLowContent) {
                smallTalkTurnsRef.current += 1;
                // Nudge the model explicitly via a user-side control message, then trigger a response
                clientRef.current?.sendUserMessage('[POLICY]: Their reply was minimal. Stay in small talk. Ask a different, friendly follow-up. Do NOT start interview questions yet.');
                clientRef.current?.createResponse();
              } else {
                // Mark small talk satisfied after at least one substantive reply or 2+ brief turns
                smallTalkNeededRef.current = smallTalkTurnsRef.current >= 2 ? false : true;
                if (!smallTalkNeededRef.current) {
                  clientRef.current?.sendUserMessage('[INTERNAL CONTEXT]: Small talk complete. Transition gently to the first opener.');
                }
              }
            }
          } catch { /* ignore */ }
        } else if (chunk.speaker === 'assistant') {
          // Use handleAssistantResponse for AI text, which manages buffering
          handleAssistantResponseWithFlow(chunk.text, !chunk.isPartial);

          // Nudge: if early and last user reply was very short, ask one more small-talk follow-up before opener
          try {
            const minutesSinceStart = startTimeRef.current ? (Date.now() - startTimeRef.current.getTime()) / 60000 : 0;
            if (minutesSinceStart < 2.5 && !chunk.isPartial) {
              const transcriptSoFar = stateRef.current?.transcript || [];
              const lastUser = [...transcriptSoFar].reverse().find(c => c.speaker === 'user' && !c.isPartial);
              if (lastUser) {
                const text = lastUser.text.trim().toLowerCase();
                const wasShort = text.length <= 8 || /^(no|nah|ok|okay|fine|good|yep|yup|sure|oi|hmm|lol|idk|i don't know)$/.test(text);
                if (wasShort) {
                  clientRef.current?.sendUserMessage('[INTERNAL CONTEXT]: Their last reply was very short/low-content. Ask one more human follow-up before the opener. No templates, keep it casual.');
                }
              }
            }
          } catch { /* ignore */ }
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
        handleAssistantResponseWithFlow('', true);
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

      clientRef.current.on('finish_session', () => {
        endInterviewRef.current?.();
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
    focusedType,
    setStatus,
    setError,
    setDuration,
    setSpeakerStatus,
    handleAssistantResponseWithFlow,
    handleUserTranscript,
    handleCompleteTranscriptChunk,
    checkEscalation,
    composeInstruction
  ]);

  // Start timer
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const currentDuration = Math.floor((Date.now() - startTime) / 1000);
      setDuration(currentDuration);

      if (clientRef.current && currentDuration % 60 === 0) {
        pushInstruction();
        const minutes = Math.floor(currentDuration / 60);
        loggerRef.current.log({ timestamp: Date.now(), type: 'elapsed', text: `${minutes}m` });
        console.debug(`[elapsed] ${minutes}m`);
      }

      // Manage interview phases based on timing
      manageInterviewPhases(currentDuration);
    }, 1000);
  }, [setDuration, manageInterviewPhases, pushInstruction]);

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

    const classifyQuestion = (text: string, index: number, timestamp: number): 'opening' | 'small_talk' | 'behavioral' | 'technical' | 'situational' | 'follow_up' | 'problem_solving' | 'leadership' | 'cultural_fit' | 'caseStudy' | 'systemDesign' | 'leadershipAssessment' | 'closing' => {
      const q = text.toLowerCase();
      const isEarly = startTimeRef.current ? (timestamp - startTimeRef.current.getTime()) <= 120 * 1000 : true;
      if (index < 2 && isEarly && SMALL_TALK_PHRASES.some(p => q.includes(p))) {
        return 'small_talk';
      }
      if (/tell me about|describe a time|give me an example|have you ever|situation|challenge|conflict|time when/.test(q)) {
        return 'behavioral';
      }
      if (/technical|code|algorithm|programming|data structure|complexity|system design/.test(q)) {
        return 'technical';
      }
      if (/goal|future|career|plan|five year/.test(q)) {
        return 'behavioral';
      }
      if (/team|collaborat|coworker|work with others/.test(q)) {
        return 'behavioral';
      }
      if (/why do you want|company|culture|fit|values/.test(q)) {
        return 'cultural_fit';
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
            { text: currentQuestion, type: (prevQuestion?.category as any) || 'behavioral', id: `q${Date.now()}` },
            currentResponse.trim(),
            (setup as any)?.jobType ? setup : {
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

        const category = classifyQuestion(currentQuestion, questions.length, chunk.timestamp);
        questions.push({
          id: currentQuestionId,
          text: currentQuestion,
          category,
          type: category
        });
        categoryCountsRef.current[category] = (categoryCountsRef.current[category] || 0) + 1;

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
        { text: currentQuestion, type: (prevQuestion?.category as any) || 'behavioral', id: `q${Date.now()}` },
        currentResponse.trim(),
        (setup as any)?.jobType ? setup : {
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
            model_type: 'gpt-realtime',
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

      const metrics = await extractSpeechMetrics(fullAudioBlob, fullTranscription, duration);
      if (metrics) {
        const feedback = generateActionableFeedback(metrics as any, fullTranscription, undefined);
        (metrics as any).confidenceTips = feedback.confidenceTips;
        return [{ questionId: 'summary', metrics }];
      }
      return [];
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
            logs: loggerRef.current.getEntries(),
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
            logs: loggerRef.current.getEntries(),
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
          logs: loggerRef.current.getEntries(),
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

  useEffect(() => {
    endInterviewRef.current = endInterview;
  }, [endInterview]);

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
    checkEscalation(message);

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
  }, [setup.interviewMode, processTranscriptChunk, handleCompleteTranscriptChunk, checkEscalation]);

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
    requestFollowUp,
    pauseInterview,
    resumeInterview,
    endInterview,
    startRecording,
    stopRecording,
    sendTextMessage,
    getSpeechMetrics,
    resetSpeechMetrics,
    categoryCounts: categoryCountsRef.current,
    categoryStruggles: categoryStruggleCountsRef.current
  };
}