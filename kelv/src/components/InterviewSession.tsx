import React, { useState, useEffect, useRef } from 'react';
import { Clock, MessageSquare, CheckCircle, Play, Pause, Mic, MicOff, Video, VideoOff, Phone, MoreVertical, AlertCircle, Settings } from 'lucide-react';
import { InterviewSetup, Question, InterviewSession as IInterviewSession } from '../types/interview';
import { generateInterviewQuestions, synthesizeSpeech, analyzeResponse } from '../utils/openai';

interface InterviewSessionProps {
  setup: InterviewSetup;
  onComplete: () => void;
  onEndCall: () => void;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({ setup, onComplete, onEndCall }) => {
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
  const [analysis, setAnalysis] = useState<{
    score: number;
    feedback: string;
    followUpQuestion: string;
    strengths: string[];
    areasForImprovement: string[];
  } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

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
      // Use existing preview stream or get new one
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
        // IMPORTANT: Call play() after setting srcObject
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Error playing main video:', playError);
        }
      }
      
      setHasStartedInterview(true);
      if (session) {
        setSession({ ...session, isActive: true });
        // Simulate playing first question (no actual audio in UI mode)
        if (session.questions.length > 0) {
          await playQuestion(session.questions[0].text);
        }
      }
      
      // Stop preview stream since we're now using main stream
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
      // Turn OFF video by disabling video tracks
      currentStream.getVideoTracks().forEach(track => {
        console.log('Disabling video track:', track.label);
        track.enabled = false;
      });
      setIsVideoOn(false);
    } else {
      // Turn ON video by re-enabling video tracks
      try {
        const videoTracks = currentStream.getVideoTracks();
        if (videoTracks.length > 0) {
          // If we have existing tracks, just re-enable them
          videoTracks.forEach(track => {
            console.log('Re-enabling video track:', track.label);
            track.enabled = true;
          });
          setIsVideoOn(true);
        } else {
          // If no tracks exist, get a new video stream
          const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('New video stream obtained:', newVideoStream.getVideoTracks()[0].label);
          
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
        setup,
        questions,
        currentQuestionIndex: 0,
        isActive: false,
        startTime: new Date()
      };
      setSession(newSession);
    } catch (error) {
      console.error('Error initializing session:', error);
      throw error; // Let the error propagate to show error UI
    } finally {
      setIsLoading(false);
    }
  };

  const playQuestion = async (questionText: string) => {
    try {
      setIsPlaying(true);
      // Stop any existing audio
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
        // Fallback to simulated delay if speech synthesis fails
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
      const analysisResult = await analyzeResponse(currentQuestion, userResponse, setup);
      setAnalysis(analysisResult);
      setShowFeedback(true);

      // If there's a follow-up question, add it to the session
      if (analysisResult.followUpQuestion) {
        const followUpQuestion: Question = {
          id: `${currentQuestion.id}-followup`,
          text: analysisResult.followUpQuestion,
          type: currentQuestion.type
        };

        const updatedQuestions = [...session.questions];
        updatedQuestions.splice(session.currentQuestionIndex + 1, 0, followUpQuestion);
        setSession({
          ...session,
          questions: updatedQuestions
        });
      }
    } catch (error) {
      console.error('Error analyzing response:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const moveToNextQuestion = () => {
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex < session.questions.length) {
      setSession({
        ...session,
        currentQuestionIndex: nextIndex
      });
      setUserResponse('');
      setAnalysis(null);
      setShowFeedback(false);
      playQuestion(session.questions[nextIndex].text);
    } else {
      // End of interview
      setSession({
        ...session,
        isActive: false
      });
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
    onEndCall();
  };

  const retryCamera = () => {
    setCameraError(null);
    requestPermissions();
  };

  // Permission request screen
  if (!permissionGranted && !cameraError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#FF5722]/20 to-[#FF7043]/20 rounded-3xl flex items-center justify-center">
            <Video className="w-12 h-12 text-[#FF5722]" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Camera & Microphone Access</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            To conduct your mock interview, we need access to your camera and microphone. 
            This allows us to simulate a real interview experience.
          </p>
          
          <div className="bg-gray-900/50 rounded-xl p-6 mb-8 border border-[#FF5722]/20">
            <h3 className="text-white font-semibold mb-3 flex items-center justify-center">
              <Settings className="w-5 h-5 mr-2 text-[#FF5722]" />
              What we'll use:
            </h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-center">
                <Video className="w-4 h-4 mr-3 text-[#FF5722]" />
                Camera for video interview simulation
              </li>
              <li className="flex items-center">
                <Mic className="w-4 h-4 mr-3 text-[#FF5722]" />
                Microphone for voice interaction
              </li>
            </ul>
          </div>

          <button
            onClick={requestPermissions}
            disabled={isRequestingPermission}
            className="px-8 py-4 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            {isRequestingPermission ? 'Requesting Access...' : 'Grant Camera & Microphone Access'}
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            Your privacy is important. We don't record or store any video or audio.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-800 border-t-[#FF5722] mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Preparing interview questions...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-400 text-lg">Error loading interview session</p>
      </div>
    );
  }

  if (session.isActive === false && hasStartedInterview) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-[#FF5722] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Interview Complete!</h2>
          <p className="text-gray-400 mb-6">Great job completing your mock interview.</p>
          
          <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-[#FF5722]/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <span className="text-gray-400 block mb-1">Duration:</span>
                <p className="font-bold text-xl text-[#FF5722]">{formatTime(timeElapsed)}</p>
              </div>
              <div className="text-center">
                <span className="text-gray-400 block mb-1">Questions:</span>
                <p className="font-bold text-xl text-[#FF5722]">{session.questions.length}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors font-medium"
          >
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-[#FF5722] rounded-full animate-pulse"></div>
          <span className="text-white font-medium">AI Mock Interview</span>
          {hasStartedInterview && (
            <div className="px-2 py-1 bg-[#FF5722]/20 rounded text-[#FF5722] text-xs font-medium border border-[#FF5722]/30">
              LIVE
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
              <div className="w-32 bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-[#FF5722] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
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
                  {hasStartedInterview ? "Interview Question" : "Ready to Start"}
                </h3>
                <p className="text-gray-300 text-base leading-relaxed">
                  {hasStartedInterview 
                    ? currentQuestion.text 
                    : "Click 'Start Interview' to begin your mock interview session"}
                </p>
                {hasStartedInterview && (
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentQuestion.type === 'behavioral'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : currentQuestion.type === 'technical'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Response input section */}
            {hasStartedInterview && !showFeedback && (
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
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Response</span>
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
                    <h4 className="text-white font-semibold">Response Analysis</h4>
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
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Feedback</h5>
                      <p className="text-white text-sm leading-relaxed">{analysis.feedback}</p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Strengths</h5>
                      <ul className="space-y-1">
                        {analysis.strengths.map((strength, index) => (
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
                        {analysis.areasForImprovement.map((area, index) => (
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
                  className="w-full px-6 py-3 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] transition-colors text-base font-medium"
                >
                  {session.currentQuestionIndex < session.questions.length - 1
                    ? "Next Question"
                    : "Complete Interview"}
                </button>
              </div>
            )}

            {/* Start interview button */}
            {!hasStartedInterview && (
              <div className="mt-8 pt-6 border-t border-[#FF5722]/20">
                <button
                  onClick={startInterview}
                  disabled={!!cameraError}
                  className="w-full px-6 py-4 bg-[#FF5722] text-white rounded-lg hover:bg-[#D84315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-semibold"
                >
                  Start Interview
                </button>
              </div>
            )}

            {/* Repeat question button */}
            {hasStartedInterview && !showFeedback && (
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
            {/* AI Interviewer (Red Panda) */}
            <div className="relative w-96 h-96">
              <div className={`absolute inset-0 bg-gradient-to-br from-[#FF5722]/20 to-[#FF7043]/20 rounded-3xl transform transition-transform duration-500 ${
                pandaAnimation === 'talking' ? 'scale-105' : 'scale-100'
              }`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 bg-[#FF5722] rounded-full flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
                      <div className="w-24 h-24 bg-[#FF5722] rounded-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                          <div className="w-8 h-8 bg-[#FF5722] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Speaking indicator */}
              {hasStartedInterview && (
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-full text-center">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-[#FF5722] rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-[#FF7043] rounded-full animate-bounce delay-100"></div>
                      <div className="w-3 h-3 bg-[#D84315] rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-[#FF5722] text-lg font-medium">
                      {isPlaying ? 'Speaking...' : 'Listening...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User video - picture in picture style */}
          <div className="absolute bottom-6 right-6 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 z-10">
            {isVideoOn ? (
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
                onLoadedMetadata={() => console.log('Main video metadata loaded')}
                onPlaying={() => console.log('Main video started playing')}
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