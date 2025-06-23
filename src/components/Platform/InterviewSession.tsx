import React, { useState, useEffect, useRef } from 'react';
import { Clock, MessageSquare, Play, Pause, Mic, MicOff, Phone, AlertCircle, Settings, ArrowLeft, Brain, Send, Volume2, VolumeX } from 'lucide-react';
import { InterviewSetup, InterviewSession as IInterviewSession, InterviewResponse, AIInterviewerState } from '../../types/interview';
import { generateInterviewQuestions, analyzeResponse, generateNextQuestion, synthesizeSpeech, AudioRecorder, processVoiceInput, extractSpeechMetrics, updateGlobalQuestions } from '../../utils/openai';
import { isElevenLabsTTSAvailable } from '../../utils/elevenLabsTTS';
import { saveSpeechAnalysisCache, createInitialInterviewSession } from '../../utils/supabase-interview';
import AIInterviewer from '../AIInterviewer';

// Utility function to format category labels
const formatCategoryLabel = (category: string): string => {
  const categoryMappings: { [key: string]: string } = {
    'school_fit': 'School Fit',
    'personal_qualities': 'Personal Qualities',
    'academic_readiness': 'Academic Readiness',
    'future_goals': 'Future Goals',
    'personal': 'Personal',
    'academic': 'Academic',
    'values': 'Values',
    'community': 'Community',
    'behavioral': 'Behavioral',
    'technical': 'Technical',
    'situational': 'Situational',
    'follow_up': 'Follow-up',
    'cultural_fit': 'Cultural Fit',
    'leadership': 'Leadership',
    'problem_solving': 'Problem Solving',
    'communication': 'Communication',
    'teamwork': 'Teamwork',
    'motivation': 'Motivation',
    'extracurricular': 'Extracurricular',
    'goals': 'Goals',
    'fit': 'Fit',
    'challenge': 'Challenge',
    'diversity': 'Diversity'
  };
  
  return categoryMappings[category] || category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

interface InterviewSessionProps {
  setup: InterviewSetup;
  onComplete: (sessionData: any) => void;
  onBack: () => void;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({ setup, onComplete, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  
  const [session, setSession] = useState<IInterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isVideoElementReady, setIsVideoElementReady] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  
  // Speech-to-text states - only for voice mode
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechMetrics, setSpeechMetrics] = useState<any[]>([]);

  // NEW: Track if AI is currently speaking to prevent user input
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [canUserRespond, setCanUserRespond] = useState(false);

  // Add AI state for adaptive interview
  const [aiState, setAiState] = useState<AIInterviewerState>({
    currentPersonality: 'friendly',
    adaptationLevel: 5,
    questionFlow: 'adaptive',
    focusAreas: []
  });
  // Check if OpenAI API key is configured
  const hasOpenAIKey = import.meta.env.VITE_OPENAI_API_KEY && 
                      import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';

  // Check if ElevenLabs TTS is available for voice synthesis
  const hasTTSAvailable = isElevenLabsTTSAvailable();

  // Check if this is voice mode
  const isVoiceMode = setup.interviewMode === 'voice';

  useEffect(() => {
    initializeSession();
    // Initialize audio recorder only for voice mode
    if (isVoiceMode) {
      audioRecorderRef.current = new AudioRecorder();
    }
    
    return () => {
      stopPreviewCamera();
      stopCamera();
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session?.isActive && hasStartedInterview && !isInterviewComplete) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.isActive, hasStartedInterview, isInterviewComplete]);
  useEffect(() => {
    const currentVideoRef = hasStartedInterview ? videoRef : previewVideoRef;
    if (currentVideoRef.current) {
      setIsVideoElementReady(true);
    }
    return () => {
      setIsVideoElementReady(false);
    };
  }, [hasStartedInterview]);
  // Separate effect for preview video stream
  useEffect(() => {
    if (previewVideoRef.current && previewStream && !hasStartedInterview) {
      const videoElement = previewVideoRef.current;
      videoElement.srcObject = previewStream;
      
      const playVideo = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          await videoElement.play();
          console.log('Preview video started successfully');
        } catch (error) {
          console.error('Error playing preview video:', error);
        }
      };
      
      playVideo();
    }
  }, [previewStream, hasStartedInterview]);  // Separate effect for main video stream
  useEffect(() => {
    if (videoRef.current && stream && hasStartedInterview) {
      const videoElement = videoRef.current;
      
      console.log('InterviewSession main video useEffect triggered', {
        stream: !!stream,
        videoElement: !!videoElement,
        hasStartedInterview,
        streamActive: stream.active,
        currentSrcObject: !!videoElement.srcObject
      });
      
      // Clear any existing stream first
      if (videoElement.srcObject) {
        console.log('Clearing existing srcObject');
        videoElement.srcObject = null;
      }
      
      // Small delay to ensure clean transition
      setTimeout(() => {
        videoElement.srcObject = stream;
        console.log('InterviewSession main video: Stream assigned', {
          streamActive: stream.active,
          streamTracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().length,
          elementSrcObject: !!videoElement.srcObject,
          elementSrcObjectActive: videoElement.srcObject ? (videoElement.srcObject as MediaStream).active : false
        });
        
        const playVideo = async () => {
          try {
            console.log('Attempting to play interview session main video...');
            await videoElement.play();
            console.log('InterviewSession main video started successfully');
          } catch (error) {
            console.error('Error playing interview session main video:', error);
            // Try reloading the stream
            console.log('Trying to reload and play again...');
            videoElement.load();
            try {
              await videoElement.play();
              console.log('InterviewSession main video started after reload');
            } catch (retryError) {
              console.error('Failed to start interview session video after retry:', retryError);
            }
          }
        };
        
        playVideo();
      }, 100);
    } else {
      console.log('InterviewSession main video useEffect conditions not met', {
        stream: !!stream,
        videoElement: !!videoRef.current,
        hasStartedInterview
      });
    }
  }, [stream, hasStartedInterview]);

  const requestPermissions = async () => {
    setIsRequestingPermission(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true // Always request audio for functionality
      });      setPreviewStream(mediaStream);
      setPermissionGranted(true);
      setCameraError(null);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
          setCameraError(`Camera and microphone access denied. Please enable permissions in your browser settings.`);
        } else if (error.name === 'NotFoundError') {
          setCameraError(`No camera or microphone found. Please connect a camera and microphone to continue.`);
        } else {
          setCameraError(`Unable to access camera and microphone. Please check your device settings.`);
        }
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const stopPreviewCamera = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
    }
  };  const startInterview = async () => {
    try {
      setCameraError(null);
      
      // Always get a fresh stream for the main video to avoid conflicts
      console.log('Getting fresh stream for interview session');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true // Always request audio for functionality
      });
      
      console.log('Starting interview session with fresh stream:', {
        streamActive: mediaStream.active,
        tracks: mediaStream.getTracks().length,
        videoTracks: mediaStream.getVideoTracks().length
      });
      
      // Clear the preview video element before starting
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }
      
      // Stop the preview stream since we're getting a new one
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
        setPreviewStream(null);
      }
      
      // Set the new stream
      setStream(mediaStream);
        // Set interview as started
      setHasStartedInterview(true);
      
      if (session) {
        setSession({ ...session, isActive: true });// Create the initial interview session record in the database
        try {
          await createInitialInterviewSession(session.id, setup, undefined); // Regular interview (not focused)
        } catch (error) {
          console.error('Error creating initial session record:', error);
          // Continue with the interview even if database creation fails
        }
        
        // Play the first question in voice mode after session is active
        if (session.questions.length > 0 && isVoiceMode && hasTTSAvailable) {
          const firstQuestion = session.questions[0];
          console.log('Playing first question:', firstQuestion.text);
          await playQuestion(firstQuestion.text);
        } else {
          // For text mode, user can respond immediately
          setCanUserRespond(true);
        }
      }
      
      stopPreviewCamera();    } catch (error) {
      console.error('Error starting interview:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
          setCameraError(`Camera and microphone access denied. Please enable permissions in your browser settings.`);
        } else if (error.name === 'NotFoundError') {
          setCameraError(`No camera or microphone found. Please connect a camera and microphone to continue.`);
        } else {
          setCameraError(`Unable to access camera and microphone. Please check your device settings.`);
        }
      }
    }
  };

  const toggleMute = () => {
    if (stream && isVoiceMode) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleAudio = () => {
    if (isVoiceMode) {
      setAudioEnabled(!audioEnabled);
      if (currentAudio) {
        currentAudio.muted = audioEnabled;
      }
    }
  };

  const initializeSession = async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      if (!hasOpenAIKey) {
        throw new Error('OpenAI API key is required for the interview platform. Please configure your API key to continue.');
      }

      console.log('Generating questions for:', setup);
      const questions = await generateInterviewQuestions(setup);
      console.log('Generated questions:', questions);
      
      // Update global questions for reference
      updateGlobalQuestions(questions);
      
      const newSession: IInterviewSession = {
        id: crypto.randomUUID(),
        setup,
        questions,
        currentQuestionIndex: 0,
        isActive: false,
        startTime: new Date(),
        responses: [],
        aiPersonality: 'friendly',
        adaptiveState: {
          confidenceLevel: 5,
          performanceLevel: 5,
          communicationStyle: 'detailed',
          strugglingAreas: [],
          strongAreas: []
        }      };
      setSession(newSession);
      
      // Always request camera and microphone permissions for video display
      await requestPermissions();
    } catch (error) {
      console.error('Error initializing session:', error);
      setLoadingError(error instanceof Error ? error.message : 'Failed to initialize interview session');
    } finally {
      setIsLoading(false);
    }
  };

  const playQuestion = async (questionText: string) => {
    if (!audioEnabled || !isVoiceMode || !hasTTSAvailable) {
      // For text mode or when audio is disabled, user can respond immediately
      setCanUserRespond(true);
      return;
    }
    
    try {
      setIsAISpeaking(true);
      setCanUserRespond(false);
      setIsPlaying(true);
      
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      console.log('Synthesizing speech for:', questionText);
      const audio = await synthesizeSpeech(questionText);
      if (audio) {
        setCurrentAudio(audio);
        audio.muted = !audioEnabled;
        
        // Set up event listeners for when audio finishes
        audio.onended = () => {
          setIsPlaying(false);
          setIsAISpeaking(false);
          setCanUserRespond(true); // User can now respond
          setCurrentAudio(null);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setIsAISpeaking(false);
          setCanUserRespond(true); // Allow response even if audio fails
          setCurrentAudio(null);
        };
        
        await audio.play();
      } else {
        // If audio synthesis fails, allow user to respond after a short delay
        setTimeout(() => {
          setIsPlaying(false);
          setIsAISpeaking(false);
          setCanUserRespond(true);
        }, 1500);
      }
    } catch (error) {
      console.error('Error playing question:', error);
      setIsPlaying(false);
      setIsAISpeaking(false);
      setCanUserRespond(true); // Allow response if there's an error
    }
  };

  const startRecording = async () => {
    if (!audioRecorderRef.current || !isVoiceMode || !canUserRespond || isAISpeaking) {
      console.log('Cannot start recording:', { 
        hasRecorder: !!audioRecorderRef.current, 
        isVoiceMode, 
        canUserRespond, 
        isAISpeaking 
      });
      return;
    }
    
    const success = await audioRecorderRef.current.startRecording();
    if (success) {
      setIsRecording(true);
      setUserResponse(''); // Clear any existing text
    } else {
      console.error('Failed to start recording');
    }
  };

  const stopRecording = async () => { // Actions that occur after each user response submission
    if (!audioRecorderRef.current || !isVoiceMode) return;
    
    setIsRecording(false);
    setIsProcessingVoice(true);
    
    const result = await audioRecorderRef.current.stopRecording();
    if (result) {
      const { audioBlob, duration } = result;
      
      try {
        // Process voice input directly
        const transcription = await processVoiceInput(audioBlob);
        if (transcription && transcription.trim().length > 0) {
          setUserResponse(transcription);
          
          // Extract speech metrics in the background
          if (hasOpenAIKey && session) {
            try {
              const metrics = await extractSpeechMetrics(audioBlob, transcription, duration);
              if (metrics) {
                setSpeechMetrics(prev => [...prev, {
                  questionId: session.questions[session.currentQuestionIndex]?.id,
                  metrics
                }]);
                
                // Cache the speech analysis - use proper UUID
                await saveSpeechAnalysisCache(
                  session.id,
                  session.questions[session.currentQuestionIndex]?.id || crypto.randomUUID(),
                  metrics,
                  { transcription, duration }
                );
              }
            } catch (error) {
              console.error('Error analyzing speech metrics:', error);
            }
          }
        } else {
          console.warn('Voice processing failed or was empty');
        }
      } catch (error) {
        console.error('Error processing voice input:', error);
      }
    }
    
    setIsProcessingVoice(false);
  };

  const handleSubmitResponse = async () => { // Actions that occur after each user response submission
    if (!session || !userResponse.trim() || !canUserRespond) return;

    setIsAnalyzing(true);
    setCanUserRespond(false); // Prevent further input while processing
    
    try {
      const currentQuestion = session.questions[session.currentQuestionIndex];
      
      // Store response immediately (without showing individual feedback)
      const newResponse: InterviewResponse = {
        questionId: currentQuestion.id,
        response: userResponse,
        timestamp: new Date()
      };
      
      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);

      // Clear the response input
      setUserResponse('');

      // Generate next question or complete interview
      await moveToNextQuestion(updatedResponses);

    } catch (error) {
      console.error('Error processing response:', error);
      setCanUserRespond(true); // Re-enable input if there's an error
    } finally {
      setIsAnalyzing(false);
    }
  };

  const moveToNextQuestion = async (currentResponses: InterviewResponse[]) => {
    setIsGeneratingQuestion(true);
    
    try {
      // Generate next question with interview start time for time-based conclusion
      const nextQuestion = await generateNextQuestion(
        setup, 
        currentResponses, 
        aiState, // Pass the current AI state
        session?.startTime ? session.startTime.toISOString() : undefined // Pass as ISO string
      );
      
      // Update session with new question
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: [...prev.questions, nextQuestion],
          currentQuestionIndex: prev.questions.length
        };
      });
        // Play the question if in voice mode
      if (isVoiceMode && hasTTSAvailable) {
        await playQuestion(nextQuestion.text);
      }
      
    } catch (error) {
      console.error('Error generating next question:', error);
      
      if (error instanceof Error && error.message === 'INTERVIEW_COMPLETE') {
        // Interview is complete - move to completion
        await completeInterview(currentResponses);
        return;
      }
      
      // Handle other errors
      setLoadingError('Failed to generate next question. Please try again.');
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const completeInterview = async (finalResponses: InterviewResponse[]) => {
    if (!session) return;

    setIsInterviewComplete(true);
    setIsAnalyzing(true);

    try {
      // Analyze all responses for comprehensive feedback
      const analyzedResponses = await Promise.all(
        finalResponses.map(async (response, index) => {
          const question = session.questions.find(q => q.id === response.questionId);
          if (!question) return response;

          const analysis = await analyzeResponse(question, response.response, setup, finalResponses.slice(0, index));
          
          // Add speech metrics if available
          const speechMetric = speechMetrics.find(m => m.questionId === response.questionId);
          
          return {
            ...response,
            analysis,
            speechMetrics: speechMetric?.metrics
          };
        })
      );

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
      const overallScore = analyzedResponses.length > 0 
        ? Math.round(analyzedResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / analyzedResponses.length * 10)
        : 0;

      const sessionData = {
        ...session,
        endTime,
        duration,
        overallScore,
        responses: analyzedResponses,
        speechMetrics: speechMetrics,
        isActive: false
      };

      // Save to localStorage as backup
      const existingHistory = JSON.parse(localStorage.getItem('kelv-interview-history') || '[]');
      const historyEntry = {
        id: session.id,
        date: session.startTime,
        setup: session.setup,
        overallScore,
        duration,
        questionsAnswered: analyzedResponses.length,
        status: 'completed'
      };
      
      existingHistory.push(historyEntry);
      localStorage.setItem('kelv-interview-history', JSON.stringify(existingHistory));

      stopCamera();
      stopPreviewCamera();
      onComplete(sessionData);

    } catch (error) {
      console.error('Error completing interview:', error);
      // Fallback completion without analysis
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
      
      const sessionData = {
        ...session,
        endTime,
        duration,
        overallScore: 70, // Default score
        responses: finalResponses,
        speechMetrics: speechMetrics,
        isActive: false
      };

      stopCamera();
      stopPreviewCamera();
      onComplete(sessionData);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    stopCamera();
    stopPreviewCamera();
    if (audioRecorderRef.current?.isRecording()) {
      audioRecorderRef.current.stopRecording();
    }
    onBack();
  };

  const retryCamera = () => {
    setCameraError(null);
    requestPermissions();
  };

  const retryInitialization = () => {
    setLoadingError(null);
    initializeSession();
  };

  // Permission request screen
  if (!permissionGranted && !cameraError) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#FF5722]/20 to-[#FF7043]/20 rounded-3xl flex items-center justify-center">
            <Mic className="w-12 h-12 text-[#FF5722]" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            {isVoiceMode ? 'Voice Interview Setup' : 'Interview Setup'}
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            {isVoiceMode 
              ? 'To conduct your mock interview with speech capabilities, we need access to your camera and microphone. This allows us to simulate a real interview experience with voice interaction and dynamic question adaptation.'
              : 'To conduct your mock interview, we need access to your camera. This allows us to simulate a real interview experience with visual feedback and dynamic question adaptation.'
            }
          </p>
          
          <div className="bg-gray-900/50 rounded-xl p-6 mb-8 border border-[#FF5722]/20">
            <h3 className="text-white font-semibold mb-3 flex items-center justify-center">
              <Settings className="w-5 h-5 mr-2 text-[#FF5722]" />
              Interview Mode: {isVoiceMode ? 'Voice' : 'Text'}
            </h3>
            <div className="space-y-3">              <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
                <span className="text-sm text-gray-300">Voice Synthesis (ElevenLabs):</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  hasTTSAvailable 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {hasTTSAvailable ? 'CONFIGURED' : 'REQUIRED'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
                <span className="text-sm text-gray-300">Voice Input (Direct):</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  hasOpenAIKey && isVoiceMode
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {hasOpenAIKey && isVoiceMode ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
                <span className="text-sm text-gray-300">Speech Metrics:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  hasOpenAIKey && isVoiceMode
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {hasOpenAIKey && isVoiceMode ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {isVoiceMode 
                  ? (hasOpenAIKey && hasTTSAvailable)
                    ? '✅ Full voice-enabled interview with speech analysis' 
                    : `❌ Voice mode requires ${!hasOpenAIKey ? 'OpenAI' : ''}${!hasOpenAIKey && !hasTTSAvailable ? ' and ' : ''}${!hasTTSAvailable ? 'ElevenLabs' : ''} API key${(!hasOpenAIKey && !hasTTSAvailable) ? 's' : ''}`
                  : '📝 Text-only interview mode selected'
                }
              </div>
            </div>
          </div>

          {(hasOpenAIKey && hasTTSAvailable) ? (
            <button
              onClick={requestPermissions}
              disabled={isRequestingPermission}
              className="px-8 py-4 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              {isRequestingPermission ? 'Requesting Access...' : `Start ${isVoiceMode ? 'Voice' : 'Text'} Interview`}
            </button>
          ) : (
            <div className="text-center">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                <p className="text-red-400 text-sm">
                  OpenAI API key is required to use the interview platform. Please configure your API key to continue.
                </p>
              </div>
              <button
                onClick={onBack}
                className="px-8 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-lg"
              >
                Back to Setup
              </button>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-4">
            {/* Privacy message removed as audio is now stored */}
          </p>

          <button
            onClick={onBack}
            className="mt-6 flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-800 border-t-[#FF5722] mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Generating interview questions...</p>
          <p className="text-gray-500 text-sm mt-2">
            Creating personalized questions for {setup.experienceLevel} {setup.jobType} in {setup.industry}
          </p>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Setup Error</h2>
          <p className="text-red-400 mb-6">{loadingError}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={retryInitialization}
              className="px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <p className="text-red-400 text-lg">Error loading interview session</p>
      </div>
    );
  }

  // Show completion screen while analyzing
  if (isInterviewComplete) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Interview Complete!</h2>
          <p className="text-gray-400 mb-8">
            {isAnalyzing 
              ? 'Analyzing your responses and generating comprehensive feedback...'
              : 'Preparing your results...'
            }
          </p>
          
          {isAnalyzing && (
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-3 h-3 bg-[#FF5722] rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-[#FF7043] rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-[#D84315] rounded-full animate-bounce delay-200"></div>
            </div>
          )}
          
          <div className="bg-gray-900/50 rounded-xl p-6 border border-[#FF5722]/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <span className="text-gray-400 block mb-1">Duration:</span>
                <p className="font-bold text-xl text-[#FF5722]">{formatTime(timeElapsed)}</p>
              </div>
              <div className="text-center">
                <span className="text-gray-400 block mb-1">Questions:</span>
                <p className="font-bold text-xl text-[#FF5722]">{responses.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex]; // Root of the error

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col pt-20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-3 h-3 bg-[#FF5722] rounded-full animate-pulse"></div>
          <span className="text-white font-medium">
            {isVoiceMode ? 'Voice' : 'Text'} Interview
          </span>
          {hasStartedInterview && (
            <div className="px-2 py-1 bg-[#FF5722]/20 rounded text-[#FF5722] text-xs font-medium border border-[#FF5722]/30">
              Live Session
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {hasStartedInterview && (
            <>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#FF5722]" />
                <span className="text-white font-medium">{formatTime(timeElapsed)}</span>
              </div>
              {isVoiceMode && (
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-lg transition-colors ${
                    audioEnabled ? 'bg-gray-800 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {audioEnabled ? (
                    <Volume2 className="w-4 h-4 text-gray-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Left side - Question panel */}
        <div className="w-1/3 p-8 border-r border-[#FF5722]/20">
          <div className="bg-gray-900/50 rounded-xl p-8 h-full border border-[#FF5722]/10 flex flex-col">
            {/* Current question section */}
            <div className="flex items-start space-x-4 mb-8">
              <div className="w-10 h-10 rounded-lg bg-[#FF5722] flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3 text-lg">
                  {hasStartedInterview ? "Interview Question" : "Ready to Start"}
                </h3>
                <p className="text-gray-300 text-base leading-relaxed">
                  {hasStartedInterview 
                    ? currentQuestion?.text || "Generating next question..."
                    : `Click 'Start Interview' to begin your personalized mock interview with dynamically generated questions tailored to your experience level.`}
                </p>
                {hasStartedInterview && currentQuestion && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentQuestion.type === 'small_talk'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : currentQuestion.type === 'behavioral'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : currentQuestion.type === 'technical'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : currentQuestion.type === 'follow_up'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : currentQuestion.type === 'situational'
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {currentQuestion.type.replace('_', ' ').charAt(0).toUpperCase() + currentQuestion.type.replace('_', ' ').slice(1)}
                    </span>
                    {currentQuestion.difficulty && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        currentQuestion.difficulty === 'easy'
                          ? 'bg-green-500/20 text-green-400'
                          : currentQuestion.difficulty === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {currentQuestion.difficulty}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Response input section */}
            {hasStartedInterview && currentQuestion && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex-1">
                  {isVoiceMode && hasTTSAvailable ? (
                    <div className="text-center">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessingVoice || !canUserRespond || isAISpeaking}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : canUserRespond && !isAISpeaking
                            ? 'bg-[#FF5722] hover:bg-[#D84315]'
                            : 'bg-gray-600 cursor-not-allowed'
                        } disabled:opacity-50`}
                      >
                        {isProcessingVoice ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                      </button>
                      <p className="text-sm text-gray-400 mt-3">
                        {isAISpeaking ? 'Please wait for the question to finish...' :
                         !canUserRespond ? 'Please wait...' :
                         isRecording ? 'Recording... Click to stop' : 
                         isProcessingVoice ? 'Processing voice...' : 'Click to record your response'}
                      </p>
                      {/* REMOVED: Transcription display - no longer showing what user said */}
                    </div>
                  ) : (
                    <textarea
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder={canUserRespond ? "Type your response here..." : "Please wait for the question to finish..."}
                      disabled={!canUserRespond || isAISpeaking}
                      className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-[#FF5722] focus:outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  )}
                </div>
                
                <button
                  onClick={handleSubmitResponse}
                  disabled={!userResponse.trim() || isAnalyzing || isGeneratingQuestion || isRecording || isProcessingVoice || !canUserRespond || isAISpeaking}
                  className="w-full px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium flex items-center justify-center space-x-2"
                >
                  {isAnalyzing || isGeneratingQuestion ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {isGeneratingQuestion ? 'Generating Next Question...' : 'Processing...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Response</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Start interview button */}
            {!hasStartedInterview && (
              <div className="mt-8 pt-6 border-t border-[#FF5722]/20">
                <button
                  onClick={startInterview}
                  disabled={!!cameraError}
                  className="w-full px-6 py-4 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-semibold flex items-center justify-center space-x-3"
                >
                  <Brain className="w-6 h-6" />
                  <span>Start Interview</span>
                </button>
                
                <div className="mt-4 p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">
                    Interview Features:
                  </h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Fully generated questions tailored to your role</li>
                    <li>• Dynamic question flow based on your responses</li>
                    <li>• {isVoiceMode ? 'Voice interaction with speech analysis' : 'Text-based professional interview'}</li>
                    <li>• Adaptive questions with natural conversation flow</li>
                    <li>• Comprehensive performance analysis at completion</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Repeat question button - only for voice mode */}
            {hasStartedInterview && currentQuestion && isVoiceMode && hasTTSAvailable && (
              <div className="mt-8 pt-6 border-t border-[#FF5722]/20">
                <button
                  onClick={() => playQuestion(currentQuestion.text)}
                  disabled={isPlaying || !audioEnabled || isAISpeaking}
                  className="w-full px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium flex items-center justify-center space-x-3"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{isPlaying ? 'Playing' : 'Repeat Question'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Video area */}
        <div className="flex-1 relative bg-gray-900">
          {/* Camera error overlay */}
          {cameraError && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="text-center max-w-md px-6">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Camera Error</h3>
                <p className="text-gray-400 mb-6">{cameraError}</p>
                <button
                  onClick={retryCamera}
                  className="px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors font-medium"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {/* Main video area */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* AI Interviewer */}
            <AIInterviewer 
              isActive={hasStartedInterview}
              isSpeaking={isAISpeaking}
              isListening={isRecording}
              isProcessing={isProcessingVoice || isAnalyzing || isGeneratingQuestion}
              size="xl"
              showStatus={true}
            />
          </div>          {/* User video - picture in picture style */}
          <div className="absolute bottom-6 right-6 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 z-10">
            {!hasStartedInterview ? (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => console.log('Preview video metadata loaded')}
                onCanPlay={() => console.log('Preview video can play')}
                onPlay={() => console.log('Preview video started playing')}
                onError={(e) => console.error('Preview video error:', e)}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => console.log('Main video metadata loaded')}
                onCanPlay={() => console.log('Main video can play')}
                onPlay={() => console.log('Main video started playing')}
                onError={(e) => {
                  console.error('Main video error:', e);
                  setCameraError('Error playing video stream. Please check your browser settings.');
                }}
              />            )}
          </div>

          {/* Camera controls - only microphone toggle */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-800 z-20">
            {isVoiceMode && (
              <button
                onClick={toggleMute}
                className={`p-2 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
            
            <button
              onClick={handleEndCall}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <Phone className="w-5 h-5 text-white transform rotate-135" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;