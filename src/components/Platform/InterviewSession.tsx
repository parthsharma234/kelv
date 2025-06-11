import React, { useState, useEffect, useRef } from 'react';
import { Clock, MessageSquare, CheckCircle, Play, Pause, Mic, MicOff, Video, VideoOff, Phone, AlertCircle, Settings, ArrowLeft, Brain, Sparkles } from 'lucide-react';
import { InterviewSetup, Question, InterviewSession as IInterviewSession, InterviewResponse, AIInterviewerState } from '../../types/interview';
import { generateInterviewQuestions, analyzeResponse, generateNextQuestion, synthesizeSpeech } from '../../utils/openai';

interface InterviewSessionProps {
  setup: InterviewSetup;
  onComplete: (sessionData: any) => void;
  onBack: () => void;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({ setup, onComplete, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [session, setSession] = useState<IInterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [pandaAnimation, setPandaAnimation] = useState('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isVideoElementReady, setIsVideoElementReady] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [aiState, setAiState] = useState<AIInterviewerState>({
    currentPersonality: 'friendly',
    adaptationLevel: 5,
    questionFlow: 'adaptive',
    focusAreas: []
  });
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  useEffect(() => {
    initializeSession();
    return () => {
      stopPreviewCamera();
      stopCamera();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session?.isActive && hasStartedInterview) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.isActive, hasStartedInterview]);

  useEffect(() => {
    if (hasStartedInterview) {
      // Animate panda periodically during interview
      const interval = setInterval(() => {
        setPandaAnimation(prev => prev === 'idle' ? 'talking' : 'idle');
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [hasStartedInterview]);

  useEffect(() => {
    const currentVideoRef = hasStartedInterview ? videoRef : previewVideoRef;
    if (currentVideoRef.current) {
      setIsVideoElementReady(true);
    }
    return () => {
      setIsVideoElementReady(false);
    };
  }, [hasStartedInterview]);

  useEffect(() => {
    const currentVideoRef = hasStartedInterview ? videoRef : previewVideoRef;
    const currentStream = hasStartedInterview ? stream : previewStream;

    if (currentVideoRef.current && currentStream && isVideoElementReady) {
      currentVideoRef.current.srcObject = currentStream;
      currentVideoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        setCameraError('Error playing video stream. Please check your browser settings.');
      });
    }

    return () => {
      if (currentVideoRef.current) {
        currentVideoRef.current.srcObject = null;
      }
    };
  }, [stream, previewStream, hasStartedInterview, isVideoElementReady]);

  const requestPermissions = async () => {
    setIsRequestingPermission(true);
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
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
          setCameraError('Camera and microphone access denied. Please enable permissions in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera or microphone found. Please connect a camera and microphone to continue.');
        } else {
          setCameraError('Unable to access camera and microphone. Please check your device settings.');
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
  };

  const startInterview = async () => {
    try {
      setCameraError(null);
      let mediaStream = previewStream;
      if (!mediaStream) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Error playing main video:', playError);
        }
      }
      
      setHasStartedInterview(true);
      if (session) {
        setSession({ ...session, isActive: true });
        if (session.questions.length > 0) {
          await playQuestion(session.questions[0].text);
        }
      }
      
      stopPreviewCamera();
    } catch (error) {
      console.error('Error starting interview:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
          setCameraError('Camera and microphone access denied. Please enable permissions in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera or microphone found. Please connect a camera and microphone to continue.');
        } else {
          setCameraError('Unable to access camera and microphone. Please check your device settings.');
        }
      }
    }
  };

  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    const currentStream = hasStartedInterview ? stream : previewStream;
    if (!currentStream) return;

