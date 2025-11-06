import { useEffect, useCallback, useRef } from 'react';
import { OpenAIRealtimeClient, TranscriptChunk as OpenAITranscriptChunk, RealtimeConfig } from '../utils/openaiRealtime';
import { HumeRealtimeClient, TranscriptChunk as HumeTranscriptChunk, HumeConfig } from '../utils/humeRealtime';
import { buildAdaptiveSystemPrompt, AdaptivePromptOptions, buildFollowUpPrompt, extractKeyTopics, getFocusedInterviewPrompt, buildUnpredictableInterviewPrompt } from '../utils/promptTemplates';
import { InterviewSetup, CollegeInterviewSetup, TimeContext } from '../types/interview';
import { createRealtimeSession, updateRealtimeSession, saveTranscriptChunk, saveRealtimeInterviewSession } from '../utils/supabase-interview';
import { supabase } from '../lib/supabase';
import { useInterviewState } from './useInterviewState';
import { extractSpeechMetrics, analyzeResponse as analyzeResponseWithAI } from '../utils/openai';
import { pcmToWav } from '../utils/audio';
import { VoiceTimelinePoint, ActionableFeedback, generateActionableFeedback } from '../utils/speechAnalysis';
import { sophisticatedAnalyticsEngine } from '../utils/sophisticatedAnalytics';
import { useExpressionMeasurement } from './useExpressionMeasurement';
import { ProsodyPrediction, LanguagePrediction } from '../utils/humeExpressionMeasurement';

// Unified transcript chunk type
export type TranscriptChunk = OpenAITranscriptChunk | HumeTranscriptChunk;

// Unified client type
type RealtimeClient = OpenAIRealtimeClient | HumeRealtimeClient;

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
  setup: InterviewSetup | CollegeInterviewSetup;
  interviewType?: string;
  focusedType?: string; // Add focused interview type
  mediaStream?: MediaStream | null; // Allow null values
  onComplete?: (sessionData: any) => void;
  onError?: (error: string) => void;
  provider?: 'openai' | 'hume'; // Choose AI provider
  enableExpressionMeasurement?: boolean; // Enable Hume Expression Measurement
}

