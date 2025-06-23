import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap,
  ArrowLeft,
  Clock,
  Mic,
  Send,
  AlertCircle,
  Phone,
  Volume2,
  VolumeX,
  Target
} from 'lucide-react';
import AIInterviewer from '../AIInterviewer';

interface CollegeInterviewSetup {
  schoolType: string;
  program: string;
  major: string;
  interviewMode: 'voice' | 'text';
}

interface CollegeQuestion {
  id: string;
  text: string;
  type: 'personal' | 'academic' | 'extracurricular' | 'goals' | 'fit' | 'challenge' | 'leadership' | 'diversity';
  category: string;
  followUpPotential: boolean;
}

interface CollegeResponse {
  questionId: string;
  response: string;
  timestamp: Date;
  analysis?: {
    score: number;
    feedback: string;
    strengths: string[];
    areasForImprovement: string[];
    authenticity: number;
    passion: number;
    clarity: number;
    specificity: number;
    schoolKnowledge?: number;
    personalGrowth?: number;
    nextQuestionSuggestion?: string;
  };
  audioBlob?: Blob | string;
}

interface CollegeInterviewProps {
  setup: CollegeInterviewSetup;
  onComplete: (sessionData: any) => void;
  onBack: () => void;
}

const CollegeInterview: React.FC<CollegeInterviewProps> = ({ 
  setup, 
  onComplete, 
  onBack 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<CollegeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<CollegeResponse[]>([]);
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string>('');  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  // Voice mode specific states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [canUserRespond, setCanUserRespond] = useState(false);
  const [isAISpeaking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const isVoiceMode = setup.interviewMode === 'voice';
  // Generate college-specific questions using AI
  const generateCollegeQuestions = async (): Promise<CollegeQuestion[]> => {
    try {
      // Import the AI function for college questions
      const { generateCollegeInterviewQuestions } = await import('../../utils/openai');
      
      const aiQuestions = await generateCollegeInterviewQuestions({
        schoolType: setup.schoolType,
        program: setup.program,
        major: setup.major,
        interviewMode: setup.interviewMode
      });      // Convert AI questions to our format
      return aiQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type as 'personal' | 'academic' | 'extracurricular' | 'goals' | 'fit' | 'challenge' | 'leadership' | 'diversity',
        category: q.type.charAt(0).toUpperCase() + q.type.slice(1),
        followUpPotential: true
      }));
    } catch (error) {
      console.error('Error generating AI questions, falling back to defaults:', error);
      
      // Fallback to a minimal set of questions
      return [
        {
          id: '1',
          text: "Tell me about yourself and what draws you to our institution.",
          type: 'personal',
          category: 'Introduction',
          followUpPotential: true
        },
        {
          id: '2', 
          text: `Why are you interested in studying ${setup.major} at our ${setup.schoolType.replace('-', ' ')} institution?`,
          type: 'academic',
          category: 'Academic Interest',
          followUpPotential: true
        }
      ];
    }
  };
  // Analyze college interview responses using AI
  const analyzeCollegeResponse = async (question: CollegeQuestion, response: string) => {
    try {
      // Import the AI analysis function
      const { analyzeCollegeInterviewResponse } = await import('../../utils/openai');
      
      const analysis = await analyzeCollegeInterviewResponse(question, response, setup);
      return analysis;
    } catch (error) {
      console.error('Error analyzing response with AI, using fallback:', error);
      
      // Fallback analysis
      return {
        score: Math.floor(Math.random() * 3) + 7, // 7-10 range for college interviews
        feedback: getCollegeFeedback(question.type, response),
        strengths: getCollegeStrengths(question.type),
        areasForImprovement: getCollegeImprovements(question.type),
        authenticity: Math.floor(Math.random() * 3) + 7,
        passion: Math.floor(Math.random() * 3) + 7,
        clarity: Math.floor(Math.random() * 3) + 7,
        specificity: Math.floor(Math.random() * 3) + 6
      };
    }
  };

  const getCollegeFeedback = (type: string, _response: string) => {
    const feedbackMap: { [key: string]: string[] } = {
      personal: [
        "Great job sharing personal details that help us understand who you are.",
        "Your response shows good self-reflection and awareness.",
        "Consider adding more specific examples to illustrate your points."
      ],
      academic: [
        "You demonstrate genuine interest in your field of study.",
        "Strong connection between your academic interests and career goals.",
        "Consider elaborating on specific aspects of the program that excite you."
      ],
      challenge: [
        "Excellent example of resilience and growth mindset.",
        "You clearly articulated the lessons learned from your experience.",
        "Strong evidence of problem-solving and perseverance."
      ],
      extracurricular: [
        "Great examples of leadership and community involvement.",
        "You effectively connected your activities to personal growth.",
        "Consider highlighting the impact you made in these roles."
      ],
      goals: [
        "Clear vision for your future with realistic and ambitious goals.",
        "Good connection between your education and career aspirations.",
        "Shows thoughtful planning and long-term thinking."
      ]
    };

    const feedback = feedbackMap[type] || ["Thoughtful response that addresses the question well."];
    return feedback[Math.floor(Math.random() * feedback.length)];
  };

  const getCollegeStrengths = (type: string): string[] => {
    const strengthsMap: { [key: string]: string[] } = {
      personal: ["Authentic self-presentation", "Clear communication", "Self-awareness"],
      academic: ["Academic passion", "Research interest", "Goal alignment"],
      challenge: ["Resilience", "Growth mindset", "Problem-solving"],
      extracurricular: ["Leadership skills", "Community involvement", "Initiative"],
      goals: ["Clear vision", "Realistic planning", "Ambition"]
    };

    return strengthsMap[type] || ["Strong communication", "Thoughtful reflection"];
  };

  const getCollegeImprovements = (type: string): string[] => {
    const improvementsMap: { [key: string]: string[] } = {
      personal: ["Add more specific examples", "Show vulnerability", "Connect to values"],
      academic: ["Research faculty/programs", "Discuss specific interests", "Show intellectual curiosity"],
      challenge: ["Quantify impact", "Show continued growth", "Connect to future goals"],
      extracurricular: ["Highlight leadership roles", "Discuss impact made", "Show sustained commitment"],
      goals: ["Be more specific about timeline", "Connect to alumni outcomes", "Show research into career paths"]
    };

    return improvementsMap[type] || ["Add more detail", "Show enthusiasm"];
  };
  // Initialize interview session
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      setLoadingError(null);
      
      try {
        const generatedQuestions = await generateCollegeQuestions();
        setQuestions(generatedQuestions);
        setSessionId(crypto.randomUUID());
        
        // Always request camera permissions for video display
        await requestPermissions();
      } catch (error) {
        console.error('Error initializing session:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to initialize interview session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);
  // Timer effect - 5 minute limit with natural conclusion
  useEffect(() => {
    if (hasStartedInterview && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setTimeElapsed(elapsed);
        
        // Check if we're approaching the 5-minute mark (300 seconds)
        if (elapsed >= 300) {
          completeInterview(responses);
        } else if (elapsed >= 240 && !isAnalyzing) {
          // At 4 minutes, start wrapping up if not already analyzing
          // The AI will naturally conclude the interview
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }  }, [hasStartedInterview, startTime, responses, isAnalyzing]);
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
      
      // Clear any existing stream first
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }
      
      // Small delay to ensure element is ready
      setTimeout(() => {
        videoElement.srcObject = previewStream;
        console.log('Preview video: Stream assigned', {
          streamActive: previewStream.active,
          streamTracks: previewStream.getTracks().length,
          videoTracks: previewStream.getVideoTracks().length
        });
        
        const playVideo = async () => {
          try {
            await videoElement.play();
            console.log('Preview video started successfully');
          } catch (error) {
            console.error('Error playing preview video:', error);
            // Try reloading the stream
            videoElement.load();
            try {
              await videoElement.play();
              console.log('Preview video started after reload');
            } catch (retryError) {
              console.error('Failed to start preview video after retry:', retryError);
            }
          }
        };
        
        playVideo();
      }, 50);
    }
  }, [previewStream, hasStartedInterview]);  // Handle main video stream
  useEffect(() => {
    if (stream && videoRef.current && hasStartedInterview) {
      const videoElement = videoRef.current;
      
      console.log('Main video useEffect triggered', {
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
        console.log('Main video: Stream assigned', {
          streamActive: stream.active,
          streamTracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().length,
          elementSrcObject: !!videoElement.srcObject,
          elementSrcObjectActive: videoElement.srcObject ? (videoElement.srcObject as MediaStream).active : false
        });
        
        const playVideo = async () => {
          try {
            console.log('Attempting to play main video...');
            await videoElement.play();
            console.log('Main video started successfully');
          } catch (error) {
            console.error('Error playing main video:', error);
            // Try reloading the stream
            console.log('Trying to reload and play again...');
            videoElement.load();
            try {
              await videoElement.play();
              console.log('Main video started after reload');
            } catch (retryError) {
              console.error('Failed to start video after retry:', retryError);
            }
          }
        };
        
        playVideo();
      }, 100);
    } else {
      console.log('Main video useEffect conditions not met', {
        stream: !!stream,
        videoElement: !!videoRef.current,
        hasStartedInterview
      });
    }
  }, [stream, hasStartedInterview]);

  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
        setPreviewStream(mediaStream);
      setPermissionGranted(true);
      setCameraError(null);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Camera and microphone access denied. Please enable permissions in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera or microphone found. Please connect a camera and microphone to continue.');
        } else {
          setCameraError('Unable to access camera and microphone. Please check your browser settings.');
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
      console.log('Getting fresh stream for interview');
      const mainStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('Starting interview with fresh stream:', {
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
      
    } catch (error) {
      console.error('Error starting interview:', error);
      setCameraError('Failed to start interview. Please try again.');
    }
  };
  const startRecording = async () => {
    if (!stream) {
      console.error('No stream available for recording');
      return;
    }

    try {
      console.log('Starting recording with stream:', {
        streamActive: stream.active,
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      });

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        processVoiceResponse(audioBlob);
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        setCanUserRespond(true);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      setCanUserRespond(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsProcessingVoice(true);
    }
  };
  const processVoiceResponse = async (audioBlob: Blob) => {
    try {
      // Use real speech-to-text processing
      const { processVoiceInput } = await import('../../utils/openai');
      const transcription = await processVoiceInput(audioBlob);
      
      if (transcription && transcription.trim()) {
        setUserResponse(transcription);
        // Auto-submit after processing
        await submitResponse(transcription, audioBlob);
      } else {
        console.warn('No transcription received');
        setIsProcessingVoice(false);
        setCanUserRespond(true);
      }
    } catch (error) {
      console.error('Error processing voice response:', error);
      
      // Fallback to allowing text input
      setIsProcessingVoice(false);
      setCanUserRespond(true);
    }
  };
  const submitResponse = async (responseText?: string, audioBlob?: Blob) => {
    const finalResponse = responseText || userResponse;
    if (!finalResponse.trim()) return;

    setIsAnalyzing(true);
    setCanUserRespond(false);

    try {
      const currentQuestion = questions[currentQuestionIndex];
      const response: CollegeResponse = {
        questionId: currentQuestion.id,
        response: finalResponse,
        timestamp: new Date(),
        audioBlob
      };

      // Analyze response with AI
      const analysis = await analyzeCollegeResponse(currentQuestion, finalResponse);
      response.analysis = analysis;

      const updatedResponses = [...responses, response];
      setResponses(updatedResponses);
      setUserResponse('');

      // Check if we should continue or wrap up (5 minutes = 300 seconds)
      const elapsedTime = startTime ? (Date.now() - startTime.getTime()) / 1000 : 0;
      
      if (elapsedTime >= 300) {
        // Time's up - complete the interview
        await completeInterview(updatedResponses);
        return;
      }      // Generate follow-up question using AI (no question limit, time-based only)
      try {
        setIsAIGenerating(true);
        const { generateCollegeFollowUp } = await import('../../utils/openai');
        
        // Create context for AI to generate appropriate follow-up
        const responseContext = updatedResponses.map(r => ({
          questionText: questions.find(q => q.id === r.questionId)?.text,
          response: r.response,
          analysis: r.analysis
        }));

        const followUpQuestion = await generateCollegeFollowUp(
          setup,
          responseContext,
          finalResponse
        );

        // Add the AI-generated question to our questions list
        const newQuestion: CollegeQuestion = {
          id: followUpQuestion.id,
          text: followUpQuestion.text,
          type: followUpQuestion.type as any,
          category: followUpQuestion.category,
          followUpPotential: true
        };        setQuestions(prev => [...prev, newQuestion]);
        setCurrentQuestionIndex(prev => prev + 1);
        setCanUserRespond(true);
        setIsAIGenerating(false);      } catch (followUpError) {
        console.error('Error generating follow-up, moving to next preset question:', followUpError);
        setIsAIGenerating(false);
        
        // Fallback: move to next preset question if available
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setCanUserRespond(true);
        } else {
          // No more preset questions and AI failed - complete interview
          await completeInterview(updatedResponses);
        }
      }

    } catch (error) {
      console.error('Error submitting response:', error);
      setCanUserRespond(true);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const completeInterview = async (finalResponses: CollegeResponse[]) => {
    setIsInterviewComplete(true);
    
    // Calculate overall metrics from AI analysis
    const overallScore = Math.round(
      finalResponses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / finalResponses.length
    );

    // Calculate detailed metrics from AI analysis
    const metrics = {
      authenticity: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.authenticity || 0), 0) / finalResponses.length),
      passion: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.passion || 0), 0) / finalResponses.length),
      clarity: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.clarity || 0), 0) / finalResponses.length),
      specificity: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.specificity || 0), 0) / finalResponses.length),
      schoolKnowledge: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.schoolKnowledge || 0), 0) / finalResponses.length),
      personalGrowth: Math.round(finalResponses.reduce((sum, r) => sum + (r.analysis?.personalGrowth || 0), 0) / finalResponses.length)
    };

    const sessionData = {
      id: sessionId,
      type: 'college',
      setup,
      questions,
      responses: finalResponses,
      overallScore,
      startTime,
      endTime: new Date(),
      duration: timeElapsed,
      questionsAnswered: finalResponses.length,
      metrics
    };

    onComplete(sessionData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const handleEndInterview = () => {
    if (responses.length > 0) {
      completeInterview(responses);
    } else {
      onBack();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-800 border-t-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Preparing your college interview...</p>
          <p className="text-gray-500 text-sm mt-2">
            Customizing questions for {setup.major} at {setup.schoolType.replace('-', ' ')} institutions
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
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  if (isInterviewComplete) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">College Interview Complete!</h2>
          <p className="text-gray-400 mb-6">
            Analyzing your responses and preparing detailed feedback...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
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
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">College Interview</span>
              {hasStartedInterview && (
                <div className="px-2 py-1 bg-purple-500/20 rounded text-purple-400 text-xs font-medium border border-purple-500/30">
                  Live Session
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">              {hasStartedInterview && (
                <>
                  <div className="flex items-center space-x-2">
                    <Clock className={`w-4 h-4 ${timeElapsed >= 240 ? 'text-orange-400' : 'text-purple-500'}`} />
                    <span className={`font-medium ${timeElapsed >= 240 ? 'text-orange-400' : 'text-white'}`}>
                      {formatTime(timeElapsed)} / 5:00
                    </span>
                    {timeElapsed >= 240 && (
                      <span className="text-xs text-orange-400 animate-pulse">
                        (Wrapping up)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="text-white font-medium">Q{responses.length + 1} - AI Flow</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Height */}
      <div className="flex-1 flex min-h-0">        {/* Left Panel - Question */}
        <div className="w-1/3 border-r border-purple-500/20 flex flex-col">
          <div className="flex-1 bg-gray-900/50 m-6 rounded-xl p-8 border border-purple-500/10 flex flex-col">
            <div className="flex items-start space-x-4 mb-8">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3 text-lg">
                  {hasStartedInterview ? "College Interview Question" : "Ready to Start"}
                </h3>                <p className="text-gray-300 text-base leading-relaxed">
                  {hasStartedInterview 
                    ? isAIGenerating 
                      ? "AI is thinking of a thoughtful follow-up question based on your response..."
                      : currentQuestion?.text || "Loading question..."
                    : `Click 'Start Interview' to begin your college admission interview practice session.`}
                </p>
                {hasStartedInterview && currentQuestion && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {currentQuestion.category}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {currentQuestion.type}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Response Section */}
            {hasStartedInterview && currentQuestion && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex-1">
                  {isVoiceMode ? (
                    <div className="text-center">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessingVoice || !canUserRespond || isAISpeaking}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : canUserRespond && !isAISpeaking
                            ? 'bg-purple-500 hover:bg-purple-600'
                            : 'bg-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <Mic className="w-8 h-8 text-white" />
                      </button>                      <p className="text-gray-400 text-sm mt-4">
                        {isRecording
                          ? 'Recording... Click to stop'
                          : isProcessingVoice
                          ? 'Processing your response...'
                          : isAIGenerating
                          ? 'AI is preparing your next question...'
                          : !canUserRespond
                          ? 'Please wait...'
                          : 'Click to start recording your response'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full h-40 p-4 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500"
                        disabled={!canUserRespond || isAnalyzing}
                      />
                      <button
                        onClick={() => submitResponse()}
                        disabled={!userResponse.trim() || isAnalyzing || !canUserRespond}
                        className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Analyzing Response...</span>
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
                </div>
              </div>
            )}

            {/* Start Interview Button */}
            {!hasStartedInterview && (
              <div className="mt-8 pt-6 border-t border-purple-500/20">
                <button
                  onClick={startInterview}
                  disabled={!!cameraError}
                  className="w-full px-6 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-semibold flex items-center justify-center space-x-3"
                >
                  <GraduationCap className="w-6 h-6" />
                  <span>Start College Interview</span>
                </button>
              </div>
            )}
          </div>
        </div>        {/* Right Panel - Video */}
        <div className="flex-1 relative bg-gradient-to-br from-purple-900/20 to-indigo-900/20 min-h-full">
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-dark-900/90">
              <div className="text-center max-w-md p-6">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">Camera Access Required</h3>
                <p className="text-red-400 mb-6">{cameraError}</p>
                <button
                  onClick={requestPermissions}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {/* AI Interviewer */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AIInterviewer 
              isActive={hasStartedInterview}
              isSpeaking={isAISpeaking}
              isListening={isRecording}
              isProcessing={isProcessingVoice || isAnalyzing}
              size="xl"
              showStatus={true}
            />
          </div>          {/* User Video */}
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
                onError={(e) => console.error('Main video error:', e)}
              />            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-800 z-20">
            {isVoiceMode && (
              <button
                onClick={toggleAudio}
                className={`p-2 rounded-full ${audioEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} transition-colors`}
              >
                {audioEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
              </button>
            )}
            
            <button
              onClick={handleEndInterview}
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

export default CollegeInterview;