    if (isVideoOn) {
      currentStream.getVideoTracks().forEach(track => {
        track.enabled = false;
      });
      setIsVideoOn(false);
    } else {
      try {
        const videoTracks = currentStream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks.forEach(track => {
            track.enabled = true;
          });
          setIsVideoOn(true);
        } else {
          const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (hasStartedInterview) {
            setStream(newVideoStream);
          } else {
            setPreviewStream(newVideoStream);
          }
          setIsVideoOn(true);
        }
      } catch (error) {
        console.error('Error turning video back on:', error);
        setCameraError('Error accessing camera. Please check your browser settings.');
      }
    }
  };

  const initializeSession = async () => {
    setIsLoading(true);
    try {
      const questions = await generateInterviewQuestions(setup);
      const newSession: IInterviewSession = {
        id: Date.now().toString(),
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
        }
      };
      setSession(newSession);
    } catch (error) {
      console.error('Error initializing session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const playQuestion = async (questionText: string) => {
    try {
      setIsPlaying(true);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audio = await synthesizeSpeech(questionText);
      if (audio) {
        setCurrentAudio(audio);
        audio.play();
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
        };
      } else {
        setTimeout(() => {
          setIsPlaying(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error playing question:', error);
      setIsPlaying(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!session || !userResponse.trim()) return;

    setIsAnalyzing(true);
    try {
      const currentQuestion = session.questions[session.currentQuestionIndex];
      const analysisResult = await analyzeResponse(currentQuestion, userResponse, setup, responses);
      setAnalysis(analysisResult);
      setShowFeedback(true);

      const newResponse: InterviewResponse = {
        questionId: currentQuestion.id,
        response: userResponse,
        analysis: analysisResult,
        timestamp: new Date()
      };
      
      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);

      // Update AI state based on analysis
      const updatedAiState = {
        ...aiState,
        adaptationLevel: analysisResult.adaptiveInsights?.confidenceLevel || aiState.adaptationLevel,
        focusAreas: analysisResult.adaptiveInsights?.suggestedFocus || aiState.focusAreas
      };
      setAiState(updatedAiState);

      // Update session adaptive state
      if (session) {
        setSession({
          ...session,
          responses: updatedResponses,
          adaptiveState: {
            ...session.adaptiveState,
            confidenceLevel: analysisResult.adaptiveInsights?.confidenceLevel || session.adaptiveState.confidenceLevel,
            performanceLevel: analysisResult.adaptiveInsights?.performanceLevel || session.adaptiveState.performanceLevel,
            strugglingAreas: analysisResult.adaptiveInsights?.suggestedFocus || session.adaptiveState.strugglingAreas
          }
        });
      }

    } catch (error) {
      console.error('Error analyzing response:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const moveToNextQuestion = async () => {
    if (!session) return;

    setIsGeneratingQuestion(true);
    
    try {
      // Generate next question dynamically based on performance
      const nextQuestion = await generateNextQuestion(setup, responses, aiState, analysis?.nextQuestionType);
      
      const updatedQuestions = [...session.questions, nextQuestion];
      const nextIndex = session.currentQuestionIndex + 1;
      
      setSession({
        ...session,
        questions: updatedQuestions,
        currentQuestionIndex: nextIndex
      });
      
      setUserResponse('');
      setAnalysis(null);
      setShowFeedback(false);
      
      // Play the new question
      await playQuestion(nextQuestion.text);
      
    } catch (error) {
      console.error('Error generating next question:', error);
      // Fallback to completing interview if question generation fails
      completeInterview();
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const completeInterview = () => {
    if (!session) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    const overallScore = responses.length > 0 
      ? Math.round(responses.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / responses.length)
      : 0;

    const sessionData = {
      ...session,
      endTime,
      duration,
      overallScore,
      responses,
      isActive: false
    };

    // Save to localStorage
    const existingHistory = JSON.parse(localStorage.getItem('kelv-interview-history') || '[]');
    const historyEntry = {
      id: session.id,
      date: session.startTime,
      setup: session.setup,
      overallScore,
      duration,
      questionsAnswered: responses.length,
      status: 'completed'
    };
    
    existingHistory.push(historyEntry);
    localStorage.setItem('kelv-interview-history', JSON.stringify(existingHistory));

    stopCamera();
    stopPreviewCamera();
    onComplete(sessionData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    stopCamera();
    stopPreviewCamera();
    onBack();
  };

  const retryCamera = () => {
    setCameraError(null);
    requestPermissions();
  };

  // Permission request screen
  if (!permissionGranted && !cameraError) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center pt-24">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#FF5722]/20 to-[#FF7043]/20 rounded-3xl flex items-center justify-center">
            <Video className="w-12 h-12 text-[#FF5722]" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Camera & Microphone Access</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            To conduct your AI-powered mock interview, we need access to your camera and microphone. 
            This allows us to simulate a real interview experience with dynamic question adaptation.
          </p>
          
          <div className="bg-gray-900/50 rounded-xl p-6 mb-8 border border-[#FF5722]/20">
            <h3 className="text-white font-semibold mb-3 flex items-center justify-center">
              <Settings className="w-5 h-5 mr-2 text-[#FF5722]" />
              AI Features:
            </h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-center">
                <Brain className="w-4 h-4 mr-3 text-[#FF5722]" />
                Dynamic question generation with GPT-4o
              </li>
              <li className="flex items-center">
                <Sparkles className="w-4 h-4 mr-3 text-[#FF5722]" />
                Adaptive difficulty based on your responses
              </li>
              <li className="flex items-center">
                <Video className="w-4 h-4 mr-3 text-[#FF5722]" />
                Real-time performance analysis
              </li>
            </ul>
          </div>

          <button
            onClick={requestPermissions}
            disabled={isRequestingPermission}
            className="px-8 py-4 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            {isRequestingPermission ? 'Requesting Access...' : 'Start AI Interview'}
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            Your privacy is important. We don't record or store any video or audio.
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
          <p className="text-gray-300 text-lg">Initializing AI interviewer...</p>
          <p className="text-gray-500 text-sm mt-2">Generating personalized questions with GPT-4o</p>
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

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const progress = responses.length > 0 ? (responses.length / (responses.length + 1)) * 100 : 0;

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
          <span className="text-white font-medium">AI Dynamic Interview</span>
          {hasStartedInterview && (
            <div className="px-2 py-1 bg-[#FF5722]/20 rounded text-[#FF5722] text-xs font-medium border border-[#FF5722]/30">
              ADAPTIVE
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
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-400">
                  {aiState.currentPersonality} • {responses.length} responses
                </span>
              </div>
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
                  {hasStartedInterview ? "AI Interview Question" : "Ready to Start"}
                </h3>
                <p className="text-gray-300 text-base leading-relaxed">
                  {hasStartedInterview 
                    ? currentQuestion?.text || "Generating next question..."
                    : "Click 'Start AI Interview' to begin your personalized mock interview with dynamic question adaptation"}
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
            {hasStartedInterview && !showFeedback && currentQuestion && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex-1">
                  <textarea
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-[#FF5722] focus:outline-none transition-colors resize-none"
                  />
                </div>
                
                <button
                  onClick={handleSubmitResponse}
                  disabled={!userResponse.trim() || isAnalyzing}
                  className="w-full px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AI Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Submit for AI Analysis</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Feedback section */}
            {hasStartedInterview && showFeedback && analysis && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-[#FF5722]/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4 text-orange-400" />
                      AI Analysis
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Score:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        analysis.score >= 8
                          ? 'bg-green-500/20 text-green-400'
                          : analysis.score >= 6
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {analysis.score}/10
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">AI Feedback</h5>
                      <p className="text-white text-sm leading-relaxed">{analysis.feedback}</p>
                    </div>
                    
                    {analysis.confidenceIndicators && (
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400">Confidence:</span>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(analysis.confidenceIndicators.enthusiasm || 5) * 10}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Structure:</span>
                          <span className={`ml-2 ${analysis.confidenceIndicators.structuredAnswer ? 'text-green-400' : 'text-orange-400'}`}>
                            {analysis.confidenceIndicators.structuredAnswer ? 'Good' : 'Improve'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Strengths</h5>
                      <ul className="space-y-1">
                        {analysis.strengths?.map((strength: string, index: number) => (
                          <li key={index} className="flex items-center text-sm text-green-400">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Areas for Improvement</h5>
                      <ul className="space-y-1">
                        {analysis.areasForImprovement?.map((area: string, index: number) => (
                          <li key={index} className="flex items-center text-sm text-orange-400">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={moveToNextQuestion}
                  disabled={isGeneratingQuestion}
                  className="w-full px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium flex items-center justify-center space-x-2"
                >
                  {isGeneratingQuestion ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Next Question...</span>
                    </>
                  ) : responses.length >= 5 ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Complete Interview</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Next AI Question</span>
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
                  <span>Start AI Interview</span>
                </button>
              </div>
            )}

            {/* Repeat question button */}
            {hasStartedInterview && !showFeedback && currentQuestion && (
              <div className="mt-8 pt-6 border-t border-[#FF5722]/20">
                <button
                  onClick={() => playQuestion(currentQuestion.text)}
                  disabled={isPlaying}
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
            <div className="relative w-96 h-96">
              <div className={`absolute inset-0 bg-gradient-to-br from-[#FF5722]/20 to-[#FF7043]/20 rounded-3xl transform transition-transform duration-500 ${
                pandaAnimation === 'talking' ? 'scale-105' : 'scale-100'
              }`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 bg-[#FF5722] rounded-full flex items-center justify-center relative">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
                      <div className="w-24 h-24 bg-[#FF5722] rounded-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                          <Brain className="w-8 h-8 text-[#FF5722]" />
                        </div>
                      </div>
                    </div>
                    {/* AI indicator */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Status indicator */}
              {hasStartedInterview && (
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-full text-center">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-[#FF5722] rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-[#FF7043] rounded-full animate-bounce delay-100"></div>
                      <div className="w-3 h-3 bg-[#D84315] rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-[#FF5722] text-lg font-medium">
                      {isGeneratingQuestion ? 'Generating Question...' : 
                       isAnalyzing ? 'Analyzing Response...' :
                       isPlaying ? 'Speaking...' : 'Listening...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User video - picture in picture style */}
          <div className="absolute bottom-6 right-6 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 z-10">
            {!hasStartedInterview ? (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : isVideoOn ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Main video error:', e);
                  setCameraError('Error playing video stream. Please check your browser settings.');
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Camera controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-800 z-20">
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
            
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full transition-colors ${
                !isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {isVideoOn ? (
                <Video className="w-5 h-5 text-gray-400" />
              ) : (
                <VideoOff className="w-5 h-5 text-white" />
              )}
            </button>
            
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