// Get interview duration based on type
const getInterviewDuration = (interviewType?: string): number => {
  switch (interviewType) {
    case 'standard':
      return 20; // 20 minutes for standard interviews
    case 'college':
      return 10; // 10 minutes for college interviews
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
  provider = 'hume', // Default to Hume AI
  enableExpressionMeasurement = true // Default: enable expression measurement
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

  // Initialize expression measurement hook
  const expressionMeasurement = useExpressionMeasurement({
    enabled: enableExpressionMeasurement && provider === 'hume', // Only for Hume provider
    enableProsody: true, // Voice emotion analysis
    enableLanguage: true, // Text emotion analysis
    enableFace: false, // Face analysis disabled by default (requires video processing)
    onProsodyMeasurement: useCallback((prediction: ProsodyPrediction) => {
      // Store prosody predictions for later analysis
      console.log('[Interview Expression] Prosody measurement received');
    }, []),
    onLanguageMeasurement: useCallback((prediction: LanguagePrediction) => {
      // Store language predictions for later analysis
      console.log('[Interview Expression] Language measurement received:', prediction.text);
    }, []),
    onError: useCallback((error: Error) => {
      console.error('[Interview Expression] Error:', error);
      // Don't fail the interview if expression measurement fails
    }, [])
  });

  const clientRef = useRef<RealtimeClient | null>(null);
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

  // Time-aware interview tracking refs
  const coveredQuestionTypesRef = useRef<Set<string>>(new Set());
  const recentTopicsRef = useRef<string[]>([]);
  const candidateClaimsRef = useRef<Array<{ question: string; claim: string; timestamp: number }>>([]);
  const promptUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentQuestionStartTimeRef = useRef<number | null>(null);

  // All possible question types for tracking
  const ALL_QUESTION_TYPES = [
    'background',
    'behavioral',
    'technical',
    'situational',
    'problem-solving',
    'conflict-resolution',
    'leadership',
    'failure-recovery',
    'goals-motivation',
    'culture-fit',
    'strengths-weaknesses',
    'specific-skills'
  ];

  // Classify question type using keyword matching (fast, local classification)
  const classifyQuestionType = useCallback((questionText: string): string => {
    const lower = questionText.toLowerCase();

    if (lower.includes('tell me about yourself') || lower.includes('walk me through your resume') ||
        lower.includes('your background')) {
      return 'background';
    }
    if (lower.includes('time when') || lower.includes('example of') || lower.includes('describe a situation') ||
        lower.includes('tell me about a time')) {
      return 'behavioral';
    }
    if (lower.includes('technical') || lower.includes('code') || lower.includes('algorithm') ||
        lower.includes('programming') || lower.includes('implement')) {
      return 'technical';
    }
    if (lower.includes('if you') || lower.includes('what would you do') || lower.includes('how would you handle') ||
        lower.includes('imagine')) {
      return 'situational';
    }
    if (lower.includes('solve') || lower.includes('approach') || lower.includes('problem') ||
        lower.includes('challenge')) {
      return 'problem-solving';
    }
    if (lower.includes('conflict') || lower.includes('disagreement') || lower.includes('difficult person')) {
      return 'conflict-resolution';
    }
    if (lower.includes('lead') || lower.includes('manage') || lower.includes('team') || lower.includes('delegate')) {
      return 'leadership';
    }
    if (lower.includes('fail') || lower.includes('mistake') || lower.includes('setback') ||
        lower.includes('didn\'t go well')) {
      return 'failure-recovery';
    }
    if (lower.includes('goal') || lower.includes('career') || lower.includes('future') ||
        lower.includes('where do you see') || lower.includes('motivate')) {
      return 'goals-motivation';
    }
    if (lower.includes('culture') || lower.includes('values') || lower.includes('work environment') ||
        lower.includes('why do you want')) {
      return 'culture-fit';
    }
    if (lower.includes('strength') || lower.includes('weakness') || lower.includes('what are you good at')) {
      return 'strengths-weaknesses';
    }
    if (lower.includes('experience with') || lower.includes('skill') || lower.includes('proficiency')) {
      return 'specific-skills';
    }

    return 'behavioral'; // default fallback
  }, []);

  // Extract topics from question text
  const extractTopicsFromQuestion = useCallback((questionText: string): string[] => {
    const topics: string[] = [];
    const lower = questionText.toLowerCase();

    // Common interview topics
    const topicKeywords = [
      'leadership', 'teamwork', 'communication', 'problem-solving', 'technical skills',
      'project management', 'conflict resolution', 'time management', 'adaptability',
      'innovation', 'customer service', 'data analysis', 'strategy', 'collaboration',
      'decision making', 'pressure', 'deadline', 'prioritization', 'negotiation'
    ];

    topicKeywords.forEach(topic => {
      if (lower.includes(topic)) {
        topics.push(topic);
      }
    });

    return topics;
  }, []);

  // Extract and track candidate claims for consistency testing
  const extractAndTrackClaims = useCallback((responseText: string, questionText: string, timestamp: number) => {
    const lower = responseText.toLowerCase();

    // Keywords that indicate specific claims
    const claimIndicators = [
      'i led', 'i managed', 'i built', 'i created', 'i developed', 'i designed',
      'i implemented', 'i increased', 'i reduced', 'i improved', 'i achieved',
      'my team', 'i was responsible', 'i worked with', 'i collaborated',
      'i have experience', 'i specialize', 'i\'m skilled', 'i\'m proficient'
    ];

    // Check if response contains specific claims worth tracking
    const containsClaim = claimIndicators.some(indicator => lower.includes(indicator));

    if (containsClaim && responseText.length > 30) {
      // Extract the key claim (simplified - in production would use NLP)
      const claim = responseText.substring(0, 150); // First 150 chars as the claim

      candidateClaimsRef.current.push({
        question: questionText,
        claim: claim,
        timestamp: timestamp
      });

      // Keep only last 10 claims to avoid memory bloat
      if (candidateClaimsRef.current.length > 10) {
        candidateClaimsRef.current = candidateClaimsRef.current.slice(-10);
      }

      console.log(`[Claim Tracked] "${claim.substring(0, 50)}..."`);
    }
  }, []);

  // Generate time-aware context for unpredictable interview prompts
  const generateTimeContext = useCallback((): TimeContext => {
    const now = Date.now();
    const startTime = startTimeRef.current ? startTimeRef.current.getTime() : now;
    const elapsedMs = now - startTime;
    const elapsedMinutes = elapsedMs / 1000 / 60;
    const remainingMinutes = Math.max(0, maxDuration - elapsedMinutes);
    const percentComplete = Math.min(100, (elapsedMinutes / maxDuration) * 100);

    const coveredTypes = Array.from(coveredQuestionTypesRef.current);
    const uncoveredTypes = ALL_QUESTION_TYPES.filter(type => !coveredTypes.includes(type));
    const coveragePercent = (coveredTypes.length / ALL_QUESTION_TYPES.length) * 100;

    const pace = elapsedMinutes > 0 ? state.questionCount / elapsedMinutes : 0;

    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (percentComplete > 70 && uncoveredTypes.length > 4) {
      urgency = 'high';
    } else if (percentComplete > 50 && uncoveredTypes.length > 6) {
      urgency = 'medium';
    }

    return {
      duration: elapsedMinutes,
      timeRemaining: remainingMinutes,
      percentComplete,
      questionCount: state.questionCount,
      recentTopics: recentTopicsRef.current.slice(-5), // Last 5 topics
      coveredTypes,
      uncoveredTypes,
      coveragePercent,
      pace,
      urgency
    };
  }, [maxDuration, state.questionCount, ALL_QUESTION_TYPES]);

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

  // Continuous prompt update system for time-aware unpredictable interviews
  const updateTimeAwarePrompt = useCallback(() => {
    // Only update for standard realtime interviews (not focused or college)
    if (focusedType || interviewType === 'college') {
      return;
    }

    // Skip if the interview setup doesn't have required fields
    if (!('jobType' in setup)) {
      return;
    }

    const timeContext = generateTimeContext();
    let updatedPrompt = buildUnpredictableInterviewPrompt({
      setup: setup as InterviewSetup,
      timeContext
    });

    // Add candidate claims for consistency testing (if we're past the 8-minute mark)
    if (timeContext.duration >= 8 && candidateClaimsRef.current.length > 0) {
      const claimsSummary = candidateClaimsRef.current.map((c, i) =>
        `${i + 1}. "${c.claim.substring(0, 80)}..." (${Math.floor((Date.now() - c.timestamp) / 1000 / 60)} min ago)`
      ).join('\n');

      updatedPrompt += `\n\n# CANDIDATE CLAIMS TO TEST FOR CONSISTENCY

You've collected these claims from the candidate. Consider circling back to test consistency:

${claimsSummary}

**When to test consistency:**
- Mid-interview (8-15 min): Casually reference an earlier claim: "You mentioned earlier that you led X. How did you handle Y aspect?"
- Late interview (15-18 min): More direct: "I want to go back to something you said about X. Can you elaborate on..."

Be natural about it - don't make it obvious you're testing consistency. Make it feel like genuine curiosity or clarification.`;
    }

    if (clientRef.current) {
      clientRef.current.updateSystemPrompt(updatedPrompt);
      console.log(`[Time-Aware] Updated prompt at ${timeContext.duration.toFixed(1)} min - Coverage: ${timeContext.coveragePercent.toFixed(0)}% - Urgency: ${timeContext.urgency} - Claims: ${candidateClaimsRef.current.length}`);
    }
  }, [focusedType, interviewType, setup, generateTimeContext]);

  // Start continuous prompt updates every 30 seconds
  const startContinuousPromptUpdates = useCallback(() => {
    // Clear any existing timer
    if (promptUpdateTimerRef.current) {
      clearInterval(promptUpdateTimerRef.current);
    }

    // Only for standard realtime interviews
    if (focusedType || interviewType === 'college') {
      return;
    }

    // Update immediately
    updateTimeAwarePrompt();

    // Set up 30-second interval
    promptUpdateTimerRef.current = setInterval(() => {
      updateTimeAwarePrompt();
    }, 30000); // 30 seconds
  }, [focusedType, interviewType, updateTimeAwarePrompt]);

  // Stop continuous prompt updates
  const stopContinuousPromptUpdates = useCallback(() => {
    if (promptUpdateTimerRef.current) {
      clearInterval(promptUpdateTimerRef.current);
      promptUpdateTimerRef.current = null;
    }
  }, []);

  // Per-question time limit system (polite interruptions)
  const startQuestionTimer = useCallback((questionText: string) => {
    // Only for standard realtime interviews
    if (focusedType || interviewType === 'college' || !('jobType' in setup)) {
      return;
    }

    // Clear any existing timer
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
    }

    currentQuestionStartTimeRef.current = Date.now();

    // Set time limit based on question complexity
    // Background questions: 2 minutes max
    // Behavioral/situational: 2.5 minutes max
    // Technical/problem-solving: 3 minutes max
    // Other questions: 2 minutes max
    const lower = questionText.toLowerCase();
    let timeLimit = 120000; // 2 minutes default

    if (lower.includes('technical') || lower.includes('algorithm') || lower.includes('system design') ||
        lower.includes('problem') || lower.includes('solve')) {
      timeLimit = 180000; // 3 minutes for complex questions
    } else if (lower.includes('time when') || lower.includes('situation') || lower.includes('example of') ||
               lower.includes('challenge') || lower.includes('conflict')) {
      timeLimit = 150000; // 2.5 minutes for behavioral questions
    }

    // Set timer to politely interrupt after time limit
    questionTimerRef.current = setTimeout(() => {
      if (clientRef.current) {
        // Send polite interruption as an internal message
        const politeInterruptions = [
          "I appreciate the detail you're sharing. Let me ask a follow-up to keep us moving forward.",
          "That's really valuable insight. I want to make sure we cover everything, so let me build on that with another question.",
          "Thank you for that response. I'd like to explore another area while we have time.",
          "I see. Let me direct us to another topic to make the most of our time together.",
          "Great. Let's continue with the next question to ensure we cover all the important areas."
        ];

        const interruption = politeInterruptions[Math.floor(Math.random() * politeInterruptions.length)];

        // Send the interruption instruction to the AI
        clientRef.current.sendUserMessage(
          `[INTERNAL: Candidate has been speaking for ${timeLimit / 1000 / 60} minutes. Politely interrupt now with: "${interruption}" and then immediately move to your next planned question. Be smooth and natural about the transition.]`
        );

        console.log(`[Question Timer] Polite interruption triggered after ${timeLimit / 1000} seconds`);
      }

      questionTimerRef.current = null;
    }, timeLimit);
  }, [focusedType, interviewType, setup]);

  // Stop question timer
  const stopQuestionTimer = useCallback(() => {
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    currentQuestionStartTimeRef.current = null;
  }, []);

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

    // For time-aware interviews, the continuous update system handles prompt updates
    // For other interviews, use the legacy adaptive system
    if (focusedType || interviewType === 'college') {
      // Update the system prompt with adaptive behavior (legacy)
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
    }
  }, [generateAdaptiveInstructions, state.questionCount, focusedType, interviewType]);

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

    // Track current question context for voice analysis and question type classification
    if (chunk.speaker === 'assistant' && chunk.text.trim().endsWith('?')) {
      currentQuestionRef.current = chunk.text;
      questionTimestampRef.current = chunk.timestamp;

      // Classify and track question type for time-aware context (only for standard/realtime interviews)
      if (!focusedType && interviewType !== 'college') {
        const questionType = classifyQuestionType(chunk.text);
        coveredQuestionTypesRef.current.add(questionType);

        // Extract and track topics
        const topics = extractTopicsFromQuestion(chunk.text);
        recentTopicsRef.current.push(...topics);
        // Keep only last 10 topics
        if (recentTopicsRef.current.length > 10) {
          recentTopicsRef.current = recentTopicsRef.current.slice(-10);
        }

        // Start per-question timer for this question
        startQuestionTimer(chunk.text);
      }
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

      // Send user transcript to expression measurement for language emotion analysis
      if (expressionMeasurement.isConnected && !chunk.isPartial) {
        expressionMeasurement.sendText(chunk.text);
      }

      // Track candidate claims for consistency testing (only for standard realtime interviews)
      if (!focusedType && interviewType !== 'college' && currentQuestionRef.current) {
        extractAndTrackClaims(chunk.text, currentQuestionRef.current, chunk.timestamp);
      }

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
  }, [state.sessionId, updateInterviewerBehavior, setup.interviewMode, focusedType, interviewType, extractAndTrackClaims]);


  // Initialize realtime client with adaptive prompting
  const initializeClient = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    // Determine which prompt system to use:
    // 1. Focused interviews: Use focused prompt
    // 2. College interviews: Use adaptive prompt (legacy)
    // 3. Standard realtime interviews: Use new time-aware unpredictable prompt
    let instructions: string;

    if (focusedType) {
      instructions = getFocusedInterviewPrompt(focusedType, setup);
    } else if (interviewType === 'college' || !('jobType' in setup)) {
      // Legacy adaptive prompt for college or non-standard setups
      instructions = generateAdaptiveInstructions();
    } else {
      // New time-aware unpredictable prompt for standard realtime interviews
      const initialTimeContext = generateTimeContext();
      instructions = buildUnpredictableInterviewPrompt({
        setup: setup as InterviewSetup,
        timeContext: initialTimeContext
      });
    }

    const config: Partial<RealtimeConfig> = {
      voice: 'alloy',
      instructions,
      modalities: setup.interviewMode === 'voice' ? ['text', 'audio'] : ['text'],
      temperature: focusedType ? 0.6 : 0.7 // Minimum temperature for realtime API is 0.6
    };

    try {
      // Create client based on provider
      if (provider === 'hume') {
        // Map experience level to simple format
        const experienceLevelMap: Record<string, string> = {
          'Entry Level (0-2 years)': 'entry',
          'Mid Level (3-5 years)': 'mid',
          'Senior Level (6-10 years)': 'senior',
          'Executive Level (10+ years)': 'executive'
        };
        const experienceLevel = experienceLevelMap[setup.experienceLevel || ''] || 'mid';

        const humeConfig: Partial<HumeConfig> = {
          configId: import.meta.env.VITE_HUME_CONFIG_ID, // Required: EVI config ID
          voice: 'Kelv', // Your custom voice from Hume platform
          instructions,
          variables: {
            experience_level: experienceLevel,
            interview_duration: '20',
            job_type: setup.jobType || 'Software Engineer'
          }
        };

        clientRef.current = new HumeRealtimeClient(
          import.meta.env.VITE_HUME_API_KEY,
          humeConfig,
          mediaStream || undefined
        );
      } else {
        // OpenAI Realtime (legacy)
        clientRef.current = new OpenAIRealtimeClient(
          import.meta.env.VITE_OPENAI_API_KEY,
          config,
          mediaStream || undefined
        );
      }

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

        // Start continuous prompt updates for time-aware interviews
        startContinuousPromptUpdates();

        // Send initial greeting message to start the interview (professional and brief)
        setTimeout(() => {
          if (focusedType) {
            // For focused interviews, start immediately with direct instruction
            const directInstruction = `Start the interview immediately. This is a focused ${focusedType} interview session. Follow your instructions precisely - be direct, efficient, and get straight to the relevant questions. No small talk needed.`;
            clientRef.current?.createResponse(directInstruction);
          } else if (interviewType !== 'college' && 'jobType' in setup) {
            // For standard realtime interviews, use brief professional greeting (15 seconds max)
            const currentTime = new Date();
            const hour = currentTime.getHours();

            const timeBasedGreeting =
              hour < 12 ? "Good morning" :
              hour < 17 ? "Good afternoon" :
              "Good evening";

            const professionalGreeting = `${timeBasedGreeting}! Thanks for joining me today. I'm looking forward to learning more about you and your experience. Let's get started - tell me a bit about your background and what brings you here today.`;

            const briefProfessionalInstruction = `Start with this professional greeting (keep it under 15 seconds): "${professionalGreeting}"

IMPORTANT RULES:
- Keep the opening VERY brief - under 15 seconds total
- NO small talk about weather, coffee, weekend, etc.
- Get straight to the interview questions after they respond
- Be professional and friendly, but efficient
- After they introduce themselves, immediately transition to your first substantive interview question
- Do NOT ask how their day is going or any casual conversation topics

After they respond to your greeting, IMMEDIATELY move into the interview with your first real question based on your interview strategy.`;

            clientRef.current?.createResponse(briefProfessionalInstruction);
          } else {
            // For college interviews or legacy interviews, keep the existing small talk approach
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

        // Send user audio chunks to expression measurement for prosody analysis
        if (expressionMeasurement.isConnected && clientRef.current) {
          const audioChunks = clientRef.current.getAllAudioChunks();
          // Send the most recent audio chunks (last few seconds)
          const recentChunks = audioChunks.slice(-10); // Last 10 chunks
          recentChunks.forEach(chunk => {
            expressionMeasurement.sendAudioChunk(chunk);
          });
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
    generateAdaptiveInstructions,
    onError,
    focusedType,
    interviewType,
    provider,
    setStatus,
    setError,
    setDuration,
    setSpeakerStatus,
    handleAssistantResponse,
    handleUserTranscript,
    handleCompleteTranscriptChunk,
    generateTimeContext,
    startContinuousPromptUpdates,
    classifyQuestionType,
    extractTopicsFromQuestion
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
          const analysis = await analyzeResponseWithAI(
            { text: currentQuestion, type: 'behavioral', id: `q${Date.now()}` },
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
            analysis: analysis
          });
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
      const analysis = await analyzeResponseWithAI(
        { text: currentQuestion, type: 'behavioral', id: `q${Date.now()}` },
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
        analysis: analysis
      });
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

      // Connect expression measurement if enabled
      if (enableExpressionMeasurement && provider === 'hume') {
        try {
          await expressionMeasurement.connect();
          console.log('[Interview] Expression measurement connected');
        } catch (expError) {
          console.error('[Interview] Failed to connect expression measurement:', expError);
          // Continue interview even if expression measurement fails
        }
      }

      // Interview will start after connection.opened event
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start interview';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [initializeClient, onError, setup, interviewType, setStatus, setError, setSessionId, enableExpressionMeasurement, provider, expressionMeasurement]);

  const pauseInterview = useCallback(async () => {
    if (clientRef.current?.isCurrentlyRecording()) {
      clientRef.current.stopAudioRecording();
    }
    setStatus('paused');
    setRecording(false);
    stopTimer();
    stopContinuousPromptUpdates();
    stopQuestionTimer();

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
  }, [stopTimer, stopContinuousPromptUpdates, stopQuestionTimer, state.sessionId, state.duration, state.questionCount, setStatus, setRecording]);

  const resumeInterview = useCallback(async () => {
    setStatus('interviewing');
    startTimer();
    startContinuousPromptUpdates();

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
  }, [startTimer, startContinuousPromptUpdates, state.sessionId, setStatus]);

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
    stopContinuousPromptUpdates();
    stopQuestionTimer();
    setStatus('processing');

    // Stop sophisticated analytics
    sophisticatedAnalyticsEngine.stopAnalysis();

    try {
      let voiceMetrics: SpeechMetricEntry[] | null = null;
      let voiceTimeline: VoiceTimelinePoint[] = [];
      try {
        console.log('Starting voice analytics processing...');
        voiceMetrics = await processVoiceAnalytics();
        console.log('Voice analytics processing finished.');
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

      // Get sophisticated analytics report
      let sophisticatedReport = null;
      try {
        sophisticatedReport = sophisticatedAnalyticsEngine.getFinalAnalysisReport();
        console.log('Sophisticated analytics report generated:', sophisticatedReport.summary.overallScore);
      } catch (error) {
        console.error('Error generating sophisticated analytics report:', error);
      }

      if (clientRef.current) {
        clientRef.current.disconnect();
      }

      // Disconnect expression measurement and analyze final metrics
      let expressionInsights = null;
      if (expressionMeasurement.isConnected) {
        const expressionMetrics = expressionMeasurement.getMetrics();
        console.log('[Interview] Expression measurement complete:', {
          prosodyCount: expressionMetrics.prosodyPredictions.length,
          languageCount: expressionMetrics.languagePredictions.length,
          topEmotions: expressionMetrics.topEmotions
        });

        // Analyze expression measurements to get insights
        if (expressionMetrics.prosodyPredictions.length > 0 || expressionMetrics.languagePredictions.length > 0) {
          try {
            const { analyzeExpressionMeasurements } = await import('../utils/expressionAnalytics');
            expressionInsights = analyzeExpressionMeasurements(
              expressionMetrics.prosodyPredictions,
              expressionMetrics.languagePredictions
            );
            console.log('[Interview] Expression insights generated:', expressionInsights);
          } catch (error) {
            console.error('[Interview] Failed to analyze expression measurements:', error);
          }
        }

        expressionMeasurement.disconnect();
      }

      setStatus('completed');
      
      // Update realtime session in Supabase with final data
      if (state.sessionId) {
        try {
          console.log('Updating realtime session in Supabase...');
          await updateRealtimeSession(state.sessionId, {
            end_time: new Date().toISOString(),
            status: 'completed',
            total_duration: state.duration,
            question_count: state.questionCount
          });

          // Parse transcript into structured Q&A pairs for analysis
          console.log('Parsing transcript into Q&A pairs...');
          const { questions, responses } = await parseTranscriptIntoQAPairs(state.transcript);
          
          // Calculate overall score from responses
          const overallScore = responses.length > 0 
            ? Math.round(responses.reduce((sum: number, r: any) => sum + r.analysis.score, 0) / responses.length * 10)
            : 70;
          
          // Prepare session data for completion
          const finalSpeechMetrics = voiceMetrics || getSpeechMetrics();
          console.log('Speech metrics collected:', finalSpeechMetrics.length, 'entries');
          
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
            speechMetrics: finalSpeechMetrics, // Include speech metrics like college interviews
            voice_metrics_summary: finalSpeechMetrics.length > 0 ? finalSpeechMetrics[0].metrics : null,
            responseTimes: responseTimesRef.current,
            voiceTimeline, // <-- Add the timeline here
            sophisticatedAnalytics: sophisticatedReport, // <-- Add sophisticated analytics
            expressionInsights // <-- Add expression measurement insights
          };

          // Save structured interview data for viewing in recent interviews
          try {
            console.log('Saving realtime interview session...');
            await saveRealtimeInterviewSession(sessionData);
          } catch (saveError) {
            console.error('Failed to save realtime interview session:', saveError);
            // Continue even if save fails
          }

          console.log('💙 useRealtimeInterview: Calling onComplete with session data...');
          console.log('💙 useRealtimeInterview: sessionData:', sessionData);
          console.log('💙 useRealtimeInterview: sessionData keys:', Object.keys(sessionData));
          console.log('💙 useRealtimeInterview: responses length:', sessionData.responses?.length);
          console.log('💙 useRealtimeInterview: questions length:', sessionData.questions?.length);
          console.log('💙 useRealtimeInterview: onComplete exists?', !!onComplete);

          if (!sessionData.responses || sessionData.responses.length === 0) {
            console.error('⚠️ useRealtimeInterview: NO RESPONSES IN SESSION DATA! This will cause black screen.');
            console.log('⚠️ useRealtimeInterview: Transcript length:', state.transcript?.length);
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
          
          // Add sophisticated analytics and expression insights to fallback data too
          try {
            const sophisticatedReport = sophisticatedAnalyticsEngine.getFinalAnalysisReport();
            (fallbackData as any).sophisticatedAnalytics = sophisticatedReport;
          } catch (error) {
            console.log('No sophisticated analytics available for fallback');
          }

          if (expressionInsights) {
            (fallbackData as any).expressionInsights = expressionInsights;
          }

          console.log('Calling onComplete with fallback data...');
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
        
        // Try to add sophisticated analytics and expression insights even to minimal data
        try {
          const sophisticatedReport = sophisticatedAnalyticsEngine.getFinalAnalysisReport();
          (minimalData as any).sophisticatedAnalytics = sophisticatedReport;
        } catch (error) {
          console.log('No sophisticated analytics available for minimal data');
        }

        if (expressionInsights) {
          (minimalData as any).expressionInsights = expressionInsights;
        }

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
      
      // Try to add sophisticated analytics and expression insights even to error data
      try {
        const sophisticatedReport = sophisticatedAnalyticsEngine.getFinalAnalysisReport();
        (fallbackData as any).sophisticatedAnalytics = sophisticatedReport;
      } catch (error) {
        console.log('No sophisticated analytics available for error data');
      }

      if (expressionInsights) {
        (fallbackData as any).expressionInsights = expressionInsights;
      }

      onComplete?.(fallbackData);
    }
  }, [state.sessionId, state.transcript, state.duration, state.questionCount, setup, interviewType, focusedType, onComplete, stopTimer, stopContinuousPromptUpdates, stopQuestionTimer, setStatus, getSpeechMetrics, processVoiceAnalytics]);

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
      if (expressionMeasurement.isConnected) {
        expressionMeasurement.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (promptUpdateTimerRef.current) {
        clearInterval(promptUpdateTimerRef.current);
      }
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
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