import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Play, 
  Pause, 
  Mic, 
  MicOff, 
  Phone, 
  AlertCircle, 
  ArrowLeft, 
  Brain, 
  Send, 
  Target, 
  Timer
} from 'lucide-react';
import { InterviewSetup, Question, InterviewResponse } from '../../types/interview';
import { generateFocusedQuestions, analyzeResponse, synthesizeSpeech, AudioRecorder, processVoiceInput } from '../../utils/openai';
import { isElevenLabsTTSAvailable } from '../../utils/elevenLabsTTS';
import AIInterviewer from '../AIInterviewer';
import { createInitialInterviewSession, saveInterviewSession } from '../../utils/supabase-interview';
import { extractSpeechMetrics } from '../../utils/openai';

interface FocusedInterviewProps {
  interviewType: 'technical' | 'behavioral' | 'situational' | 'resume' | 'leadership' | 'caseStudy' | 'systemDesign' | 'leadershipAssessment' | 'culturalFit' | 'communication' | 'problemSolving' | 'salaryNegotiation' | 'closing';
  setup: InterviewSetup;
  onComplete: (sessionData: any) => void;
  onBack: () => void;
}

export const FocusedInterview: React.FC<FocusedInterviewProps> = ({ 
  interviewType, 
  setup, 
  onComplete, 
  onBack 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [canUserRespond, setCanUserRespond] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [speechMetrics, setSpeechMetrics] = useState<any[]>([]);
  const isVoiceMode = setup.interviewMode === 'voice';
  const hasOpenAIKey = import.meta.env.VITE_OPENAI_API_KEY && 
    import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';

  // Check if ElevenLabs TTS is available for voice synthesis
  const hasTTSAvailable = isElevenLabsTTSAvailable();

  // Interview type configurations
  const interviewConfig = {
    technical: {
      title: 'Technical Questions',
      description: 'Practice coding, system design, and technical concepts',
      icon: '💻',
      duration: 5, // minutes
      maxQuestions: null // No question limit - time-based only
    },
    behavioral: {
      title: 'Behavioral Questions',
      description: 'Master the STAR method and leadership scenarios',
      icon: '🎯',
      duration: 4,
      maxQuestions: null
    },
    situational: {
      title: 'Situational Questions',
      description: 'Handle workplace challenges and problem-solving',
      icon: '🧩',
      duration: 4,
      maxQuestions: null
    },
    resume: {
      title: 'Resume Questions',
      description: 'Articulate your background and experience effectively',
      icon: '📄',
      duration: 3,
      maxQuestions: null
    },
    leadership: {
      title: 'Leadership Questions',
      description: 'Demonstrate leadership and management skills',
      icon: '👑',
      duration: 5,
      maxQuestions: null
    },
    caseStudy: {
      title: 'Case Study Interviews',
      description: 'Practice business and technical case scenarios',
      icon: '📊',
      duration: 8,
      maxQuestions: null
    },
    systemDesign: {
      title: 'System Design Interviews',
      description: 'Master architecture and scalability discussions',
      icon: '🏗️',
      duration: 10,
      maxQuestions: null    },
    leadershipAssessment: {
      title: 'Leadership Assessment',
      description: 'Advanced management and executive scenarios',
      icon: '⚡',
      duration: 8,
      maxQuestions: null
    },
    culturalFit: {
      title: 'Cultural Fit',
      description: 'Assess values, team fit, and alignment with company mission',
      icon: '🤝',
      duration: 4,
      maxQuestions: null
    },
    communication: {
      title: 'Communication',
      description: 'Practice presentation and explaining complex ideas',
      icon: '💬',
      duration: 4,
      maxQuestions: null
    },
    problemSolving: {
      title: 'Problem Solving',
      description: 'Logic puzzles, brainteasers, and structured thinking',
      icon: '🧠',
      duration: 4,
      maxQuestions: null
    },
    salaryNegotiation: {
      title: 'Salary Negotiation',
      description: 'Practice negotiating offers and discussing compensation',
      icon: '💰',
      duration: 3,
      maxQuestions: null
    },
    closing: {
      title: 'Closing/Wrap-up',
      description: 'How to end interviews and ask questions back',
      icon: '🎤',
      duration: 2,
      maxQuestions: null
    }
  };

  const config = interviewConfig[interviewType];

  useEffect(() => {
    initializeSession();
  }, []);
  useEffect(() => {
    if (hasStartedInterview && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setTimeElapsed(elapsed);
        
        // End interview if time limit reached
        if (elapsed >= config.duration * 60) {
          completeInterview(responses);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [hasStartedInterview, startTime, responses, config.duration]);
  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, previewStream]);

  // Handle preview video stream
  useEffect(() => {
    if (previewStream && previewVideoRef.current && !hasStartedInterview) {
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
  }, [previewStream, hasStartedInterview]);  // Handle main video stream
  useEffect(() => {
    if (stream && videoRef.current && hasStartedInterview) {
      const videoElement = videoRef.current;
      
      console.log('FocusedInterview main video useEffect triggered', {
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
        console.log('FocusedInterview main video: Stream assigned', {
          streamActive: stream.active,
          streamTracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().length,
          elementSrcObject: !!videoElement.srcObject,
          elementSrcObjectActive: videoElement.srcObject ? (videoElement.srcObject as MediaStream).active : false
        });
        
        const playVideo = async () => {
          try {
            console.log('Attempting to play focused interview main video...');
            await videoElement.play();
            console.log('FocusedInterview main video started successfully');
          } catch (error) {
            console.error('Error playing focused interview main video:', error);
            // Try reloading the stream
            console.log('Trying to reload and play again...');
            videoElement.load();
            try {
              await videoElement.play();
              console.log('FocusedInterview main video started after reload');
            } catch (retryError) {
              console.error('Failed to start focused interview video after retry:', retryError);
            }
          }
        };
        
        playVideo();
      }, 100);
    } else {
      console.log('FocusedInterview main video useEffect conditions not met', {
        stream: !!stream,
        videoElement: !!videoRef.current,
        hasStartedInterview
      });
    }
  }, [stream, hasStartedInterview]);

  const initializeSession = async () => {
    setIsLoading(true);
    setLoadingError(null);
    try {
      if (!hasOpenAIKey) {
        throw new Error('OpenAI API key is required for the interview platform. Please configure your API key to continue.');
      }
      const generatedQuestions = await generateFocusedQuestions(interviewType, setup);
      setQuestions(generatedQuestions);      // Create a unique session ID and create initial session in Supabase
      const newSessionId = crypto.randomUUID();
      console.log('FocusedInterview: Generated new session ID:', newSessionId);
      setSessionId(newSessionId);
      try {
        await createInitialInterviewSession(newSessionId, setup, interviewType); // Pass interview type
        console.log('FocusedInterview: Successfully created initial session in Supabase');
      } catch (err) {
        console.error('FocusedInterview: Error creating initial focused interview session:', err);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      setLoadingError(error instanceof Error ? error.message : 'Failed to initialize interview session');
    } finally {
      setIsLoading(false);
    }
  };
  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: isVoiceMode
      });
      
      setPreviewStream(mediaStream);
      setPermissionGranted(true);
      setCameraError(null);
        if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = mediaStream;
        try {
          await previewVideoRef.current.play();
        } catch (playError) {
          console.error('Error playing preview video:', playError);
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
          setCameraError(`Camera${isVoiceMode ? ' and microphone' : ''} access denied. Please enable permissions in your browser settings.`);
        } else if (error.name === 'NotFoundError') {
          setCameraError(`No camera${isVoiceMode ? ' or microphone' : ''} found. Please connect a camera${isVoiceMode ? ' and microphone' : ''} to continue.`);
        } else {
          setCameraError(`Unable to access camera${isVoiceMode ? ' and microphone' : ''}. Please check your device settings.`);
        }
      }
    }
  };  const startInterview = async () => {
    if (!permissionGranted) {
      await requestPermissions();
      return;
    }

    try {      
      // Always get a fresh stream for the main video to avoid conflicts
      console.log('Getting fresh stream for focused interview');
      const mainStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('Starting focused interview with fresh stream:', {
        streamActive: mainStream.active,
        tracks: mainStream.getTracks().length,
        videoTracks: mainStream.getVideoTracks().length
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
      setStream(mainStream);
      
      // Set interview as started
      setHasStartedInterview(true);
      setStartTime(new Date());
      setCanUserRespond(true);
      
      // Play first question
      if (questions.length > 0 && isVoiceMode && hasTTSAvailable) {
        await playQuestion(questions[0].text);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      setCameraError('Failed to start interview. Please try again.');
    }
  };
  const playQuestion = async (questionText: string) => {
    if (!hasTTSAvailable) return;
    
    setIsAISpeaking(true);
    setCanUserRespond(false);
    
    try {
      const audio = await synthesizeSpeech(questionText);
      if (audio) {
        audio.onended = () => {
          setIsAISpeaking(false);
          setCanUserRespond(true);
        };
        
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsAISpeaking(false);
          setCanUserRespond(true);
        });
      } else {
        setIsAISpeaking(false);
        setCanUserRespond(true);
      }
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      setIsAISpeaking(false);
      setCanUserRespond(true);
    }
  };

  const startRecording = async () => {
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();
    }
    
    const success = await audioRecorderRef.current.startRecording();
    if (success) {
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;
    setIsRecording(false);
    setIsProcessingVoice(true);
    try {
      const result = await audioRecorderRef.current.stopRecording();
      if (result) {
        const transcription = await processVoiceInput(result.audioBlob);
        setUserResponse(transcription);
        // Extract and store speech metrics if in voice mode
        if (isVoiceMode && transcription && transcription.trim().length > 0) {
          try {
            const metrics = await extractSpeechMetrics(result.audioBlob, transcription, result.duration);
            if (metrics) {
              setSpeechMetrics(prev => [...prev, {
                questionId: questions[currentQuestionIndex]?.id,
                metrics
              }]);
            }
          } catch (err) {
            console.error('Error extracting speech metrics:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!userResponse.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setCanUserRespond(false);
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const response: InterviewResponse = {
        questionId: currentQuestion.id,
        response: userResponse,
        timestamp: new Date()
      };
      
      // Analyze response
      const analysis = await analyzeResponse(currentQuestion, userResponse, setup, responses, interviewType);
      response.analysis = analysis;
      
      const updatedResponses = [...responses, response];
      setResponses(updatedResponses);
      setUserResponse('');
      
      // Check if interview should continue
      if ((Date.now() - (startTime?.getTime() || 0)) / 1000 / 60 >= config.duration) {
        await completeInterview(updatedResponses);
      } else {
        // Move to next question
        await moveToNextQuestion(updatedResponses);
      }
    } catch (error) {
      console.error('Error processing response:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const moveToNextQuestion = async (currentResponses: InterviewResponse[]) => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
        // Play the question if in voice mode
      if (isVoiceMode && hasTTSAvailable) {
        await playQuestion(questions[nextIndex].text);
      } else {
        setCanUserRespond(true);
      }
    } else {
      // For focused interviews, don't generate follow-up questions
      // Complete the interview when all pre-generated questions are done
      await completeInterview(currentResponses);
    }
  };
  const completeInterview = async (finalResponses: InterviewResponse[]) => {
    setIsInterviewComplete(true);
    const endTime = new Date();
    const duration = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    const averageScore = finalResponses.length > 0 
      ? finalResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / finalResponses.length * 10
      : 0;

    // Calculate voice metrics averages if available
    let voiceMetrics = null;
    if (speechMetrics && speechMetrics.length > 0) {
      const validMetrics = speechMetrics.map((m: any) => m.metrics).filter(Boolean);
      if (validMetrics.length > 0) {
        voiceMetrics = {
          speechRate: Number((validMetrics.reduce((sum: number, m: any) => sum + (m.speechRate || 0), 0) / validMetrics.length).toFixed(2)),
          fluencyScore: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.fluencyScore || 0), 0) / validMetrics.length),
          voiceConfidence: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.voiceConfidence || 0), 0) / validMetrics.length),
          fillerWordCount: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.fillerWordCount || 0), 0) / validMetrics.length),
          averageVolume: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.averageVolume || 0), 0) / validMetrics.length),
          delivery: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.delivery || 0), 0) / validMetrics.length),
          clarity: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.clarity || 0), 0) / validMetrics.length),
          confidence: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.confidence || m.voiceConfidence || 0), 0) / validMetrics.length),
          paceConsistency: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.paceConsistency || 0), 0) / validMetrics.length),
          repetitionCount: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.repetitionCount || 0), 0) / validMetrics.length),
          pauseRatio: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.pauseRatio || 0), 0) / validMetrics.length),
          estimatedPitch: Math.round(validMetrics.reduce((sum: number, m: any) => sum + (m.estimatedPitch || 0), 0) / validMetrics.length)
        };
      }
    }
    
    const sessionData = {
      id: sessionId || crypto.randomUUID(),
      setup, // Pass setup as-is
      responses: finalResponses,
      questions, // Include the questions array for saving to database
      duration,
      overallScore: Math.round(averageScore),
      questionsAnswered: finalResponses.length,
      interviewType, // Still include for dashboard/results
      type: interviewType, // Add type for database consistency
      startTime,
      endTime,
      config,
      speechMetrics,
      voiceMetrics
    };
    
    console.log('FocusedInterview: Completing interview with session data:', {
      sessionId: sessionData.id,
      interviewType: sessionData.type,
      duration: sessionData.duration,
      questionsAnswered: sessionData.questionsAnswered,
      overallScore: sessionData.overallScore,
      responseCount: finalResponses.length,
      questionCount: questions.length
    });
    
    // Save session to Supabase
    try {
      console.log('FocusedInterview: Attempting to save session to Supabase...');
      await saveInterviewSession(sessionData);
      console.log('FocusedInterview: Successfully saved session to Supabase');
    } catch (err) {
      console.error('FocusedInterview: Error saving focused interview session:', err);
      // Still complete the interview locally even if save fails
    }
    
    console.log('FocusedInterview: Calling onComplete with session data');
    onComplete(sessionData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (responses.length > 0) {
      completeInterview(responses);
    } else {
      onBack();
    }
  };

  const retryCamera = () => {
    setCameraError(null);
    requestPermissions();
  };

  const retryInitialization = () => {
    setLoadingError(null);
    initializeSession();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-800 border-t-[#FF5722] mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Generating {config.title}...</p>
          <p className="text-gray-500 text-sm mt-2">
            Creating focused questions for {setup.experienceLevel} {setup.jobType} in {setup.industry}
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
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isInterviewComplete) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{config.title} Complete!</h2>
          <p className="text-gray-400 mb-8">
            {isAnalyzing 
              ? 'Analyzing your responses and generating feedback...'
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

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="sticky top-16 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700 z-30">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">{config.icon}</span>
                  {config.title}
                </h1>
                <p className="text-sm text-gray-400">{config.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Timer className="w-4 h-4" />
                <span>{formatTime(timeElapsed)} / {config.duration}:00</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Target className="w-4 h-4" />
                <span>Q{responses.length + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interview Interface */}
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
                  {hasStartedInterview ? "Current Question" : "Ready to Start"}
                </h3>
                <p className="text-gray-300 text-base leading-relaxed">
                  {hasStartedInterview 
                    ? currentQuestion?.text || "Loading question..."
                    : `Click 'Start Interview' to begin your ${config.title.toLowerCase()} practice session.`}
                </p>
              </div>
            </div>

            {/* Response section */}
            {hasStartedInterview && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 mb-6">
                  {isVoiceMode ? (
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
                  disabled={!userResponse.trim() || isAnalyzing || isRecording || isProcessingVoice || !canUserRespond || isAISpeaking}
                  className="w-full px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium flex items-center justify-center space-x-2"
                >                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
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
                  <span>Start {config.title}</span>
                </button>
                
                <div className="mt-4 p-4 bg-dark-700/30 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">
                    Session Details:
                  </h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Duration: {config.duration} minutes</li>
                    <li>• Questions: Time-based</li>
                    <li>• Focus: {config.description}</li>
                    <li>• {isVoiceMode ? 'Voice interaction' : 'Text-based responses'}</li>
                  </ul>
                </div>
              </div>
            )}            {/* Repeat question button - only for voice mode */}
            {hasStartedInterview && currentQuestion && isVoiceMode && hasTTSAvailable && (
              <div className="mt-8 pt-6 border-t border-[#FF5722]/20">
                <button
                  onClick={() => playQuestion(currentQuestion.text)}
                  disabled={isProcessingVoice || !canUserRespond || isAISpeaking}
                  className="w-full px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium flex items-center justify-center space-x-3"
                >
                  {isProcessingVoice ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{isProcessingVoice ? 'Playing' : 'Repeat Question'}</span>
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
            {/* AI Interviewer */}            <AIInterviewer 
              isActive={hasStartedInterview}
              isSpeaking={isAISpeaking}
              isListening={isRecording}
              isProcessing={isProcessingVoice || isAnalyzing}
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

          {/* Camera controls */}
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

export default FocusedInterview;
